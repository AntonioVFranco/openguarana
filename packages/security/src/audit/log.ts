import Database  from 'better-sqlite3'
import { createHmac, randomUUID } from 'node:crypto'

const HMAC_SECRET = process.env['GUARANA_AUDIT_SECRET'] ?? 'guarana-audit-default'

export interface AuditEntry {
  id:        string
  timestamp: string
  skill:     string
  action:    string
  actor:     string
  hash:      string
}

export interface AuditLog {
  append:      (entry: Omit<AuditEntry, 'id' | 'timestamp' | 'hash'>) => void
  getAll:      () => AuditEntry[]
  verifyChain: () => boolean
}

function computeHash(prevHash: string, entry: Omit<AuditEntry, 'hash'>): string {
  const data = prevHash + JSON.stringify({ ...entry })
  return createHmac('sha256', HMAC_SECRET).update(data).digest('hex')
}

export function createAuditLog(dbPath: string): AuditLog {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id        TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      skill     TEXT NOT NULL,
      action    TEXT NOT NULL,
      actor     TEXT NOT NULL,
      hash      TEXT NOT NULL
    )
  `)

  function getLastHash(): string {
    const row = db
      .prepare('SELECT hash FROM audit_log ORDER BY rowid DESC LIMIT 1')
      .get() as { hash: string } | undefined
    return row?.hash ?? 'genesis'
  }

  function append(input: Omit<AuditEntry, 'id' | 'timestamp' | 'hash'>): void {
    const entry: Omit<AuditEntry, 'hash'> = {
      id:        randomUUID(),
      timestamp: new Date().toISOString(),
      ...input,
    }
    const hash = computeHash(getLastHash(), entry)
    db.prepare(`
      INSERT INTO audit_log (id, timestamp, skill, action, actor, hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(entry.id, entry.timestamp, entry.skill, entry.action, entry.actor, hash)
  }

  function getAll(): AuditEntry[] {
    return db.prepare('SELECT * FROM audit_log ORDER BY rowid ASC').all() as AuditEntry[]
  }

  function verifyChain(): boolean {
    const entries = getAll()
    let prevHash = 'genesis'
    for (const entry of entries) {
      const { hash, ...rest } = entry
      const expected = computeHash(prevHash, rest)
      if (expected !== hash) return false
      prevHash = hash
    }
    return true
  }

  return { append, getAll, verifyChain }
}
