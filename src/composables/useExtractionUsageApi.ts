/**
 * useExtractionUsageApi Composable
 *
 * Dieser Composable implementiert die server-seitige Filterung und Gruppierung
 * für Extraction Usage über die API. Parallel zum useUsageApi Composable strukturiert.
 */

import type { Page } from '@/api/types'
import { extractionUsageApiService } from '@/services/extractionUsageApiService'
import { calculateExtractionCost } from '@/config/pricing'
import type {
  EnhancedExtractionUsageRecord,
  ExtractionUsageAggregation,
  ExtractionUsageFilterApi,
} from '@/types/frontend'
import { debugLog as baseDebugLog } from '@/utils/debugLog'
import { computed, ref } from 'vue'

// Debug-Log mit Präfix
const debugLog = (...args: unknown[]) => baseDebugLog('[useExtractionUsageApi]', ...args)

export function useExtractionUsageApi() {
  // State
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const usageData = ref<EnhancedExtractionUsageRecord[]>([]) // Für Tabellen-Daten (paginiert)
  const summaryData = ref<EnhancedExtractionUsageRecord[]>([]) // Für Chart (groupBy day/month/year)
  /** Pro-Kachel Summarize-Ergebnisse: global (ohne by), by=userId, by=provider, by=modelId */
  const tileGlobal = ref<{ totalOperations: number; totalPages: number; totalCost: number } | null>(null)
  const tileUniqueUsers = ref<number | null>(null)
  const tileUniqueProviders = ref<number | null>(null)
  const tileUniqueModels = ref<number | null>(null)
  /** Verfügbare Nutzer aus Summarize(by=userId) – für Admin-Filter-Dropdown */
  const summaryUsers = ref<string[]>([])
  /** Summarize(by=userId) Records – für Breakdown-Ansicht */
  const userSummaryData = ref<EnhancedExtractionUsageRecord[]>([])
  /** Summarize(by=apikey) Records – für API-Key-Breakdown */
  const apiKeySummaryData = ref<EnhancedExtractionUsageRecord[]>([])
  const pagination = ref<Page>({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  })
  const currentFilter = ref<ExtractionUsageFilterApi>({
    page: 1,
    limit: 20,
  })

  // Computed
  const hasMorePages = computed(() => {
    return (pagination.value.currentPage ?? 1) < (pagination.value.totalPages ?? 0)
  })

  const hasPreviousPage = computed(() => {
    return (pagination.value.currentPage ?? 1) > 1
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
      }
    }

    // Gruppiere nach Datum (wenn day/month/year vorhanden)
    const dateMap = new Map<string, { operations: number; pages: number; cost: number }>()

    data.forEach((item) => {
      let dateKey: string
      if (item.day && item.month && item.year) {
        dateKey = `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
      } else if (item.createDate) {
        const date = new Date(item.createDate)
        dateKey = date.toISOString().split('T')[0]
      } else {
        dateKey = 'unknown'
      }

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { operations: 0, pages: 0, cost: 0 })
      }

      const entry = dateMap.get(dateKey)
      if (entry) {
        // Bei Summary-Records: item.operations = Anzahl Operationen der Gruppe; sonst 1 pro Zeile
        entry.operations += (item as EnhancedExtractionUsageRecord).operations ?? 1
        entry.pages += item.pages || 0
        entry.cost += item.cost || 0
      }
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
    // Kacheln: Werte aus den pro-Kachel Summarize-Calls (Overview)
    const global = tileGlobal.value
    const uUsers = tileUniqueUsers.value
    const uProviders = tileUniqueProviders.value
    const uModels = tileUniqueModels.value
    const useTiles = global != null

    if (useTiles) {
      const totalOperations = global.totalOperations
      const totalPages = global.totalPages
      const totalCost = global.totalCost ?? 0
      return {
        totalOperations,
        totalPages,
        totalCost,
        uniqueUsers: uUsers ?? 0,
        uniqueProviders: uProviders ?? 0,
        uniqueModels: uModels ?? 0,
        operationsByStatus: {},
        averagePagesPerOperation: totalOperations > 0 ? totalPages / totalOperations : 0,
        averageCostPerOperation: totalOperations > 0 ? totalCost / totalOperations : 0,
      }
    }

    // Fallback: aus summaryData/usageData (z. B. Detail-View oder vor erstem Tile-Load)
    const data = summaryData.value.length > 0 ? summaryData.value : usageData.value
    if (data.length === 0) {
      return {
        totalOperations: 0,
        totalPages: 0,
        totalCost: 0,
        uniqueUsers: 0,
        uniqueProviders: 0,
        uniqueModels: 0,
        operationsByStatus: {},
        averagePagesPerOperation: 0,
        averageCostPerOperation: 0,
      }
    }

    const totalOperations = data.reduce(
      (sum, item) => sum + ((item as EnhancedExtractionUsageRecord).operations ?? 1),
      0,
    )
    const totalPages = data.reduce((sum, item) => sum + (item.pages ?? 0), 0)
    const totalCost = data.reduce((sum, item) => sum + (item.cost ?? 0), 0)
    const uniqueUsers = new Set(
      data.map((i) => i.userId).filter((id) => id != null && String(id).trim() !== ''),
    ).size
    const uniqueProviders = new Set(
      data.map((i) => i.provider).filter((p) => p != null && String(p).trim() !== ''),
    ).size
    const uniqueModels = new Set(
      data.map((i) => i.modelId).filter((m) => m != null && String(m).trim() !== ''),
    ).size
    const operationsByStatus: { [key: string]: number } = {}
    data.forEach((item) => {
      const status = item.status ?? 'unknown'
      operationsByStatus[status] = (operationsByStatus[status] || 0) + 1
    })

    return {
      totalOperations,
      totalPages,
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
      // Aktualisiere Filter explizit - WICHTIG: filter.page muss immer gesetzt werden, wenn es übergeben wird
      if (filter && Object.keys(filter).length > 0) {
        // Merge filter in currentFilter, wobei page explizit gesetzt wird wenn vorhanden
        currentFilter.value = { ...currentFilter.value, ...filter }
        // Stelle sicher, dass page korrekt gesetzt ist (auch wenn es 0 oder undefined war)
        if ('page' in filter && filter.page !== undefined) {
          currentFilter.value.page = filter.page
        }
      }

      debugLog('Loading extraction usage data with filter:', {
        ...currentFilter.value,
        page: currentFilter.value.page,
        limit: currentFilter.value.limit,
        offset: currentFilter.value.page
          ? (currentFilter.value.page - 1) * (currentFilter.value.limit || 20)
          : undefined,
      })

      const result = await extractionUsageApiService.getUsageData(currentFilter.value, useAdminApi)

      usageData.value = result.data
      pagination.value = result.pagination

      // currentPage auf 1..totalPages begrenzen (verhindert "Seite 20 von 7")
      const totalPages = result.pagination?.totalPages ?? 0
      const currentPage = result.pagination?.currentPage ?? 1
      if (totalPages > 0 && currentPage > totalPages) {
        const clampedPage = totalPages
        pagination.value = { ...pagination.value, currentPage: clampedPage }
        currentFilter.value = { ...currentFilter.value, page: clampedPage }
        debugLog('[useExtractionUsageApi] Clamped currentPage from', currentPage, 'to', clampedPage)
      } else if (filter?.page !== undefined) {
        currentFilter.value = { ...currentFilter.value, page: filter.page }
      } else if (result.pagination?.currentPage != null) {
        currentFilter.value = { ...currentFilter.value, page: result.pagination.currentPage }
      }

      debugLog('Extraction usage data loaded:', {
        count: result.data.length,
        pagination: result.pagination,
        currentFilterPage: currentFilter.value.page,
      })
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Fehler beim Laden der Extraction-Nutzungsdaten'
      debugLog('Error loading extraction usage data:', err)
      usageData.value = []
      pagination.value = {
        currentPage: currentFilter.value.page || 1,
        pageSize: currentFilter.value.limit || 20,
        totalItems: 0,
        totalPages: 0,
      }
    } finally {
      isLoading.value = false
    }
  }

  /** Kachel-Daten zurücksetzen bei Wechsel auf Detail-View */
  const clearTileData = () => {
    tileGlobal.value = null
    tileUniqueUsers.value = null
    tileUniqueProviders.value = null
    tileUniqueModels.value = null
  }

  const loadUsageSummary = async (
    filter?: Partial<ExtractionUsageFilterApi>,
    useAdminApi: boolean = false,
  ) => {
    isLoading.value = true
    error.value = null
    tileGlobal.value = null
    tileUniqueUsers.value = null
    tileUniqueProviders.value = null
    tileUniqueModels.value = null

    try {
      if (filter) {
        currentFilter.value = { ...currentFilter.value, ...filter }
      }

      debugLog('Loading extraction usage summary with filter:', currentFilter.value)

      const baseFilter = {
        fromDate: currentFilter.value.fromDate,
        toDate: currentFilter.value.toDate,
        tag: currentFilter.value.tag,
        provider: currentFilter.value.provider,
        modelId: currentFilter.value.modelId,
        userId: currentFilter.value.userId,
        page: 1,
        limit: 10000,
      }

      // 1) Chart: groupBy day/month/year (evtl. paginieren)
      const chartFilter = { ...baseFilter, groupBy: ['day', 'month', 'year'] as string[] }
      const result = await extractionUsageApiService.getUsageSummary(chartFilter, useAdminApi)
      let allData = [...result.data]
      let currentPage = 1
      const totalPages = result.pagination?.totalPages ?? 0
      const totalItems = result.pagination?.totalItems ?? 0
      while (currentPage < totalPages && allData.length < totalItems) {
        currentPage++
        const pageResult = await extractionUsageApiService.getUsageSummary(
          { ...chartFilter, page: currentPage },
          useAdminApi,
        )
        allData = [...allData, ...pageResult.data]
      }
      summaryData.value = allData
      pagination.value = {
        ...result.pagination,
        totalItems: allData.length,
      }

      // 2) Pro-Kachel Summarize-Calls parallel: ohne by, by=userId, by=provider, by=modelId, by=apiKeyId
      const [globalRes, byUserIdRes, byProviderRes, byModelIdRes, byApiKeyRes] = await Promise.all([
        extractionUsageApiService.getUsageSummary(
          { ...baseFilter, groupBy: undefined },
          useAdminApi,
        ),
        extractionUsageApiService.getUsageSummary(
          { ...baseFilter, groupBy: ['userId'] },
          useAdminApi,
        ),
        extractionUsageApiService.getUsageSummary(
          { ...baseFilter, groupBy: ['provider'] },
          useAdminApi,
        ),
        extractionUsageApiService.getUsageSummary(
          { ...baseFilter, groupBy: ['modelId'] },
          useAdminApi,
        ),
        extractionUsageApiService.getUsageSummary(
          { ...baseFilter, groupBy: ['apiKeyId'] },
          useAdminApi,
        ),
      ])

      const globalData = globalRes.data
      const totalOperations = globalData.reduce(
        (sum, item) => sum + ((item as EnhancedExtractionUsageRecord).operations ?? 1),
        0,
      )
      const totalPagesSum = globalData.reduce((sum, item) => sum + (item.pages ?? 0), 0)
      let totalCostSum = globalData.reduce((sum, item) => sum + (item.cost ?? 0), 0)
      // Fallback: globale Summarize liefert manchmal keine Kosten — aus Seiten schätzen (wie in der Tabelle)
      if (
        (totalCostSum === 0 || Number.isNaN(totalCostSum)) &&
        totalPagesSum > 0 &&
        totalOperations > 0
      ) {
        const { finalCost } = calculateExtractionCost(totalPagesSum, 'unknown')
        totalCostSum = finalCost
      }
      tileGlobal.value = {
        totalOperations,
        totalPages: totalPagesSum,
        totalCost: totalCostSum,
      }
      // Nutzerliste für Admin-Filter aus Summarize(by=userId)
      userSummaryData.value = byUserIdRes.data
      const userIds = byUserIdRes.data
        .map((item) => item.userId)
        .filter((id): id is string => !!id && String(id).trim() !== '')
      summaryUsers.value = Array.from(new Set(userIds))
      tileUniqueUsers.value = summaryUsers.value.length
      tileUniqueProviders.value = byProviderRes.data.length
      tileUniqueModels.value = byModelIdRes.data.length
      apiKeySummaryData.value = byApiKeyRes.data

      debugLog('Extraction usage summary loaded:', {
        chartCount: allData.length,
        tileGlobal: tileGlobal.value,
        uniqueUsers: tileUniqueUsers.value,
        uniqueProviders: tileUniqueProviders.value,
        uniqueModels: tileUniqueModels.value,
      })
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Fehler beim Laden der Extraction-Nutzungszusammenfassung'
      debugLog('Error loading extraction usage summary:', err)
      usageData.value = []
      summaryData.value = []
      tileGlobal.value = null
      tileUniqueUsers.value = null
      tileUniqueProviders.value = null
      tileUniqueModels.value = null
      summaryUsers.value = []
      userSummaryData.value = []
      apiKeySummaryData.value = []
      pagination.value = {
        currentPage: currentFilter.value.page || 1,
        pageSize: currentFilter.value.limit || 20,
        totalItems: 0,
        totalPages: 0,
      }
    } finally {
      isLoading.value = false
    }
  }

  const nextPage = async (useAdminApi: boolean = false) => {
    if (!hasMorePages.value) return

    const newPage = (pagination.value.currentPage ?? 1) + 1
    await loadUsageData({ page: newPage }, useAdminApi)
  }

  const previousPage = async (useAdminApi: boolean = false) => {
    if (!hasPreviousPage.value) return

    const newPage = (pagination.value.currentPage ?? 1) - 1
    await loadUsageData({ page: newPage }, useAdminApi)
  }

  const goToPage = async (page: number, useAdminApi: boolean = false) => {
    if (page < 1) return
    const totalPages = pagination.value.totalPages
    if (totalPages != null && totalPages > 0 && page > totalPages) return

    debugLog('[useExtractionUsageApi] goToPage called:', {
      requestedPage: page,
      currentFilterPage: currentFilter.value.page,
      currentLimit: currentFilter.value.limit,
      calculatedOffset: (page - 1) * (currentFilter.value.limit || 20),
    })

    // Stelle sicher, dass page explizit gesetzt wird
    currentFilter.value = { ...currentFilter.value, page }

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
      userId: 'userId',
      status: 'status',
      provider: 'provider',
      pages: 'pages',
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

  /**
   * Alle Detailzeilen für den aktuellen Filter (Zeitraum, Sortierung, Tags …) laden –
   * für CSV-Export ohne die sichtbare Tabellen-Pagination zu ändern.
   */
  const fetchAllUsageDataForExport = async (
    useAdminApi: boolean = false,
  ): Promise<EnhancedExtractionUsageRecord[]> => {
    const CHUNK = 500
    const MAX_ROWS = 100_000
    const MAX_PAGES = 500

    const filterBase: ExtractionUsageFilterApi = {
      ...currentFilter.value,
      limit: CHUNK,
    }

    const accumulated: EnhancedExtractionUsageRecord[] = []
    let page = 1

    for (;;) {
      if (accumulated.length >= MAX_ROWS) {
        debugLog('fetchAllUsageDataForExport: Abbruch MAX_ROWS', MAX_ROWS)
        break
      }
      if (page > MAX_PAGES) {
        debugLog('fetchAllUsageDataForExport: Abbruch MAX_PAGES', MAX_PAGES)
        break
      }

      const { data, pagination } = await extractionUsageApiService.getUsageData(
        { ...filterBase, page },
        useAdminApi,
      )

      if (!data.length) break

      accumulated.push(...data)

      const totalPages = pagination?.totalPages ?? 1
      const totalItems = pagination?.totalItems

      if (totalItems != null && accumulated.length >= totalItems) break
      if (page >= totalPages) break
      if (data.length < CHUNK) break

      page++
    }

    debugLog('fetchAllUsageDataForExport: fertig, Zeilen=', accumulated.length)
    return accumulated
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
    summaryUsers,
    userSummaryData,
    apiKeySummaryData,

    // Actions
    loadUsageData,
    loadUsageSummary,
    nextPage,
    previousPage,
    goToPage,
    updateFilter,
    updateSort,
    resetFilter,
    fetchAllUsageDataForExport,
  }
}
