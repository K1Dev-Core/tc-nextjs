'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import { CloseIcon } from '@/components/ui/icons'
import { REMOTE_SFX, SFX_COOLDOWN_MS, type RemoteSfxItem } from '@/lib/remote-sfx'

const SFX_COOLDOWN_KEY = 'aura:sfx-cooldown-until'
import { isSoundEnabled, preloadRemoteSfx, SOUND_CHANGE_EVENT } from '@/lib/sounds'

interface SfxPickerModalProps {
  onPick: (item: RemoteSfxItem) => boolean
  onClose: () => void
}

function SfxPickerModalBase({ onPick, onClose }: SfxPickerModalProps) {
  const [soundOn, setSoundOn] = useState(isSoundEnabled())
  const [cooldownUntil, setCooldownUntil] = useState(() => {
    if (typeof window === 'undefined') return 0
    const saved = Number(localStorage.getItem(SFX_COOLDOWN_KEY) ?? '0')
    return Number.isFinite(saved) ? saved : 0
  })
  const [now, setNow] = useState(() => Date.now())
  const cooldownLeft = Math.max(0, cooldownUntil - now)
  const locked = !soundOn || cooldownLeft > 0
  const cooldownText = useMemo(() => cooldownLeft > 0 ? `${Math.ceil(cooldownLeft / 1000)}s` : '', [cooldownLeft])

  useEffect(() => {
    preloadRemoteSfx(REMOTE_SFX.map((item) => item.url))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (cooldownUntil > Date.now()) return
    try { localStorage.removeItem(SFX_COOLDOWN_KEY) } catch {}
  }, [cooldownUntil, cooldownLeft])

  useEffect(() => {
    const handler = (e: Event) => setSoundOn(Boolean((e as CustomEvent<boolean>).detail))
    window.addEventListener(SOUND_CHANGE_EVENT, handler)
    return () => window.removeEventListener(SOUND_CHANGE_EVENT, handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const play = (item: RemoteSfxItem) => {
    if (locked) return
    if (!onPick(item)) return
    const next = Date.now() + SFX_COOLDOWN_MS
    setNow(Date.now())
    setCooldownUntil(next)
    try { localStorage.setItem(SFX_COOLDOWN_KEY, String(next)) } catch {}
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadein" />
      <div
        className="relative glass rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl max-h-[78vh] flex flex-col animate-slideup overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
          <div>
            <div className="text-[14px] font-semibold">SFX Meme</div>
            <div className="text-[10px] text-white/35">
              {!soundOn ? 'ปิดเสียงอยู่ · เปิดเสียงก่อนถึงกดได้' : cooldownLeft > 0 ? `คูลดาวน์ ${cooldownText}` : 'พร้อมเล่น · คูลดาวน์ 1 นาที'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center w-8 h-8 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition"
            aria-label="ปิด"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto scroll-slim">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REMOTE_SFX.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => play(item)}
                disabled={locked}
                title={soundOn ? item.name : 'เสียงปิดอยู่'}
                className="group flex items-center gap-3 rounded-xl glass-soft px-3 py-2.5 text-left transition hover:bg-white/10 active:scale-[0.99] disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <span
                  className="grid place-items-center w-9 h-9 rounded-lg text-lg text-white shrink-0 shadow-inner"
                  style={{ backgroundColor: item.color }}
                >
                  {cooldownLeft > 0 ? cooldownText : item.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-white/85 font-medium">{item.name}</span>
                  <span className="block truncate text-[10px] text-white/32">คูลดาวน์ 1 นาที</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const SfxPickerModal = memo(SfxPickerModalBase)
