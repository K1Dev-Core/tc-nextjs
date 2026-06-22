'use client'

import { memo, useState, useCallback } from 'react'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏']

interface ReactionPickerProps {
  onPick: (emoji: string) => void
  onClose: () => void
}

function ReactionPickerBase({ onPick, onClose }: ReactionPickerProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 bottom-full mb-1 left-0 glass rounded-2xl px-2 py-1.5 flex items-center gap-0.5 animate-fadein">
        {QUICK_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => { onPick(e); onClose() }}
            className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/15 transition text-lg"
          >
            {e}
          </button>
        ))}
      </div>
    </>
  )
}

export const ReactionPicker = memo(ReactionPickerBase)
