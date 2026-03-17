import pino from 'pino'

const isDevelopment = process.env['NODE_ENV'] === 'development'

export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  ...(isDevelopment ? { transport: { target: 'pino-pretty' } } : {}),
})

export function childLogger(component: string) {
  return logger.child({ component })
}
