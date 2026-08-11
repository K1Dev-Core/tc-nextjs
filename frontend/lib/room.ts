export const ROOM_NAME = 'นกพิราบ'

// Keep HTTP API requests same-origin in browser Network via Next rewrite.
const API_BASE = '/api/backend'

// Vercel rewrites do not proxy WebSocket upgrade reliably, so WS must connect to backend directly.
const WS_URL = 'wss://print-code.k1god.com/ws'

export { API_BASE, WS_URL }
