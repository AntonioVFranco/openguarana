import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { GuaranaConfigSchema, type GuaranaConfig } from './schema.js'

export function loadConfig(yamlContent: string): GuaranaConfig {
  const raw = parse(yamlContent) as unknown
  return GuaranaConfigSchema.parse(raw)
}

export function loadConfigFromFile(filePath: string): GuaranaConfig {
  const content = readFileSync(filePath, 'utf-8')
  return loadConfig(content)
}
