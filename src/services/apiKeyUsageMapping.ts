/**
 * Zentrale Stelle: Mapping von Usage-Summary-Daten (API/OpenAPI) auf Verbrauch pro API-Key.
 * Nutzt OpenAPI-konforme Felder (apiKeyId, requestTokens, responseTokens, cost) und
 * aggregiert pro Key für die API-Key-Liste (ApiKeyTable / ApiKeyRow).
 */

import type { ApiKeyUsageData } from '@/api/types/frontend'

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

/**
 * Prüft, ob Key-ID und Usage-apiKeyId zusammenpassen (Trim + optional case-insensitiv).
 * Berücksichtigt, dass Backend api_key_id oder anderes Format liefern kann.
 */
export function keyIdMatchesUsage(keyId: string, usageApiKeyId: string | undefined): boolean {
  if (!usageApiKeyId) return false
  const a = String(keyId).trim()
  const b = String(usageApiKeyId).trim()
  if (a === b) return true
  return a.toLowerCase() === b.toLowerCase()
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

  for (const key of keys) {
    const keyId = key.id
    // 1) Direktes Matching über apiKeyId / api_key_id
    const keyUsage = safeRecords.filter((r) =>
      keyIdMatchesUsage(keyId, r.apiKeyId ?? r.api_key_id ?? undefined),
    )

    if (keyUsage.length > 0) {
      let cost = 0
      let tokensIn = 0
      let tokensOut = 0
      for (const u of keyUsage) {
        const t = getTokensFromRecord(u)
        cost += Number(u.cost) || 0
        tokensIn += t.tokensIn
        tokensOut += t.tokensOut
      }
      map[keyId] = { cost, tokensIn, tokensOut }
    } else {
      map[keyId] = { cost: 0, tokensIn: 0, tokensOut: 0 }
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
