export const LS_ENDINGS = 'mandate-endings-reached'

export function getReachedEndings(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LS_ENDINGS) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return []
  }
}

export function recordEnding(id: string): string[] {
  const current = getReachedEndings()
  if (current.includes(id)) return current
  const next = [...current, id]
  try {
    localStorage.setItem(LS_ENDINGS, JSON.stringify(next))
  } catch {
    // storage unavailable; the in-memory result is still returned
  }
  return next
}
