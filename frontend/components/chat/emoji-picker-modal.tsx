'use client'

import { useState, memo, useEffect } from 'react'
import { EMOJI_CATEGORIES, EMOJI_CATEGORY_NAMES, emojiUrlFromChar } from '@/lib/emoji'
import { CloseIcon } from '@/components/ui/icons'

interface EmojiPickerModalProps {
  onPick: (emoji: string) => void
  onClose: () => void
}

function EmojiPickerModalBase({ onPick, onClose }: EmojiPickerModalProps) {
  const [activeCat, setActiveCat] = useState(EMOJI_CATEGORY_NAMES[0])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const emojis = EMOJI_CATEGORIES[activeCat] || []

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadein" />
      <div
        className="relative glass rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[70vh] flex flex-col animate-slideup overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
          <span className="text-[14px] font-semibold">เลือกอิโมจิ</span>
          <button
            onClick={onClose}
            className="grid place-items-center w-8 h-8 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition"
            aria-label="ปิด"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

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
      </div>
    </div>
  )
}

export const EmojiPickerModal = memo(EmojiPickerModalBase)
