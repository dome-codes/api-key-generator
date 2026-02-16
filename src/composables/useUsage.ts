/**
 * @deprecated Dieser Composable wird durch useUsageApi.ts ersetzt.
 * Bitte verwende useUsageApi.ts für neue Features.
 * 
 * Migration:
 * - useUsageApi.ts verwendet server-seitige Filterung und Gruppierung
 * - Alle Filterung erfolgt über API-Parameter
 * - Bessere Performance durch server-seitige Verarbeitung
 * 
 * Dieser Composable bleibt für Rückwärtskompatibilität erhalten.
 */

import type {
  EnhancedUsageRecord,
  ModelUsageSummary,
  SummaryUsage,
  UsageAggregation,
  UsageFilter,
  UserUsageSummary,
} from '@/api/types/frontend'
import { usageService } from '@/services/apiService'
import { readTokensFromItem } from '@/services/usageApiService'
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
        currentFilter.value.technicalUserIds!.includes(item.technicalUserId ?? ''),
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

  // Optimierte Funktion: Nur Summary laden
  const loadUsageSummary = async (filter?: UsageFilter) => {
    isLoading.value = true
    error.value = null

    try {
      if (filter) {
        currentFilter.value = { ...filter }
      }

      debugLog('Loading usage summary with filter:', currentFilter.value)
      console.log('🔍 [FRONTEND] Loading usage summary...')

      // EINEN einzigen summarize Call mit by=apikey UND Zeitraum für alle Daten
      const summaryData = await usageService.getUsageSummaryByApiKey(
        convertToIsoString(currentFilter.value.fromDate),
        convertToIsoString(currentFilter.value.toDate),
      )

      console.log('🔍 [USE-USAGE] Summary data received:', summaryData)
      console.log('🔍 [USE-USAGE] Usage array length:', summaryData.data?.length || 0)

      // Extrahiere Aggregation aus den API-Key-Daten
      if (summaryData.data && summaryData.data.length > 0) {
        // Berechne Aggregation aus den API-Key-Daten
        const totalRequests = summaryData.data.reduce((sum: number, item: any) => sum + (item.requests || 0), 0)
        const totalTokensIn = summaryData.data.reduce(
          (sum: number, item: any) => sum + readTokensFromItem(item).requestTokens,
          0,
        )
        const totalTokensOut = summaryData.data.reduce(
          (sum: number, item: any) => sum + readTokensFromItem(item).responseTokens,
          0,
        )
        const totalTokens = totalTokensIn + totalTokensOut

        // Berechne Kosten für jedes Item
        const costs = await Promise.all(
          summaryData.data.map(async (item: any) => {
            const { calculateCost } = await import('@/config/pricing')
            const { requestTokens, responseTokens } = readTokensFromItem(item)
            return calculateCost(
              requestTokens,
              responseTokens,
              item.model || 'gpt-4o',
              false,
              item.type || 'CompletionModelUsage',
            ).finalCost
          }),
        )
        const totalCost = costs.reduce((sum, cost) => sum + cost, 0)

        // Erstelle Aggregation
        usageAggregation.value = {
          totalRequests,
          totalTokensIn,
          totalTokensOut,
          totalTokens,
          totalCost,
          uniqueUsers: new Set(summaryData.data.map((item: any) => item.technicalUserId)).size,
          uniqueModels: new Set(summaryData.data.map((item: any) => item.model)).size,
          averageRequestsPerUser:
            totalRequests /
            Math.max(new Set(summaryData.data.map((item: any) => item.technicalUserId)).size, 1),
          averageTokensPerRequest: totalTokens / Math.max(totalRequests, 1),
          averageCostPerRequest: totalCost / Math.max(totalRequests, 1),
        }

        // Konvertiere zu EnhancedUsageRecord für Progress Bars
        const enhancedData = await Promise.all(
          summaryData.data.map(async (item: SummaryUsage) => {
            const { calculateCost } = await import('@/config/pricing')
            const { requestTokens, responseTokens } = readTokensFromItem(
              item as unknown as Record<string, unknown>,
            )
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
              modelType: item.type || 'CompletionModelUsage',
              type: item.type,
              requests: item.requests || 0,
              tokensIn: requestTokens,
              tokensOut: responseTokens,
              totalTokens: item.totalTokens ?? requestTokens + responseTokens,
              cost: costResult.finalCost,
              tag: item.tag || 'production',
              day: item.day,
              month: item.month,
              year: item.year,
              createDate: undefined,
              apiKeyId: item.apiKeyId ?? (item as { api_key_id?: string }).api_key_id,
            }
          }),
        )

        detailedUsageData.value = enhancedData
        console.log('🔍 [FRONTEND] API Key data loaded:', enhancedData.length, 'records')
        console.log(
          '🔍 [USE-USAGE] Enhanced data apiKeyIds:',
          enhancedData.map((item) => item.apiKeyId),
        )
      } else {
        // Fallback: Leere Daten
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
        detailedUsageData.value = []
      }

      // Leere Arrays für normale Benutzer
      userUsageSummary.value = []
      modelUsageSummary.value = []

      debugLog('Usage summary loaded successfully:', {
        aggregation: usageAggregation.value,
        apiKeyDataLength: detailedUsageData.value.length,
      })
      console.log('✅ [FRONTEND] Usage summary loaded')
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden der Nutzungsdaten'
      debugLog('Error loading usage summary:', err)
      console.error('❌ [FRONTEND] Error loading usage summary:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Separate Funktion für detaillierte Daten (nur bei Bedarf)
  const loadDetailedUsageData = async (filter?: UsageFilter) => {
    // Nur laden wenn wirklich benötigt (z.B. für detaillierte Tabelle)
    if (detailedUsageData.value.length > 0) {
      return // Bereits geladen
    }

    isLoading.value = true
    error.value = null

    try {
      if (filter) {
        currentFilter.value = { ...filter }
      }

      debugLog('Loading detailed usage data with filter:', currentFilter.value)
      console.log('🔍 [FRONTEND] Loading detailed usage data...')

      // Prüfe ob Admin-Berechtigung vorhanden ist
      const hasAdminPermission = await import('@/auth/keycloak').then((m) =>
        m.hasPermission('canUseAdminFeatures'),
      )

      debugLog('Has admin permission:', hasAdminPermission)
      console.log('🔍 [FRONTEND] Admin permission:', hasAdminPermission)

      let response: EnhancedUsageRecord[]

      if (hasAdminPermission) {
        // Admin: Alle Daten laden
        response = await usageAnalyticsService.getDetailedUsageData(
          convertToIsoString(currentFilter.value.fromDate),
          convertToIsoString(currentFilter.value.toDate),
          true, // useAdminApi = true für Admin
        )
      } else {
        // Normaler User: Nur eigene Daten laden
        response = await usageAnalyticsService.getDetailedUsageData(
          convertToIsoString(currentFilter.value.fromDate),
          convertToIsoString(currentFilter.value.toDate),
          false, // useAdminApi = false für normale Benutzer
        )
      }

      detailedUsageData.value = response

      debugLog('Detailed usage data loaded successfully:', response.length, 'records')
      console.log('✅ [FRONTEND] Detailed usage data loaded:', response.length, 'records')
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden der Nutzungsdaten'
      debugLog('Error loading detailed usage data:', err)
      console.error('❌ [FRONTEND] Error loading detailed usage data:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Neue Funktion: Lade Usage-Daten nach API Key gruppiert (für Progress Bar)
  const loadUsageDataByApiKey = async (fromDate?: string, toDate?: string) => {
    isLoading.value = true
    error.value = null

    try {
      console.log('🔍 [FRONTEND] Loading usage data by API Key...')

      // Lade gruppierte Daten aus der Summarize API
      const { usageService } = await import('@/services/apiService')
      const summaryResponse = await usageService.getUsageSummaryByApiKey(fromDate, toDate)

      console.log('🔍 [FRONTEND] Summary response:', summaryResponse)

      if (summaryResponse.data && summaryResponse.data.length > 0) {
        // Konvertiere SummaryUsage zu EnhancedUsageRecord für Kompatibilität
        const enhancedData = await Promise.all(
          summaryResponse.data.map(async (item: SummaryUsage) => {
            // Berechne Kosten über pricing.ts
            const { calculateCost } = await import('@/config/pricing')
            const costResult = calculateCost(
              item.requestTokens || 0, // tokensIn
              item.responseTokens || 0, // tokensOut
              item.model || 'gpt-4o', // modelName
              false, // useCachedInput
              item.type || 'CompletionModelUsage', // modelType
            )

            return {
              technicalUserId: item.technicalUserId || 'unknown',
              technicalUserName: `User ${item.technicalUserId || 'unknown'}`,
              modelName: item.model || 'unknown',
              modelType: item.type || 'CompletionModelUsage',
              type: item.type,
              requests: item.requests || 0,
              tokensIn: item.requestTokens || 0,
              tokensOut: item.responseTokens || 0,
              totalTokens: item.totalTokens || 0,
              cost: costResult.finalCost, // Verwende berechnete Kosten
              tag: item.tag || 'production',
              day: item.day,
              month: item.month,
              year: item.year,
              createDate: undefined, // Nicht verfügbar in Summary
              apiKeyId: item.apiKeyId,
            }
          }),
        )

        detailedUsageData.value = enhancedData
        console.log('🔍 [FRONTEND] Enhanced data from summary:', enhancedData)
      } else {
        detailedUsageData.value = []
        console.log('🔍 [FRONTEND] No usage data found in summary')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Laden der API Key Usage-Daten'
      console.error('🔍 [FRONTEND] Error loading API Key usage data:', err)
      detailedUsageData.value = []
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
    loadUsageSummary,
    loadDetailedUsageData,
    exportUsageData,
    updateFilter,
  }
}
