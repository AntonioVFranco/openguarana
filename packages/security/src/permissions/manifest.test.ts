import { describe, it, expect } from 'vitest'
import { parsePermissionManifest } from './manifest.js'

describe('parsePermissionManifest', () => {
  it('parses a valid permission manifest', () => {
    const yaml = `
permissions:
  fs:
    read:  ["~/.openguarana/skills/my-skill"]
    write: []
  network:
    allow: ["api.github.com"]
  env: []
`
    const manifest = parsePermissionManifest(yaml)
    expect(manifest.fs.read).toEqual(['~/.openguarana/skills/my-skill'])
    expect(manifest.fs.write).toEqual([])
    expect(manifest.network.allow).toEqual(['api.github.com'])
    expect(manifest.env).toEqual([])
  })

  it('applies safe defaults when permissions block is missing', () => {
    const manifest = parsePermissionManifest('')
    expect(manifest.fs.read).toEqual([])
    expect(manifest.fs.write).toEqual([])
    expect(manifest.network.allow).toEqual([])
    expect(manifest.env).toEqual([])
  })

  it('rejects wildcard network allow', () => {
    const yaml = `
permissions:
  network:
    allow: ["*"]
`
    expect(() => parsePermissionManifest(yaml)).toThrow('wildcard')
  })
})
