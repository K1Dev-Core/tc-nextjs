'use client'

import { useEffect, useState, useCallback } from 'react'
import { SFX_OVERLAY_EVENT } from '@/lib/use-chat'

const DEFAULT_HOLD_MS = 7210

export function SfxOverlay() {
  const [src, setSrc] = useState<string | null>(null)
  const [holdMs, setHoldMs] = useState<number>(DEFAULT_HOLD_MS)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ gif: string; holdMs?: number }>).detail
      if (!detail?.gif) return
      setSrc(detail.gif)
      setHoldMs(detail.holdMs ?? DEFAULT_HOLD_MS)
    }
    window.addEventListener(SFX_OVERLAY_EVENT, handler)
    return () => window.removeEventListener(SFX_OVERLAY_EVENT, handler)
  }, [])

  const beginFade = useCallback(() => setSrc(null), [])

  useEffect(() => {
    if (!src) return
    const t = setTimeout(beginFade, holdMs)
    return () => clearTimeout(t)
  }, [src, holdMs, beginFade])

  if (!src) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none animate-fadein">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[4px]" />
      <div className="relative animate-scalein">
        <img src={src} alt="SFX" className="max-w-[96vw] max-h-[92vh] rounded-2xl shadow-2xl" />
      </div>
    </div>
  )
}
