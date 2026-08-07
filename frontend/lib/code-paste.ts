import hljs from 'highlight.js/lib/common'

export interface DetectedCode {
  code: string
  language: string
}

function detectJson(text: string): DetectedCode | null {
  if (!text.startsWith('{') && !text.startsWith('[')) return null

  try {
    const value = JSON.parse(text)
    if (value === null || typeof value !== 'object') return null
    return { code: text, language: 'json' }
  } catch {
    return null
  }
}

function codeSignalScore(text: string): number {
  const signals = [
    /^\s*(?:import|export|const|let|var|function|class|interface|type|enum|def|async|public|private|protected)\b/m,
    /(?:=>|===|!==|&&|\|\||\?\?|\?\.)/,
    /^\s*(?:if|else|for|while|switch|try|catch)\s*[({]/m,
    /<\/?[a-z][^>]*>/i,
    /^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/im,
    /^\s*(?:#include|package|using|namespace)\b/m,
    /(?:\/\/|\/\*|\*\/|<!--|-->)/,
    /^\s{2,}\S/m,
    /[;{}]\s*$/m,
  ]

  return signals.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0)
}

export function detectPastedCode(raw: string): DetectedCode | null {
  const text = raw.replace(/\r\n?/g, '\n').trim()
  if (!text || text.includes('```')) return null

  const json = detectJson(text)
  if (json) return json

  if (!text.includes('\n') || codeSignalScore(text) < 2) return null

  try {
    const result = hljs.highlightAuto(text)
    if (!result.language || result.relevance < 3) return null
    return { code: text, language: result.language }
  } catch {
    return null
  }
}

export function codeFence({ code, language }: DetectedCode): string {
  return `\`\`\`${language}\n${code}\n\`\`\``
}
