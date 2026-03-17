import { describe, it, expect } from 'vitest'
import { createMcpServer } from './index.js'

describe('createMcpServer', () => {
  it('returns a server with expected tool names', () => {
    const server = createMcpServer({ dbPath: ':memory:' })
    const names = server.listTools()
    expect(names).toContain('decisions_record')
    expect(names).toContain('decisions_query')
    expect(names).toContain('memory_search')
    expect(names).toContain('workspace_members')
    expect(names).toContain('dora_report')
    expect(names).toContain('skills_install')
  })
})
