import { QUICK_EMOJIS, emojiUrl, emojiUrlFromChar, AVATAR_EMOJIS } from './emoji'

const AVATAR_STORAGE_KEY = 'aura:avatar'

const AVATAR_PALETTE = [
  ['#ffd6a5', '#fb8b24'],
  ['#a0c4ff', '#3a6ea5'],
  ['#bdb2ff', '#6c5ce7'],
  ['#ffc2d1', '#e84393'],
  ['#b8e0d2', '#1aa179'],
  ['#ffe66d', '#f4a261'],
  ['#caf0f8', '#0077b6'],
  ['#ffadad', '#c1121f'],
]

const STATUS_COLORS = ['#22c55e', '#eab308', '#ef4444'] as const

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function avatarColors(name: string): [string, string] {
  return AVATAR_PALETTE[hash(name) % AVATAR_PALETTE.length] as [string, string]
}

export function getCustomAvatar(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AVATAR_STORAGE_KEY)
}

export function setCustomAvatar(emoji: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AVATAR_STORAGE_KEY, emoji)
}

export function clearCustomAvatar(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AVATAR_STORAGE_KEY)
}

export function avatarEmoji(name: string): string {
  return AVATAR_EMOJIS[hash(name) % AVATAR_EMOJIS.length]
}

export function myAvatarEmoji(): string {
  const custom = getCustomAvatar()
  if (custom) return custom
  return ''
}

export function avatarEmojiUrl(name: string): string {
  const emoji = avatarEmoji(name)
  const url = emojiUrlFromChar(emoji)
  if (url) return url
  return emojiUrl(QUICK_EMOJIS[hash(name) % QUICK_EMOJIS.length])
}

export function myAvatarUrl(name: string): string {
  const custom = getCustomAvatar()
  if (custom) {
    const url = emojiUrlFromChar(custom)
    if (url) return url
  }
  return avatarEmojiUrl(name)
}

export function statusColor(name: string): string {
  return STATUS_COLORS[hash(name) % STATUS_COLORS.length]
}

export function initials(name: string): string {
  const parts = name.trim().split(/[\s_-]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function formatTime(ts: string): string {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
