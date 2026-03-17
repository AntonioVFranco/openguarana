import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createDecisionStore } from './store.js'

let tmpDir: string
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'guarana-dec-')) })
afterEach(()  => { rmSync(tmpDir, { recursive: true }) })

describe('DecisionStore', () => {
  it('records a decision and retrieves it', () => {
    const store = createDecisionStore(join(tmpDir, 'decisions.db'))
    store.record({
      what:      'Use PostgreSQL instead of MongoDB',
      why:       'ACID compliance required for financial data',
      tradeoffs: ['Harder to scale horizontally', 'More rigid schema'],
      who:       'alice',
    })
    const decisions = store.getAll()
    expect(decisions).toHaveLength(1)
    expect(decisions[0]!.what).toContain('PostgreSQL')
  })

  it('records an outcome for a decision', () => {
    const store = createDecisionStore(join(tmpDir, 'decisions.db'))
    store.record({ what: 'Use Raft', why: 'Simpler than Paxos', tradeoffs: [], who: 'bob' })
    const id = store.getAll()[0]!.id
    store.recordOutcome({ decisionId: id, outcome: 'Worked well', rating: 5 })
    const events = store.getEvents(id)
    expect(events.some(e => e.type === 'OutcomeRecorded')).toBe(true)
  })

  it('superseding a decision links the two', () => {
    const store = createDecisionStore(join(tmpDir, 'decisions.db'))
    store.record({ what: 'Use MySQL', why: 'Familiar', tradeoffs: [], who: 'carol' })
    const oldId = store.getAll()[0]!.id
    store.record({ what: 'Use PostgreSQL', why: 'Better JSON support', tradeoffs: [], who: 'carol' })
    const newId = store.getAll()[1]!.id
    store.supersede({ oldId, newId, reason: 'PostgreSQL fits better' })
    const events = store.getEvents(oldId)
    expect(events.some(e => e.type === 'DecisionSuperseded')).toBe(true)
  })
})
