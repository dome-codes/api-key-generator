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

import {
  type EnhancedUsageRecord,
  type ModelUsageSummary,
  type ModelUsageType,
  type SummaryUsage,
  type UsageAggregation,
  type UsageFilter,
  type UserUsageSummary,
} from '@/types/frontend'

// Fallback für Modelltyp: API nutzt COMPLETION_USAGE, ältere Specs CompletionModelUsage
const DEFAULT_MODEL_USAGE_TYPE = 'COMPLETION_USAGE' as ModelUsageType
import { usageService } from '@/services/apiService'
import { usageAnalyticsService } from '@/services/usageAnalyticsService'
import { readTokensFromItem } from '@/services/usageApiService'
import { computed, ref } from 'vue'

import { debugLog, isDebugLogEnabled } from '@/utils/debugLog'

// Hilfsfunktion um Datumswerte in ISO-Strings zu konvertieren
const convertToIsoString = (dateString?: string): string | undefined => {
  if (!dateString) return undefined

  try {
    // Wenn es bereits ein ISO-String ist, gib ihn zurück
    if (dateString.includes('T')) {
      return dateString
    }

    // Konvertiere YYYY-MM-DD zu ISO-String mit Mitternacht
    const date = new Date(`${dateString}T00:00:00.000Z`)
    return date.toISOString()
  } catch (error) {
    debugLog('Fehler beim Konvertieren des Datums:', dateString, error)
    return dateString
  }
}

/** Standard-Zeitraum für API-Key-Usage: aktueller Monat (damit Backend Daten liefert) */
function defaultUsageDateRange(): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: from.toISOString(), to: now.toISOString() }
}

/** Liest API-Key-ID aus Backend-Item (laut OpenAPI-Spezifikation: apiKeyId) */
function getApiKeyIdFromItem(item: Record<string, unknown>): string | undefined {
  // Laut OpenAPI-Spezifikation heißt das Feld 'apiKeyId' (camelCase)
  const raw = item.apiKeyId as string | undefined
  if (raw == null || raw === '') return undefined
  return String(raw).trim()
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

    if (currentFilter.value.userIds && currentFilter.value.userIds.length > 0) {
      const userIds = currentFilter.value.userIds
      filtered = filtered.filter((item) => userIds.includes(item.userId ?? ''))
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
      debugLog('🔍 [FRONTEND] Loading usage summary...')

      // Zeitraum: Filter oder Standard (aktueller Monat), damit Backend überhaupt Daten liefert
      const fromIso =
        convertToIsoString(currentFilter.value.fromDate) ?? defaultUsageDateRange().from
      const toIso = convertToIsoString(currentFilter.value.toDate) ?? defaultUsageDateRange().to
      const summaryData = await usageService.getUsageSummaryByApiKey(fromIso, toIso)

      debugLog('🔍 [USE-USAGE] Summary data received:', summaryData)
      debugLog('🔍 [USE-USAGE] Usage array length:', summaryData.data?.length || 0)

      // Extrahiere Aggregation aus den API-Key-Daten (ohne undefined-Einträge → verhindert Index-Fehler)
      const validItems = (summaryData.data || []).filter(
        (item: unknown): item is EnhancedUsageRecord => item != null && typeof item === 'object',
      )
      if (validItems.length > 0) {
        // Berechne Aggregation aus den API-Key-Daten
        const totalRequests = validItems.reduce(
          (sum: number, item: EnhancedUsageRecord) =>
            sum + ((item as EnhancedUsageRecord & { requests?: number }).requests || 0),
          0,
        )
        const totalTokensIn = validItems.reduce(
          (sum: number, item: EnhancedUsageRecord) =>
            sum + readTokensFromItem(item as unknown as Record<string, unknown>).requestTokens,
          0,
        )
        const totalTokensOut = validItems.reduce(
          (sum: number, item: EnhancedUsageRecord) =>
            sum + readTokensFromItem(item as unknown as Record<string, unknown>).responseTokens,
          0,
        )
        const totalTokens = totalTokensIn + totalTokensOut

        // Berechne Kosten für jedes Item
        const costs = await Promise.all(
          validItems.map(async (item: EnhancedUsageRecord) => {
            const { calculateCompletionCostDetailed, calculateCost } = await import(
              '@/config/pricing'
            )
            const fromItem = readTokensFromItem(item as unknown as Record<string, unknown>)
            const requestTokens = fromItem.requestTokens || 0
            const baseResponseTokens = fromItem.responseTokens || 0
            const cachedTokens = (item.cachedTokens ?? 0) as number
            const reasoningTokens = (item.reasoningTokens ?? 0) as number

            const typeValue = (item.type || DEFAULT_MODEL_USAGE_TYPE) as string
            const isCompletion =
              typeValue === 'CompletionModelUsage' ||
              typeValue === 'COMPLETION_USAGE' ||
              typeValue === 'completion_usage'

            if (isCompletion) {
              const outputTokensExcludingReasoning = Math.max(0, baseResponseTokens - reasoningTokens)
              return calculateCompletionCostDetailed({
                modelName: item.modelName || 'unknown',
                inputTokens: requestTokens,
                cachedInputTokens: cachedTokens,
                outputTokens: outputTokensExcludingReasoning,
                reasoningTokens,
              }).finalCost
            }

            return calculateCost(
              requestTokens,
              baseResponseTokens,
              item.modelName || 'unknown',
              false,
              item.type || 'COMPLETION_USAGE',
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
          totalCachedTokens: 0,
          totalReasoningTokens: 0,
          hasFallbackPricing: false,
          uniqueUsers: new Set(validItems.map((item: EnhancedUsageRecord) => item.userId))
            .size,
          uniqueModels: new Set(validItems.map((item: EnhancedUsageRecord) => item.modelName)).size,
          averageRequestsPerUser:
            totalRequests /
            Math.max(
              new Set(validItems.map((item: EnhancedUsageRecord) => item.userId)).size,
              1,
            ),
          averageTokensPerRequest: totalTokens / Math.max(totalRequests, 1),
          averageCostPerRequest: totalCost / Math.max(totalRequests, 1),
        }

        // Konvertiere zu EnhancedUsageRecord für Progress Bars (apiKeyId aus allen Backend-Varianten)
        const enhancedData: EnhancedUsageRecord[] = await Promise.all(
          validItems.map(async (item: EnhancedUsageRecord): Promise<EnhancedUsageRecord> => {
            // DEBUG: Zeige rohes Item vor Extraktion
            if (isDebugLogEnabled()) {
              debugLog('[useUsage] Rohes Item vor apiKeyId-Extraktion:', {
                'Item Keys': Object.keys(item),
                'Item komplett': item,
                'item.apiKeyId': item.apiKeyId,
              })
            }

            const { calculateCompletionCostDetailed, calculateCost } = await import(
              '@/config/pricing'
            )
            const fromItem = readTokensFromItem(item as unknown as Record<string, unknown>)
            const requestTokens = fromItem.requestTokens || 0
            const baseResponseTokens = fromItem.responseTokens || 0
            const cachedTokens = (item.cachedTokens ?? 0) as number
            const reasoningTokens = (item.reasoningTokens ?? 0) as number
            const typeValue = (item.type || DEFAULT_MODEL_USAGE_TYPE) as string
            const isCompletion =
              typeValue === 'CompletionModelUsage' ||
              typeValue === 'COMPLETION_USAGE' ||
              typeValue === 'completion_usage'

            const costResult = isCompletion
              ? (() => {
                  const outputTokensExcludingReasoning = Math.max(
                    0,
                    baseResponseTokens - reasoningTokens,
                  )
                  return calculateCompletionCostDetailed({
                  modelName: item.modelName || 'unknown',
                  inputTokens: requestTokens,
                  cachedInputTokens: cachedTokens,
                    outputTokens: outputTokensExcludingReasoning,
                  reasoningTokens,
                  })
                })()
              : calculateCost(
                  requestTokens,
                  baseResponseTokens,
                  item.modelName || 'unknown',
                  false,
                  item.type || 'COMPLETION_USAGE',
                )
            const apiKeyId = getApiKeyIdFromItem(item as unknown as Record<string, unknown>)

            // DEBUG: Zeige Extraktions-Ergebnis
            if (isDebugLogEnabled()) {
              debugLog('[useUsage] apiKeyId nach Extraktion:', {
                'Extrahierte apiKeyId': apiKeyId,
                'War undefined?': apiKeyId === undefined,
              })
            }

            return {
              userId: item.userId || 'unknown',
              userName: `User ${item.userId || 'unknown'}`,
              modelName: item.modelName || 'unknown',
              modelType: (item.type || DEFAULT_MODEL_USAGE_TYPE) as ModelUsageType,
              type: (item.type || DEFAULT_MODEL_USAGE_TYPE) as
                | ModelUsageType
                | undefined,
              requests: item.requests || 0,
              tokensIn: requestTokens,
              tokensOut: baseResponseTokens,
              totalTokens:
                item.totalTokens ?? requestTokens + cachedTokens + baseResponseTokens,
              cachedTokens,
              reasoningTokens,
              cost: costResult.finalCost,
              tag: item.tag || 'production',
              day: item.day,
              month: item.month,
              year: item.year,
              createDate: undefined,
              apiKeyId,
            }
          }),
        )
        detailedUsageData.value = enhancedData.filter(Boolean)
        debugLog('🔍 [FRONTEND] API Key data loaded:', detailedUsageData.value.length, 'records')
        debugLog(
          '🔍 [USE-USAGE] Enhanced data apiKeyIds:',
          detailedUsageData.value.map((item) => item.apiKeyId),
        )
      } else {
        // Fallback: Leere Daten
        usageAggregation.value = {
          totalRequests: 0,
          totalTokensIn: 0,
          totalTokensOut: 0,
          totalTokens: 0,
          totalCost: 0,
          totalCachedTokens: 0,
          totalReasoningTokens: 0,
          hasFallbackPricing: false,
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
      debugLog('✅ [FRONTEND] Usage summary loaded')
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden der Nutzungsdaten'
      debugLog('Error loading usage summary:', err)
      debugLog('❌ [FRONTEND] Error loading usage summary:', err)
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
      debugLog('🔍 [FRONTEND] Loading detailed usage data...')

      // Prüfe ob Admin-Berechtigung vorhanden ist
      const hasAdminPermission = await import('@/auth/keycloak').then((m) =>
        m.hasPermission('canUseAdminFeatures'),
      )

      debugLog('Has admin permission:', hasAdminPermission)
      debugLog('🔍 [FRONTEND] Admin permission:', hasAdminPermission)

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
      debugLog('✅ [FRONTEND] Detailed usage data loaded:', response.length, 'records')

      // DEBUG: Zeige erste Records mit apiKeyId für Mapping-Debugging
      if (isDebugLogEnabled() && response.length > 0) {
        debugLog('[useUsage] Erste 5 detailedUsageData Records (für Mapping-Debug):', {
          'Anzahl Records': response.length,
          'Erste 5 Records': response.slice(0, 5).map((r) => ({
            apiKeyId: r.apiKeyId ?? 'null',
            userId: r.userId ?? 'null',
            cost: r.cost ?? 0,
            tokensIn: r.tokensIn ?? 0,
            tokensOut: r.tokensOut ?? 0,
            requestTokens: (r as EnhancedUsageRecord & { requestTokens?: number }).requestTokens,
            responseTokens: (r as EnhancedUsageRecord & { responseTokens?: number }).responseTokens,
          })),
          'Unique apiKeyIds (erste 10)': [
            ...new Set(response.map((r) => r.apiKeyId).filter(Boolean)),
          ].slice(0, 10),
        })
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden der Nutzungsdaten'
      debugLog('Error loading detailed usage data:', err)
      debugLog('❌ [FRONTEND] Error loading detailed usage data:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Neue Funktion: Lade Usage-Daten nach API Key gruppiert (für Progress Bar)
  const _loadUsageDataByApiKey = async (fromDate?: string, toDate?: string) => {
    isLoading.value = true
    error.value = null

    try {
      debugLog('🔍 [FRONTEND] Loading usage data by API Key...')

      // Lade gruppierte Daten aus der Summarize API
      const { usageService } = await import('@/services/apiService')
      const summaryResponse = await usageService.getUsageSummaryByApiKey(fromDate, toDate)

      debugLog('🔍 [FRONTEND] Summary response:', summaryResponse)

      if (summaryResponse.data && summaryResponse.data.length > 0) {
        // Konvertiere SummaryUsage zu EnhancedUsageRecord für Kompatibilität
        const enhancedData: EnhancedUsageRecord[] = await Promise.all(
          summaryResponse.data.map(async (item: SummaryUsage): Promise<EnhancedUsageRecord> => {
            // Berechne Kosten über pricing.ts
            const { calculateCost } = await import('@/config/pricing')
            const costResult = calculateCost(
              item.requestTokens || 0, // tokensIn
              item.responseTokens || 0, // tokensOut
              item.model || 'unknown', // modelName
              false, // useCachedInput
              item.type || 'COMPLETION_USAGE', // modelType
            )

            return {
              userId: item.userId || 'unknown',
              userName: `User ${item.userId || 'unknown'}`,
              modelName: item.model || 'unknown',
              modelType: (item.type || DEFAULT_MODEL_USAGE_TYPE) as ModelUsageType,
              type: (item.type || DEFAULT_MODEL_USAGE_TYPE) as
                | ModelUsageType
                | undefined,
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
        debugLog('🔍 [FRONTEND] Enhanced data from summary:', enhancedData)
      } else {
        detailedUsageData.value = []
        debugLog('🔍 [FRONTEND] No usage data found in summary')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Laden der API Key Usage-Daten'
      debugLog('🔍 [FRONTEND] Error loading API Key usage data:', err)
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
          'Tokens In',
          'Tokens Out',
          'Reasoning Tokens',
          'Cached Tokens',
          'Kosten (EUR)',
        ]

        const csvContent = [
          headers.join(','),
          ...data.map((item) =>
            [
              item.userId,
              item.userName,
              item.modelName,
              item.modelType,
              item.requests,
              item.tag,
              item.day || '',
              item.month || '',
              item.year || '',
              item.tokensIn ?? '',
              item.tokensOut ?? '',
              (item as EnhancedUsageRecord & { reasoningTokens?: number }).reasoningTokens ?? '',
              (item as EnhancedUsageRecord & { cachedTokens?: number }).cachedTokens ?? '',
              item.cost ?? '',
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
      debugLog('Fehler beim Exportieren:', err)
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
