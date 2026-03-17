import type { AIUsageRecord, AIUsageSummaryRecord } from '@/api/types'
import { ModelUsageType as ModelUsageTypeEnum } from '@/api/types/modelUsageType'
import { calculateCompletionCostDetailed, calculateCost } from '@/config/pricing'
import {
  type EnhancedUsageRecord,
  type ImageModelUsage,
  type ModelUsageSummary,
  type ModelUsageType,
  type UsageAggregation,
  type UserUsageSummary,
  CompletionModelUsageType as CompletionModelUsageTypeEnum,
  EmbeddingModelUsageType as EmbeddingModelUsageTypeEnum,
  ImageModelUsageType as ImageModelUsageTypeEnum,
} from '@/types/frontend'
import { debugLog } from '@/utils/debugLog'
import { usageService } from './apiService'

/** Aliase für Usage-Records (kommen aus API; andere OpenAPI kann andere Typen generieren) */
type ModelUsage = AIUsageRecord
type SummaryUsage = AIUsageSummaryRecord

// Frontend-Service für erweiterte Usage-Analytics-Funktionen
// Diese Funktionen implementieren die Filterungslogik im Frontend
export const usageAnalyticsService = {
  // Hilfsfunktion um Token-Informationen basierend auf ModelUsageType zu bestimmen
  getTokenInfo(item: {
    type?: ModelUsageType
    requests?: number
    model?: string
    tag: string
    requestTokens?: number
    responseTokens?: number
  }): { requestTokens: number; responseTokens: number } {
    let requestTokens = 0
    let responseTokens = 0

    // Versuche Token-Informationen aus den bestehenden Properties zu extrahieren
    if (item.requestTokens !== undefined) {
      requestTokens = item.requestTokens
    }

    if (item.responseTokens !== undefined) {
      responseTokens = item.responseTokens
    }

    // Falls keine Token-Informationen verfügbar sind, versuche basierend auf dem Typ zu schätzen
    if (requestTokens === 0 && responseTokens === 0) {
      const requests = item.requests || 0
      const typeValue = item.type as string | undefined

      if (
        typeValue === CompletionModelUsageTypeEnum.CompletionModelUsage ||
        typeValue === ModelUsageTypeEnum.CompletionModelUsage ||
        typeValue === 'CompletionModelUsage'
      ) {
        // Für Completion Models können wir keine genauen Token-Zahlen schätzen
        // aber wir können basierend auf requests eine grobe Schätzung machen
        if (requests && requests > 0) {
          // Grobe Schätzung: durchschnittlich 1000 tokens pro request
          requestTokens = requests * 1000
          responseTokens = requests * 500
        }
      } else if (
        typeValue === EmbeddingModelUsageTypeEnum.EmbeddingModelUsage ||
        typeValue === ModelUsageTypeEnum.EmbeddingModelUsage ||
        typeValue === 'EmbeddingModelUsage'
      ) {
        // Für Embedding Models haben wir nur requestTokens
        if (requests && requests > 0) {
          // Grobe Schätzung: durchschnittlich 1000 tokens pro request
          requestTokens = requests * 1000
          responseTokens = 0
        }
      } else {
        // Image Models und unbekannte Modelltypen haben keine Token-Informationen
        requestTokens = 0
        responseTokens = 0
      }
    }

    return { requestTokens, responseTokens }
  },

  // Erweiterte Funktionen für detaillierte Nutzungsübersicht
  async getDetailedUsageData(
    fromDate?: string,
    toDate?: string,
    useAdminApi: boolean = false,
  ): Promise<EnhancedUsageRecord[]> {
    try {
      let usageData: (SummaryUsage | ModelUsage)[] = []

      if (useAdminApi) {
        // Verwende Admin API nur wenn explizit gewünscht
        try {
          const summary = await usageService.getAdminUsageSummary(fromDate, toDate)
          debugLog('Admin summary loaded:', summary)
          usageData = summary.data || []
        } catch (adminError) {
          debugLog('Admin summary failed, trying regular summary:', adminError)
          const summary = await usageService.getUsageSummary(fromDate, toDate)
          debugLog('Regular summary loaded:', summary)
          usageData = summary.data || []
        }
      } else {
        try {
          const detailedResponse = await usageService.getOwnUsage(fromDate, toDate)
          debugLog('Detailed usage data loaded:', detailedResponse)
          usageData = detailedResponse.data || []
        } catch (detailedError) {
          debugLog('Detailed usage failed, trying summary:', detailedError)
          const summary = await usageService.getUsageSummary(fromDate, toDate)
          debugLog('Regular summary loaded:', summary)
          usageData = summary.data || []
        }
      }

      if (!usageData || usageData.length === 0) {
        debugLog('No usage data found')
        return []
      }

      debugLog('Filtered usage data:', usageData)

      // Berechne Token-Informationen und Requests für die Charts
      const enhancedData = usageData.map((item) => {
        // Extrahiere Token-Informationen je nach Modelltyp
        let requestTokens = 0
        let responseTokens = 0

        const typeValue = item.type as string | undefined
        if (
          typeValue === ModelUsageTypeEnum.CompletionModelUsage ||
          typeValue === CompletionModelUsageTypeEnum.CompletionModelUsage ||
          typeValue === 'CompletionModelUsage'
        ) {
          const completionItem = item as ModelUsage & {
            requestTokens?: number
            responseTokens?: number
          }
          requestTokens = completionItem.requestTokens || 0
          responseTokens = completionItem.responseTokens || 0
        } else if (
          typeValue === ModelUsageTypeEnum.EmbeddingModelUsage ||
          typeValue === EmbeddingModelUsageTypeEnum.EmbeddingModelUsage ||
          typeValue === 'EmbeddingModelUsage'
        ) {
          const embeddingItem = item as ModelUsage & { requestTokens?: number }
          requestTokens = embeddingItem.requestTokens || 0
          responseTokens = 0
        } else if (
          typeValue === ModelUsageTypeEnum.ImageModelUsage ||
          typeValue === ImageModelUsageTypeEnum.ImageModelUsage ||
          typeValue === 'ImageModelUsage' ||
          !typeValue
        ) {
          // Image Models und unbekannte Modelltypen haben keine Token-Informationen
          requestTokens = 0
          responseTokens = 0
        }

        // Berechne Kosten für dieses Item
        const isCompletion =
          typeValue === ModelUsageTypeEnum.CompletionModelUsage ||
          typeValue === CompletionModelUsageTypeEnum.CompletionModelUsage ||
          typeValue === 'CompletionModelUsage'

        const costCalculation = isCompletion
          ? calculateCompletionCostDetailed({
              modelName: item.model || 'unknown',
              inputTokens: requestTokens,
              cachedInputTokens: 0,
              outputTokens: responseTokens,
              reasoningTokens: 0,
            })
          : calculateCost(
              requestTokens,
              responseTokens,
              item.model || 'unknown',
              false, // useCachedInput
              item.type, // modelType
              (item as ModelUsage & { quality?: string }).quality, // imageQuality (für Image-Modelle)
              1, // imageCount: Jedes Objekt repräsentiert einen Request
              (item as ModelUsage & { sizeWidth?: number }).sizeWidth, // sizeWidth (für Image-Modelle)
              (item as ModelUsage & { sizeHeight?: number }).sizeHeight, // sizeHeight (für Image-Modelle)
            )

        return {
          ...item,
          // Mappe die Daten korrekt zu EnhancedUsageRecord
          userId:
            (item as ModelUsage & { userId?: string }).userId ||
            (item as ModelUsage & { technicalUSerid?: string }).technicalUSerid ||
            'unknown',
          userName: (item as ModelUsage & { userName?: string }).userName || 'Unknown User',
          modelName: item.model || 'unknown',
          modelType: (item.type ||
            CompletionModelUsageTypeEnum.CompletionModelUsage) as ModelUsageType, // Verwende den type als modelType
          requests: 'requests' in item ? (item as SummaryUsage).requests || 0 : 0,
          tokensIn: requestTokens,
          tokensOut: responseTokens,
          totalTokens: requestTokens + responseTokens,
          cost: costCalculation.finalCost,
          tag: item.tag || 'production',
          day: (item as ModelUsage & { day?: number }).day,
          month: (item as ModelUsage & { month?: number }).month,
          year: (item as ModelUsage & { year?: number }).year,
          createDate:
            'createDate' in item
              ? (item as ModelUsage & { createDate?: string }).createDate
              : undefined,
          apiKeyId: (item as ModelUsage & { apiKeyId?: string }).apiKeyId || undefined,
        }
      })

      return enhancedData
    } catch (error) {
      debugLog('Error in getDetailedUsageData:', error)
      return []
    }
  },

  async getUsageAggregation(
    fromDate?: string,
    toDate?: string,
    useAdminApi: boolean = false,
  ): Promise<UsageAggregation> {
    try {
      let summary: Awaited<ReturnType<typeof usageService.getUsageSummary>>

      if (useAdminApi) {
        // Verwende Admin API nur wenn explizit gewünscht
        try {
          summary = await usageService.getAdminUsageSummary(fromDate, toDate)
          debugLog('Admin summary for aggregation loaded:', summary)
        } catch (adminError) {
          debugLog('Admin summary for aggregation failed, trying regular summary:', adminError)
          // Fallback: Verwende normale Usage-Summary
          summary = await usageService.getUsageSummary(fromDate, toDate)
          debugLog('Regular summary for aggregation loaded:', summary)
        }
      } else {
        // Verwende normale API für normale Benutzer
        try {
          summary = await usageService.getUsageSummary(fromDate, toDate)
          debugLog('Regular summary for aggregation loaded:', summary)
        } catch (regularError) {
          debugLog(
            'Regular summary for aggregation failed, trying admin summary as fallback:',
            regularError,
          )
          // Fallback: Versuche Admin API
          try {
            summary = await usageService.getAdminUsageSummary(fromDate, toDate)
            debugLog('Admin summary for aggregation loaded as fallback:', summary)
          } catch (adminError) {
            debugLog('Both APIs failed for aggregation:', adminError)
            return {
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
          }
        }
      }

      if (!summary.data || summary.data.length === 0) {
        debugLog('No usage data found for aggregation')
        return {
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
      }

      const uniqueUsers = new Set(
        summary.data.map(
          (item) =>
            (item as SummaryUsage).userId || (item as { technicalUSerid?: string }).technicalUSerid,
        ),
      ).size
      const uniqueModels = new Set(summary.data.map((item: SummaryUsage) => item.model)).size
      const totalRequests = summary.data.reduce(
        (sum: number, item: SummaryUsage) => sum + (item.requests || 0),
        0,
      )

      // Berechne Token-Informationen basierend auf den einzelnen Items
      let totalTokensIn = 0
      let totalTokensOut = 0
      let totalTokens = 0

      summary.data.forEach((item: SummaryUsage) => {
        // Extrahiere Token-Informationen je nach Modelltyp
        let requestTokens = 0
        let responseTokens = 0

        const typeValue = item.type as string | undefined
        if (
          typeValue === ModelUsageTypeEnum.CompletionModelUsage ||
          typeValue === CompletionModelUsageTypeEnum.CompletionModelUsage ||
          typeValue === 'CompletionModelUsage'
        ) {
          const completionItem = item as ModelUsage & {
            requestTokens?: number
            responseTokens?: number
          }
          requestTokens = completionItem.requestTokens || 0
          responseTokens = completionItem.responseTokens || 0
        } else if (
          typeValue === ModelUsageTypeEnum.EmbeddingModelUsage ||
          typeValue === EmbeddingModelUsageTypeEnum.EmbeddingModelUsage ||
          typeValue === 'EmbeddingModelUsage'
        ) {
          const embeddingItem = item as ModelUsage & { requestTokens?: number }
          requestTokens = embeddingItem.requestTokens || 0
          responseTokens = 0
        } else if (
          typeValue === ModelUsageTypeEnum.ImageModelUsage ||
          typeValue === ImageModelUsageTypeEnum.ImageModelUsage ||
          typeValue === 'ImageModelUsage' ||
          !typeValue
        ) {
          // Image Models und unbekannte Modelltypen haben keine Token-Informationen
          requestTokens = 0
          responseTokens = 0
        }

        totalTokensIn += requestTokens
        totalTokensOut += responseTokens
        totalTokens += requestTokens + responseTokens
      })

      // Berechne Gesamtkosten
      const totalCost = summary.data.reduce((sum: number, item: SummaryUsage) => {
        // Extrahiere Token-Informationen je nach Modelltyp
        let requestTokens = 0
        let responseTokens = 0

        const typeValue = item.type as string | undefined
        if (
          typeValue === ModelUsageTypeEnum.CompletionModelUsage ||
          typeValue === CompletionModelUsageTypeEnum.CompletionModelUsage ||
          typeValue === 'CompletionModelUsage'
        ) {
          const completionItem = item as ModelUsage & {
            requestTokens?: number
            responseTokens?: number
          }
          requestTokens = completionItem.requestTokens || 0
          responseTokens = completionItem.responseTokens || 0
        } else if (
          typeValue === ModelUsageTypeEnum.EmbeddingModelUsage ||
          typeValue === EmbeddingModelUsageTypeEnum.EmbeddingModelUsage ||
          typeValue === 'EmbeddingModelUsage'
        ) {
          const embeddingItem = item as ModelUsage & { requestTokens?: number }
          requestTokens = embeddingItem.requestTokens || 0
          responseTokens = 0
        } else if (
          typeValue === ModelUsageTypeEnum.ImageModelUsage ||
          typeValue === ImageModelUsageTypeEnum.ImageModelUsage ||
          typeValue === 'ImageModelUsage' ||
          !typeValue
        ) {
          // Image Models und unbekannte Modelltypen haben keine Token-Informationen
          requestTokens = 0
          responseTokens = 0
        }

        const costCalculation = calculateCost(
          requestTokens,
          responseTokens,
          item.model || 'unknown',
          false, // useCachedInput
          item.type, // modelType
          (item as ImageModelUsage).quality, // imageQuality (für Image-Modelle) - optional
          (item as SummaryUsage).requests, // imageCount (für Image-Modelle)
          (item as ImageModelUsage).sizeWidth, // sizeWidth (für Image-Modelle)
          (item as ImageModelUsage).sizeHeight, // sizeHeight (für Image-Modelle)
        )
        return sum + costCalculation.finalCost
      }, 0)

      const aggregation = {
        totalRequests,
        totalTokensIn,
        totalTokensOut,
        totalTokens,
        totalCost,
        totalCachedTokens: 0,
        totalReasoningTokens: 0,
        hasFallbackPricing: false,
        uniqueUsers,
        uniqueModels,
        averageRequestsPerUser: uniqueUsers > 0 ? totalRequests / uniqueUsers : 0,
        averageTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0,
        averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      }

      debugLog('Usage aggregation calculated:', aggregation)
      return aggregation
    } catch (error) {
      debugLog('Fehler beim Laden der Nutzungsaggregation:', error)
      return {
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
    }
  },

  async getUserUsageSummary(fromDate?: string, toDate?: string): Promise<UserUsageSummary[]> {
    try {
      const detailedData = await this.getDetailedUsageData(fromDate, toDate)

      const userMap = new Map<string, UserUsageSummary>()

      detailedData.forEach((item) => {
        const userId = item.userId || 'unknown'
        const requests = 1 // Jedes Objekt repräsentiert einen Request
        const modelName = item.modelName || 'Unknown'
        const tag = item.tag || ''

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            userName:
              userId || `Benutzer ${detailedData.findIndex((i) => i.userId === userId) + 1}`,
            totalRequests: 0,
            totalTokensIn: 0,
            totalTokensOut: 0,
            totalTokens: 0,
            totalCost: 0,
            modelBreakdown: {},
          })
        }

        const user = userMap.get(userId)
        if (user) {
          user.totalRequests += requests

          if (!user.modelBreakdown[modelName]) {
            user.modelBreakdown[modelName] = {
              requests: 0,
              tokensIn: 0,
              tokensOut: 0,
              totalTokens: 0,
              cost: 0,
              tag,
            }
          }
          user.modelBreakdown[modelName].requests += requests
        }
      })

      return Array.from(userMap.values())
    } catch (error) {
      debugLog('Keine Admin-Berechtigung für Benutzer-Nutzungszusammenfassung:', error)
      return []
    }
  },

  async getModelUsageSummary(fromDate?: string, toDate?: string): Promise<ModelUsageSummary[]> {
    try {
      const detailedData = await this.getDetailedUsageData(fromDate, toDate)

      const modelMap = new Map<string, ModelUsageSummary>()

      detailedData.forEach((item) => {
        const modelName = item.modelName || 'Unknown'
        const modelType = (item.modelType ||
          CompletionModelUsageTypeEnum.CompletionModelUsage) as ModelUsageType
        const requests = 1 // Jedes Objekt repräsentiert einen Request
        const userId = item.userId || 'unknown'
        const tag = item.tag || ''

        if (!modelMap.has(modelName)) {
          modelMap.set(modelName, {
            modelName,
            modelType: modelType as ModelUsageType,
            totalRequests: 0,
            totalTokensIn: 0,
            totalTokensOut: 0,
            totalTokens: 0,
            totalCost: 0,
            userBreakdown: {},
          })
        }

        const model = modelMap.get(modelName)
        if (model) {
          model.totalRequests += requests

          if (!model.userBreakdown[userId]) {
            model.userBreakdown[userId] = {
              requests: 0,
              tokensIn: 0,
              tokensOut: 0,
              totalTokens: 0,
              cost: 0,
              tag,
            }
          }
          model.userBreakdown[userId].requests += requests
        }
      })

      return Array.from(modelMap.values())
    } catch (error) {
      debugLog('Keine Admin-Berechtigung für Modell-Nutzungszusammenfassung:', error)
      return []
    }
  },

  // Hilfsfunktionen für Frontend-Filterung
  filterUsageByModel(usageData: (SummaryUsage | ModelUsage)[], modelName?: string) {
    if (!modelName) return usageData
    return usageData.filter((item) => item.model === modelName)
  },

  filterUsageByUser(usageData: (SummaryUsage | ModelUsage)[], userId?: string) {
    if (!userId) return usageData
    return usageData.filter((item) => {
      const itemUserId =
        (item as SummaryUsage).userId || (item as { technicalUSerid?: string }).technicalUSerid
      return itemUserId === userId
    })
  },

  filterUsageByDateRange(
    usageData: (SummaryUsage | ModelUsage)[],
    fromDate?: string,
    toDate?: string,
  ) {
    if (!fromDate && !toDate) return usageData

    return usageData.filter((item) => {
      const itemDate = new Date(
        (item as { timestamp?: number }).timestamp || (item as { day?: number }).day || Date.now(),
      )
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(toDate) : null

      if (from && itemDate < from) return false
      if (to && itemDate > to) return false
      return true
    })
  },

  // Gruppierung nach verschiedenen Kriterien
  groupUsageByUser(usageData: (SummaryUsage | ModelUsage)[]) {
    const userMap = new Map<string, (SummaryUsage | ModelUsage)[]>()

    usageData.forEach((item) => {
      const userId =
        (item as SummaryUsage).userId ||
        (item as { technicalUSerid?: string }).technicalUSerid ||
        'unknown'
      if (!userMap.has(userId)) {
        userMap.set(userId, [])
      }
      const userArray = userMap.get(userId)
      if (userArray) {
        userArray.push(item)
      }
    })

    return userMap
  },

  groupUsageByModel(usageData: (SummaryUsage | ModelUsage)[]) {
    const modelMap = new Map<string, (SummaryUsage | ModelUsage)[]>()

    usageData.forEach((item) => {
      const modelName = item.model || 'unknown'
      if (!modelMap.has(modelName)) {
        modelMap.set(modelName, [])
      }
      const modelArray = modelMap.get(modelName)
      if (modelArray) {
        modelArray.push(item)
      }
    })

    return modelMap
  },

  groupUsageByDate(
    usageData: (SummaryUsage | ModelUsage)[],
    groupBy: 'day' | 'month' | 'year' = 'day',
  ) {
    const dateMap = new Map<string, (SummaryUsage | ModelUsage)[]>()

    usageData.forEach((item) => {
      const date = new Date(
        (item as { timestamp?: number }).timestamp || (item as { day?: number }).day || Date.now(),
      )
      let key: string

      switch (groupBy) {
        case 'day':
          key = date.toISOString()
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'year':
          key = date.getFullYear().toString()
          break
        default:
          key = date.toISOString()
      }

      if (!dateMap.has(key)) {
        dateMap.set(key, [])
      }
      const dateArray = dateMap.get(key)
      if (dateArray) {
        dateArray.push(item)
      }
    })

    return dateMap
  },
}

export default usageAnalyticsService
