'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, FileMeta, LineMessage, ChannelInfo, ReactionInfo } from './types'
import { WS_URL, API_BASE } from './room'

const TYPING_TIMEOUT = 2500
const TYPING_THROTTLE = 1200

let idCounter = 0
const nextId = () => `${Date.now()}-${idCounter++}`

function toLine(m: ChatMessage, me: string): LineMessage {
  return {
    id: nextId(),
    dbId: m.id,
    type: 'message',
    username: m.username,
    content: m.content ?? '',
    file: m.file,
    timestamp: m.timestamp,
    mine: m.username === me,
    replyTo: m.replyTo,
    replyToContent: m.replyToContent,
    replyToUsername: m.replyToUsername,
    reactions: m.reactions,
  }
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

  const wsRef = useRef<WebSocket | null>(null)
  const usernameRef = useRef(username)
  usernameRef.current = username
  const channelRef = useRef('')
  const lastTypingSent = useRef(0)
  const oldestDbId = useRef<number | null>(null)

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
    if (!username) return
    let stopped = false
    let retry = 0
    let reconnectTimer: ReturnType<typeof setTimeout>

    const handle = (m: ChatMessage) => {
      const me = usernameRef.current ?? ''
      switch (m.type) {
        case 'channels': {
          if (m.channels) setChannels(m.channels)
          if (!channelRef.current && m.channels && m.channels.length > 0) {
            channelRef.current = m.channels[0].name
            setActiveChannel(m.channels[0].name)
          }
          break
        }
        case 'channel_created': {
          if (m.channel) fetchChannels()
          break
        }
        case 'history': {
          if (!m.history) return
          const mapped = m.history.map((h) => toLine(h, me))
          setLines(mapped)
          setTyping({})
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
          break
        }
        case 'message': {
          if (!m.content && !m.file) return
          setLines((prev) => [...prev, toLine(m, me)])
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
        case 'join': {
          if (m.username === me) return
          setLines((prev) => [
            ...prev,
            { id: nextId(), type: 'system', username: m.username, content: 'เข้าร่วม', timestamp: m.timestamp, mine: false },
          ])
          break
        }
        case 'leave': {
          setLines((prev) => [
            ...prev,
            { id: nextId(), type: 'system', username: m.username, content: 'ออกจากห้อง', timestamp: m.timestamp, mine: false },
          ])
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
      }
    }

    const fetchChannels = () => {
      fetch(`${API_BASE}/channels`)
        .then((r) => r.json())
        .then((data) => {
          if (data.channels) setChannels(data.channels)
        })
        .catch(() => void 0)
    }

    const connect = () => {
      const ch = channelRef.current || 'นกพิราบ'
      const url = `${WS_URL}?username=${encodeURIComponent(username)}&channel=${encodeURIComponent(ch)}`
      const ws = new WebSocket(url)
      wsRef.current = ws
      setStatus('connecting')

      ws.onopen = () => {
        retry = 0
        setStatus('open')
        fetchChannels()
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
        setStatus('closed')
        if (stopped) return
        retry += 1
        const delay = Math.min(1000 * 2 ** retry, 8000)
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
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [username])

  const send = useCallback((content: string, file?: FileMeta, replyTo?: number) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const text = content.trim()
    if (!text && !file) return
    if (replyTo) {
      ws.send(JSON.stringify({ type: 'reply', content: text, file, replyTo }))
    } else {
      ws.send(JSON.stringify({ type: 'message', content: text, file }))
    }
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
    }
  }, [])

  const switchChannel = useCallback((name: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    if (name === channelRef.current) return
    channelRef.current = name
    setActiveChannel(name)
    ws.send(JSON.stringify({ type: 'channel_switch', content: name }))
  }, [])

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
      setLines((prev) => [...mapped, ...prev])
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
    send, sendTyping, toggleReaction,
    channels, activeChannel, switchChannel, createChannel,
  }
}
