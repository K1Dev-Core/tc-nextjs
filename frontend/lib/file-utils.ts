import type { FileMeta } from './types'

export function fileUrl(url: string): string {
  if (url.startsWith('http')) return url
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'
  return `${base}${url}`
}

export function isImage(file: FileMeta): boolean {
  const t = file.type ?? ''
  return t.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(file.name)
}

export function isVideo(file: FileMeta): boolean {
  const t = file.type ?? ''
  return t.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name)
}

export function isAudio(file: FileMeta): boolean {
  const t = file.type ?? ''
  return t.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(file.name)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
