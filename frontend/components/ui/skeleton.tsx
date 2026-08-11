'use client'


export function FullScreenLoader() {
  return (
    <div className="h-[100dvh] w-screen grid place-items-center relative overflow-hidden">
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

export function MessageListSkeleton() {
  const rows = [
    { mine: false, width: 'w-44 sm:w-56', height: 'h-12' },
    { mine: true, width: 'w-52 sm:w-64', height: 'h-16' },
    { mine: false, width: 'w-36 sm:w-48', height: 'h-10' },
    { mine: false, width: 'w-60 sm:w-72', height: 'h-20' },
    { mine: true, width: 'w-40 sm:w-52', height: 'h-11' },
  ]

  return (
    <div
      className="flex-1 overflow-hidden px-3 sm:px-5 md:px-8 py-5 space-y-4 animate-fadein"
      role="status"
      aria-label="กำลังโหลดข้อความ"
      aria-busy="true"
    >
      {rows.map((row, index) => (
        <div key={index} className={`flex items-end gap-2.5 ${row.mine ? 'flex-row-reverse' : 'flex-row'}`}>
          {!row.mine && <div className="skeleton w-8 h-8 rounded-full shrink-0" />}
          <div className={`min-w-0 flex flex-col gap-1.5 ${row.mine ? 'items-end' : 'items-start'}`}>
            <div className="skeleton h-2.5 w-20 rounded-full" />
            <div className={`skeleton ${row.width} ${row.height} max-w-[72vw] rounded-2xl`} />
          </div>
        </div>
      ))}
      <span className="sr-only">กำลังโหลดข้อความ</span>
    </div>
  )
}

export function ChannelListSkeleton() {
  return (
    <div className="space-y-1 px-0.5 py-1" role="status" aria-label="กำลังโหลดห้อง" aria-busy="true">
      {[72, 88, 64, 80].map((width, index) => (
        <div key={index} className="flex items-center gap-2 px-2 py-2">
          <div className="skeleton w-4 h-4 rounded-md shrink-0" />
          <div className="skeleton h-3 rounded-full" style={{ width }} />
        </div>
      ))}
      <span className="sr-only">กำลังโหลดห้อง</span>
    </div>
  )
}

export function LinkPreviewSkeleton() {
  return (
    <div className="mt-1.5 w-72 max-w-full rounded-xl overflow-hidden border border-white/8 bg-white/5 animate-fadein" aria-hidden="true">
      <div className="skeleton aspect-[1.91/1] w-full" />
      <div className="p-2.5 space-y-2">
        <div className="skeleton h-3 w-4/5 rounded-full" />
        <div className="skeleton h-2.5 w-full rounded-full" />
        <div className="skeleton h-2.5 w-2/3 rounded-full" />
      </div>
    </div>
  )
}

export function PinnedViewSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0" role="status" aria-label="กำลังโหลดข้อความปักหมุด" aria-busy="true">
      <div className="flex-1 overflow-hidden p-4 space-y-4 animate-fadein">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex items-start gap-2.5">
            <div className="skeleton w-7 h-7 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex gap-2">
                <div className="skeleton h-2.5 w-20 rounded-full" />
                <div className="skeleton h-2.5 w-12 rounded-full" />
              </div>
              <div className={`skeleton rounded-xl ${index % 2 === 0 ? 'h-14 w-4/5' : 'h-10 w-3/5'}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 sm:px-6 py-2.5 border-t border-white/8">
        <div className="skeleton h-8 w-full rounded-lg" />
      </div>
      <span className="sr-only">กำลังโหลดข้อความปักหมุด</span>
    </div>
  )
}
