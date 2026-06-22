'use client'

import { useState, useCallback } from 'react'
import type { FileMeta } from './types'
import { API_BASE } from './room'

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
          const meta = JSON.parse(xhr.responseText) as FileMeta
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
