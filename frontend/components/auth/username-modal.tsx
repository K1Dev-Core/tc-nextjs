'use client'

import { useState } from 'react'
import { PigeonMark } from '@/components/ui/pigeon-mark'
import { ShuffleIcon } from '@/components/ui/icons'

const ADJ = ['ตื่น', 'ง่วง', 'หิว', 'ขี้เกียจ', 'มึน', 'ชิล', 'โคตร', 'หรรษา', 'เละ', 'โย่ว', 'ปุ๊บ', 'แจ่ม', 'ฟรุ้ง', 'จ๋อย', 'โบ๋', 'ติ่ง', 'เบา', 'กุ๋ย', 'หวิว', 'ปลิ้ว']
const NOUN = ['นก', 'แมว', 'หมา', 'ปลา', 'หนู', 'กวาง', 'กระต่าย', 'หมี', 'เสือ', 'ลิง', 'หมาจิ้งจอก', 'ตุ๊กแก', 'เม่น', 'ตัวเต่า', 'ปู', 'ปลาหมึก', 'ผึ้ง', 'ตัวบุ้ง', 'แมลงปอ', 'จิ้งจก']

function randomName(): string {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)]
  const n = NOUN[Math.floor(Math.random() * NOUN.length)]
  const num = Math.floor(Math.random() * 100)
  return `${a}${n}${num}`
}

interface UsernameModalProps {
  initial: string | null
  roomName: string
  onJoin: (name: string) => void
}

export function UsernameModal({ initial, roomName, onJoin }: UsernameModalProps) {
  const [value, setValue] = useState(initial ?? randomName())

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = value.trim().slice(0, 24)
    if (name) onJoin(name)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <form
        onSubmit={submit}
        className="glass rounded-3xl w-full max-w-md p-6 sm:p-7 animate-slidein relative"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="grid place-items-center w-12 h-12 rounded-2xl bg-white/10 border border-white/10">
            <PigeonMark size={26} className="text-white/90" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">เข้าห้อง {roomName}</h1>
            <p className="text-xs text-white/45">ตั้งชื่อแสดงตัว · ไม่ต้องล็อกอิน</p>
          </div>
        </div>

        <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-2">ชื่อแสดงตัว</label>
        <div className="flex gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={24}
            placeholder="ชื่อของคุณ"
            className="flex-1 glass-soft rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 transition min-w-0"
          />
          <button
            type="button"
            onClick={() => setValue(randomName())}
            className="grid place-items-center w-12 h-12 rounded-xl glass-soft text-white/60 hover:text-white/90 transition shrink-0"
            title="สุ่มชื่อ"
            aria-label="สุ่มชื่อ"
          >
            <ShuffleIcon className="w-5 h-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!value.trim()}
          className="mt-5 w-full rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 disabled:hover:bg-white/15 transition py-3 text-sm font-medium"
        >
          เข้าร่วมแชท
        </button>
      </form>
    </div>
  )
}
