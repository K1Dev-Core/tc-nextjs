import { WebSocket } from 'ws'
import type { ChatMessage, FileMeta } from '../types.js'
import {
  addClient, removeClient, broadcast, broadcastUsers, broadcastToAll, pingAll,
  hasUserInChannel,
  type Client
} from './hub.js'
import {
  saveMessage, getRecentHistory, touchUser,
  getChannelByName, getChannelById, createChannel, getChannels,
  addReaction, removeReaction, getMessageChannelId, getReactionsForMessage, getReplyInfo,
  pinMessage, unpinMessage, getPinnedMessages
} from '../db/queries.js'

const MAX_CONTENT = 4000
const SFX_COOLDOWN_MS = 60_000
const SFX_URL_PREFIX = '/sfx/'

export function handleConnection(ws: WebSocket, username: string, channelName: string): void {
  const channel = getChannelByName(channelName) ?? getChannelById(1)!
  const client: Client = { ws, username, alive: true, channelId: channel.id }
  const alreadyPresent = hasUserInChannel(username, channel.id)
  addClient(client)
  touchUser(username)

  sendChannelList(ws)
  sendHistory(ws, channel.id)
  if (!alreadyPresent) {
    broadcast({ type: 'join', channel: channel.name, username, timestamp: new Date().toISOString() }, channel.id, client)
  }
  broadcastUsers(channel.id)

  ws.on('message', (raw) => {
    client.alive = true
    client.missedPongs = 0
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

    if (msg.type === 'sfx') {
      const now = Date.now()
      if (client.lastSfxAt && now - client.lastSfxAt < SFX_COOLDOWN_MS) return
      const item = msg.sfx
      if (!item?.id || !item.name || !item.url) return
      if (!item.url.startsWith(SFX_URL_PREFIX) || item.url.includes('..')) return
      client.lastSfxAt = now
      broadcast({
        type: 'sfx',
        username,
        timestamp: new Date().toISOString(),
        sfx: {
          id: String(item.id).slice(0, 60),
          name: String(item.name).slice(0, 80),
          url: item.url.slice(0, 300),
        },
      }, client.channelId, client)
      return
    }

    if (msg.type === 'channel_switch') {
      const targetName = (msg.content ?? '').trim()
      if (!targetName) return
      const target = getChannelByName(targetName)
      if (!target) return

      const oldChannelId = client.channelId
      const remainsInOldChannel = hasUserInChannel(username, oldChannelId, client)
      const alreadyInTargetChannel = hasUserInChannel(username, target.id, client)
      client.channelId = target.id

      if (!remainsInOldChannel) {
        broadcast({ type: 'leave', username, timestamp: new Date().toISOString() }, oldChannelId)
      }
      broadcastUsers(oldChannelId)

      sendHistory(ws, target.id)
      if (!alreadyInTargetChannel) {
        broadcast({ type: 'join', channel: target.name, username, timestamp: new Date().toISOString() }, target.id, client)
      }
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

    if (msg.type === 'pin' || msg.type === 'unpin') {
      const messageId = msg.replyTo ?? 0
      if (!messageId) return
      const msgChannelId = getMessageChannelId(messageId)
      if (msgChannelId === null) return

      if (msg.type === 'pin') {
        pinMessage(messageId, msgChannelId, username)
      } else {
        unpinMessage(messageId, msgChannelId)
      }

      const pins = getPinnedMessages(msgChannelId)
      broadcast({
        type: 'pins_update',
        channel: getChannelById(msgChannelId)?.name,
        username: '',
        timestamp: new Date().toISOString(),
        pins,
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
    client.missedPongs = 0
  })

  ws.on('close', cleanup)
  ws.on('error', cleanup)

  let cleanedUp = false
  function cleanup() {
    if (cleanedUp) return
    cleanedUp = true
    removeClient(client)
    if (!hasUserInChannel(username, client.channelId)) {
      broadcast({ type: 'leave', username, timestamp: new Date().toISOString() }, client.channelId)
    }
    broadcastUsers(client.channelId)
  }
}

function sendHistory(ws: WebSocket, channelId: number): void {
  const history = getRecentHistory(channelId)
  const pins = getPinnedMessages(channelId)
  const ch = getChannelById(channelId)
  ws.send(JSON.stringify({
    type: 'history',
    channel: ch?.name,
    username: '',
    timestamp: new Date().toISOString(),
    history,
    pins,
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

export function startHeartbeat(intervalMs = 60_000): NodeJS.Timeout {
  return setInterval(pingAll, intervalMs)
}
