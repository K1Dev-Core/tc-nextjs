'use client'

import { memo, useState, useCallback, type ReactNode } from 'react'
import type { LineMessage, ReactionInfo } from '@/lib/types'
import { avatarColors, formatTime, initials } from '@/lib/avatar'
import { Attachment } from './attachment'
import { CodeBlock } from './code-block'
import { ReactionPicker } from './reaction-picker'
import { emojiUrl } from '@/lib/emoji'

interface MessageBubbleProps {
  line: LineMessage
  grouped: boolean
  me: string
  onReply: (line: LineMessage) => void
  onReact: (messageId: number, emoji: string) => void
}

const FENCE_RE = /```(\w+)?\n?([\s\S]*?)```/g
const INLINE_RE = /`([^`\n]+)`/g

function renderContent(content: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  FENCE_RE.lastIndex = 0

  while ((match = FENCE_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...renderInline(content.slice(lastIndex, match.index), key))
      key += 100
    }
    const lang = match[1] || undefined
    const code = match[2].replace(/\n$/, '')
    nodes.push(<CodeBlock key={`cb-${key++}`} code={code} lang={lang} />)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    nodes.push(...renderInline(content.slice(lastIndex), key))
  }

  return nodes
}

function renderInline(text: string, baseKey: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = baseKey

  INLINE_RE.lastIndex = 0

  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={`t-${key++}`}>{text.slice(lastIndex, match.index)}</span>)
    }
    nodes.push(<code key={`ic-${key++}`} className="inline-code">{match[1]}</code>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`t-${key++}`}>{text.slice(lastIndex)}</span>)
  }

  if (nodes.length === 0) {
    nodes.push(<span key={`t-${key}`}>{text}</span>)
  }

  return nodes
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { void 0 }
  }, [text])

  return (
    <button
      onClick={copy}
      className="opacity-0 group-hover:opacity-100 transition px-2 py-1 rounded-lg text-[10px] text-white/40 hover:text-white/90 hover:bg-white/5"
      aria-label="คัดลอกข้อความ"
    >
      {copied ? '✓' : 'คัดลอก'}
    </button>
  )
}

function ReactionBadges({ reactions, me, onReact, messageId }: { reactions: ReactionInfo[]; me: string; onReact: (id: number, emoji: string) => void; messageId: number }) {
  if (!reactions || reactions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((r) => {
        const mine = r.users.includes(me)
        const url = emojiUrl(r.emoji)
        return (
          <button
            key={r.emoji}
            onClick={() => onReact(messageId, r.emoji)}
            className={`flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full text-[11px] transition
              ${mine ? 'bg-white/15 text-white/90' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            {url ? (
              <img src={url} alt={r.emoji} width={16} height={16} loading="lazy" className="select-none" />
            ) : (
              <span>{r.emoji}</span>
            )}
            <span>{r.users.length}</span>
          </button>
        )
      })}
    </div>
  )
}

function MessageBubbleBase({ line, grouped, me, onReply, onReact }: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false)

  if (line.type === 'system') {
    return (
      <div className="flex justify-center py-1 animate-fadein">
        <div className="bubble-system rounded-full px-3 py-1 text-[11px] text-white/45">
          <span className="font-medium text-white/60">{line.username}</span> {line.content}
        </div>
      </div>
    )
  }

  const mine = line.mine
  const showMeta = !grouped
  const hasReactions = line.reactions && line.reactions.length > 0

  return (
    <div className={`group flex items-end gap-2.5 animate-slidein ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-8 shrink-0">
        {showMeta && !mine && <MiniAvatar name={line.username} />}
      </div>
      <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
        {showMeta && (
          <div className={`text-[11px] mb-1 px-1 ${mine ? 'text-white/40' : 'text-white/55'}`}>
            {mine ? 'คุณ' : line.username} · {formatTime(line.timestamp)}
          </div>
        )}

        {line.replyTo && line.replyToContent && (
          <div className={`mb-1 px-3 py-1.5 rounded-lg text-[11px] text-white/40 border-l-2 border-white/20 bg-white/5 max-w-full ${mine ? 'self-end' : 'self-start'}`}>
            <span className="font-medium text-white/55">{line.replyToUsername}</span>
            <span className="block truncate max-w-[250px]">{line.replyToContent}</span>
          </div>
        )}

        {(line.content || line.file) && (
          <div className="flex items-end gap-1.5">
            {line.content && (
              <div className={`px-3.5 py-2.5 text-[14px] leading-relaxed rounded-2xl whitespace-pre-wrap break-words
                ${mine ? 'bubble-me rounded-br-md text-white' : 'bubble-them rounded-bl-md text-white/90'}
                ${line.file ? 'mb-0' : ''}`}>
                {renderContent(line.content)}
              </div>
            )}
            {line.file && !line.content && <Attachment file={line.file} />}
          </div>
        )}

        {line.file && line.content && <Attachment file={line.file} />}

        {hasReactions && line.dbId && (
          <ReactionBadges reactions={line.reactions!} me={me} onReact={onReact} messageId={line.dbId} />
        )}

        <div className={`flex items-center gap-0.5 mt-0.5 relative ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
          {showPicker && line.dbId && (
            <ReactionPicker
              onPick={(emoji) => { if (line.dbId) onReact(line.dbId, emoji) }}
              onClose={() => setShowPicker(false)}
            />
          )}
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="opacity-0 group-hover:opacity-100 transition px-1.5 py-1 rounded-lg text-[12px] text-white/40 hover:text-white/90 hover:bg-white/5"
            aria-label="รีแอคชั่น"
          >
            <img src={emojiUrl('😂')} alt="react" width={16} height={16} loading="lazy" className="select-none" />
          </button>
          <button
            onClick={() => onReply(line)}
            className="opacity-0 group-hover:opacity-100 transition px-2 py-1 rounded-lg text-[10px] text-white/40 hover:text-white/90 hover:bg-white/5"
            aria-label="ตอบกลับ"
          >
            ตอบกลับ
          </button>
          {line.content && <CopyButton text={line.content} />}
        </div>
      </div>
    </div>
  )
}

function MiniAvatar({ name }: { name: string }) {
  const [from, to] = avatarColors(name)
  return (
    <div
      className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-semibold text-white/90 shrink-0"
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      {initials(name)}
    </div>
  )
}

export const MessageBubble = memo(MessageBubbleBase)
