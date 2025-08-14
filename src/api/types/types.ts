// API Key Types
export interface MobaRagApiKeyRequest {
  name: string
  permissions: string[]
}

export interface MobaRagApiKey {
  id: string
  name: string
  permissions: string[]
  created_at: string
  expires_at: string | null
  is_active: boolean
}

export interface MobaRagApiKeyWithSecret extends MobaRagApiKey {
  secret: string
}

// Usage Types
export interface ModelUsage {
  type?: ModelUsageType
  tag?: string
  model?: string
  createDate?: string
}

export interface UsageResponse {
  from_date?: string
  to_date: number
  technicalUserId?: number
  usage?: ModelUsage[]
}
export const CompletionModelUsageType = {
  CompletionModelUsage: 'CompletionModelUsage',
}
export const EmbeddingModelUsageType = {
  EmbeddingModelUsage: 'EmbeddingModelUsage',
}
export const ImageModelUsageType = {
  ImageModelUsage: 'ImageModelUsage',
}
export type EmbeddingModelUsageType =
  (typeof EmbeddingModelUsageType)[keyof typeof EmbeddingModelUsageType]

export type CompletionModelUsageType =
  (typeof CompletionModelUsageType)[keyof typeof CompletionModelUsageType]

export type ImageModelUsageType = (typeof ImageModelUsageType)[keyof typeof ImageModelUsageType]
export const ImageModelUsageQuality = { standard: 'standard', hd: 'hd' }

export type ImageModelUsageQuality =
  (typeof ImageModelUsageQuality)[keyof typeof ImageModelUsageQuality]

export type ModelUsageType = (typeof ModelUsageType)[keyof typeof ModelUsageType]

export type CompletionModelUsage = Omit<ModelUsage, 'type'> & {
  requestTokens?: number
  responseTokens?: number
  type: CompletionModelUsageType
}
export type EmbeddingModelUsage = Omit<ModelUsage, 'type'> & {
  requestTokens?: number
  type: EmbeddingModelUsageType
}

export type ImageModelUsage = Omit<ModelUsage, 'type'> & {
  sizeWidth?: number
  sizeHeight?: number
  quality?: ImageModelUsageQuality
  type: ImageModelUsageType
}

export const ModelUsageType = {
  CompletionModelUsage: 'CompletionModelUsage',
  EmbeddingModelUsage: 'EmbeddingModelUsage',
  ImageModelUsage: 'ImageModelUsage',
}
export interface SummaryUsage {
  type?: ModelUsageType
  requests?: number
  technicalUserId?: string
  model?: string
  tag: string
  day?: number
  month?: number
  year?: number
}
export interface SummaryUsageResponse {
  from_date?: string
  to_date?: string
  usage?: SummaryUsage[]
}

// API Parameters
export interface UsageAIGetV1Params {
  from_date?: string
  to_date?: string
  model?: string
  technicalUserId?: string
}

export interface UsageAISummaryGetV1Params {
  from_date?: string
  to_date?: string
  by?: string
  model?: string
  technicalUserId?: string
}

export interface AdminUsageAISummaryGetV1Params {
  from_date?: string
  to_date?: string
  by?: string
  model?: string
  technicalUserId?: string
}

// API Response Types
export interface CreateApiKeyV1Result {
  data: MobaRagApiKeyWithSecret
}

export interface GetAllApiKeysV1Result {
  data: MobaRagApiKey[]
}

export interface GetApiKeyV1Result {
  data: MobaRagApiKey
}

export interface RotateKeyV1Result {
  data: MobaRagApiKeyWithSecret
}

export interface DeactivateKeyV1Result {
  data: void
}

export interface UsageAIGetV1Result {
  data: UsageResponse
}

export interface UsageAISummaryGetV1Result {
  data: SummaryUsageResponse
}

export interface AdminUsageAISummaryGetV1Result {
  data: SummaryUsageResponse
}

// Erweiterte Typen basierend auf bestehenden API-Responses
export interface EnhancedUsageRecord {
  technicalUserId: string
  technicalUserName: string
  modelName: string
  modelType: ModelUsageType
  // Backend sendet 'type' zurück, nicht 'modelType'
  type?: ModelUsageType
  requests: number
  tokensIn: number
  tokensOut: number
  totalTokens: number
  cost: number
  tag: string
  day?: number
  month?: number
  year?: number
  createDate?: string
}

export interface UsageFilter {
  fromDate?: string
  toDate?: string
  modelType?: ModelUsageType
  technicalUserIds?: string[]
  groupBy?: 'day' | 'week' | 'month' | 'user' | 'model'
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
}

export interface UsageChartData {
  date: string
  requests: number
  tokensIn: number
  tokensOut: number
  totalTokens: number
  cost: number
  users: number
  models: number
}

export interface UserUsageSummary {
  technicalUserId: string
  technicalUserName: string
  totalRequests: number
  totalTokensIn: number
  totalTokensOut: number
  totalTokens: number
  totalCost: number
  modelBreakdown: {
    [modelName: string]: {
      requests: number
      tokensIn: number
      tokensOut: number
      totalTokens: number
      cost: number
      tag: string
    }
  }
}

export interface ModelUsageSummary {
  modelName: string
  modelType: ModelUsageType
  totalRequests: number
  totalTokensIn: number
  totalTokensOut: number
  totalTokens: number
  totalCost: number
  userBreakdown: {
    [userId: string]: {
      requests: number
      tokensIn: number
      tokensOut: number
      totalTokens: number
      cost: number
      tag: string
    }
  }
}
