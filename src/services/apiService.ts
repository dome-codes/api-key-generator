import apikeysApi from '@/api/apikeys/apikeys'
import type {
  EnhancedUsageRecord,
  MobaRagApiKey,
  MobaRagApiKeyRequest,
  MobaRagApiKeyWithSecret,
  ModelUsageSummary,
  SummaryUsageResponse,
  UsageAggregation,
  UsageResponse,
  UserUsageSummary,
} from '@/api/types/types'
import { ModelUsageType } from '@/api/types/types'
import {
  adminUsageAISummaryGetV1,
  usageAIGetV1,
  usageAISummaryGetV1,
  type AdminUsageAISummaryGetV1Params,
  type UsageAIGetV1Params,
  type UsageAISummaryGetV1Params,
} from '@/api/usage/usage'
import { hasPermission } from '@/auth/keycloak'
import { calculateCost } from '@/config/pricing'

// API-Service für API-Keys
export const apiKeyService = {
  // Alle API-Keys abrufen (rollenbasiert)
  async getApiKeys(): Promise<MobaRagApiKey[]> {
    // Prüfe Berechtigung
    if (!hasPermission('canViewOwnKeys')) {
      throw new Error('Keine Berechtigung zum Anzeigen von API-Keys')
    }

    const response = await apikeysApi.getAllApiKeysV1()
    return response.data
  },

  // Neuen API-Key erstellen (rollenbasiert)
  async createApiKey(name: string, permissions: string[]): Promise<MobaRagApiKeyWithSecret> {
    // Prüfe Berechtigung
    if (!hasPermission('canCreateKeys')) {
      throw new Error('Keine Berechtigung zum Erstellen von API-Keys')
    }

    const request: MobaRagApiKeyRequest = { name, permissions }
    const response = await apikeysApi.createApiKeyV1(request)
    return response.data
  },

  // API-Key deaktivieren (rollenbasiert)
  async deactivateApiKey(keyId: string): Promise<void> {
    // Prüfe Berechtigung
    if (!hasPermission('canDeactivateOwnKeys')) {
      throw new Error('Keine Berechtigung zum Deaktivieren von API-Keys')
    }

    await apikeysApi.deactivateKeyV1(keyId)
  },

  // API-Key rotieren (rollenbasiert)
  async rotateApiKey(
    keyId: string,
    name: string,
    permissions: string[],
  ): Promise<MobaRagApiKeyWithSecret> {
    // Prüfe Berechtigung
    if (!hasPermission('canEditOwnKeys')) {
      throw new Error('Keine Berechtigung zum Bearbeiten von API-Keys')
    }

    const request: MobaRagApiKeyRequest = { name, permissions }
    const response = await apikeysApi.rotateKeyV1(keyId, request)
    return response.data
  },

  // Einzelnen API-Key abrufen
  async getApiKey(keyId: string): Promise<MobaRagApiKey> {
    // Prüfe Berechtigung
    if (!hasPermission('canViewOwnKeys')) {
      throw new Error('Keine Berechtigung zum Anzeigen von API-Keys')
    }

    const response = await apikeysApi.getApiKeyV1(keyId)
    return response.data
  },

  // Admin: Alle API-Keys aller Benutzer abrufen (gleiche Funktion wie getApiKeys, da alle Benutzer alle Keys sehen)
  async getAllApiKeys(): Promise<MobaRagApiKey[]> {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canViewAdminUsage')) {
      throw new Error('Keine Admin-Berechtigung zum Anzeigen aller API-Keys')
    }

    const response = await apikeysApi.getAllApiKeysV1()
    return response.data
  },
}

// Usage-Service für Verbrauchsdaten
export const usageService = {
  // Eigene Usage-Daten abrufen
  async getOwnUsage(fromDate?: string, toDate?: string, model?: string): Promise<UsageResponse> {
    // Prüfe Berechtigung
    if (!hasPermission('canViewOwnUsage')) {
      throw new Error('Keine Berechtigung zum Anzeigen von Usage-Daten')
    }

    const params: UsageAIGetV1Params = {}
    if (fromDate) params.from_date = fromDate
    if (toDate) params.to_date = toDate
    if (model) params.model = model

    const response = await usageAIGetV1(params)
    return response.data
  },

  // Usage-Summary abrufen
  async getUsageSummary(
    fromDate?: string,
    toDate?: string,
    by?: string,
  ): Promise<SummaryUsageResponse> {
    // Prüfe Berechtigung
    if (!hasPermission('canViewOwnUsage')) {
      throw new Error('Keine Berechtigung zum Anzeigen von Usage-Daten')
    }

    const params: UsageAISummaryGetV1Params = {}
    if (fromDate) params.from_date = fromDate
    if (toDate) params.to_date = toDate
    if (by) params.by = by

    const response = await usageAISummaryGetV1(params)
    return response.data
  },

  // Admin: Usage-Summary für alle Benutzer
  async getAdminUsageSummary(
    fromDate?: string,
    toDate?: string,
    by?: string,
    model?: string,
    technicalUserId?: string,
  ): Promise<SummaryUsageResponse> {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canViewAdminUsage')) {
      throw new Error('Keine Admin-Berechtigung zum Anzeigen der Admin-Usage-Summary')
    }

    const params: AdminUsageAISummaryGetV1Params = {}
    if (fromDate) params.from_date = fromDate
    if (toDate) params.to_date = toDate
    if (by) params.by = by
    if (model) params.model = model
    if (technicalUserId) params.technicalUserId = technicalUserId

    const response = await adminUsageAISummaryGetV1(params)
    return response.data
  },

  // Erweiterte Funktionen für detaillierte Nutzungsübersicht
  async getDetailedUsageData(
    fromDate?: string,
    toDate?: string,
    modelType?: ModelUsageType,
    technicalUserId?: string,
  ): Promise<EnhancedUsageRecord[]> {
    try {
      // Verwende Admin-Summary für detaillierte Daten
      const params: AdminUsageAISummaryGetV1Params = {
        by: 'user',
      }
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      if (modelType) params.model = modelType
      if (technicalUserId) params.technicalUserId = technicalUserId

      const summary = await this.getAdminUsageSummary(
        params.from_date,
        params.to_date,
        params.by,
        params.model,
        params.technicalUserId,
      )

      if (!summary.usage) return []

      return summary.usage.map((item, index) => {
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
      const summary = await this.getAdminUsageSummary(fromDate, toDate, 'user')

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
}

// User-Management-Service (nur für API-Admins)
export const userService = {
  // Alle Benutzer abrufen
  async getAllUsers() {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canManageUsers')) {
      throw new Error('Keine Admin-Berechtigung zum Anzeigen aller Benutzer')
    }

    // TODO: Implementiere User-API-Endpunkte wenn verfügbar
    throw new Error('User-Management-API noch nicht implementiert')
  },

  // Benutzer-Rolle ändern
  async updateUserRole(userId: string, role: string) {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canManageUsers')) {
      throw new Error('Keine Admin-Berechtigung zum Ändern von Benutzer-Rollen')
    }

    // TODO: Implementiere User-API-Endpunkte wenn verfügbar
    throw new Error('User-Management-API noch nicht implementiert')
  },

  // Benutzer deaktivieren
  async deactivateUser(userId: string) {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canManageUsers')) {
      throw new Error('Keine Admin-Berechtigung zum Deaktivieren von Benutzern')
    }

    // TODO: Implementiere User-API-Endpunkte wenn verfügbar
    throw new Error('User-Management-API noch nicht implementiert')
  },
}

export default apiKeyService
