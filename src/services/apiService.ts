import { getAdmin } from '@/api/admin/admin'
import type {
  AdminUsageAISummaryGetV1Params,
  AIUsagePage,
  AIUsageSummaryPage,
  AIRequestParamsUsageTypeParameter,
  PaginationInfo,
  UsageAIGetV1Params,
  UsageAISummaryGetV1Params,
} from '@/api/types'
import { getUsage } from '@/api/usage/usage'
import { hasPermission } from '@/auth/keycloak'
import { api } from '@/axios/api'
import { getDataArray } from '@/services/usageApiService'
import type { ApiKeyDisplay, SummaryUsage, SummaryUsagePageResponse } from '@/types/frontend'
import { debugLog, isDebugLogEnabled } from '@/utils/debugLog'

/**
 * Nur Client: mehrere parallele Requests mit je `usageType` (nicht in OpenAPI);
 * Antworten werden zusammengeführt.
 */
export type SummarizeByApiKeyClientExtra = {
  usageTypes?: readonly AIRequestParamsUsageTypeParameter[]
}

/** Orval `AdminUsageAISummaryGetV1Params` + optional `usageTypes` für Client-Merge. */
export type AdminUsageAISummaryByApiKeyParams = AdminUsageAISummaryGetV1Params &
  SummarizeByApiKeyClientExtra

/** Orval `UsageAISummaryGetV1Params` + optional `usageTypes` für Client-Merge. */
export type UsageAISummaryByApiKeyParams = UsageAISummaryGetV1Params & SummarizeByApiKeyClientExtra

/**
 * Query-Parameter für summarize?by=apiKeyId – je nach Rolle Admin- oder User-Orval-Typ.
 * Datumswerte kommen weiterhin als 1./2. Argument; im Request überschreiben sie `from_date`/`to_date` aus `params`.
 */
export type SummarizeByApiKeyParams =
  | AdminUsageAISummaryByApiKeyParams
  | UsageAISummaryByApiKeyParams

/** Default-Pagination wenn Backend keine liefert (vermeidet "undefined is not assignable to type Page") */
const defaultPage: PaginationInfo = {
  total: 0,
  totalPages: 0,
  page: 1,
  limit: 20,
}

/**
 * Summarize-Antwort normalisieren: Backend liefert oft `items` statt `data`, Pagination fehlt optional.
 * Orval-Typ heißt weiterhin AIUsageSummaryPage; im UI-Alias: SummaryUsagePageResponse.
 */
function normalizeSummaryPageBody(body: unknown): SummaryUsagePageResponse {
  const data = getDataArray<SummaryUsage>(body)
  const pagination =
    body && typeof body === 'object' && !Array.isArray(body) && 'pagination' in body
      ? ((body as { pagination?: PaginationInfo }).pagination ?? defaultPage)
      : defaultPage
  return { data, pagination }
}

function buildAdminSummarizeByApiKeyParams(
  fromDate: string | undefined,
  toDate: string | undefined,
  params?: Partial<AdminUsageAISummaryByApiKeyParams>,
): AdminUsageAISummaryGetV1Params {
  const { usageTypes: _usageTypes, ...rest } = params ?? {}
  return {
    ...rest,
    by: ['apiKeyId'] as unknown as AdminUsageAISummaryGetV1Params['by'],
    from_date: toIsoDateTime(fromDate),
    to_date: toIsoDateTimeEndOfDay(toDate),
  }
}

function buildUserSummarizeByApiKeyParams(
  fromDate: string | undefined,
  toDate: string | undefined,
  params?: Partial<UsageAISummaryByApiKeyParams>,
): UsageAISummaryGetV1Params {
  const { usageTypes: _usageTypes, ...rest } = params ?? {}
  return {
    ...rest,
    by: ['apiKeyId'] as unknown as UsageAISummaryGetV1Params['by'],
    from_date: toIsoDateTime(fromDate),
    to_date: toIsoDateTimeEndOfDay(toDate),
  }
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
  // Parse das Datum (funktioniert sowohl für "2026-02-20" als auch "2026-02-20T00:00:00.000Z")
  const date = new Date(s)
  // Setze immer auf Ende des Tages (23:59:59.999 UTC) für Overfetching
  // Verwende setUTCHours statt setHours, damit die Zeit in UTC gesetzt wird (nicht lokale Zeitzone)
  date.setUTCHours(23, 59, 59, 999)
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

    // Admins dürfen alle Keys verwalten → Admin-Endpunkt nutzen
    if (hasPermission('canUseAdminFeatures')) {
      await getAdmin().adminApikeysDeactivatePutV1(keyId)
      return
    }

    // Normale Nutzer deaktivieren ihre eigenen Keys über den User-Endpunkt
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

    const response = await api.get('/v1/admin/apikeys')
    return response.data as ApiKeyDisplay[]
  },
}

// Usage-Service für Verbrauchsdaten (Orval-generierte Usage/Admin-APIs)
export const usageService = {
  // Eigene Usage-Daten abrufen
  async getOwnUsage(fromDate?: string, toDate?: string): Promise<AIUsagePage> {
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

  // Usage-Summary nach API Key gruppiert abrufen (by=apiKeyId; Filter wie Orval-Params + optional usageTypes)
  async getUsageSummaryByApiKey(
    fromDate?: string,
    toDate?: string,
    params?: Partial<SummarizeByApiKeyParams>,
  ): Promise<SummaryUsagePageResponse> {
    try {
      debugLog('🔍 [API-SERVICE] getUsageSummaryByApiKey called with:', {
        fromDate,
        toDate,
        params,
      })

      const useAdminSummarize = hasPermission('canUseAdminFeatures')
      if (!useAdminSummarize && !hasPermission('canSeeOwnUsage')) {
        debugLog('🔍 [API-SERVICE] Keine Berechtigung zum Anzeigen von Usage-Daten')
        return { data: [], pagination: defaultPage }
      }

      const adminParams: Partial<AdminUsageAISummaryByApiKeyParams> | undefined = useAdminSummarize
        ? (params as Partial<AdminUsageAISummaryByApiKeyParams> | undefined)
        : undefined
      const userParams: Partial<UsageAISummaryByApiKeyParams> | undefined = !useAdminSummarize
        ? (params as Partial<UsageAISummaryByApiKeyParams> | undefined)
        : undefined

      const fetchOnce = async (
        usageType?: AIRequestParamsUsageTypeParameter,
      ): Promise<SummaryUsagePageResponse> => {
        if (useAdminSummarize) {
          const req: AdminUsageAISummaryGetV1Params = {
            ...buildAdminSummarizeByApiKeyParams(fromDate, toDate, adminParams),
            ...(usageType ? { usageType } : {}),
          }
          debugLog('🔍 [API-SERVICE] Calling adminUsageAISummaryGetV1 by=apiKeyId', req)
          const response = await getAdmin().adminUsageAISummaryGetV1(req)
          const body = response.data
          debugLog('🔍 [API-SERVICE] API response (grouped by apiKeyId):', body)

          if (isDebugLogEnabled()) {
            const rawData = getDataArray<SummaryUsage>(body)
            debugLog('🔍 [API-SERVICE] Rohe Summary-Records (erste 3):', {
              'Anzahl Records': rawData.length,
              'Erste 3 Records': rawData.slice(0, 3).map((r: SummaryUsage) => ({
                'Alle Keys': Object.keys(r),
                apiKeyId: r.apiKeyId,
                'Komplettes Record': r,
              })),
            })
          }

          return normalizeSummaryPageBody(body)
        }

        const req: UsageAISummaryGetV1Params = {
          ...buildUserSummarizeByApiKeyParams(fromDate, toDate, userParams),
          ...(usageType ? { usageType } : {}),
        }
        debugLog('🔍 [API-SERVICE] Calling usageAISummaryGetV1 by=apiKeyId', req)
        const response = await getUsage().usageAISummaryGetV1(req)
        const body = response.data
        debugLog('🔍 [API-SERVICE] API response (grouped by apiKeyId):', body)

        if (isDebugLogEnabled()) {
          const rawData = getDataArray<SummaryUsage>(body)
          debugLog('🔍 [API-SERVICE] Rohe Summary-Records (erste 3):', {
            'Anzahl Records': rawData.length,
            'Erste 3 Records': rawData.slice(0, 3).map((r: SummaryUsage) => ({
              'Alle Keys': Object.keys(r),
              apiKeyId: r.apiKeyId,
              'Komplettes Record': r,
            })),
          })
        }

        return normalizeSummaryPageBody(body)
      }

      const types = params?.usageTypes?.filter(Boolean)
      if (types && types.length > 0) {
        const pages = await Promise.all(types.map((t) => fetchOnce(t)))
        const mergedData = pages.flatMap((p) => p.data ?? [])
        debugLog('🔍 [API-SERVICE] summarize usageType merge:', {
          requests: types.length,
          mergedRows: mergedData.length,
        })
        return {
          data: mergedData,
          pagination: {
            total: mergedData.length,
            totalPages: 1,
            page: 1,
            limit: mergedData.length,
          },
        }
      }

      return fetchOnce()
    } catch (error) {
      debugLog('🔍 [API-SERVICE] Fehler beim Laden der Usage-Summary nach API Key:', error)
      return { data: [], pagination: defaultPage }
    }
  },

  // Usage-Summary für einen bestimmten Benutzer (Admin, ohne groupBy)
  async getUsageSummaryByUser(
    userId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<SummaryUsage[]> {
    try {
      debugLog('🔍 [API-SERVICE] getUsageSummaryByUser called with:', { userId, fromDate, toDate })

      if (!hasPermission('canUseAdminFeatures')) {
        debugLog('🔍 [API-SERVICE] Keine Admin-Berechtigung für getUsageSummaryByUser')
        return []
      }

      const params: AdminUsageAISummaryGetV1Params = { userId }
      if (fromDate) params.from_date = toIsoDateTime(fromDate)
      if (toDate) params.to_date = toIsoDateTimeEndOfDay(toDate)

      const response = await getAdmin().adminUsageAISummaryGetV1(params)
      const body = response.data
      const data = getDataArray<SummaryUsage>(body)

      debugLog('🔍 [API-SERVICE] getUsageSummaryByUser response:', {
        userId,
        count: data.length,
      })

      return data
    } catch (error) {
      debugLog('🔍 [API-SERVICE] Fehler bei getUsageSummaryByUser:', error)
      return []
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
