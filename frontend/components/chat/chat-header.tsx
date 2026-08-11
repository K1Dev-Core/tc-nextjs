'use client'

import { memo } from 'react'
import { PinIcon } from '@/components/ui/icons'

interface ChatHeaderProps {
  channelName: string
  onlineCount: number
  status: 'connecting' | 'open' | 'closed'
  onOpenPinned: () => void
  pinnedCount: number
  showPinButton?: boolean
  loading?: boolean
  onOpenCommand?: () => void
}

function ChatHeaderBase({ channelName, onlineCount, status, onOpenPinned, pinnedCount, showPinButton = true, loading = false, onOpenCommand }: ChatHeaderProps) {
  const statusText = status === 'open' ? 'live' : status === 'connecting' ? 'reconnecting' : 'offline'
  return (
    <header className="flex items-center gap-3 px-4 pl-16 sm:px-6 sm:pl-16 lg:pl-6 py-3.5 border-b border-white/8 bg-black/10 shrink-0">
      <div className="min-w-0 flex-1">
        {loading ? (
          <div className="space-y-1.5 py-0.5" role="status" aria-label="กำลังโหลดข้อมูลห้อง">
            <div className="skeleton h-3.5 w-28 rounded-full" />
            <div className="skeleton h-2.5 w-20 rounded-full" />
          </div>
        ) : (
          <>
            <div className="text-[15px] font-semibold tracking-tight truncate">{channelName || 'นกพิราบ'}</div>
            <div className="text-[11px] text-white/40 flex items-center gap-1.5">
              <span
                className={`relative w-1.5 h-1.5 rounded-full ${
                  status === 'open' ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]' : status === 'connecting' ? 'bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.8)]' : 'bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.8)]'
                }`}
              />
              <span className="status-count">{onlineCount} คนออนไลน์</span>
              <span className="text-white/25">·</span>
              <span className="uppercase tracking-[0.18em] text-[9px] text-white/35">{statusText}</span>
            </div>
          </>
        )}
      </div>
      {onOpenCommand && (
        <button
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/80 transition px-2.5 py-1.5 rounded-lg hover:bg-white/5 shrink-0"
          aria-label="Command palette"
        >
          ⌘K
        </button>
      )}
      {showPinButton && (
        <button
          onClick={onOpenPinned}
          className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/80 transition px-2.5 py-1.5 rounded-lg hover:bg-white/5 shrink-0"
          aria-label="ข้อความปักหมุด"
        >
          <PinIcon className="w-4 h-4" />
          {pinnedCount > 0 && <span>{pinnedCount}</span>}
        </button>
      )}
      <div className="flex items-center gap-1.5 text-[11px] text-white/40 shrink-0">
        <span className={`w-2 h-2 rounded-full animate-pulse ${status === 'open' ? 'bg-emerald-400' : status === 'connecting' ? 'bg-amber-400' : 'bg-red-400'}`} />
        {statusText}
      </div>
    </header>
  )
}

export const ChatHeader = memo(ChatHeaderBase)
