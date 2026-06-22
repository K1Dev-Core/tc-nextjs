'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { LineMessage } from '@/lib/types'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import { PigeonMark } from '@/components/ui/pigeon-mark'
import { SpinnerIcon } from '@/components/ui/icons'

interface ChatMessagesProps {
  lines: LineMessage[]
  typingUsers: string[]
  me: string | null
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onReply: (line: LineMessage) => void
  onReact: (messageId: number, emoji: string) => void
  onPin: (messageId: number) => void
  pinnedIds: Set<number>
  scrollTrigger: string
}

export function ChatMessages({ lines, typingUsers, me, hasMore, loadingMore, onLoadMore, onReply, onReact, onPin, pinnedIds, scrollTrigger }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevHeight = useRef(0)
  const atBottom = useRef(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    atBottom.current = distFromBottom < 80

    if (el.scrollTop < 60 && hasMore && !loadingMore) {
      prevHeight.current = el.scrollHeight
      onLoadMore()
    }
  }, [hasMore, loadingMore, onLoadMore])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (prevHeight.current > 0 && lines.length > 0) {
      const newHeight = el.scrollHeight
      el.scrollTop = newHeight - prevHeight.current
      prevHeight.current = 0
    }
  }, [lines])

  useEffect(() => {
    if (atBottom.current) {
      scrollToBottom('smooth')
    }
  }, [lines, typingUsers, scrollToBottom])

  useEffect(() => {
    scrollToBottom('auto')
  }, [scrollTrigger, scrollToBottom])

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto scroll-slim px-3 sm:px-5 md:px-8 py-5 space-y-2">
      {hasMore && (
        <div className="flex justify-center py-3">
          {loadingMore ? (
            <div className="flex items-center gap-2 text-[11px] text-white/40 animate-fadein">
              <SpinnerIcon className="w-4 h-4 animate-spin" />
              กำลังโหลด…
            </div>
          ) : (
            <button onClick={onLoadMore} className="text-[11px] text-white/40 hover:text-white/70 transition px-3 py-1 rounded-full hover:bg-white/5">
              โหลดข้อความเก่ากว่า
            </button>
          )}
        </div>
      )}
      {lines.length === 0 && !hasMore && (
        <div className="h-full grid place-items-center">
          <div className="text-center max-w-sm animate-fadein px-6">
            <div className="mx-auto mb-4 grid place-items-center w-14 h-14 rounded-2xl bg-white/8 border border-white/10">
              <PigeonMark size={28} className="text-white/70" />
            </div>
            <div className="text-white/70 font-medium">ยังไม่มีข้อความ</div>
            <div className="text-white/35 text-sm mt-1">พิมพ์อะไรสักอย่างเริ่มคุยกันได้เลย</div>
          </div>
        </div>
      )}

      {lines.map((line, idx) => {
        const prev = lines[idx - 1]
        const grouped =
          prev &&
          prev.type === 'message' &&
          line.type === 'message' &&
          prev.username === line.username &&
          prev.mine === line.mine &&
          !line.replyTo
        return <MessageBubble key={line.id} line={line} grouped={grouped} me={me ?? ''} onReply={onReply} onReact={onReact} onPin={onPin} isPinned={line.dbId ? pinnedIds.has(line.dbId) : false} />
      })}

      <TypingIndicator names={typingUsers} />
      <div ref={bottomRef} />
    </div>
  )
}
