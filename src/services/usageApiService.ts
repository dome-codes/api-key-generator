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
  PaginationInfo,
  SummaryUsage,
  SummaryUsagePageResponse,
  UsageFilterApi,
  UsagePageResponse,
} from '@/api/types/frontend'
import type {
  AIRequestParamsGroupByParameterItem,
  AIUsageRecord,
  AIUsageSummaryRecord,
} from '@/api/types'
import { calculateCost } from '@/config/pricing'

// Debug-Log-Funktion
const debugLog = (...args: unknown[]) => {
  const isDevelopment = import.meta.env.DEV
  const debugFromEnv = import.meta.env.VITE_SHOW_DEBUG === 'true'
  const debugFromLocalStorage = localStorage.getItem('debug') === 'true'
  const showDebugMode = isDevelopment && (debugFromEnv || debugFromLocalStorage)
  if (showDebugMode) {
    console.log('[usageApiService]', ...args)
  }
}

/** Request-Format für Usage AI / Summarize: from_date=2026-01-31T00:00:00.000Z */
function toIsoDateTime(dateStr: string | undefined): string | undefined {
  if (!dateStr?.trim()) return undefined
  const s = dateStr.trim()
  if (s.includes('T')) return new Date(s).toISOString()
  return `${s}T00:00:00.000Z`
}

/** Liest Token-Werte aus API-Item; toleriert Backend-Tippfehler (requestsTokens, reponseTokens, reisoningTokens). */
function readTokensFromItem(item: Record<string, unknown>): { requestTokens: number; responseTokens: number } {
  const requestTokens =
    Number(item.requestTokens) ||
    Number((item as { requestsTokens?: number }).requestsTokens) ||
    0
  const responseTokens =
    Number(item.responseTokens) ||
    Number((item as { reponseTokens?: number }).reponseTokens) ||
    0
  const reasoning = Number((item as { reisoningTokens?: number }).reisoningTokens) || 0
  return {
    requestTokens,
    responseTokens: responseTokens + reasoning,
  }
}

export const usageApiService = {
  /**
   * Lädt Usage-Daten mit server-seitiger Filterung und Pagination
   */
  async getUsageData(
    filter: UsageFilterApi,
    useAdminApi: boolean = false,
  ): Promise<{ data: EnhancedUsageRecord[]; pagination: PaginationInfo }> {
    try {
      debugLog('Loading usage data with filter:', filter)

      const params = {
        from_date: toIsoDateTime(filter.fromDate),
        to_date: toIsoDateTime(filter.toDate),
        page: filter.page || 1,
        limit: filter.limit || 20,
        userId: filter.userId,
        tag: filter.tag,
        apiKeyId: filter.apiKeyId,
        model: filter.model,
        modelType: filter.modelType as import('@/api/types').AIRequestParamsModelTypeParameter | undefined,
      }

      const apiResponse = useAdminApi
        ? await getAdmin().adminUsageAIGetV1(params)
        : await getUsage().usageAIGetV1(params)
      const response: UsagePageResponse = apiResponse.data

      debugLog('API response received:', response)

      // Konvertiere zu EnhancedUsageRecord (inkl. Backend-Tippfehler: requestsTokens, reponseTokens, reisoningTokens)
      const enhancedData = await Promise.all(
        (response.data || []).map(async (item: AIUsageRecord | AIUsageSummaryRecord) => {
          const fromItem = readTokensFromItem(item as Record<string, unknown>)
          const requestTokens =
            (fromItem.requestTokens || (item as AIUsageSummaryRecord).requestTokens) ??
            (item as AIUsageRecord).tokensIn ??
            0
          const responseTokens =
            (fromItem.responseTokens || (item as AIUsageSummaryRecord).responseTokens) ??
            (item as AIUsageRecord).tokensOut ??
            0

          const costResult = calculateCost(
            requestTokens,
            responseTokens,
            item.model || 'gpt-4o',
            false,
            item.type || 'CompletionModelUsage',
          )

          return {
            technicalUserId:
              (item as SummaryUsage).technicalUserId ||
              (item as { technicalUSerid?: string }).technicalUSerid ||
              'unknown',
            technicalUserName: `User ${
              (item as SummaryUsage).technicalUserId ||
              (item as { technicalUSerid?: string }).technicalUSerid ||
              'unknown'
            }`,
            modelName: item.model || 'unknown',
            modelType: (item.type || 'CompletionModelUsage') as ModelUsageType,
            type: item.type,
            requests: (item as SummaryUsage).requests || 0,
            tokensIn: requestTokens,
            tokensOut: responseTokens,
            totalTokens: requestTokens + responseTokens,
            cost: costResult.finalCost,
            tag: item.tag || 'production',
            day: (item as SummaryUsage).day,
            month: (item as SummaryUsage).month,
            year: (item as SummaryUsage).year,
            createDate: (item as { createDate?: string }).createDate,
            apiKeyId: (item as SummaryUsage).apiKeyId,
          } as EnhancedUsageRecord
        }),
      )

      return {
        data: enhancedData,
        pagination: response.pagination || {
          page: filter.page || 1,
          limit: filter.limit || 20,
          total: enhancedData.length,
          totalPages: 1,
        },
      }
    } catch (error) {
      console.error('Error loading usage data via API:', error)
      return {
        data: [],
        pagination: {
          page: filter.page || 1,
          limit: filter.limit || 20,
          total: 0,
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
  ): Promise<{ data: EnhancedUsageRecord[]; pagination: PaginationInfo }> {
    try {
      debugLog('Loading usage summary with filter:', filter)

      const params = {
        from_date: toIsoDateTime(filter.fromDate),
        to_date: toIsoDateTime(filter.toDate),
        page: filter.page || 1,
        limit: filter.limit || 20,
        userId: filter.userId,
        tag: filter.tag,
        apiKeyId: filter.apiKeyId,
        model: filter.model,
        modelType: filter.modelType as import('@/api/types').AIRequestParamsModelTypeParameter | undefined,
        by: filter.groupBy as AIRequestParamsGroupByParameterItem[] | undefined,
      }

      const apiResponse = useAdminApi
        ? await getAdmin().adminUsageAISummaryGetV1(params)
        : await getUsage().usageAISummaryGetV1(params)
      const response: SummaryUsagePageResponse = apiResponse.data

      debugLog('API summary response received:', response)

      // Konvertiere zu EnhancedUsageRecord (inkl. Backend-Tippfehler: requestsTokens, reponseTokens, reisoningTokens)
      const enhancedData = await Promise.all(
        (response.data || []).map(async (item: SummaryUsage) => {
          const fromItem = readTokensFromItem(item as Record<string, unknown>)
          const requestTokens = fromItem.requestTokens || item.requestTokens || 0
          const responseTokens = fromItem.responseTokens || item.responseTokens || 0

          const costResult = calculateCost(
            requestTokens,
            responseTokens,
            item.model || 'gpt-4o',
            false,
            item.type || 'CompletionModelUsage',
          )

          return {
            technicalUserId: item.technicalUserId || 'unknown',
            technicalUserName: `User ${item.technicalUserId || 'unknown'}`,
            modelName: item.model || 'unknown',
            modelType: (item.type || 'CompletionModelUsage') as ModelUsageType,
            type: item.type,
            requests: item.requests || 0,
            tokensIn: requestTokens,
            tokensOut: responseTokens,
            totalTokens: item.totalTokens || requestTokens + responseTokens,
            cost: costResult.finalCost,
            tag: item.tag || 'production',
            day: item.day,
            month: item.month,
            year: item.year,
            createDate: undefined,
            apiKeyId: item.apiKeyId,
          } as EnhancedUsageRecord
        }),
      )

      return {
        data: enhancedData,
        pagination: response.pagination || {
          page: filter.page || 1,
          limit: filter.limit || 20,
          total: enhancedData.length,
          totalPages: 1,
        },
      }
    } catch (error) {
      console.error('Error loading usage summary via API:', error)
      return {
        data: [],
        pagination: {
          page: filter.page || 1,
          limit: filter.limit || 20,
          total: 0,
          totalPages: 0,
        },
      }
    }
  },
}

export default usageApiService
