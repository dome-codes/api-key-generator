/**
 * Tags Service
 *
 * Lädt Top Tags für AI und Extraction Usage über den summarize Endpunkt
 */

import { usageApiService } from '@/services/usageApiService'
import { extractionUsageApiService } from '@/services/extractionUsageApiService'
import { debugLog } from '@/utils/debugLog'

export interface TagInfo {
  tag: string
  count: number
}

/**
 * Lädt Top Tags für AI Usage über summarize Endpunkt mit by: ['tag']
 */
export async function getTopAITags(
  fromDate?: string,
  toDate?: string,
  limit: number = 10,
  useAdminApi: boolean = false,
): Promise<TagInfo[]> {
  try {
    const result = await usageApiService.getUsageSummary(
      {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: 1,
        limit,
        groupBy: ['tag'],
      },
      useAdminApi,
    )

    // Konvertiere zu TagInfo Format
    const tags: TagInfo[] = result.data
      .filter((item) => item.tag && item.tag !== '')
      .map((item) => ({
        tag: item.tag || '',
        count: item.requests || 0,
      }))
      .sort((a, b) => b.count - a.count) // Sortiere nach Anzahl absteigend

    debugLog('[tagsService] Top AI tags loaded:', tags)
    return tags
  } catch (error) {
    console.error('[tagsService] Error loading top AI tags:', error)
    return []
  }
}

/**
 * Lädt Top Tags für Extraction Usage über summarize Endpunkt mit by: ['tag']
 */
export async function getTopExtractionTags(
  fromDate?: string,
  toDate?: string,
  limit: number = 10,
  useAdminApi: boolean = false,
): Promise<TagInfo[]> {
  try {
    const result = await extractionUsageApiService.getUsageSummary(
      {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: 1,
        limit,
        groupBy: ['tag'],
      },
      useAdminApi,
    )

    // Konvertiere zu TagInfo Format
    const tags: TagInfo[] = result.data
      .filter((item) => item.tag && item.tag !== '')
      .map((item) => ({
        tag: item.tag || '',
        count: item.operations || 0,
      }))
      .sort((a, b) => b.count - a.count) // Sortiere nach Anzahl absteigend

    debugLog('[tagsService] Top extraction tags loaded:', tags)
    return tags
  } catch (error) {
    console.error('[tagsService] Error loading top extraction tags:', error)
    return []
  }
}

/**
 * Lädt alle Tags (für "Mehr anzeigen")
 */
export async function getAllAITags(
  fromDate?: string,
  toDate?: string,
  useAdminApi: boolean = false,
): Promise<TagInfo[]> {
  return getTopAITags(fromDate, toDate, 1000, useAdminApi) // Großes Limit für alle Tags
}

/**
 * Lädt alle Tags für Extraction (für "Mehr anzeigen")
 */
export async function getAllExtractionTags(
  fromDate?: string,
  toDate?: string,
  useAdminApi: boolean = false,
): Promise<TagInfo[]> {
  return getTopExtractionTags(fromDate, toDate, 1000, useAdminApi) // Großes Limit für alle Tags
}
