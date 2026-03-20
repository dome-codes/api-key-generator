/**
 * Extraction Usage API Service
 *
 * Dieser Service implementiert die server-seitige Filterung und Gruppierung
 * für Extraction Usage über die API. Parallel zum usageApiService strukturiert.
 */

import { getAdmin } from '@/api/admin/admin'
import type {
  AdminUsageExtractionGetV1Params,
  AdminUsageExtractionSummaryGetV1Params,
  UsageExtractionGetV1Params,
  UsageExtractionSummaryGetV1Params,
} from '@/api/types'
import { getUsage } from '@/api/usage/usage'
import type { EnhancedExtractionUsageRecord, ExtractionUsageFilterApi } from '@/types/frontend'
import { calculateExtractionCost } from '@/config/pricing'
import { debugLog as baseDebugLog } from '@/utils/debugLog'

// Debug-Log mit Präfix
const debugLog = (...args: unknown[]) => baseDebugLog('[extractionUsageApiService]', ...args)

type OrvalTypes = typeof import('@/api/types')
type Page = OrvalTypes extends { Page: infer P }
  ? P
  : {
      currentPage?: number
      pageSize?: number
      totalItems?: number
      totalPages?: number
    }

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
    const val = o[key]
    if (Array.isArray(val)) return val
    // Summarize ohne "by" liefert oft ein einzelnes Objekt unter data → als 1-Element-Array
    if (val != null && typeof val === 'object' && !Array.isArray(val)) return [val] as T[]
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

/** Zahlen aus Backend-Objekt lesen (camelCase + snake_case). */
function pickNum(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v)
      if (!Number.isNaN(n)) return n
    }
  }
  return undefined
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k]
    if (v == null) continue
    if (typeof v === 'string' && v.trim() !== '') return v.trim()
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  }
  return undefined
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
  userId?: string
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

/** Minimale Form eines Extraction-Summary-Records (API kann requests/pages oder operations/totalPages liefern) */
interface ExtractionUsageSummaryRecordShape {
  status?: string
  tag?: string
  provider?: string
  modelId?: string
  userId?: string
  apiKeyId?: string
  day?: number
  month?: number
  year?: number
  operations?: number
  requests?: number
  totalPages?: number
  pages?: number
  totalRequests?: number
  queryFields?: number
  averageConfidence?: number
  cost?: number
  totalCost?: number
  total_cost?: number
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
      const apiParams = filter.status ? { ...baseApiParams, status: filter.status } : baseApiParams

      // List: Admin-Route existiert (/v1/admin/usage/extraction), Summarize nicht – siehe getUsageSummary
      const apiResponse = useAdminApi
        ? await getAdmin().adminUsageExtractionGetV1(apiParams as AdminUsageExtractionGetV1Params)
        : await getUsage().usageExtractionGetV1(apiParams as UsageExtractionGetV1Params)
      const response = apiResponse.data as
        | ExtractionPageResponseShape
        | ExtractionUsageRecordShape[]
      const rawData = getDataArray<ExtractionUsageRecordShape>(response)

      debugLog('API response received:', response, 'rawData length:', rawData.length)
      diagLog('getUsageData (extraction)', response, rawData.length, rawData[0])

      // Konvertiere zu EnhancedExtractionUsageRecord (robust: snake_case + Aliase)
      const enhancedData = rawData.map((item: ExtractionUsageRecordShape) => {
        const raw = item as unknown as Record<string, unknown>

        const basePages =
          pickNum(raw, 'pages', 'totalPages', 'total_pages', 'pageCount', 'page_count') ??
          item.pages ??
          0

        const modelId =
          pickStr(raw, 'modelId', 'model_id', 'model') ?? item.modelId ?? ''

        let cost = pickNum(raw, 'cost', 'totalCost', 'total_cost', 'totalCosts', 'estimatedCost')
        if (cost == null || Number.isNaN(cost)) {
          const { finalCost } = calculateExtractionCost(basePages, modelId || 'unknown')
          cost = finalCost
        }

        const createDate =
          pickStr(raw, 'createDate', 'create_date', 'createdAt', 'created_at', 'timestamp', 'date') ??
          item.createDate

        const tag = pickStr(raw, 'tag', 'label', 'category', 'tags') ?? item.tag ?? ''

        const apiKeyId =
          pickStr(raw, 'apiKeyId', 'api_key_id', 'apiKey', 'api_key') ?? item.apiKeyId

        const userId = pickStr(raw, 'userId', 'user_id') ?? item.userId ?? ''

        let createDateOut = createDate
        if (!createDateOut) {
          const d = item.day
          const m = item.month
          const y = item.year
          if (d != null && m != null && y != null) {
            createDateOut = new Date(y, m - 1, d).toISOString()
          }
        }
        if (!createDateOut) createDateOut = new Date().toISOString()

        return {
          id:
            pickStr(raw, 'id') ||
            item.id ||
            `extraction-${Math.random().toString(36).substring(7)}`,
          operationId:
            pickStr(raw, 'operationId', 'operation_id') ||
            item.operationId ||
            item.id ||
            `op-${Math.random().toString(36).substring(7)}`,
          status: (pickStr(raw, 'status') || item.status || 'completed') as ExtractionUsageRecordShape['status'],
          createDate: createDateOut,
          completedDate: item.completedDate,
          day: item.day ?? pickNum(raw, 'day'),
          month: item.month ?? pickNum(raw, 'month'),
          year: item.year ?? pickNum(raw, 'year'),
          userId,
          userName: (() => {
            if (!userId || userId.trim() === '') return 'Unknown User'
            if (userId.startsWith('SVC_') || userId.startsWith('e') || userId.startsWith('b')) {
              return userId
            }
            return `User ${userId}`
          })(),
          apiKeyId,
          tag,
          provider: pickStr(raw, 'provider') ?? item.provider ?? '',
          modelId,
          documentType: pickStr(raw, 'documentType', 'document_type') ?? item.documentType ?? '',
          pages: basePages,
          extractedFields: item.extractedFields || [],
          cost,
        }
      })

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
      // Immer mit angefragter Seite und Limit synchron halten
      if (filter.page != null) {
        finalPagination.currentPage = filter.page
      }
      if (filter.limit != null) {
        finalPagination.pageSize = filter.limit
      }
      if (finalPagination.pageSize == null) {
        finalPagination.pageSize = filter.limit || 20
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

      // Summary-Endpoint: groupBy = day|month|year|modelId|tag|userId|provider|apiKeyId; Filter: tag, provider, modelId, from_date, to_date, optional userId
      const mappedBy = filter.groupBy
        ? filter.groupBy
            .map((item) => {
              const validValues = [
                'day',
                'month',
                'year',
                'tag',
                'modelId',
                'userId',
                'provider',
                'apiKeyId',
              ]
              return validValues.includes(item) ? item : undefined
            })
            .filter((item): item is string => item !== undefined)
        : undefined

      const apiParams = {
        from_date: toIsoDateTime(filter.fromDate),
        to_date: toIsoDateTimeEndOfDay(filter.toDate),
        tag: filter.tag,
        provider: filter.provider,
        modelId: filter.modelId,
        ...(filter.userId != null && filter.userId !== '' ? { userId: filter.userId } : {}),
        by: mappedBy as UsageExtractionSummaryGetV1Params['by'],
      } as Omit<UsageExtractionSummaryGetV1Params, 'page' | 'limit'>

      // Admin: /v1/admin/usage/extraction/summarize, User: /v1/usage/extraction/summarize
      const apiResponse = useAdminApi
        ? await getAdmin().adminUsageExtractionSummaryGetV1(
            apiParams as AdminUsageExtractionSummaryGetV1Params,
          )
        : await getUsage().usageExtractionSummaryGetV1(apiParams)
      const response = apiResponse.data as
        | ExtractionPageResponseShape
        | ExtractionUsageSummaryRecordShape[]
      const rawData = getDataArray<ExtractionUsageSummaryRecordShape>(response)

      debugLog('API summary response received:', response, 'rawData length:', rawData.length)
      diagLog('getUsageSummary (extraction)', response, rawData.length, rawData[0])

      // Konvertiere Summary zu EnhancedExtractionUsageRecord (robust: snake_case + Aliase wie bei getUsageData)
      const enhancedData = rawData.map((item: ExtractionUsageSummaryRecordShape) => {
        const raw = item as unknown as Record<string, unknown>

        const operations =
          pickNum(raw, 'operations', 'requests', 'totalRequests', 'total_requests') ?? 1
        const pages =
          pickNum(raw, 'pages', 'totalPages', 'total_pages', 'pageCount', 'page_count') ?? 0

        const modelId =
          pickStr(raw, 'modelId', 'model_id', 'model') ?? item.modelId ?? 'unknown'

        let cost = pickNum(raw, 'cost', 'totalCost', 'total_cost', 'totalCosts', 'estimatedCost')
        if (cost == null || Number.isNaN(cost)) {
          const { finalCost } = calculateExtractionCost(pages, modelId)
          cost = finalCost
        }

        const userId = pickStr(raw, 'userId', 'user_id') ?? item.userId ?? ''
        const apiKeyId = pickStr(raw, 'apiKeyId', 'api_key_id', 'apiKey', 'api_key') ?? item.apiKeyId
        const tag = pickStr(raw, 'tag', 'label', 'category', 'tags') ?? item.tag
        const provider = pickStr(raw, 'provider') ?? item.provider ?? ''
        const day = pickNum(raw, 'day') ?? item.day
        const month = pickNum(raw, 'month') ?? item.month
        const year = pickNum(raw, 'year') ?? item.year

        const documentType =
          pickStr(raw, 'documentType', 'document_type') ?? 'unknown'

        return {
          id: `${provider}-${modelId ?? ''}-${day ?? ''}-${month ?? ''}-${year ?? ''}-${userId}-${apiKeyId ?? ''}`,
          operationId: `${provider}-${modelId}`,
          status: (pickStr(raw, 'status') || item.status || 'completed') as string,
          createDate:
            year != null && month != null && day != null
              ? new Date(year, month - 1, day).toISOString()
              : new Date().toISOString(),
          completedDate: undefined,
          day,
          month,
          year,
          userId,
          userName: userId ? `User ${userId}` : '',
          apiKeyId,
          tag,
          provider,
          modelId,
          documentType,
          pages,
          extractedFields: [],
          cost,
          operations,
        }
      })

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
      // Immer mit angefragter Seite und Limit synchron halten
      if (filter.page != null) {
        finalPagination.currentPage = filter.page
      }
      if (filter.limit != null) {
        finalPagination.pageSize = filter.limit
      }
      if (finalPagination.pageSize == null) {
        finalPagination.pageSize = filter.limit || 20
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
