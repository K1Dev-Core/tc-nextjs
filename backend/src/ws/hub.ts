import { WebSocket } from 'ws'

export interface Client {
  ws: WebSocket
  username: string
  alive: boolean
  channelId: number
}

const clients = new Set<Client>()

export function addClient(c: Client): void {
  clients.add(c)
}

export function removeClient(c: Client): void {
  clients.delete(c)
}

export function getOnlineUsernames(channelId?: number): string[] {
  const names = new Set<string>()
  for (const c of clients) {
    if (c.ws.readyState !== WebSocket.OPEN) continue
    if (channelId !== undefined && c.channelId !== channelId) continue
    names.add(c.username)
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

export function broadcast(data: object, channelId: number, exclude?: Client): void {
  const payload = JSON.stringify(data)
  for (const c of clients) {
    if (c === exclude) continue
    if (c.channelId !== channelId) continue
    if (c.ws.readyState !== WebSocket.OPEN) continue
    c.ws.send(payload)
  }
}

export function broadcastUsers(channelId: number): void {
  broadcast(
    { type: 'users', username: '', timestamp: new Date().toISOString(), users: getOnlineUsernames(channelId) },
    channelId
  )
}

export function broadcastToAll(data: object): void {
  const payload = JSON.stringify(data)
  for (const c of clients) {
    if (c.ws.readyState !== WebSocket.OPEN) continue
    c.ws.send(payload)
  }
}

export function pingAll(): void {
  for (const c of clients) {
    if (c.ws.readyState !== WebSocket.OPEN) continue
    if (!c.alive) {
      c.ws.terminate()
      continue
    }
    c.alive = false
    c.ws.ping()
  }
}
