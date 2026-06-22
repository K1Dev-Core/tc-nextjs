import { memo } from 'react'
import { avatarColors, initials } from '@/lib/avatar'

interface AvatarProps {
  name: string
  size?: number
  className?: string
}

function AvatarBase({ name, size = 40, className = '' }: AvatarProps) {
  const [from, to] = avatarColors(name)
  return (
    <div
      className={`relative shrink-0 rounded-full grid place-items-center font-semibold text-white/90 select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        fontSize: size * 0.36,
        boxShadow: '0 4px 12px -4px rgba(0,0,0,0.5)',
      }}
    >
      {initials(name)}
    </div>
  )
}

export const Avatar = memo(AvatarBase)
