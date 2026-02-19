/**
 * Usage API Service
 *
 * Dieser Service implementiert die server-seitige Filterung und Gruppierung
 * über die API. Er läuft parallel zum bestehenden usageAnalyticsService,
 * der die Client-seitige Logik enthält.
 *
 * Verwendung:
 * - useUsageApi() Composable nutzt diesen Service
 * - Alle Filterung und Gruppierung erfolgt server-seitig
 * - Pagination wird vollständig über die API gehandhabt
 */

import { getAdmin } from '@/api/admin/admin'
import { getUsage } from '@/api/usage/usage'
import type {
  EnhancedUsageRecord,
  ModelUsageType,
  SummaryUsage,
  SummaryUsagePageResponse,
  UsageFilterApi,
  UsagePageResponse,
} from '@/types/frontend'
import type { Page } from '@/api/types'
import type {
  AIRequestParamsGroupByParameterItem,
  AIUsageRecord,
  AIUsageSummaryRecord,
} from '@/api/types'
import { calculateCost } from '@/config/pricing'
import { debugLog as baseDebugLog } from '@/utils/debugLog'

// Debug-Log mit Präfix
const debugLog = (...args: unknown[]) => baseDebugLog('[usageApiService]', ...args)

/**
 * Mappt Backend-Pagination auf Page (totalItems, totalPages, currentPage, pageSize)
 */
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

  const mapped: Page = {}
  if (typeof totalItems === 'number') mapped.totalItems = totalItems
  if (typeof totalPages === 'number') mapped.totalPages = totalPages
  if (typeof currentPage === 'number') mapped.currentPage = currentPage
  if (typeof pageSize === 'number') mapped.pageSize = pageSize

  // Nur zurückgeben, wenn mindestens ein Feld gesetzt ist
  if (Object.keys(mapped).length === 0) {
    return undefined
  }

  return mapped
}

/** Diagnose-Log für andere OpenAPI/Backend: immer in DEV oder wenn localStorage.debug=true. Ausgabe hier kopieren und teilen. */
function diagLog(
  label: string,
  rawResponse: unknown,
  rawDataLength: number,
  firstItem: unknown,
  afterMap?: {
    length: number
    firstTokens?: { tokensIn: number; tokensOut: number; requests: number }
  },
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
  const firstItemSample =
    firstItem && typeof firstItem === 'object'
      ? JSON.stringify(
          Object.fromEntries(
            Object.entries(firstItem as object).map(([k, v]) => [
              k,
              typeof v === 'object' ? '[object]' : v,
            ]),
          ),
        )
      : '-'

  debugLog('[USAGE-API-DIAG]', label, {
    responseShape,
    rawDataLength,
    firstItemKeys,
    firstItemSample: firstItemSample.slice(0, 400),
    ...(afterMap && { afterMap }),
  })
}

/** Backend-Standard: usageType mit CAPITAL, z. B. COMPLETION_USAGE. Überall im Projekt für API-Parameter verwenden. */
export function toBackendUsageType(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  const map: Record<string, string> = {
    CompletionModelUsage: 'COMPLETION_USAGE',
    EmbeddingModelUsage: 'EMBEDDING_USAGE',
    ImageModelUsage: 'IMAGE_USAGE',
    COMPLETION_USAGE: 'COMPLETION_USAGE',
    EMBEDDING_USAGE: 'EMBEDDING_USAGE',
    IMAGE_USAGE: 'IMAGE_USAGE',
  }
  return map[value] ?? undefined
}

/** Von Backend/URL (COMPLETION_USAGE) zurück zu Anzeige (CompletionModelUsage). */
export function fromBackendUsageType(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  const map: Record<string, string> = {
    COMPLETION_USAGE: 'CompletionModelUsage',
    EMBEDDING_USAGE: 'EmbeddingModelUsage',
    IMAGE_USAGE: 'ImageModelUsage',
    CompletionModelUsage: 'CompletionModelUsage',
    EmbeddingModelUsage: 'EmbeddingModelUsage',
    ImageModelUsage: 'ImageModelUsage',
  }
  return map[value] ?? undefined
}

/** Request-Format für Usage AI / Summarize: from_date=2026-01-31T00:00:00.000Z */
function toIsoDateTime(dateStr: string | undefined): string | undefined {
  if (!dateStr?.trim()) return undefined
  const s = dateStr.trim()
  if (s.includes('T')) return new Date(s).toISOString()
  return `${s}T00:00:00.000Z`
}

/** Nimmt Backend-Response: Array direkt, oder Objekt mit data/items/usage (andere OpenAPI nutzen items oder usage). */
/** Array aus Backend-Response extrahieren (data, items oder usage). Für getUsageSummaryByApiKey etc. */
export function getDataArray<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response
  if (!response || typeof response !== 'object') return []
  const o = response as Record<string, unknown>
  for (const key of ['data', 'items', 'usage'] as const) {
    const val = o[key]
    if (Array.isArray(val)) return val
    // Backend kann ein einzelnes Objekt statt Array liefern (z. B. bei API-Key-Filter)
    if (val != null && typeof val === 'object') return [val as T]
  }
  return []
}

/** Token-Werte aus API-Item lesen (Backend-Varianten: requestTokens/requestsTokens, responseTokens/reponseTokens, optional snake_case). */
export function readTokensFromItem(item: Record<string, unknown>): {
  requestTokens: number
  responseTokens: number
} {
  const requestTokens =
    (item.requestTokens != null ? Number(item.requestTokens) : NaN) ||
    ((item as { requestsTokens?: number }).requestsTokens != null
      ? Number((item as { requestsTokens?: number }).requestsTokens)
      : NaN) ||
    ((item as { request_tokens?: number }).request_tokens != null
      ? Number((item as { request_tokens?: number }).request_tokens)
      : NaN) ||
    0
  const responseTokens =
    (item.responseTokens != null ? Number(item.responseTokens) : NaN) ||
    ((item as { reponseTokens?: number }).reponseTokens != null
      ? Number((item as { reponseTokens?: number }).reponseTokens)
      : NaN) ||
    ((item as { response_tokens?: number }).response_tokens != null
      ? Number((item as { response_tokens?: number }).response_tokens)
      : NaN) ||
    0
  const reasoning =
    ((item as { reasoningTokens?: number }).reasoningTokens != null
      ? Number((item as { reasoningTokens?: number }).reasoningTokens)
      : NaN) ||
    ((item as { reisoningTokens?: number }).reisoningTokens != null
      ? Number((item as { reisoningTokens?: number }).reisoningTokens)
      : NaN) ||
    ((item as { reasoning_tokens?: number }).reasoning_tokens != null
      ? Number((item as { reasoning_tokens?: number }).reasoning_tokens)
      : NaN) ||
    0
  return {
    requestTokens: Number(requestTokens) || 0,
    responseTokens: (Number(responseTokens) || 0) + (Number(reasoning) || 0),
  }
}

export const usageApiService = {
  /**
   * Lädt Usage-Daten mit server-seitiger Filterung und Pagination
   */
  async getUsageData(
    filter: UsageFilterApi,
    useAdminApi: boolean = false,
  ): Promise<{ data: EnhancedUsageRecord[]; pagination: Page }> {
    try {
      debugLog('Loading usage data with filter:', filter)

      const usageTypeValue = toBackendUsageType(filter.modelType)
      const page = filter.page || 1
      const limit = filter.limit || 20
      const offset = (page - 1) * limit

      const params = {
        from_date: toIsoDateTime(filter.fromDate),
        to_date: toIsoDateTime(filter.toDate),
        page: filter.page || 1,
        limit,
        offset, // Backend verwendet offset statt page
        userId: filter.userId,
        tag: filter.tag,
        apiKey: filter.apiKey,
        model: filter.model,
        usageType: usageTypeValue,
      } as import('@/api/types').UsageAIGetV1Params & { offset?: number }

      const apiResponse = useAdminApi
        ? await getAdmin().adminUsageAIGetV1(params)
        : await getUsage().usageAIGetV1(params)
      const response = apiResponse.data as UsagePageResponse | AIUsageRecord[]
      const rawData = getDataArray<AIUsageRecord | AIUsageSummaryRecord>(response)

      debugLog('API response received:', response, 'rawData length:', rawData.length)

      diagLog('getUsageData', response, rawData.length, rawData[0])

      // Konvertiere zu EnhancedUsageRecord (inkl. Backend-Tippfehler: requestsTokens, reponseTokens, reisoningTokens)
      const enhancedData = await Promise.all(
        rawData.map(async (item: AIUsageRecord | AIUsageSummaryRecord) => {
          const fromItem = readTokensFromItem(item as Record<string, unknown>)
          const requestTokens =
            (fromItem.requestTokens || (item as AIUsageSummaryRecord).requestTokens) ??
            (item as AIUsageRecord).tokensIn ??
            0
          const responseTokens =
            (fromItem.responseTokens || (item as AIUsageSummaryRecord).responseTokens) ??
            (item as AIUsageRecord).tokensOut ??
            0

          const displayType = fromBackendUsageType(item.type) || item.type || 'CompletionModelUsage'
          const costResult = calculateCost(
            requestTokens,
            responseTokens,
            item.model || 'gpt-4o',
            false,
            displayType as ModelUsageType,
          )

          return {
            technicalUserId: (() => {
              // Prüfe verschiedene mögliche Felder für technicalUserId
              const userId =
                (item as AIUsageRecord).technicalUserId ||
                (item as AIUsageSummaryRecord).technicalUserId ||
                (item as SummaryUsage).technicalUserId ||
                (item as { technicalUSerid?: string }).technicalUSerid ||
                ''
              return userId
            })(),
            technicalUserName: (() => {
              // Prüfe verschiedene mögliche Felder für technicalUserId
              const userId =
                (item as AIUsageRecord).technicalUserId ||
                (item as AIUsageSummaryRecord).technicalUserId ||
                (item as SummaryUsage).technicalUserId ||
                (item as { technicalUSerid?: string }).technicalUSerid ||
                ''
              if (!userId || userId.trim() === '') return 'Unknown User'
              // Für technische User (SVC_*, e*, b*) zeige die ID direkt
              if (userId.startsWith('SVC_') || userId.startsWith('e') || userId.startsWith('b')) {
                return userId
              }
              return `User ${userId}`
            })(),
            modelName: item.model || 'unknown',
            modelType: displayType as ModelUsageType,
            type: (fromBackendUsageType(item.type) || item.type) as ModelUsageType | undefined,
            requests: (item as SummaryUsage).requests || 0,
            tokensIn: requestTokens,
            tokensOut: responseTokens,
            totalTokens: requestTokens + responseTokens,
            cost: costResult.finalCost,
            tag: item.tag || undefined,
            day: (item as SummaryUsage).day,
            month: (item as SummaryUsage).month,
            year: (item as SummaryUsage).year,
            createDate: (item as { createDate?: string }).createDate,
            apiKeyId:
              (item as SummaryUsage).apiKeyId ?? (item as { api_key_id?: string }).api_key_id,
            sizeWidth: (item as { sizeWidth?: number }).sizeWidth,
            sizeHeight: (item as { sizeHeight?: number }).sizeHeight,
            quality:
              typeof (item as { quality?: unknown }).quality === 'string'
                ? (item as { quality: string }).quality
                : (item as { quality?: { value?: string } }).quality?.value,
          } as EnhancedUsageRecord
        }),
      )

      // Extrahiere Pagination und mappe Backend-Feldnamen
      let pagination: Page | undefined
      if (
        response &&
        typeof response === 'object' &&
        !Array.isArray(response) &&
        'pagination' in response
      ) {
        const backendPagination = (response as UsagePageResponse).pagination
        pagination = mapPagination(backendPagination) ?? (backendPagination as Page)
        debugLog('Pagination mapped:', {
          backend: backendPagination,
          mapped: pagination,
          filterPage: filter.page,
        })
      }

      diagLog('getUsageData (after map)', response, rawData.length, rawData[0], {
        length: enhancedData.length,
        firstTokens:
          enhancedData[0] != null
            ? {
                tokensIn: enhancedData[0].tokensIn ?? 0,
                tokensOut: enhancedData[0].tokensOut ?? 0,
                requests: enhancedData[0].requests ?? 0,
              }
            : undefined,
      })

      const finalPagination: Page = pagination || {
        currentPage: filter.page || 1,
        pageSize: filter.limit || 20,
        totalItems: enhancedData.length,
        totalPages: 1,
      }
      if (finalPagination.currentPage == null && filter.page) {
        finalPagination.currentPage = filter.page
      }

      return {
        data: enhancedData,
        pagination: finalPagination,
      }
    } catch (error) {
      debugLog('Error loading usage data via API:', error)
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
   * Lädt Usage-Summary mit server-seitiger Gruppierung, Filterung und Pagination
   */
  async getUsageSummary(
    filter: UsageFilterApi,
    useAdminApi: boolean = false,
  ): Promise<{ data: EnhancedUsageRecord[]; pagination: Page }> {
    try {
      debugLog('Loading usage summary with filter:', filter)

      const usageTypeValue = toBackendUsageType(filter.modelType)
      const page = filter.page || 1
      const limit = filter.limit || 20
      const offset = (page - 1) * limit

      const params = {
        from_date: toIsoDateTime(filter.fromDate),
        to_date: toIsoDateTime(filter.toDate),
        page: filter.page || 1,
        limit,
        offset, // Backend verwendet offset statt page
        userId: filter.userId,
        tag: filter.tag,
        apiKey: filter.apiKey,
        model: filter.model,
        usageType: usageTypeValue,
        by: filter.groupBy as AIRequestParamsGroupByParameterItem[] | undefined,
      } as import('@/api/types').UsageAISummaryGetV1Params & { offset?: number }

      const apiResponse = useAdminApi
        ? await getAdmin().adminUsageAISummaryGetV1(params)
        : await getUsage().usageAISummaryGetV1(params)
      const response = apiResponse.data as SummaryUsagePageResponse | SummaryUsage[]
      const rawData = getDataArray<SummaryUsage>(response)

      debugLog('API summary response received:', response, 'rawData length:', rawData.length)

      diagLog('getUsageSummary', response, rawData.length, rawData[0])

      // Konvertiere zu EnhancedUsageRecord (inkl. Backend-Tippfehler: requestsTokens, reponseTokens, reisoningTokens)
      const enhancedData = await Promise.all(
        rawData.map(async (item: SummaryUsage) => {
          const fromItem = readTokensFromItem(item as Record<string, unknown>)
          const requestTokens = fromItem.requestTokens || item.requestTokens || 0
          const responseTokens = fromItem.responseTokens || item.responseTokens || 0

          const displayType = fromBackendUsageType(item.type) || item.type || 'CompletionModelUsage'
          const costResult = calculateCost(
            requestTokens,
            responseTokens,
            item.model || 'gpt-4o',
            false,
            displayType as ModelUsageType,
          )

          return {
            technicalUserId: item.technicalUserId || '',
            technicalUserName: item.technicalUserId
              ? item.technicalUserId.startsWith('SVC_') ||
                item.technicalUserId.startsWith('e') ||
                item.technicalUserId.startsWith('b')
                ? item.technicalUserId
                : `User ${item.technicalUserId}`
              : 'Unknown User',
            modelName: item.model || 'unknown',
            modelType: displayType as ModelUsageType,
            type: (fromBackendUsageType(item.type) || item.type) as ModelUsageType | undefined,
            requests: item.requests || 0,
            tokensIn: requestTokens,
            tokensOut: responseTokens,
            totalTokens: item.totalTokens || requestTokens + responseTokens,
            cost: costResult.finalCost,
            tag: item.tag || undefined,
            day: item.day,
            month: item.month,
            year: item.year,
            createDate: undefined,
            apiKeyId: item.apiKeyId ?? (item as { api_key_id?: string }).api_key_id,
            sizeWidth: (item as { sizeWidth?: number }).sizeWidth,
            sizeHeight: (item as { sizeHeight?: number }).sizeHeight,
            quality:
              typeof (item as { quality?: unknown }).quality === 'string'
                ? (item as { quality: string }).quality
                : (item as { quality?: { value?: string } }).quality?.value,
          } as EnhancedUsageRecord
        }),
      )

      // Extrahiere Pagination und mappe Backend-Feldnamen
      let pagination: Page | undefined
      if (
        response &&
        typeof response === 'object' &&
        !Array.isArray(response) &&
        'pagination' in response
      ) {
        const backendPagination = (response as SummaryUsagePageResponse).pagination
        pagination = mapPagination(backendPagination) ?? (backendPagination as Page)
      }

      diagLog('getUsageSummary (after map)', response, rawData.length, rawData[0], {
        length: enhancedData.length,
        firstTokens:
          enhancedData[0] != null
            ? {
                tokensIn: enhancedData[0].tokensIn ?? 0,
                tokensOut: enhancedData[0].tokensOut ?? 0,
                requests: enhancedData[0].requests ?? 0,
              }
            : undefined,
      })

      return {
        data: enhancedData,
        pagination: pagination || {
          currentPage: filter.page || 1,
          pageSize: filter.limit || 20,
          totalItems: enhancedData.length,
          totalPages: 1,
        },
      }
    } catch (error) {
      debugLog('Error loading usage summary via API:', error)
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

export default usageApiService
