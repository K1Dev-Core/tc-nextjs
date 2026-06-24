// ponytail: Web Audio API generated sounds — no external files needed
// Upgrade path: replace with real .ogg/.mp3 files if we want richer sound design

let ctx: AudioContext | null = null
let enabled = true

try {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('aura:sound') : null
  if (saved !== null) enabled = saved === '1'
} catch {}

export function isSoundEnabled() { return enabled }
export function setSoundEnabled(v: boolean) {
  enabled = v
  try { localStorage.setItem('aura:sound', v ? '1' : '0') } catch {}
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, delay = 0) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

function sweep(from: number, to: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t0)
  osc.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export const sfx = {
  send() {
    if (!enabled) return
    sweep(520, 880, 0.12, 'sine', 0.1)
  },
  receive() {
    if (!enabled) return
    tone(660, 0.08, 'sine', 0.08)
    tone(880, 0.12, 'sine', 0.06, 0.06)
  },
  join() {
    if (!enabled) return
    tone(523, 0.1, 'triangle', 0.08)
    tone(659, 0.1, 'triangle', 0.06, 0.08)
    tone(784, 0.15, 'triangle', 0.05, 0.16)
  },
  leave() {
    if (!enabled) return
    tone(440, 0.1, 'triangle', 0.06)
    tone(330, 0.15, 'triangle', 0.04, 0.08)
  },
  react() {
    if (!enabled) return
    tone(880, 0.06, 'sine', 0.06)
    tone(1100, 0.08, 'sine', 0.04, 0.04)
  },
  pin() {
    if (!enabled) return
    sweep(400, 1200, 0.15, 'square', 0.06)
  },
  login() {
    if (!enabled) return
    tone(523, 0.1, 'sine', 0.1)
    tone(659, 0.1, 'sine', 0.08, 0.1)
    tone(784, 0.15, 'sine', 0.08, 0.2)
    tone(1047, 0.2, 'sine', 0.06, 0.3)
  },
}
