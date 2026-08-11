export const ROOM_NAME = 'นกพิราบ'

const browserProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws'
const browserHost = typeof window !== 'undefined' ? window.location.host : 'localhost:3000'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/backend'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || `${browserProtocol}://${browserHost}/api/backend/ws`

export { API_BASE, WS_URL }
