import { describe, it, expect } from 'vitest'
import { hasPermission, ROLE_PERMISSIONS } from './roles.js'

describe('hasPermission', () => {
  it('owner can delete workspace', () => {
    expect(hasPermission('owner', 'workspace:delete')).toBe(true)
  })

  it('viewer cannot delete workspace', () => {
    expect(hasPermission('viewer', 'workspace:delete')).toBe(false)
  })

  it('member can write decisions', () => {
    expect(hasPermission('member', 'decisions:write')).toBe(true)
  })

  it('viewer cannot write decisions', () => {
    expect(hasPermission('viewer', 'decisions:write')).toBe(false)
  })

  it('admin can install skills', () => {
    expect(hasPermission('admin', 'skills:install')).toBe(true)
  })

  it('member cannot install skills', () => {
    expect(hasPermission('member', 'skills:install')).toBe(false)
  })
})
