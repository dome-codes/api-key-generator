/**
 * useExtractionUsageApi Composable
 * 
 * Dieser Composable implementiert die server-seitige Filterung und Gruppierung
 * für Extraction Usage über die API. Parallel zum useUsageApi Composable strukturiert.
 */

import type {
  EnhancedExtractionUsageRecord,
  ExtractionUsageFilterApi,
  PaginationInfo,
  ExtractionUsageAggregation,
} from '@/api/types/extraction'
import { extractionUsageApiService } from '@/services/extractionUsageApiService'
import { computed, ref } from 'vue'

// Debug-Log-Funktion
const debugLog = (...args: unknown[]) => {
  const isDevelopment = import.meta.env.DEV
  const debugFromEnv = import.meta.env.VITE_SHOW_DEBUG === 'true'
  const debugFromLocalStorage = localStorage.getItem('debug') === 'true'
  const showDebugMode = isDevelopment && (debugFromEnv || debugFromLocalStorage)
  if (showDebugMode) {
    console.log('[useExtractionUsageApi]', ...args)
  }
}

export function useExtractionUsageApi() {
  // State
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const usageData = ref<EnhancedExtractionUsageRecord[]>([])
  const pagination = ref<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const currentFilter = ref<ExtractionUsageFilterApi>({
    page: 1,
    limit: 20,
  })

  // Computed
  const hasMorePages = computed(() => {
    return pagination.value.page < pagination.value.totalPages
  })

  const hasPreviousPage = computed(() => {
    return pagination.value.page > 1
  })

  const usageAggregation = computed<ExtractionUsageAggregation>(() => {
    const data = usageData.value

    if (data.length === 0) {
      return {
        totalOperations: 0,
        totalPages: 0,
        averageConfidence: 0,
        totalCost: 0,
        uniqueUsers: 0,
        uniqueProviders: 0,
        uniqueModels: 0,
        operationsByStatus: {},
        averagePagesPerOperation: 0,
        averageCostPerOperation: 0,
      }
    }

    const totalOperations = data.length
    const totalPages = data.reduce((sum, item) => sum + item.pages, 0)
    const totalCost = data.reduce((sum, item) => sum + item.cost, 0)
    const totalConfidence = data.reduce((sum, item) => sum + item.confidenceScore, 0)

    const uniqueUsers = new Set(data.map((item) => item.technicalUserId)).size
    const uniqueProviders = new Set(data.map((item) => item.provider)).size
    const uniqueModels = new Set(data.map((item) => item.modelId)).size

    const operationsByStatus: { [key: string]: number } = {}
    data.forEach((item) => {
      operationsByStatus[item.status] = (operationsByStatus[item.status] || 0) + 1
    })

    return {
      totalOperations,
      totalPages,
      averageConfidence: totalOperations > 0 ? totalConfidence / totalOperations : 0,
      totalCost,
      uniqueUsers,
      uniqueProviders,
      uniqueModels,
      operationsByStatus: operationsByStatus as ExtractionUsageAggregation['operationsByStatus'],
      averagePagesPerOperation: totalOperations > 0 ? totalPages / totalOperations : 0,
      averageCostPerOperation: totalOperations > 0 ? totalCost / totalOperations : 0,
    }
  })

  // Actions
  const loadUsageData = async (
    filter?: Partial<ExtractionUsageFilterApi>,
    useAdminApi: boolean = false,
  ) => {
    isLoading.value = true
    error.value = null

    try {
      if (filter) {
        currentFilter.value = { ...currentFilter.value, ...filter }
      }

      debugLog('Loading extraction usage data with filter:', currentFilter.value)

      const result = await extractionUsageApiService.getUsageData(currentFilter.value, useAdminApi)

      usageData.value = result.data
      pagination.value = result.pagination

      debugLog('Extraction usage data loaded:', {
        count: result.data.length,
        pagination: result.pagination,
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Laden der Extraction-Nutzungsdaten'
      console.error('Error loading extraction usage data:', err)
      usageData.value = []
      pagination.value = {
        page: currentFilter.value.page || 1,
        limit: currentFilter.value.limit || 20,
        total: 0,
        totalPages: 0,
      }
    } finally {
      isLoading.value = false
    }
  }

  const loadUsageSummary = async (
    filter?: Partial<ExtractionUsageFilterApi>,
    useAdminApi: boolean = false,
  ) => {
    isLoading.value = true
    error.value = null

    try {
      if (filter) {
        currentFilter.value = { ...currentFilter.value, ...filter }
      }

      debugLog('Loading extraction usage summary with filter:', currentFilter.value)

      const result = await extractionUsageApiService.getUsageSummary(currentFilter.value, useAdminApi)

      usageData.value = result.data
      pagination.value = result.pagination

      debugLog('Extraction usage summary loaded:', {
        count: result.data.length,
        pagination: result.pagination,
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Laden der Extraction-Nutzungszusammenfassung'
      console.error('Error loading extraction usage summary:', err)
      usageData.value = []
      pagination.value = {
        page: currentFilter.value.page || 1,
        limit: currentFilter.value.limit || 20,
        total: 0,
        totalPages: 0,
      }
    } finally {
      isLoading.value = false
    }
  }

  const nextPage = async (useAdminApi: boolean = false) => {
    if (!hasMorePages.value) return

    const newPage = pagination.value.page + 1
    await loadUsageData({ page: newPage }, useAdminApi)
  }

  const previousPage = async (useAdminApi: boolean = false) => {
    if (!hasPreviousPage.value) return

    const newPage = pagination.value.page - 1
    await loadUsageData({ page: newPage }, useAdminApi)
  }

  const goToPage = async (page: number, useAdminApi: boolean = false) => {
    if (page < 1 || page > pagination.value.totalPages) return

    await loadUsageData({ page }, useAdminApi)
  }

  const updateFilter = async (
    newFilter: Partial<ExtractionUsageFilterApi>,
    useAdminApi: boolean = false,
  ) => {
    // Reset to page 1 when filter changes
    currentFilter.value = { ...currentFilter.value, ...newFilter, page: 1 }
    await loadUsageData({}, useAdminApi)
  }

  const resetFilter = async (useAdminApi: boolean = false) => {
    currentFilter.value = {
      page: 1,
      limit: 20,
    }
    await loadUsageData({}, useAdminApi)
  }

  return {
    // State
    isLoading,
    error,
    usageData,
    pagination,
    currentFilter,

    // Computed
    hasMorePages,
    hasPreviousPage,
    usageAggregation,

    // Actions
    loadUsageData,
    loadUsageSummary,
    nextPage,
    previousPage,
    goToPage,
    updateFilter,
    resetFilter,
  }
}
