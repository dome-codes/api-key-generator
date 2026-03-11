/**
 * Zentrale Stelle: Mapping von Usage-Summary-Daten (API/OpenAPI) auf Verbrauch pro API-Key.
 * Nutzt OpenAPI-konforme Felder (apiKeyId, requestTokens, responseTokens, cost) und
 * aggregiert pro Key für die API-Key-Liste (ApiKeyTable / ApiKeyRow).
 */

import type { ApiKeyUsageData } from '@/types/frontend'
import { debugLog, isDebugLogEnabled } from '@/utils/debugLog'

/**
 * Record mit API-Key-ID und Verbrauchsfeldern.
 * Entspricht EnhancedUsageRecord / AIUsageSummaryRecord (OpenAPI):
 * apiKeyId (laut OpenAPI-Spezifikation), requestTokens/responseTokens oder tokensIn/tokensOut, cost optional.
 * userId für Fallback, wenn Backend apiKeyId: null liefert (z. B. bei Aggregation).
 */
export interface UsageRecordForApiKey {
  apiKeyId?: string | null // Laut OpenAPI-Spezifikation: apiKeyId (camelCase)
  userId?: string
  cost?: number
  tokensIn?: number
  tokensOut?: number
  requestTokens?: number
  responseTokens?: number
  reasoningTokens?: number
}

/** Normalisiert ID für Vergleich (Trim, Lowercase, Bindestriche optional entfernen). */
function normalizeId(id: string | null | undefined): string {
  if (!id || id === 'null' || id === 'undefined') return ''
  return String(id).trim().toLowerCase().replace(/-/g, '')
}

/**
 * Prüft, ob Key-ID und Usage-apiKeyId zusammenpassen (Trim, case-insensitiv, Bindestriche ignoriert).
 * Laut OpenAPI-Spezifikation heißt das Feld 'apiKeyId' (camelCase).
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
 * @param keys Liste der Keys mit id, optional userId und optional active (für Fallback: erstem aktiven Key zuordnen)
 */
export function buildApiKeyUsageMap(
  records: UsageRecordForApiKey[],
  keys: { id: string; userId?: string; active?: boolean }[],
): Record<string, ApiKeyUsageData> {
  const safeRecords = records.filter((r) => r != null && typeof r === 'object')
  const map: Record<string, ApiKeyUsageData> = {}

  if (isDebugLogEnabled() && safeRecords.length > 0 && keys.length > 0) {
    const _recordIds = [
      ...new Set(safeRecords.map((r) => r.apiKeyId ?? r.userId ?? '').filter(Boolean)),
    ]
    const apiKeyIds = keys.map((k) => k.id)
    const recordApiKeyIds = [...new Set(safeRecords.map((r) => r.apiKeyId).filter(Boolean))]

    debugLog('[buildApiKeyUsageMap] Format-Check', {
      'API Key IDs (erste 5)': apiKeyIds.slice(0, 5),
      'API Key IDs (normalized, erste 5)': apiKeyIds.slice(0, 5).map((id) => normalizeId(id)),
      'Record apiKeyIds (unique, erste 5)': recordApiKeyIds.slice(0, 5),
      'Record apiKeyIds (normalized, erste 5)': recordApiKeyIds
        .slice(0, 5)
        .map((id) => normalizeId(id)),
      'Record userId (unique, erste 5)': [
        ...new Set(safeRecords.map((r) => r.userId).filter(Boolean)),
      ].slice(0, 5),
      'Anzahl Records': safeRecords.length,
      'Anzahl Keys': keys.length,
      'ERSTER RECORD KOMPLETT (für Debugging)': safeRecords[0]
        ? {
            'Alle Keys': Object.keys(safeRecords[0]),
            'apiKeyId (laut OpenAPI)': safeRecords[0].apiKeyId,
            'apiKeyId (type)': typeof safeRecords[0].apiKeyId,
            'apiKeyId (is null/undefined?)': safeRecords[0].apiKeyId == null,
            userId: safeRecords[0].userId,
            'Kompletter Record': safeRecords[0],
          }
        : 'KEINE RECORDS',
      'VERGLEICH: Passen API Key IDs zu Record apiKeyIds?': {
        'API Key IDs vorhanden?': apiKeyIds.length > 0,
        'Record apiKeyIds vorhanden?': recordApiKeyIds.length > 0,
        'Erste API Key ID': apiKeyIds[0],
        'Erste Record apiKeyId': recordApiKeyIds[0],
        'Match?':
          apiKeyIds.length > 0 && recordApiKeyIds.length > 0 && apiKeyIds[0] === recordApiKeyIds[0],
        'Normalized Match?':
          apiKeyIds.length > 0 &&
          recordApiKeyIds.length > 0 &&
          normalizeId(apiKeyIds[0]) === normalizeId(recordApiKeyIds[0]),
      },
    })
  }

  const usageCountByKeyId: Record<string, number> = {}

  for (const key of keys) {
    const keyId = key.id
    // 1) Direktes Matching über apiKeyId (laut OpenAPI-Spezifikation: camelCase)
    // Inkl. Normalisierung: Trim, Lowercase, ohne Bindestriche
    const keyUsage = safeRecords.filter((r) => keyIdMatchesUsage(keyId, r.apiKeyId ?? undefined))

    // DEBUG: Zeige Matching-Ergebnisse für jeden Key
    if (isDebugLogEnabled()) {
      debugLog(`[buildApiKeyUsageMap] Key ${keyId}:`, {
        'Gefundene Records': keyUsage.length,
        'Erste 3 Record apiKeyIds': keyUsage.slice(0, 3).map((r) => r.apiKeyId ?? 'null'),
        'Alle Record apiKeyIds (unique)': [
          ...new Set(safeRecords.map((r) => r.apiKeyId ?? 'null')),
        ].slice(0, 10),
      })
    }

    usageCountByKeyId[keyId] = keyUsage.length

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
            apiKeyId: u.apiKeyId ?? 'null',
            cost: recordCost,
            tokensIn: t.tokensIn,
            tokensOut: t.tokensOut,
            requestTokens: u.requestTokens,
            responseTokens: u.responseTokens,
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
        const recordApiKeyIds = safeRecords.slice(0, 5).map((r) => {
          const rawId = r.apiKeyId ?? null
          return {
            'Raw apiKeyId (laut OpenAPI)': rawId,
            Type: typeof rawId,
            'Is null/undefined?': rawId == null,
            Normalized: rawId ? normalizeId(rawId) : 'EMPTY',
            'Kompletter Record (erste 5 Keys)': Object.keys(r).slice(0, 5),
          }
        })

        debugLog(`[buildApiKeyUsageMap] ❌ Key ${keyId}: KEIN MATCH gefunden`, {
          'keyId (original)': keyId,
          'keyId (type)': typeof keyId,
          normalizedKeyId: normalizeId(keyId),
          'Erste 5 Records Details': recordApiKeyIds,
          'Alle Record apiKeyIds (raw, unique)': [
            ...new Set(safeRecords.map((r) => String(r.apiKeyId ?? 'null'))),
          ].slice(0, 10),
          'Vergleich: normalizedKeyId === normalized Record?': safeRecords.slice(0, 5).map((r) => {
            const recordId = r.apiKeyId ?? null
            return {
              'Record ID': recordId,
              'Match?': recordId ? normalizeId(keyId) === normalizeId(recordId) : false,
            }
          }),
        })
      }
    }
  }

  // 2) Fallback: Records mit apiKeyId null/undefined aber userId → Verbrauch pro User auf dessen Keys verteilen
  const recordsWithoutKeyId = safeRecords.filter((r) => {
    const id = r.apiKeyId
    return (id == null || id === '') && r.userId
  })
  if (recordsWithoutKeyId.length > 0) {
    const usageByUserId: Record<string, ApiKeyUsageData> = {}
    for (const r of recordsWithoutKeyId) {
      const uid = String(r.userId).trim()
      if (!uid) continue
      const t = getTokensFromRecord(r)
      if (!usageByUserId[uid]) {
        usageByUserId[uid] = { cost: 0, tokensIn: 0, tokensOut: 0 }
      }
      usageByUserId[uid].cost += Number(r.cost) || 0
      usageByUserId[uid].tokensIn += t.tokensIn
      usageByUserId[uid].tokensOut += t.tokensOut
    }
    // Pro User nur einen Key befüllen (erster Key dieses Users), damit nicht alle Keys dieselbe Zahl zeigen
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
      usageCountByKeyId[key.id] = (usageCountByKeyId[key.id] ?? 0) + 1
    }

    // Fallback: Wenn wir zwar Usage pro userId haben, aber keinem Key etwas zuordnen konnten
    // (z. B. weil Keys keine userId haben), ordnen wir den Gesamtverbrauch dem ersten aktiven Key zu.
    const userIdsWithUsage = Object.keys(usageByUserId)
    if (userIdsWithUsage.length > 0 && userIdAlreadyAssigned.size === 0 && keys.length > 0) {
      const firstActiveKey = keys.find((k) => k.active !== false) ?? keys[0]
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
      usageCountByKeyId[firstActiveKey.id] = (usageCountByKeyId[firstActiveKey.id] ?? 0) + 1
    }
  }

  if (isDebugLogEnabled()) {
    const zeroCostKeys = Object.entries(map)
      .filter(([, v]) => (v?.cost ?? 0) === 0)
      .map(([id]) => id)

    debugLog('[buildApiKeyUsageMap] Zusammenfassung:', {
      totalRecords: safeRecords.length,
      totalKeys: keys.length,
      keysWithAnyUsageRecords: Object.entries(usageCountByKeyId)
        .filter(([, count]) => (count ?? 0) > 0)
        .map(([id, count]) => ({ id, count })),
      zeroCostKeys,
      sampleZeroCostKeys: zeroCostKeys.slice(0, 5).map((id) => ({
        keyId: id,
        usageCount: usageCountByKeyId[id] ?? 0,
      })),
    })
  }

  return map
}
