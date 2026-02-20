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

import type { Page } from '@/api/types'
import type { EnhancedUsageRecord, UsageAggregation, UsageFilterApi } from '@/types/frontend'
import { ImageModelUsageType as ImageModelUsageTypeEnum } from '@/types/frontend'
import { usageApiService } from '@/services/usageApiService'
import { debugLog as baseDebugLog } from '@/utils/debugLog'
import { computed, ref } from 'vue'

// Debug-Log mit Präfix
const debugLog = (...args: unknown[]) => baseDebugLog('[useUsageApi]', ...args)

export function useUsageApi() {
  // State
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const usageData = ref<EnhancedUsageRecord[]>([]) // Für Tabellen-Daten (paginiert)
  const summaryData = ref<EnhancedUsageRecord[]>([]) // Für Summary-Berechnung (alle Daten)
  const tagSummaryData = ref<EnhancedUsageRecord[]>([]) // Für Tag-Chart (gruppiert nach Tag)
  const pagination = ref<Page>({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  })
  const currentFilter = ref<UsageFilterApi>({
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

  const usageAggregation = computed<UsageAggregation>(() => {
    // Verwende summaryData für die Aggregation, nicht usageData (das ist paginiert)
    const data = summaryData.value.length > 0 ? summaryData.value : usageData.value

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

    const totalRequests = data.reduce((sum, item) => sum + (item.requests ?? 0), 0)
    const totalTokensIn = data.reduce((sum, item) => sum + (item.tokensIn ?? 0), 0)
    const totalTokensOut = data.reduce((sum, item) => sum + (item.tokensOut ?? 0), 0)
    const totalTokens = data.reduce((sum, item) => sum + (item.totalTokens ?? 0), 0)
    const totalCost = data.reduce((sum, item) => sum + (item.cost ?? 0), 0)
    const totalImages = data
      .filter(
        (item) => {
          const t = item.type as string | undefined
          const m = item.modelType as string | undefined
          return (
            t === ImageModelUsageTypeEnum.ImageModelUsage ||
            t === ImageModelUsageTypeEnum.IMAGE_USAGE ||
            m === ImageModelUsageTypeEnum.ImageModelUsage ||
            m === ImageModelUsageTypeEnum.IMAGE_USAGE
          )
        },
      )
      .reduce((sum, item) => sum + (item.requests ?? 1), 0)

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
      totalImages: totalImages > 0 ? totalImages : undefined,
    }
  })

  // Hilfsfunktion: Datum aus Item; wenn createDate leer oder ungültig → 'unknown' (Chart zeigt dann "Gesamt")
  const getDateKeyFromItem = (item: {
    day?: number
    month?: number
    year?: number
    createDate?: string
  }): string => {
    if (item.day != null && item.month != null && item.year != null) {
      return `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
    }
    const raw = item.createDate != null ? String(item.createDate).trim() : ''
    if (raw && item.createDate != null) {
      try {
        const date = new Date(item.createDate)
        if (!Number.isNaN(date.getTime())) return date.toISOString().split('T')[0]
      } catch {
        // ungültiges Datum → Fallback
      }
    }
    return 'unknown'
  }

  // Chart data computed - generiert aus den gruppierten Daten vom Backend
  const chartData = computed(() => {
    const data = summaryData.value.length > 0 ? summaryData.value : usageData.value

    if (data.length === 0) {
      return {
        labels: [],
        tokensIn: [],
        tokensOut: [],
        requests: [],
        cost: [],
      }
    }

    const dateMap = new Map<
      string,
      { tokensIn: number; tokensOut: number; requests: number; cost: number }
    >()

    data.forEach((item) => {
      const dateKey = getDateKeyFromItem(item)

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0 })
      }

      const entry = dateMap.get(dateKey)
      if (entry) {
        entry.tokensIn += item.tokensIn || 0
        entry.tokensOut += item.tokensOut || 0
        entry.requests += item.requests ?? (item.tokensIn || item.tokensOut ? 1 : 0)
        entry.cost += item.cost || 0
      }
    })

    const sortedEntries = Array.from(dateMap.entries()).sort((a, b) => {
      if (a[0] === 'unknown') return 1
      if (b[0] === 'unknown') return -1
      return a[0].localeCompare(b[0])
    })

    return {
      labels: sortedEntries.map(([date]) => {
        if (date === 'unknown') return 'Gesamt'
        const parts = date.split('-')
        if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`
        return date
      }),
      tokensIn: sortedEntries.map(([, d]) => d.tokensIn),
      tokensOut: sortedEntries.map(([, d]) => d.tokensOut),
      requests: sortedEntries.map(([, d]) => d.requests),
      cost: sortedEntries.map(([, d]) => d.cost),
    }
  })

  // Request-Zählung für Charts: Backend sendet oft keine "requests", dann 1 pro Eintrag mit Tokens
  const getRequestCount = (item: {
    requests?: number
    tokensIn?: number
    tokensOut?: number
  }): number => {
    const r = item.requests ?? 0
    if (r > 0) return r
    return item.tokensIn || item.tokensOut ? 1 : 0
  }

  // Chart data für Model-Verteilung (Pie Chart)
  const modelDistributionChartData = computed(() => {
    const data = summaryData.value.length > 0 ? summaryData.value : usageData.value

    if (data.length === 0) {
      return { labels: [], data: [] }
    }

    const modelMap = new Map<string, number>()

    data.forEach((item) => {
      const modelName = item.modelName || 'Unknown'
      const currentCount = modelMap.get(modelName) || 0
      modelMap.set(modelName, currentCount + getRequestCount(item))
    })

    return {
      labels: Array.from(modelMap.keys()),
      data: Array.from(modelMap.values()),
    }
  })

  // Chart data für Tag-Verwendung (Bar Chart) - zeigt standardmäßig Top 10
  const showAllTagsInChart = ref(false)
  const tagUsageChartData = computed(() => {
    // Verwende tagSummaryData, die mit groupBy: ['tag'] geladen wurde
    const data = tagSummaryData.value

    if (data.length === 0) {
      return { labels: [], data: [] }
    }

    // Die Daten sind bereits nach Tag gruppiert, also können wir sie direkt verwenden
    const tagEntries = data
      .map((item) => {
        const tag = item.tag && String(item.tag).trim() ? item.tag : undefined
        if (!tag) return null
        return {
          tag,
          count: getRequestCount(item),
        }
      })
      .filter((entry): entry is { tag: string; count: number } => entry !== null)
      .sort((a, b) => b.count - a.count) // Sortiere nach Anzahl (absteigend)
      .slice(0, showAllTagsInChart.value ? data.length : 10) // Top 10 oder alle

    return {
      labels: tagEntries.map((entry) => entry.tag),
      data: tagEntries.map((entry) => entry.count),
    }
  })

  const hasMoreTags = computed(() => {
    return tagSummaryData.value.length > 10
  })

  const toggleShowAllTags = () => {
    showAllTagsInChart.value = !showAllTagsInChart.value
  }

  // Actions
  const loadUsageData = async (filter?: Partial<UsageFilterApi>, useAdminApi: boolean = false) => {
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

      debugLog('Loading usage data with filter:', {
        ...currentFilter.value,
        page: currentFilter.value.page,
        limit: currentFilter.value.limit,
        offset: currentFilter.value.page ? (currentFilter.value.page - 1) * (currentFilter.value.limit || 20) : undefined,
      })

      const result = await usageApiService.getUsageData(currentFilter.value, useAdminApi)

      usageData.value = result.data
      pagination.value = result.pagination

      // Synchronisiere currentFilter.page mit der Backend-Pagination
      // (Backend könnte die Seite anpassen, z.B. wenn die Seite außerhalb des Bereichs liegt)
      if (result.pagination?.currentPage) {
        currentFilter.value = { ...currentFilter.value, page: result.pagination.currentPage }
      }

      debugLog('Usage data loaded:', {
        count: result.data.length,
        pagination: result.pagination,
        currentPage: result.pagination?.currentPage,
        totalPages: result.pagination?.totalPages,
        currentFilterPage: currentFilter.value.page,
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Laden der Nutzungsdaten'
      debugLog('Error loading usage data:', err)
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

      // Für die Summary müssen ALLE Daten geladen werden, nicht nur die ersten 20
      // Verwende einen sehr hohen limit, um alle Daten zu erhalten
      const summaryFilter = {
        ...currentFilter.value,
        page: 1,
        limit: 10000, // Sehr hoher Wert, um alle Daten zu erhalten
      }

      const result = await usageApiService.getUsageSummary(summaryFilter, useAdminApi)

      // Wenn es mehr Daten gibt, lade alle Seiten
      let allData = [...result.data]
      let currentPage = 1
      const totalPages = result.pagination?.totalPages ?? 0
      const totalItems = result.pagination?.totalItems ?? 0

      while (currentPage < totalPages && allData.length < totalItems) {
        currentPage++
        const pageResult = await usageApiService.getUsageSummary(
          { ...summaryFilter, page: currentPage },
          useAdminApi,
        )
        allData = [...allData, ...pageResult.data]
      }

      // Speichere Summary-Daten separat, damit sie nicht von loadUsageData überschrieben werden
      summaryData.value = allData
      // Pagination wird von loadUsageData gesetzt, wenn wir in der detaillierten Ansicht sind
      // In der Übersicht setzen wir die Pagination hier
      pagination.value = {
        ...result.pagination,
        totalItems: allData.length,
      }

      debugLog('Usage summary loaded:', {
        count: allData.length,
        pagination: pagination.value,
        firstItem: allData[0],
      })
      debugLog('[useUsageApi] Usage summary loaded - summaryData.value:', summaryData.value)

      // Lade auch Tag-Daten für den Tag-Chart (gruppiert nach Tag)
      await loadTagSummary(useAdminApi)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Fehler beim Laden der Nutzungszusammenfassung'
      debugLog('Error loading usage summary:', err)
      // summaryData leer setzen, usageData NICHT überschreiben (Liste kann weiterhin 46 Einträge haben)
      summaryData.value = []
      pagination.value = {
        currentPage: currentFilter.value.page || 1,
        pageSize: currentFilter.value.limit || 20,
        totalItems: pagination.value.totalItems ?? 0,
        totalPages: pagination.value.totalPages ?? 0,
      }
    } finally {
      isLoading.value = false
    }
  }

  // Lade Tag-Daten für den Tag-Chart (gruppiert nach Tag)
  const loadTagSummary = async (useAdminApi: boolean = false) => {
    try {
      const tagFilter = {
        ...currentFilter.value,
        page: 1,
        limit: 1000, // Ausreichend für Tags
        groupBy: ['tag'] as ('day' | 'month' | 'year' | 'tag')[],
      }

      debugLog('Loading tag summary with filter:', tagFilter)

      const result = await usageApiService.getUsageSummary(tagFilter, useAdminApi)

      // Lade alle Seiten falls nötig
      let allTagData = [...result.data]
      let currentPage = 1
      const totalPages = result.pagination?.totalPages ?? 0
      const totalItems = result.pagination?.totalItems ?? 0

      while (currentPage < totalPages && allTagData.length < totalItems) {
        currentPage++
        const pageResult = await usageApiService.getUsageSummary(
          { ...tagFilter, page: currentPage },
          useAdminApi,
        )
        allTagData = [...allTagData, ...pageResult.data]
      }

      tagSummaryData.value = allTagData.filter(
        (item) => item.tag && String(item.tag).trim() && item.tag !== '',
      )

      debugLog('Tag summary loaded:', {
        count: tagSummaryData.value.length,
        tags: tagSummaryData.value.map((item) => item.tag),
      })
    } catch (err) {
      debugLog('Error loading tag summary:', err)
      // Fehler beim Laden der Tag-Daten sollte nicht die gesamte Summary blockieren
      tagSummaryData.value = []
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
    if (page < 1 || page > (pagination.value.totalPages ?? 0)) return

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
    hasMoreTags,
    showAllTagsInChart,

    // Actions
    loadUsageData,
    loadUsageSummary,
    nextPage,
    previousPage,
    goToPage,
    updateFilter,
    resetFilter,
    updateSort,
    toggleShowAllTags,
  }
}
