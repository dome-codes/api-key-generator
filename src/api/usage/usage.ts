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

// ============================================
// ERWEITERTE API-FUNKTIONEN MIT SERVER-SIDE FILTERING & PAGINATION
// ============================================

import type {
  UsageAIGetV1ParamsExtended,
  UsageAISummaryGetV1ParamsExtended,
  AdminUsageAISummaryGetV1ParamsExtended,
  UsagePageResponse,
  SummaryUsagePageResponse,
} from '../types/types'

/**
 * Returns the usage in terms of tokens per model per time period with server-side filtering and pagination.
 * @summary Tracks the usage of the AI service (Extended with pagination)
 */
export const usageAIGetV1Extended = <TData = AxiosResponse<UsagePageResponse>>(
  params?: UsageAIGetV1ParamsExtended,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.get('/usage/ai', {
    ...options,
    params: { ...params, ...options?.params },
  })
}

/**
 * Returns the usage summary with server-side filtering, grouping and pagination.
 * @summary Returns the usage summary (Extended with pagination)
 */
export const usageAISummaryGetV1Extended = <TData = AxiosResponse<SummaryUsagePageResponse>>(
  params?: UsageAISummaryGetV1ParamsExtended,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  // Konvertiere by array zu comma-separated string falls vorhanden
  const apiParams = params?.by
    ? { ...params, by: params.by.join(',') }
    : params

  return api.get('/usage/ai/summarize', {
    ...options,
    params: { ...apiParams, ...options?.params },
  })
}

/**
 * Returns the usage summary for all users with server-side filtering, grouping and pagination (Admin endpoint).
 * @summary Returns the usage summary (Extended with pagination)
 */
export const adminUsageAISummaryGetV1Extended = <TData = AxiosResponse<SummaryUsagePageResponse>>(
  params?: AdminUsageAISummaryGetV1ParamsExtended,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  // Konvertiere by array zu comma-separated string falls vorhanden
  const apiParams = params?.by
    ? { ...params, by: params.by.join(',') }
    : params

  return api.get('/admin/usage/ai/summarize', {
    ...options,
    params: { ...apiParams, ...options?.params },
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
  UsageAIGetV1ParamsExtended,
  UsageAISummaryGetV1ParamsExtended,
  AdminUsageAISummaryGetV1ParamsExtended,
}
