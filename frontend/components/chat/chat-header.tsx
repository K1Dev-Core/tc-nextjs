'use client'

import { memo } from 'react'
import { PinIcon } from '@/components/ui/icons'

interface ChatHeaderProps {
  channelName: string
  onlineCount: number
  status: 'connecting' | 'open' | 'closed'
  onOpenPinned: () => void
  pinnedCount: number
}

function ChatHeaderBase({ channelName, onlineCount, status, onOpenPinned, pinnedCount }: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-white/8 bg-black/10 shrink-0 lg:pl-6 pl-16 lg:pl-6">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold tracking-tight truncate">{channelName || 'นกพิราบ'}</div>
        <div className="text-[11px] text-white/40 flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === 'open' ? 'bg-emerald-400' : status === 'connecting' ? 'bg-amber-400' : 'bg-red-400'
            }`}
          />
          {onlineCount} คนออนไลน์
        </div>
      </div>
      <button
        onClick={onOpenPinned}
        className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/80 transition px-2.5 py-1.5 rounded-lg hover:bg-white/5 shrink-0"
        aria-label="ข้อความปักหมุด"
      >
        <PinIcon className="w-4 h-4" />
        {pinnedCount > 0 && <span>{pinnedCount}</span>}
      </button>
      <div className="flex items-center gap-1.5 text-[11px] text-white/40 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        live
      </div>
    </header>
  )
}

export const ChatHeader = memo(ChatHeaderBase)
