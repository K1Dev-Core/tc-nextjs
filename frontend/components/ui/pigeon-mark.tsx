import { memo } from 'react'

function PigeonMarkBase({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 13c2-3 5-4 8-4 2 0 3 .5 4 1l4 2c1 .5 2 .5 3 0" />
      <path d="M15 10c1.5-1 3-1.5 4.5-1 .5 1 .5 2 0 3" />
      <circle cx="16.5" cy="10.5" r="0.6" fill="currentColor" />
      <path d="M11 9c-1-2-3-3-5-2-1 1-1 2 0 3" />
    </svg>
  )
}

export const PigeonMark = memo(PigeonMarkBase)
