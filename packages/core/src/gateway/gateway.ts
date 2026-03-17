import { Hono }        from 'hono'
import { childLogger } from '../logger.js'
import type { GuaranaConfig } from '../config/schema.js'

const VERSION = '0.1.0'
const log = childLogger('gateway')

export interface Gateway {
  app:   Hono
  start: (port?: number) => Promise<void>
  stop:  () => Promise<void>
}

export function createGateway(config: GuaranaConfig): Gateway {
  const app = new Hono()

  app.get('/health', (c) => {
    return c.json({ status: 'ok', version: VERSION })
  })

  app.notFound((c) => {
    return c.json({ error: 'not found' }, 404)
  })

  app.onError((err, c) => {
    log.error({ err }, 'unhandled error')
    return c.json({ error: 'internal server error' }, 500)
  })

  async function start(port = config.gateway.port): Promise<void> {
    const { serve } = await import('@hono/node-server')
    serve({ fetch: app.fetch, port })
    log.info({ port }, 'gateway started')
  }

  async function stop(): Promise<void> {
    log.info('gateway stopped')
  }

  return { app, start, stop }
}
