import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir }              from 'node:os'
import { join }                from 'node:path'
import Database                from 'better-sqlite3'
import { createAuditLog }      from './log.js'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'guarana-audit-'))
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true })
})

describe('AuditLog', () => {
  it('appends an entry and reads it back', () => {
    const log = createAuditLog(join(tmpDir, 'audit.db'))
    log.append({ skill: 'my-skill', action: 'install:approved', actor: 'user1' })
    const entries = log.getAll()
    expect(entries).toHaveLength(1)
    expect(entries[0]!.skill).toBe('my-skill')
    expect(entries[0]!.action).toBe('install:approved')
  })

  it('each entry has a hash field', () => {
    const log = createAuditLog(join(tmpDir, 'audit.db'))
    log.append({ skill: 'my-skill', action: 'install:approved', actor: 'user1' })
    const entries = log.getAll()
    expect(typeof entries[0]!.hash).toBe('string')
    expect(entries[0]!.hash.length).toBeGreaterThan(0)
  })

  it('chain is valid when entries are unmodified', () => {
    const log = createAuditLog(join(tmpDir, 'audit.db'))
    log.append({ skill: 'skill-a', action: 'install:approved', actor: 'user1' })
    log.append({ skill: 'skill-b', action: 'run:start',        actor: 'user1' })
    expect(log.verifyChain()).toBe(true)
  })

  it('verifyChain returns false when an entry is tampered', () => {
    const dbPath = join(tmpDir, 'audit.db')
    const log = createAuditLog(dbPath)
    log.append({ skill: 'skill-a', action: 'install:approved', actor: 'user1' })

    // Tamper directly with the database using a separate connection
    const db = new Database(dbPath)
    db.prepare("UPDATE audit_log SET action = 'tampered' WHERE skill = 'skill-a'").run()
    db.close()

    expect(log.verifyChain()).toBe(false)
  })
})
