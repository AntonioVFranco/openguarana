import { describe, it, expect } from 'vitest'
import { buildNodePermissionFlags } from './runner.js'
import type { PermissionManifest } from '../permissions/manifest.js'

describe('buildNodePermissionFlags', () => {
  it('builds --allow-fs-read flags from manifest', () => {
    const manifest: PermissionManifest = {
      fs:      { read: ['/home/user/.openguarana/skills/foo'], write: [] },
      network: { allow: [] },
      env:     [],
    }
    const flags = buildNodePermissionFlags(manifest)
    expect(flags).toContain('--experimental-permission')
    expect(flags).toContain('--allow-fs-read=/home/user/.openguarana/skills/foo')
  })

  it('builds --allow-net flags from manifest', () => {
    const manifest: PermissionManifest = {
      fs:      { read: [], write: [] },
      network: { allow: ['api.github.com'] },
      env:     [],
    }
    const flags = buildNodePermissionFlags(manifest)
    expect(flags).toContain('--allow-net=api.github.com')
  })

  it('always includes --experimental-permission', () => {
    const manifest: PermissionManifest = {
      fs: { read: [], write: [] }, network: { allow: [] }, env: [],
    }
    const flags = buildNodePermissionFlags(manifest)
    expect(flags[0]).toBe('--experimental-permission')
  })
})
