/**
 * useExtractionUsageApi Composable
 * 
 * Dieser Composable implementiert die server-seitige Filterung und Gruppierung
 * für Extraction Usage über die API. Parallel zum useUsageApi Composable strukturiert.
 */

import type {
  EnhancedExtractionUsageRecord,
  ExtractionUsageFilterApi,
  ExtractionUsageAggregation,
} from '@/api/types/frontend'
import type { PaginationInfo } from '@/api/types'
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
  const usageData = ref<EnhancedExtractionUsageRecord[]>([]) // Für Tabellen-Daten (paginiert)
  const summaryData = ref<EnhancedExtractionUsageRecord[]>([]) // Für Summary-Berechnung (alle Daten)
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
    return (pagination.value.page ?? 1) < (pagination.value.totalPages ?? 0)
  })

  const hasPreviousPage = computed(() => {
    return (pagination.value.page ?? 1) > 1
  })

  // Chart data computed - generiert aus den gruppierten Daten vom Backend
  const chartData = computed(() => {
    // Verwende summaryData für Charts, wenn verfügbar (Overview-Modus), sonst usageData (Detailed-Modus)
    const data = summaryData.value.length > 0 ? summaryData.value : usageData.value

    if (data.length === 0) {
      return {
        labels: [],
        operations: [],
        pages: [],
        cost: [],
        confidence: [],
      }
    }

    // Gruppiere nach Datum (wenn day/month/year vorhanden)
    const dateMap = new Map<
      string,
      { operations: number; pages: number; cost: number; confidence: number; confidenceSum: number }
    >()

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
        dateMap.set(dateKey, { operations: 0, pages: 0, cost: 0, confidence: 0, confidenceSum: 0 })
      }

      const entry = dateMap.get(dateKey)!
      // Wenn die Daten bereits gruppiert sind (day/month/year vorhanden), verwende die Werte direkt
      // Ansonsten zähle jeden Eintrag als 1 Operation
      entry.operations += 1 // Jeder Eintrag repräsentiert eine Gruppierung
      entry.pages += item.pages || 0
      entry.cost += item.cost || 0
      entry.confidenceSum += item.confidenceScore || 0
    })

    // Sortiere nach Datum
    const sortedEntries = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

    return {
      labels: sortedEntries.map(([date]) => {
        // Format: DD.MM.YYYY
        const [year, month, day] = date.split('-')
        return `${day}.${month}.${year}`
      }),
      operations: sortedEntries.map(([, data]) => data.operations),
      pages: sortedEntries.map(([, data]) => data.pages),
      cost: sortedEntries.map(([, data]) => data.cost),
      confidence: sortedEntries.map(([, data]) => data.confidenceSum / data.operations || 0),
    }
  })

  // Chart data für Provider-Verteilung (Pie Chart)
  const providerDistributionChartData = computed(() => {
    // Verwende summaryData für Charts, wenn verfügbar
    const data = summaryData.value.length > 0 ? summaryData.value : usageData.value

    if (data.length === 0) {
      return { labels: [], data: [] }
    }

    const providerMap = new Map<string, number>()

    data.forEach((item) => {
      const provider = item.provider || 'Unknown'
      const currentCount = providerMap.get(provider) || 0
      providerMap.set(provider, currentCount + 1)
    })

    return {
      labels: Array.from(providerMap.keys()),
      data: Array.from(providerMap.values()),
    }
  })

  // Chart data für Status-Verteilung (Pie Chart)
  const statusDistributionChartData = computed(() => {
    // Verwende summaryData für Charts, wenn verfügbar
    const data = summaryData.value.length > 0 ? summaryData.value : usageData.value

    if (data.length === 0) {
      return { labels: [], data: [] }
    }

    const statusMap = new Map<string, number>()

    data.forEach((item) => {
      const status = item.status || 'Unknown'
      const currentCount = statusMap.get(status) || 0
      statusMap.set(status, currentCount + 1)
    })

    return {
      labels: Array.from(statusMap.keys()),
      data: Array.from(statusMap.values()),
    }
  })

  const usageAggregation = computed<ExtractionUsageAggregation>(() => {
    // Verwende summaryData für die Aggregation, nicht usageData (das ist paginiert)
    const data = summaryData.value.length > 0 ? summaryData.value : usageData.value

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
    const totalPages = data.reduce((sum, item) => sum + (item.pages ?? 0), 0)
    const totalCost = data.reduce((sum, item) => sum + (item.cost ?? 0), 0)
    const totalConfidence = data.reduce((sum, item) => sum + (item.confidenceScore ?? 0), 0)

    const uniqueUsers = new Set(data.map((item) => item.technicalUserId)).size
    const uniqueProviders = new Set(data.map((item) => item.provider)).size
    const uniqueModels = new Set(data.map((item) => item.modelId)).size

    const operationsByStatus: { [key: string]: number } = {}
    data.forEach((item) => {
      const status = item.status ?? 'unknown'
      operationsByStatus[status] = (operationsByStatus[status] || 0) + 1
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
      // Nur aktualisieren wenn Filter-Objekt nicht leer ist und tatsächlich Properties hat
      if (filter && Object.keys(filter).length > 0) {
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

      // Für die Summary müssen ALLE Daten geladen werden, nicht nur die ersten 20
      // Verwende einen sehr hohen limit, um alle Daten zu erhalten
      const summaryFilter = {
        ...currentFilter.value,
        page: 1,
        limit: 10000, // Sehr hoher Wert, um alle Daten zu erhalten
      }

      const result = await extractionUsageApiService.getUsageSummary(summaryFilter, useAdminApi)

      // Wenn es mehr Daten gibt, lade alle Seiten
      let allData = [...result.data]
      let currentPage = 1
      const totalPages = result.pagination?.totalPages ?? 0
      const total = result.pagination?.total ?? 0

      while (currentPage < totalPages && allData.length < total) {
        currentPage++
        const pageResult = await extractionUsageApiService.getUsageSummary(
          { ...summaryFilter, page: currentPage },
          useAdminApi,
        )
        allData = [...allData, ...pageResult.data]
      }

      // Speichere Summary-Daten separat, damit sie nicht von loadUsageData überschrieben werden
      summaryData.value = allData
      pagination.value = {
        ...result.pagination,
        total: allData.length,
      }

      debugLog('Extraction usage summary loaded:', {
        count: allData.length,
        pagination: pagination.value,
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

    const newPage = (pagination.value.page ?? 1) + 1
    await loadUsageData({ page: newPage }, useAdminApi)
  }

  const previousPage = async (useAdminApi: boolean = false) => {
    if (!hasPreviousPage.value) return

    const newPage = (pagination.value.page ?? 1) - 1
    await loadUsageData({ page: newPage }, useAdminApi)
  }

  const goToPage = async (page: number, useAdminApi: boolean = false) => {
    if (page < 1 || page > (pagination.value.totalPages ?? 0)) return

    await loadUsageData({ page }, useAdminApi)
  }

  const updateFilter = async (
    newFilter: Partial<ExtractionUsageFilterApi>,
    useAdminApi: boolean = false,
  ) => {
    // Reset to page 1 when filter changes (außer wenn nur Sortierung geändert wird)
    const isSortChange = 'sort' in newFilter || 'order' in newFilter
    currentFilter.value = {
      ...currentFilter.value,
      ...newFilter,
      page: isSortChange ? currentFilter.value.page : 1,
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
      technicalUserId: 'technicalUserId',
      status: 'status',
      provider: 'provider',
      pages: 'pages',
      confidenceScore: 'confidenceScore',
      cost: 'cost',
      createDate: 'createDate',
      apiKeyId: 'apiKeyId',
      modelId: 'modelId',
      documentType: 'documentType',
    }

    const backendField = fieldMapping[sortField] || sortField

    debugLog('Updating sort:', { sortField, backendField, sortOrder })

    // Aktualisiere Filter und lade Daten neu
    currentFilter.value = {
      ...currentFilter.value,
      sort: backendField,
      order: sortOrder,
      page: 1, // Reset to first page when sorting changes
    }

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
    chartData,
    providerDistributionChartData,
    statusDistributionChartData,

    // Actions
    loadUsageData,
    loadUsageSummary,
    nextPage,
    previousPage,
    goToPage,
    updateFilter,
    updateSort,
    resetFilter,
  }
}
