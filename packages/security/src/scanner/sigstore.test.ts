import { describe, it, expect } from 'vitest'
import { getSignatureBadge } from './sigstore.js'

describe('getSignatureBadge', () => {
  it('returns unverified when no signature file exists', () => {
    expect(getSignatureBadge({ sigFileExists: false, verified: false })).toBe('unverified')
  })

  it('returns verified when signature passes', () => {
    expect(getSignatureBadge({ sigFileExists: true, verified: true })).toBe('verified')
  })

  it('returns tampered when signature fails verification', () => {
    expect(getSignatureBadge({ sigFileExists: true, verified: false })).toBe('tampered')
  })
})
