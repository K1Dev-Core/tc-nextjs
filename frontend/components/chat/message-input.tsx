'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { SendIcon, PaperclipIcon, SpinnerIcon, CloseIcon, EmojiIcon } from '@/components/ui/icons'
import { useUpload } from '@/lib/use-upload'
import { fileUrl, formatBytes, isImage } from '@/lib/file-utils'
import { QUICK_EMOJIS, EMOJI_MAP, emojiUrl } from '@/lib/emoji'
import type { FileMeta, LineMessage } from '@/lib/types'
import { codeFence, detectPastedCode } from '@/lib/code-paste'


const EmojiPickerModal = dynamic(
  () => import('./emoji-picker-modal').then((mod) => mod.EmojiPickerModal),
  { ssr: false },
)

interface MessageInputProps {
  onSend: (content: string, file?: FileMeta, replyTo?: number) => void
  onTyping: () => void
  disabled: boolean
  placeholder?: string
  replyTo: LineMessage | null
  onCancelReply: () => void
  draftKey: string
  me: string
  onPinCommand?: (messageId: number) => void
}

const DRAFT_PREFIX = 'aura:draft:'
const NAMED_EMOJIS = QUICK_EMOJIS.map((char) => ({ char, name: EMOJI_MAP[char]?.name.toLowerCase() ?? char.toLowerCase() }))

export function MessageInput({ onSend, onTyping, disabled, placeholder, replyTo, onCancelReply, draftKey, me, onPinCommand }: MessageInputProps) {
  const [value, setValue] = useState('')
  const [pendingFile, setPendingFile] = useState<FileMeta | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const skipDraftSave = useRef(false)
  const { loading, progress, error, upload, reset } = useUpload()
  const [emojiQuery, setEmojiQuery] = useState('')

  const resize = () => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  useEffect(() => { resize() }, [value])

  useEffect(() => {
    if (!draftKey || typeof window === 'undefined') return
    skipDraftSave.current = true
    setValue(localStorage.getItem(`${DRAFT_PREFIX}${draftKey}`) ?? '')
    setPendingFile(null)
    reset()
  }, [draftKey, reset])

  useEffect(() => {
    if (!draftKey || typeof window === 'undefined') return
    if (skipDraftSave.current) {
      skipDraftSave.current = false
      return
    }
    const key = `${DRAFT_PREFIX}${draftKey}`
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  }, [draftKey, value])

  useEffect(() => {
    const openFile = () => {
      if (!disabled && !loading) fileInputRef.current?.click()
    }
    const focusInput = () => taRef.current?.focus()
    window.addEventListener('chat:open-file', openFile)
    window.addEventListener('chat:focus-input', focusInput)
    return () => {
      window.removeEventListener('chat:open-file', openFile)
      window.removeEventListener('chat:focus-input', focusInput)
    }
  }, [disabled, loading])

  useEffect(() => {
    if (replyTo) {
      taRef.current?.focus()
    }
  }, [replyTo])

  const handleFile = useCallback(async (file: File) => {
    const meta = await upload(file)
    if (meta) setPendingFile(meta)
  }, [upload])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled || loading) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const files = e.clipboardData.files
    if (files.length > 0 && !disabled && !loading) {
      e.preventDefault()
      handleFile(files[0])
      return
    }

    if (disabled) return
    const pastedText = e.clipboardData.getData('text/plain')
    const detected = detectPastedCode(pastedText)
    if (!detected) return

    e.preventDefault()
    const el = taRef.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const fenced = codeFence(detected)
    const nextValue = value.slice(0, start) + fenced + value.slice(end)
    setValue(nextValue)
    onTyping()

    requestAnimationFrame(() => {
      const cursor = start + fenced.length
      el?.focus()
      el?.setSelectionRange(cursor, cursor)
      resize()
    })
  }

  const insertEmoji = (emoji: string) => {
    const el = taRef.current
    if (!el) {
      setValue((v) => v + emoji)
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const newValue = value.slice(0, start) + emoji + value.slice(end)
    setValue(newValue)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
      resize()
    })
  }

  const applyEmojiToken = (emoji: string) => {
    const el = taRef.current
    if (!el) return
    const pos = el.selectionStart ?? value.length
    const before = value.slice(0, pos)
    const match = before.match(/:([a-z0-9_+-]{1,24})$/i)
    if (!match) return insertEmoji(emoji)
    const start = pos - match[0].length
    const nextValue = value.slice(0, start) + emoji + ' ' + value.slice(pos)
    setValue(nextValue)
    setEmojiQuery('')
    requestAnimationFrame(() => {
      const cursor = start + emoji.length + 1
      el.focus()
      el.setSelectionRange(cursor, cursor)
      resize()
    })
  }

  const submit = () => {
    let text = value.trim()
    if (!text && !pendingFile) return
    if (disabled) return

    if (text.startsWith('/')) {
      const [cmdRaw, ...rest] = text.slice(1).split(/\s+/)
      const cmd = cmdRaw.toLowerCase()
      const arg = rest.join(' ').trim()
      if (cmd === 'clear') {
        setValue('')
        setPendingFile(null)
        reset()
        return
      }
      if (cmd === 'shrug') text = `${arg ? `${arg} ` : ''}¯\\_(ツ)_/¯`
      if (cmd === 'me') text = arg ? `• ${me || 'คุณ'} ${arg}` : `• ${me || 'คุณ'}`
      if (cmd === 'gif') text = arg ? `https://giphy.com/search/${encodeURIComponent(arg)}` : 'https://giphy.com/explore/reaction'
      if (cmd === 'pin' && replyTo?.dbId && onPinCommand) {
        onPinCommand(replyTo.dbId)
        setValue('')
        onCancelReply()
        return
      }
    }

    onSend(text, pendingFile ?? undefined, replyTo?.dbId)
    setValue('')
    setPendingFile(null)
    reset()
    onCancelReply()
    requestAnimationFrame(() => { taRef.current?.focus(); resize() })
  }

  return (
    <div
      className="px-3 sm:px-5 md:px-6 pb-4 sm:pb-5 pt-3 border-t border-white/8 bg-black/10 shrink-0"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="glass rounded-2xl px-6 py-4 text-sm text-white/80">
            วางไฟล์ที่นี่เพื่ออัปโหลด
          </div>
        </div>
      )}

      {replyTo && (
        <div className="mb-2 flex items-center gap-2 glass-soft rounded-xl px-3 py-2 animate-fadein">
          <div className="w-1 h-8 rounded-full bg-white/30 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-white/40">ตอบกลับ {replyTo.username}</div>
            <div className="text-[12px] text-white/60 truncate">{replyTo.content || (replyTo.file ? '📎 ไฟล์แนบ' : '')}</div>
          </div>
          <button onClick={onCancelReply} className="text-white/40 hover:text-white/80 transition shrink-0" aria-label="ยกเลิกการตอบกลับ">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-2 flex items-center justify-between text-[11px] text-red-300 bg-red-500/10 rounded-lg px-3 py-1.5">
          <span>{error}</span>
          <button onClick={reset} className="text-white/50 hover:text-white/80"><CloseIcon className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {pendingFile && (
        <div className="mb-2 flex items-center gap-2.5 glass-soft rounded-xl px-3 py-2 animate-fadein">
          {isImage(pendingFile) ? (
            <img src={fileUrl(pendingFile.url)} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white/8 grid place-items-center shrink-0">
              <PaperclipIcon className="w-5 h-5 text-white/60" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs text-white/80 truncate">{pendingFile.name}</div>
            <div className="text-[10px] text-white/40">{formatBytes(pendingFile.size)} · พร้อมส่ง</div>
          </div>
          <button onClick={() => { setPendingFile(null); reset() }} className="text-white/40 hover:text-white/80 transition shrink-0" aria-label="ยกเลิก">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading && (
        <div className="mb-2 glass-soft rounded-xl px-3 py-2 animate-fadein">
          <div className="flex items-center justify-between text-[11px] text-white/60 mb-1.5">
            <span className="flex items-center gap-1.5">
              <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
              กำลังอัปโหลด…
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-white/40 to-white/70 transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {showEmoji && (
        <EmojiPickerModal
          onPick={insertEmoji}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {emojiQuery && (
        <div className="mb-2 glass rounded-2xl p-1.5 flex flex-wrap gap-1 animate-slideup">
          {NAMED_EMOJIS.filter((item) => item.name.includes(emojiQuery)).slice(0, 6).map((item) => (
            <button
              key={item.char}
              type="button"
              onClick={() => applyEmojiToken(item.char)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] text-white/70 hover:bg-white/10 transition"
            >
              <img src={emojiUrl(item.char)} alt={item.char} width={18} height={18} loading="lazy" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="glass-soft rounded-2xl flex items-end gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 focus-within:ring-2 focus-within:ring-white/15 transition">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="grid place-items-center w-9 h-9 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition shrink-0 disabled:opacity-30"
          aria-label="แนบไฟล์"
        >
          <PaperclipIcon className="w-5 h-5" />
        </button>
        <input ref={fileInputRef} type="file" onChange={onFileChange} className="hidden" />
        <button
          type="button"
          onClick={() => setShowEmoji(true)}
          disabled={disabled}
          className="grid place-items-center w-9 h-9 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition shrink-0 disabled:opacity-30"
          aria-label="อิโมจิ"
        >
          <EmojiIcon className="w-5 h-5" />
        </button>
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value
            setValue(next)
            onTyping()
            const pos = e.target.selectionStart ?? next.length
            const match = next.slice(0, pos).match(/:([a-z0-9_+-]{1,24})$/i)
            setEmojiQuery(match?.[1].toLowerCase() ?? '')
          }}
          onPaste={onPaste}
          onKeyDown={(e) => {
            const suggestions = emojiQuery
              ? NAMED_EMOJIS.filter((item) => item.name.includes(emojiQuery)).slice(0, 6)
              : []
            if ((e.key === 'Tab' || e.key === 'Enter') && suggestions.length > 0 && emojiQuery) {
              e.preventDefault()
              applyEmojiToken(suggestions[0].char)
              return
            }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          }}
          placeholder={placeholder ?? 'พิมพ์ข้อความ'}
          className="flex-1 bg-transparent outline-none resize-none text-[14px] leading-relaxed py-1.5 max-h-36 scroll-slim disabled:opacity-40 min-w-0"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || loading || (!value.trim() && !pendingFile)}
          className="grid place-items-center w-9 h-9 rounded-xl bg-white/10 text-white/90 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition shrink-0"
          aria-label="ส่ง"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-1.5 px-1 text-[10px] text-white/25 hidden sm:flex items-center justify-between">
        <span>Enter เพื่อส่ง · Shift+Enter ขึ้นบรรทัด</span>
        <span>ลากไฟล์มาวาง หรือ Ctrl+V เพื่อวาง · สูงสุด 50MB</span>
      </div>
    </div>
  )
}
