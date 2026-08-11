import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CodeBackground } from '@/components/ui/code-background'

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
      <head>
        <link rel="dns-prefetch" href="https://print-code.k1god.com" />
        <link rel="preconnect" href="https://print-code.k1god.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-aurora">
        <CodeBackground />
        {children}
      </body>
    </html>
  )
}
