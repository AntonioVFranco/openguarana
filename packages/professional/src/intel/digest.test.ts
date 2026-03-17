import { describe, it, expect } from 'vitest'
import { deduplicateItems, buildWeeklyDigest, getISOWeek } from './digest.js'
import type { IntelItem } from './digest.js'

const makeItem = (overrides: Partial<IntelItem>): IntelItem => {
  const id = overrides.id ?? 'default-id'
  return {
    id,
    source:    overrides.source    ?? 'hackernews',
    title:     overrides.title     ?? 'Default Title',
    url:       overrides.url       ?? `https://example.com/${id}`,
    summary:   overrides.summary   ?? null,
    fetchedAt: overrides.fetchedAt ?? new Date('2026-03-16T10:00:00Z'),
  }
}

describe('deduplicateItems', () => {
  it('removes exact duplicate URLs within the same week', () => {
    const items: IntelItem[] = [
      makeItem({ id: 'a', url: 'https://example.com/post-1', fetchedAt: new Date('2026-03-16T08:00:00Z') }),
      makeItem({ id: 'b', url: 'https://example.com/post-1', fetchedAt: new Date('2026-03-16T12:00:00Z') }),
      makeItem({ id: 'c', url: 'https://example.com/post-2', fetchedAt: new Date('2026-03-16T09:00:00Z') }),
    ]
    const result = deduplicateItems(items)
    expect(result).toHaveLength(2)
    expect(result.map(i => i.url)).toContain('https://example.com/post-1')
    expect(result.map(i => i.url)).toContain('https://example.com/post-2')
  })

  it('keeps the first occurrence when deduplicating', () => {
    const items: IntelItem[] = [
      makeItem({ id: 'first',  url: 'https://example.com/same', title: 'First',  fetchedAt: new Date('2026-03-16T08:00:00Z') }),
      makeItem({ id: 'second', url: 'https://example.com/same', title: 'Second', fetchedAt: new Date('2026-03-16T12:00:00Z') }),
    ]
    const result = deduplicateItems(items)
    expect(result[0]!.id).toBe('first')
  })

  it('keeps items with different URLs even if titles match', () => {
    const items: IntelItem[] = [
      makeItem({ id: 'a', url: 'https://hn.com/1', title: 'Same Title' }),
      makeItem({ id: 'b', url: 'https://hn.com/2', title: 'Same Title' }),
    ]
    const result = deduplicateItems(items)
    expect(result).toHaveLength(2)
  })
})

describe('buildWeeklyDigest', () => {
  it('groups items by source', () => {
    const items: IntelItem[] = [
      makeItem({ id: '1', source: 'hackernews', title: 'HN item 1' }),
      makeItem({ id: '2', source: 'hackernews', title: 'HN item 2' }),
      makeItem({ id: '3', source: 'rss',        title: 'RSS item 1' }),
    ]
    const digest = buildWeeklyDigest(items, new Date('2026-03-16T00:00:00Z'))
    expect(digest.bySource['hackernews']).toHaveLength(2)
    expect(digest.bySource['rss']).toHaveLength(1)
  })

  it('includes week identifier in the digest', () => {
    const digest = buildWeeklyDigest([], new Date('2026-03-16T00:00:00Z'))
    expect(digest.week).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('deduplicates before building digest', () => {
    const items: IntelItem[] = [
      makeItem({ id: 'a', url: 'https://same.com', source: 'hackernews' }),
      makeItem({ id: 'b', url: 'https://same.com', source: 'hackernews' }),
    ]
    const digest = buildWeeklyDigest(items, new Date('2026-03-16T00:00:00Z'))
    expect(digest.totalItems).toBe(1)
  })
})

describe('getISOWeek', () => {
  it('returns week number in YYYY-WNN format', () => {
    expect(getISOWeek(new Date('2026-03-16T00:00:00Z'))).toBe('2026-W12')
  })
})
