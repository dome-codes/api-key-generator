/**
 * useUsageApi Composable
 * 
 * Dieser Composable implementiert die server-seitige Filterung und Gruppierung
 * über die API. Er läuft parallel zum bestehenden useUsage Composable.
 * 
 * Unterschiede zu useUsage:
 * - Alle Filterung erfolgt server-seitig über API-Parameter
 * - Pagination wird vollständig über die API gehandhabt
 * - Gruppierung erfolgt server-seitig über den 'by' Parameter
 * - Keine Client-seitige Filterung oder Gruppierung
 * 
 * Verwendung:
 * - Für neue Features die API-basierte Filterung nutzen sollen
 * - Parallel zum bestehenden useUsage nutzbar
 * - Migration: Schrittweise von useUsage zu useUsageApi wechseln
 */

import type {
  EnhancedUsageRecord,
  UsageFilterApi,
  PaginationInfo,
  UsageAggregation,
} from '@/api/types/types'
import { usageApiService } from '@/services/usageApiService'
import { computed, ref } from 'vue'

// Debug-Log-Funktion
const debugLog = (...args: unknown[]) => {
  const isDevelopment = import.meta.env.DEV
  const debugFromEnv = import.meta.env.VITE_SHOW_DEBUG === 'true'
  const debugFromLocalStorage = localStorage.getItem('debug') === 'true'
  const showDebugMode = isDevelopment && (debugFromEnv || debugFromLocalStorage)
  if (showDebugMode) {
    console.log('[useUsageApi]', ...args)
  }
}

export function useUsageApi() {
  // State
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const usageData = ref<EnhancedUsageRecord[]>([])
  const pagination = ref<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const currentFilter = ref<UsageFilterApi>({
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

  const usageAggregation = computed<UsageAggregation>(() => {
    const data = usageData.value

    if (data.length === 0) {
      return {
        totalRequests: 0,
        totalTokensIn: 0,
        totalTokensOut: 0,
        totalTokens: 0,
        totalCost: 0,
        uniqueUsers: 0,
        uniqueModels: 0,
        averageRequestsPerUser: 0,
        averageTokensPerRequest: 0,
        averageCostPerRequest: 0,
      }
    }

    const totalRequests = data.reduce((sum, item) => sum + item.requests, 0)
    const totalTokensIn = data.reduce((sum, item) => sum + item.tokensIn, 0)
    const totalTokensOut = data.reduce((sum, item) => sum + item.tokensOut, 0)
    const totalTokens = data.reduce((sum, item) => sum + item.totalTokens, 0)
    const totalCost = data.reduce((sum, item) => sum + item.cost, 0)

    const uniqueUsers = new Set(data.map((item) => item.technicalUserId)).size
    const uniqueModels = new Set(data.map((item) => item.modelName)).size

    return {
      totalRequests,
      totalTokensIn,
      totalTokensOut,
      totalTokens,
      totalCost,
      uniqueUsers,
      uniqueModels,
      averageRequestsPerUser: uniqueUsers > 0 ? totalRequests / uniqueUsers : 0,
      averageTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
    }
  })

  // Chart data computed - generiert aus den gruppierten Daten vom Backend
  const chartData = computed(() => {
    const data = usageData.value

    if (data.length === 0) {
      return {
        labels: [],
        tokensIn: [],
        tokensOut: [],
        requests: [],
        cost: [],
      }
    }

    // Gruppiere nach Datum (wenn day/month/year vorhanden)
    const dateMap = new Map<string, { tokensIn: number; tokensOut: number; requests: number; cost: number }>()

    data.forEach((item) => {
      let dateKey = ''
      if (item.day && item.month && item.year) {
        dateKey = `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
      } else if (item.createDate) {
        const date = new Date(item.createDate)
        dateKey = date.toISOString().split('T')[0]
      } else {
        dateKey = 'unknown'
      }

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0 })
      }

      const entry = dateMap.get(dateKey)!
      entry.tokensIn += item.tokensIn || 0
      entry.tokensOut += item.tokensOut || 0
      entry.requests += item.requests || 0
      entry.cost += item.cost || 0
    })

    // Sortiere nach Datum
    const sortedEntries = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

    return {
      labels: sortedEntries.map(([date]) => {
        // Format: DD.MM.YYYY
        const [year, month, day] = date.split('-')
        return `${day}.${month}.${year}`
      }),
      tokensIn: sortedEntries.map(([, data]) => data.tokensIn),
      tokensOut: sortedEntries.map(([, data]) => data.tokensOut),
      requests: sortedEntries.map(([, data]) => data.requests),
      cost: sortedEntries.map(([, data]) => data.cost),
    }
  })

  // Chart data für Model-Verteilung (Pie Chart)
  const modelDistributionChartData = computed(() => {
    const data = usageData.value

    if (data.length === 0) {
      return { labels: [], data: [] }
    }

    const modelMap = new Map<string, number>()

    data.forEach((item) => {
      const modelName = item.modelName || 'Unknown'
      const currentCount = modelMap.get(modelName) || 0
      modelMap.set(modelName, currentCount + item.requests)
    })

    return {
      labels: Array.from(modelMap.keys()),
      data: Array.from(modelMap.values()),
    }
  })

  // Chart data für Tag-Verwendung (Bar Chart)
  const tagUsageChartData = computed(() => {
    const data = usageData.value

    if (data.length === 0) {
      return { labels: [], data: [] }
    }

    const tagMap = new Map<string, number>()

    data.forEach((item) => {
      const tag = item.tag || 'Unknown'
      const currentCount = tagMap.get(tag) || 0
      tagMap.set(tag, currentCount + item.requests)
    })

    return {
      labels: Array.from(tagMap.keys()),
      data: Array.from(tagMap.values()),
    }
  })

  // Actions
  const loadUsageData = async (filter?: Partial<UsageFilterApi>, useAdminApi: boolean = false) => {
    isLoading.value = true
    error.value = null

    try {
      if (filter) {
        currentFilter.value = { ...currentFilter.value, ...filter }
      }

      debugLog('Loading usage data with filter:', currentFilter.value)

      const result = await usageApiService.getUsageData(currentFilter.value, useAdminApi)

      usageData.value = result.data
      pagination.value = result.pagination

      debugLog('Usage data loaded:', {
        count: result.data.length,
        pagination: result.pagination,
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Laden der Nutzungsdaten'
      console.error('Error loading usage data:', err)
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
    filter?: Partial<UsageFilterApi>,
    useAdminApi: boolean = false,
  ) => {
    isLoading.value = true
    error.value = null

    try {
      if (filter) {
        currentFilter.value = { ...currentFilter.value, ...filter }
      }

      debugLog('Loading usage summary with filter:', currentFilter.value)

      const result = await usageApiService.getUsageSummary(currentFilter.value, useAdminApi)

      usageData.value = result.data
      pagination.value = result.pagination

      debugLog('Usage summary loaded:', {
        count: result.data.length,
        pagination: result.pagination,
        firstItem: result.data[0],
      })
      console.log('[useUsageApi] Usage summary loaded - usageData.value:', usageData.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Laden der Nutzungszusammenfassung'
      console.error('Error loading usage summary:', err)
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

  const updateFilter = async (newFilter: Partial<UsageFilterApi>, useAdminApi: boolean = false) => {
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

  const updateSort = async (
    sortField: string,
    sortOrder: 'asc' | 'desc',
    useAdminApi: boolean = false,
  ) => {
    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string> = {
      date: 'date',
      cost: 'cost',
      requests: 'requests',
      tokensIn: 'tokensIn',
      tokensOut: 'tokensOut',
      totalTokens: 'totalTokens',
      model: 'model',
      user: 'user',
    }

    const backendField = fieldMapping[sortField] || sortField

    currentFilter.value = {
      ...currentFilter.value,
      sort: backendField,
      order: sortOrder,
      page: 1, // Reset to first page when sorting changes
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
    chartData,
    modelDistributionChartData,
    tagUsageChartData,

    // Actions
    loadUsageData,
    loadUsageSummary,
    nextPage,
    previousPage,
    goToPage,
    updateFilter,
    resetFilter,
    updateSort,
  }
}
