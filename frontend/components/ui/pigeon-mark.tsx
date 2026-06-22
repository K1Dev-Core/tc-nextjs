import { memo } from 'react'

const PIGEON_IMG = 'https://img.freepik.com/premium-photo/pigeon-suit-stares-directly-camera_14117-608543.jpg?w=360'

function PigeonMarkBase({ size = 24, className = '', rounded = true }: { size?: number; className?: string; rounded?: boolean }) {
  return (
    <img
      src={PIGEON_IMG}
      alt="นกพิราบ"
      width={size}
      height={size}
      loading="lazy"
      className={`object-cover shrink-0 select-none pointer-events-none ${rounded ? 'rounded-full' : 'rounded-xl'} ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export const PigeonMark = memo(PigeonMarkBase)
export { PIGEON_IMG }
