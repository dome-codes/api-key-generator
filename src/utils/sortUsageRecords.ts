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
    case 'user':
    case 'technicalUserName':
      comparison = (
        a.technicalUserName ??
        a.userName ??
        ''
      ).localeCompare(String(b.technicalUserName ?? b.userName ?? ''))
      break
    case 'modelName':
    case 'model':
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
      const getTime = (r: EnhancedUsageRecord): number => {
        if (r.year != null && r.month != null && r.day != null) {
          return new Date(r.year, (r.month ?? 1) - 1, r.day ?? 1).getTime()
        }
        if (r.createDate && String(r.createDate).trim()) {
          const t = new Date(r.createDate).getTime()
          if (!Number.isNaN(t)) return t
        }
        return 0
      }
      comparison = getTime(a) - getTime(b)
      break
    }
    case 'apiKeyId':
      comparison = (a.apiKeyId || '').localeCompare(b.apiKeyId || '')
      break
    case 'tag':
      comparison = (a.tag || '').localeCompare(b.tag || '')
      break
    case 'quality':
      comparison = String(a.quality ?? '').localeCompare(String(b.quality ?? ''))
      break
    case 'imageSize': {
      const pixelsA = (a.sizeWidth ?? 0) * (a.sizeHeight ?? 0)
      const pixelsB = (b.sizeWidth ?? 0) * (b.sizeHeight ?? 0)
      comparison = pixelsA - pixelsB
      break
    }
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
