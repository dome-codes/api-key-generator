/**
 * Extraction Usage API Service
 *
 * Dieser Service implementiert die server-seitige Filterung und Gruppierung
 * für Extraction Usage über die API. Parallel zum usageApiService strukturiert.
 */

import { getAdmin } from '@/api/admin/admin'
import type {
  AdminUsageExtractionGetV1Params,
  ExtractionRequestParamsGroupByParameterItem,
  UsageExtractionGetV1Params,
  UsageExtractionSummaryGetV1Params,
  UsageExtractionSummaryGetV1ByItem,
} from '@/api/types'
import type {
  EnhancedExtractionUsageRecord,
  ExtractionUsageFilterApi,
  ExtractionUsagePageResponse,
  ExtractionUsageSummaryPageResponse,
} from '@/types/frontend'
import type { Page } from '@/api/types'
import { getUsage } from '@/api/usage/usage'
import { debugLog as baseDebugLog } from '@/utils/debugLog'

// Debug-Log mit Präfix
const debugLog = (...args: unknown[]) => baseDebugLog('[extractionUsageApiService]', ...args)

/** Mappt Backend-Pagination auf Page (totalItems, totalPages, currentPage, pageSize) */
function mapPagination(backendPagination: unknown): Page | undefined {
  if (!backendPagination || typeof backendPagination !== 'object') {
    return undefined
  }
  const pag = backendPagination as Record<string, unknown>
  const totalItems = pag.totalItems ?? pag.total
  const currentPage = pag.currentPage ?? pag.page
  const pageSize = pag.pageSize ?? pag.limit
  const totalPages = pag.totalPages
  if (
    totalItems === undefined &&
    currentPage === undefined &&
    pageSize === undefined &&
    totalPages === undefined
  ) {
    return undefined
  }
  return {
    totalItems: typeof totalItems === 'number' ? totalItems : undefined,
    totalPages: typeof totalPages === 'number' ? totalPages : undefined,
    currentPage: typeof currentPage === 'number' ? currentPage : undefined,
    pageSize: typeof pageSize === 'number' ? pageSize : undefined,
  }
}

/** Response-Array aus Backend: data, items oder usage (andere OpenAPI wie bei AI). */
function getDataArray<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response
  if (!response || typeof response !== 'object') return []
  const o = response as Record<string, unknown>
  for (const key of ['data', 'items', 'usage'] as const) {
    const arr = o[key]
    if (Array.isArray(arr)) return arr
  }
  return []
}

/** Diagnose-Log für Extraction – in Konsole nach [EXTRACTION-API-DIAG] filtern und Ausgabe teilen. */
function diagLog(
  label: string,
  rawResponse: unknown,
  rawDataLength: number,
  firstItem: unknown,
  afterMap?: { length: number },
) {
  const show =
    typeof localStorage !== 'undefined' &&
    (localStorage.getItem('debug') === 'true' || import.meta.env?.DEV)
  if (!show) return

  const responseShape =
    rawResponse === null
      ? 'null'
      : Array.isArray(rawResponse)
        ? `Array(${rawResponse.length})`
        : typeof rawResponse === 'object' && rawResponse !== null
          ? `Object keys: ${Object.keys(rawResponse as object).join(', ')}`
          : typeof rawResponse

  const firstItemKeys =
    firstItem && typeof firstItem === 'object' && !Array.isArray(firstItem)
      ? Object.keys(firstItem as object).join(', ')
      : '-'

  debugLog('[EXTRACTION-API-DIAG]', label, {
    responseShape,
    rawDataLength,
    firstItemKeys,
    ...(afterMap && { afterMap }),
  })
}

/** Request-Format für Usage/Summarize: from_date=2026-01-31T00:00:00.000Z */
function toIsoDateTime(dateStr: string | undefined): string | undefined {
  if (!dateStr?.trim()) return undefined
  const s = dateStr.trim()
  if (s.includes('T')) return new Date(s).toISOString()
  return `${s}T00:00:00.000Z`
}

export const extractionUsageApiService = {
  /**
   * Lädt Extraction Usage-Daten mit server-seitiger Filterung und Pagination
   */
  async getUsageData(
    filter: ExtractionUsageFilterApi,
    useAdminApi: boolean = false,
  ): Promise<{ data: EnhancedExtractionUsageRecord[]; pagination: Page }> {
    try {
      debugLog('Loading extraction usage data with filter:', filter)

      const page = filter.page || 1
      const limit = filter.limit || 20
      const offset = (page - 1) * limit

      // Erstelle Basis-Params
      const baseParams = {
        from_date: toIsoDateTime(filter.fromDate),
        to_date: toIsoDateTime(filter.toDate),
        limit,
        offset, // Backend verwendet offset statt page
        provider: filter.provider,
        modelId: filter.modelId,
        userId: filter.userId,
        tag: filter.tag,
        apiKey: filter.apiKey,
      }

      // Füge status hinzu, wenn es definiert ist
      // Verwende Type-Assertion, da die generierten Types auf verschiedenen Systemen unterschiedlich sein können
      const params = (
        filter.status
          ? {
              ...baseParams,
              status: filter.status as
                | import('@/api/types').ExtractionRequestParamsStatusParameter
                | undefined,
            }
          : baseParams
      ) as (AdminUsageExtractionGetV1Params | UsageExtractionGetV1Params) & {
        offset?: number
      }

      // List: Admin-Route existiert (/v1/admin/usage/extraction), Summarize nicht – siehe getUsageSummary
      const apiResponse = useAdminApi
        ? await getAdmin().adminUsageExtractionGetV1(params)
        : await getUsage().usageExtractionGetV1(params)
      const response = apiResponse.data as
        | ExtractionUsagePageResponse
        | import('@/api/types').ExtractionUsageRecord[]
      const rawData = getDataArray<import('@/api/types').ExtractionUsageRecord>(response)

      debugLog('API response received:', response, 'rawData length:', rawData.length)
      diagLog('getUsageData (extraction)', response, rawData.length, rawData[0])

      // Konvertiere zu EnhancedExtractionUsageRecord
      const enhancedData = rawData.map((item: import('@/api/types').ExtractionUsageRecord) => ({
        id: item.id || `extraction-${Math.random().toString(36).substring(7)}`,
        operationId: item.operationId || item.id || `op-${Math.random().toString(36).substring(7)}`,
        status: item.status || 'completed',
        createDate: item.createDate || new Date().toISOString(),
        completedDate: item.completedDate,
        day: item.day,
        month: item.month,
        year: item.year,
        technicalUserId: item.technicalUserId || '',
        technicalUserName: (() => {
          const userId = item.technicalUserId || ''
          if (!userId || userId.trim() === '') return 'Unknown User'
          // Für technische User (SVC_*, e*, b*) zeige die ID direkt
          if (userId.startsWith('SVC_') || userId.startsWith('e') || userId.startsWith('b')) {
            return userId
          }
          return `User ${userId}`
        })(),
        apiKeyId: item.apiKeyId,
        tag: item.tag || '',
        provider: item.provider || '',
        modelId: item.modelId || '',
        documentType: item.documentType || '',
        pages: item.pages || 0,
        extractedFields: item.extractedFields || [],
        confidenceScore: item.confidenceScore || 0,
        cost: item.cost || 0,
      }))

      diagLog('getUsageData (extraction, after map)', response, rawData.length, rawData[0], {
        length: enhancedData.length,
      })

      // Extrahiere Pagination und mappe Backend-Feldnamen
      let pagination: Page | undefined
      if (
        response &&
        typeof response === 'object' &&
        !Array.isArray(response) &&
        'pagination' in response
      ) {
        const backendPagination = (response as ExtractionUsagePageResponse).pagination
        pagination = mapPagination(backendPagination) || backendPagination
      }

      return {
        data: enhancedData,
        pagination: pagination || {
          currentPage: filter.page || 1,
          pageSize: filter.limit || 20,
          totalItems: enhancedData.length,
          totalPages: 1,
        },
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (useAdminApi && status === 403) {
        debugLog(
          '403 bei admin/usage/extraction – Backend verweigert Admin-Extraction. Rolle/Scope prüfen.',
        )
        const error = new Error(
          'Keine Berechtigung für Admin Extraction (403). Backend-Rolle bzw. Scope "admin" prüfen.',
        )
        ;(error as { cause?: unknown }).cause = err
        throw error
      }
      debugLog('Error loading extraction usage data via API:', err)
      return {
        data: [],
        pagination: {
          currentPage: filter.page || 1,
          pageSize: filter.limit || 20,
          totalItems: 0,
          totalPages: 0,
        },
      }
    }
  },

  /**
   * Lädt Extraction Usage-Summary mit server-seitiger Gruppierung, Filterung und Pagination
   */
  async getUsageSummary(
    filter: ExtractionUsageFilterApi,
    useAdminApi: boolean = false,
  ): Promise<{ data: EnhancedExtractionUsageRecord[]; pagination: Page }> {
    try {
      debugLog('Loading extraction usage summary with filter:', filter)

      const page = filter.page || 1
      const limit = filter.limit || 20
      const offset = (page - 1) * limit

      const params: UsageExtractionSummaryGetV1Params & { offset?: number } = {
        from_date: toIsoDateTime(filter.fromDate),
        to_date: toIsoDateTime(filter.toDate),
        offset, // Backend verwendet offset statt page
        provider: filter.provider,
        modelId: filter.modelId,
        tag: filter.tag,
        by: filter.groupBy
          ? filter.groupBy
              .map((item) => {
                // Mappe alte Werte zu neuen Werten
                if (item === 'apikey') return undefined // apikey wird nicht mehr unterstützt
                if (item === 'user') return 'userId' as UsageExtractionSummaryGetV1ByItem
                // Prüfe ob der Wert im neuen Enum enthalten ist
                const validValues: UsageExtractionSummaryGetV1ByItem[] = [
                  'day',
                  'month',
                  'year',
                  'tag',
                  'modelId',
                  'userId',
                  'provider',
                ]
                return validValues.includes(item as UsageExtractionSummaryGetV1ByItem)
                  ? (item as UsageExtractionSummaryGetV1ByItem)
                  : undefined
              })
              .filter((item): item is UsageExtractionSummaryGetV1ByItem => item !== undefined)
          : undefined,
      }

      // Es gibt keine /v1/admin/usage/extraction/summarize – immer User-Summarize nutzen
      const apiResponse = await getUsage().usageExtractionSummaryGetV1(params)
      const response = apiResponse.data as
        | ExtractionUsageSummaryPageResponse
        | import('@/api/types').ExtractionUsageSummaryRecord[]
      const rawData = getDataArray<import('@/api/types').ExtractionUsageSummaryRecord>(response)

      debugLog('API summary response received:', response, 'rawData length:', rawData.length)
      diagLog('getUsageSummary (extraction)', response, rawData.length, rawData[0])

      // Konvertiere Summary zu EnhancedExtractionUsageRecord
      const enhancedData = rawData.map(
        (item: import('@/api/types').ExtractionUsageSummaryRecord) => ({
          id: `${item.provider}-${item.modelId}-${item.day || ''}-${item.month || ''}-${item.year || ''}`,
          operationId: `${item.provider}-${item.modelId}`,
          status: item.status || 'completed',
          createDate:
            item.year && item.month && item.day
              ? new Date(item.year, item.month - 1, item.day).toISOString()
              : new Date().toISOString(),
          completedDate: undefined,
          day: item.day,
          month: item.month,
          year: item.year,
          technicalUserId: item.technicalUserId,
          technicalUserName: `User ${item.technicalUserId}`,
          apiKeyId: item.apiKeyId,
          tag: item.tag,
          provider: item.provider,
          modelId: item.modelId,
          documentType: 'unknown',
          pages: item.totalPages,
          extractedFields: [],
          confidenceScore: item.averageConfidence,
          cost: item.cost,
        }),
      )

      diagLog('getUsageSummary (extraction, after map)', response, rawData.length, rawData[0], {
        length: enhancedData.length,
      })

      const pagination =
        response &&
        typeof response === 'object' &&
        !Array.isArray(response) &&
        'pagination' in response
          ? (response as ExtractionUsageSummaryPageResponse).pagination
          : undefined

      return {
        data: enhancedData,
        pagination: pagination || {
          currentPage: filter.page || 1,
          pageSize: filter.limit || 20,
          totalItems: enhancedData.length,
          totalPages: 1,
        },
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (useAdminApi && status === 403) {
        debugLog('403 bei admin/usage/extraction/summarize – Backend verweigert Admin-Extraction.')
        const error = new Error(
          'Keine Berechtigung für Admin Extraction (403). Backend-Rolle bzw. Scope "admin" prüfen.',
        )
        ;(error as { cause?: unknown }).cause = err
        throw error
      }
      debugLog('Error loading extraction usage summary via API:', err)
      return {
        data: [],
        pagination: {
          currentPage: filter.page || 1,
          pageSize: filter.limit || 20,
          totalItems: 0,
          totalPages: 0,
        },
      }
    }
  },
}

export default extractionUsageApiService
