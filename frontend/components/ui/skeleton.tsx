export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-white/8">
        <div className="skeleton w-9 h-9 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3.5 w-32 rounded-full" />
          <div className="skeleton h-2.5 w-20 rounded-full" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 sm:px-6 md:px-8 py-5 space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex items-end gap-2.5 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className="skeleton w-8 h-8 rounded-full shrink-0" />
            <div className={`flex flex-col gap-1.5 ${i % 2 === 0 ? 'items-start' : 'items-end'}`}>
              <div className="skeleton h-2.5 w-24 rounded-full" />
              <div className={`skeleton h-10 rounded-2xl ${i % 3 === 0 ? 'w-48' : i % 3 === 1 ? 'w-64' : 'w-36'}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 sm:px-6 pb-5 pt-3 border-t border-white/8">
        <div className="skeleton h-11 rounded-2xl w-full" />
      </div>
    </div>
  )
}

export function FullScreenLoader() {
  return (
    <div className="h-[100dvh] w-screen grid place-items-center">
      <div className="flex flex-col items-center gap-4 animate-scalein">
        <div className="grid place-items-center w-16 h-16 rounded-2xl glass">
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="text-white/80 animate-pulse">
            <path d="M3 13c2-3 5-4 8-4 2 0 3 .5 4 1l4 2c1 .5 2 .5 3 0" />
            <path d="M15 10c1.5-1 3-1.5 4.5-1 .5 1 .5 2 0 3" />
            <circle cx="16.5" cy="10.5" r="0.6" fill="currentColor" />
            <path d="M11 9c-1-2-3-3-5-2-1 1-1 2 0 3" />
          </svg>
        </div>
        <div className="skeleton h-3 w-32 rounded-full" />
      </div>
    </div>
  )
}
