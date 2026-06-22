'use client'

import { memo, useEffect, useRef, useState, useCallback } from 'react'
import hljs from 'highlight.js/lib/common'

interface CodeBlockProps {
  code: string
  lang?: string
}

function detectLang(code: string): string {
  if (!code.trim()) return 'plaintext'
  try {
    const result = hljs.highlightAuto(code)
    return result.language || 'plaintext'
  } catch {
    return 'plaintext'
  }
}

function CodeBlockBase({ code, lang }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  const language = lang || detectLang(code)

  useEffect(() => {
    if (codeRef.current) {
      try {
        const lang = detectLang(code)
        const result = hljs.highlight(code, { language: lang, ignoreIllegals: true })
        codeRef.current.innerHTML = result.value
      } catch {
        if (codeRef.current) codeRef.current.textContent = code
      }
    }
  }, [code])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      void 0
    }
  }, [code])

  return (
    <div className="code-block my-1.5 max-w-full">
      <div className="code-block-header">
        <span>{language}</span>
        <button
          onClick={copy}
          className="text-white/40 hover:text-white/90 transition px-2 py-0.5 rounded"
          aria-label="คัดลอก"
        >
          {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
        </button>
      </div>
      <pre><code ref={codeRef} className={`language-${language}`}>{code}</code></pre>
    </div>
  )
}

export const CodeBlock = memo(CodeBlockBase)
