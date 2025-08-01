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
  tokensIn?: number
  tokensOut?: number
  totalTokens?: number
}

export interface UsageResponse {
  from_date?: string
  to_date: number
  technicalUserId?: number
  usage?: ModelUsage[]
}
export type ModelUsageType = (typeof ModelUsageType)[keyof typeof ModelUsageType]
export const ModelUsageType = {
  CompletionModelUsage: 'CompletionModelUsage',
  EmbeddingModelUsage: 'EmbeddingModelUsage',
  ImageModelUsage: 'ImageModelUsage',
}
export interface SummaryUsage {
  type?: ModelUsageType
  requests?: number
  technicalUSerid?: string
  model?: string
  tag: string
  day?: number
  month?: number
  year?: number
  tokensIn?: number
  tokensOut?: number
  totalTokens?: number
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
