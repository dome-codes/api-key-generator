import { getAdmin } from '@/api/admin/admin'
import type {
  AdminUsageAISummaryGetV1Params,
  AiUsagePage,
  AIUsageSummaryPage,
  AIUsageSummaryRecord,
  Page,
  UsageAIGetV1Params,
  UsageAISummaryGetV1Params,
} from '@/api/types'
import { getUsage } from '@/api/usage/usage'
import { hasPermission } from '@/auth/keycloak'
import { api } from '@/axios/api'
import { getDataArray } from '@/services/usageApiService'
import type { ApiKeyDisplay } from '@/types/frontend'
import { debugLog, isDebugLogEnabled } from '@/utils/debugLog'

/** Default-Pagination wenn Backend keine liefert (vermeidet "undefined is not assignable to type Page") */
const defaultPage: Page = {
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
  pageSize: 20,
}

/** Request-Format für Usage AI / Summarize: from_date=2026-01-31T00:00:00.000Z (date-time, unverändert in Query) */
function toIsoDateTime(dateStr: string | undefined): string | undefined {
  if (!dateStr?.trim()) return undefined
  const s = dateStr.trim()
  if (s.includes('T')) return new Date(s).toISOString()
  return `${s}T00:00:00.000Z`
}

/** Konvertiert ein Datum zu ISO-DateTime für to_date (Ende des Tages für Overfetching) */
function toIsoDateTimeEndOfDay(dateStr: string | undefined): string | undefined {
  if (!dateStr?.trim()) return undefined
  const s = dateStr.trim()
  if (s.includes('T')) {
    // Wenn bereits DateTime, verwende es direkt (kann bereits Ende des Tages sein)
    return new Date(s).toISOString()
  }
  // Für reine Datums-Strings: Setze auf Ende des Tages (23:59:59) für Overfetching
  // Das stellt sicher, dass alle Daten des Tages enthalten sind
  const date = new Date(s)
  date.setHours(23, 59, 59, 999)
  return date.toISOString()
}

// API-Service für API-Keys
export const apiKeyService = {
  // Alle API-Keys abrufen (rollenbasiert)
  async getApiKeys(): Promise<ApiKeyDisplay[]> {
    // Prüfe Berechtigung (canCreateKeys erlaubt auch View)
    if (!hasPermission('canCreateKeys') && !hasPermission('canSeeOwnUsage')) {
      throw new Error('Keine Berechtigung zum Anzeigen von API-Keys')
    }

    // Verwende Admin-Endpunkt wenn Admin-Berechtigung vorhanden
    if (hasPermission('canUseAdminFeatures')) {
      const response = await api.get('/v1/admin/apikeys')
      return response.data as ApiKeyDisplay[]
    }

    const response = await api.get('/v1/apikeys')
    return response.data as ApiKeyDisplay[]
  },

  // Neuen API-Key erstellen (rollenbasiert). Response normalisieren: Backend kann secret, token, api_key, value, key liefern.
  async createApiKey(
    name: string,
    permissions: string[],
  ): Promise<Record<string, unknown> & { secret: string }> {
    // Prüfe Berechtigung
    if (!hasPermission('canCreateKeys')) {
      throw new Error('Keine Berechtigung zum Erstellen von API-Keys')
    }

    const request = { name, permissions }
    const response = await api.post('/v1/apikeys', request)
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

    await api.put(`/v1/apikeys/${keyId}/deactivate`)
  },

  // API-Key rotieren (rollenbasiert)
  async rotateApiKey(
    keyId: string,
    name: string,
    permissions: string[],
  ): Promise<Record<string, unknown>> {
    // Prüfe Berechtigung
    if (!hasPermission('canCreateKeys')) {
      throw new Error('Keine Berechtigung zum Bearbeiten von API-Keys')
    }

    const request = { name, permissions }
    const response = await api.post(`/v1/apikeys/${keyId}/rotate`, request)
    return response.data as Record<string, unknown>
  },

  // Einzelnen API-Key abrufen
  async getApiKey(keyId: string): Promise<ApiKeyDisplay> {
    // Prüfe Berechtigung (canCreateKeys erlaubt auch View)
    if (!hasPermission('canCreateKeys') && !hasPermission('canSeeOwnUsage')) {
      throw new Error('Keine Berechtigung zum Anzeigen von API-Keys')
    }

    const response = await api.get(`/v1/apikeys/${keyId}`)
    return response.data as ApiKeyDisplay
  },

  // Admin: Alle API-Keys aller Benutzer abrufen (gleiche Funktion wie getApiKeys, da alle Benutzer alle Keys sehen)
  async getAllApiKeys(): Promise<ApiKeyDisplay[]> {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canUseAdminFeatures')) {
      throw new Error('Keine Admin-Berechtigung zum Anzeigen aller API-Keys')
    }

    const response = await api.get('/v1/apikeys')
    return response.data as ApiKeyDisplay[]
  },
}

// Usage-Service für Verbrauchsdaten (Orval-generierte Usage/Admin-APIs)
export const usageService = {
  // Eigene Usage-Daten abrufen
  async getOwnUsage(fromDate?: string, toDate?: string): Promise<AiUsagePage> {
    try {
      debugLog('🔍 [API-SERVICE] getOwnUsage called with:', { fromDate, toDate })

      if (!hasPermission('canSeeOwnUsage')) {
        debugLog('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { data: [], pagination: defaultPage }
      }

      const params: UsageAIGetV1Params = {}
      if (fromDate) params.from_date = toIsoDateTime(fromDate)
      if (toDate) params.to_date = toIsoDateTimeEndOfDay(toDate)

      debugLog('🔍 [API-SERVICE] Calling usageAIGetV1 with params:', params)
      const response = await getUsage().usageAIGetV1(params)
      debugLog('🔍 [API-SERVICE] API response:', response.data)

      return (response.data ?? { data: [], pagination: defaultPage }) as AIUsageSummaryPage
    } catch (error) {
      debugLog('🔍 [API-SERVICE] Fehler beim Laden der eigenen Usage-Daten:', error)
      return { data: [], pagination: defaultPage }
    }
  },

  // Usage-Summary abrufen
  async getUsageSummary(fromDate?: string, toDate?: string): Promise<AIUsageSummaryPage> {
    try {
      debugLog('🔍 [API-SERVICE] getUsageSummary called with:', { fromDate, toDate })

      if (!hasPermission('canSeeOwnUsage')) {
        debugLog('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { data: [], pagination: defaultPage }
      }

      const params: UsageAISummaryGetV1Params = {}
      if (fromDate) params.from_date = toIsoDateTime(fromDate)
      if (toDate) params.to_date = toIsoDateTimeEndOfDay(toDate)

      debugLog('🔍 [API-SERVICE] Calling usageAISummaryGetV1 with params:', params)
      const response = await getUsage().usageAISummaryGetV1(params)
      debugLog('🔍 [API-SERVICE] API response:', response.data)

      if (!response.data) {
        return { data: [], pagination: defaultPage }
      }
      // Type assertion für Kompatibilität mit verschiedenen generierten Typen
      return response.data as AIUsageSummaryPage
    } catch (error) {
      debugLog('🔍 [API-SERVICE] Fehler beim Laden der Usage-Summary:', error)
      return { data: [], pagination: defaultPage }
    }
  },

  // Usage-Summary nach API Key gruppiert abrufen (für Progress Bar)
  async getUsageSummaryByApiKey(fromDate?: string, toDate?: string): Promise<AIUsageSummaryPage> {
    try {
      debugLog('🔍 [API-SERVICE] getUsageSummaryByApiKey called with:', { fromDate, toDate })

      if (!hasPermission('canSeeOwnUsage')) {
        debugLog('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { data: [], pagination: defaultPage }
      }

      // Backend: by=apiKey (camelCase, laut generierten TypeScript-Typen), from_date/to_date als date-time (ISO)
      const params = {
        by: ['apiKey'],
        from_date: toIsoDateTime(fromDate),
        to_date: toIsoDateTimeEndOfDay(toDate),
      } as unknown as UsageAISummaryGetV1Params

      debugLog('🔍 [API-SERVICE] Calling usageAISummaryGetV1 with by=apiKey params:', params)
      const response = await getUsage().usageAISummaryGetV1(params)
      const body = response.data
      debugLog('🔍 [API-SERVICE] API response (grouped by apiKey):', body)

      // DEBUG: Zeige rohe Response-Daten für Troubleshooting
      if (isDebugLogEnabled()) {
        const rawData = getDataArray<AIUsageSummaryRecord>(body)
        debugLog('🔍 [API-SERVICE] Rohe Summary-Records (erste 3):', {
          'Anzahl Records': rawData.length,
          'Erste 3 Records': rawData.slice(0, 3).map((r: AIUsageSummaryRecord) => ({
            'Alle Keys': Object.keys(r),
            apiKeyId: r.apiKeyId,
            'Komplettes Record': r,
          })),
        })
      }

      // Backend kann data, items oder usage liefern
      const data = getDataArray<AIUsageSummaryRecord>(body)
      const pagination: Page =
        body && typeof body === 'object' && !Array.isArray(body) && 'pagination' in body
          ? ((body as { pagination?: Page }).pagination ?? defaultPage)
          : defaultPage
      return { data, pagination }
    } catch (error) {
      debugLog('🔍 [API-SERVICE] Fehler beim Laden der Usage-Summary nach API Key:', error)
      return { data: [], pagination: defaultPage }
    }
  },

  // Admin: Detaillierte Usage-Daten für alle Benutzer (verwendet Summary-API)
  async getAdminUsage(fromDate?: string, toDate?: string): Promise<AIUsageSummaryPage> {
    try {
      if (!hasPermission('canUseAdminFeatures')) {
        debugLog('Keine Admin-Berechtigung zum Anzeigen der Admin-Usage-Daten')
        return { data: [], pagination: defaultPage }
      }

      const params: AdminUsageAISummaryGetV1Params = {}
      if (fromDate) params.from_date = toIsoDateTime(fromDate)
      if (toDate) params.to_date = toIsoDateTimeEndOfDay(toDate)

      const response = await getAdmin().adminUsageAISummaryGetV1(params)
      if (!response.data) {
        return { data: [], pagination: defaultPage }
      }
      // Type assertion für Kompatibilität mit verschiedenen generierten Typen
      return response.data as AIUsageSummaryPage
    } catch (error) {
      debugLog('Fehler beim Laden der Admin-Usage-Daten:', error)
      return { data: [], pagination: defaultPage }
    }
  },

  // Admin: Usage-Summary für alle Benutzer
  async getAdminUsageSummary(fromDate?: string, toDate?: string): Promise<AIUsageSummaryPage> {
    try {
      if (!hasPermission('canUseAdminFeatures')) {
        debugLog('Keine Admin-Berechtigung zum Anzeigen der Admin-Usage-Summary')
        return { data: [], pagination: defaultPage }
      }

      const params: AdminUsageAISummaryGetV1Params = {}
      if (fromDate) params.from_date = toIsoDateTime(fromDate)
      if (toDate) params.to_date = toIsoDateTimeEndOfDay(toDate)

      const response = await getAdmin().adminUsageAISummaryGetV1(params)
      if (!response.data) {
        return { data: [], pagination: defaultPage }
      }
      // Type assertion für Kompatibilität mit verschiedenen generierten Typen
      return response.data as AIUsageSummaryPage
    } catch (error) {
      debugLog('Fehler beim Laden der Admin-Usage-Summary:', error)
      return { data: [], pagination: defaultPage }
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
  async updateUserRole(_userId: string, _role: string) {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canUseAdminFeatures')) {
      throw new Error('Keine Admin-Berechtigung zum Ändern von Benutzer-Rollen')
    }

    // TODO: Implementiere User-API-Endpunkte wenn verfügbar
    throw new Error('User-Management-API noch nicht implementiert')
  },

  // Benutzer deaktivieren
  async deactivateUser(_userId: string) {
    // Prüfe Admin-Berechtigung
    if (!hasPermission('canUseAdminFeatures')) {
      throw new Error('Keine Admin-Berechtigung zum Deaktivieren von Benutzern')
    }

    // TODO: Implementiere User-API-Endpunkte wenn verfügbar
    throw new Error('User-Management-API noch nicht implementiert')
  },
}

export default apiKeyService
