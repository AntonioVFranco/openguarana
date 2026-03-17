export interface InvestorUpdateInput {
  workspaceName: string
  wins:    string[]
  blockers:string[]
  metrics: { label: string; value: string }[]
  asks:    string[]
}

export function buildInvestorUpdateDraft(input: InvestorUpdateInput): string {
  const { workspaceName, wins, blockers, metrics, asks } = input
  const date = new Date().toISOString().split('T')[0]

  const lines: string[] = [
    `# ${workspaceName} — Investor Update`,
    `*${date}*`,
    '',
    '## Wins',
    ...(wins.length > 0 ? wins.map(w => `- ${w}`) : ['- None this period']),
    '',
    '## Blockers',
    ...(blockers.length > 0 ? blockers.map(b => `- ${b}`) : ['- None']),
    '',
    '## Metrics',
    ...(metrics.length > 0 ? metrics.map(m => `- **${m.label}:** ${m.value}`) : ['- No metrics provided']),
    '',
    '## Asks',
    ...(asks.length > 0 ? asks.map(a => `- ${a}`) : ['- None']),
  ]

  return lines.join('\n')
}
