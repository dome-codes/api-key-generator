/**
 * Extraction Usage API Service
 *
 * Dieser Service implementiert die server-seitige Filterung und Gruppierung
 * für Extraction Usage über die API. Parallel zum usageApiService strukturiert.
 */

import { getAdmin } from '@/api/admin/admin'
import type {
  AdminUsageExtractionGetV1Params,
  UsageExtractionGetV1Params,
  UsageExtractionSummaryGetV1Params,
} from '@/api/types'
import type {
  EnhancedExtractionUsageRecord,
  ExtractionUsageFilterApi,
} from '@/types/frontend'
import { getUsage } from '@/api/usage/usage'
import { debugLog as baseDebugLog } from '@/utils/debugLog'

// Debug-Log mit Präfix
const debugLog = (...args: unknown[]) => baseDebugLog('[extractionUsageApiService]', ...args)

interface Page {
  currentPage?: number
  pageSize?: number
  totalItems?: number
  totalPages?: number
}

type SummaryByItem = 'day' | 'month' | 'year' | 'tag' | 'modelId' | 'user' | 'provider'

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

/** Konvertiert ein Datum zu ISO-DateTime für to_date (Ende des Tages für Overfetching) */
function toIsoDateTimeEndOfDay(dateStr: string | undefined): string | undefined {
  if (!dateStr?.trim()) return undefined
  const s = dateStr.trim()
  // Parse das Datum (funktioniert sowohl für "2026-02-20" als auch "2026-02-20T00:00:00.000Z")
  const date = new Date(s)
  // Setze immer auf Ende des Tages (23:59:59.999 UTC) für Overfetching
  // Verwende setUTCHours statt setHours, damit die Zeit in UTC gesetzt wird (nicht lokale Zeitzone)
  date.setUTCHours(23, 59, 59, 999)
  return date.toISOString()
}

/** Minimale Form der Extraction-API-Response (unabhängig von generierten Typnamen) */
interface ExtractionPageResponseShape {
  data?: unknown[]
  pagination?: unknown
}

/** Minimale Form eines Extraction-Usage-Records (unabhängig von generierten Typnamen) */
interface ExtractionUsageRecordShape {
  id?: string
  operationId?: string
  status?: string
  createDate?: string
  completedDate?: string | null
  day?: number
  month?: number
  year?: number
  technicalUserId?: string
  apiKeyId?: string
  tag?: string
  provider?: string
  modelId?: string
  documentType?: string
  pages?: number
  extractedFields?: Array<{ fieldName?: string; value?: string; confidence?: number }>
  confidenceScore?: number
  cost?: number
}

/** Minimale Form eines Extraction-Summary-Records */
interface ExtractionUsageSummaryRecordShape {
  status?: string
  tag?: string
  provider?: string
  modelId?: string
  technicalUserId?: string
  apiKeyId?: string
  day?: number
  month?: number
  year?: number
  operations?: number
  totalPages?: number
  averageConfidence?: number
  cost?: number
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

      // Backend verwendet nur offset und limit, nicht page
      // userId existiert nur bei Admin-Endpoint (/v1/admin/usage/extraction), nicht bei /v1/usage/extraction
      const baseApiParams: Record<string, unknown> = {
        from_date: toIsoDateTime(filter.fromDate),
        to_date: toIsoDateTimeEndOfDay(filter.toDate),
        limit,
        offset, // offset = (page - 1) * limit
        provider: filter.provider,
        modelId: filter.modelId,
        tag: filter.tag,
        apiKey: filter.apiKey,
        ...(useAdminApi && filter.userId ? { userId: filter.userId } : {}),
      }

      // Füge status hinzu, wenn es definiert ist (string reicht – andere OpenAPI kann andere Enums haben)
      const apiParams = filter.status
        ? { ...baseApiParams, status: filter.status }
        : baseApiParams
      
      // List: Admin-Route existiert (/v1/admin/usage/extraction), Summarize nicht – siehe getUsageSummary
      const apiResponse = useAdminApi
        ? await getAdmin().adminUsageExtractionGetV1(apiParams as AdminUsageExtractionGetV1Params)
        : await getUsage().usageExtractionGetV1(apiParams as UsageExtractionGetV1Params)
      const response = apiResponse.data as ExtractionPageResponseShape | ExtractionUsageRecordShape[]
      const rawData = getDataArray<ExtractionUsageRecordShape>(response)

      debugLog('API response received:', response, 'rawData length:', rawData.length)
      diagLog('getUsageData (extraction)', response, rawData.length, rawData[0])

      // Konvertiere zu EnhancedExtractionUsageRecord
      const enhancedData = rawData.map((item: ExtractionUsageRecordShape) => ({
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
        const backendPagination = (response as ExtractionPageResponseShape).pagination
        pagination = mapPagination(backendPagination) ?? (backendPagination as Page)
      }

      // Backend liefert currentPage im Pagination-Objekt, verwende das direkt
      // Falls nicht vorhanden, berechne aus offset und limit: currentPage = (offset / limit) + 1
      const calculatedPage = offset > 0 && limit > 0 ? Math.floor(offset / limit) + 1 : 1
      const finalPagination: Page = pagination || {
        currentPage: calculatedPage,
        pageSize: filter.limit || 20,
        totalItems: enhancedData.length,
        totalPages: 1,
      }
      // Nur wenn Backend keine currentPage liefert, berechne aus offset/limit
      if (finalPagination.currentPage == null || finalPagination.currentPage === undefined) {
        finalPagination.currentPage = calculatedPage
      }
      // Wenn Backend eine unpassende currentPage liefert, vertraue auf angefragte Seite.
      if (filter.page && finalPagination.currentPage !== filter.page) {
        finalPagination.currentPage = filter.page
      }

      return {
        data: enhancedData,
        pagination: finalPagination,
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
      // Berechne currentPage aus offset/limit
      const page = filter.page || 1
      const limit = filter.limit || 20
      const offset = (page - 1) * limit
      const calculatedPage = offset > 0 && limit > 0 ? Math.floor(offset / limit) + 1 : 1
      return {
        data: [],
        pagination: {
          currentPage: calculatedPage,
          pageSize: limit,
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

      // Backend verwendet nur offset und limit, nicht page
      // Erstelle params-Objekt OHNE page, damit es nicht im Query-String erscheint
      const apiParams: Omit<UsageExtractionSummaryGetV1Params, 'page'> & { offset?: number } = {
        from_date: toIsoDateTime(filter.fromDate),
        to_date: toIsoDateTimeEndOfDay(filter.toDate),
        offset, // offset = (page - 1) * limit
        provider: filter.provider,
        modelId: filter.modelId,
        tag: filter.tag,
        by: filter.groupBy
          ? filter.groupBy
              .map((item) => {
                // Mappe alte Werte zu neuen Werten
                if (item === 'apikey') return undefined // apikey wird nicht mehr unterstützt
                if (item === 'user') return 'user' as SummaryByItem
                // Prüfe ob der Wert im neuen Enum enthalten ist
                const validValues: SummaryByItem[] = [
                  'day',
                  'month',
                  'year',
                  'tag',
                  'modelId',
                  'user',
                  'provider',
                ]
                return validValues.includes(item as SummaryByItem)
                  ? (item as SummaryByItem)
                  : undefined
              })
              .filter((item): item is SummaryByItem => item !== undefined)
          : undefined,
      }
      
      // Es gibt keine /v1/admin/usage/extraction/summarize – immer User-Summarize nutzen
      const apiResponse = await getUsage().usageExtractionSummaryGetV1(apiParams)
      const response = apiResponse.data as
        | ExtractionPageResponseShape
        | ExtractionUsageSummaryRecordShape[]
      const rawData = getDataArray<ExtractionUsageSummaryRecordShape>(response)

      debugLog('API summary response received:', response, 'rawData length:', rawData.length)
      diagLog('getUsageSummary (extraction)', response, rawData.length, rawData[0])

      // Konvertiere Summary zu EnhancedExtractionUsageRecord
      const enhancedData = rawData.map(
        (item: ExtractionUsageSummaryRecordShape) => ({
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

      const backendPagination =
        response &&
        typeof response === 'object' &&
        !Array.isArray(response) &&
        'pagination' in response
          ? (response as ExtractionPageResponseShape).pagination
          : undefined
      const pagination = mapPagination(backendPagination) ?? (backendPagination as Page | undefined)

      // Berechne currentPage aus offset/limit falls Backend keine Pagination liefert
      const calculatedPage = offset > 0 && limit > 0 ? Math.floor(offset / limit) + 1 : 1
      const finalPagination: Page = pagination || {
        currentPage: calculatedPage,
        pageSize: filter.limit || 20,
        totalItems: enhancedData.length,
        totalPages: 1,
      }
      // Wenn Backend keine currentPage liefert, berechne aus offset/limit
      if (finalPagination.currentPage == null || finalPagination.currentPage === undefined) {
        finalPagination.currentPage = calculatedPage
      }
      // Wenn Backend eine unpassende currentPage liefert, vertraue auf angefragte Seite.
      if (filter.page && finalPagination.currentPage !== filter.page) {
        finalPagination.currentPage = filter.page
      }

      return {
        data: enhancedData,
        pagination: finalPagination,
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
      // Berechne currentPage aus offset/limit
      const page = filter.page || 1
      const limit = filter.limit || 20
      const offset = (page - 1) * limit
      const calculatedPage = offset > 0 && limit > 0 ? Math.floor(offset / limit) + 1 : 1
      return {
        data: [],
        pagination: {
          currentPage: calculatedPage,
          pageSize: limit,
          totalItems: 0,
          totalPages: 0,
        },
      }
    }
  },
}

export default extractionUsageApiService
