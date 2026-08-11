'use client'

import { useState, useCallback } from 'react'
import type { FileMeta } from './types'
import { API_BASE } from './room'
import { normalizeFileMeta } from './file-utils'

interface UploadState {
  loading: boolean
  progress: number
  error: string | null
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({ loading: false, progress: 0, error: null })

  const upload = useCallback((file: File): Promise<FileMeta | null> => {
    return new Promise((resolve) => {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()
      setState({ loading: true, progress: 0, error: null })

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setState((s) => ({ ...s, progress: Math.round((e.loaded / e.total) * 100) }))
        }
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText) as { error?: string } | unknown
          if (xhr.status < 200 || xhr.status >= 300) {
            const message = typeof data === 'object' && data && 'error' in data && typeof data.error === 'string'
              ? data.error
              : 'อัปโหลดล้มเหลว'
            setState({ loading: false, progress: 0, error: message })
            resolve(null)
            return
          }

          const meta = normalizeFileMeta(data)
          if (!meta) {
            setState({ loading: false, progress: 0, error: 'ข้อมูลไฟล์ไม่ถูกต้อง' })
            resolve(null)
            return
          }

          setState({ loading: false, progress: 100, error: null })
          resolve(meta)
        } catch {
          setState({ loading: false, progress: 0, error: 'อัปโหลดล้มเหลว' })
          resolve(null)
        }
      }

      xhr.onerror = () => {
        setState({ loading: false, progress: 0, error: 'เชื่อมต่อล้มเหลว' })
        resolve(null)
      }

      xhr.open('POST', `${API_BASE}/upload`)
      xhr.send(formData)
    })
  }, [])

  const reset = useCallback(() => {
    setState({ loading: false, progress: 0, error: null })
  }, [])

  return { ...state, upload, reset }
}
