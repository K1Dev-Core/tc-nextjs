'use client'

import { CodeBackground } from './code-background'

export function FullScreenLoader() {
  return (
    <div className="h-[100dvh] w-screen grid place-items-center relative">
      <CodeBackground />
      <div className="flex flex-col items-center gap-4 animate-scalein relative">
        <div className="text-5xl font-black tracking-tighter text-white/90 select-none animate-pulse">T</div>
        <div className="skeleton h-2.5 w-24 rounded-full" />
      </div>
    </div>
  )
}

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
