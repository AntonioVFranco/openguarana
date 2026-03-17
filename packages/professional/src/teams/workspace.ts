import Database from 'better-sqlite3'

export interface Workspace {
  id:         string
  name:       string
  created_at: string
}

export interface Member {
  workspace_id: string
  member_id:    string
  role:         string
  joined_at:    string
}

export interface WorkspaceStore {
  createWorkspace: (ws: Pick<Workspace, 'id' | 'name'>) => void
  getWorkspace:    (id: string) => Workspace | undefined
  addMember:       (m: { workspaceId: string; memberId: string; role: string }) => void
  getMembers:      (workspaceId: string) => Member[]
  getMemberRole:   (workspaceId: string, memberId: string) => string | undefined
}

export function createWorkspaceStore(dbPath: string): WorkspaceStore {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS members (
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      member_id    TEXT NOT NULL,
      role         TEXT NOT NULL,
      joined_at    TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (workspace_id, member_id)
    );
  `)

  return {
    createWorkspace({ id, name }) {
      db.prepare('INSERT INTO workspaces (id, name) VALUES (?, ?)').run(id, name)
    },

    getWorkspace(id) {
      return db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as Workspace | undefined
    },

    addMember({ workspaceId, memberId, role }) {
      db.prepare(`
        INSERT INTO members (workspace_id, member_id, role) VALUES (?, ?, ?)
      `).run(workspaceId, memberId, role)
    },

    getMembers(workspaceId) {
      return db.prepare('SELECT * FROM members WHERE workspace_id = ?').all(workspaceId) as Member[]
    },

    getMemberRole(workspaceId, memberId) {
      const row = db.prepare(`
        SELECT role FROM members WHERE workspace_id = ? AND member_id = ?
      `).get(workspaceId, memberId) as { role: string } | undefined
      return row?.role
    },
  }
}
