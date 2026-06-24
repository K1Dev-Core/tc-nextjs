'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChannelSidebar } from '@/components/chat/channel-sidebar'
import { ChatHeader } from '@/components/chat/chat-header'
import { ChatMessages } from '@/components/chat/chat-messages'
import { MessageInput } from '@/components/chat/message-input'
import { UsernameModal } from '@/components/auth/username-modal'
import { PinnedView } from '@/components/chat/pinned-panel'
import { FullScreenLoader } from '@/components/ui/skeleton'
import { useChat } from '@/lib/use-chat'
import type { ChannelInfo, ChatMessage, LineMessage } from '@/lib/types'
import { API_BASE } from '@/lib/room'
import { setCustomAvatar } from '@/lib/avatar'

const STORAGE_KEY = 'aura:username'
const PINNED_CHANNEL = '__pinned__'

function toGuestLine(m: ChatMessage): LineMessage {
  return {
    id: `${m.id ?? Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    dbId: m.id,
    type: 'message',
    username: m.username,
    content: m.content ?? '',
    file: m.file,
    timestamp: m.timestamp,
    mine: false,
    reactions: m.reactions ?? [],
    replyTo: m.replyTo,
    replyToContent: m.replyToContent,
    replyToUsername: m.replyToUsername,
  }
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<LineMessage | null>(null)
  const [showLogin, setShowLogin] = useState(false)

  const [guestChannels, setGuestChannels] = useState<ChannelInfo[]>([])
  const [guestLines, setGuestLines] = useState<LineMessage[]>([])
  const [guestActive, setGuestActive] = useState('')

  const isGuest = mounted && !username

  useEffect(() => {
    setMounted(true)
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (saved) setUsername(saved)
  }, [])

  const chat = useChat(mounted ? username : null)

  const fetchGuestChannels = useCallback(() => {
    fetch(`${API_BASE}/channels`)
      .then((r) => r.json())
      .then((d) => {
        if (d.channels?.length) {
          setGuestChannels(d.channels)
          setGuestActive((prev) => prev || d.channels[0].name)
        }
      })
      .catch(() => {})
  }, [])

  const fetchGuestMessages = useCallback((ch: string) => {
    if (!ch || ch === PINNED_CHANNEL) return
    fetch(`${API_BASE}/history?channel=${encodeURIComponent(ch)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.messages) setGuestLines(d.messages.map(toGuestLine))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isGuest) return
    fetchGuestChannels()
  }, [isGuest, fetchGuestChannels])

  useEffect(() => {
    if (!isGuest || !guestActive) return
    fetchGuestMessages(guestActive)
  }, [isGuest, guestActive, fetchGuestMessages])

  const join = async (name: string) => {
    localStorage.setItem(STORAGE_KEY, name)
    setUsername(name)
    setShowLogin(false)
    const res = await fetch(`${API_BASE}/avatar?username=${encodeURIComponent(name)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.avatar) setCustomAvatar(data.avatar)
    }
  }

  const changeName = () => {
    localStorage.removeItem(STORAGE_KEY)
    setGuestLines(chat.lines)
    setGuestChannels(chat.channels)
    setGuestActive(chat.activeChannel || guestActive)
    setUsername(null)
  }

  const handleSend = (content: string, file?: any, replyToId?: number) => {
    chat.send(content, file, replyToId)
    setReplyTo(null)
  }

  const requireLogin = useCallback(() => setShowLogin(true), [])

  const displayName = username ?? ''
  const isReady = chat.status === 'open' && chat.activeChannel !== ''
  const isPinnedView = (isGuest ? guestActive : chat.activeChannel) === PINNED_CHANNEL
  const scrollTrigger = isGuest ? guestActive : chat.activeChannel
  const activeChannelName = isGuest ? (guestActive || 'นกพิราบ') : (chat.activeChannel || 'นกพิราบ')
  const typingUsers = useMemo(() => Object.keys(chat.typing), [chat.typing])
  const pinnedIds = useMemo(() => new Set((chat.pinnedMessages ?? []).map((p) => p.id).filter(Boolean) as number[]), [chat.pinnedMessages])

  if (!mounted) return <FullScreenLoader />

  return (
    <main className="h-[100dvh] w-screen flex items-stretch justify-center">
      <div className="relative flex h-full w-full max-w-7xl glass rounded-none sm:rounded-2xl overflow-hidden">
        <ChannelSidebar
          channels={isGuest ? guestChannels : chat.channels}
          activeChannel={isGuest ? guestActive : chat.activeChannel}
          onSelect={isGuest ? setGuestActive : chat.switchChannel}
          onCreate={isGuest ? requireLogin : chat.createChannel}
          onlineCount={chat.users.length}
          me={displayName}
          onLogout={changeName}
          onAvatarChange={() => {}}
          pinnedCount={chat.pinnedMessages.length}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <ChatHeader
            channelName={isPinnedView ? 'ปักหมุด' : activeChannelName}
            onlineCount={chat.users.length}
            status={isGuest ? 'open' : chat.status}
            onOpenPinned={() => isGuest ? setGuestActive(PINNED_CHANNEL) : chat.switchChannel(PINNED_CHANNEL)}
            pinnedCount={chat.pinnedMessages.length}
            showPinButton={!isPinnedView}
          />
          {isPinnedView ? (
            <PinnedView pins={chat.pinnedMessages ?? []} onUnpin={chat.togglePin} />
          ) : isGuest || !isReady ? (
            <ChatMessages
              lines={isGuest ? guestLines : []}
              typingUsers={[]}
              me={displayName}
              hasMore={false}
              loadingMore={false}
              onLoadMore={() => {}}
              onReply={requireLogin}
              onReact={requireLogin}
              onPin={() => {}}
              pinnedIds={new Set()}
              scrollTrigger={scrollTrigger}
            />
          ) : (
            <>
              {chat.status !== 'open' && (
                <div className="px-4 sm:px-6 py-2 text-[11px] text-amber-200/80 bg-amber-500/10 border-b border-amber-300/10 flex items-center justify-between shrink-0">
                  <span>{chat.status === 'connecting' ? 'กำลังเชื่อมต่อใหม่…' : 'ขาดการเชื่อมต่อ — ลองใหม่'}</span>
                  <button onClick={changeName} className="text-white/50 hover:text-white/80 transition underline underline-offset-2">เปลี่ยนชื่อ</button>
                </div>
              )}
              <ChatMessages
                lines={chat.lines}
                typingUsers={typingUsers}
                me={displayName}
                hasMore={chat.hasMore}
                loadingMore={chat.loadingMore}
                onLoadMore={chat.loadMore}
                onReply={setReplyTo}
                onReact={chat.toggleReaction}
                onPin={chat.togglePin}
                pinnedIds={pinnedIds}
                scrollTrigger={scrollTrigger}
              />
            </>
          )}
          {isGuest && !isPinnedView && (
            <div className="px-4 sm:px-6 py-2 text-[11px] text-white/40 bg-black/20 border-t border-white/8 shrink-0 text-center">
              <button onClick={requireLogin} className="hover:text-white/80 underline underline-offset-2 transition">เข้าสู่ระบบ</button> เพื่อส่งข้อความและรีแอคชั่น
            </div>
          )}
          {!isPinnedView && (
            <MessageInput
              onSend={isGuest ? requireLogin : handleSend}
              onTyping={isGuest ? () => {} : chat.sendTyping}
              disabled={isGuest || chat.status !== 'open'}
              placeholder={isGuest ? 'เข้าสู่ระบบเพื่อส่งข้อความ' : `ส่งข้อความใน ${chat.activeChannel || 'นกพิราบ'}`}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
            />
          )}
        </div>

        {showLogin && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center">
            <div className="relative w-full max-w-md p-4">
              <button
                onClick={() => setShowLogin(false)}
                className="absolute top-6 right-8 z-10 text-white/40 hover:text-white/80 transition text-xs"
              >
                ยกเลิก
              </button>
              <UsernameModal initial={null} roomName="นกพิราบ" onJoin={join} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
