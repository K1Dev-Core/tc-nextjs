import http from 'node:http'
import { URL } from 'node:url'
import { WebSocketServer } from 'ws'
import { getDb, closeDb } from './db/connection.js'
import { handleConnection, startHeartbeat } from './ws/handler.js'
import { getOnlineUsernames } from './ws/hub.js'
import { handleUpload, serveFile } from './db/upload.js'
import { getHistoryBefore, getChannels, getChannelByName } from './db/queries.js'

const PORT = Number(process.env.PORT ?? 8080)
const HOST = process.env.HOST ?? '0.0.0.0'

getDb()

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

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

  if (path === '/upload' && req.method === 'POST') {
    handleUpload(req, res)
    return
  }

  if (path.startsWith('/files/') && req.method === 'GET') {
    const filename = path.slice('/files/'.length)
    serveFile(res, filename)
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
