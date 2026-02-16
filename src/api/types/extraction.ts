/**
 * Extraction Usage Types
 * 
 * Types für Document Intelligence / Extraction Usage
 * Parallel zu den AI Usage Types strukturiert
 */

import type { PaginationInfo } from './types'

// Extraction Operation Status
export type ExtractionOperationStatus =
  | 'processing'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'skipped'

// Extracted Field
export interface ExtractedField {
  fieldName: string
  value: string
  confidence: number // 0-1
}

// Extraction Usage Record
export interface ExtractionUsageRecord {
  id: string
  operationId: string
  status: ExtractionOperationStatus
  createDate: string
  completedDate?: string | null
  day?: number
  month?: number
  year?: number
  technicalUserId: string
  apiKeyId?: string
  tag: string
  provider: string
  modelId: string
  documentType: string
  pages: number
  extractedFields: ExtractedField[]
  confidenceScore: number // 0-1
  cost: number
}

// Extraction Usage Summary Record
export interface ExtractionUsageSummaryRecord {
  status?: ExtractionOperationStatus
  tag: string
  provider: string
  modelId: string
  technicalUserId: string
  apiKeyId?: string
  day?: number
  month?: number
  year?: number
  operations: number
  totalPages: number
  averageConfidence: number
  cost: number
}

// Enhanced Extraction Usage Record (für Frontend)
export interface EnhancedExtractionUsageRecord {
  id: string
  operationId: string
  status: ExtractionOperationStatus
  createDate: string
  completedDate?: string | null
  day?: number
  month?: number
  year?: number
  technicalUserId: string
  technicalUserName: string
  apiKeyId?: string
  tag: string
  provider: string
  modelId: string
  documentType: string
  pages: number
  extractedFields: ExtractedField[]
  confidenceScore: number
  cost: number
}

// API Parameters
export interface ExtractionUsageGetV1Params {
  from_date?: string
  to_date?: string
  provider?: string
  modelId?: string
  status?: ExtractionOperationStatus
  userId?: string
  tag?: string
  apiKeyId?: string
}

export interface ExtractionUsageSummaryGetV1Params {
  from_date?: string
  to_date?: string
  provider?: string
  modelId?: string
  status?: ExtractionOperationStatus
  userId?: string
  tag?: string
  apiKeyId?: string
  by?: ('day' | 'month' | 'year' | 'tag' | 'apiKey' | 'provider' | 'modelId' | 'user')[]
}

// Erweiterte API Parameters mit Pagination und Sortierung
export interface ExtractionUsageGetV1ParamsExtended {
  from_date?: string
  to_date?: string
  page?: number
  limit?: number
  provider?: string
  modelId?: string
  status?: ExtractionOperationStatus
  userId?: string
  tag?: string
  apiKeyId?: string
  sort?: string // Sortierfeld (z.B. 'createDate', 'cost', 'pages')
  order?: 'asc' | 'desc' // Sortierreihenfolge
}

export interface ExtractionUsageSummaryGetV1ParamsExtended {
  from_date?: string
  to_date?: string
  page?: number
  limit?: number
  provider?: string
  modelId?: string
  status?: ExtractionOperationStatus
  userId?: string
  tag?: string
  apiKeyId?: string
  by?: ('day' | 'month' | 'year' | 'tag' | 'apiKey' | 'provider' | 'modelId' | 'user')[]
}

// Filter Interface
export interface ExtractionUsageFilterApi {
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  provider?: string
  modelId?: string
  status?: ExtractionOperationStatus
  userId?: string
  tag?: string
  apiKeyId?: string
  groupBy?: ('day' | 'month' | 'year' | 'tag' | 'apiKey' | 'provider' | 'modelId' | 'user')[]
  sort?: string // Sortierfeld
  order?: 'asc' | 'desc' // Sortierreihenfolge
}

// Response Types
export interface ExtractionUsagePageResponse {
  data: ExtractionUsageRecord[]
  pagination: PaginationInfo
}

export interface ExtractionUsageSummaryPageResponse {
  data: ExtractionUsageSummaryRecord[]
  pagination: PaginationInfo
}

// Aggregation
export interface ExtractionUsageAggregation {
  totalOperations: number
  totalPages: number
  averageConfidence: number
  totalCost: number
  uniqueUsers: number
  uniqueProviders: number
  uniqueModels: number
  operationsByStatus: {
    [status in ExtractionOperationStatus]?: number
  }
  averagePagesPerOperation: number
  averageCostPerOperation: number
}
