'use client'

import { useState, useEffect, useRef } from 'react'
import { LinkPreviewSkeleton } from '@/components/ui/skeleton'

interface PreviewData {
  title?: string
  description?: string
  image?: string
  url: string
  siteName?: string
}

const MAX_PREVIEW_CACHE = 300
const previewCache = new Map<string, PreviewData | null>()

function cachePreview(url: string, preview: PreviewData | null): void {
  if (previewCache.size >= MAX_PREVIEW_CACHE && !previewCache.has(url)) {
    const first = previewCache.keys().next().value
    if (first) previewCache.delete(first)
  }
  previewCache.set(url, preview)
}

export function LinkPreview({ url }: { url: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(() => previewCache.has(url))
  const [data, setData] = useState<PreviewData | null | undefined>(() => previewCache.get(url))

  useEffect(() => {
    setData(previewCache.get(url))
    setVisible(previewCache.has(url))
  }, [url])

  useEffect(() => {
    if (visible) return
    const node = rootRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { rootMargin: '360px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  useEffect(() => {
    if (!visible || data !== undefined) return
    let cancelled = false
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? '/api/backend'}/preview?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: PreviewData) => {
        if (cancelled) return
        const preview = d.title || d.image ? d : null
        cachePreview(url, preview)
        setData(preview)
      })
      .catch(() => {
        if (cancelled) return
        cachePreview(url, null)
        setData(null)
      })
      .finally(() => clearTimeout(timeout))

    return () => { cancelled = true; clearTimeout(timeout); controller.abort() }
  }, [url, data, visible])

  if (data === undefined) {
    return <div ref={rootRef}><LinkPreviewSkeleton /></div>
  }
  if (!data || (!data.title && !data.image)) return null

  const domain = (() => {
    try { return new URL(url).hostname.replace('www.', '') } catch { return url }
  })()

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-1.5 max-w-sm rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 transition group/preview"
    >
      {data.image && (
        <div className="aspect-[1.91/1] w-full overflow-hidden bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.image}
            alt={data.title ?? ''}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
          />
        </div>
      )}
      <div className="p-2.5">
        {data.title && (
          <div className="text-[13px] font-medium text-white/90 line-clamp-2 leading-snug">{data.title}</div>
        )}
        {data.description && (
          <div className="text-[11px] text-white/45 line-clamp-2 mt-0.5">{data.description}</div>
        )}
        <div className="text-[10px] text-white/35 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-white/10 shrink-0" />
          {domain}
        </div>
      </div>
    </a>
  )
}
