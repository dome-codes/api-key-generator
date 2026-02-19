/**
 * Utility-Funktionen für Datums-Berechnungen und Formatierung
 */

/**
 * Formatiert ein Datum im deutschen Format
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
  return dateObj.toLocaleDateString('de-DE', { ...defaultOptions, ...options })
}

/**
 * Formatiert ein Datum mit Zeit
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatiert nur die Zeit
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Berechnet die Differenz zwischen zwei Datumswerten in Tagen
 */
export function daysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Fügt Tage zu einem Datum hinzu
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Subtrahiert Tage von einem Datum
 */
export function subtractDays(date: Date | string, days: number): Date {
  return addDays(date, -days)
}

/**
 * Gibt den Start des Tages zurück (00:00:00)
 */
export function startOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Gibt das Ende des Tages zurück (23:59:59.999)
 */
export function endOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Gibt den Start des Monats zurück
 */
export function startOfMonth(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1, 0, 0, 0, 0)
}

/**
 * Gibt das Ende des Monats zurück
 */
export function endOfMonth(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0, 23, 59, 59, 999)
}

/**
 * Gibt den Start des Jahres zurück
 */
export function startOfYear(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Date(dateObj.getFullYear(), 0, 1, 0, 0, 0, 0)
}

/**
 * Gibt das Ende des Jahres zurück
 */
export function endOfYear(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Date(dateObj.getFullYear(), 11, 31, 23, 59, 59, 999)
}

/**
 * Konvertiert ein Datum zu ISO-String (nur Datum, keine Zeit)
 */
export function toISODateString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString().split('T')[0]
}

/**
 * Konvertiert ein Datum zu ISO-String mit Zeit
 */
export function toISOString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString()
}

/**
 * Prüft ob ein Datum innerhalb eines Bereichs liegt
 */
export function isDateInRange(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string,
): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  return dateObj >= start && dateObj <= end
}

/**
 * Berechnet relative Datumsangaben
 */
export function getRelativeDateRange(
  range:
    | 'today'
    | 'yesterday'
    | 'last7days'
    | 'last30days'
    | 'last90days'
    | 'thisMonth'
    | 'lastMonth',
): { start: Date; end: Date } {
  const today = new Date()
  const end = endOfDay(today)

  switch (range) {
    case 'today':
      return { start: startOfDay(today), end }
    case 'yesterday': {
      const yesterday = subtractDays(today, 1)
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) }
    }
    case 'last7days':
      return { start: startOfDay(subtractDays(today, 6)), end }
    case 'last30days':
      return { start: startOfDay(subtractDays(today, 29)), end }
    case 'last90days':
      return { start: startOfDay(subtractDays(today, 89)), end }
    case 'thisMonth':
      return { start: startOfMonth(today), end }
    case 'lastMonth': {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
    }
    default:
      return { start: startOfDay(today), end }
  }
}

/**
 * Formatiert eine relative Datumsangabe für die Anzeige
 */
export function formatRelativeDate(range: string): string {
  const ranges: Record<string, string> = {
    today: 'Heute',
    yesterday: 'Gestern',
    last7days: 'Letzte 7 Tage',
    last30days: 'Letzte 30 Tage',
    last90days: 'Letzte 90 Tage',
    thisMonth: 'Dieser Monat',
    lastMonth: 'Letzter Monat',
  }
  return ranges[range] || range
}

/**
 * Normalisiert ein Datum auf UTC (ignoriert Zeitzone)
 */
export function normalizeToUTC(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()))
}
