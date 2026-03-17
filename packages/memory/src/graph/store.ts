// @ts-ignore — sqlite-vec has no bundled type declarations
import * as sqliteVec from 'sqlite-vec'
import Database from 'better-sqlite3'

export interface Entity {
  id:         number
  type:       string
  name:       string
  summary:    string | null
  created_at: string
  updated_at: string
}

export interface Observation {
  id:         number
  entity_id:  number
  body:       string
  source:     string | null
  created_at: string
}

export interface Relation {
  id:         number
  from_id:    number
  to_id:      number
  type:       string
  context:    string | null
  created_at: string
}

export interface GraphStore {
  upsertEntity:    (e: { type: string; name: string; summary: string }) => void
  findEntity:      (name: string) => Entity | undefined
  findEntityById:  (id: number) => Entity | undefined
  listAll:         () => Entity[]
  addObservation:  (o: { entityId: number; body: string; source?: string }) => void
  getObservations: (entityId: number) => Observation[]
  addRelation:     (r: { fromId: number; toId: number; type: string; context?: string }) => void
  getRelations:    (entityId: number) => Relation[]
}

export function createGraphStore(dbPath: string): GraphStore {
  const db = new Database(dbPath)

  // Load sqlite-vec extension for semantic search (graceful if unavailable)
  try {
    sqliteVec.load(db)
  } catch {
    // sqlite-vec not available — entity/relation features still work, embeddings disabled
  }

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS entities (
      id         INTEGER PRIMARY KEY,
      type       TEXT NOT NULL,
      name       TEXT NOT NULL UNIQUE,
      summary    TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS observations (
      id         INTEGER PRIMARY KEY,
      entity_id  INTEGER NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      body       TEXT NOT NULL,
      source     TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS relations (
      id         INTEGER PRIMARY KEY,
      from_id    INTEGER NOT NULL REFERENCES entities(id),
      to_id      INTEGER NOT NULL REFERENCES entities(id),
      type       TEXT NOT NULL,
      context    TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Create vec0 table only if sqlite-vec is loaded
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS entity_embeddings USING vec0(
        entity_id INTEGER,
        embedding FLOAT[1536]
      );
    `)
  } catch {
    // vec0 not available — skip
  }

  return {
    upsertEntity({ type, name, summary }) {
      db.prepare(`
        INSERT INTO entities (type, name, summary)
        VALUES (?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
          summary    = excluded.summary,
          updated_at = datetime('now')
      `).run(type, name, summary)
    },

    findEntity(name) {
      return db.prepare('SELECT * FROM entities WHERE name = ?').get(name) as Entity | undefined
    },

    findEntityById(id) {
      return db.prepare('SELECT * FROM entities WHERE id = ?').get(id) as Entity | undefined
    },

    listAll() {
      return db.prepare('SELECT * FROM entities ORDER BY id ASC').all() as Entity[]
    },

    addObservation({ entityId, body, source }) {
      db.prepare(`
        INSERT INTO observations (entity_id, body, source) VALUES (?, ?, ?)
      `).run(entityId, body, source ?? null)
    },

    getObservations(entityId) {
      return db.prepare('SELECT * FROM observations WHERE entity_id = ?').all(entityId) as Observation[]
    },

    addRelation({ fromId, toId, type, context }) {
      db.prepare(`
        INSERT INTO relations (from_id, to_id, type, context) VALUES (?, ?, ?, ?)
      `).run(fromId, toId, type, context ?? null)
    },

    getRelations(entityId) {
      return db.prepare(`
        SELECT * FROM relations WHERE from_id = ? OR to_id = ?
      `).all(entityId, entityId) as Relation[]
    },
  }
}
