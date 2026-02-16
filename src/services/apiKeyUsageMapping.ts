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
 */
export interface UsageRecordForApiKey {
  apiKeyId?: string
  api_key_id?: string
  cost?: number
  tokensIn?: number
  tokensOut?: number
  requestTokens?: number
  responseTokens?: number
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
 */
function getTokensFromRecord(r: UsageRecordForApiKey): { tokensIn: number; tokensOut: number } {
  const tokensIn =
    r.tokensIn ?? r.requestTokens ?? 0
  const tokensOut =
    r.tokensOut ?? r.responseTokens ?? 0
  return { tokensIn: Number(tokensIn) || 0, tokensOut: Number(tokensOut) || 0 }
}

/**
 * Baut die Map keyId → ApiKeyUsageData aus Usage-Records.
 * Eine zentrale Stelle für das Matching API-Key ↔ Usage und die Aggregation (Summe pro Key).
 *
 * @param records Usage-Records (z. B. detailedUsageData / EnhancedUsageRecord[] oder API-Summary-Items)
 * @param keyIds Liste der API-Key-IDs, für die Einträge erzeugt werden (z. B. apiKeys.map(k => k.id))
 */
export function buildApiKeyUsageMap(
  records: UsageRecordForApiKey[],
  keyIds: string[],
): Record<string, ApiKeyUsageData> {
  const safeRecords = records.filter((r) => r != null && typeof r === 'object')
  const map: Record<string, ApiKeyUsageData> = {}

  for (const keyId of keyIds) {
    const keyUsage = safeRecords.filter((r) =>
      keyIdMatchesUsage(keyId, r.apiKeyId ?? r.api_key_id),
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

  return map
}
