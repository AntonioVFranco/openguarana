import { describe, it, expect } from 'vitest'
import { createGateway } from './gateway.js'
import type { GuaranaConfig } from '../config/schema.js'

const testConfig: GuaranaConfig = {
  gateway:      { port: 0 },
  memory:       { diary: true, graph: false, extract_entities: true },
  professional: { enabled: false },
  channels:     {},
}

describe('createGateway', () => {
  it('returns a Hono app with a /health endpoint', async () => {
    const { app } = createGateway(testConfig)
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = await res.json() as { status: string }
    expect(body.status).toBe('ok')
  })

  it('returns version in /health response', async () => {
    const { app } = createGateway(testConfig)
    const res = await app.request('/health')
    const body = await res.json() as { version: string }
    expect(typeof body.version).toBe('string')
  })

  it('returns 404 for unknown routes', async () => {
    const { app } = createGateway(testConfig)
    const res = await app.request('/nonexistent')
    expect(res.status).toBe(404)
  })
})
