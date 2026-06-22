'use client'

import { memo } from 'react'
import { QUICK_EMOJIS, emojiUrl } from '@/lib/emoji'

interface ReactionPickerProps {
  onPick: (emoji: string) => void
  onClose: () => void
}

function ReactionPickerBase({ onPick, onClose }: ReactionPickerProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl px-3 py-2.5 flex items-center gap-1 animate-slidein shadow-2xl">
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
    </>
  )
}

export const ReactionPicker = memo(ReactionPickerBase)
