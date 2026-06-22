'use client'

import { useState } from 'react'
import type { ChannelInfo } from '@/lib/types'
import { PigeonMark } from '@/components/ui/pigeon-mark'
import { HashIcon, PlusIcon, CloseIcon, MenuIcon } from '@/components/ui/icons'

interface ChannelSidebarProps {
  channels: ChannelInfo[]
  activeChannel: string
  onSelect: (name: string) => void
  onCreate: (name: string) => void
  onlineCount: number
}

export function ChannelSidebar({ channels, activeChannel, onSelect, onCreate, onlineCount }: ChannelSidebarProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newName.trim().slice(0, 50)
    if (name) {
      onCreate(name)
      setNewName('')
      setShowCreate(false)
    }
  }

  const handleSelect = (name: string) => {
    onSelect(name)
    setMobileOpen(false)
  }

  const sidebarContent = (
    <>
      <div className="px-2 sm:px-3 pt-4 pb-3 flex items-center justify-center lg:justify-start lg:gap-2.5 lg:px-4">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-white/8 border border-white/10 shrink-0">
          <PigeonMark size={18} className="text-white/90" />
        </div>
        <div className="hidden lg:block min-w-0">
          <div className="text-[13px] font-semibold tracking-tight truncate">นกพิราบ</div>
          <div className="text-[10px] text-white/35">{onlineCount} คนออนไลน์</div>
        </div>
      </div>

      <div className="px-2 lg:px-3 pb-1 hidden lg:block">
        <div className="text-[10px] uppercase tracking-wider text-white/30 px-1">ห้อง</div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-slim px-1.5 lg:px-2 space-y-0.5">
        {channels.map((ch) => {
          const active = ch.name === activeChannel
          return (
            <button
              key={ch.id}
              onClick={() => handleSelect(ch.name)}
              className={`w-full flex items-center gap-2 rounded-lg transition group
                ${active ? 'bg-white/10' : 'hover:bg-white/5'}
                px-2 py-2 justify-center lg:justify-start`}
              title={ch.name}
            >
              <HashIcon className="w-4 h-4 text-white/40 shrink-0" />
              <span className={`hidden lg:block text-[13px] truncate ${active ? 'text-white/90 font-medium' : 'text-white/55'}`}>
                {ch.name}
              </span>
            </button>
          )
        })}
      </div>

      <div className="px-1.5 lg:px-2 py-2 border-t border-white/8">
        {showCreate ? (
          <form onSubmit={submit} className="flex items-center gap-1.5 px-1">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ชื่อห้อง"
              maxLength={50}
              className="hidden lg:block flex-1 min-w-0 glass-soft rounded-lg px-2 py-1.5 text-[12px] outline-none focus:ring-1 focus:ring-white/20"
            />
            <button type="submit" className="grid place-items-center w-7 h-7 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition shrink-0" aria-label="สร้าง">
              <PlusIcon className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => { setShowCreate(false); setNewName('') }} className="grid place-items-center w-7 h-7 rounded-lg text-white/40 hover:text-white/80 transition shrink-0" aria-label="ยกเลิก">
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center gap-2 rounded-lg hover:bg-white/5 transition px-2 py-2 justify-center lg:justify-start"
            title="สร้างห้องใหม่"
          >
            <PlusIcon className="w-4 h-4 text-white/40 shrink-0" />
            <span className="hidden lg:block text-[12px] text-white/40">ห้องใหม่</span>
          </button>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <div className="hidden lg:flex flex-col h-full w-56 border-r border-white/8 bg-black/30 shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: toggle button in header area */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden grid place-items-center w-10 h-10 rounded-xl bg-white/8 border border-white/10 text-white/70 hover:text-white/90 transition shrink-0 absolute top-3 left-3 z-30"
        aria-label="เมนูห้อง"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      {/* Mobile: overlay drawer */}
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
