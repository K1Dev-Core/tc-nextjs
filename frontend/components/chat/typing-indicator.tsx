'use client'

export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null
  return (
    <div className="flex items-center gap-2 px-1 py-1.5 animate-fadein">
      <span className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bubble-them">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/60 animate-dotbounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </span>
      <span className="text-[11px] text-white/40">
        {names.length === 1 ? `${names[0]} กำลังพิมพ์` : `${names.length} คนกำลังพิมพ์`}
      </span>
    </div>
  )
}
