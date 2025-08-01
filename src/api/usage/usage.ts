import api from '@/axios/api'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type {
  AdminUsageAISummaryGetV1Params,
  AdminUsageAISummaryGetV1Result,
  SummaryUsageResponse,
  UsageAIGetV1Params,
  UsageAIGetV1Result,
  UsageAISummaryGetV1Params,
  UsageAISummaryGetV1Result,
  UsageResponse,
} from '../types/types'

/**
 * Returns the usage in terms of tokens per model per time period.
 * @summary Tracks the usage of the AI service
 */
export const usageAIGetV1 = <TData = AxiosResponse<UsageResponse>>(
  params?: UsageAIGetV1Params,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.get('/usage/ai', {
    ...options,
    params: { ...params, ...options?.params },
  })
}

/**
 * Returns the usage summary by type, admin and cost factors
 * @summary Returns the usage summary by type, admin and cost factors
 */
export const usageAISummaryGetV1 = <TData = AxiosResponse<SummaryUsageResponse>>(
  params?: UsageAISummaryGetV1Params,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.get('/usage/ai/summarize', {
    ...options,
    params: { ...params, ...options?.params },
  })
}

/**
 * Returns the usage summary by type, admin and cost factors (Admin endpoint)
 * @summary Returns the usage summary by type, admin and cost factors
 */
export const adminUsageAISummaryGetV1 = <TData = AxiosResponse<SummaryUsageResponse>>(
  params?: AdminUsageAISummaryGetV1Params,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.get('/admin/usage/ai/summarize', {
    ...options,
    params: { ...params, ...options?.params },
  })
}

// Export types for convenience
export type {
  AdminUsageAISummaryGetV1Params,
  AdminUsageAISummaryGetV1Result,
  UsageAIGetV1Params,
  UsageAIGetV1Result,
  UsageAISummaryGetV1Params,
  UsageAISummaryGetV1Result,
}
