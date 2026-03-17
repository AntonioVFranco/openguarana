import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join }                from 'node:path'
import { tmpdir }              from 'node:os'
import { createWorkspaceStore } from './workspace.js'

let tmpDir: string

beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'guarana-ws-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true }) })

describe('WorkspaceStore', () => {
  it('creates a workspace and retrieves it', () => {
    const store = createWorkspaceStore(join(tmpDir, 'workspace.db'))
    store.createWorkspace({ id: 'ws-1', name: 'Acme Engineering' })
    const ws = store.getWorkspace('ws-1')
    expect(ws?.name).toBe('Acme Engineering')
  })

  it('adds a member with a role', () => {
    const store = createWorkspaceStore(join(tmpDir, 'workspace.db'))
    store.createWorkspace({ id: 'ws-1', name: 'Acme Engineering' })
    store.addMember({ workspaceId: 'ws-1', memberId: 'alice', role: 'admin' })
    const members = store.getMembers('ws-1')
    expect(members).toHaveLength(1)
    expect(members[0]!.role).toBe('admin')
  })

  it('returns undefined for unknown workspace', () => {
    const store = createWorkspaceStore(join(tmpDir, 'workspace.db'))
    expect(store.getWorkspace('nonexistent')).toBeUndefined()
  })

  it('enforces unique member per workspace', () => {
    const store = createWorkspaceStore(join(tmpDir, 'workspace.db'))
    store.createWorkspace({ id: 'ws-1', name: 'Test' })
    store.addMember({ workspaceId: 'ws-1', memberId: 'alice', role: 'admin' })
    expect(() =>
      store.addMember({ workspaceId: 'ws-1', memberId: 'alice', role: 'member' })
    ).toThrow()
  })
})
