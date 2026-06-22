import { WebSocket } from 'ws'
import type { ChatMessage, FileMeta } from '../types.js'
import {
  addClient, removeClient, broadcast, broadcastUsers, broadcastToAll, pingAll,
  type Client
} from './hub.js'
import {
  saveMessage, getRecentHistory, touchUser,
  getChannelByName, getChannelById, createChannel, getChannels,
  addReaction, removeReaction, getMessageChannelId, getReactionsForMessage, getReplyInfo
} from '../db/queries.js'

const IDLE_TIMEOUT_MS = 60_000
const MAX_CONTENT = 4000

export function handleConnection(ws: WebSocket, username: string, channelName: string): void {
  const channel = getChannelByName(channelName) ?? getChannelById(1)!
  const client: Client = { ws, username, alive: true, channelId: channel.id }
  addClient(client)
  touchUser(username)

  sendChannelList(ws)
  sendHistory(ws, channel.id)
  broadcast({ type: 'join', channel: channel.name, username, timestamp: new Date().toISOString() }, channel.id, client)
  broadcastUsers(channel.id)

  let idleTimer: NodeJS.Timeout | null = createIdleTimer(ws)

  ws.on('message', (raw) => {
    if (idleTimer) {
      clearTimeout(idleTimer)
      idleTimer = createIdleTimer(ws)
    }

    let msg: ChatMessage
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (msg.type === 'typing') {
      broadcast({ type: 'typing', username, timestamp: new Date().toISOString() }, client.channelId, client)
      return
    }

    if (msg.type === 'channel_switch') {
      const targetName = (msg.content ?? '').trim()
      if (!targetName) return
      const target = getChannelByName(targetName)
      if (!target) return

      const oldChannelId = client.channelId
      client.channelId = target.id

      broadcast({ type: 'leave', username, timestamp: new Date().toISOString() }, oldChannelId)
      broadcastUsers(oldChannelId)

      sendHistory(ws, target.id)
      broadcast({ type: 'join', channel: target.name, username, timestamp: new Date().toISOString() }, target.id, client)
      broadcastUsers(target.id)
      return
    }

    if (msg.type === 'create_channel') {
      const name = (msg.content ?? '').trim().slice(0, 50)
      if (!name) return
      const existing = getChannelByName(name)
      if (existing) {
        ws.send(JSON.stringify({ type: 'channel_created', channel: existing.name, timestamp: new Date().toISOString() }))
        return
      }
      const ch = createChannel(name)
      broadcastToAll({ type: 'channel_created', channel: ch.name, timestamp: new Date().toISOString() })
      sendChannelList(ws)
      return
    }

    if (msg.type === 'react' || msg.type === 'unreact') {
      const messageId = msg.replyTo ?? 0
      const emoji = msg.emoji ?? ''
      if (!messageId || !emoji) return

      const msgChannelId = getMessageChannelId(messageId)
      if (msgChannelId === null) return

      if (msg.type === 'react') {
        addReaction(messageId, username, emoji)
      } else {
        removeReaction(messageId, username, emoji)
      }

      const reactions = getReactionsForMessage(messageId)
      broadcast({
        type: 'reaction_update',
        id: messageId,
        username: '',
        timestamp: new Date().toISOString(),
        reactions,
      }, msgChannelId)
      return
    }

    if (msg.type !== 'message' && msg.type !== 'reply') return

    const content = (msg.content ?? '').trim().slice(0, MAX_CONTENT)
    const file = msg.file
    const replyTo = msg.type === 'reply' ? (msg.replyTo ?? null) : null
    if (!content && !file) return
    if (replyTo === null && msg.type === 'reply') return

    const timestamp = new Date().toISOString()
    const id = saveMessage(username, content, file, client.channelId, replyTo, timestamp)

    let replyToContent: string | undefined
    let replyToUsername: string | undefined
    if (replyTo) {
      const replyInfo = getReplyInfo(replyTo)
      if (replyInfo) {
        replyToContent = replyInfo.content
        replyToUsername = replyInfo.username
      }
    }

    const ch = getChannelById(client.channelId)
    const out: ChatMessage = {
      type: 'message',
      id,
      channel: ch?.name,
      username,
      content: content || undefined,
      file,
      timestamp,
      replyTo: replyTo ?? undefined,
      replyToContent,
      replyToUsername,
    }
    broadcast(out, client.channelId)
  })

  ws.on('pong', () => {
    client.alive = true
  })

  ws.on('close', cleanup)
  ws.on('error', cleanup)

  function cleanup() {
    if (idleTimer) clearTimeout(idleTimer)
    removeClient(client)
    broadcast({ type: 'leave', username, timestamp: new Date().toISOString() }, client.channelId)
    broadcastUsers(client.channelId)
  }
}

function sendHistory(ws: WebSocket, channelId: number): void {
  const history = getRecentHistory(channelId)
  const ch = getChannelById(channelId)
  ws.send(JSON.stringify({
    type: 'history',
    channel: ch?.name,
    username: '',
    timestamp: new Date().toISOString(),
    history,
  }))
}

function sendChannelList(ws: WebSocket): void {
  const channels = getChannels()
  ws.send(JSON.stringify({
    type: 'channels',
    username: '',
    timestamp: new Date().toISOString(),
    channels: channels.map((c) => ({ id: c.id, name: c.name, description: c.description })),
  }))
}

function createIdleTimer(ws: WebSocket): NodeJS.Timeout {
  return setTimeout(() => {
    try { ws.close() } catch { void 0 }
  }, IDLE_TIMEOUT_MS)
}

export function startHeartbeat(intervalMs = 30_000): NodeJS.Timeout {
  return setInterval(pingAll, intervalMs)
}
