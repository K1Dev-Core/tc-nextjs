'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import { CloseIcon } from '@/components/ui/icons'
import { REMOTE_SFX, SFX_COOLDOWN_MS, type RemoteSfxItem } from '@/lib/remote-sfx'
import { isSoundEnabled, preloadRemoteSfx, SOUND_CHANGE_EVENT } from '@/lib/sounds'

interface SfxPickerModalProps {
  onPick: (item: RemoteSfxItem) => boolean
  onClose: () => void
}

function SfxPickerModalBase({ onPick, onClose }: SfxPickerModalProps) {
  const [soundOn, setSoundOn] = useState(isSoundEnabled())
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const cooldownLeft = Math.max(0, cooldownUntil - now)
  const locked = !soundOn || cooldownLeft > 0
  const cooldownText = useMemo(() => cooldownLeft > 0 ? `${Math.ceil(cooldownLeft / 1000)}s` : '', [cooldownLeft])

  useEffect(() => {
    preloadRemoteSfx(REMOTE_SFX.map((item) => item.url))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 150)
    return () => clearInterval(t)
  }, [])

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
              {!soundOn ? 'ปิดเสียงอยู่ · เปิดเสียงก่อนถึงกดได้' : cooldownLeft > 0 ? `คูลดาวน์ ${cooldownText}` : 'ปุ่มแดงแบบ MyInstants · กดแล้วส่งเสียงทั้งห้อง'}
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

        <div className="p-4 sm:p-5 overflow-y-auto scroll-slim">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {REMOTE_SFX.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => play(item)}
                disabled={locked}
                title={soundOn ? item.name : 'เสียงปิดอยู่'}
                className="group flex flex-col items-center gap-2 rounded-2xl glass-soft px-3 py-4 transition hover:bg-white/10 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <span
                  className="relative grid place-items-center w-24 h-24 rounded-full text-3xl font-black text-white shadow-[inset_0_-10px_0_rgba(0,0,0,0.18),0_12px_24px_rgba(0,0,0,0.25)] border-4 border-white/25 active:translate-y-1 active:shadow-[inset_0_-5px_0_rgba(0,0,0,0.18),0_6px_12px_rgba(0,0,0,0.25)] transition"
                  style={{ backgroundColor: item.color }}
                >
                  {cooldownLeft > 0 ? cooldownText : item.emoji}
                </span>
                <span className="max-w-full truncate text-[12px] text-white/80 font-medium">{item.name}</span>
                <span className="text-[10px] text-white/30">สั้น · ephemeral</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const SfxPickerModal = memo(SfxPickerModalBase)
