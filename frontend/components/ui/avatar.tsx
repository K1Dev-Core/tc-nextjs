'use client'

import { memo } from 'react'
import { avatarEmojiUrl } from '@/lib/avatar'

interface AvatarProps {
  name: string
  size?: number
  className?: string
}

function AvatarBase({ name, size = 40, className = '' }: AvatarProps) {
  const url = avatarEmojiUrl(name)
  const pad = Math.max(2, Math.floor(size * 0.1))
  return (
    <div
      className={`relative shrink-0 rounded-full grid place-items-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <img
        src={url}
        alt={name}
        width={size - pad * 2}
        height={size - pad * 2}
        loading="lazy"
        className="rounded-full pointer-events-none"
      />
    </div>
  )
}

export const Avatar = memo(AvatarBase)
