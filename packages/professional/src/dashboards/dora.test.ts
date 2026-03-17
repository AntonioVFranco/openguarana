import { describe, it, expect } from 'vitest'
import { classifyDoraBand, computeLeadTime } from './dora.js'

describe('classifyDoraBand', () => {
  it('classifies elite performers correctly', () => {
    const band = classifyDoraBand({
      deployFrequencyPerDay: 1.5,
      leadTimeHours:         0.5,
      changeFailureRatePct:  3,
      timeToRestoreHours:    0.5,
    })
    expect(band).toBe('elite')
  })

  it('classifies low performers correctly', () => {
    const band = classifyDoraBand({
      deployFrequencyPerDay: 0.01,
      leadTimeHours:         200,
      changeFailureRatePct:  20,
      timeToRestoreHours:    200,
    })
    expect(band).toBe('low')
  })

  it('overall band is determined by the worst individual metric', () => {
    const band = classifyDoraBand({
      deployFrequencyPerDay: 1.0,   // elite
      leadTimeHours:         0.5,   // elite
      changeFailureRatePct:  3,     // elite
      timeToRestoreHours:    200,   // low — pulls overall to low
    })
    expect(band).toBe('low')
  })
})

describe('computeLeadTime', () => {
  it('computes lead time in hours between commit and deploy', () => {
    const commitAt = new Date('2026-03-16T10:00:00Z')
    const deployAt = new Date('2026-03-16T11:30:00Z')
    expect(computeLeadTime(commitAt, deployAt)).toBeCloseTo(1.5)
  })
})
