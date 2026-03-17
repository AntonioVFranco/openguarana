import { spawn }             from 'node:child_process'
import type { PermissionManifest } from '../permissions/manifest.js'

export function buildNodePermissionFlags(manifest: PermissionManifest): string[] {
  const flags: string[] = ['--experimental-permission']

  for (const path of manifest.fs.read) {
    flags.push(`--allow-fs-read=${path}`)
  }
  for (const path of manifest.fs.write) {
    flags.push(`--allow-fs-write=${path}`)
  }
  for (const host of manifest.network.allow) {
    flags.push(`--allow-net=${host}`)
  }
  for (const envVar of manifest.env) {
    flags.push(`--allow-env=${envVar}`)
  }

  return flags
}

export interface SandboxResult {
  exitCode: number
  stdout:   string
  stderr:   string
}

export function runSkillSandboxed(
  skillEntrypoint: string,
  manifest: PermissionManifest,
  args: string[] = [],
): Promise<SandboxResult> {
  return new Promise((resolve, reject) => {
    const permissionFlags = buildNodePermissionFlags(manifest)
    const child = spawn(
      process.execPath,
      [...permissionFlags, skillEntrypoint, ...args],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    child.on('close', (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr })
    })

    child.on('error', reject)
  })
}
