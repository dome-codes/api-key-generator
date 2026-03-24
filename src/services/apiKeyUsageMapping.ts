/**
 * Zentrale Stelle: Mapping von Usage-Summary → Verbrauch pro API-Key (ApiKeyTable / ApiKeyRow).
 *
 * Datenmodell (Backend):
 * - Apikeys-API: Schlüssel mit id (= apiKeyId), name, createdAt, expiresAt, userId, active, …
 * - Summarize `by=apiKeyId`: viele Zeilen im Zeitraum (type, model, tag, day, …) mit derselben apiKeyId;
 *   Felder u. a. requestTokens, cachedTokens, responseTokens / reponseTokens, reasoningTokens, cost.
 *
 * Vorgehen:
 * 1) Alle Summarize-Zeilen mit erkennbarer apiKeyId zu **einer** Summe pro Key-ID (normalisiert) aggregieren.
 * 2) Für jede Zeile der Apikeys-Liste `map[id]` = diese Summe oder 0 (Match über normalisierte IDs).
 * 3) Nur wenn Zeilen **ohne** apiKeyId aber mit userId existieren: bisheriger User-Fallback (selten).
 */

import type { ApiKeyUsageData } from '@/types/frontend'
import { readTokensFromItem } from '@/services/usageApiService'
import { debugLog, isDebugLogEnabled } from '@/utils/debugLog'

/**
 * Liest die API-Key-ID aus einem Summary-/Usage-Record.
 * Backends variieren: camelCase `apiKeyId`, snake_case `api_key_id`, oder bei Gruppierung `by=apiKey` nur `apiKey`.
 */
export function extractApiKeyIdFromUsageRecord(r: unknown): string | undefined {
  if (r == null || typeof r !== 'object') return undefined
  const o = r as Record<string, unknown>
  const candidates = [o.apiKeyId, o.api_key_id, o.apiKey]
  for (const c of candidates) {
    if (c == null || c === '') continue
    const s = String(c).trim()
    if (s) return s
  }
  return undefined
}

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

/** Kosten + Tokens aus einer Summarize-Zeile (readTokensFromItem + Fallback tokensIn/tokensOut wie bei EnhancedUsageRecord). */
function getCostAndTokensFromRecord(r: UsageRecordForApiKey): {
  cost: number
  tokensIn: number
  tokensOut: number
} {
  const item = r as unknown as Record<string, unknown>
  const t = readTokensFromItem(item)
  let tokensIn = t.requestTokens
  let tokensOut = t.responseTokens + t.reasoningTokens
  if (tokensIn === 0 && tokensOut === 0) {
    const ti = Number(r.tokensIn ?? 0) || 0
    const to = Number(r.tokensOut ?? 0) || 0
    if (ti !== 0 || to !== 0) {
      tokensIn = ti
      tokensOut = to
    }
  }
  const cost = Number(r.cost) || 0
  return { cost, tokensIn, tokensOut }
}

/** Summarize liefert mehrere Zeilen pro apiKeyId → Summe + Zeilenzahl pro normalisierter Key-ID. */
function aggregateUsageByNormalizedApiKeyId(records: UsageRecordForApiKey[]): {
  totals: Map<string, ApiKeyUsageData>
  rowCount: Map<string, number>
} {
  const totals = new Map<string, ApiKeyUsageData>()
  const rowCount = new Map<string, number>()
  for (const r of records) {
    const aid = extractApiKeyIdFromUsageRecord(r)
    if (!aid?.trim()) continue
    const norm = normalizeId(aid)
    if (!norm) continue
    rowCount.set(norm, (rowCount.get(norm) ?? 0) + 1)
    const { cost, tokensIn, tokensOut } = getCostAndTokensFromRecord(r)
    const prev = totals.get(norm) ?? { cost: 0, tokensIn: 0, tokensOut: 0 }
    totals.set(norm, {
      cost: prev.cost + cost,
      tokensIn: prev.tokensIn + tokensIn,
      tokensOut: prev.tokensOut + tokensOut,
    })
  }
  return { totals, rowCount }
}

/**
 * Baut die Map keyId → ApiKeyUsageData aus Usage-Records.
 * Eine zentrale Stelle für das Matching API-Key ↔ Usage und die Aggregation (Summe pro Key).
 *
 * @param records Usage-Records (z. B. detailedUsageData / EnhancedUsageRecord[] oder API-Summary-Items)
 * @param keys Liste der Keys mit id, optional userId und optional active (Fallback ohne Key-ID: Anteil nur auf aktive Keys, sonst alle)
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
    const recordApiKeyIds = [
      ...new Set(safeRecords.map((r) => extractApiKeyIdFromUsageRecord(r)).filter(Boolean)),
    ]

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

  const { totals: aggregatedByNorm, rowCount: rowCountByNorm } =
    aggregateUsageByNormalizedApiKeyId(safeRecords)

  for (const key of keys) {
    const keyId = key.id
    const norm = normalizeId(keyId)
    const agg = norm ? aggregatedByNorm.get(norm) : undefined
    usageCountByKeyId[keyId] = norm ? (rowCountByNorm.get(norm) ?? 0) : 0

    if (agg) {
      map[keyId] = { cost: agg.cost, tokensIn: agg.tokensIn, tokensOut: agg.tokensOut }
      if (isDebugLogEnabled()) {
        debugLog(`[buildApiKeyUsageMap] Key ${keyId} ← Summarize-Aggregat (${usageCountByKeyId[keyId]} Zeilen):`, agg)
      }
    } else {
      map[keyId] = { cost: 0, tokensIn: 0, tokensOut: 0 }
      if (isDebugLogEnabled() && safeRecords.length > 0) {
        debugLog(`[buildApiKeyUsageMap] Key ${keyId}: kein Summarize-Treffer für normalisierte id`, {
          normalizedKeyId: norm,
          uniqueNormsFromSummarize: [...aggregatedByNorm.keys()].slice(0, 8),
        })
      }
    }
  }

  // 2) Fallback: nur Records ohne erkennbare Key-ID, aber mit userId (sonst Doppelzählung / gleiche Aufteilung)
  const recordsWithoutKeyId = safeRecords.filter((r) => {
    const id = extractApiKeyIdFromUsageRecord(r)
    return (id == null || id === '') && r.userId
  })
  if (recordsWithoutKeyId.length > 0) {
    const usageByUserId: Record<string, ApiKeyUsageData> = {}
    for (const r of recordsWithoutKeyId) {
      const uid = String(r.userId).trim()
      if (!uid) continue
      const { cost, tokensIn, tokensOut } = getCostAndTokensFromRecord(r)
      if (!usageByUserId[uid]) {
        usageByUserId[uid] = { cost: 0, tokensIn: 0, tokensOut: 0 }
      }
      usageByUserId[uid].cost += cost
      usageByUserId[uid].tokensIn += tokensIn
      usageByUserId[uid].tokensOut += tokensOut
    }
    // Ohne Key-ID in den Records: nur noch User-Aggregate → aufteilen (letzte Option).
    // Bevorzugt nur auf aktive Keys; deaktivierte zeigen sonst fälschlich denselben Anteil wie alle anderen.
    const userIdsDistributed = new Set<string>()
    for (const uid of Object.keys(usageByUserId)) {
      const fallback = usageByUserId[uid]
      const keysForUser = keys.filter((k) => k.userId?.trim() === uid)
      if (keysForUser.length === 0) continue
      userIdsDistributed.add(uid)
      const activeKeys = keysForUser.filter((k) => k.active !== false)
      const targets = activeKeys.length > 0 ? activeKeys : keysForUser
      const n = targets.length
      const perShare: ApiKeyUsageData = {
        cost: fallback.cost / n,
        tokensIn: fallback.tokensIn / n,
        tokensOut: fallback.tokensOut / n,
      }
      for (const key of targets) {
        const existing = map[key.id]
        map[key.id] = {
          cost: (existing?.cost ?? 0) + perShare.cost,
          tokensIn: (existing?.tokensIn ?? 0) + perShare.tokensIn,
          tokensOut: (existing?.tokensOut ?? 0) + perShare.tokensOut,
        }
        usageCountByKeyId[key.id] = (usageCountByKeyId[key.id] ?? 0) + 1
      }
    }

    // Rest: Usage mit userId, zu dem es keine passenden Keys gibt → gleichmäßig auf alle Keys verteilen
    const remainder: ApiKeyUsageData = { cost: 0, tokensIn: 0, tokensOut: 0 }
    for (const uid of Object.keys(usageByUserId)) {
      if (userIdsDistributed.has(uid)) continue
      const u = usageByUserId[uid]
      remainder.cost += u.cost
      remainder.tokensIn += u.tokensIn
      remainder.tokensOut += u.tokensOut
    }
    if (
      (remainder.cost !== 0 || remainder.tokensIn !== 0 || remainder.tokensOut !== 0) &&
      keys.length > 0
    ) {
      const n = keys.length
      const perShare: ApiKeyUsageData = {
        cost: remainder.cost / n,
        tokensIn: remainder.tokensIn / n,
        tokensOut: remainder.tokensOut / n,
      }
      for (const key of keys) {
        const existing = map[key.id]
        map[key.id] = {
          cost: (existing?.cost ?? 0) + perShare.cost,
          tokensIn: (existing?.tokensIn ?? 0) + perShare.tokensIn,
          tokensOut: (existing?.tokensOut ?? 0) + perShare.tokensOut,
        }
        usageCountByKeyId[key.id] = (usageCountByKeyId[key.id] ?? 0) + 1
      }
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
