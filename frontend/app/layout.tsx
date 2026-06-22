import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'นกพิราบ — แชทเรียลไทม์',
  description: 'ห้องแชทเรียลไทม์ ไม่ต้องล็อกอิน',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#14161e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="dark">
      <body className="bg-aurora">{children}</body>
    </html>
  )
}
