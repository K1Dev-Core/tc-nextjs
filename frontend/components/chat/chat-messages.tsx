'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react'
import type { LineMessage } from '@/lib/types'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import { PigeonMark } from '@/components/ui/pigeon-mark'
import { SpinnerIcon } from '@/components/ui/icons'
import { MessageListSkeleton } from '@/components/ui/skeleton'

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
  loading?: boolean
}

export function ChatMessages({ lines, typingUsers, me, hasMore, loadingMore, onLoadMore, onReply, onReact, onPin, pinnedIds, scrollTrigger, loading = false }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevHeight = useRef(0)
  const atBottom = useRef(true)
  const isFirstLoad = useRef(true)
  const prevChannelRef = useRef(scrollTrigger)
  const scrollIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settleScrollTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  const settleToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    settleScrollTimers.current.forEach(clearTimeout)
    settleScrollTimers.current = []

    const run = () => scrollToBottom(behavior)
    run()
    requestAnimationFrame(() => {
      run()
      requestAnimationFrame(run)
    })

    // Late assets / fonts can expand rows after first paint. Keep first open pinned briefly.
    for (const delay of [80, 180, 360]) {
      settleScrollTimers.current.push(setTimeout(run, delay))
    }
  }, [scrollToBottom])

  const rows = useMemo(() => lines.map((line, idx) => {
    const prev = lines[idx - 1]
    const grouped = Boolean(
      prev &&
      prev.type === 'message' &&
      line.type === 'message' &&
      prev.username === line.username &&
      prev.mine === line.mine &&
      !line.replyTo,
    )
    return {
      line,
      grouped,
      isPinned: line.dbId ? pinnedIds.has(line.dbId) : false,
    }
  }), [lines, pinnedIds])

  const markScrollBusy = useCallback(() => {
    document.body.dataset.chatScrolling = '1'
    if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current)
    scrollIdleTimer.current = setTimeout(() => {
      delete document.body.dataset.chatScrolling
      scrollIdleTimer.current = null
    }, 220)
  }, [])

  // ponytail: rAF throttle, coalesces scroll events to one per frame
  const rafRef = useRef(0)
  const handleScroll = useCallback(() => {
    markScrollBusy()
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const el = scrollRef.current
      if (!el) return
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      atBottom.current = distFromBottom < 80

      if (el.scrollTop < 60 && hasMore && !loadingMore) {
        prevHeight.current = el.scrollHeight
        onLoadMore()
      }
    })
  }, [hasMore, loadingMore, markScrollBusy, onLoadMore])

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current)
    settleScrollTimers.current.forEach(clearTimeout)
    settleScrollTimers.current = []
    delete document.body.dataset.chatScrolling
  }, [])

  // Channel switch or initial load: force instant jump to bottom
  useEffect(() => {
    if (prevChannelRef.current !== scrollTrigger) {
      prevChannelRef.current = scrollTrigger
      isFirstLoad.current = true
      atBottom.current = true
    }
  }, [scrollTrigger])

  // useLayoutEffect: runs synchronously after DOM mutation, before paint.
  // Instant jump on first load / channel switch — no smooth animation.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || loading) return
    if (prevHeight.current > 0 && lines.length > 0) {
      const newHeight = el.scrollHeight
      el.scrollTop = newHeight - prevHeight.current
      prevHeight.current = 0
      return
    }
    if (isFirstLoad.current && lines.length > 0) {
      isFirstLoad.current = false
      atBottom.current = true
      settleToBottom('auto')
    }
  }, [lines, loading, settleToBottom])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || loading) return

    const ro = new ResizeObserver(() => {
      if (atBottom.current && prevHeight.current === 0) {
        el.scrollTop = el.scrollHeight
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading])

  // Smooth scroll for subsequent messages only (not first load)
  useEffect(() => {
    if (loading) return
    if (atBottom.current && !isFirstLoad.current) {
      scrollToBottom('smooth')
    }
  }, [lines, typingUsers, loading, scrollToBottom])

  useEffect(() => {
    if (!loading) settleToBottom('auto')
  }, [scrollTrigger, loading, settleToBottom])

  if (loading) return <MessageListSkeleton />

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

      {rows.map(({ line, grouped, isPinned }) => (
        <div key={line.id} className="message-row">
          <MessageBubble line={line} grouped={grouped} me={me ?? ''} onReply={onReply} onReact={onReact} onPin={onPin} isPinned={isPinned} />
        </div>
      ))}

      <TypingIndicator names={typingUsers} />
      <div ref={bottomRef} />
    </div>
  )
}
