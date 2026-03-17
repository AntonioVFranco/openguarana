import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createFundraisingTracker } from './fundraising.js'

let tmpDir: string
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'guarana-fr-')) })
afterEach(()  => { rmSync(tmpDir, { recursive: true }) })

describe('FundraisingTracker', () => {
  it('adds an investor and retrieves them', () => {
    const tracker = createFundraisingTracker(join(tmpDir, 'fr.db'))
    tracker.addInvestor({ name: 'Sequoia', stage: 'seed', status: 'intro', next_action: 'Send deck' })
    const investors = tracker.listAll()
    expect(investors).toHaveLength(1)
    expect(investors[0]!.name).toBe('Sequoia')
  })

  it('surfaces investors not contacted in last N days', () => {
    const tracker = createFundraisingTracker(join(tmpDir, 'fr.db'))
    // Add investor with last_contact 10 days ago
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    tracker.addInvestor({ name: 'a16z', stage: 'series-a', status: 'warm', next_action: 'Follow up', last_contact: tenDaysAgo })
    const overdue = tracker.listOverdue(7)  // overdue if not contacted in 7+ days
    expect(overdue.some(i => i.name === 'a16z')).toBe(true)
  })

  it('investors contacted recently are not overdue', () => {
    const tracker = createFundraisingTracker(join(tmpDir, 'fr.db'))
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    tracker.addInvestor({ name: 'YC', stage: 'seed', status: 'active', next_action: 'Demo', last_contact: yesterday })
    const overdue = tracker.listOverdue(7)
    expect(overdue.some(i => i.name === 'YC')).toBe(false)
  })
})
