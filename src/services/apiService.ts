import apikeysApi from '@/api/apikeys/apikeys'
import type {
  MobaRagApiKey,
  MobaRagApiKeyRequest,
  MobaRagApiKeyWithSecret,
  SummaryUsageResponse,
  UsageResponse,
} from '@/api/types/types'
import {
  adminUsageAISummaryGetV1,
  usageAIGetV1,
  usageAISummaryGetV1,
  type AdminUsageAISummaryGetV1Params,
  type UsageAIGetV1Params,
  type UsageAISummaryGetV1Params,
} from '@/api/usage/usage'
import { hasPermission } from '@/auth/keycloak'

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

// Usage-Service für Verbrauchsdaten - nur die drei tatsächlich existierenden Endpunkte
export const usageService = {
  // Eigene Usage-Daten abrufen
  async getOwnUsage(fromDate?: string, toDate?: string): Promise<UsageResponse> {
    try {
      console.log('🔍 [API-SERVICE] getOwnUsage called with:', { fromDate, toDate })

      // Prüfe Berechtigung
      if (!hasPermission('canViewOwnUsage')) {
        console.warn('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { to_date: 0, usage: [] }
      }

      const params: UsageAIGetV1Params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate

      console.log('🔍 [API-SERVICE] Calling usageAIGetV1 with params:', params)
      const response = await usageAIGetV1(params)
      console.log('🔍 [API-SERVICE] API response:', response.data)

      return response.data
    } catch (error) {
      console.warn('🔍 [API-SERVICE] Fehler beim Laden der eigenen Usage-Daten:', error)
      return { to_date: 0, usage: [] }
    }
  },

  // Usage-Summary abrufen
  async getUsageSummary(fromDate?: string, toDate?: string): Promise<SummaryUsageResponse> {
    try {
      console.log('🔍 [API-SERVICE] getUsageSummary called with:', { fromDate, toDate })

      // Prüfe Berechtigung
      if (!hasPermission('canViewOwnUsage')) {
        console.warn('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { usage: [] }
      }

      const params: UsageAISummaryGetV1Params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate

      console.log('🔍 [API-SERVICE] Calling usageAISummaryGetV1 with params:', params)
      const response = await usageAISummaryGetV1(params)
      console.log('🔍 [API-SERVICE] API response:', response.data)

      return response.data
    } catch (error) {
      console.warn('🔍 [API-SERVICE] Fehler beim Laden der Usage-Summary:', error)
      return { usage: [] }
    }
  },

  // Usage-Summary mit Gruppierung abrufen
  //
  // WICHTIG: Die 'by' Parameter bestimmen, welche Felder im Response befüllt werden:
  // - by: 'day'           → nur day wird befüllt, month und year sind null
  // - by: 'week'          → nur week wird befüllt, day/month/year sind null
  // - by: 'month'         → nur month wird befüllt, day/year sind null
  // - by: 'apikey'        → nur apikey wird befüllt, day/month/year sind null
  // - by: ['day', 'month', 'year'] → day, month und year werden befüllt
  // - by: ['month', 'year', 'tag'] → month, year und tag werden befüllt
  // usw.
  async getUsageSummaryWithGrouping(
    by:
      | 'day'
      | 'week'
      | 'month'
      | 'user'
      | 'model'
      | 'apikey'
      | 'tag'
      | ('day' | 'week' | 'month' | 'user' | 'model' | 'apikey' | 'tag')[],
    fromDate?: string,
    toDate?: string,
    model?: string,
  ): Promise<SummaryUsageResponse> {
    try {
      console.log('🔍 [API-SERVICE] getUsageSummaryWithGrouping called with:', {
        by,
        fromDate,
        toDate,
        model,
      })

      // Prüfe Berechtigung
      if (!hasPermission('canViewOwnUsage')) {
        console.warn('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { usage: [] }
      }

      const params: UsageAISummaryGetV1Params = {
        by: by,
      }
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      if (model) params.model = model

      console.log('🔍 [API-SERVICE] Calling usageAISummaryGetV1 with grouping params:', params)
      const response = await usageAISummaryGetV1(params)
      console.log('🔍 [API-SERVICE] API response (grouped by', by, '):', response.data)

      return response.data
    } catch (error) {
      console.warn('🔍 [API-SERVICE] Fehler beim Laden der Usage-Summary mit Gruppierung:', error)
      return { usage: [] }
    }
  },

  // Admin: Usage-Summary mit Gruppierung für alle Benutzer
  async getAdminUsageSummaryWithGrouping(
    by:
      | 'day'
      | 'week'
      | 'month'
      | 'user'
      | 'model'
      | 'apikey'
      | 'tag'
      | ('day' | 'week' | 'month' | 'user' | 'model' | 'apikey' | 'tag')[],
    fromDate?: string,
    toDate?: string,
    model?: string,
    technicalUserId?: string,
  ): Promise<SummaryUsageResponse> {
    try {
      // Prüfe Admin-Berechtigung
      if (!hasPermission('canViewAdminUsage')) {
        console.warn('Keine Admin-Berechtigung zum Anzeigen der Admin-Usage-Summary')
        return { usage: [] }
      }

      const params: AdminUsageAISummaryGetV1Params = {
        by: by,
      }
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      if (model) params.model = model
      if (technicalUserId) params.technicalUserId = technicalUserId

      console.log('🔍 [API-SERVICE] Calling adminUsageAISummaryGetV1 with grouping params:', params)
      const response = await adminUsageAISummaryGetV1(params)
      console.log('🔍 [API-SERVICE] Admin API response (grouped by', by, '):', response.data)

      return response.data
    } catch (error) {
      console.warn(
        '🔍 [API-SERVICE] Fehler beim Laden der Admin-Usage-Summary mit Gruppierung:',
        error,
      )
      return { usage: [] }
    }
  },

  // Usage-Summary nach API Key gruppiert abrufen (für Progress Bar)
  async getUsageSummaryByApiKey(fromDate?: string, toDate?: string): Promise<SummaryUsageResponse> {
    try {
      console.log('🔍 [API-SERVICE] getUsageSummaryByApiKey called with:', { fromDate, toDate })

      // Prüfe Berechtigung
      if (!hasPermission('canViewOwnUsage')) {
        console.warn('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { usage: [] }
      }

      const params: UsageAISummaryGetV1Params = {
        by: 'apikey', // Gruppiere nach API Key
      }
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate

      console.log('🔍 [API-SERVICE] Calling usageAISummaryGetV1 with by=apikey params:', params)
      const response = await usageAISummaryGetV1(params)
      console.log('🔍 [API-SERVICE] API response (grouped by apiKey):', response.data)

      return response.data
    } catch (error) {
      console.warn('🔍 [API-SERVICE] Fehler beim Laden der Usage-Summary nach API Key:', error)
      return { usage: [] }
    }
  },

  // Admin: Usage-Summary für alle Benutzer
  async getAdminUsageSummary(fromDate?: string, toDate?: string): Promise<SummaryUsageResponse> {
    try {
      // Prüfe Admin-Berechtigung
      if (!hasPermission('canViewAdminUsage')) {
        console.warn('Keine Admin-Berechtigung zum Anzeigen der Admin-Usage-Summary')
        return { usage: [] }
      }

      const params: AdminUsageAISummaryGetV1Params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate

      const response = await adminUsageAISummaryGetV1(params)
      return response.data
    } catch (error) {
      console.warn('Fehler beim Laden der Admin-Usage-Summary:', error)
      return { usage: [] }
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
