#!/usr/bin/env node
import { setTimeout as sleep } from 'node:timers/promises'

const args = parseArgs(process.argv.slice(2))
const url = args.url || process.env.UPLOAD_URL || 'https://print-code.k1god.com/upload'
const count = clampInt(args.count ?? '20', 1, 200)
const concurrency = clampInt(args.concurrency ?? '2', 1, 10)
const delayMs = clampInt(args.delay ?? '200', 0, 60_000)
const size = clampInt(args.size ?? '0', 0, 55 * 1024 * 1024)
const timeoutMs = clampInt(args.timeout ?? '15000', 1000, 120_000)
const filename = args.filename || 'limit-test.txt'
const stopOn429 = args['stop-on-429'] !== 'false'

const bodyText = size > 0 ? 'x'.repeat(size) : ''
let next = 0
let stopped = false
const results = []

console.log(JSON.stringify({ url, count, concurrency, delayMs, size, filename, stopOn429 }, null, 2))

async function worker(id) {
  while (!stopped) {
    const i = next++
    if (i >= count) return
    if (i > 0 && delayMs > 0) await sleep(delayMs)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const started = performance.now()

    try {
      const form = new FormData()
      form.append('file', new Blob([bodyText], { type: 'text/plain' }), `${i}-${filename}`)

      const res = await fetch(url, {
        method: 'POST',
        body: form,
        headers: {
          accept: '*/*',
          referer: 'https://tc-nextjs-tawny.vercel.app/'
        },
        signal: controller.signal
      })

      const ms = Math.round(performance.now() - started)
      const text = await res.text().catch(() => '')
      const row = {
        i,
        worker: id,
        status: res.status,
        ok: res.ok,
        ms,
        retryAfter: res.headers.get('retry-after'),
        ratelimitLimit: res.headers.get('ratelimit-limit') || res.headers.get('x-ratelimit-limit'),
        ratelimitRemaining: res.headers.get('ratelimit-remaining') || res.headers.get('x-ratelimit-remaining'),
        ratelimitReset: res.headers.get('ratelimit-reset') || res.headers.get('x-ratelimit-reset'),
        body: text.slice(0, 160)
      }
      results.push(row)
      console.log(JSON.stringify(row))

      if (stopOn429 && res.status === 429) stopped = true
    } catch (err) {
      const ms = Math.round(performance.now() - started)
      const row = { i, worker: id, status: 'ERR', ok: false, ms, error: err?.name || String(err) }
      results.push(row)
      console.log(JSON.stringify(row))
    } finally {
      clearTimeout(timer)
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)))

const byStatus = results.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1
  return acc
}, {})
const latencies = results.map((r) => r.ms).sort((a, b) => a - b)
const pct = (p) => latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor((latencies.length - 1) * p))] : 0

console.log('\nsummary')
console.log(JSON.stringify({
  sent: results.length,
  byStatus,
  p50: pct(0.50),
  p95: pct(0.95),
  p99: pct(0.99),
  sawLimit: results.some((r) => r.status === 429),
  stopped
}, null, 2))

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) out[key] = 'true'
    else out[key] = next, i++
  }
  return out
}

function clampInt(value, min, max) {
  const n = Number.parseInt(String(value), 10)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}
