export type DoraBand = 'elite' | 'high' | 'medium' | 'low'

export interface DoraMetrics {
  deployFrequencyPerDay: number   // deployments per day
  leadTimeHours:         number   // p50 lead time in hours
  changeFailureRatePct:  number   // % of deploys that cause incidents
  timeToRestoreHours:    number   // p50 MTTR in hours
}

function bandForMetric(metric: keyof DoraMetrics, value: number): DoraBand {
  // DORA thresholds (standard bands)
  const thresholds: Record<keyof DoraMetrics, [number, number, number]> = {
    deployFrequencyPerDay: [1,    1/7,   1/30],  // elite>=1/day, high>=1/week, medium>=1/month
    leadTimeHours:         [1,    24,    168],    // elite<1h, high<24h, medium<168h (1 week)
    changeFailureRatePct:  [5,    10,    15],     // elite<5%, high<10%, medium<15%
    timeToRestoreHours:    [1,    24,    168],    // elite<1h, high<24h, medium<168h
  }

  const [eliteT, highT, medT] = thresholds[metric]!

  if (metric === 'deployFrequencyPerDay') {
    // Higher is better
    if (value >= eliteT) return 'elite'
    if (value >= highT)  return 'high'
    if (value >= medT)   return 'medium'
    return 'low'
  }

  // Lower is better (latency/rate metrics)
  if (value < eliteT) return 'elite'
  if (value < highT)  return 'high'
  if (value < medT)   return 'medium'
  return 'low'
}

const BAND_ORDER: DoraBand[] = ['elite', 'high', 'medium', 'low']

export function classifyDoraBand(metrics: DoraMetrics): DoraBand {
  const bands = (Object.keys(metrics) as (keyof DoraMetrics)[]).map(
    k => bandForMetric(k, metrics[k]),
  )
  // Overall band is the worst individual band
  return bands.reduce((worst, b) =>
    BAND_ORDER.indexOf(b) > BAND_ORDER.indexOf(worst) ? b : worst,
  )
}

export function computeLeadTime(commitAt: Date, deployAt: Date): number {
  return (deployAt.getTime() - commitAt.getTime()) / (1000 * 60 * 60)
}
