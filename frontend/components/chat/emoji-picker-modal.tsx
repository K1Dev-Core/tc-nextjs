'use client'

import { useState, memo, useEffect, useMemo, useCallback } from 'react'
import { EMOJI_CATEGORIES, EMOJI_CATEGORY_NAMES, emojiUrlFromChar } from '@/lib/emoji'
import { CloseIcon, SearchIcon } from '@/components/ui/icons'
import { GIF_MEMES, MEME_TEMPLATES, type MemeTemplate } from '@/lib/memes'

interface EmojiPickerModalProps {
  onPick: (emoji: string) => void
  onPickMeme?: (meme: MemeTemplate) => void
  onClose: () => void
  initialTab?: PickerTab
}

type PickerTab = 'emoji' | 'meme'
type MemeTab = 'all' | 'image' | 'gif'

function memeKey(meme: MemeTemplate) {
  return meme.url || meme.id
}

function isGif(meme: MemeTemplate) {
  return meme.animated || /\.gif(\?|$)/i.test(meme.url)
}

function mergeMemes(next: MemeTemplate[], prev: MemeTemplate[]) {
  const seen = new Set<string>()
  const out: MemeTemplate[] = []
  for (const meme of [...next, ...prev]) {
    const key = memeKey(meme)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(meme)
  }
  return out
}

function EmojiPickerModalBase({ onPick, onPickMeme, onClose, initialTab = 'emoji' }: EmojiPickerModalProps) {
  const [tab, setTab] = useState<PickerTab>(initialTab)
  const [activeCat, setActiveCat] = useState(EMOJI_CATEGORY_NAMES[0])
  const [query, setQuery] = useState('')
  const [memeTab, setMemeTab] = useState<MemeTab>('all')
  const [remoteMemes, setRemoteMemes] = useState<MemeTemplate[]>([])
  const [loadingMemes, setLoadingMemes] = useState(false)
  const [memePage, setMemePage] = useState(0)

  const loadMemes = useCallback(async (q: string, reset = false) => {
    setLoadingMemes(true)
    const page = reset ? 0 : memePage
    try {
      const params = new URLSearchParams({ q, page: String(page), limit: '160' })
      const res = await fetch(`/api/memes?${params}`, { cache: 'no-store' })
      const data = await res.json() as { memes?: MemeTemplate[]; nextPage?: number }
      const next = data.memes ?? []
      setRemoteMemes((prev) => reset ? mergeMemes(next, []) : mergeMemes(next, prev))
      setMemePage(data.nextPage ?? page + 1)
    } catch {
      if (reset) setRemoteMemes([])
    } finally {
      setLoadingMemes(false)
    }
  }, [memePage])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (tab !== 'meme') return
    const t = setTimeout(() => loadMemes(query.trim(), true), query.trim() ? 220 : 0)
    return () => clearTimeout(t)
  }, [tab, query]) // eslint-disable-line react-hooks/exhaustive-deps

  const emojis = EMOJI_CATEGORIES[activeCat] || []
  const memes = useMemo(() => {
    const remoteNames = new Set(remoteMemes.map((m) => m.name))
    const gifNames = new Set(remoteMemes.filter(isGif).map((m) => m.name))
    const pool = [
      ...remoteMemes,
      ...GIF_MEMES.filter((local) => !gifNames.has(local.name)),
      ...MEME_TEMPLATES.filter((local) => !remoteNames.has(local.name)),
    ]
    const q = query.trim().toLowerCase()
    const filtered = q
      ? pool.filter((m) => `${m.name} ${m.tags.join(' ')}`.toLowerCase().includes(q))
      : pool
    if (memeTab === 'gif') return filtered.filter(isGif)
    if (memeTab === 'image') return filtered.filter((m) => !isGif(m))
    return filtered
  }, [query, remoteMemes, memeTab])

  const pickMeme = (meme: MemeTemplate) => {
    if (!onPickMeme) return
    onPickMeme(meme)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadein" />
      <div
        className="relative glass rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[78vh] flex flex-col animate-slideup overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
          <div>
            <div className="text-[14px] font-semibold">เลือกของแชท</div>
            <div className="text-[10px] text-white/35">
              {tab === 'emoji' ? 'อิโมจิ' : loadingMemes ? 'กำลังโหลดมีมเพิ่ม…' : `${memes.length} มีม · รูป + GIF`}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center w-8 h-8 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition"
            aria-label="ปิด"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 px-3 py-2 border-b border-white/8 shrink-0 overflow-x-auto scroll-slim">
          {([
            ['emoji', 'อิโมจิ'],
            ['meme', 'มีม'],
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

        {tab === 'emoji' ? (
          <>
            <div className="flex gap-1 px-3 py-2 border-b border-white/8 shrink-0 overflow-x-auto scroll-slim">
              {EMOJI_CATEGORY_NAMES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] whitespace-nowrap transition
                    ${activeCat === cat ? 'bg-white/15 text-white/90 font-medium' : 'text-white/45 hover:text-white/70 hover:bg-white/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto scroll-slim p-3">
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((e) => (
                  <button
                    key={e.char + e.name}
                    onClick={() => onPick(e.char)}
                    className="aspect-square grid place-items-center rounded-xl hover:bg-white/10 active:scale-90 transition"
                    title={e.name}
                  >
                    <img
                      src={emojiUrlFromChar(e.char)}
                      alt={e.name}
                      width={28}
                      height={28}
                      loading="lazy"
                      className="select-none pointer-events-none"
                    />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="px-3 py-2 border-b border-white/8 shrink-0">
              <label className="glass-soft flex items-center gap-2 rounded-xl px-3 py-2">
                <SearchIcon className="w-4 h-4 text-white/35 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหามีม เช่น cat, fail, code, drake"
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
                  onClick={() => setMemeTab(id)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] whitespace-nowrap transition ${memeTab === id ? 'bg-white/15 text-white/90 font-medium' : 'text-white/45 hover:text-white/70 hover:bg-white/5'}`}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => loadMemes(query.trim(), false)}
                disabled={loadingMemes}
                className="ml-auto px-3 py-1.5 rounded-lg text-[12px] whitespace-nowrap transition text-white/55 hover:text-white/80 hover:bg-white/5 disabled:opacity-40"
              >
                {loadingMemes ? 'โหลด…' : 'โหลดเพิ่ม'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scroll-slim p-3">
              {memes.length === 0 ? (
                <div className="py-12 text-center text-sm text-white/35">ไม่เจอมีม ลองคำอื่นหรือกดโหลดเพิ่ม</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {memes.map((meme) => (
                    <button
                      key={memeKey(meme)}
                      onClick={() => pickMeme(meme)}
                      className="group overflow-hidden rounded-xl glass-soft hover:bg-white/10 transition text-left"
                      title={meme.name}
                    >
                      <div className="aspect-[4/3] bg-black/20 overflow-hidden relative">
                        {isGif(meme) && (
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
          </>
        )}
      </div>
    </div>
  )
}

export const EmojiPickerModal = memo(EmojiPickerModalBase)
