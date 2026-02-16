/**
 * Extraction Usage API Service
 * 
 * Dieser Service implementiert die server-seitige Filterung und Gruppierung
 * für Extraction Usage über die API. Parallel zum usageApiService strukturiert.
 */

import { getAdmin } from '@/api/admin/admin'
import { getUsage } from '@/api/usage/usage'
import type { ExtractionRequestParamsGroupByParameterItem } from '@/api/types'
import type {
  EnhancedExtractionUsageRecord,
  ExtractionUsageFilterApi,
  ExtractionUsagePageResponse,
  ExtractionUsageSummaryPageResponse,
  PaginationInfo,
} from '@/api/types/frontend'

// Debug-Log-Funktion
const debugLog = (...args: unknown[]) => {
  const isDevelopment = import.meta.env.DEV
  const debugFromEnv = import.meta.env.VITE_SHOW_DEBUG === 'true'
  const debugFromLocalStorage = localStorage.getItem('debug') === 'true'
  const showDebugMode = isDevelopment && (debugFromEnv || debugFromLocalStorage)
  if (showDebugMode) {
    console.log('[extractionUsageApiService]', ...args)
  }
}

export const extractionUsageApiService = {
  /**
   * Lädt Extraction Usage-Daten mit server-seitiger Filterung und Pagination
   */
  async getUsageData(
    filter: ExtractionUsageFilterApi,
    useAdminApi: boolean = false,
  ): Promise<{ data: EnhancedExtractionUsageRecord[]; pagination: PaginationInfo }> {
    try {
      debugLog('Loading extraction usage data with filter:', filter)

      const params = {
        from_date: filter.fromDate,
        to_date: filter.toDate,
        page: filter.page || 1,
        limit: filter.limit || 20,
        provider: filter.provider,
        modelId: filter.modelId,
        status: filter.status as import('@/api/types').ExtractionRequestParamsStatusParameter | undefined,
        userId: filter.userId,
        tag: filter.tag,
        apiKeyId: filter.apiKeyId,
      }

      const apiResponse = useAdminApi
        ? await getAdmin().adminUsageExtractionGetV1(params)
        : await getUsage().usageExtractionGetV1(params)
      const response: ExtractionUsagePageResponse = apiResponse.data

      debugLog('API response received:', response)

      // Konvertiere zu EnhancedExtractionUsageRecord
      const enhancedData = (response.data || []).map((item: import('@/api/types').ExtractionUsageRecord) => ({
        id: item.id || `extraction-${Math.random().toString(36).substring(7)}`,
        operationId: item.operationId || item.id || `op-${Math.random().toString(36).substring(7)}`,
        status: item.status || 'completed',
        createDate: item.createDate || new Date().toISOString(),
        completedDate: item.completedDate,
        day: item.day,
        month: item.month,
        year: item.year,
        technicalUserId: item.technicalUserId || 'unknown',
        technicalUserName: `User ${item.technicalUserId || 'unknown'}`,
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
      console.error('Error loading extraction usage data via API:', error)
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
   * Lädt Extraction Usage-Summary mit server-seitiger Gruppierung, Filterung und Pagination
   */
  async getUsageSummary(
    filter: ExtractionUsageFilterApi,
    useAdminApi: boolean = false,
  ): Promise<{ data: EnhancedExtractionUsageRecord[]; pagination: PaginationInfo }> {
    try {
      debugLog('Loading extraction usage summary with filter:', filter)

      const params = {
        from_date: filter.fromDate,
        to_date: filter.toDate,
        page: filter.page || 1,
        limit: filter.limit || 20,
        provider: filter.provider,
        modelId: filter.modelId,
        status: filter.status as import('@/api/types').ExtractionRequestParamsStatusParameter | undefined,
        userId: filter.userId,
        tag: filter.tag,
        apiKeyId: filter.apiKeyId,
        by: filter.groupBy as ExtractionRequestParamsGroupByParameterItem[] | undefined,
      }

      const apiResponse = useAdminApi
        ? await getAdmin().adminUsageExtractionSummaryGetV1(params)
        : await getUsage().usageExtractionSummaryGetV1(params)
      const response: ExtractionUsageSummaryPageResponse = apiResponse.data

      debugLog('API summary response received:', response)

      // Konvertiere Summary zu EnhancedExtractionUsageRecord
      const enhancedData = (response.data || []).map((item: import('@/api/types').ExtractionUsageSummaryRecord) => ({
        id: `${item.provider}-${item.modelId}-${item.day || ''}-${item.month || ''}-${item.year || ''}`,
        operationId: `${item.provider}-${item.modelId}`,
        status: item.status || 'completed',
        createDate: item.year && item.month && item.day
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
      }))

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
      console.error('Error loading extraction usage summary via API:', error)
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

export default extractionUsageApiService
