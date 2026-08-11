import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface MemeOut {
  id: string
  name: string
  tags: string[]
  url: string
  animated?: boolean
}

interface ImgflipMeme { id: string; name: string; url: string }
interface MemeApiItem { title?: string; url?: string; subreddit?: string; nsfw?: boolean; spoiler?: boolean; postLink?: string }
interface RedditChild { data?: { id?: string; title?: string; url_overridden_by_dest?: string; url?: string; subreddit?: string; over_18?: boolean; spoiler?: boolean; is_gallery?: boolean } }
interface MemegenTemplate { id: string; name: string; blank?: string; keywords?: string[] }

const IMGFLIP_URL = 'https://api.imgflip.com/get_memes'
const MEMEGEN_URL = 'https://api.memegen.link/templates/'
const SUBREDDITS = ['memes', 'dankmemes', 'me_irl', 'ProgrammerHumor', 'wholesomememes']
const IMAGE_RE = /\.(png|jpe?g|webp|gif)(\?|$)/i

function tags(text: string) {
  return text.toLowerCase().split(/[^a-z0-9ก-๙]+/i).filter(Boolean).slice(0, 20)
}

function isGif(url: string) {
  return /\.gif(\?|$)/i.test(url)
}

function cleanUrl(url?: string) {
  if (!url) return ''
  if (!/^https:\/\//i.test(url)) return ''
  if (!IMAGE_RE.test(url)) return ''
  return url
}

function dedupe(items: MemeOut[]) {
  const seen = new Set<string>()
  const out: MemeOut[] = []
  for (const item of items) {
    if (!item.url || seen.has(item.url)) continue
    seen.add(item.url)
    out.push(item)
  }
  return out
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'user-agent': 'tc-nextjs meme picker/1.0' },
      signal: AbortSignal.timeout(6500),
    })
    if (!res.ok) return null
    return await res.json() as T
  } catch {
    return null
  }
}

async function imgflip(q: string): Promise<MemeOut[]> {
  const data = await fetchJson<{ success?: boolean; data?: { memes?: ImgflipMeme[] } }>(IMGFLIP_URL)
  const list = data?.success ? (data.data?.memes ?? []) : []
  return list
    .filter((m) => !q || m.name.toLowerCase().includes(q))
    .map((m) => ({ id: `imgflip-${m.id}`, name: m.name, tags: tags(m.name), url: m.url }))
}


async function memegen(q: string): Promise<MemeOut[]> {
  const data = await fetchJson<MemegenTemplate[]>(MEMEGEN_URL)
  const templates = data ?? []
  const blanks = templates
    .filter((m) => {
      const hay = `${m.name} ${(m.keywords ?? []).join(' ')}`.toLowerCase()
      return !q || hay.includes(q)
    })
    .map((m) => {
      const url = cleanUrl(m.blank)
      const name = m.name || m.id
      return url ? { id: `memegen-${m.id}`, name, tags: tags(`${name} ${(m.keywords ?? []).join(' ')}`), url } : null
    })
    .filter(Boolean) as MemeOut[]

  if (!q) return blanks

  const line = encodeURIComponent(q.replace(/[\/]+/g, ' ').slice(0, 48)).replace(/%20/g, '_')
  const generated = templates.slice(0, 90).map((m) => {
    const name = `${m.name || m.id}: ${q}`
    return {
      id: `memegen-gen-${m.id}-${line}`,
      name,
      tags: tags(`${name} ${(m.keywords ?? []).join(' ')}`),
      url: `https://api.memegen.link/images/${encodeURIComponent(m.id)}/${line}/_.jpg`,
    }
  })
  return [...blanks, ...generated]
}

async function memeApi(subreddit: string, q: string, batch = 50): Promise<MemeOut[]> {
  const data = await fetchJson<{ count?: number; memes?: MemeApiItem[] }>(`https://meme-api.com/gimme/${encodeURIComponent(subreddit)}/${batch}`)
  return (data?.memes ?? [])
    .filter((m) => !m.nsfw && !m.spoiler)
    .filter((m) => !q || `${m.title ?? ''} ${m.subreddit ?? ''}`.toLowerCase().includes(q))
    .map((m, index) => {
      const url = cleanUrl(m.url)
      const name = (m.title || 'Reddit meme').slice(0, 120)
      return url ? { id: `memeapi-${subreddit}-${index}-${Buffer.from(url).toString('base64url').slice(0, 12)}`, name, tags: tags(`${name} ${m.subreddit ?? subreddit}`), url, animated: isGif(url) } : null
    })
    .filter(Boolean) as MemeOut[]
}

async function redditSearch(subreddit: string, q: string, limit = 50): Promise<MemeOut[]> {
  if (!q) return []
  const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=relevance&t=all&limit=${limit}`
  const data = await fetchJson<{ data?: { children?: RedditChild[] } }>(url)
  return (data?.data?.children ?? [])
    .map((child) => child.data)
    .filter(Boolean)
    .filter((d) => !d!.over_18 && !d!.spoiler && !d!.is_gallery)
    .map((d) => {
      const raw = d!.url_overridden_by_dest || d!.url
      const mediaUrl = cleanUrl(raw)
      if (!mediaUrl) return null
      const name = (d!.title || 'Reddit meme').slice(0, 120)
      return { id: `reddit-${subreddit}-${d!.id ?? Buffer.from(mediaUrl).toString('base64url').slice(0, 12)}`, name, tags: tags(`${name} ${d!.subreddit ?? subreddit}`), url: mediaUrl, animated: isGif(mediaUrl) }
    })
    .filter(Boolean) as MemeOut[]
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim().toLowerCase().slice(0, 60)
  const page = Math.max(0, Number(searchParams.get('page') ?? '0') || 0)
  const limit = Math.min(180, Math.max(40, Number(searchParams.get('limit') ?? '120') || 120))
  const subs = SUBREDDITS.slice(page % SUBREDDITS.length).concat(SUBREDDITS.slice(0, page % SUBREDDITS.length)).slice(0, 4)
  const batches = await Promise.allSettled([
    imgflip(q),
    memegen(q),
    ...subs.map((sub) => memeApi(sub, q, 50)),
    ...subs.map((sub) => redditSearch(sub, q, 50)),
  ])
  const items = dedupe(batches.flatMap((r) => r.status === 'fulfilled' ? r.value : []))
  return NextResponse.json({ memes: items.slice(0, limit), nextPage: page + 1 })
}
