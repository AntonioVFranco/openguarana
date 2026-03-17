import { describe, it, expect } from 'vitest'
import { buildInvestorUpdateDraft } from './investor-update.js'

describe('buildInvestorUpdateDraft', () => {
  it('produces a draft with expected sections', () => {
    const draft = buildInvestorUpdateDraft({
      workspaceName: 'Acme',
      wins:    ['Closed 3 new customers', 'Launched v2'],
      blockers:['Hiring backend engineer'],
      metrics: [{ label: 'MRR', value: '$12k' }],
      asks:    ['Intro to a16z'],
    })
    expect(draft).toContain('## Wins')
    expect(draft).toContain('Closed 3 new customers')
    expect(draft).toContain('## Blockers')
    expect(draft).toContain('## Metrics')
    expect(draft).toContain('MRR')
    expect(draft).toContain('## Asks')
  })

  it('returns a non-empty string', () => {
    const draft = buildInvestorUpdateDraft({
      workspaceName: 'Test',
      wins: [], blockers: [], metrics: [], asks: [],
    })
    expect(draft.length).toBeGreaterThan(0)
  })
})
