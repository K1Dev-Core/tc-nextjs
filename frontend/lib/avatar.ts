import { useEffect, useState } from 'react'
import { QUICK_EMOJIS, emojiUrl, emojiUrlFromChar, AVATAR_EMOJIS } from './emoji'
import { API_BASE } from './room'

const AVATAR_STORAGE_KEY = 'aura:avatar'
const AVATAR_UPDATE_EVENT = 'aura:avatar-update'
const remoteAvatars = new Map<string, string | null>()
const avatarRequests = new Map<string, Promise<string | null>>()

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

function avatarUrlFromValue(name: string, avatar: string | null | undefined): string {
  if (avatar) {
    const url = emojiUrlFromChar(avatar)
    if (url) return url
  }
  return avatarEmojiUrl(name)
}

export function updateAvatarCache(name: string, avatar: string | null): void {
  remoteAvatars.set(name, avatar)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AVATAR_UPDATE_EVENT, { detail: { name, avatar } }))
  }
}

async function fetchAvatar(name: string): Promise<string | null> {
  if (remoteAvatars.has(name)) return remoteAvatars.get(name) ?? null
  const existing = avatarRequests.get(name)
  if (existing) return existing

  const request = fetch(`${API_BASE}/avatar?username=${encodeURIComponent(name)}`)
    .then(async (res) => {
      if (!res.ok) return null
      const data = await res.json() as { avatar?: string | null }
      return data.avatar ?? null
    })
    .catch(() => null)
    .then((avatar) => {
      remoteAvatars.set(name, avatar)
      return avatar
    })
    .finally(() => avatarRequests.delete(name))

  avatarRequests.set(name, request)
  return request
}

export function useAvatarUrl(name: string): string {
  const [url, setUrl] = useState(() => avatarUrlFromValue(name, remoteAvatars.get(name)))

  useEffect(() => {
    let active = true
    setUrl(avatarUrlFromValue(name, remoteAvatars.get(name)))
    fetchAvatar(name).then((avatar) => {
      if (active) setUrl(avatarUrlFromValue(name, avatar))
    })

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ name: string; avatar: string | null }>).detail
      if (detail?.name === name) setUrl(avatarUrlFromValue(name, detail.avatar))
    }
    window.addEventListener(AVATAR_UPDATE_EVENT, handleUpdate)
    return () => {
      active = false
      window.removeEventListener(AVATAR_UPDATE_EVENT, handleUpdate)
    }
  }, [name])

  return url
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
