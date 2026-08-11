'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import { CloseIcon, SearchIcon } from '@/components/ui/icons'
import { MEME_TEMPLATES, searchMemes, type MemeTemplate } from '@/lib/memes'

interface MemePickerModalProps {
  onPick: (meme: MemeTemplate) => void
  onClose: () => void
}

interface ImgflipMeme {
  id: string
  name: string
  url: string
}

function normalizeRemoteMemes(memes: ImgflipMeme[]): MemeTemplate[] {
  return memes.slice(0, 80).map((m) => ({
    id: `imgflip-${m.id}`,
    name: m.name,
    tags: m.name.toLowerCase().split(/\s+/),
    url: m.url,
  }))
}

function MemePickerModalBase({ onPick, onClose }: MemePickerModalProps) {
  const [query, setQuery] = useState('')
  const [remoteMemes, setRemoteMemes] = useState<MemeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const memes = useMemo(() => {
    const pool = remoteMemes.length > 0
      ? [...remoteMemes, ...MEME_TEMPLATES.filter((local) => !remoteMemes.some((remote) => remote.name === local.name))]
      : searchMemes('')
    const q = query.trim().toLowerCase()
    if (!q) return pool
    return pool.filter((m) => `${m.name} ${m.tags.join(' ')}`.toLowerCase().includes(q))
  }, [query, remoteMemes])

  useEffect(() => {
    let cancelled = false
    fetch('https://api.imgflip.com/get_memes')
      .then((r) => r.json())
      .then((data: { success?: boolean; data?: { memes?: ImgflipMeme[] } }) => {
        if (cancelled) return
        const list = data.success && data.data?.memes ? normalizeRemoteMemes(data.data.memes) : []
        setRemoteMemes(list)
      })
      .catch(() => void 0)
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

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
            <div className="text-[10px] text-white/35">{loading ? 'กำลังดึงลิสมีม…' : 'กดแล้วส่งทันที'}</div>
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
                  <div className="aspect-[4/3] bg-black/20 overflow-hidden">
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
