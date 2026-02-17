/**
 * Zentrale Stelle: Mapping von Usage-Summary-Daten (API/OpenAPI) auf Verbrauch pro API-Key.
 * Nutzt OpenAPI-konforme Felder (apiKeyId, requestTokens, responseTokens, cost) und
 * aggregiert pro Key für die API-Key-Liste (ApiKeyTable / ApiKeyRow).
 */

import type { ApiKeyUsageData } from '@/api/types/frontend'
import { debugLog, isDebugLogEnabled } from '@/utils/debugLog'

/**
 * Record mit API-Key-ID und Verbrauchsfeldern.
 * Entspricht EnhancedUsageRecord / AIUsageSummaryRecord (OpenAPI):
 * apiKeyId (oder api_key_id), requestTokens/responseTokens oder tokensIn/tokensOut, cost optional.
 * technicalUserId für Fallback, wenn Backend apiKeyId: null liefert (z. B. bei Aggregation).
 */
export interface UsageRecordForApiKey {
  apiKeyId?: string | null
  api_key_id?: string | null
  technicalUserId?: string
  cost?: number
  tokensIn?: number
  tokensOut?: number
  requestTokens?: number
  responseTokens?: number
  reasoningTokens?: number
}

/** Normalisiert ID für Vergleich (Trim, Lowercase, Bindestriche optional entfernen). */
function normalizeId(id: string): string {
  return String(id).trim().toLowerCase().replace(/-/g, '')
}

/**
 * Prüft, ob Key-ID und Usage-apiKeyId zusammenpassen (Trim, case-insensitiv, Bindestriche ignoriert).
 * Berücksichtigt, dass Backend api_key_id oder anderes Format liefern kann.
 */
export function keyIdMatchesUsage(keyId: string, usageApiKeyId: string | undefined): boolean {
  if (!usageApiKeyId) return false
  const a = String(keyId).trim()
  const b = String(usageApiKeyId).trim()
  if (a === b) return true
  if (a.toLowerCase() === b.toLowerCase()) return true
  if (normalizeId(a) === normalizeId(b)) return true
  return false
}

/**
 * Liest tokensIn/tokensOut aus einem Record (requestTokens/responseTokens oder tokensIn/tokensOut).
 * reasoningTokens wird zu tokensOut addiert, falls vorhanden.
 */
function getTokensFromRecord(r: UsageRecordForApiKey): { tokensIn: number; tokensOut: number } {
  const tokensIn = Number(r.tokensIn ?? r.requestTokens ?? 0) || 0
  const response = Number(r.tokensOut ?? r.responseTokens ?? 0) || 0
  const reasoning = Number(r.reasoningTokens ?? 0) || 0
  const tokensOut = response + reasoning
  return { tokensIn, tokensOut }
}

/**
 * Baut die Map keyId → ApiKeyUsageData aus Usage-Records.
 * Eine zentrale Stelle für das Matching API-Key ↔ Usage und die Aggregation (Summe pro Key).
 *
 * @param records Usage-Records (z. B. detailedUsageData / EnhancedUsageRecord[] oder API-Summary-Items)
 * @param keys Liste der Keys mit id, optional userId und optional status (für Fallback: erstem aktiven Key zuordnen)
 */
export function buildApiKeyUsageMap(
  records: UsageRecordForApiKey[],
  keys: { id: string; userId?: string; status?: string }[],
): Record<string, ApiKeyUsageData> {
  const safeRecords = records.filter((r) => r != null && typeof r === 'object')
  const map: Record<string, ApiKeyUsageData> = {}

  if (isDebugLogEnabled() && safeRecords.length > 0 && keys.length > 0) {
    const recordIds = [...new Set(safeRecords.map((r) => r.apiKeyId ?? r.api_key_id ?? r.technicalUserId ?? '').filter(Boolean))]
    debugLog('[buildApiKeyUsageMap] Format-Check', {
      'key.ids (erste 3)': keys.slice(0, 3).map((k) => k.id),
      'Record apiKeyId/technicalUserId (unique, erste 5)': recordIds.slice(0, 5),
      'Anzahl Records': safeRecords.length,
      'Anzahl Keys': keys.length,
    })
  }

  for (const key of keys) {
    const keyId = key.id
    // 1) Direktes Matching über apiKeyId / api_key_id (inkl. Normalisierung: Trim, Lowercase, ohne Bindestriche)
    const keyUsage = safeRecords.filter((r) =>
      keyIdMatchesUsage(keyId, r.apiKeyId ?? r.api_key_id ?? undefined),
    )

    // DEBUG: Zeige Matching-Ergebnisse für jeden Key
    if (isDebugLogEnabled()) {
      debugLog(`[buildApiKeyUsageMap] Key ${keyId}:`, {
        'Gefundene Records': keyUsage.length,
        'Erste 3 Record apiKeyIds': keyUsage.slice(0, 3).map((r) => r.apiKeyId ?? r.api_key_id ?? 'null'),
        'Alle Record apiKeyIds (unique)': [...new Set(safeRecords.map((r) => r.apiKeyId ?? r.api_key_id ?? 'null'))].slice(0, 10),
      })
    }

    if (keyUsage.length > 0) {
      let cost = 0
      let tokensIn = 0
      let tokensOut = 0
      for (const u of keyUsage) {
        const t = getTokensFromRecord(u)
        const recordCost = Number(u.cost) || 0
        cost += recordCost
        tokensIn += t.tokensIn
        tokensOut += t.tokensOut

        // DEBUG: Zeige jeden Record der aggregiert wird
        if (isDebugLogEnabled()) {
          debugLog(`[buildApiKeyUsageMap] Aggregiere Record für Key ${keyId}:`, {
            'apiKeyId': u.apiKeyId ?? u.api_key_id ?? 'null',
            'cost': recordCost,
            'tokensIn': t.tokensIn,
            'tokensOut': t.tokensOut,
            'requestTokens': u.requestTokens,
            'responseTokens': u.responseTokens,
            'tokensIn (raw)': u.tokensIn,
            'tokensOut (raw)': u.tokensOut,
          })
        }
      }
      map[keyId] = { cost, tokensIn, tokensOut }

      // DEBUG: Zeige finales Ergebnis für diesen Key
      if (isDebugLogEnabled()) {
        debugLog(`[buildApiKeyUsageMap] ✅ Key ${keyId} final:`, {
          cost,
          tokensIn,
          tokensOut,
        })
      }
    } else {
      map[keyId] = { cost: 0, tokensIn: 0, tokensOut: 0 }
      // DEBUG: Zeige wenn kein Match gefunden wurde
      if (isDebugLogEnabled()) {
        debugLog(`[buildApiKeyUsageMap] ❌ Key ${keyId}: KEIN MATCH gefunden`, {
          'keyId': keyId,
          'normalizedKeyId': normalizeId(keyId),
          'Erste 5 Record apiKeyIds zum Vergleich': safeRecords.slice(0, 5).map((r) => ({
            apiKeyId: r.apiKeyId ?? r.api_key_id ?? 'null',
            normalized: r.apiKeyId ? normalizeId(r.apiKeyId) : r.api_key_id ? normalizeId(r.api_key_id) : 'null',
          })),
        })
      }
    }
  }

  // 2) Fallback: Records mit apiKeyId null/undefined aber technicalUserId → Verbrauch nur dem ersten Key dieses Users zuordnen (keine dreifache Anzeige)
  const recordsWithoutKeyId = safeRecords.filter((r) => {
    const id = r.apiKeyId ?? r.api_key_id
    return (id == null || id === '') && r.technicalUserId
  })
  if (recordsWithoutKeyId.length > 0) {
    const usageByUserId: Record<string, ApiKeyUsageData> = {}
    for (const r of recordsWithoutKeyId) {
      const uid = String(r.technicalUserId).trim()
      if (!uid) continue
      const t = getTokensFromRecord(r)
      if (!usageByUserId[uid]) {
        usageByUserId[uid] = { cost: 0, tokensIn: 0, tokensOut: 0 }
      }
      usageByUserId[uid].cost += Number(r.cost) || 0
      usageByUserId[uid].tokensIn += t.tokensIn
      usageByUserId[uid].tokensOut += t.tokensOut
    }
    // Pro User nur einen Key befüllen (erster in der Liste), damit nicht alle Keys dieselbe Zahl zeigen
    const userIdAlreadyAssigned = new Set<string>()
    for (const key of keys) {
      const uid = key.userId?.trim()
      if (!uid || !usageByUserId[uid] || userIdAlreadyAssigned.has(uid)) continue
      userIdAlreadyAssigned.add(uid)
      const existing = map[key.id]
      const fallback = usageByUserId[uid]
      map[key.id] = {
        cost: (existing?.cost ?? 0) + fallback.cost,
        tokensIn: (existing?.tokensIn ?? 0) + fallback.tokensIn,
        tokensOut: (existing?.tokensOut ?? 0) + fallback.tokensOut,
      }
    }
    // Fallback wenn Keys kein passendes userId haben: Verbrauch dem ersten aktiven Key zuordnen (sichtbar in der Tabelle)
    const userIdsWithUsage = Object.keys(usageByUserId)
    if (userIdsWithUsage.length > 0 && userIdAlreadyAssigned.size === 0 && keys.length > 0) {
      const firstActiveKey = keys.find((k) => k.status === 'active') ?? keys[0]
      const total: ApiKeyUsageData = { cost: 0, tokensIn: 0, tokensOut: 0 }
      for (const uid of userIdsWithUsage) {
        const u = usageByUserId[uid]
        total.cost += u.cost
        total.tokensIn += u.tokensIn
        total.tokensOut += u.tokensOut
      }
      const existing = map[firstActiveKey.id]
      map[firstActiveKey.id] = {
        cost: (existing?.cost ?? 0) + total.cost,
        tokensIn: (existing?.tokensIn ?? 0) + total.tokensIn,
        tokensOut: (existing?.tokensOut ?? 0) + total.tokensOut,
      }
    }
  }

  return map
}
