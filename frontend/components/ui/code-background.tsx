'use client'

// ponytail: static code string, duplicated for seamless loop. Dim dark text on the pastel aurora.
const CODE = `import { WebSocketServer } from 'ws'
import { handleConnection } from './ws/handler.js'

const PORT = Number(process.env.PORT ?? 8080)
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const url = new URL(req.url ?? '/', \`http://\${req.headers.host}\`)
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, online: getOnlineUsernames().length }))
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
    const messages = before > 0
      ? getHistoryBefore(channel.id, before)
      : getRecentHistory(channel.id)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ messages }))
    return
  }
})

const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '/ws', \`http://\${req.headers.host}\`)
  const username = (url.searchParams.get('username') ?? 'guest').trim().slice(0, 24) || 'guest'
  const channel = (url.searchParams.get('channel') ?? 'นกพิราบ').trim()
  handleConnection(ws, username, channel)
})

server.listen(PORT, HOST, () => {
  console.log(\`chat server listening on http://\${HOST}:\${PORT}\`)
})

function handleConnection(ws: WebSocket, username: string, channel: string) {
  const user = upsertUser(username)
  hub.join(ws, user, channel)
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString())
    switch (m.type) {
      case 'message':
        const saved = saveMessage(user.id, channel.id, m.content)
        hub.broadcast({ type: 'message', ...saved })
        break
      case 'channel_switch':
        hub.switchChannel(ws, m.content)
        break
      case 'reaction':
        const r = toggleReaction(user.id, m.messageId, m.emoji)
        hub.broadcast({ type: 'reaction', ...r })
        break
    }
  })
  ws.on('close', () => hub.leave(ws))
}

export function useChat(username: string | null) {
  const [lines, setLines] = useState<LineMessage[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('connecting')

  useEffect(() => {
    if (!username) return
    let stopped = false
    let retry = 0
    const connect = () => {
      if (stopped) return
      const ws = new WebSocket(\`\${WS_BASE}/ws?username=\${encodeURIComponent(username)}\`)
      ws.onopen = () => {
        setStatus('open')
        retry = 0
      }
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data)
        switch (m.type) {
          case 'channels':
            setChannels(m.channels)
            break
          case 'history':
            setLines(m.history.map(toLine))
            break
          case 'message':
            setLines(prev => [...prev, toLine(m)])
            sfx.receive()
            break
        }
      }
      ws.onclose = () => {
        setStatus('closed')
        if (stopped) return
        retry += 1
        const delay = Math.min(1000 * 2 ** retry, 8000)
        setTimeout(connect, delay)
      }
    }
    connect()
    return () => { stopped = true }
  }, [username])

  return { lines, channels, activeChannel, typingUsers, status }
}

interface ChatMessage {
  id: number
  channelId: number
  userId: number
  username: string
  content: string
  createdAt: number
  pinned: number
  replyTo?: number
  replyToUsername?: string
  replyToContent?: string
}

interface LineMessage {
  id: string
  type: 'message' | 'system'
  dbId?: number
  username: string
  content: string
  timestamp: number
  mine: boolean
  reactions?: ReactionInfo[]
  replyTo?: number
  replyToUsername?: string
  replyToContent?: string
  file?: FileMeta
}

const sfx = {
  send() { playSweep(520, 880, 0.08, 'sine') },
  receive() { playTwo(660, 880, 0.06, 'sine') },
  join() { playArp([523, 659, 784], 0.05, 'triangle') },
  leave() { playSweep(440, 220, 0.15, 'sine') },
  react() { playTwo(990, 1320, 0.04, 'triangle') },
  pin() { playSweep(400, 1200, 0.12, 'square') },
  login() { playArp([523, 659, 784, 1047], 0.07, 'triangle') },
}
`

export function CodeBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      {/* Scrolling code only — the pastel bg-aurora lives on <body> behind this.
          Dark text on light pastel, very dim so it's texture not clutter. */}
      <div
        className="absolute left-0 right-0 top-0 text-[11px] leading-[1.6] font-mono text-slate-900/[0.07] whitespace-pre"
        style={{ animation: 'scroll-code 90s linear infinite' }}
      >
        <pre className="m-0 p-0">{CODE}</pre>
        <pre className="m-0 p-0">{CODE}</pre>
      </div>
    </div>
  )
}
