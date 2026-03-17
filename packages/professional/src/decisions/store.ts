import Database  from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import type { DecisionEvent } from './events.js'

export interface DecisionRecord {
  id:   string
  what: string
  why:  string
}

export interface DecisionStore {
  record:        (d: { what: string; why: string; tradeoffs: string[]; who: string }) => string
  recordOutcome: (o: { decisionId: string; outcome: string; rating: 1|2|3|4|5 }) => void
  supersede:     (s: { oldId: string; newId: string; reason: string }) => void
  getAll:        () => DecisionRecord[]
  getEvents:     (decisionId: string) => DecisionEvent[]
}

export function createDecisionStore(dbPath: string): DecisionStore {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS decision_events (
      rowid    INTEGER PRIMARY KEY,
      type     TEXT NOT NULL,
      payload  TEXT NOT NULL,
      at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  function appendEvent(type: string, payload: Record<string, unknown>): void {
    db.prepare('INSERT INTO decision_events (type, payload) VALUES (?, ?)').run(
      type,
      JSON.stringify(payload),
    )
  }

  return {
    record({ what, why, tradeoffs, who }) {
      const id = randomUUID()
      appendEvent('DecisionRecorded', { id, what, why, tradeoffs, who })
      return id
    },

    recordOutcome({ decisionId, outcome, rating }) {
      appendEvent('OutcomeRecorded', { decisionId, outcome, rating })
    },

    supersede({ oldId, newId, reason }) {
      appendEvent('DecisionSuperseded', { oldId, newId, reason })
    },

    getAll() {
      const rows = db.prepare(`
        SELECT payload FROM decision_events WHERE type = 'DecisionRecorded' ORDER BY rowid ASC
      `).all() as { payload: string }[]
      return rows.map(r => JSON.parse(r.payload) as DecisionRecord)
    },

    getEvents(decisionId) {
      const rows = db.prepare(`
        SELECT type, payload FROM decision_events ORDER BY rowid ASC
      `).all() as { type: string; payload: string }[]

      return rows
        .map(r => ({ type: r.type, ...JSON.parse(r.payload) } as DecisionEvent))
        .filter(e => {
          if ('id'         in e && (e as { id?: string }).id         === decisionId) return true
          if ('decisionId' in e && (e as { decisionId?: string }).decisionId === decisionId) return true
          if ('oldId'      in e && (e as { oldId?: string }).oldId      === decisionId) return true
          return false
        })
    },
  }
}
