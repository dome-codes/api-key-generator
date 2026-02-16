/**
 * Extraction Usage API Functions
 * 
 * API-Funktionen für Document Intelligence / Extraction Usage
 * Parallel zu den AI Usage API-Funktionen strukturiert
 */

import api from '@/axios/api'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type {
  ExtractionUsageGetV1Params,
  ExtractionUsageSummaryGetV1Params,
  ExtractionUsageGetV1ParamsExtended,
  ExtractionUsageSummaryGetV1ParamsExtended,
  ExtractionUsagePageResponse,
  ExtractionUsageSummaryPageResponse,
} from '../types/extraction'

/**
 * Returns the usage of the extraction service.
 * @summary Tracks the usage of the Extraction service
 */
export const extractionUsageGetV1 = <TData = AxiosResponse<ExtractionUsagePageResponse>>(
  params?: ExtractionUsageGetV1Params,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.get('/usage/extraction', {
    ...options,
    params: { ...params, ...options?.params },
  })
}

/**
 * Returns the extraction usage summary grouped by specified parameters.
 * @summary Returns the extraction usage summary
 */
export const extractionUsageSummaryGetV1 = <TData = AxiosResponse<ExtractionUsageSummaryPageResponse>>(
  params?: ExtractionUsageSummaryGetV1Params,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  // Konvertiere by array zu comma-separated string falls vorhanden
  const apiParams = params?.by
    ? { ...params, by: params.by.join(',') }
    : params

  return api.get('/usage/extraction/summarize', {
    ...options,
    params: { ...apiParams, ...options?.params },
  })
}

/**
 * Returns all extraction usage data (Admin endpoint).
 * @summary Tracks the usage of the Extraction service (Admin)
 */
export const adminExtractionUsageGetV1 = <TData = AxiosResponse<ExtractionUsagePageResponse>>(
  params?: ExtractionUsageGetV1Params,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.get('/admin/usage/extraction', {
    ...options,
    params: { ...params, ...options?.params },
  })
}

/**
 * Returns the extraction usage summary for all users (Admin endpoint).
 * @summary Returns the extraction usage summary (Admin)
 */
export const adminExtractionUsageSummaryGetV1 = <TData = AxiosResponse<ExtractionUsageSummaryPageResponse>>(
  params?: ExtractionUsageSummaryGetV1Params,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  // Konvertiere by array zu comma-separated string falls vorhanden
  const apiParams = params?.by
    ? { ...params, by: params.by.join(',') }
    : params

  return api.get('/admin/usage/extraction/summarize', {
    ...options,
    params: { ...apiParams, ...options?.params },
  })
}

// ============================================
// ERWEITERTE API-FUNKTIONEN MIT SERVER-SIDE FILTERING & PAGINATION
// ============================================

/**
 * Returns the usage of the extraction service with server-side filtering and pagination.
 * @summary Tracks the usage of the Extraction service (Extended with pagination)
 */
export const extractionUsageGetV1Extended = <TData = AxiosResponse<ExtractionUsagePageResponse>>(
  params?: ExtractionUsageGetV1ParamsExtended,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.get('/usage/extraction', {
    ...options,
    params: { ...params, ...options?.params },
  })
}

/**
 * Returns the extraction usage summary with server-side filtering, grouping and pagination.
 * @summary Returns the extraction usage summary (Extended with pagination)
 */
export const extractionUsageSummaryGetV1Extended = <TData = AxiosResponse<ExtractionUsageSummaryPageResponse>>(
  params?: ExtractionUsageSummaryGetV1ParamsExtended,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  // Konvertiere by array zu comma-separated string falls vorhanden
  const apiParams = params?.by
    ? { ...params, by: params.by.join(',') }
    : params

  return api.get('/usage/extraction/summarize', {
    ...options,
    params: { ...apiParams, ...options?.params },
  })
}

/**
 * Returns all extraction usage data with server-side filtering and pagination (Admin endpoint).
 * @summary Tracks the usage of the Extraction service (Admin, Extended with pagination)
 */
export const adminExtractionUsageGetV1Extended = <TData = AxiosResponse<ExtractionUsagePageResponse>>(
  params?: ExtractionUsageGetV1ParamsExtended,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.get('/admin/usage/extraction', {
    ...options,
    params: { ...params, ...options?.params },
  })
}

/**
 * Returns the extraction usage summary for all users with server-side filtering, grouping and pagination (Admin endpoint).
 * @summary Returns the extraction usage summary (Admin, Extended with pagination)
 */
export const adminExtractionUsageSummaryGetV1Extended = <TData = AxiosResponse<ExtractionUsageSummaryPageResponse>>(
  params?: ExtractionUsageSummaryGetV1ParamsExtended,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  // Konvertiere by array zu comma-separated string falls vorhanden
  const apiParams = params?.by
    ? { ...params, by: params.by.join(',') }
    : params

  return api.get('/admin/usage/extraction/summarize', {
    ...options,
    params: { ...apiParams, ...options?.params },
  })
}

// Export types for convenience
export type {
  ExtractionUsageGetV1Params,
  ExtractionUsageSummaryGetV1Params,
  ExtractionUsageGetV1ParamsExtended,
  ExtractionUsageSummaryGetV1ParamsExtended,
}
