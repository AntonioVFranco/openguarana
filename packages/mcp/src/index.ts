#!/usr/bin/env node
import { McpServer }           from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z }                    from 'zod'
import { createDecisionStore }  from '@openguarana/professional'
import { createWorkspaceStore } from '@openguarana/professional'
import { createGraphStore }     from '@openguarana/memory'

export interface McpServerOptions {
  dbPath: string
}

export function createMcpServer(opts: McpServerOptions) {
  const server    = new McpServer({ name: 'openguarana', version: '0.1.0' })
  const decisions = createDecisionStore(opts.dbPath)
  const graph     = createGraphStore(opts.dbPath)
  const workspace = createWorkspaceStore(opts.dbPath)

  const toolNames: string[] = []

  function tool(
    name: string,
    description: string,
    schema: Record<string, unknown>,
    handler: (args: Record<string, unknown>) => Promise<{ content: { type: string; text: string }[] }>,
  ): void {
    // @ts-ignore — SDK accepts zod schema map but types are loose
    server.tool(name, description, schema, handler)
    toolNames.push(name)
  }

  tool(
    'decisions_record',
    'Record a team decision with rationale and trade-offs',
    {
      what:      z.string().describe('The decision made'),
      why:       z.string().describe('Rationale and context'),
      tradeoffs: z.array(z.string()).describe('Alternatives considered'),
      who:       z.string().describe('Member making the decision'),
    },
    async (args) => {
      const { what, why, tradeoffs, who } = args as {
        what: string
        why: string
        tradeoffs: string[]
        who: string
      }
      const id = decisions.record({ what, why, tradeoffs, who })
      return { content: [{ type: 'text', text: `Decision recorded. ID: ${id}` }] }
    },
  )

  tool(
    'decisions_query',
    'List all recorded decisions',
    {},
    async () => {
      const all = decisions.getAll()
      const text =
        all.map(d => `[${d.id}] ${d.what}`).join('\n') || 'No decisions recorded yet.'
      return { content: [{ type: 'text', text }] }
    },
  )

  tool(
    'memory_search',
    'Search the knowledge graph for an entity by name',
    { name: z.string().describe('Entity name to search for') },
    async (args) => {
      const { name } = args as { name: string }
      const entity = graph.findEntity(name)
      if (!entity) {
        return { content: [{ type: 'text', text: `No entity found for "${name}"` }] }
      }
      const obs = graph.getObservations(entity.id)
      const text = [
        `Entity: ${entity.name} (${entity.type})`,
        `Summary: ${entity.summary ?? 'none'}`,
        `Observations: ${obs.map(o => o.body).join('; ') || 'none'}`,
      ].join('\n')
      return { content: [{ type: 'text', text }] }
    },
  )

  tool(
    'workspace_members',
    'List members of a workspace',
    { workspaceId: z.string() },
    async (args) => {
      const { workspaceId } = args as { workspaceId: string }
      const members = workspace.getMembers(workspaceId)
      const text =
        members.map(m => `${m.member_id} (${m.role})`).join('\n') || 'No members.'
      return { content: [{ type: 'text', text }] }
    },
  )

  tool(
    'dora_report',
    'Get current DORA performance band',
    {},
    async () => ({
      content: [{ type: 'text', text: 'DORA metrics require GitHub App integration (v2).' }],
    }),
  )

  tool(
    'skills_install',
    'Install a skill after security scan',
    { skillPath: z.string().describe('Path or URL to the skill') },
    async (args) => {
      const { skillPath } = args as { skillPath: string }
      return {
        content: [{ type: 'text', text: `To install "${skillPath}", run: guarana install ${skillPath}` }],
      }
    },
  )

  return {
    listTools: () => toolNames,
    start: async () => {
      const transport = new StdioServerTransport()
      await server.connect(transport)
    },
  }
}

// Entrypoint when run directly as MCP server
const isMain =
  process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('index.ts')
if (isMain) {
  createMcpServer({
    dbPath: process.env['GUARANA_DB'] ?? `${process.env['HOME']}/.openguarana/data.db`,
  })
    .start()
    .catch(err => {
      process.stderr.write(String(err) + '\n')
      process.exit(1)
    })
}
