import { describe, it, expect } from 'vitest'
import { loadConfig } from './config.js'

describe('loadConfig', () => {
  it('loads a valid config from a YAML string', () => {
    const yaml = `
gateway:
  port: 18789
memory:
  diary: true
  graph: false
  extract_entities: true
`
    const config = loadConfig(yaml)
    expect(config.gateway.port).toBe(18789)
    expect(config.memory.diary).toBe(true)
    expect(config.memory.graph).toBe(false)
  })

  it('applies defaults when optional fields are omitted', () => {
    const yaml = `
gateway:
  port: 18789
`
    const config = loadConfig(yaml)
    expect(config.memory.diary).toBe(true)
    expect(config.memory.graph).toBe(false)
    expect(config.memory.extract_entities).toBe(true)
  })

  it('throws on invalid port', () => {
    const yaml = `
gateway:
  port: -1
`
    expect(() => loadConfig(yaml)).toThrow()
  })
})
