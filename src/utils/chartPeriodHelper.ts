/**
 * Helper-Funktionen für Chart-Perioden-Konvertierung
 * Unterstützt tägliche, wöchentliche und monatliche Gruppierungen
 */

export type ChartPeriod = 'daily' | 'weekly' | 'monthly' | 'hourly'

export interface PeriodConfig {
  label: string
  groupBy: string[]
  formatLabel: (date: Date) => string
  getStartOfPeriod: (date: Date) => Date
  getEndOfPeriod: (date: Date) => Date
}

/**
 * Konfiguration für verschiedene Chart-Perioden
 */
export const PERIOD_CONFIGS: Record<ChartPeriod, PeriodConfig> = {
  hourly: {
    label: 'Stündlich',
    groupBy: ['hour', 'day', 'month', 'year'],
    formatLabel: (date: Date) => {
      return `${String(date.getHours()).padStart(2, '0')}:00`
    },
    getStartOfPeriod: (date: Date) => {
      const d = new Date(date)
      d.setMinutes(0)
      d.setSeconds(0)
      d.setMilliseconds(0)
      return d
    },
    getEndOfPeriod: (date: Date) => {
      const d = new Date(date)
      d.setMinutes(59)
      d.setSeconds(59)
      d.setMilliseconds(999)
      return d
    },
  },
  daily: {
    label: 'Täglich',
    groupBy: ['day', 'month', 'year'],
    formatLabel: (date: Date) => {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    },
    getStartOfPeriod: (date: Date) => {
      const d = new Date(date)
      d.setHours(0)
      d.setMinutes(0)
      d.setSeconds(0)
      d.setMilliseconds(0)
      return d
    },
    getEndOfPeriod: (date: Date) => {
      const d = new Date(date)
      d.setHours(23)
      d.setMinutes(59)
      d.setSeconds(59)
      d.setMilliseconds(999)
      return d
    },
  },
  weekly: {
    label: 'Wöchentlich',
    groupBy: ['week', 'month', 'year'],
    formatLabel: (date: Date) => {
      const weekStart = getWeekStart(date)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return `${weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`
    },
    getStartOfPeriod: (date: Date) => {
      return getWeekStart(date)
    },
    getEndOfPeriod: (date: Date) => {
      const weekStart = getWeekStart(date)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23)
      weekEnd.setMinutes(59)
      weekEnd.setSeconds(59)
      weekEnd.setMilliseconds(999)
      return weekEnd
    },
  },
  monthly: {
    label: 'Monatlich',
    groupBy: ['month', 'year'],
    formatLabel: (date: Date) => {
      return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    },
    getStartOfPeriod: (date: Date) => {
      const d = new Date(date.getFullYear(), date.getMonth(), 1)
      d.setHours(0)
      d.setMinutes(0)
      d.setSeconds(0)
      d.setMilliseconds(0)
      return d
    },
    getEndOfPeriod: (date: Date) => {
      const d = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      d.setHours(23)
      d.setMinutes(59)
      d.setSeconds(59)
      d.setMilliseconds(999)
      return d
    },
  },
}

/**
 * Berechnet den Start einer Woche (Montag)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Montag als Start
  d.setDate(diff)
  d.setHours(0)
  d.setMinutes(0)
  d.setSeconds(0)
  d.setMilliseconds(0)
  return d
}

/**
 * Konvertiert Daten für eine bestimmte Periode
 */
export function convertToPeriod(
  data: Array<{ createDate: string; [key: string]: unknown }>,
  period: ChartPeriod,
): Array<{ period: string; date: Date; [key: string]: unknown }> {
  const config = PERIOD_CONFIGS[period]
  const periodMap = new Map<string, { period: string; date: Date; [key: string]: unknown }>()

  data.forEach((item) => {
    const date = new Date(item.createDate)
    const periodStart = config.getStartOfPeriod(date)
    const periodKey = periodStart.toISOString()

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        period: config.formatLabel(periodStart),
        date: periodStart,
        ...item,
        createDate: periodStart.toISOString(),
      })
    } else {
      const existing = periodMap.get(periodKey)
      // Aggregiere Werte (z.B. requests, tokens, cost)
      if (typeof existing.requests === 'number' && typeof item.requests === 'number') {
        existing.requests += item.requests
      }
      if (typeof existing.tokensIn === 'number' && typeof item.tokensIn === 'number') {
        existing.tokensIn += item.tokensIn
      }
      if (typeof existing.tokensOut === 'number' && typeof item.tokensOut === 'number') {
        existing.tokensOut += item.tokensOut
      }
      if (typeof existing.cost === 'number' && typeof item.cost === 'number') {
        existing.cost += item.cost
      }
      if (typeof existing.operations === 'number' && typeof item.operations === 'number') {
        existing.operations += item.operations
      }
      if (typeof existing.pages === 'number' && typeof item.pages === 'number') {
        existing.pages += item.pages
      }
    }
  })

  return Array.from(periodMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Generiert Labels für Chart-Achsen basierend auf Periode
 */
export function generateChartLabels(startDate: Date, endDate: Date, period: ChartPeriod): string[] {
  const config = PERIOD_CONFIGS[period]
  const labels: string[] = []
  const current = new Date(config.getStartOfPeriod(startDate))
  const end = new Date(config.getEndOfPeriod(endDate))

  while (current <= end) {
    labels.push(config.formatLabel(current))
    // Nächste Periode
    if (period === 'hourly') {
      current.setHours(current.getHours() + 1)
    } else if (period === 'daily') {
      current.setDate(current.getDate() + 1)
    } else if (period === 'weekly') {
      current.setDate(current.getDate() + 7)
    } else if (period === 'monthly') {
      current.setMonth(current.getMonth() + 1)
    }
  }

  return labels
}

/**
 * Gibt die groupBy-Parameter für API-Calls zurück
 */
export function getGroupByForPeriod(period: ChartPeriod): string[] {
  return PERIOD_CONFIGS[period].groupBy
}
