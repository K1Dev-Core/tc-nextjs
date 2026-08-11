export const ROOM_NAME = 'นกพิราบ'

const browserProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws'
const browserHost = typeof window !== 'undefined' ? window.location.host : 'localhost:3000'

// Keep backend origin out of client bundles and browser Network URLs.
// Next.js rewrites /api/backend/:path* to BACKEND_URL server-side.
const API_BASE = '/api/backend'
const WS_URL = `${browserProtocol}://${browserHost}/api/backend/ws`

export { API_BASE, WS_URL }
