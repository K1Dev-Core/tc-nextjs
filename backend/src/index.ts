import http from 'node:http'
import { URL } from 'node:url'
import { WebSocketServer } from 'ws'
import { getDb, closeDb } from './db/connection.js'
import { handleConnection, startHeartbeat } from './ws/handler.js'
import { getOnlineUsernames } from './ws/hub.js'
import { handleUpload, serveFile } from './db/upload.js'
import { getHistoryBefore, getChannels, getChannelByName, getPinnedMessages, getChannelById, getUserAvatar, setUserAvatar, adminGetAllUsers, adminDeleteUser, adminGetMessageCountForUser, adminCreateChannel, adminUpdateChannel, adminDeleteChannel, adminSearchMessages, adminDeleteMessage } from './db/queries.js'

const PORT = Number(process.env.PORT ?? 8080)
const HOST = process.env.HOST ?? '0.0.0.0'

getDb()

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const path = url.pathname

  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, online: getOnlineUsernames().length }))
    return
  }

  if (path === '/stats') {
    const db = getDb()
    const msgCount = db.prepare('SELECT COUNT(*) as n FROM messages').get() as { n: number }
    const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      online: getOnlineUsernames().length,
      totalMessages: msgCount.n,
      totalUsers: userCount.n,
    }))
    return
  }

  if (path === '/channels' && req.method === 'GET') {
    const channels = getChannels()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ channels }))
    return
  }

  if (path.startsWith('/pins/') && req.method === 'GET') {
    const channelName = decodeURIComponent(path.slice('/pins/'.length))
    const channel = getChannelByName(channelName)
    if (!channel) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'channel not found' }))
      return
    }
    const pins = getPinnedMessages(channel.id)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ pins }))
    return
  }

  if (path === '/upload' && req.method === 'POST') {
    handleUpload(req, res)
    return
  }

  if (path.startsWith('/files/') && req.method === 'GET') {
    const filename = path.slice('/files/'.length)
    serveFile(res, filename)
    return
  }

  // --- Avatar API ---
  if (path === '/avatar' && req.method === 'GET') {
    const username = url.searchParams.get('username') ?? ''
    if (!username) { res.writeHead(400); res.end('missing username'); return }
    const avatar = getUserAvatar(username)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ avatar }))
    return
  }

  if (path === '/avatar' && req.method === 'POST') {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      try {
        const { username, avatar } = JSON.parse(body)
        if (!username) { res.writeHead(400); res.end('missing username'); return }
        setUserAvatar(username, avatar ?? null)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch { res.writeHead(400); res.end('invalid json') }
    })
    return
  }

  // --- Admin API ---
  const ADMIN_KEY = process.env.ADMIN_KEY || 'พิราบ'
  const ADMIN_KEY_B64 = Buffer.from(ADMIN_KEY).toString('base64')
  const isAdmin = req.headers['x-admin-key'] === ADMIN_KEY_B64
  const requireAdmin = () => isAdmin || (res.writeHead(401), res.end('unauthorized'), false)

  if (path === '/admin/login' && req.method === 'POST') {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      try {
        const { password } = JSON.parse(body)
        if (password === ADMIN_KEY) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true, key: ADMIN_KEY_B64 }))
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false }))
        }
      } catch { res.writeHead(400); res.end('invalid json') }
    })
    return
  }

  if (path === '/admin/stats' && req.method === 'GET') {
    if (!requireAdmin()) return
    const db = getDb()
    const msgCount = db.prepare('SELECT COUNT(*) as n FROM messages').get() as { n: number }
    const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }
    const chCount = db.prepare('SELECT COUNT(*) as n FROM channels').get() as { n: number }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      online: getOnlineUsernames().length,
      totalMessages: msgCount.n,
      totalUsers: userCount.n,
      totalChannels: chCount.n,
    }))
    return
  }

  if (path === '/admin/users' && req.method === 'GET') {
    if (!requireAdmin()) return
    const users = adminGetAllUsers()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ users }))
    return
  }

  if (path === '/admin/users/delete' && req.method === 'POST') {
    if (!requireAdmin()) return
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      try {
        const { username, deleteMessages } = JSON.parse(body)
        if (!username) { res.writeHead(400); res.end('missing username'); return }
        adminDeleteUser(username, !!deleteMessages)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch { res.writeHead(400); res.end('invalid json') }
    })
    return
  }

  if (path === '/admin/users/message-count' && req.method === 'GET') {
    if (!requireAdmin()) return
    const username = url.searchParams.get('username') ?? ''
    if (!username) { res.writeHead(400); res.end('missing username'); return }
    const count = adminGetMessageCountForUser(username)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ count }))
    return
  }

  if (path === '/admin/channels' && req.method === 'GET') {
    if (!requireAdmin()) return
    const channels = getChannels()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ channels }))
    return
  }

  if (path === '/admin/channels' && req.method === 'POST') {
    if (!requireAdmin()) return
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      try {
        const { name, description } = JSON.parse(body)
        if (!name) { res.writeHead(400); res.end('missing name'); return }
        const ch = adminCreateChannel(name.trim().slice(0, 50), description?.trim() || null)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(ch))
      } catch { res.writeHead(400); res.end('invalid json') }
    })
    return
  }

  if (path === '/admin/channels' && req.method === 'PUT') {
    if (!requireAdmin()) return
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      try {
        const { id, name, description } = JSON.parse(body)
        if (!id || !name) { res.writeHead(400); res.end('missing fields'); return }
        adminUpdateChannel(id, name.trim().slice(0, 50), description?.trim() || null)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch { res.writeHead(400); res.end('invalid json') }
    })
    return
  }

  if (path === '/admin/channels/delete' && req.method === 'POST') {
    if (!requireAdmin()) return
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body)
        if (!id) { res.writeHead(400); res.end('missing id'); return }
        adminDeleteChannel(id)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch { res.writeHead(400); res.end('invalid json') }
    })
    return
  }

  if (path === '/admin/messages' && req.method === 'GET') {
    if (!requireAdmin()) return
    const search = url.searchParams.get('search') ?? ''
    const channel = url.searchParams.get('channel') ?? ''
    const page = Number(url.searchParams.get('page') ?? '0')
    const channelId = channel ? (getChannelByName(channel)?.id ?? undefined) : undefined
    const result = adminSearchMessages(search, channelId, page)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
    return
  }

  if (path === '/admin/messages/delete' && req.method === 'POST') {
    if (!requireAdmin()) return
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body)
        if (!id) { res.writeHead(400); res.end('missing id'); return }
        adminDeleteMessage(id)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch { res.writeHead(400); res.end('invalid json') }
    })
    return
  }

  if (path === '/history' && req.method === 'GET') {
    const channelName = url.searchParams.get('channel') ?? 'นกพิราบ'
    const before = Number(url.searchParams.get('before') ?? '0')
    const channel = getChannelByName(channelName)
    if (!channel) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'channel not found' }))
      return
    }
    const messages = before > 0 ? getHistoryBefore(channel.id, before) : []
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ messages }))
    return
  }

  res.writeHead(404)
  res.end('not found')
})

const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '/ws', `http://${req.headers.host}`)
  const username = (url.searchParams.get('username') ?? 'guest').trim().slice(0, 24) || 'guest'
  const channel = (url.searchParams.get('channel') ?? 'นกพิราบ').trim()
  handleConnection(ws, username, channel)
})

const heartbeat = startHeartbeat()

server.listen(PORT, HOST, () => {
  console.log(`chat server listening on http://${HOST}:${PORT}`)
})

function shutdown() {
  console.log('\nshutting down…')
  clearInterval(heartbeat)
  wss.close()
  server.close()
  closeDb()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
