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
