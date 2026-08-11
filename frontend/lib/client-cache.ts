import type { LineMessage } from './types'

const DB_NAME = 'tc-nextjs-chat-cache'
const DB_VERSION = 1
const STORE = 'history'
const MAX_LINES = 120

interface CachedHistory {
  key: string
  lines: LineMessage[]
  updatedAt: number
}

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return Promise.resolve(null)
  dbPromise ??= new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
  return dbPromise
}

const cacheKey = (channel: string) => `channel:${channel}`

export async function getCachedLines(channel: string): Promise<LineMessage[]> {
  const db = await openDb()
  if (!db) return []
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(cacheKey(channel))
    req.onsuccess = () => resolve(((req.result as CachedHistory | undefined)?.lines ?? []).slice(-MAX_LINES))
    req.onerror = () => resolve([])
  })
}

export async function cacheLines(channel: string, lines: LineMessage[]): Promise<void> {
  const db = await openDb()
  if (!db || !channel) return
  const payload: CachedHistory = {
    key: cacheKey(channel),
    lines: lines.slice(-MAX_LINES),
    updatedAt: Date.now(),
  }
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(payload)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
}
