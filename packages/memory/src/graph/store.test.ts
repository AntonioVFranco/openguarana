import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createGraphStore } from './store.js'

let tmpDir: string
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'guarana-graph-')) })
afterEach(()  => { rmSync(tmpDir, { recursive: true }) })

describe('GraphStore', () => {
  it('upserts an entity and retrieves it by name', () => {
    const store = createGraphStore(join(tmpDir, 'graph.db'))
    store.upsertEntity({ type: 'technology', name: 'PostgreSQL', summary: 'relational DB' })
    const entity = store.findEntity('PostgreSQL')
    expect(entity?.type).toBe('technology')
    expect(entity?.summary).toBe('relational DB')
  })

  it('adds an observation to an entity', () => {
    const store = createGraphStore(join(tmpDir, 'graph.db'))
    store.upsertEntity({ type: 'project', name: 'Payments API', summary: '' })
    const entity = store.findEntity('Payments API')!
    store.addObservation({ entityId: entity.id, body: 'uses Stripe for billing', source: 'telegram' })
    const obs = store.getObservations(entity.id)
    expect(obs).toHaveLength(1)
    expect(obs[0]!.body).toContain('Stripe')
  })

  it('creates a relation between two entities', () => {
    const store = createGraphStore(join(tmpDir, 'graph.db'))
    store.upsertEntity({ type: 'project',    name: 'API',        summary: '' })
    store.upsertEntity({ type: 'technology', name: 'PostgreSQL', summary: '' })
    const api = store.findEntity('API')!
    const pg  = store.findEntity('PostgreSQL')!
    store.addRelation({ fromId: api.id, toId: pg.id, type: 'uses', context: 'primary database' })
    const relations = store.getRelations(api.id)
    expect(relations).toHaveLength(1)
    expect(relations[0]!.type).toBe('uses')
  })
})
