'use client'

import { memo, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { LineMessage, ReactionInfo } from '@/lib/types'
import { formatTime, avatarEmojiUrl } from '@/lib/avatar'
import { Attachment } from './attachment'
import { CodeBlock } from './code-block'
import { ReactionPicker } from './reaction-picker'
import { LinkPreview } from './link-preview'
import { emojiUrl, emojiUrlFromChar, EMOJI_MAP } from '@/lib/emoji'
import { PinIcon } from '@/components/ui/icons'

interface MessageBubbleProps {
  line: LineMessage
  grouped: boolean
  me: string
  onReply: (line: LineMessage) => void
  onReact: (messageId: number, emoji: string) => void
  onPin: (messageId: number) => void
  isPinned: boolean
}

const FENCE_RE = /```(\w+)?\n?([\s\S]*?)```/g
const INLINE_RE = /`([^`\n]+)`/g
const URL_RE = /https?:\/\/[^\s<>"']+/gi

export function extractUrl(text: string): string {
  URL_RE.lastIndex = 0
  const m = URL_RE.exec(text)
  return m ? m[0] : ''
}

// ponytail: module-level cache, cap 2000 entries (FIFO eviction)
const contentCache = new Map<string, ReactNode[]>()
function renderContentCached(content: string): ReactNode[] {
  let cached = contentCache.get(content)
  if (cached) return cached
  cached = renderContent(content)
  if (contentCache.size > 2000) {
    const first = contentCache.keys().next().value
    if (first) contentCache.delete(first)
  }
  contentCache.set(content, cached)
  return cached
}

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

function renderTextWithEmoji(text: string, baseKey: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let key = baseKey
  let buf = ''

  for (let i = 0; i < text.length;) {
    const cp = text.codePointAt(i)!
    const char = String.fromCodePoint(cp)
    const charLen = cp > 0xFFFF ? 2 : 1

    let matched = false
    if (i + charLen < text.length) {
      const twoChar = text.slice(i, i + charLen + (text.codePointAt(i + charLen)! > 0xFFFF ? 2 : 1))
      const url = emojiUrlFromChar(twoChar)
      if (url) {
        if (buf) { nodes.push(<span key={`t-${key++}`}>{buf}</span>); buf = '' }
        nodes.push(<img key={`e-${key++}`} src={url} alt={twoChar} width={20} height={20} className="inline-block align-middle -mt-0.5 select-none" loading="lazy" />)
        i += twoChar.length
        matched = true
      }
    }

    if (!matched) {
      const url = emojiUrlFromChar(char)
      if (url) {
        if (buf) { nodes.push(<span key={`t-${key++}`}>{buf}</span>); buf = '' }
        nodes.push(<img key={`e-${key++}`} src={url} alt={char} width={20} height={20} className="inline-block align-middle -mt-0.5 select-none" loading="lazy" />)
      } else {
        buf += char
      }
      i += charLen
    }
  }
  if (buf) nodes.push(<span key={`t-${key++}`}>{buf}</span>)
  if (nodes.length === 0) nodes.push(<span key={`t-${key}`}>{text}</span>)
  return nodes
}

function renderInline(text: string, baseKey: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = baseKey

  URL_RE.lastIndex = 0

  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...renderInlineCode(text.slice(lastIndex, match.index), key))
      key += 100
    }
    nodes.push(
      <a key={`url-${key++}`} href={match[0]} target="_blank" rel="noopener noreferrer"
         className="text-sky-400 hover:text-sky-300 underline decoration-sky-400/40 break-all">
        {match[0]}
      </a>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(...renderInlineCode(text.slice(lastIndex), key))
  }

  if (nodes.length === 0) {
    nodes.push(...renderInlineCode(text, key))
  }

  return nodes
}

function renderInlineCode(text: string, baseKey: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = baseKey

  INLINE_RE.lastIndex = 0

  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...renderTextWithEmoji(text.slice(lastIndex, match.index), key))
      key += 100
    }
    nodes.push(<code key={`ic-${key++}`} className="inline-code">{match[1]}</code>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(...renderTextWithEmoji(text.slice(lastIndex), key))
  }

  if (nodes.length === 0) {
    nodes.push(...renderTextWithEmoji(text, key))
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

function MessageBubbleBase({ line, grouped, me, onReply, onReact, onPin, isPinned }: MessageBubbleProps) {
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
  const linkUrl = useMemo(() => line.content ? extractUrl(line.content) : '', [line.content])

  return (
    <div className={`group flex items-end gap-2.5 animate-slidein ${mine ? 'flex-row-reverse' : 'flex-row'}`} style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 72px' }}>
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
                {renderContentCached(line.content)}
              </div>
            )}
            {line.file && !line.content && <Attachment file={line.file} />}
          </div>
        )}

        {line.file && line.content && <Attachment file={line.file} />}

        {linkUrl && <LinkPreview url={linkUrl} />}

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
          {line.dbId && (
            <button
              onClick={() => { if (line.dbId) onPin(line.dbId) }}
              className={`opacity-0 group-hover:opacity-100 transition px-1.5 py-1 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/5 ${isPinned ? 'opacity-100 text-amber-300' : ''}`}
              aria-label="ปักหมุด"
            >
              <PinIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {line.content && <CopyButton text={line.content} />}
        </div>
      </div>
    </div>
  )
}

function MiniAvatar({ name }: { name: string }) {
  const url = avatarEmojiUrl(name)
  return (
    <div className="w-8 h-8 rounded-full grid place-items-center bg-white/6 border border-white/8 shrink-0 overflow-hidden">
      <img src={url} alt={name} width={24} height={24} loading="lazy" className="pointer-events-none" />
    </div>
  )
}

export const MessageBubble = memo(MessageBubbleBase)
