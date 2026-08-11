'use client'

import { memo, useMemo, useState } from 'react'
import type { ChannelInfo } from '@/lib/types'
import type { ThemeName } from '@/lib/theme'

interface CommandPaletteProps {
  open: boolean
  channels: ChannelInfo[]
  activeChannel: string
  theme: ThemeName
  onClose: () => void
  onSelectChannel: (name: string) => void
  onOpenPinned: () => void
  onOpenUpload: () => void
  onFocusInput: () => void
  onSetTheme: (theme: ThemeName) => void
}

const THEMES: ThemeName[] = ['aurora', 'matrix', 'minimal', 'cyber']

function CommandPaletteBase({ open, channels, activeChannel, theme, onClose, onSelectChannel, onOpenPinned, onOpenUpload, onFocusInput, onSetTheme }: CommandPaletteProps) {
  const [query, setQuery] = useState('')

  const actions = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = [
      { id: 'focus', label: 'Focus input', hint: 'พิมพ์ต่อ', run: onFocusInput },
      { id: 'upload', label: 'Upload file', hint: 'เปิดแนบไฟล์', run: onOpenUpload },
      { id: 'pins', label: 'Open pinned', hint: 'ดูปักหมุด', run: onOpenPinned },
      ...THEMES.map((t) => ({ id: `theme-${t}`, label: `Theme: ${t}${theme === t ? ' ✓' : ''}`, hint: 'เปลี่ยนธีม', run: () => onSetTheme(t) })),
      ...channels.map((ch) => ({ id: `ch-${ch.id}`, label: `# ${ch.name}${activeChannel === ch.name ? ' ✓' : ''}`, hint: 'เปลี่ยนห้อง', run: () => onSelectChannel(ch.name) })),
    ]
    if (!q) return items.slice(0, 10)
    return items.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(q)).slice(0, 12)
  }, [activeChannel, channels, onFocusInput, onOpenPinned, onOpenUpload, onSelectChannel, onSetTheme, query, theme])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-[70] bg-black/45 backdrop-blur-sm p-4 grid place-items-start sm:place-items-center" onClick={onClose}>
      <div className="w-full max-w-lg glass rounded-2xl overflow-hidden shadow-2xl animate-scalein" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-white/8">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'Enter' && actions[0]) { actions[0].run(); onClose() }
            }}
            placeholder="Command… channel / theme / upload"
            className="w-full bg-transparent outline-none text-sm text-white/90 placeholder:text-white/30"
          />
        </div>
        <div className="max-h-[55vh] overflow-y-auto scroll-slim p-2">
          {actions.map((item) => (
            <button
              key={item.id}
              onClick={() => { item.run(); onClose() }}
              className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/8 transition"
            >
              <span className="text-sm text-white/85 truncate">{item.label}</span>
              <span className="text-[11px] text-white/35 shrink-0">{item.hint}</span>
            </button>
          ))}
          {actions.length === 0 && <div className="px-3 py-8 text-center text-sm text-white/35">ไม่เจอคำสั่ง</div>}
        </div>
        <div className="px-4 py-2 border-t border-white/8 text-[10px] text-white/30 flex justify-between">
          <span>Enter run</span><span>Esc close</span><span>⌘K open</span>
        </div>
      </div>
    </div>
  )
}

export const CommandPalette = memo(CommandPaletteBase)
