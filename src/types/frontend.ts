/**
 * Frontend-only types and aliases for UI layer.
 * API response/request types come from Orval (@/api/types); this file adds
 * enhanced records, filter DTOs, and aggregation types used by services.
 *
 * This file is manually maintained and tracked in git, unlike the generated
 * types in @/api/types which are created during CI/CD.
 */

// Conditional imports - these will be available after Orval generation in CI/CD
// Using type-only imports to avoid runtime dependencies on generated files
import type { AIUsageRecord } from '@/api/types/aIUsageRecord'
import type { AIUsageSummaryRecord } from '@/api/types/aIUsageSummaryRecord'
import type { ModelUsageType } from '@/api/types/modelUsageType'

// Re-export Orval types used by frontend (conditional - available after generation)
export type {
  AiUsagePage,
  AIUsageSummaryPage,
  ExtractionUsagePage,
  ExtractionUsageSummaryPage,
  ModelUsageType,
} from '@/api/types/index'
// Page wird direkt aus @/api/types importiert (nicht über frontend.ts)

// Aliases for API records (used as SummaryUsage | ModelUsage in analytics)
export type SummaryUsage = AIUsageSummaryRecord
export type ModelUsage = AIUsageRecord

// Backward-compat + DekaRAG API: beide Schreibweisen (API = COMPLETION_USAGE, alt = CompletionModelUsage)
export const CompletionModelUsageType = {
  CompletionModelUsage: 'CompletionModelUsage',
  COMPLETION_USAGE: 'COMPLETION_USAGE',
} as const
export const EmbeddingModelUsageType = {
  EmbeddingModelUsage: 'EmbeddingModelUsage',
  EMBEDDING_USAGE: 'EMBEDDING_USAGE',
} as const
export const ImageModelUsageType = {
  ImageModelUsage: 'ImageModelUsage',
  IMAGE_USAGE: 'IMAGE_USAGE',
} as const

// Page response types (Orval uses .data + .pagination) – import via barrel to avoid casing conflicts on Linux
export type {
  ExtractionUsagePage as ExtractionUsagePageResponse,
  ExtractionUsageSummaryPage as ExtractionUsageSummaryPageResponse,
  AIUsageSummaryPage as SummaryUsagePageResponse,
  AiUsagePage as UsagePageResponse,
} from '@/api/types'

/** Filter params for AI usage API (maps to UsageAIGetV1Params + optional sort/order) */
export interface UsageFilterApi {
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  userId?: string
  tag?: string
  apiKey?: string
  model?: string
  modelType?: string
  userIds?: string[]
  sort?: string
  order?: string
  groupBy?: string[]
}

/** UI filter (alias for backward compat) */
export type UsageFilter = UsageFilterApi

/** Filter params for extraction usage API */
export interface ExtractionUsageFilterApi {
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  userId?: string
  tag?: string
  apiKey?: string
  provider?: string
  modelId?: string
  status?: string
  sort?: string
  order?: string
  groupBy?: string[]
}

/** UI record with computed fields (technicalUserName/userName, cost, etc.) */
export interface EnhancedUsageRecord {
  userId?: string
  /** Anzeigename aus Backend (technicalUserName); Fallback: userName oder "User {userId}" */
  technicalUserName?: string
  userName?: string
  modelName?: string
  modelType?: ModelUsageType
  type?: ModelUsageType
  requests?: number
  tokensIn?: number
  tokensOut?: number
  totalTokens?: number
  /** Eingesparte Eingabe-Tokens aus Cache (Cached Tokens) */
  cachedTokens?: number
  /** Zusätzliche Reasoning-Tokens (z. B. für CoT) */
  reasoningTokens?: number
  cost?: number
  tag?: string
  day?: number
  month?: number
  year?: number
  createDate?: string
  apiKey?: string
  apiKeyId?: string
  /** Nur bei ImageModelUsage: Bildbreite */
  sizeWidth?: number
  /** Nur bei ImageModelUsage: Bildhöhe */
  sizeHeight?: number
  /** Nur bei ImageModelUsage: Qualität (z. B. standard, hd) */
  quality?: string
}

/** UI record for extraction with display fields */
export interface EnhancedExtractionUsageRecord {
  id?: string
  operationId?: string
  status?: string
  createDate?: string
  completedDate?: string | null
  day?: number
  month?: number
  year?: number
  userId?: string
  userName?: string
  apiKey?: string
  apiKeyId?: string
  tag?: string
  provider?: string
  modelId?: string
  documentType?: string
  pages?: number
  extractedFields?: Array<{ fieldName?: string; value?: string; confidence?: number }>
  confidenceScore?: number
  cost?: number
  operations?: number
}

export interface UsageAggregation {
  totalRequests: number
  totalTokensIn: number
  totalTokensOut: number
  totalTokens: number
  totalCost: number
  /** Summe aller Cached Tokens (Eingabe über Prompt-Cache) */
  totalCachedTokens: number
  /** Summe aller Reasoning Tokens (zusätzliche Denk-Tokens) */
  totalReasoningTokens: number
  uniqueUsers: number
  uniqueModels: number
  averageRequestsPerUser: number
  averageTokensPerRequest: number
  averageCostPerRequest: number
  /** Bei ImageModelUsage: Summe der erzeugten Bilder (Anfragen) */
  totalImages?: number
}

/**
 * Verbrauch pro API-Key für die API-Key-Liste (Progress/Tokens).
 * Entspricht der Aggregation von AIUsageSummaryRecord/EnhancedUsageRecord pro apiKeyId:
 * requestTokens → tokensIn, responseTokens → tokensOut, cost (optional von API oder berechnet).
 */
export interface ApiKeyUsageData {
  cost: number
  tokensIn: number
  tokensOut: number
}

// Verbrauch pro Benutzer (aggregiert über alle Keys eines Users)
export interface UserUsageData {
  cost: number
  tokensIn: number
  tokensOut: number
}

/**
 * API-Key für die Anzeige in der Liste (Keys-Seite).
 * Wird aus der API-Response gemappt (z. B. id, name, createdAt, expiresAt, userId, active → diese Felder).
 *
 * Datenmodell (Ticket 3):
 * - **id**: Eindeutige Kennung des API-Keys (Primary Key des Schlüssels). Wird für Verbrauch pro Key
 *   und für usageData-Map (key.id → ApiKeyUsageData) verwendet.
 * - **userId**: ID des Benutzers, dem dieser Key gehört. Ermöglicht Verbrauch pro User (über alle
 *   seine Keys) und Admin-Zuordnung (Keys nach User gruppieren).
 * - **active**: API liefert active als boolean (true/false), nicht als String "active".
 */
export interface ApiKeyDisplay {
  /** Eindeutige API-Key-ID (PK). Index für usageData[key.id]. */
  id: string
  apiKey: string
  name: string
  permissions: string
  createdAt: string
  createdBy: string
  /** Ablaufdatum (API-Feld: expiresAt). */
  expiresAt: string
  lastUsed: string
  /** API liefert active als boolean (true = aktiv, false = deaktiviert/revoked). */
  active: boolean
  /** Benutzer-ID des Key-Besitzers. Für Admin-Gruppierung und kumulierten Verbrauch pro User. */
  userId?: string
  userName?: string
}

export interface ModelUsageSummary {
  modelName: string
  modelType: ModelUsageType
  totalRequests: number
  totalTokensIn: number
  totalTokensOut: number
  totalTokens: number
  totalCost: number
  userBreakdown: Record<
    string,
    {
      requests: number
      tokensIn: number
      tokensOut: number
      totalTokens: number
      cost: number
      tag: string
    }
  >
}

export interface UserUsageSummary {
  userId: string
  userName: string
  totalRequests: number
  totalTokensIn: number
  totalTokensOut: number
  totalTokens: number
  totalCost: number
  modelBreakdown: Record<
    string,
    {
      requests: number
      tokensIn: number
      tokensOut: number
      totalTokens: number
      cost: number
      tag: string
    }
  >
}

export interface ImageModelUsage extends AIUsageSummaryRecord {
  sizeWidth?: number
  sizeHeight?: number
  quality?: string
}

export interface ExtractionUsageAggregation {
  totalOperations: number
  totalPages: number
  totalCost: number
  uniqueUsers: number
  uniqueProviders?: number
  uniqueModels: number
  averageConfidence?: number
  operationsByStatus?: { [key: string]: number }
  averagePagesPerOperation: number
  averageCostPerOperation: number
}
