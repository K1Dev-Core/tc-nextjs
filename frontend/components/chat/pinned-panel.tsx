'use client'

import { useState, useMemo, memo } from 'react'
import type { ChatMessage, FileMeta } from '@/lib/types'
import { CloseIcon, PinIcon, GridIcon, ListIcon, NoteIcon, SearchIcon } from '@/components/ui/icons'
import { fileUrl, isImage, isVideo, formatBytes } from '@/lib/file-utils'
import { avatarEmojiUrl, formatTime } from '@/lib/avatar'
import { emojiUrlFromChar } from '@/lib/emoji'

type ViewMode = 'note' | 'chat' | 'gallery'

interface PinnedViewProps {
  pins: ChatMessage[]
  onUnpin: (messageId: number) => void
}

function PinnedViewBase({ pins, onUnpin }: PinnedViewProps) {
  const [mode, setMode] = useState<ViewMode>('chat')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pins
    return pins.filter((p) =>
      p.content?.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.file?.name.toLowerCase().includes(q)
    )
  }, [pins, query])

  const images = useMemo(() => filtered.filter((p) => p.file && isImage(p.file)), [filtered])

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-white/8 shrink-0">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาข้อความปักหมุด…"
            className="w-full glass-soft rounded-lg pl-8 pr-3 py-1.5 text-[12px] outline-none focus:ring-1 focus:ring-white/15"
          />
        </div>
        <div className="flex gap-0.5 shrink-0">
          {([
            { id: 'chat' as ViewMode, icon: ListIcon },
            { id: 'note' as ViewMode, icon: NoteIcon },
            { id: 'gallery' as ViewMode, icon: GridIcon },
          ]).map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`grid place-items-center w-8 h-8 rounded-lg transition
                ${mode === id ? 'bg-white/15 text-white/90' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
              aria-label={id}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-slim p-4">
        {filtered.length === 0 && (
          <div className="h-full grid place-items-center py-12">
            <div className="text-center text-white/35">
              <PinIcon className="w-8 h-8 mx-auto mb-2 text-white/20" />
              <div className="text-sm">ยังไม่มีข้อความปักหมุด</div>
            </div>
          </div>
        )}

        {mode === 'note' && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filtered.map((p) => (
              <PinnedNote key={p.id} pin={p} onUnpin={onUnpin} />
            ))}
          </div>
        )}

        {mode === 'chat' && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((p) => (
              <PinnedChatItem key={p.id} pin={p} onUnpin={onUnpin} />
            ))}
          </div>
        )}

        {mode === 'gallery' && (
          <div>
            {images.length === 0 ? (
              <div className="text-center text-white/35 py-12 text-sm">ไม่มีรูปภาพปักหมุด</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((p) => (
                  <PinnedGalleryItem key={p.id} pin={p} onUnpin={onUnpin} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PinnedNote({ pin, onUnpin }: { pin: ChatMessage; onUnpin: (id: number) => void }) {
  return (
    <div className="glass-soft rounded-xl p-3 group relative">
      <button
        onClick={() => pin.id && onUnpin(pin.id)}
        className="absolute top-2 right-2 grid place-items-center w-6 h-6 rounded-lg text-white/30 hover:text-red-300 hover:bg-white/5 transition opacity-0 group-hover:opacity-100"
        aria-label="ถอนหมุด"
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-center gap-2 mb-1.5">
        <img src={avatarEmojiUrl(pin.username)} alt={pin.username} width={18} height={18} className="rounded-full" />
        <span className="text-[11px] text-white/50">{pin.username}</span>
        <span className="text-[10px] text-white/25">{formatTime(pin.timestamp)}</span>
      </div>
      {pin.content && <div className="text-[13px] text-white/80 whitespace-pre-wrap break-words line-clamp-4">{pin.content}</div>}
      {pin.file && isImage(pin.file) && (
        <img src={fileUrl(pin.file.url)} alt={pin.file.name} className="mt-2 rounded-lg max-h-32 object-cover" loading="lazy" />
      )}
    </div>
  )
}

function PinnedChatItem({ pin, onUnpin }: { pin: ChatMessage; onUnpin: (id: number) => void }) {
  return (
    <div className="flex items-start gap-2.5 group">
      <img src={avatarEmojiUrl(pin.username)} alt={pin.username} width={28} height={28} className="rounded-full mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[12px] font-medium text-white/80">{pin.username}</span>
          <span className="text-[10px] text-white/30">{formatTime(pin.timestamp)}</span>
        </div>
        {pin.content && <div className="text-[13px] text-white/70 whitespace-pre-wrap break-words">{pin.content}</div>}
        {pin.file && isImage(pin.file) && (
          <img src={fileUrl(pin.file.url)} alt={pin.file.name} className="mt-1.5 rounded-lg max-h-48 object-cover" loading="lazy" />
        )}
        {pin.file && !isImage(pin.file) && (
          <a href={fileUrl(pin.file.url)} download={pin.file.name} className="mt-1.5 flex items-center gap-2 glass-soft rounded-lg px-2.5 py-1.5 text-[12px] text-white/70 hover:bg-white/10 transition w-fit">
            <span className="truncate">{pin.file.name}</span>
            <span className="text-white/30 text-[10px]">{formatBytes(pin.file.size)}</span>
          </a>
        )}
      </div>
      <button
        onClick={() => pin.id && onUnpin(pin.id)}
        className="grid place-items-center w-7 h-7 rounded-lg text-white/30 hover:text-red-300 hover:bg-white/5 transition opacity-0 group-hover:opacity-100 shrink-0"
        aria-label="ถอนหมุด"
      >
        <PinIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function PinnedGalleryItem({ pin, onUnpin }: { pin: ChatMessage; onUnpin: (id: number) => void }) {
  if (!pin.file) return null
  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden">
      <img src={fileUrl(pin.file.url)} alt={pin.file.name} className="w-full h-full object-cover" loading="lazy" />
      <button
        onClick={() => pin.id && onUnpin(pin.id)}
        className="absolute top-1.5 right-1.5 grid place-items-center w-6 h-6 rounded-lg bg-black/60 text-white/70 hover:text-red-300 transition opacity-0 group-hover:opacity-100"
        aria-label="ถอนหมุด"
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
      <a href={fileUrl(pin.file.url)} download={pin.file.name} className="absolute bottom-1.5 left-1.5 grid place-items-center w-6 h-6 rounded-lg bg-black/60 text-white/70 hover:text-white transition opacity-0 group-hover:opacity-100" aria-label="ดาวน์โหลด">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </a>
    </div>
  )
}

export const PinnedView = memo(PinnedViewBase)
