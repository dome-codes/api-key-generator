import type {
  EnhancedUsageRecord,
  ModelUsageSummary,
  UsageAggregation,
  UsageFilter,
  UserUsageSummary,
} from '@/api/types/types'
import { usageAnalyticsService } from '@/services/usageAnalyticsService'
import { computed, ref } from 'vue'

// Debug-Log-Funktion (nur im Debug-Modus)
const debugLog = (...args: unknown[]) => {
  const isDevelopment = import.meta.env.DEV
  const debugFromEnv = import.meta.env.VITE_SHOW_DEBUG === 'true'
  const debugFromLocalStorage = localStorage.getItem('debug') === 'true'
  const showDebugMode = isDevelopment && (debugFromEnv || debugFromLocalStorage)
  if (showDebugMode) {
    console.log(...args)
  }
}

// Hilfsfunktion um Datumswerte in ISO-Strings zu konvertieren
const convertToIsoString = (dateString?: string): string | undefined => {
  if (!dateString) return undefined

  try {
    // Wenn es bereits ein ISO-String ist, gib ihn zurück
    if (dateString.includes('T')) {
      return dateString
    }

    // Konvertiere YYYY-MM-DD zu ISO-String mit Mitternacht
    const date = new Date(dateString + 'T00:00:00.000Z')
    return date.toISOString()
  } catch (error) {
    console.warn('Fehler beim Konvertieren des Datums:', dateString, error)
    return dateString
  }
}

export function useUsage() {
  // State
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const detailedUsageData = ref<EnhancedUsageRecord[]>([])
  const usageAggregation = ref<UsageAggregation | null>(null)
  const userUsageSummary = ref<UserUsageSummary[]>([])
  const modelUsageSummary = ref<ModelUsageSummary[]>([])
  const currentFilter = ref<UsageFilter>({})

  // Computed
  const filteredUsageData = computed(() => {
    let filtered = detailedUsageData.value

    if (currentFilter.value.modelType) {
      // Backend sendet 'type' zurück, nicht 'modelType'
      filtered = filtered.filter(
        (item) =>
          item.type === currentFilter.value.modelType ||
          item.modelType === currentFilter.value.modelType,
      )
    }

    if (currentFilter.value.technicalUserIds && currentFilter.value.technicalUserIds.length > 0) {
      filtered = filtered.filter((item) =>
        currentFilter.value.technicalUserIds!.includes(item.technicalUserId),
      )
    }

    return filtered
  })

  const topUsers = computed(() => {
    return userUsageSummary.value.sort((a, b) => b.totalRequests - a.totalRequests).slice(0, 10)
  })

  const topModels = computed(() => {
    return modelUsageSummary.value.sort((a, b) => b.totalRequests - a.totalRequests).slice(0, 10)
  })

  // Actions
  const loadDetailedUsageData = async (filter?: UsageFilter) => {
    isLoading.value = true
    error.value = null

    try {
      if (filter) {
        currentFilter.value = { ...filter }
      }

      debugLog('Loading usage data with filter:', currentFilter.value)

      // Prüfe ob Admin-Berechtigung vorhanden ist
      const hasAdminPermission = await import('@/auth/keycloak').then((m) =>
        m.hasPermission('canViewAdminUsage'),
      )

      debugLog('Has admin permission:', hasAdminPermission)

      if (hasAdminPermission) {
        // Lade alle Daten nur wenn Admin-Berechtigung vorhanden
        debugLog('Loading admin data...')
        const [detailedData, aggregation, userSummary, modelSummary] = await Promise.all([
          usageAnalyticsService.getDetailedUsageData(
            convertToIsoString(currentFilter.value.fromDate),
            convertToIsoString(currentFilter.value.toDate),
            currentFilter.value.modelType,
            undefined,
            true, // useAdminApi
          ),
          usageAnalyticsService.getUsageAggregation(
            convertToIsoString(currentFilter.value.fromDate),
            convertToIsoString(currentFilter.value.toDate),
            true, // useAdminApi
          ),
          usageAnalyticsService.getUserUsageSummary(
            convertToIsoString(currentFilter.value.fromDate),
            convertToIsoString(currentFilter.value.toDate),
          ),
          usageAnalyticsService.getModelUsageSummary(
            convertToIsoString(currentFilter.value.fromDate),
            convertToIsoString(currentFilter.value.toDate),
          ),
        ])

        debugLog('Admin data loaded:', { detailedData, aggregation, userSummary, modelSummary })

        detailedUsageData.value = detailedData
        usageAggregation.value = aggregation
        userUsageSummary.value = userSummary
        modelUsageSummary.value = modelSummary
      } else {
        // Lade eigene Daten für normale Benutzer
        debugLog('Loading own data...')
        try {
          const [detailedData, aggregation] = await Promise.all([
            usageAnalyticsService.getDetailedUsageData(
              convertToIsoString(currentFilter.value.fromDate),
              convertToIsoString(currentFilter.value.toDate),
              currentFilter.value.modelType,
              undefined,
              false, // useAdminApi = false für normale Benutzer
            ),
            usageAnalyticsService.getUsageAggregation(
              convertToIsoString(currentFilter.value.fromDate),
              convertToIsoString(currentFilter.value.toDate),
              false, // useAdminApi = false für normale Benutzer
            ),
          ])

          debugLog('Own data loaded:', { detailedData, aggregation })

          detailedUsageData.value = detailedData
          usageAggregation.value = aggregation
          userUsageSummary.value = []
          modelUsageSummary.value = []
        } catch (ownDataError) {
          console.warn('Could not load own data, using fallback:', ownDataError)
          // Fallback: Leere Arrays für nicht-Admin Benutzer, aber nicht null
          detailedUsageData.value = []
          usageAggregation.value = {
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
          userUsageSummary.value = []
          modelUsageSummary.value = []
        }
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden der Usage-Daten'
      console.error('Fehler beim Laden der Usage-Daten:', err)

      // Setze Fallback-Daten bei Fehlern
      detailedUsageData.value = []
      usageAggregation.value = {
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
      userUsageSummary.value = []
      modelUsageSummary.value = []
    } finally {
      isLoading.value = false
    }
  }

  const exportUsageData = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const data = filteredUsageData.value

      if (format === 'csv') {
        const headers = [
          'Technische User ID',
          'Technischer Benutzername',
          'Modell',
          'Modelltyp',
          'Anfragen',
          'Tag',
          'Tag',
          'Monat',
          'Jahr',
        ]

        const csvContent = [
          headers.join(','),
          ...data.map((item) =>
            [
              item.technicalUserId,
              item.technicalUserName,
              item.modelName,
              item.modelType,
              item.requests,
              item.tag,
              item.day || '',
              item.month || '',
              item.year || '',
            ].join(','),
          ),
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `usage-data-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `usage-data-${new Date().toISOString().split('T')[0]}.json`
        link.click()
      }
    } catch (err) {
      error.value = 'Fehler beim Exportieren der Daten'
      console.error('Fehler beim Exportieren:', err)
    }
  }

  const updateFilter = async (newFilter: Partial<UsageFilter>) => {
    currentFilter.value = { ...currentFilter.value, ...newFilter }
    await loadDetailedUsageData()
  }

  return {
    // State
    isLoading,
    error,
    detailedUsageData,
    usageAggregation,
    userUsageSummary,
    modelUsageSummary,
    currentFilter,

    // Computed
    filteredUsageData,
    topUsers,
    topModels,

    // Actions
    loadDetailedUsageData,
    exportUsageData,
    updateFilter,
  }
}
