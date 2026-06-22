import { DatabaseSync } from 'node:sqlite'
import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'

const DB_PATH = process.env.DB_PATH ?? resolve(process.cwd(), 'data', 'chat.db')
export const UPLOAD_DIR = resolve(process.cwd(), 'data', 'uploads')

let db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (db) return db
  mkdirSync(resolve(process.cwd(), 'data'), { recursive: true })
  mkdirSync(UPLOAD_DIR, { recursive: true })
  db = new DatabaseSync(DB_PATH)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA synchronous = NORMAL')
  db.exec('PRAGMA busy_timeout = 5000')
  db.exec('PRAGMA cache_size = -64000')
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  seedChannels(db)
  return db
}

function migrate(d: DatabaseSync) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL DEFAULT 1,
      username TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      file_json TEXT,
      reply_to INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (channel_id) REFERENCES channels(id)
    );
    CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id, id DESC);

    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      last_seen TEXT NOT NULL DEFAULT (datetime('now')),
      message_count INTEGER NOT NULL DEFAULT 0,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS reactions (
      message_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      emoji TEXT NOT NULL,
      PRIMARY KEY (message_id, username, emoji),
      FOREIGN KEY (message_id) REFERENCES messages(id)
    );
    CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(message_id);

    CREATE TABLE IF NOT EXISTS pinned_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      channel_id INTEGER NOT NULL,
      pinned_by TEXT NOT NULL,
      pinned_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (message_id) REFERENCES messages(id),
      FOREIGN KEY (channel_id) REFERENCES channels(id)
    );
    CREATE INDEX IF NOT EXISTS idx_pinned_channel ON pinned_messages(channel_id);
  `)
}

const DEFAULT_CHANNELS = [
  { name: 'นกพิราบ', description: 'ห้องหลัก' },
  { name: 'general', description: 'คุยเรื่อยเปื่อย' },
  { name: 'tech', description: 'เทคโนโลยี โค้ด ไอที' },
  { name: 'random', description: 'เรื่องสุ่ม ขำขำ' },
]

function seedChannels(d: DatabaseSync) {
  const count = d.prepare('SELECT COUNT(*) as n FROM channels').get() as { n: number }
  if (count.n > 0) return
  const stmt = d.prepare('INSERT INTO channels (name, description) VALUES (?, ?)')
  for (const c of DEFAULT_CHANNELS) {
    stmt.run(c.name, c.description)
  }
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
