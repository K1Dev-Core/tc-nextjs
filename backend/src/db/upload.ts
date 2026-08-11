import { IncomingMessage, ServerResponse } from 'node:http'
import {
  createReadStream,
  writeFileSync,
  statSync,
  readFileSync,
  existsSync,
} from 'node:fs'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { UPLOAD_DIR } from './connection.js'
import type { FileMeta } from '../types.js'

const MAX_FILE_SIZE = 50 * 1024 * 1024

// =============================================
// Anti-Spam / IP Ban
// =============================================

// ภายใน 15 วินาที อัปโหลดได้สูงสุด 8 ครั้ง
// ครั้งที่ 9 = แบนถาวร
const SPAM_WINDOW_MS = 15 * 1000
const MAX_UPLOADS_PER_WINDOW = 8

// ถ้าใช้ nginx / cloudflare / reverse proxy
// ค่อยตั้ง TRUST_PROXY=1
const TRUST_PROXY = process.env.TRUST_PROXY === '1'

// เก็บ blacklist ถาวร
const BAN_FILE = join(process.cwd(), 'banned-ips.json')

// ip -> timestamps ของ request
const uploadAttempts = new Map<string, number[]>()

// IP ที่โดนแบน
const bannedIps = new Set<string>()

loadBannedIps()

const ALLOWED_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico',
  '.pdf', '.txt', '.md', '.json', '.csv', '.xml', '.yaml', '.yml',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.mp3', '.wav', '.ogg', '.m4a', '.flac',
  '.mp4', '.webm', '.mov', '.avi', '.mkv',
  '.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.c', '.cpp',
  '.html', '.css', '.sql', '.sh', '.bat',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
])

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',

  '.pdf': 'application/pdf',

  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',

  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',

  '.txt': 'text/plain',
  '.md': 'text/plain',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
}

// =============================================
// Upload
// =============================================

export function handleUpload(
  req: IncomingMessage,
  res: ServerResponse,
): void {

  const clientIp = getClientIp(req)

  // ---------------------------------------------
  // 1. IP โดนแบนอยู่แล้ว
  // ---------------------------------------------

  if (bannedIps.has(clientIp)) {
    console.warn(`[UPLOAD BAN] blocked IP: ${clientIp}`)

    res.writeHead(403, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    })

    res.end(JSON.stringify({
      error: 'UPLOAD ERR',
    }))

    return
  }

  // ---------------------------------------------
  // 2. ตรวจ spam
  // ---------------------------------------------

  if (registerUploadAttempt(clientIp)) {
    banIp(clientIp)

    console.warn(`[UPLOAD BAN] spam detected: ${clientIp}`)

    res.writeHead(403, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    })

    res.end(JSON.stringify({
      error: 'UPLOAD ERR',
    }))

    return
  }

  // ---------------------------------------------
  // Multipart validation
  // ---------------------------------------------

  const contentType = req.headers['content-type'] || ''

  if (!contentType.startsWith('multipart/form-data')) {
    res.writeHead(400, {
      'Content-Type': 'application/json; charset=utf-8',
    })

    res.end(JSON.stringify({
      error: 'expected multipart/form-data',
    }))

    return
  }

  const boundary = extractBoundary(contentType)

  if (!boundary) {
    res.writeHead(400, {
      'Content-Type': 'application/json; charset=utf-8',
    })

    res.end(JSON.stringify({
      error: 'no boundary',
    }))

    return
  }

  const chunks: Buffer[] = []

  let totalSize = 0
  let aborted = false

  req.on('data', (chunk: Buffer) => {
    if (aborted) return

    totalSize += chunk.length

    if (totalSize > MAX_FILE_SIZE + 1024 * 64) {
      aborted = true

      res.writeHead(413, {
        'Content-Type': 'application/json; charset=utf-8',
      })

      res.end(JSON.stringify({
        error: 'ไฟล์ใหญ่เกิน 50MB',
      }))

      req.destroy()
      return
    }

    chunks.push(chunk)
  })

  req.on('end', () => {
    if (aborted) return

    try {
      const file = parseMultipart(
        Buffer.concat(chunks),
        boundary,
      )

      if (!file) {
        res.writeHead(400, {
          'Content-Type': 'application/json; charset=utf-8',
        })

        res.end(JSON.stringify({
          error: 'ไม่พบไฟล์ใน request',
        }))

        return
      }

      const ext = extname(file.filename).toLowerCase()

      if (
        file.filename &&
        ext &&
        !ALLOWED_EXTS.has(ext)
      ) {
        res.writeHead(415, {
          'Content-Type': 'application/json; charset=utf-8',
        })

        res.end(JSON.stringify({
          error: `นามสกุล ${ext} ไม่ได้รับการสนับสนุน`,
        }))

        return
      }

      if (file.data.length > MAX_FILE_SIZE) {
        res.writeHead(413, {
          'Content-Type': 'application/json; charset=utf-8',
        })

        res.end(JSON.stringify({
          error: 'ไฟล์ใหญ่เกิน 50MB',
        }))

        return
      }

      const id = randomBytes(12).toString('hex')

      const safeExt = ext || ''

      const storedName = `${id}${safeExt}`

      const filepath = join(
        UPLOAD_DIR,
        storedName,
      )

      writeFileSync(
        filepath,
        file.data,
      )

      const meta: FileMeta = {
        url: `/files/${storedName}`,
        name: file.filename || `file-${id}`,
        type:
          file.contentType ||
          'application/octet-stream',
        size: file.data.length,
      }

      console.log(
        `[UPLOAD] ${clientIp} -> ${storedName} (${file.data.length} bytes)`,
      )

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
      })

      res.end(
        JSON.stringify(meta),
      )

    } catch (error) {
      console.error(
        '[UPLOAD ERROR]',
        clientIp,
        error,
      )

      res.writeHead(500, {
        'Content-Type': 'application/json; charset=utf-8',
      })

      res.end(JSON.stringify({
        error: 'อัปโหลดล้มเหลว',
      }))
    }
  })

  req.on('error', (error) => {
    console.error(
      '[UPLOAD REQUEST ERROR]',
      clientIp,
      error,
    )

    if (!aborted && !res.headersSent) {
      res.writeHead(500, {
        'Content-Type': 'application/json; charset=utf-8',
      })

      res.end(JSON.stringify({
        error: 'อัปโหลดล้มเหลว',
      }))
    }
  })
}

// =============================================
// Anti-Spam Functions
// =============================================

function registerUploadAttempt(ip: string): boolean {
  const now = Date.now()

  const oldAttempts =
    uploadAttempts.get(ip) || []

  // เอาเฉพาะ request ที่เกิดในช่วงเวลาที่กำหนด
  const attempts = oldAttempts.filter(
    timestamp =>
      now - timestamp < SPAM_WINDOW_MS,
  )

  attempts.push(now)

  uploadAttempts.set(
    ip,
    attempts,
  )

  console.log(
    `[UPLOAD RATE] ${ip}: ${attempts.length}/${MAX_UPLOADS_PER_WINDOW}`,
  )

  return attempts.length > MAX_UPLOADS_PER_WINDOW
}

function banIp(ip: string): void {
  // ไม่ควรแบนถ้าหา IP ไม่เจอ
  if (!ip || ip === 'unknown') {
    return
  }

  bannedIps.add(ip)

  // ล้าง rate history
  uploadAttempts.delete(ip)

  saveBannedIps()

  console.warn(
    `[PERMANENT BAN] ${ip}`,
  )
}

function loadBannedIps(): void {
  try {
    if (!existsSync(BAN_FILE)) {
      return
    }

    const data = JSON.parse(
      readFileSync(
        BAN_FILE,
        'utf8',
      ),
    )

    if (!Array.isArray(data)) {
      return
    }

    for (const ip of data) {
      if (typeof ip === 'string') {
        bannedIps.add(ip)
      }
    }

    console.log(
      `[BAN LIST] loaded ${bannedIps.size} IPs`,
    )

  } catch (error) {
    console.error(
      '[BAN LIST] load failed',
      error,
    )
  }
}

function saveBannedIps(): void {
  try {
    writeFileSync(
      BAN_FILE,
      JSON.stringify(
        [...bannedIps],
        null,
        2,
      ),
      'utf8',
    )
  } catch (error) {
    console.error(
      '[BAN LIST] save failed',
      error,
    )
  }
}

// =============================================
// Get Client IP
// =============================================

function getClientIp(
  req: IncomingMessage,
): string {

  // IMPORTANT:
  // เปิดใช้เฉพาะตอน server อยู่หลัง trusted proxy เท่านั้น
  if (TRUST_PROXY) {

    const xForwardedFor =
      req.headers['x-forwarded-for']

    if (typeof xForwardedFor === 'string') {
      const firstIp =
        xForwardedFor
          .split(',')[0]
          .trim()

      if (firstIp) {
        return normalizeIp(firstIp)
      }
    }

    const realIp =
      req.headers['x-real-ip']

    if (typeof realIp === 'string') {
      return normalizeIp(realIp)
    }
  }

  return normalizeIp(
    req.socket.remoteAddress ||
    'unknown',
  )
}

function normalizeIp(
  ip: string,
): string {

  // ::ffff:1.2.3.4 -> 1.2.3.4
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7)
  }

  return ip
}

// =============================================
// Serve File
// =============================================

export function serveFile(
  res: ServerResponse,
  filename: string,
): void {

  // ไฟล์ที่ระบบสร้างจะเป็น random hex 24 ตัว
  // ช่วยป้องกันการขอ ../ หรือชื่อแปลก ๆ
  if (
    !/^[a-f0-9]{24}(?:\.[a-z0-9]+)?$/i.test(filename)
  ) {
    res.writeHead(404)
    res.end('not found')
    return
  }

  const filepath = join(
    UPLOAD_DIR,
    filename,
  )

  try {
    const stat = statSync(filepath)

    if (!stat.isFile()) {
      res.writeHead(404)
      res.end('not found')
      return
    }

    const ext =
      extname(filename).toLowerCase()

    const mime =
      MIME_MAP[ext] ||
      'application/octet-stream'

    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': stat.size,
      'Cache-Control': 'public, max-age=86400',
      'Content-Disposition':
        `inline; filename="${filename}"`,
    })

    createReadStream(filepath)
      .pipe(res)

  } catch {
    res.writeHead(404)
    res.end('not found')
  }
}

// =============================================
// Multipart
// =============================================

function extractBoundary(
  contentType: string,
): string | null {

  const match =
    contentType.match(
      /boundary=(?:"([^"]+)"|([^;]+))/,
    )

  return match
    ? (match[1] || match[2])
    : null
}

interface ParsedFile {
  filename: string
  contentType: string
  data: Buffer
}

function parseMultipart(
  buffer: Buffer,
  boundary: string,
): ParsedFile | null {

  const boundaryBuf =
    Buffer.from(`--${boundary}`)

  const endBuf =
    Buffer.from(`--${boundary}--`)

  const startIdx =
    buffer.indexOf(boundaryBuf)

  if (startIdx === -1) {
    return null
  }

  const nextBoundaryIdx =
    buffer.indexOf(
      boundaryBuf,
      startIdx + boundaryBuf.length,
    )

  const endIdx =
    buffer.indexOf(endBuf)

  const sectionEnd =
    nextBoundaryIdx !== -1
      ? nextBoundaryIdx
      : (
        endIdx !== -1
          ? endIdx
          : buffer.length
      )

  const section =
    buffer.slice(
      startIdx + boundaryBuf.length + 2,
      sectionEnd - 2,
    )

  const headerEndIdx =
    section.indexOf('\r\n\r\n')

  if (headerEndIdx === -1) {
    return null
  }

  const headerStr =
    section
      .slice(0, headerEndIdx)
      .toString('utf8')

  const data =
    section.slice(
      headerEndIdx + 4,
    )

  const nameMatch =
    headerStr.match(
      /name="([^"]+)"/,
    )

  if (
    !nameMatch ||
    nameMatch[1] !== 'file'
  ) {
    return null
  }

  const filenameMatch =
    headerStr.match(
      /filename="([^"]+)"/,
    )

  // แก้ regex จาก \s\* เป็น \s*
  const ctMatch =
    headerStr.match(
      /Content-Type:\s*(.+)/i,
    )

  return {
    filename:
      filenameMatch
        ? filenameMatch[1]
        : '',

    contentType:
      ctMatch
        ? ctMatch[1].trim()
        : 'application/octet-stream',

    data,
  }
}