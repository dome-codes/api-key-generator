import { getAdmin } from '@/api/admin/admin'
import type {
  AdminUsageAISummaryGetV1Params,
  AIUsagePage,
  AIUsageSummaryPage,
  UsageAIGetV1Params,
  UsageAISummaryGetV1Params,
} from '@/api/types'
import { getUsage } from '@/api/usage/usage'
import { api } from '@/axios/api'
import { hasPermission } from '@/auth/keycloak'

// API-Service für API-Keys
export const apiKeyService = {
  // Alle API-Keys abrufen (rollenbasiert)
  async getApiKeys(): Promise<any[]> {
    // Prüfe Berechtigung
    if (!hasPermission('canViewOwnKeys')) {
      throw new Error('Keine Berechtigung zum Anzeigen von API-Keys')
    }

    // Verwende Admin-Endpunkt wenn Admin-Berechtigung vorhanden
    if (hasPermission('canViewAdminUsage')) {
      const response = await api.get('/admin/apikeys')
      return response.data as any[]
    }

    const response = await api.get('/apikeys')
    return response.data as any[]
  },

  // Neuen API-Key erstellen (rollenbasiert)
  async createApiKey(name: string, permissions: string[]): Promise<any> {
    // Prüfe Berechtigung
    if (!hasPermission('canCreateKeys')) {
      throw new Error('Keine Berechtigung zum Erstellen von API-Keys')
    }

    const request = { name, permissions }
    const response = await api.post('/apikeys', request)
    return response.data as any
  },

  // API-Key deaktivieren (rollenbasiert)
  async deactivateApiKey(keyId: string): Promise<void> {
    // Prüfe Berechtigung
    if (!hasPermission('canDeactivateOwnKeys')) {
      throw new Error('Keine Berechtigung zum Deaktivieren von API-Keys')
    }

    await api.delete(`/apikeys/${keyId}/deactivate`)
  },

  // API-Key rotieren (rollenbasiert)
  async rotateApiKey(
    keyId: string,
    name: string,
    permissions: string[],
  ): Promise<any> {
    // Prüfe Berechtigung
    if (!hasPermission('canEditOwnKeys')) {
      throw new Error('Keine Berechtigung zum Bearbeiten von API-Keys')
    }

    const request = { name, permissions }
    const response = await api.post(`/apikeys/${keyId}/rotate`, request)
    return response.data as any
  },

  // Einzelnen API-Key abrufen
  async getApiKey(keyId: string): Promise<any> {
    // Prüfe Berechtigung
    if (!hasPermission('canViewOwnKeys')) {
      throw new Error('Keine Berechtigung zum Anzeigen von API-Keys')
    }

    const response = await api.get(`/apikeys/${keyId}`)
    return response.data as any
  },

  // Admin: Alle API-Keys aller Benutzer abrufen (gleiche Funktion wie getApiKeys, da alle Benutzer alle Keys sehen)
  async getAllApiKeys(): Promise<any[]> {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canViewAdminUsage')) {
      throw new Error('Keine Admin-Berechtigung zum Anzeigen aller API-Keys')
    }

    const response = await api.get('/apikeys')
    return response.data as any[]
  },
}

// Usage-Service für Verbrauchsdaten (Orval-generierte Usage/Admin-APIs)
export const usageService = {
  // Eigene Usage-Daten abrufen
  async getOwnUsage(fromDate?: string, toDate?: string): Promise<AIUsagePage> {
    try {
      console.log('🔍 [API-SERVICE] getOwnUsage called with:', { fromDate, toDate })

      if (!hasPermission('canViewOwnUsage')) {
        console.warn('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { data: [], pagination: undefined }
      }

      const params: UsageAIGetV1Params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate

      console.log('🔍 [API-SERVICE] Calling usageAIGetV1 with params:', params)
      const response = await getUsage().usageAIGetV1(params)
      console.log('🔍 [API-SERVICE] API response:', response.data)

      return response.data ?? { data: [], pagination: undefined }
    } catch (error) {
      console.warn('🔍 [API-SERVICE] Fehler beim Laden der eigenen Usage-Daten:', error)
      return { data: [], pagination: undefined }
    }
  },

  // Usage-Summary abrufen
  async getUsageSummary(fromDate?: string, toDate?: string): Promise<AIUsageSummaryPage> {
    try {
      console.log('🔍 [API-SERVICE] getUsageSummary called with:', { fromDate, toDate })

      if (!hasPermission('canViewOwnUsage')) {
        console.warn('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { data: [], pagination: undefined }
      }

      const params: UsageAISummaryGetV1Params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate

      console.log('🔍 [API-SERVICE] Calling usageAISummaryGetV1 with params:', params)
      const response = await getUsage().usageAISummaryGetV1(params)
      console.log('🔍 [API-SERVICE] API response:', response.data)

      return response.data ?? { data: [], pagination: undefined }
    } catch (error) {
      console.warn('🔍 [API-SERVICE] Fehler beim Laden der Usage-Summary:', error)
      return { data: [], pagination: undefined }
    }
  },

  // Usage-Summary nach API Key gruppiert abrufen (für Progress Bar)
  async getUsageSummaryByApiKey(fromDate?: string, toDate?: string): Promise<AIUsageSummaryPage> {
    try {
      console.log('🔍 [API-SERVICE] getUsageSummaryByApiKey called with:', { fromDate, toDate })

      if (!hasPermission('canViewOwnUsage')) {
        console.warn('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { data: [], pagination: undefined }
      }

      const params: UsageAISummaryGetV1Params = { by: ['apiKey'] }
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate

      console.log('🔍 [API-SERVICE] Calling usageAISummaryGetV1 with by=apiKey params:', params)
      const response = await getUsage().usageAISummaryGetV1(params)
      console.log('🔍 [API-SERVICE] API response (grouped by apiKey):', response.data)

      return response.data ?? { data: [], pagination: undefined }
    } catch (error) {
      console.warn('🔍 [API-SERVICE] Fehler beim Laden der Usage-Summary nach API Key:', error)
      return { data: [], pagination: undefined }
    }
  },

  // Admin: Detaillierte Usage-Daten für alle Benutzer (verwendet Summary-API)
  async getAdminUsage(fromDate?: string, toDate?: string): Promise<AIUsageSummaryPage> {
    try {
      if (!hasPermission('canViewAdminUsage')) {
        console.warn('Keine Admin-Berechtigung zum Anzeigen der Admin-Usage-Daten')
        return { data: [], pagination: undefined }
      }

      const params: AdminUsageAISummaryGetV1Params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate

      const response = await getAdmin().adminUsageAISummaryGetV1(params)
      return response.data ?? { data: [], pagination: undefined }
    } catch (error) {
      console.warn('Fehler beim Laden der Admin-Usage-Daten:', error)
      return { data: [], pagination: undefined }
    }
  },

  // Admin: Usage-Summary für alle Benutzer
  async getAdminUsageSummary(fromDate?: string, toDate?: string): Promise<AIUsageSummaryPage> {
    try {
      if (!hasPermission('canViewAdminUsage')) {
        console.warn('Keine Admin-Berechtigung zum Anzeigen der Admin-Usage-Summary')
        return { data: [], pagination: undefined }
      }

      const params: AdminUsageAISummaryGetV1Params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate

      const response = await getAdmin().adminUsageAISummaryGetV1(params)
      return response.data ?? { data: [], pagination: undefined }
    } catch (error) {
      console.warn('Fehler beim Laden der Admin-Usage-Summary:', error)
      return { data: [], pagination: undefined }
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
