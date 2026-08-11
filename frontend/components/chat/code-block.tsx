'use client'

import { memo, useEffect, useRef, useState, useCallback } from 'react'
import type { HLJSApi } from 'highlight.js'

interface CodeBlockProps {
  code: string
  lang?: string
}

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

let highlighterPromise: Promise<HLJSApi> | null = null

function loadHighlighter(): Promise<HLJSApi> {
  highlighterPromise ??= import('highlight.js/lib/common').then((mod) => mod.default)
  return highlighterPromise
}

function safeLanguage(hljs: HLJSApi, language: string): string {
  return hljs.getLanguage(language) ? language : 'plaintext'
}

function CodeBlockBase({ code, lang }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState(lang || 'plaintext')

  useEffect(() => {
    let active = true
    const target = codeRef.current
    if (target) target.innerHTML = escapeHtml(code)

    loadHighlighter()
      .then((hljs) => {
        if (!active) return
        const detected = lang
          ? safeLanguage(hljs, lang)
          : (code.trim() ? hljs.highlightAuto(code).language || 'plaintext' : 'plaintext')
        const safeLang = safeLanguage(hljs, detected)
        const result = safeLang === 'plaintext'
          ? { value: escapeHtml(code) }
          : hljs.highlight(code, { language: safeLang, ignoreIllegals: true })
        if (codeRef.current) codeRef.current.innerHTML = result.value
        setLanguage(safeLang)
      })
      .catch(() => {
        if (active && codeRef.current) codeRef.current.textContent = code
      })

    return () => { active = false }
  }, [code, lang])

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
