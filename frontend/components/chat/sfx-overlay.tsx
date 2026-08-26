'use client'

import { useEffect, useState } from 'react'
import { SFX_OVERLAY_EVENT } from '@/lib/use-chat'

const HOLD_MS = 4000

export function SfxOverlay() {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const gif = (e as CustomEvent<string>).detail
      if (!gif) return
      setSrc(gif)
      setTimeout(() => setSrc(null), HOLD_MS)
    }
    window.addEventListener(SFX_OVERLAY_EVENT, handler)
    return () => window.removeEventListener(SFX_OVERLAY_EVENT, handler)
  }, [])

  if (!src) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none animate-fadein">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative animate-scalein">
        <img src={src} alt="SFX" className="max-w-[80vw] max-h-[70vh] rounded-2xl shadow-2xl" />
      </div>
    </div>
  )
}
