import type { FileMeta } from './types'

const DEFAULT_FILE_NAME = 'ไฟล์แนบ'

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function basenameFromUrl(url: string): string {
  const clean = url.split('?')[0]?.split('#')[0] ?? ''
  const name = clean.split('/').filter(Boolean).pop()
  return name || DEFAULT_FILE_NAME
}

export function hasFileUrl(file: Partial<FileMeta> | null | undefined): file is FileMeta {
  return typeof file?.url === 'string' && file.url.trim().length > 0
}

export function normalizeFileMeta(file: unknown): FileMeta | undefined {
  if (!file || typeof file !== 'object') return undefined

  const raw = file as Partial<FileMeta>
  const url = asString(raw.url).trim()
  if (!url) return undefined

  const name = asString(raw.name).trim() || basenameFromUrl(url)
  const type = asString(raw.type).trim() || 'application/octet-stream'
  const size = typeof raw.size === 'number' && Number.isFinite(raw.size) && raw.size >= 0 ? raw.size : 0

  return { url, name, type, size }
}

export function fileUrl(url?: string | null): string {
  const value = asString(url).trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'
  const path = value.startsWith('/') ? value : `/${value}`
  return `${base}${path}`
}

export function isImage(file: Partial<FileMeta> | null | undefined): boolean {
  if (!hasFileUrl(file)) return false
  const t = asString(file.type)
  const name = asString(file.name)
  return t.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name)
}

export function isVideo(file: Partial<FileMeta> | null | undefined): boolean {
  if (!hasFileUrl(file)) return false
  const t = asString(file.type)
  const name = asString(file.name)
  return t.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(name)
}

export function isAudio(file: Partial<FileMeta> | null | undefined): boolean {
  if (!hasFileUrl(file)) return false
  const t = asString(file.type)
  const name = asString(file.name)
  return t.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(name)
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
