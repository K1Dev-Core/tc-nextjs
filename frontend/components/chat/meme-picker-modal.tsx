'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import { CloseIcon, SearchIcon } from '@/components/ui/icons'
import { GIF_MEMES, MEME_TEMPLATES, type MemeTemplate } from '@/lib/memes'

interface MemePickerModalProps {
  onPick: (meme: MemeTemplate) => void
  onClose: () => void
}

interface ImgflipMeme {
  id: string
  name: string
  url: string
}

interface GiphyItem {
  id: string
  title?: string
  images?: { fixed_width?: { url?: string }; original?: { url?: string } }
}

type MemeTab = 'all' | 'image' | 'gif'

function normalizeRemoteMemes(memes: ImgflipMeme[]): MemeTemplate[] {
  return memes.map((m) => ({
    id: `imgflip-${m.id}`,
    name: m.name,
    tags: m.name.toLowerCase().split(/\s+/),
    url: m.url,
  }))
}

function normalizeGiphy(items: GiphyItem[]): MemeTemplate[] {
  return items.map((item) => ({
    id: `giphy-${item.id}`,
    name: item.title?.replace(/ GIF$/i, '') || 'GIF meme',
    tags: (item.title || 'gif meme').toLowerCase().split(/\s+/),
    url: item.images?.fixed_width?.url || item.images?.original?.url || '',
    animated: true,
  })).filter((item) => item.url)
}

function MemePickerModalBase({ onPick, onClose }: MemePickerModalProps) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<MemeTab>('all')
  const [remoteMemes, setRemoteMemes] = useState<MemeTemplate[]>([])
  const [remoteGifs, setRemoteGifs] = useState<MemeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const memes = useMemo(() => {
    const remoteNames = new Set(remoteMemes.map((m) => m.name))
    const gifNames = new Set(remoteGifs.map((m) => m.name))
    const pool = [
      ...remoteGifs,
      ...GIF_MEMES.filter((local) => !gifNames.has(local.name)),
      ...remoteMemes,
      ...MEME_TEMPLATES.filter((local) => !remoteNames.has(local.name)),
    ]
    const q = query.trim().toLowerCase()
    const filtered = q
      ? pool.filter((m) => `${m.name} ${m.tags.join(' ')}`.toLowerCase().includes(q))
      : pool
    if (tab === 'gif') return filtered.filter((m) => m.animated || /\.gif(\?|$)/i.test(m.url))
    if (tab === 'image') return filtered.filter((m) => !m.animated && !/\.gif(\?|$)/i.test(m.url))
    return filtered
  }, [query, remoteGifs, remoteMemes, tab])

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      fetch('https://api.imgflip.com/get_memes')
        .then((r) => r.json())
        .then((data: { success?: boolean; data?: { memes?: ImgflipMeme[] } }) => data.success && data.data?.memes ? normalizeRemoteMemes(data.data.memes) : []),
      fetch('https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=meme%20reaction&limit=50&rating=pg')
        .then((r) => r.json())
        .then((data: { data?: GiphyItem[] }) => normalizeGiphy(data.data ?? [])),
    ]).then(([imgflip, giphy]) => {
      if (cancelled) return
      if (imgflip.status === 'fulfilled') setRemoteMemes(imgflip.value)
      if (giphy.status === 'fulfilled') setRemoteGifs(giphy.value)
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    let cancelled = false
    const t = setTimeout(() => {
      fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(`${q} meme reaction`)}&limit=36&rating=pg`)
        .then((r) => r.json())
        .then((data: { data?: GiphyItem[] }) => {
          if (!cancelled) setRemoteGifs((prev) => {
            const next = normalizeGiphy(data.data ?? [])
            const seen = new Set(next.map((m) => m.url))
            return [...next, ...prev.filter((m) => !seen.has(m.url))].slice(0, 120)
          })
        })
        .catch(() => void 0)
    }, 350)
    return () => { cancelled = true; clearTimeout(t) }
  }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadein" />
      <div
        className="relative glass rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[76vh] flex flex-col animate-slideup overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
          <div>
            <div className="text-[14px] font-semibold">มีม</div>
            <div className="text-[10px] text-white/35">{loading ? 'กำลังดึงลิสมีม…' : `${memes.length} รายการ · กดแล้วส่งทันที`}</div>
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center w-8 h-8 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition"
            aria-label="ปิด"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 py-2 border-b border-white/8 shrink-0">
          <label className="glass-soft flex items-center gap-2 rounded-xl px-3 py-2">
            <SearchIcon className="w-4 h-4 text-white/35 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหามีม เช่น drake, cat, stonks, pikachu"
              className="w-full bg-transparent outline-none text-[13px] placeholder:text-white/30"
            />
          </label>
        </div>

        <div className="flex gap-1 px-3 py-2 border-b border-white/8 shrink-0 overflow-x-auto scroll-slim">
          {([
            ['all', 'ทั้งหมด'],
            ['image', 'รูป'],
            ['gif', 'GIF'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] whitespace-nowrap transition ${tab === id ? 'bg-white/15 text-white/90 font-medium' : 'text-white/45 hover:text-white/70 hover:bg-white/5'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scroll-slim p-3">
          {memes.length === 0 ? (
            <div className="py-12 text-center text-sm text-white/35">ไม่เจอมีม</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {memes.map((meme) => (
                <button
                  key={meme.id}
                  onClick={() => { onPick(meme); onClose() }}
                  className="group overflow-hidden rounded-xl glass-soft hover:bg-white/10 transition text-left"
                  title={meme.name}
                >
                  <div className="aspect-[4/3] bg-black/20 overflow-hidden relative">
                    {(meme.animated || /\.gif(\?|$)/i.test(meme.url)) && (
                      <span className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white/90">GIF</span>
                    )}
                    <img
                      src={meme.url}
                      alt={meme.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition"
                    />
                  </div>
                  <div className="px-2 py-1.5 text-[11px] text-white/70 truncate">{meme.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const MemePickerModal = memo(MemePickerModalBase)
