'use client'

import { useState, useRef, useEffect, memo } from 'react'
import type { ChannelInfo } from '@/lib/types'
import { PigeonMark } from '@/components/ui/pigeon-mark'
import { HashIcon, CloseIcon, MenuIcon, EditIcon, PinIcon } from '@/components/ui/icons'
import { avatarEmojiUrl, setCustomAvatar, getCustomAvatar, myAvatarUrl } from '@/lib/avatar'
import { EMOJI_CATEGORIES, EMOJI_CATEGORY_NAMES, emojiUrlFromChar } from '@/lib/emoji'
import { API_BASE } from '@/lib/room'
import { isSoundEnabled, setSoundEnabled } from '@/lib/sounds'

interface ChannelSidebarProps {
  channels: ChannelInfo[]
  activeChannel: string
  onSelect: (name: string) => void
  onCreate: (name: string) => void
  onlineCount: number
  me: string | null
  onLogout: () => void
  onAvatarChange: () => void
  pinnedCount: number
}

function ChannelSidebarBase({ channels, activeChannel, onSelect, onCreate, onlineCount, me, onLogout, onAvatarChange, pinnedCount }: ChannelSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [avatarCat, setAvatarCat] = useState(EMOJI_CATEGORY_NAMES[0])
  const [avatarVersion, setAvatarVersion] = useState(0)
  const [soundOn, setSoundOn] = useState(isSoundEnabled())
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (name: string) => {
    onSelect(name)
    setMobileOpen(false)
  }

  const currentAvatarUrl = me ? myAvatarUrl(me + avatarVersion) : ''

  const handlePickAvatar = async (emoji: string) => {
    setCustomAvatar(emoji)
    setAvatarVersion((v) => v + 1)
    onAvatarChange()
    setShowAvatarPicker(false)
    if (me) {
      try { await fetch(`${API_BASE}/avatar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: me, avatar: emoji }) }) } catch {}
    }
  }

  const sidebarContent = (
    <>
      <div className="px-3 pt-4 pb-3 flex items-center gap-2.5">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-white/8 border border-white/10 shrink-0">
          <PigeonMark size={18} className="text-white/90" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold tracking-tight truncate">นกพิราบ</div>
          <div className="text-[10px] text-white/35">{onlineCount} คนออนไลน์</div>
        </div>
      </div>

      <div className="px-3 pb-1">
        <div className="text-[10px] uppercase tracking-wider text-white/30 px-1">ห้อง</div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-slim px-2 space-y-0.5">
        <button
          onClick={() => handleSelect('__pinned__')}
          className={`w-full flex items-center gap-2 rounded-lg transition
            ${activeChannel === '__pinned__' ? 'bg-white/10' : 'hover:bg-white/5'}
            px-2.5 py-2 mb-1`}
          title="ข้อความปักหมุด"
        >
          <PinIcon className="w-4 h-4 text-amber-400/70 shrink-0" />
          <span className={`text-[13px] truncate ${activeChannel === '__pinned__' ? 'text-white/90 font-medium' : 'text-white/55'}`}>
            ปักหมุด
          </span>
          {pinnedCount > 0 && (
            <span className="ml-auto text-[10px] text-white/30 shrink-0">{pinnedCount}</span>
          )}
        </button>
        {channels.map((ch) => {
          const active = ch.name === activeChannel
          return (
            <button
              key={ch.id}
              onClick={() => handleSelect(ch.name)}
              className={`w-full flex items-center gap-2 rounded-lg transition
                ${active ? 'bg-white/10' : 'hover:bg-white/5'}
                px-2.5 py-2`}
              title={ch.name}
            >
              <HashIcon className="w-4 h-4 text-white/40 shrink-0" />
              <span className={`text-[13px] truncate ${active ? 'text-white/90 font-medium' : 'text-white/55'}`}>
                {ch.name}
              </span>
            </button>
          )
        })}
      </div>

      <div className="px-2 py-2 border-t border-white/8 relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-2.5 rounded-lg hover:bg-white/5 transition px-2 py-2"
        >
          {me && (
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/6 border border-white/8 shrink-0">
              <img src={currentAvatarUrl} alt={me} width={24} height={24} loading="lazy" className="pointer-events-none mx-auto mt-1" key={avatarVersion} />
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <div className="text-[13px] font-medium text-white/90 truncate">{me ?? '—'}</div>
            <div className="text-[10px] text-emerald-400/70 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ออนไลน์
            </div>
          </div>
        </button>

        {showUserMenu && !showAvatarPicker && (
          <div className="absolute bottom-full left-2 right-2 mb-1 glass rounded-xl py-1 animate-slideup z-50">
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="w-full px-3 py-2 text-left text-[13px] text-white/80 hover:bg-white/5 rounded-lg transition flex items-center gap-2"
            >
              <EditIcon className="w-4 h-4 text-white/50" />
              แก้ไขโปรไฟล์
            </button>
            <button
              onClick={() => { const v = !soundOn; setSoundOn(v); setSoundEnabled(v) }}
              className="w-full px-3 py-2 text-left text-[13px] text-white/80 hover:bg-white/5 rounded-lg transition flex items-center gap-2"
            >
              {soundOn ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/50">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/50">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
              เสียง{soundOn ? 'เปิด' : 'ปิด'}
            </button>
            <button
              onClick={() => { setShowUserMenu(false); onLogout() }}
              className="w-full px-3 py-2 text-left text-[13px] text-red-300/90 hover:bg-white/5 rounded-lg transition flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              ออกจากระบบ
            </button>
          </div>
        )}

        {showAvatarPicker && (
          <div className="absolute bottom-full left-2 right-2 mb-1 glass rounded-xl animate-slideup z-50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
              <span className="text-[12px] font-medium text-white/80">เลือกอวตาร</span>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="grid place-items-center w-6 h-6 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-1 px-2 py-1.5 border-b border-white/8 overflow-x-auto scroll-slim">
              {EMOJI_CATEGORY_NAMES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAvatarCat(cat)}
                  className={`px-2 py-1 rounded-lg text-[10px] whitespace-nowrap transition
                    ${avatarCat === cat ? 'bg-white/15 text-white/90' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="max-h-48 overflow-y-auto scroll-slim p-2">
              <div className="grid grid-cols-6 gap-1">
                {(EMOJI_CATEGORIES[avatarCat] || []).map((e) => (
                  <button
                    key={e.char + e.name}
                    onClick={() => handlePickAvatar(e.char)}
                    className="aspect-square grid place-items-center rounded-lg hover:bg-white/10 active:scale-90 transition"
                  >
                    <img src={emojiUrlFromChar(e.char)} alt={e.name} width={24} height={24} loading="lazy" className="select-none pointer-events-none" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      <div className="hidden lg:flex flex-col h-full w-48 border-r border-white/8 bg-black/30 shrink-0">
        {sidebarContent}
      </div>

      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden grid place-items-center w-10 h-10 rounded-xl bg-white/8 border border-white/10 text-white/70 hover:text-white/90 transition shrink-0 absolute top-3 left-3 z-30"
        aria-label="เมนูห้อง"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadein"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#1a1c24] border-r border-white/8 flex flex-col animate-slidein">
            <div className="flex items-center justify-between px-3 pt-4 pb-2">
              <span className="text-[11px] uppercase tracking-wider text-white/30">ห้อง</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="grid place-items-center w-8 h-8 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition"
                aria-label="ปิด"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}

export const ChannelSidebar = memo(ChannelSidebarBase)
