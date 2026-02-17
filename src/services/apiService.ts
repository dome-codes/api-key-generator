import { getAdmin } from '@/api/admin/admin'
import type {
  AdminUsageAISummaryGetV1Params,
  AIUsagePage,
  AIUsageSummaryPage,
  AIUsageSummaryRecord,
  PaginationInfo,
  UsageAIGetV1Params,
  UsageAISummaryGetV1Params,
} from '@/api/types'
import { getUsage } from '@/api/usage/usage'
import { api } from '@/axios/api'
import { hasPermission } from '@/auth/keycloak'
import { getDataArray } from '@/services/usageApiService'

/** Request-Format für Usage AI / Summarize: from_date=2026-01-31T00:00:00.000Z (date-time, unverändert in Query) */
function toIsoDateTime(dateStr: string | undefined): string | undefined {
  if (!dateStr?.trim()) return undefined
  const s = dateStr.trim()
  if (s.includes('T')) return new Date(s).toISOString()
  return `${s}T00:00:00.000Z`
}

// API-Service für API-Keys
export const apiKeyService = {
  // Alle API-Keys abrufen (rollenbasiert)
  async getApiKeys(): Promise<any[]> {
    // Prüfe Berechtigung (canCreateKeys erlaubt auch View)
    if (!hasPermission('canCreateKeys') && !hasPermission('canSeeOwnUsage')) {
      throw new Error('Keine Berechtigung zum Anzeigen von API-Keys')
    }

    // Verwende Admin-Endpunkt wenn Admin-Berechtigung vorhanden
    if (hasPermission('canUseAdminFeatures')) {
      const response = await api.get('/admin/apikeys')
      return response.data as any[]
    }

    const response = await api.get('/apikeys')
    return response.data as any[]
  },

  // Neuen API-Key erstellen (rollenbasiert). Response normalisieren: Backend kann secret, token, api_key, value, key liefern.
  async createApiKey(name: string, permissions: string[]): Promise<any> {
    // Prüfe Berechtigung
    if (!hasPermission('canCreateKeys')) {
      throw new Error('Keine Berechtigung zum Erstellen von API-Keys')
    }

    const request = { name, permissions }
    const response = await api.post('/apikeys', request)
    const data = response.data as Record<string, unknown>
    if (data && typeof data === 'object') {
      const secret =
        (data.secret as string) ??
        (data.token as string) ??
        (data.api_key as string) ??
        (data.apiKey as string) ??
        (data.value as string) ??
        (data.key as string) ??
        ''
      return { ...data, secret }
    }
    return data
  },

  // API-Key deaktivieren (rollenbasiert)
  async deactivateApiKey(keyId: string): Promise<void> {
    // Prüfe Berechtigung
    if (!hasPermission('canCreateKeys')) {
      throw new Error('Keine Berechtigung zum Deaktivieren von API-Keys')
    }

    await api.put(`/apikeys/${keyId}/deactivate`)
  },

  // API-Key rotieren (rollenbasiert)
  async rotateApiKey(
    keyId: string,
    name: string,
    permissions: string[],
  ): Promise<any> {
    // Prüfe Berechtigung
    if (!hasPermission('canCreateKeys')) {
      throw new Error('Keine Berechtigung zum Bearbeiten von API-Keys')
    }

    const request = { name, permissions }
    const response = await api.post(`/apikeys/${keyId}/rotate`, request)
    return response.data as any
  },

  // Einzelnen API-Key abrufen
  async getApiKey(keyId: string): Promise<any> {
    // Prüfe Berechtigung (canCreateKeys erlaubt auch View)
    if (!hasPermission('canCreateKeys') && !hasPermission('canSeeOwnUsage')) {
      throw new Error('Keine Berechtigung zum Anzeigen von API-Keys')
    }

    const response = await api.get(`/apikeys/${keyId}`)
    return response.data as any
  },

  // Admin: Alle API-Keys aller Benutzer abrufen (gleiche Funktion wie getApiKeys, da alle Benutzer alle Keys sehen)
  async getAllApiKeys(): Promise<any[]> {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canUseAdminFeatures')) {
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

      if (!hasPermission('canSeeOwnUsage')) {
        console.warn('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { data: [], pagination: undefined }
      }

      const params: UsageAIGetV1Params = {}
      if (fromDate) params.from_date = toIsoDateTime(fromDate)
      if (toDate) params.to_date = toIsoDateTime(toDate)

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

      if (!hasPermission('canSeeOwnUsage')) {
        console.warn('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { data: [], pagination: undefined }
      }

      const params: UsageAISummaryGetV1Params = {}
      if (fromDate) params.from_date = toIsoDateTime(fromDate)
      if (toDate) params.to_date = toIsoDateTime(toDate)

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

      if (!hasPermission('canSeeOwnUsage')) {
        console.warn('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { data: [], pagination: undefined }
      }

      // Backend: by=apikey (lowercase), from_date/to_date als date-time (ISO)
      const params = {
        by: ['apikey'],
        from_date: toIsoDateTime(fromDate),
        to_date: toIsoDateTime(toDate),
      } as unknown as UsageAISummaryGetV1Params

      console.log('🔍 [API-SERVICE] Calling usageAISummaryGetV1 with by=apikey params:', params)
      const response = await getUsage().usageAISummaryGetV1(params)
      const body = response.data
      console.log('🔍 [API-SERVICE] API response (grouped by apiKey):', body)
      // Backend kann data, items oder usage liefern
      const data = getDataArray<AIUsageSummaryRecord>(body)
      const pagination: PaginationInfo | undefined =
        body && typeof body === 'object' && !Array.isArray(body) && 'pagination' in body
          ? (body as { pagination?: PaginationInfo }).pagination
          : undefined
      return { data, pagination }
    } catch (error) {
      console.warn('🔍 [API-SERVICE] Fehler beim Laden der Usage-Summary nach API Key:', error)
      return { data: [], pagination: undefined }
    }
  },

  // Admin: Detaillierte Usage-Daten für alle Benutzer (verwendet Summary-API)
  async getAdminUsage(fromDate?: string, toDate?: string): Promise<AIUsageSummaryPage> {
    try {
      if (!hasPermission('canUseAdminFeatures')) {
        console.warn('Keine Admin-Berechtigung zum Anzeigen der Admin-Usage-Daten')
        return { data: [], pagination: undefined }
      }

      const params: AdminUsageAISummaryGetV1Params = {}
      if (fromDate) params.from_date = toIsoDateTime(fromDate)
      if (toDate) params.to_date = toIsoDateTime(toDate)

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
      if (!hasPermission('canUseAdminFeatures')) {
        console.warn('Keine Admin-Berechtigung zum Anzeigen der Admin-Usage-Summary')
        return { data: [], pagination: undefined }
      }

      const params: AdminUsageAISummaryGetV1Params = {}
      if (fromDate) params.from_date = toIsoDateTime(fromDate)
      if (toDate) params.to_date = toIsoDateTime(toDate)

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
    if (!hasPermission('canUseAdminFeatures')) {
      throw new Error('Keine Admin-Berechtigung zum Anzeigen aller Benutzer')
    }

    // TODO: Implementiere User-API-Endpunkte wenn verfügbar
    throw new Error('User-Management-API noch nicht implementiert')
  },

  // Benutzer-Rolle ändern
  async updateUserRole(userId: string, role: string) {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canUseAdminFeatures')) {
      throw new Error('Keine Admin-Berechtigung zum Ändern von Benutzer-Rollen')
    }

    // TODO: Implementiere User-API-Endpunkte wenn verfügbar
    throw new Error('User-Management-API noch nicht implementiert')
  },

  // Benutzer deaktivieren
  async deactivateUser(userId: string) {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canUseAdminFeatures')) {
      throw new Error('Keine Admin-Berechtigung zum Deaktivieren von Benutzern')
    }

    // TODO: Implementiere User-API-Endpunkte wenn verfügbar
    throw new Error('User-Management-API noch nicht implementiert')
  },
}

export default apiKeyService
