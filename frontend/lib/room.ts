export const ROOM_NAME = 'นกพิราบ'

// Keep HTTP API requests same-origin in browser Network via Next rewrite.
const API_BASE = '/api/backend'

// Vercel rewrites do not proxy WebSocket upgrade reliably, so WS must connect to backend directly.
const WS_URL = 'wss://print-code.k1god.com/ws'

export { API_BASE, WS_URL }

// Vercel proxy intermittently 415s (transient upstream failure) on identical
// requests. Retry so chat reliably loads.
export async function fetchWithRetry(url: string, opts: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    let res: Response
    try {
      res = await fetch(url, opts)
    } catch {
      res = new Response(null, { status: 503 }) // treat network error as retriable
    }
    const transient = res.status === 415 || res.status === 429 || res.status >= 500
    if (!transient) return res
    if (i < retries) await new Promise((r) => setTimeout(r, 300 * (i + 1)))
  }
  return fetch(url, opts)
}
