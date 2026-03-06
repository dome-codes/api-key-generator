/**
 * Wiederverwendbare Sortierlogik für Usage-Tabellen (AI Usage, ggf. Extraction).
 * Kann von UsageDetailedTable, ExtractionUsageDetailedTable und anderen genutzt werden.
 */
import type { EnhancedUsageRecord } from '@/types/frontend'

export type SortOrder = 'asc' | 'desc'

/**
 * Vergleicht zwei EnhancedUsageRecord-Einträge für ein gegebenes Feld und Sortierrichtung.
 * @returns Vergleichswert (< 0: a vor b, > 0: b vor a, 0: gleich)
 */
export function compareUsageRecords(
  a: EnhancedUsageRecord,
  b: EnhancedUsageRecord,
  field: string,
  order: SortOrder,
): number {
  let comparison = 0
  switch (field) {
    case 'userName':
      comparison = (a.userName || '').localeCompare(b.userName || '')
      break
    case 'modelName':
      comparison = (a.modelName || '').localeCompare(b.modelName || '')
      break
    case 'modelType': {
      const typeA = a.type || a.modelType || ''
      const typeB = b.type || b.modelType || ''
      comparison = typeA.localeCompare(typeB)
      break
    }
    case 'requests':
      comparison = (a.requests || 0) - (b.requests || 0)
      break
    case 'tokensIn':
      comparison = (a.tokensIn || 0) - (b.tokensIn || 0)
      break
    case 'tokensOut':
      comparison = (a.tokensOut || 0) - (b.tokensOut || 0)
      break
    case 'totalTokens':
      comparison = (a.totalTokens || 0) - (b.totalTokens || 0)
      break
    case 'cost':
      comparison = (a.cost || 0) - (b.cost || 0)
      break
    case 'date': {
      const dateA = new Date(a.year || 0, (a.month || 1) - 1, a.day || 1)
      const dateB = new Date(b.year || 0, (b.month || 1) - 1, b.day || 1)
      comparison = dateA.getTime() - dateB.getTime()
      break
    }
    case 'apiKeyId':
      comparison = (a.apiKeyId || '').localeCompare(b.apiKeyId || '')
      break
    default:
      comparison = 0
  }
  return order === 'asc' ? comparison : -comparison
}

/**
 * Sortiert ein Array von EnhancedUsageRecord nach Feld und Richtung.
 * Gibt eine neue, sortierte Kopie zurück (Original wird nicht verändert).
 */
export function sortUsageRecords(
  data: EnhancedUsageRecord[],
  field: string,
  order: SortOrder,
): EnhancedUsageRecord[] {
  return [...data].sort((a, b) => compareUsageRecords(a, b, field, order))
}
