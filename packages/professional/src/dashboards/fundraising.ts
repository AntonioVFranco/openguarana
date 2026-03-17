import Database from 'better-sqlite3'

export interface Investor {
  id:           number
  name:         string
  stage:        string
  status:       string
  next_action:  string
  last_contact: string | null
  created_at:   string
}

export interface FundraisingTracker {
  addInvestor:  (i: { name: string; stage: string; status: string; next_action: string; last_contact?: string }) => void
  listAll:      () => Investor[]
  listOverdue:  (days: number) => Investor[]
  updateStatus: (name: string, status: string) => void
}

export function createFundraisingTracker(dbPath: string): FundraisingTracker {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS investors (
      id           INTEGER PRIMARY KEY,
      name         TEXT NOT NULL UNIQUE,
      stage        TEXT NOT NULL,
      status       TEXT NOT NULL,
      next_action  TEXT NOT NULL,
      last_contact TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  return {
    addInvestor({ name, stage, status, next_action, last_contact }) {
      db.prepare(`
        INSERT INTO investors (name, stage, status, next_action, last_contact)
        VALUES (?, ?, ?, ?, ?)
      `).run(name, stage, status, next_action, last_contact ?? null)
    },

    listAll() {
      return db.prepare('SELECT * FROM investors ORDER BY id ASC').all() as Investor[]
    },

    listOverdue(days) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      return db.prepare(`
        SELECT * FROM investors
        WHERE last_contact IS NULL OR last_contact < ?
      `).all(cutoff) as Investor[]
    },

    updateStatus(name, status) {
      db.prepare('UPDATE investors SET status = ? WHERE name = ?').run(status, name)
    },
  }
}
