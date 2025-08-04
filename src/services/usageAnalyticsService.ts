import type {
  EnhancedUsageRecord,
  ModelUsageSummary,
  UsageAggregation,
  UserUsageSummary,
} from '@/api/types/types'
import { ModelUsageType } from '@/api/types/types'
import { calculateCost } from '@/config/pricing'
import { usageService } from './apiService'

// Frontend-Service für erweiterte Usage-Analytics-Funktionen
// Diese Funktionen implementieren die Filterungslogik im Frontend
export const usageAnalyticsService = {
  // Erweiterte Funktionen für detaillierte Nutzungsübersicht
  async getDetailedUsageData(
    fromDate?: string,
    toDate?: string,
    modelType?: ModelUsageType,
    technicalUserId?: string,
  ): Promise<EnhancedUsageRecord[]> {
    try {
      // Verwende Admin-Summary für detaillierte Daten
      const summary = await usageService.getAdminUsageSummary(fromDate, toDate)

      if (!summary.usage) return []

      let filteredUsage = summary.usage

      // Filter nach Modell-Typ
      if (modelType) {
        filteredUsage = filteredUsage.filter((item) => item.type === modelType)
      }

      // Filter nach Benutzer
      if (technicalUserId) {
        filteredUsage = filteredUsage.filter((item) => item.technicalUSerid === technicalUserId)
      }

      return filteredUsage.map((item, index) => {
        const costCalculation = calculateCost(
          item.tokensIn || 0,
          item.tokensOut || 0,
          item.model || 'unknown',
        )

        return {
          technicalUserId: item.technicalUSerid || `user-${index}`,
          technicalUserName: item.technicalUSerid || `Benutzer ${index + 1}`,
          modelName: item.model || 'Unbekanntes Modell',
          modelType: item.type || ModelUsageType.CompletionModelUsage,
          requests: item.requests || 0,
          tokensIn: item.tokensIn || 0,
          tokensOut: item.tokensOut || 0,
          totalTokens: item.totalTokens || 0,
          cost: costCalculation.finalCost,
          tag: item.tag,
          day: item.day,
          month: item.month,
          year: item.year,
        }
      })
    } catch (error) {
      console.warn('Keine Admin-Berechtigung für detaillierte Nutzungsdaten:', error)
      return []
    }
  },

  async getUsageAggregation(fromDate?: string, toDate?: string): Promise<UsageAggregation> {
    try {
      const summary = await usageService.getAdminUsageSummary(fromDate, toDate)

      if (!summary.usage) {
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

      const uniqueUsers = new Set(summary.usage.map((item) => item.technicalUSerid)).size
      const uniqueModels = new Set(summary.usage.map((item) => item.model)).size
      const totalRequests = summary.usage.reduce((sum, item) => sum + (item.requests || 0), 0)
      const totalTokensIn = summary.usage.reduce((sum, item) => sum + (item.tokensIn || 0), 0)
      const totalTokensOut = summary.usage.reduce((sum, item) => sum + (item.tokensOut || 0), 0)
      const totalTokens = summary.usage.reduce((sum, item) => sum + (item.totalTokens || 0), 0)

      // Berechne Gesamtkosten
      const totalCost = summary.usage.reduce((sum, item) => {
        const costCalculation = calculateCost(
          item.tokensIn || 0,
          item.tokensOut || 0,
          item.model || 'unknown',
        )
        return sum + costCalculation.finalCost
      }, 0)

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
    } catch (error) {
      console.warn('Keine Admin-Berechtigung für Nutzungsaggregation:', error)
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
  },

  async getUserUsageSummary(fromDate?: string, toDate?: string): Promise<UserUsageSummary[]> {
    try {
      const detailedData = await this.getDetailedUsageData(fromDate, toDate)

      const userMap = new Map<string, UserUsageSummary>()

      detailedData.forEach((item) => {
        if (!userMap.has(item.technicalUserId)) {
          userMap.set(item.technicalUserId, {
            technicalUserId: item.technicalUserId,
            technicalUserName: item.technicalUserName,
            totalRequests: 0,
            totalTokensIn: 0,
            totalTokensOut: 0,
            totalTokens: 0,
            totalCost: 0,
            modelBreakdown: {},
          })
        }

        const user = userMap.get(item.technicalUserId)!
        user.totalRequests += item.requests
        user.totalTokensIn += item.tokensIn
        user.totalTokensOut += item.tokensOut
        user.totalTokens += item.totalTokens
        user.totalCost += item.cost

        if (!user.modelBreakdown[item.modelName]) {
          user.modelBreakdown[item.modelName] = {
            requests: 0,
            tokensIn: 0,
            tokensOut: 0,
            totalTokens: 0,
            cost: 0,
            tag: item.tag,
          }
        }
        user.modelBreakdown[item.modelName].requests += item.requests
        user.modelBreakdown[item.modelName].tokensIn += item.tokensIn
        user.modelBreakdown[item.modelName].tokensOut += item.tokensOut
        user.modelBreakdown[item.modelName].totalTokens += item.totalTokens
        user.modelBreakdown[item.modelName].cost += item.cost
      })

      return Array.from(userMap.values())
    } catch (error) {
      console.warn('Keine Admin-Berechtigung für Benutzer-Nutzungszusammenfassung:', error)
      return []
    }
  },

  async getModelUsageSummary(fromDate?: string, toDate?: string): Promise<ModelUsageSummary[]> {
    try {
      const detailedData = await this.getDetailedUsageData(fromDate, toDate)

      const modelMap = new Map<string, ModelUsageSummary>()

      detailedData.forEach((item) => {
        if (!modelMap.has(item.modelName)) {
          modelMap.set(item.modelName, {
            modelName: item.modelName,
            modelType: item.modelType,
            totalRequests: 0,
            totalTokensIn: 0,
            totalTokensOut: 0,
            totalTokens: 0,
            totalCost: 0,
            userBreakdown: {},
          })
        }

        const model = modelMap.get(item.modelName)!
        model.totalRequests += item.requests
        model.totalTokensIn += item.tokensIn
        model.totalTokensOut += item.tokensOut
        model.totalTokens += item.totalTokens
        model.totalCost += item.cost

        if (!model.userBreakdown[item.technicalUserId]) {
          model.userBreakdown[item.technicalUserId] = {
            requests: 0,
            tokensIn: 0,
            tokensOut: 0,
            totalTokens: 0,
            cost: 0,
            tag: item.tag,
          }
        }
        model.userBreakdown[item.technicalUserId].requests += item.requests
        model.userBreakdown[item.technicalUserId].tokensIn += item.tokensIn
        model.userBreakdown[item.technicalUserId].tokensOut += item.tokensOut
        model.userBreakdown[item.technicalUserId].totalTokens += item.totalTokens
        model.userBreakdown[item.technicalUserId].cost += item.cost
      })

      return Array.from(modelMap.values())
    } catch (error) {
      console.warn('Keine Admin-Berechtigung für Modell-Nutzungszusammenfassung:', error)
      return []
    }
  },

  // Hilfsfunktionen für Frontend-Filterung
  filterUsageByModel(usageData: any[], modelName?: string) {
    if (!modelName) return usageData
    return usageData.filter((item) => item.model === modelName)
  },

  filterUsageByUser(usageData: any[], userId?: string) {
    if (!userId) return usageData
    return usageData.filter((item) => item.technicalUSerid === userId)
  },

  filterUsageByDateRange(usageData: any[], fromDate?: string, toDate?: string) {
    if (!fromDate && !toDate) return usageData

    return usageData.filter((item) => {
      const itemDate = new Date(item.timestamp || item.day || Date.now())
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(toDate) : null

      if (from && itemDate < from) return false
      if (to && itemDate > to) return false
      return true
    })
  },

  // Gruppierung nach verschiedenen Kriterien
  groupUsageByUser(usageData: any[]) {
    const userMap = new Map()

    usageData.forEach((item) => {
      const userId = item.technicalUSerid || 'unknown'
      if (!userMap.has(userId)) {
        userMap.set(userId, [])
      }
      userMap.get(userId).push(item)
    })

    return userMap
  },

  groupUsageByModel(usageData: any[]) {
    const modelMap = new Map()

    usageData.forEach((item) => {
      const modelName = item.model || 'unknown'
      if (!modelMap.has(modelName)) {
        modelMap.set(modelName, [])
      }
      modelMap.get(modelName).push(item)
    })

    return modelMap
  },

  groupUsageByDate(usageData: any[], groupBy: 'day' | 'month' | 'year' = 'day') {
    const dateMap = new Map()

    usageData.forEach((item) => {
      const date = new Date(item.timestamp || item.day || Date.now())
      let key: string

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'year':
          key = date.getFullYear().toString()
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      if (!dateMap.has(key)) {
        dateMap.set(key, [])
      }
      dateMap.get(key).push(item)
    })

    return dateMap
  },
}

export default usageAnalyticsService
