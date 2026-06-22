import { getDb } from './connection.js'
import type { MessageRow, UserRow, ChannelRow, FileMeta, ChatMessage, ReactionInfo } from '../types.js'

const INITIAL_LIMIT = 50
const PAGE_SIZE = 50

interface EnrichedRow extends MessageRow {
  reply_username: string | null
  reply_content: string | null
}

function batchEnrich(rows: MessageRow[]): ChatMessage[] {
  if (rows.length === 0) return []
  const db = getDb()
  const ids = rows.map((r) => r.id)
  const replyIds = rows.map((r) => r.reply_to).filter((v): v is number => v !== null)
  const idPlaceholders = ids.map(() => '?').join(',')

  const reactionMap = new Map<number, ReactionInfo[]>()
  if (ids.length > 0) {
    const reactionRows = db.prepare(
      `SELECT message_id, username, emoji FROM reactions WHERE message_id IN (${idPlaceholders})`
    ).all(...ids) as unknown as { message_id: number; username: string; emoji: string }[]
    for (const r of reactionRows) {
      const arr = reactionMap.get(r.message_id) ?? []
      const existing = arr.find((a) => a.emoji === r.emoji)
      if (existing) {
        existing.users.push(r.username)
      } else {
        arr.push({ emoji: r.emoji, users: [r.username] })
      }
      reactionMap.set(r.message_id, arr)
    }
  }

  const replyMap = new Map<number, { username: string; content: string }>()
  if (replyIds.length > 0) {
    const placeholders = replyIds.map(() => '?').join(',')
    const replyRows = db.prepare(
      `SELECT id, username, content FROM messages WHERE id IN (${placeholders})`
    ).all(...replyIds) as unknown as { id: number; username: string; content: string }[]
    for (const r of replyRows) {
      replyMap.set(r.id, { username: r.username, content: r.content.slice(0, 100) })
    }
  }

  return rows.map((r) => {
    let file: FileMeta | undefined
    if (r.file_json) {
      try { file = JSON.parse(r.file_json) as FileMeta } catch { file = undefined }
    }
    const replyInfo = r.reply_to ? replyMap.get(r.reply_to) : null
    const reactions = reactionMap.get(r.id)
    return {
      type: 'message' as const,
      id: r.id,
      username: r.username,
      content: r.content || undefined,
      file,
      timestamp: r.created_at,
      replyTo: r.reply_to ?? undefined,
      replyToContent: replyInfo?.content,
      replyToUsername: replyInfo?.username,
      reactions: reactions && reactions.length > 0 ? reactions : undefined,
    }
  })
}

export function saveMessage(
  username: string,
  content: string,
  file: FileMeta | undefined,
  channelId: number,
  replyTo: number | null,
  timestamp: string
): number {
  const db = getDb()
  const fileJson = file ? JSON.stringify(file) : null
  const tsDb = timestamp.includes('T') ? timestamp.replace('T', ' ').replace(/\.\d+Z?$/, '') : timestamp

  const result = db.prepare(
    'INSERT INTO messages (channel_id, username, content, file_json, reply_to, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(channelId, username, content, fileJson, replyTo, tsDb)

  db.prepare(
    `INSERT INTO users (username, last_seen) VALUES (?, datetime('now'))
     ON CONFLICT(username) DO UPDATE SET last_seen = datetime('now')`
  ).run(username)

  return Number(result.lastInsertRowid)
}

export function getRecentHistory(channelId: number): ChatMessage[] {
  const rows = getDb().prepare(
    `SELECT id, username, content, file_json, channel_id, reply_to, created_at FROM messages
     WHERE channel_id = ? ORDER BY id DESC LIMIT ${INITIAL_LIMIT}`
  ).all(channelId) as unknown as MessageRow[]
  return batchEnrich(rows.reverse())
}

export function getHistoryBefore(channelId: number, beforeId: number): ChatMessage[] {
  const rows = getDb().prepare(
    `SELECT id, username, content, file_json, channel_id, reply_to, created_at FROM messages
     WHERE channel_id = ? AND id < ? ORDER BY id DESC LIMIT ${PAGE_SIZE}`
  ).all(channelId, beforeId) as unknown as MessageRow[]
  return batchEnrich(rows.reverse())
}

export function addReaction(messageId: number, username: string, emoji: string): boolean {
  try {
    getDb().prepare(
      'INSERT OR IGNORE INTO reactions (message_id, username, emoji) VALUES (?, ?, ?)'
    ).run(messageId, username, emoji)
    return true
  } catch {
    return false
  }
}

export function removeReaction(messageId: number, username: string, emoji: string): boolean {
  try {
    getDb().prepare(
      'DELETE FROM reactions WHERE message_id = ? AND username = ? AND emoji = ?'
    ).run(messageId, username, emoji)
    return true
  } catch {
    return false
  }
}

export function getReactionsForMessage(messageId: number): ReactionInfo[] {
  const rows = getDb().prepare(
    'SELECT username, emoji FROM reactions WHERE message_id = ?'
  ).all(messageId) as unknown as { username: string; emoji: string }[]
  const map = new Map<string, string[]>()
  for (const r of rows) {
    const arr = map.get(r.emoji) ?? []
    arr.push(r.username)
    map.set(r.emoji, arr)
  }
  return [...map.entries()].map(([emoji, users]) => ({ emoji, users }))
}

export function getReplyInfo(replyTo: number | null): { content: string; username: string } | null {
  if (!replyTo) return null
  const row = getDb().prepare(
    'SELECT username, content FROM messages WHERE id = ?'
  ).get(replyTo) as unknown as { username: string; content: string } | undefined
  if (!row) return null
  return { content: row.content.slice(0, 100), username: row.username }
}

export function getMessageChannelId(messageId: number): number | null {
  const row = getDb().prepare(
    'SELECT channel_id FROM messages WHERE id = ?'
  ).get(messageId) as unknown as { channel_id: number } | undefined
  return row?.channel_id ?? null
}

export function touchUser(username: string): void {
  getDb().prepare(
    `INSERT INTO users (username, last_seen) VALUES (?, datetime('now'))
     ON CONFLICT(username) DO UPDATE SET last_seen = datetime('now')`
  ).run(username)
}

export function getAllUsers(): UserRow[] {
  return getDb().prepare(
    'SELECT username, last_seen, message_count FROM users ORDER BY last_seen DESC LIMIT 500'
  ).all() as unknown as UserRow[]
}

export function getChannels(): ChannelRow[] {
  return getDb().prepare(
    'SELECT id, name, description, created_at FROM channels ORDER BY id ASC'
  ).all() as unknown as ChannelRow[]
}

export function getChannelByName(name: string): ChannelRow | null {
  const row = getDb().prepare(
    'SELECT id, name, description, created_at FROM channels WHERE name = ?'
  ).get(name) as unknown as ChannelRow | undefined
  return row ?? null
}

export function getChannelById(id: number): ChannelRow | null {
  const row = getDb().prepare(
    'SELECT id, name, description, created_at FROM channels WHERE id = ?'
  ).get(id) as unknown as ChannelRow | undefined
  return row ?? null
}

export function createChannel(name: string, description?: string): ChannelRow {
  const db = getDb()
  const result = db.prepare(
    'INSERT INTO channels (name, description) VALUES (?, ?)'
  ).run(name, description ?? null)
  return getChannelById(Number(result.lastInsertRowid))!
}

export function pinMessage(messageId: number, channelId: number, pinnedBy: string): boolean {
  try {
    getDb().prepare(
      'INSERT OR IGNORE INTO pinned_messages (message_id, channel_id, pinned_by) VALUES (?, ?, ?)'
    ).run(messageId, channelId, pinnedBy)
    return true
  } catch {
    return false
  }
}

export function unpinMessage(messageId: number, channelId: number): boolean {
  try {
    getDb().prepare(
      'DELETE FROM pinned_messages WHERE message_id = ? AND channel_id = ?'
    ).run(messageId, channelId)
    return true
  } catch {
    return false
  }
}

export function getPinnedMessages(channelId: number): ChatMessage[] {
  const rows = getDb().prepare(
    `SELECT m.id, m.username, m.content, m.file_json, m.channel_id, m.reply_to, m.created_at
     FROM pinned_messages p
     JOIN messages m ON p.message_id = m.id
     WHERE p.channel_id = ?
     ORDER BY p.pinned_at DESC`
  ).all(channelId) as unknown as MessageRow[]
  return batchEnrich(rows)
}

export function isPinned(messageId: number, channelId: number): boolean {
  const row = getDb().prepare(
    'SELECT 1 FROM pinned_messages WHERE message_id = ? AND channel_id = ?'
  ).get(messageId, channelId)
  return !!row
}

// --- Avatar ---
export function getUserAvatar(username: string): string | null {
  const row = getDb().prepare('SELECT avatar FROM users WHERE username = ?').get(username) as { avatar: string | null } | undefined
  return row?.avatar ?? null
}

export function setUserAvatar(username: string, avatar: string | null): void {
  const db = getDb()
  db.prepare(
    `INSERT INTO users (username, last_seen, avatar) VALUES (?, datetime('now'), ?)
     ON CONFLICT(username) DO UPDATE SET avatar = ?, last_seen = datetime('now')`
  ).run(username, avatar, avatar)
}

// --- Admin: users ---
export function adminGetAllUsers(): { username: string; last_seen: string; message_count: number; avatar: string | null }[] {
  return getDb().prepare(
    'SELECT username, last_seen, message_count, avatar FROM users ORDER BY last_seen DESC'
  ).all() as any[]
}

export function adminDeleteUser(username: string, deleteMessages: boolean): void {
  const db = getDb()
  if (deleteMessages) {
    db.prepare('DELETE FROM reactions WHERE username = ?').run(username)
    db.prepare('DELETE FROM messages WHERE username = ?').run(username)
  }
  db.prepare('DELETE FROM users WHERE username = ?').run(username)
}

export function adminGetMessageCountForUser(username: string): number {
  const row = getDb().prepare('SELECT COUNT(*) as n FROM messages WHERE username = ?').get(username) as { n: number }
  return row?.n ?? 0
}

// --- Admin: channels ---
export function adminCreateChannel(name: string, description: string | null): { id: number; name: string; description: string | null } {
  const db = getDb()
  const result = db.prepare('INSERT INTO channels (name, description) VALUES (?, ?)').run(name, description)
  return db.prepare('SELECT id, name, description FROM channels WHERE id = ?').get(Number(result.lastInsertRowid)) as any
}

export function adminUpdateChannel(id: number, name: string, description: string | null): boolean {
  try {
    getDb().prepare('UPDATE channels SET name = ?, description = ? WHERE id = ?').run(name, description, id)
    return true
  } catch { return false }
}

export function adminDeleteChannel(id: number): void {
  const db = getDb()
  db.prepare('DELETE FROM pinned_messages WHERE channel_id = ?').run(id)
  db.prepare('DELETE FROM messages WHERE channel_id = ?').run(id)
  db.prepare('DELETE FROM channels WHERE id = ?').run(id)
}

// --- Admin: messages ---
export function adminSearchMessages(search: string, channelId?: number, page: number = 0): { messages: any[]; total: number } {
  const db = getDb()
  const limit = 50
  const offset = page * limit
  let where = search ? `WHERE m.content LIKE ?` : 'WHERE 1=1'
  const params: any[] = search ? [`%${search}%`] : []
  if (channelId) {
    where += ` AND m.channel_id = ?`
    params.push(channelId)
  }
  const total = (db.prepare(`SELECT COUNT(*) as n FROM messages m ${where}`).get(...params) as { n: number }).n
  const messages = db.prepare(
    `SELECT m.id, m.username, m.content, m.file_json, m.channel_id, m.reply_to, m.created_at, c.name as channel_name
     FROM messages m JOIN channels c ON m.channel_id = c.id
     ${where} ORDER BY m.id DESC LIMIT ${limit} OFFSET ${offset}`
  ).all(...params) as any[]
  return { messages, total }
}

export function adminDeleteMessage(id: number): void {
  const db = getDb()
  db.prepare('DELETE FROM reactions WHERE message_id = ?').run(id)
  db.prepare('DELETE FROM pinned_messages WHERE message_id = ?').run(id)
  db.prepare('DELETE FROM messages WHERE id = ?').run(id)
}
