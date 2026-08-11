'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, FileMeta, LineMessage, ChannelInfo, ReactionInfo } from './types'
import { WS_URL, API_BASE } from './room'
import { isSoundEnabled, sfx } from './sounds'
import { updateAvatarCache } from './avatar'
import { normalizeFileMeta } from './file-utils'
import { cacheLines, getCachedLines } from './client-cache'
import { decodeSfxSignal, encodeSfxSignal, type RemoteSfxItem } from './remote-sfx'

const TYPING_TIMEOUT = 2500
const TYPING_THROTTLE = 1200
const QUEUE_KEY_PREFIX = 'aura:send-queue:'

interface PendingMessage {
  id: string
  channel: string
  payload: { type: 'message' | 'reply'; content: string; file?: FileMeta; replyTo?: number }
  line: LineMessage
}

let idCounter = 0
const nextId = () => `${Date.now()}-${idCounter++}`

function toLine(m: ChatMessage, me: string): LineMessage {
  return {
    id: nextId(),
    dbId: m.id,
    type: 'message',
    username: m.username,
    content: m.content ?? '',
    file: normalizeFileMeta(m.file),
    timestamp: m.timestamp,
    mine: m.username === me,
    replyTo: m.replyTo,
    replyToContent: m.replyToContent,
    replyToUsername: m.replyToUsername,
    reactions: m.reactions,
  }
}

function mergeHistoryLines(current: LineMessage[], incoming: LineMessage[]): LineMessage[] {
  if (current.length === 0) return incoming
  const byDbId = new Map<number, LineMessage>()
  for (const line of current) {
    if (line.dbId) byDbId.set(line.dbId, line)
  }
  const merged = incoming.map((line) => {
    const existing = line.dbId ? byDbId.get(line.dbId) : undefined
    return existing ? { ...line, id: existing.id, queued: existing.queued } : line
  })
  const queued = current.filter((line) => line.queued)
  return queued.length ? [...merged, ...queued] : merged
}

export type ConnStatus = 'connecting' | 'open' | 'closed'

export function useChat(username: string | null) {
  const [lines, setLines] = useState<LineMessage[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [typing, setTyping] = useState<Record<string, number>>({})
  const [status, setStatus] = useState<ConnStatus>('connecting')
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [channels, setChannels] = useState<ChannelInfo[]>([])
  const [activeChannel, setActiveChannel] = useState<string>('')
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([])
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [loadingPins, setLoadingPins] = useState(true)
  const [queuedCount, setQueuedCount] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const usernameRef = useRef(username)
  usernameRef.current = username
  const channelRef = useRef('')
  const lastTypingSent = useRef(0)
  const oldestDbId = useRef<number | null>(null)
  const queueRef = useRef<PendingMessage[]>([])
  const hasConnectedRef = useRef(false)
  const statusGraceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persistQueue = useCallback((queue = queueRef.current) => {
    if (typeof window === 'undefined' || !usernameRef.current) return
    try { localStorage.setItem(`${QUEUE_KEY_PREFIX}${usernameRef.current}`, JSON.stringify(queue)) } catch { void 0 }
    setQueuedCount(queue.length)
  }, [])

  const loadQueue = useCallback((name: string) => {
    if (typeof window === 'undefined') return [] as PendingMessage[]
    try {
      const raw = localStorage.getItem(`${QUEUE_KEY_PREFIX}${name}`)
      return raw ? (JSON.parse(raw) as PendingMessage[]) : []
    } catch {
      return [] as PendingMessage[]
    }
  }, [])

  const flushQueue = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const currentChannel = channelRef.current || 'นกพิราบ'
    const remaining: PendingMessage[] = []
    const sentIds = new Set<string>()
    for (const item of queueRef.current) {
      if (item.channel !== currentChannel) {
        remaining.push(item)
        continue
      }
      ws.send(JSON.stringify(item.payload))
      sentIds.add(item.line.id)
    }
    if (sentIds.size > 0) {
      setLines((prev) => prev.filter((line) => !sentIds.has(line.id)))
    }
    queueRef.current = remaining
    persistQueue(remaining)
  }, [persistQueue])

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now()
      setTyping((prev) => {
        let changed = false
        const next: Record<string, number> = {}
        for (const [u, ts] of Object.entries(prev)) {
          if (now - ts < TYPING_TIMEOUT) next[u] = ts
          else changed = true
        }
        return changed ? next : prev
      })
    }, 800)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!username) {
      setLoadingChannels(false)
      setLoadingMessages(false)
      setLoadingPins(false)
      if (statusGraceTimer.current) clearTimeout(statusGraceTimer.current)
      hasConnectedRef.current = false
      return
    }
    setLoadingChannels(true)
    setLoadingMessages(true)
    setLoadingPins(true)
    hasConnectedRef.current = false
    queueRef.current = loadQueue(username)
    setQueuedCount(queueRef.current.length)
    let stopped = false
    let retry = 0
    let reconnectTimer: ReturnType<typeof setTimeout>

    const handle = (m: ChatMessage) => {
      const me = usernameRef.current ?? ''
      switch (m.type) {
        case 'channels': {
          if (m.channels) setChannels(m.channels)
          setLoadingChannels(false)
          if (!channelRef.current && m.channels && m.channels.length > 0) {
            const initialChannel = m.channels[0].name
            channelRef.current = initialChannel
            setActiveChannel(initialChannel)
            getCachedLines(initialChannel).then((cached) => {
              if (stopped || channelRef.current !== initialChannel || cached.length === 0) return
              setLines(cached)
              setLoadingMessages(false)
            })
          }
          break
        }
        case 'channel_created': {
          if (m.channel) fetchChannels()
          break
        }
        case 'history': {
          if (!m.history) return
          const mapped = m.history.filter((h) => !decodeSfxSignal(h.content)).map((h) => toLine(h, me))
          setLines((prev) => {
            const next = m.channel === channelRef.current ? mergeHistoryLines(prev, mapped) : mapped
            if (m.channel) cacheLines(m.channel, next)
            return next
          })
          setTyping({})
          if (m.pins) setPinnedMessages(m.pins.map((p) => ({ ...p, file: normalizeFileMeta(p.file) })))
          setLoadingPins(false)
          if (mapped.length > 0) {
            oldestDbId.current = mapped[0].dbId ?? null
            setHasMore(mapped.length >= 50)
          } else {
            setHasMore(false)
          }
          if (m.channel) {
            channelRef.current = m.channel
            setActiveChannel(m.channel)
          }
          setLoadingMessages(false)
          break
        }
        case 'message': {
          const sfxSignal = decodeSfxSignal(m.content)
          if (sfxSignal) {
            if (m.username !== me) sfx.remote(sfxSignal.url)
            return
          }
          if (!m.content && !m.file) return
          setLines((prev) => {
            const next = [...prev, toLine(m, me)]
            cacheLines(channelRef.current, next)
            return next
          })
          if (m.username !== me) sfx.receive()
          setTyping((prev) => {
            if (!prev[m.username]) return prev
            const next = { ...prev }
            delete next[m.username]
            return next
          })
          break
        }
        case 'reaction_update': {
          if (!m.id || !m.reactions) return
          setLines((prev) => prev.map((l) =>
            l.dbId === m.id ? { ...l, reactions: m.reactions } : l
          ))
          break
        }
        case 'pins_update': {
          if (m.pins) setPinnedMessages(m.pins.map((p) => ({ ...p, file: normalizeFileMeta(p.file) })))
          setLoadingPins(false)
          break
        }
        case 'join':
        case 'leave': {
          break
        }
        case 'users': {
          setUsers(m.users ?? [])
          break
        }
        case 'typing': {
          if (m.username === me) return
          setTyping((prev) => ({ ...prev, [m.username]: Date.now() }))
          break
        }
        case 'avatar_update': {
          updateAvatarCache(m.username, m.avatar ?? null)
          break
        }
        case 'sfx': {
          if (m.username === me || !m.sfx?.url) return
          sfx.remote(m.sfx.url)
          break
        }
      }
    }

    const fetchChannels = () => {
      fetch(`${API_BASE}/channels`)
        .then((r) => r.json())
        .then((data) => {
          if (data.channels) setChannels(data.channels)
        })
        .catch(() => void 0)
        .finally(() => setLoadingChannels(false))
    }

    const connect = () => {
      const ch = channelRef.current || 'นกพิราบ'
      const url = `${WS_URL}?username=${encodeURIComponent(username)}&channel=${encodeURIComponent(ch)}`
      const ws = new WebSocket(url)
      wsRef.current = ws
      if (!hasConnectedRef.current) setStatus('connecting')

      ws.onopen = () => {
        retry = 0
        hasConnectedRef.current = true
        if (statusGraceTimer.current) {
          clearTimeout(statusGraceTimer.current)
          statusGraceTimer.current = null
        }
        setStatus('open')
        fetchChannels()
        flushQueue()
      }
      ws.onmessage = (ev) => {
        let m: ChatMessage
        try {
          m = JSON.parse(ev.data)
        } catch {
          return
        }
        handle(m)
      }
      ws.onclose = () => {
        if (stopped) return
        if (statusGraceTimer.current) clearTimeout(statusGraceTimer.current)
        statusGraceTimer.current = setTimeout(() => {
          setStatus('closed')
          statusGraceTimer.current = null
        }, hasConnectedRef.current ? 1800 : 0)
        retry += 1
        const delay = hasConnectedRef.current ? Math.min(350 * 2 ** Math.min(retry, 4), 4000) : Math.min(1000 * 2 ** retry, 8000)
        reconnectTimer = setTimeout(connect, delay)
      }
      ws.onerror = () => {
        try { ws.close() } catch { void 0 }
      }
    }

    connect()
    return () => {
      stopped = true
      clearTimeout(reconnectTimer)
      if (statusGraceTimer.current) {
        clearTimeout(statusGraceTimer.current)
        statusGraceTimer.current = null
      }
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [username, loadQueue, flushQueue])

  const send = useCallback((content: string, file?: FileMeta, replyTo?: number) => {
    const text = content.trim()
    if (!text && !file) return
    const ws = wsRef.current
    const payload: PendingMessage['payload'] = replyTo
      ? { type: 'reply', content: text, file, replyTo }
      : { type: 'message', content: text, file }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload))
      sfx.send()
      return
    }

    const queuedLine: LineMessage = {
      id: `queued-${nextId()}`,
      type: 'message',
      username: usernameRef.current ?? '',
      content: text,
      file,
      timestamp: new Date().toISOString(),
      mine: true,
      replyTo,
      queued: true,
    }
    const item: PendingMessage = {
      id: queuedLine.id,
      channel: channelRef.current || 'นกพิราบ',
      payload,
      line: queuedLine,
    }
    queueRef.current = [...queueRef.current, item]
    persistQueue()
    setLines((prev) => [...prev, queuedLine])
    sfx.send()
  }, [persistQueue])

  const sendSfx = useCallback((item: RemoteSfxItem) => {
    if (!isSoundEnabled()) return false
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    const played = sfx.remote(item.url)
    if (!played) return false
    ws.send(JSON.stringify({
      type: 'message',
      content: encodeSfxSignal(item),
    }))
    return true
  }, [])

  const sendTyping = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const now = Date.now()
    if (now - lastTypingSent.current < TYPING_THROTTLE) return
    lastTypingSent.current = now
    ws.send(JSON.stringify({ type: 'typing' }))
  }, [])

  const toggleReaction = useCallback((messageId: number, emoji: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const me = usernameRef.current ?? ''
    let hasReaction = false
    setLines((prev) => {
      const line = prev.find((l) => l.dbId === messageId)
      if (line?.reactions) {
        const r = line.reactions.find((rx) => rx.emoji === emoji)
        if (r && r.users.includes(me)) hasReaction = true
      }
      return prev
    })
    if (hasReaction) {
      ws.send(JSON.stringify({ type: 'unreact', replyTo: messageId, emoji }))
    } else {
      ws.send(JSON.stringify({ type: 'react', replyTo: messageId, emoji }))
      sfx.react()
    }
  }, [])

  const togglePin = useCallback((messageId: number) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const isPinned = pinnedMessages.some((p) => p.id === messageId)
    if (isPinned) {
      ws.send(JSON.stringify({ type: 'unpin', replyTo: messageId }))
    } else {
      ws.send(JSON.stringify({ type: 'pin', replyTo: messageId }))
      sfx.pin()
    }
  }, [pinnedMessages])

  const loadPinnedMessages = useCallback(async () => {
    const channel = channelRef.current
    if (!channel) return
    setLoadingPins(true)
    try {
      const res = await fetch(`${API_BASE}/pins/${encodeURIComponent(channel)}`)
      if (!res.ok) return
      const data = await res.json()
      setPinnedMessages(((data.pins ?? []) as ChatMessage[]).map((p) => ({ ...p, file: normalizeFileMeta(p.file) })))
    } catch {
      void 0
    } finally {
      setLoadingPins(false)
    }
  }, [])

  const switchChannel = useCallback((name: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    if (name === channelRef.current) return
    setLoadingMessages(true)
    setLoadingPins(true)
    setPinnedMessages([])
    channelRef.current = name
    setActiveChannel(name)
    getCachedLines(name).then((cached) => {
      if (channelRef.current !== name || cached.length === 0) return
      setLines(cached)
      setLoadingMessages(false)
    })
    ws.send(JSON.stringify({ type: 'channel_switch', content: name }))
    flushQueue()
  }, [flushQueue])

  const createChannel = useCallback((name: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'create_channel', content: name }))
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !oldestDbId.current || !channelRef.current) return
    setLoadingMore(true)
    try {
      const res = await fetch(`${API_BASE}/history?channel=${encodeURIComponent(channelRef.current)}&before=${oldestDbId.current}`)
      if (!res.ok) return
      const data = await res.json()
      const me = usernameRef.current ?? ''
      const older = (data.messages ?? []) as ChatMessage[]
      if (older.length === 0) {
        setHasMore(false)
        return
      }
      const mapped = older.map((h) => toLine(h, me))
      setLines((prev) => {
        const next = [...mapped, ...prev]
        cacheLines(channelRef.current, next)
        return next
      })
      oldestDbId.current = mapped[0]?.dbId ?? oldestDbId.current
      setHasMore(older.length >= 50)
    } catch {
      void 0
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore])

  return {
    lines, users, typing, status, hasMore, loadingMore, loadMore,
    send, sendTyping, sendSfx, toggleReaction, togglePin,
    channels, activeChannel, switchChannel, createChannel,
    pinnedMessages, loadPinnedMessages,
    loadingChannels, loadingMessages, loadingPins,
    queuedCount,
  }
}
