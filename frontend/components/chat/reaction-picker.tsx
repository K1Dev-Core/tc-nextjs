'use client'

import { memo, useEffect, useRef } from 'react'
import { QUICK_EMOJIS, emojiUrl } from '@/lib/emoji'

interface ReactionPickerProps {
  onPick: (emoji: string) => void
  onClose: () => void
  align?: 'left' | 'right'
}

function ReactionPickerBase({ onPick, onClose, align = 'left' }: ReactionPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const node = rootRef.current
      if (!node || node.contains(e.target as Node)) return
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onClose])

  return (
    <div
      ref={rootRef}
      className={`absolute bottom-full z-[60] mb-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
    >
      <div className="glass rounded-2xl px-2 py-1.5 flex items-center gap-1 animate-slideup shadow-2xl max-w-[min(92vw,34rem)] overflow-x-auto scroll-slim">
        {QUICK_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => { onPick(e); onClose() }}
            className="w-10 h-10 grid place-items-center rounded-xl hover:bg-white/15 active:scale-90 transition"
            title={e}
          >
            <img
              src={emojiUrl(e)}
              alt={e}
              width={28}
              height={28}
              loading="lazy"
              className="select-none pointer-events-none"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export const ReactionPicker = memo(ReactionPickerBase)
