export type IntelSource = 'hackernews' | 'rss' | 'linkedin' | string

export interface IntelItem {
  id:        string
  source:    IntelSource
  title:     string
  url:       string
  summary:   string | null
  fetchedAt: Date
}

export interface WeeklyDigest {
  week:       string                          // e.g. "2026-W12"
  totalItems: number
  bySource:   Record<string, IntelItem[]>
}

export function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayOfWeek = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export function deduplicateItems(items: IntelItem[]): IntelItem[] {
  const seen = new Set<string>()
  const result: IntelItem[] = []
  for (const item of items) {
    if (!seen.has(item.url)) {
      seen.add(item.url)
      result.push(item)
    }
  }
  return result
}

export function buildWeeklyDigest(items: IntelItem[], weekOf: Date): WeeklyDigest {
  const deduplicated = deduplicateItems(items)
  const week = getISOWeek(weekOf)

  const bySource: Record<string, IntelItem[]> = {}
  for (const item of deduplicated) {
    if (!bySource[item.source]) bySource[item.source] = []
    bySource[item.source]!.push(item)
  }

  return {
    week,
    totalItems: deduplicated.length,
    bySource,
  }
}
