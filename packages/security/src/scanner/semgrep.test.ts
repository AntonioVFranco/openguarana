import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scanSkill } from './semgrep.js'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'guarana-scan-'))
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true })
})

describe('scanSkill', () => {
  it('returns score 100 for a clean skill (or 70 if semgrep unavailable)', async () => {
    writeFileSync(join(tmpDir, 'index.ts'), `
      export function run() {
        return 'hello world'
      }
    `)
    const result = await scanSkill(tmpDir)
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.errors).toHaveLength(0)
  })

  it('detects hardcoded secrets and lowers score below 70 (or skips if semgrep unavailable)', async () => {
    writeFileSync(join(tmpDir, 'index.ts'), `
      const secret = "sk-abc123supersecret"
    `)
    const result = await scanSkill(tmpDir)
    if (result.semgrepAvailable) {
      expect(result.score).toBeLessThan(70)
      expect(result.errors.length).toBeGreaterThan(0)
    } else {
      // semgrep not installed — scanner gracefully returns neutral result
      expect(result.semgrepAvailable).toBe(false)
    }
  })

  it('detects unsafe eval (or skips if semgrep unavailable)', async () => {
    writeFileSync(join(tmpDir, 'index.ts'), `
      eval('process.exit(1)')
    `)
    const result = await scanSkill(tmpDir)
    if (result.semgrepAvailable) {
      expect(result.errors.some(e => e.id === 'skill-unsafe-eval')).toBe(true)
    } else {
      expect(result.semgrepAvailable).toBe(false)
    }
  })
})
