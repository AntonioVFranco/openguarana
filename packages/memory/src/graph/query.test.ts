import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createGraphStore } from './store.js'
import { findRelated } from './query.js'

let tmpDir: string
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'guarana-gq-')) })
afterEach(()  => { rmSync(tmpDir, { recursive: true }) })

describe('findRelated', () => {
  it('finds directly related entities (depth 1)', () => {
    const store = createGraphStore(join(tmpDir, 'graph.db'))
    store.upsertEntity({ type: 'project',    name: 'API',        summary: '' })
    store.upsertEntity({ type: 'technology', name: 'PostgreSQL', summary: '' })
    const api = store.findEntity('API')!
    const pg  = store.findEntity('PostgreSQL')!
    store.addRelation({ fromId: api.id, toId: pg.id, type: 'uses' })
    const related = findRelated(store, api.id, 1)
    expect(related.some(e => e.name === 'PostgreSQL')).toBe(true)
  })

  it('finds entities at depth 2 through transitive relations', () => {
    const store = createGraphStore(join(tmpDir, 'graph.db'))
    store.upsertEntity({ type: 'project',    name: 'API',     summary: '' })
    store.upsertEntity({ type: 'technology', name: 'PG',      summary: '' })
    store.upsertEntity({ type: 'concept',    name: 'ACID',    summary: '' })
    const api  = store.findEntity('API')!
    const pg   = store.findEntity('PG')!
    const acid = store.findEntity('ACID')!
    store.addRelation({ fromId: api.id,  toId: pg.id,   type: 'uses' })
    store.addRelation({ fromId: pg.id,   toId: acid.id, type: 'depends_on' })
    const related = findRelated(store, api.id, 2)
    expect(related.some(e => e.name === 'ACID')).toBe(true)
  })

  it('returns empty array for entity with no relations', () => {
    const store = createGraphStore(join(tmpDir, 'graph.db'))
    store.upsertEntity({ type: 'project', name: 'Solo', summary: '' })
    const solo = store.findEntity('Solo')!
    const related = findRelated(store, solo.id, 2)
    expect(related).toHaveLength(0)
  })
})
