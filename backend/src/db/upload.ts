import { IncomingMessage, ServerResponse } from 'node:http'
import { createReadStream, writeFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { UPLOAD_DIR } from './connection.js'
import type { FileMeta } from '../types.js'

const MAX_FILE_SIZE = 50 * 1024 * 1024
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
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp', '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.txt': 'text/plain', '.md': 'text/plain', '.json': 'application/json',
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
}

export function handleUpload(req: IncomingMessage, res: ServerResponse): void {
  const contentType = req.headers['content-type'] || ''
  if (!contentType.startsWith('multipart/form-data')) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'expected multipart/form-data' }))
    return
  }

  const boundary = extractBoundary(contentType)
  if (!boundary) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'no boundary' }))
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
      res.writeHead(413, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'ไฟล์ใหญ่เกิน 50MB' }))
      req.destroy()
      return
    }
    chunks.push(chunk)
  })

  req.on('end', () => {
    if (aborted) return
    try {
      const file = parseMultipart(Buffer.concat(chunks), boundary)
      if (!file) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'ไม่พบไฟล์ใน request' }))
        return
      }
      const ext = extname(file.filename).toLowerCase()
      if (file.filename && ext && !ALLOWED_EXTS.has(ext)) {
        res.writeHead(415, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: `นามสกุล ${ext} ไม่ได้รับการสนับสนุน` }))
        return
      }
      if (file.data.length > MAX_FILE_SIZE) {
        res.writeHead(413, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'ไฟล์ใหญ่เกิน 50MB' }))
        return
      }

      const id = randomBytes(12).toString('hex')
      const safeExt = ext || ''
      const storedName = `${id}${safeExt}`
      const filepath = join(UPLOAD_DIR, storedName)
      writeFileSync(filepath, file.data)

      const meta: FileMeta = {
        url: `/files/${storedName}`,
        name: file.filename || `file-${id}`,
        type: file.contentType || 'application/octet-stream',
        size: file.data.length,
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(meta))
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'อัปโหลดล้มเหลว' }))
    }
  })

  req.on('error', () => {
    if (!aborted) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'อัปโหลดล้มเหลว' }))
    }
  })
}

export function serveFile(res: ServerResponse, filename: string): void {
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '')
  const filepath = join(UPLOAD_DIR, safeName)
  try {
    const stat = statSync(filepath)
    const ext = extname(safeName).toLowerCase()
    const mime = MIME_MAP[ext] || 'application/octet-stream'
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': stat.size,
      'Cache-Control': 'public, max-age=86400',
      'Content-Disposition': `inline; filename="${safeName}"`,
    })
    createReadStream(filepath).pipe(res)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
}

function extractBoundary(contentType: string): string | null {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)
  return match ? (match[1] || match[2]) : null
}

interface ParsedFile {
  filename: string
  contentType: string
  data: Buffer
}

function parseMultipart(buffer: Buffer, boundary: string): ParsedFile | null {
  const boundaryBuf = Buffer.from(`--${boundary}`)
  const endBuf = Buffer.from(`--${boundary}--`)

  const startIdx = buffer.indexOf(boundaryBuf)
  if (startIdx === -1) return null

  const nextBoundaryIdx = buffer.indexOf(boundaryBuf, startIdx + boundaryBuf.length)
  const endIdx = buffer.indexOf(endBuf)
  const sectionEnd = nextBoundaryIdx !== -1 ? nextBoundaryIdx : (endIdx !== -1 ? endIdx : buffer.length)

  const section = buffer.slice(startIdx + boundaryBuf.length + 2, sectionEnd - 2)
  const headerEndIdx = section.indexOf('\r\n\r\n')
  if (headerEndIdx === -1) return null

  const headerStr = section.slice(0, headerEndIdx).toString('utf8')
  const data = section.slice(headerEndIdx + 4)

  const nameMatch = headerStr.match(/name="([^"]+)"/)
  if (!nameMatch || nameMatch[1] !== 'file') return null

  const filenameMatch = headerStr.match(/filename="([^"]+)"/)
  const ctMatch = headerStr.match(/Content-Type:\s*(.+)/i)

  return {
    filename: filenameMatch ? filenameMatch[1] : '',
    contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
    data,
  }
}
