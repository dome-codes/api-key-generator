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

import { usageApiService } from '@/services/usageApiService'
import { AZURE_MODEL_PRICING } from '@/config/pricing'
import {
  ImageModelUsageType as ImageModelUsageTypeEnum,
  type EnhancedUsageRecord,
  type UsageAggregation,
  type UsageFilterApi,
} from '@/types/frontend'
import { debugLog as baseDebugLog } from '@/utils/debugLog'
import { computed, ref } from 'vue'

// Debug-Log mit Präfix
const debugLog = (...args: unknown[]) => baseDebugLog('[useUsageApi]', ...args)

type OrvalTypes = typeof import('@/api/types')
type Page = OrvalTypes extends { Page: infer P }
  ? P
  : {
      currentPage?: number
      pageSize?: number
      totalItems?: number
      totalPages?: number
    }

export function useUsageApi() {
  // State
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const usageData = ref<EnhancedUsageRecord[]>([]) // Für Tabellen-Daten (paginiert)
  const summaryData = ref<EnhancedUsageRecord[]>([]) // Für Summary-Berechnung (alle Daten)
  const modelSummaryData = ref<EnhancedUsageRecord[]>([]) // Für Modell-Chart (gruppiert nach Modell)
  const tagSummaryData = ref<EnhancedUsageRecord[]>([]) // Für Tag-Chart (gruppiert nach Tag)
  const userSummaryData = ref<EnhancedUsageRecord[]>([]) // Für User-Breakdown (gruppiert nach user)
  const apiKeySummaryData = ref<EnhancedUsageRecord[]>([]) // Für API-Key-Breakdown (gruppiert nach apikey)
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
        totalCachedTokens: 0,
        totalReasoningTokens: 0,
        hasFallbackPricing: false,
        fallbackUnknownModelNames: [],
        fallbackUnknownRequests: 0,
        fallbackUnknownTokensIn: 0,
        fallbackUnknownTokensOut: 0,
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
    const totalCachedTokens = data.reduce((sum, item) => sum + (item.cachedTokens ?? 0), 0)
    const totalReasoningTokens = data.reduce((sum, item) => sum + (item.reasoningTokens ?? 0), 0)
    const totalImages = data
      .filter((item) => {
        const t = item.type as string | undefined
        const m = item.modelType as string | undefined
        return (
          t === ImageModelUsageTypeEnum.ImageModelUsage ||
          t === ImageModelUsageTypeEnum.IMAGE_USAGE ||
          m === ImageModelUsageTypeEnum.ImageModelUsage ||
          m === ImageModelUsageTypeEnum.IMAGE_USAGE
        )
      })
      .reduce((sum, item) => sum + (item.requests ?? 1), 0)

    const uniqueUsers = new Set(data.map((item) => item.userId)).size
    const uniqueModels = new Set(data.map((item) => item.modelName)).size

    // Fallback-Pricing: Modelle, die nicht in AZURE_MODEL_PRICING gepflegt sind
    const knownModelNames = new Set(
      AZURE_MODEL_PRICING.map((m) => (m.modelName || '').toLowerCase()),
    )
    const unknownModelsSet = new Set<string>()
    let fallbackUnknownRequests = 0
    let fallbackUnknownTokensIn = 0
    let fallbackUnknownTokensOut = 0

    data.forEach((item) => {
      const rawName = item.modelName ?? ''
      const normalizedName = rawName.toLowerCase()
      if (!normalizedName || knownModelNames.has(normalizedName)) {
        return
      }

      unknownModelsSet.add(rawName)
      fallbackUnknownRequests += item.requests ?? 0
      fallbackUnknownTokensIn += item.tokensIn ?? 0
      fallbackUnknownTokensOut += item.tokensOut ?? 0
    })

    const hasFallbackPricing = unknownModelsSet.size > 0

    return {
      totalRequests,
      totalTokensIn,
      totalTokensOut,
      totalTokens,
      totalCost,
      totalCachedTokens,
      totalReasoningTokens,
      hasFallbackPricing,
      fallbackUnknownModelNames: Array.from(unknownModelsSet),
      fallbackUnknownRequests,
      fallbackUnknownTokensIn,
      fallbackUnknownTokensOut,
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
        cachedTokens: [],
        reasoningTokens: [],
      }
    }

    const dateMap = new Map<
      string,
      {
        tokensIn: number
        tokensOut: number
        requests: number
        cost: number
        cachedTokens: number
        reasoningTokens: number
      }
    >()

    data.forEach((item) => {
      const dateKey = getDateKeyFromItem(item)

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          tokensIn: 0,
          tokensOut: 0,
          requests: 0,
          cost: 0,
          cachedTokens: 0,
          reasoningTokens: 0,
        })
      }

      const entry = dateMap.get(dateKey)
      if (entry) {
        entry.tokensIn += item.tokensIn || 0
        entry.tokensOut += item.tokensOut || 0
        entry.requests += item.requests ?? (item.tokensIn || item.tokensOut ? 1 : 0)
        entry.cost += item.cost || 0
        entry.cachedTokens += item.cachedTokens || 0
        entry.reasoningTokens += item.reasoningTokens || 0
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
      cachedTokens: sortedEntries.map(([, d]) => d.cachedTokens),
      reasoningTokens: sortedEntries.map(([, d]) => d.reasoningTokens),
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
    const data =
      modelSummaryData.value.length > 0
        ? modelSummaryData.value
        : summaryData.value.length > 0
          ? summaryData.value
          : usageData.value

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
        const raw = typeof item.tag === 'string' ? item.tag : ''
        const trimmed = raw.trim()
        const tag = trimmed !== '' ? trimmed : 'kein Tag'
        return {
          tag,
          count: getRequestCount(item),
        }
      })
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

      const calculatedOffset = currentFilter.value.page
        ? (currentFilter.value.page - 1) * (currentFilter.value.limit || 20)
        : 0

      debugLog('[useUsageApi] Loading usage data with filter:', {
        ...currentFilter.value,
        page: currentFilter.value.page,
        limit: currentFilter.value.limit,
        calculatedOffset,
        filterObject: filter,
      })

      const result = await usageApiService.getUsageData(currentFilter.value, useAdminApi)

      usageData.value = result.data
      pagination.value = result.pagination

      // currentPage auf gültigen Bereich 1..totalPages begrenzen (verhindert "Seite 20 von 7")
      const totalPages = result.pagination?.totalPages ?? 0
      const currentPage = result.pagination?.currentPage ?? 1
      if (totalPages > 0 && currentPage > totalPages) {
        const clampedPage = totalPages
        pagination.value = { ...pagination.value, currentPage: clampedPage }
        currentFilter.value = { ...currentFilter.value, page: clampedPage }
        debugLog(
          '[useUsageApi] Clamped currentPage from',
          currentPage,
          'to',
          clampedPage,
          '(totalPages:',
          totalPages,
          ')',
        )
      } else if (filter?.page !== undefined) {
        currentFilter.value = { ...currentFilter.value, page: filter.page }
      } else if (result.pagination?.currentPage != null) {
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
      const hasModelFilter = Boolean(currentFilter.value.model && String(currentFilter.value.model).trim())
      const groupByForTiles = hasModelFilter ? (['model'] as string[]) : (currentFilter.value.groupBy as string[] | undefined)

      const summaryFilter = {
        ...currentFilter.value,
        groupBy: groupByForTiles,
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

      // Folge-Requests (Charts/Breakdowns) nicht blockierend laden
      void Promise.allSettled([
        loadModelSummary(useAdminApi),
        loadTagSummary(useAdminApi),
        loadUserSummary(useAdminApi),
        loadApiKeySummary(useAdminApi),
      ])
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Fehler beim Laden der Nutzungszusammenfassung'
      debugLog('Error loading usage summary:', err)
      // summaryData leer setzen, usageData NICHT überschreiben (Liste kann weiterhin 46 Einträge haben)
      summaryData.value = []
      modelSummaryData.value = []
      userSummaryData.value = []
      apiKeySummaryData.value = []
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

  // Lade Modell-Daten für den Modell-Chart (gruppiert nach Modell)
  const loadModelSummary = async (useAdminApi: boolean = false) => {
    try {
      const modelFilter = {
        ...currentFilter.value,
        page: 1,
        limit: 1000, // Ausreichend für Modell-Gruppierung
        groupBy: ['model'] as 'model'[],
      }

      debugLog('Loading model summary with filter:', modelFilter)

      const result = await usageApiService.getUsageSummary(modelFilter, useAdminApi)

      // Lade alle Seiten falls nötig
      let allModelData = [...result.data]
      let currentPage = 1
      const totalPages = result.pagination?.totalPages ?? 0
      const totalItems = result.pagination?.totalItems ?? 0

      while (currentPage < totalPages && allModelData.length < totalItems) {
        currentPage++
        const pageResult = await usageApiService.getUsageSummary(
          { ...modelFilter, page: currentPage },
          useAdminApi,
        )
        allModelData = [...allModelData, ...pageResult.data]
      }

      modelSummaryData.value = allModelData.filter(
        (item) => item.modelName && String(item.modelName).trim() && item.modelName !== '',
      )

      debugLog('Model summary loaded:', {
        count: modelSummaryData.value.length,
        models: modelSummaryData.value.map((item) => item.modelName),
      })
    } catch (err) {
      debugLog('Error loading model summary:', err)
      // Fehler beim Laden der Modell-Daten sollte nicht die gesamte Summary blockieren
      modelSummaryData.value = []
    }
  }

  // Lade User-Daten für Breakdown (gruppiert nach user)
  const loadUserSummary = async (useAdminApi: boolean = false) => {
    try {
      const userFilter = {
        ...currentFilter.value,
        page: 1,
        limit: 10000,
        groupBy: ['user'] as 'user'[],
      }

      debugLog('Loading user summary with filter:', userFilter)

      const result = await usageApiService.getUsageSummary(userFilter, useAdminApi)

      // Lade alle Seiten falls nötig
      let allUserData = [...result.data]
      let currentPage = 1
      const totalPages = result.pagination?.totalPages ?? 0
      const totalItems = result.pagination?.totalItems ?? 0

      while (currentPage < totalPages && allUserData.length < totalItems) {
        currentPage++
        const pageResult = await usageApiService.getUsageSummary(
          { ...userFilter, page: currentPage },
          useAdminApi,
        )
        allUserData = [...allUserData, ...pageResult.data]
      }

      userSummaryData.value = allUserData.filter(
        (item) => item.userId && String(item.userId).trim() !== '',
      )

      debugLog('User summary loaded:', {
        count: userSummaryData.value.length,
      })
    } catch (err) {
      debugLog('Error loading user summary:', err)
      userSummaryData.value = []
    }
  }

  // Lade API-Key-Daten für Breakdown (gruppiert nach apikey)
  const loadApiKeySummary = async (useAdminApi: boolean = false) => {
    try {
      const apiKeyFilter = {
        ...currentFilter.value,
        page: 1,
        limit: 10000,
        groupBy: ['apikey'] as 'apikey'[],
      }

      debugLog('Loading apiKey summary with filter:', apiKeyFilter)

      const result = await usageApiService.getUsageSummary(apiKeyFilter, useAdminApi)

      let allApiKeyData = [...result.data]
      let currentPage = 1
      const totalPages = result.pagination?.totalPages ?? 0
      const totalItems = result.pagination?.totalItems ?? 0

      while (currentPage < totalPages && allApiKeyData.length < totalItems) {
        currentPage++
        const pageResult = await usageApiService.getUsageSummary(
          { ...apiKeyFilter, page: currentPage },
          useAdminApi,
        )
        allApiKeyData = [...allApiKeyData, ...pageResult.data]
      }

      apiKeySummaryData.value = allApiKeyData.filter((item) => {
        const any = item as unknown as Record<string, unknown>
        const raw = (any.apiKeyId ?? any.apiKey) as unknown
        return typeof raw === 'string' && raw.trim() !== ''
      })

      debugLog('API-Key summary loaded:', {
        count: apiKeySummaryData.value.length,
      })
    } catch (err) {
      debugLog('Error loading apiKey summary:', err)
      apiKeySummaryData.value = []
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
    if (page < 1) return
    const totalPages = pagination.value.totalPages
    if (totalPages != null && totalPages > 0 && page > totalPages) return

    debugLog('[useUsageApi] goToPage called:', {
      requestedPage: page,
      currentFilterPage: currentFilter.value.page,
      currentLimit: currentFilter.value.limit,
      calculatedOffset: (page - 1) * (currentFilter.value.limit || 20),
    })

    // Stelle sicher, dass page explizit gesetzt wird
    currentFilter.value = { ...currentFilter.value, page }

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
    // Map frontend/Tabellen-Spaltennamen auf Backend-Feldnamen (API sort/order)
    const fieldMapping: Record<string, string> = {
      date: 'date',
      cost: 'cost',
      requests: 'requests',
      tokensIn: 'tokensIn',
      tokensOut: 'tokensOut',
      totalTokens: 'totalTokens',
      model: 'model',
      modelName: 'model',
      user: 'technicalUserName',
      userName: 'technicalUserName',
      technicalUserName: 'technicalUserName',
      modelType: 'modelType',
      apiKeyId: 'apiKeyId',
      tag: 'tag',
      quality: 'quality',
      imageSize: 'imageSize',
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
    userSummaryData,
    apiKeySummaryData,
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
