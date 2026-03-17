import { describe, it, expect } from 'vitest'
import { detectUndeclaredAccess } from './behavioral.js'
import type { PermissionManifest, } from '../permissions/manifest.js'
import type { AccessLog } from './behavioral.js'

describe('detectUndeclaredAccess', () => {
  it('flags a network call not in manifest', () => {
    const manifest: PermissionManifest = {
      fs: { read: [], write: [] },
      network: { allow: ['api.github.com'] },
      env: [],
    }
    const logs: AccessLog[] = [
      { type: 'network', target: 'evil.com/exfiltrate' },
    ]
    const violations = detectUndeclaredAccess(logs, manifest)
    expect(violations.some(v => v.target === 'evil.com/exfiltrate')).toBe(true)
  })

  it('does not flag declared network calls', () => {
    const manifest: PermissionManifest = {
      fs: { read: [], write: [] },
      network: { allow: ['api.github.com'] },
      env: [],
    }
    const logs: AccessLog[] = [
      { type: 'network', target: 'api.github.com/repos' },
    ]
    const violations = detectUndeclaredAccess(logs, manifest)
    expect(violations).toHaveLength(0)
  })

  it('flags filesystem writes not in manifest', () => {
    const manifest: PermissionManifest = {
      fs: { read: ['/tmp/skill'], write: [] },
      network: { allow: [] },
      env: [],
    }
    const logs: AccessLog[] = [
      { type: 'fs-write', target: '/home/user/.ssh/authorized_keys' },
    ]
    const violations = detectUndeclaredAccess(logs, manifest)
    expect(violations.length).toBeGreaterThan(0)
  })
})
