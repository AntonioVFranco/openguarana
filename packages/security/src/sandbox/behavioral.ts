import type { PermissionManifest } from '../permissions/manifest.js'

export interface AccessLog {
  type:   'network' | 'fs-read' | 'fs-write' | 'env'
  target: string
}

export interface AccessViolation {
  type:    string
  target:  string
  reason:  string
}

export function detectUndeclaredAccess(
  logs: AccessLog[],
  manifest: PermissionManifest,
): AccessViolation[] {
  const violations: AccessViolation[] = []

  for (const log of logs) {
    if (log.type === 'network') {
      const allowed = manifest.network.allow.some(host =>
        log.target.startsWith(host) || log.target.includes(host),
      )
      if (!allowed) {
        violations.push({ type: 'network', target: log.target, reason: `Host not in network.allow` })
      }
    }

    if (log.type === 'fs-write') {
      const allowed = manifest.fs.write.some(path => log.target.startsWith(path))
      if (!allowed) {
        violations.push({ type: 'fs-write', target: log.target, reason: `Path not in fs.write` })
      }
    }

    if (log.type === 'fs-read') {
      const allowed = manifest.fs.read.some(path => log.target.startsWith(path))
      if (!allowed) {
        violations.push({ type: 'fs-read', target: log.target, reason: `Path not in fs.read` })
      }
    }
  }

  return violations
}
