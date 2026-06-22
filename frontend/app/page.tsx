'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChannelSidebar } from '@/components/chat/channel-sidebar'
import { ChatHeader } from '@/components/chat/chat-header'
import { ChatMessages } from '@/components/chat/chat-messages'
import { MessageInput } from '@/components/chat/message-input'
import { UsernameModal } from '@/components/auth/username-modal'
import { ChatSkeleton, FullScreenLoader } from '@/components/ui/skeleton'
import { useChat } from '@/lib/use-chat'
import type { LineMessage } from '@/lib/types'

const STORAGE_KEY = 'aura:username'

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<LineMessage | null>(null)

  useEffect(() => {
    setMounted(true)
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (saved) setUsername(saved)
  }, [])

  const {
    lines, users, typing, status, hasMore, loadingMore, loadMore,
    send, sendTyping, toggleReaction, channels, activeChannel, switchChannel, createChannel
  } = useChat(mounted ? username : null)

  const typingUsers = useMemo(() => Object.keys(typing), [typing])
  const isReady = status === 'open' && activeChannel !== ''

  const join = (name: string) => {
    localStorage.setItem(STORAGE_KEY, name)
    setUsername(name)
  }

  const changeName = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUsername(null)
  }

  const handleSend = (content: string, file?: any, replyToId?: number) => {
    send(content, file, replyToId)
    setReplyTo(null)
  }

  if (!mounted) {
    return <FullScreenLoader />
  }

  return (
    <main className="h-[100dvh] w-screen flex items-stretch justify-center">
      <div className="flex h-full w-full max-w-7xl glass rounded-none sm:rounded-2xl overflow-hidden">
        {username ? (
          <>
            <ChannelSidebar
              channels={channels}
              activeChannel={activeChannel}
              onSelect={switchChannel}
              onCreate={createChannel}
              onlineCount={users.length}
            />
            <div className="flex flex-col flex-1 min-w-0">
              <ChatHeader
                channelName={activeChannel || 'นกพิราบ'}
                onlineCount={users.length}
                status={status}
              />
              {!isReady ? (
                <ChatSkeleton />
              ) : (
                <>
                  {status !== 'open' && (
                    <div className="px-4 sm:px-6 py-2 text-[11px] text-amber-200/80 bg-amber-500/10 border-b border-amber-300/10 flex items-center justify-between shrink-0">
                      <span>{status === 'connecting' ? 'กำลังเชื่อมต่อใหม่…' : 'ขาดการเชื่อมต่อ — ลองใหม่'}</span>
                      <button onClick={changeName} className="text-white/50 hover:text-white/80 transition underline underline-offset-2">
                        เปลี่ยนชื่อ
                      </button>
                    </div>
                  )}
                  <ChatMessages
                    lines={lines}
                    typingUsers={typingUsers}
                    me={username}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    onReply={setReplyTo}
                    onReact={toggleReaction}
                    scrollTrigger={activeChannel}
                  />
                  <MessageInput
                    onSend={handleSend}
                    onTyping={sendTyping}
                    disabled={status !== 'open'}
                    placeholder={`ส่งข้อความใน #${activeChannel || 'นกพิราบ'}`}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                  />
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center">
            <UsernameModal initial={null} roomName="นกพิราบ" onJoin={join} />
          </div>
        )}
      </div>
    </main>
  )
}
