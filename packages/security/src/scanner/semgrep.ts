import { execFile }      from 'node:child_process'
import { promisify }     from 'node:util'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)

const RULES_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  'rules/guarana-skill-rules.yaml',
)

export interface ScanFinding {
  id:       string
  severity: 'ERROR' | 'WARNING'
  message:  string
  path:     string
  line:     number
}

export interface ScanResult {
  score:           number      // 0–100
  errors:          ScanFinding[]
  warnings:        ScanFinding[]
  passed:          boolean     // score >= 70
  semgrepAvailable: boolean
}

export async function scanSkill(skillPath: string): Promise<ScanResult> {
  let stdout: string
  let semgrepAvailable = true

  try {
    const result = await execFileAsync('semgrep', [
      '--config', RULES_PATH,
      '--json',
      '--no-git-ignore',
      skillPath,
    ], { timeout: 10_000 })
    stdout = result.stdout
  } catch (err: unknown) {
    const error = err as { stdout?: string; code?: string; message?: string; killed?: boolean }

    // semgrep not installed or timed out — treat as unavailable
    if (
      error.code === 'ENOENT' ||
      (error.message ?? '').includes('not found') ||
      error.killed === true
    ) {
      semgrepAvailable = false
      return {
        score: 70,    // neutral score — can't scan
        errors: [],
        warnings: [],
        passed: true,
        semgrepAvailable: false,
      }
    }

    // semgrep exits non-zero when findings exist; stdout still has JSON
    stdout = error.stdout ?? '{}'
  }

  const parsed = JSON.parse(stdout) as {
    results?: Array<{
      check_id: string
      extra: { severity: string; message: string }
      path: string
      start: { line: number }
    }>
  }

  const findings = (parsed.results ?? []).map((r) => ({
    id:       r.check_id.split('.').at(-1) ?? r.check_id,
    severity: r.extra.severity.toUpperCase() as 'ERROR' | 'WARNING',
    message:  r.extra.message,
    path:     r.path,
    line:     r.start.line,
  }))

  const errors   = findings.filter(f => f.severity === 'ERROR')
  const warnings = findings.filter(f => f.severity === 'WARNING')

  // Score: start 100, -35 per ERROR, -10 per WARNING, floor 0
  const score = Math.max(0, 100 - errors.length * 35 - warnings.length * 10)

  return { score, errors, warnings, passed: score >= 70, semgrepAvailable }
}
