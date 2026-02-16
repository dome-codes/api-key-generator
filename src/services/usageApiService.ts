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

import type {
  EnhancedUsageRecord,
  ModelUsageType,
  SummaryUsage,
  UsageFilterApi,
  UsagePageResponse,
  SummaryUsagePageResponse,
  PaginationInfo,
} from '@/api/types/types'
import {
  usageAIGetV1Extended,
  usageAISummaryGetV1Extended,
  adminUsageAISummaryGetV1Extended,
} from '@/api/usage/usage'
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
        from_date: filter.fromDate,
        to_date: filter.toDate,
        page: filter.page || 1,
        limit: filter.limit || 20,
        userId: filter.userId,
        tag: filter.tag,
        apiKeyId: filter.apiKeyId,
        model: filter.model,
        modelType: filter.modelType,
      }

      let response: UsagePageResponse

      if (useAdminApi) {
        // Admin-Endpunkt verwenden - für getUsageData verwenden wir den normalen Endpunkt
        // da Admin-Endpunkt für Summary gedacht ist
        // TODO: Wenn Admin-Endpunkt für getUsageData verfügbar ist, hier verwenden
        const apiResponse = await usageAIGetV1Extended(params)
        response = apiResponse.data
      } else {
        const apiResponse = await usageAIGetV1Extended(params)
        response = apiResponse.data
      }

      debugLog('API response received:', response)

      // Konvertiere zu EnhancedUsageRecord
      const enhancedData = await Promise.all(
        (response.data || []).map(async (item) => {
          const requestTokens = (item as SummaryUsage).requestTokens || 0
          const responseTokens = (item as SummaryUsage).responseTokens || 0

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
        from_date: filter.fromDate,
        to_date: filter.toDate,
        page: filter.page || 1,
        limit: filter.limit || 20,
        userId: filter.userId,
        tag: filter.tag,
        apiKeyId: filter.apiKeyId,
        model: filter.model,
        modelType: filter.modelType,
        by: filter.groupBy,
      }

      let response: SummaryUsagePageResponse

      if (useAdminApi) {
        const adminResponse = await adminUsageAISummaryGetV1Extended(params)
        response = adminResponse.data
      } else {
        const apiResponse = await usageAISummaryGetV1Extended(params)
        response = apiResponse.data
      }

      debugLog('API summary response received:', response)

      // Konvertiere zu EnhancedUsageRecord
      const enhancedData = await Promise.all(
        (response.data || []).map(async (item: SummaryUsage) => {
          const requestTokens = item.requestTokens || 0
          const responseTokens = item.responseTokens || 0

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
