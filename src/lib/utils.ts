import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function extractVariables(content: string): string[] {
  const regex = /\{([^}]+)\}/g
  const matches: string[] = []
  let match
  while ((match = regex.exec(content)) !== null) {
    if (!matches.includes(match[1].trim())) {
      matches.push(match[1].trim())
    }
  }
  return matches
}

export function fillVariables(content: string, values: Record<string, string>): string {
  return content.replace(/\{([^}]+)\}/g, (match, variable) => {
    const key = variable.trim()
    return values[key] || match
  })
}

export function detectLanguage(text: string): 'ES' | 'EN' {
  const lowerText = text.toLowerCase()
  const spanishWords = ['hola', 'gracias', 'pedido', 'estimado', 'saludo', 'reembolso']
  const englishWords = ['hello', 'thank', 'order', 'dear', 'regards', 'refund']
  const es = spanishWords.filter(w => lowerText.includes(w)).length
  const en = englishWords.filter(w => lowerText.includes(w)).length
  return en > es ? 'EN' : 'ES'
}

export function parseKeepFiles(files: Array<{ name: string; content: string }>) {
  const results = []
  for (const file of files) {
    if (!file.name.endsWith('.json')) continue
    try {
      const note = JSON.parse(file.content)
      if (note.isTrashed || note.isArchived) continue
      const content = note.textContent || note.text || ''
      if (!content.trim()) continue
      const title = note.title?.trim() || content.split('\n')[0].substring(0, 60)
      const tags = (note.labels || []).map((l: any) => l.name || l)
      results.push({ title, content: content.trim(), tags, detectedLanguage: detectLanguage(content) })
    } catch {}
  }
  return results
}
