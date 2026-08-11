'use client'

import { useEffect, useRef } from 'react'

type Pixel = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  born: number
  life: number
  alpha: number
}

const ORANGE = '255, 107, 53'
const MAX_PIXELS = 900
const CELL = 9
const MIN_DISTANCE = 5
const POINTER_IDLE_MS = 180

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isCoarsePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}

export function CursorPixelTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer()) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const pixels: Pixel[] = []
    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let running = true
    let lastX = 0
    let lastY = 0
    let hasLast = false
    let lastMove = 0
    let lastFrame = performance.now()

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const addPixel = (x: number, y: number, size = CELL) => {
      pixels.push({
        x: Math.round(x / CELL) * CELL,
        y: Math.round(y / CELL) * CELL,
        vx: (Math.random() - 0.5) * 10,
        vy: 10 + Math.random() * 22,
        size,
        born: performance.now(),
        life: 780 + Math.random() * 420,
        alpha: 0.96,
      })
      if (pixels.length > MAX_PIXELS) pixels.splice(0, pixels.length - MAX_PIXELS)
    }

    const stamp = (x: number, y: number, radius = 18) => {
      const cells = Math.max(1, Math.ceil(radius / CELL))
      for (let ox = -cells; ox <= cells; ox++) {
        for (let oy = -cells; oy <= cells; oy++) {
          const dist = Math.hypot(ox, oy)
          if (dist > cells || Math.random() < dist / (cells + 1) * 0.45) continue
          addPixel(x + ox * CELL, y + oy * CELL, CELL - 1)
        }
      }
    }

    const line = (x1: number, y1: number, x2: number, y2: number) => {
      const dist = Math.hypot(x2 - x1, y2 - y1)
      const steps = Math.max(1, Math.ceil(dist / MIN_DISTANCE))
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        stamp(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 13 + Math.min(18, dist * 0.08))
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const x = event.clientX
      const y = event.clientY
      const now = performance.now()
      lastMove = now

      if (!hasLast || now - lastMove > POINTER_IDLE_MS) {
        stamp(x, y, 16)
      } else {
        line(lastX, lastY, x, y)
      }

      lastX = x
      lastY = y
      hasLast = true
    }

    const draw = (now: number) => {
      if (!running) return
      const dt = Math.min(32, now - lastFrame) / 1000
      lastFrame = now

      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'source-over'

      for (let i = pixels.length - 1; i >= 0; i--) {
        const p = pixels[i]
        const age = now - p.born
        const t = age / p.life
        if (t >= 1) {
          pixels.splice(i, 1)
          continue
        }

        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 0.992
        p.vy *= 0.988

        const fade = Math.pow(1 - t, 1.35)
        ctx.fillStyle = `rgba(${ORANGE}, ${p.alpha * fade})`
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }

      if (now - lastMove > POINTER_IDLE_MS) hasLast = false
      raf = requestAnimationFrame(draw)
    }

    const onVisibility = () => {
      if (document.hidden) pixels.length = 0
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(draw)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[70] mix-blend-normal"
      aria-hidden="true"
    />
  )
}
