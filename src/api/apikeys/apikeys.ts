import api from '@/axios/api'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type {
  CreateApiKeyV1Result,
  DeactivateKeyV1Result,
  GetAllApiKeysV1Result,
  GetApiKeyV1Result,
  MobaRagApiKey,
  MobaRagApiKeyRequest,
  MobaRagApiKeyWithSecret,
  RotateKeyV1Result,
} from '../types/types'

/**
 * Create a new API token
 * @summary Create a new API token
 */
const createApiKeyV1 = <TData = AxiosResponse<MobaRagApiKeyWithSecret>>(
  mobaRagApiKeyRequest: MobaRagApiKeyRequest,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.post('/apikeys', mobaRagApiKeyRequest, options)
}

/**
 * List all API tokens for the current user
 * @summary List all API tokens for the current user
 */
const getAllApiKeysV1 = <TData = AxiosResponse<MobaRagApiKey[]>>(
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.get('/apikeys', options)
}

/**
 * Get a single API token by ID
 * @summary Get a single API token by ID
 */
const getApiKeyV1 = <TData = AxiosResponse<MobaRagApiKey>>(
  id: string,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.get(`/apikeys/${id}`, options)
}

/**
 * Rotate an API token (deactivates old, creates new)
 * @summary Rotate an API token (deactivates old, creates new)
 * @description Deactivates the given API token and creates a new one with the provided parameters.
 */
const rotateKeyV1 = <TData = AxiosResponse<MobaRagApiKeyWithSecret>>(
  id: string,
  mobaRagApiKeyRequest: MobaRagApiKeyRequest,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.post(`/apikeys/${id}/rotate`, mobaRagApiKeyRequest, options)
}

/**
 * Deactivate an API token
 * @summary Deactivate an API token
 */
const deactivateKeyV1 = <TData = AxiosResponse<void>>(
  id: string,
  options?: AxiosRequestConfig,
): Promise<TData> => {
  return api.put(`/apikeys/${id}/deactivate`, undefined, options)
}

// Orval-style return object
const apikeysApi = {
  createApiKeyV1,
  getAllApiKeysV1,
  getApiKeyV1,
  rotateKeyV1,
  deactivateKeyV1,
}

export default apikeysApi

// Export types for convenience
export type {
  CreateApiKeyV1Result,
  DeactivateKeyV1Result,
  GetAllApiKeysV1Result,
  GetApiKeyV1Result,
  MobaRagApiKeyRequest,
  RotateKeyV1Result,
}
