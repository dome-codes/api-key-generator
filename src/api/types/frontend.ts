/**
 * Frontend-only types and aliases for UI layer.
 * API response/request types come from Orval (@/api/types); this file adds
 * enhanced records, filter DTOs, and aggregation types used by services.
 */

import type { AIUsageRecord } from './aIUsageRecord'
import type { AIUsageSummaryRecord } from './aIUsageSummaryRecord'
import type { ModelUsageType } from './modelUsageType'

// Re-export Orval types used by frontend
export type { AIUsagePage, AIUsageSummaryPage, ExtractionUsagePage, ExtractionUsageSummaryPage } from './index'
export type { PaginationInfo, ModelUsageType } from './index'

// Aliases for API records (used as SummaryUsage | ModelUsage in analytics)
export type SummaryUsage = AIUsageSummaryRecord
export type ModelUsage = AIUsageRecord

// Backward-compat enum names (same values as ModelUsageType)
export const CompletionModelUsageType = { CompletionModelUsage: 'CompletionModelUsage' } as const
export const EmbeddingModelUsageType = { EmbeddingModelUsage: 'EmbeddingModelUsage' } as const
export const ImageModelUsageType = { ImageModelUsage: 'ImageModelUsage' } as const

// Page response types (Orval uses .data + .pagination)
export type { AIUsagePage as UsagePageResponse } from './aIUsagePage'
export type { AIUsageSummaryPage as SummaryUsagePageResponse } from './aIUsageSummaryPage'
export type { ExtractionUsagePage as ExtractionUsagePageResponse } from './extractionUsagePage'
export type { ExtractionUsageSummaryPage as ExtractionUsageSummaryPageResponse } from './extractionUsageSummaryPage'

/** Filter params for AI usage API (maps to UsageAIGetV1Params + optional sort/order) */
export interface UsageFilterApi {
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  userId?: string
  tag?: string
  apiKeyId?: string
  model?: string
  modelType?: string
  technicalUserIds?: string[]
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
  apiKeyId?: string
  provider?: string
  modelId?: string
  status?: string
  sort?: string
  order?: string
  groupBy?: string[]
}

/** UI record with computed fields (technicalUserName, cost, etc.) */
export interface EnhancedUsageRecord {
  technicalUserId?: string
  technicalUserName?: string
  modelName?: string
  modelType?: ModelUsageType
  type?: ModelUsageType
  requests?: number
  tokensIn?: number
  tokensOut?: number
  totalTokens?: number
  cost?: number
  tag?: string
  day?: number
  month?: number
  year?: number
  createDate?: string
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
  technicalUserId?: string
  technicalUserName?: string
  apiKeyId?: string
  tag?: string
  provider?: string
  modelId?: string
  documentType?: string
  pages?: number
  extractedFields?: Array<{ fieldName?: string; value?: string; confidence?: number }>
  confidenceScore?: number
  cost?: number
}

export interface UsageAggregation {
  totalRequests: number
  totalTokensIn: number
  totalTokensOut: number
  totalTokens: number
  totalCost: number
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

/**
 * API-Key für die Anzeige in der Liste (Keys-Seite).
 * Wird aus der API-Response gemappt (z. B. id, name, createdAt, expiresAt, userId, active → diese Felder).
 */
export interface ApiKeyDisplay {
  id: string
  apiKey: string
  name: string
  permissions: string
  createdAt: string
  createdBy: string
  validUntil: string
  lastUsed: string
  status: string
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
  userBreakdown: Record<string, { requests: number; tokensIn: number; tokensOut: number; totalTokens: number; cost: number; tag: string }>
}

export interface UserUsageSummary {
  technicalUserId: string
  technicalUserName: string
  totalRequests: number
  totalTokensIn: number
  totalTokensOut: number
  totalTokens: number
  totalCost: number
  modelBreakdown: Record<string, { requests: number; tokensIn: number; tokensOut: number; totalTokens: number; cost: number; tag: string }>
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
