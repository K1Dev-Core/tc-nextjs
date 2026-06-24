'use client'

import { memo, useState, useEffect, useCallback } from 'react'
import type { FileMeta } from '@/lib/types'
import { fileUrl, isImage, isVideo, isAudio, formatBytes } from '@/lib/file-utils'
import { DownloadIcon, FileIcon, CloseIcon, ImageIcon } from '@/components/ui/icons'

interface AttachmentProps {
  file: FileMeta
}

function AttachmentBase({ file }: AttachmentProps) {
  const [lightbox, setLightbox] = useState(false)

  if (isImage(file)) return <ImageAttachment file={file} onOpen={() => setLightbox(true)} lightbox={lightbox} onClose={() => setLightbox(false)} />
  if (isVideo(file)) return <VideoAttachment file={file} />
  if (isAudio(file)) return <AudioAttachment file={file} />
  return <FileCard file={file} />
}

export const Attachment = memo(AttachmentBase)

function ImageAttachment({ file, onOpen, lightbox, onClose }: { file: FileMeta; onOpen: () => void; onClose: () => void; lightbox: boolean }) {
  return (
    <>
      <div className="relative mt-1.5 rounded-xl overflow-hidden cursor-pointer group max-w-[280px]" onClick={onOpen}>
        <img
          src={fileUrl(file.url)}
          alt={file.name}
          loading="lazy"
          className="max-w-full max-h-[240px] object-cover transition group-hover:opacity-90"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-end p-2 opacity-0 group-hover:opacity-100">
          <span className="text-[10px] text-white/90 truncate">{file.name}</span>
        </div>
      </div>
      {lightbox && <Lightbox file={file} onClose={onClose} />}
    </>
  )
}

function Lightbox({ file, onClose }: { file: FileMeta; onClose: () => void }) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadein"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
        onClick={onClose}
        aria-label="ปิด"
      >
        <CloseIcon className="w-5 h-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fileUrl(file.url)}
        alt={file.name}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[92vw] max-h-[78vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
      />
      <div
        className="mt-3 flex items-center gap-3 text-white/70 text-sm min-w-0 max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate">{file.name}</span>
        <span className="text-white/30">·</span>
        <span className="shrink-0">{formatBytes(file.size)}</span>
        <a
          href={fileUrl(file.url)}
          download={file.name}
          className="grid place-items-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white transition shrink-0"
          aria-label="ดาวน์โหลด"
        >
          <DownloadIcon className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}

function VideoAttachment({ file }: { file: FileMeta }) {
  return (
    <video
      src={fileUrl(file.url)}
      controls
      className="mt-1.5 rounded-xl max-w-[320px] max-h-[240px]"
    />
  )
}

function AudioAttachment({ file }: { file: FileMeta }) {
  return (
    <div className="mt-1.5 glass-soft rounded-xl p-3 max-w-[320px]">
      <div className="flex items-center gap-2 mb-2 text-white/70 text-sm min-w-0">
        <span className="truncate">{file.name}</span>
        <span className="text-white/30 text-xs shrink-0">{formatBytes(file.size)}</span>
      </div>
      <audio src={fileUrl(file.url)} controls className="w-full" />
    </div>
  )
}

function FileCard({ file }: { file: FileMeta }) {
  return (
    <a
      href={fileUrl(file.url)}
      download={file.name}
      className="mt-1.5 flex items-center gap-3 glass-soft rounded-xl p-3 max-w-[320px] hover:bg-white/10 transition group"
    >
      <div className="grid place-items-center w-10 h-10 rounded-xl bg-white/8 group-hover:bg-white/15 transition shrink-0">
        <FileIcon className="w-5 h-5 text-white/70" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-white/90 truncate">{file.name}</div>
        <div className="text-[11px] text-white/40">{formatBytes(file.size)}</div>
      </div>
      <DownloadIcon className="w-4 h-4 text-white/40 group-hover:text-white/80 transition shrink-0" />
    </a>
  )
}
