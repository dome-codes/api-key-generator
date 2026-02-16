import { getToken, whenTokenReadyForApi } from '@/auth/keycloak'
import appConfig from '@root/app.config.js'
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

// Debug-Log (nur im Debug-Modus); kein import.meta hier, damit Orval in Node laufen kann
const debugLog = (...args: unknown[]) => {
  try {
    const showDebug = (appConfig as { showDebug?: boolean }).showDebug
    const fromStorage = typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true'
    if (showDebug || fromStorage) console.log(...args)
  } catch (_) {}
}

// Base-URL immer mit /v1 (OpenAPI server url), damit alle Routes (/apikeys, /usage/ai, …) korrekt angebunden sind
const rawBase = appConfig.apiBaseUrl || ''
const baseURL = rawBase.endsWith('/v1') ? rawBase : rawBase.replace(/\/?$/, '') + '/v1'

const api = axios.create({
  baseURL,
  timeout: 10000,
})

// Request-Interceptor: warten bis Token von AuthGuard geholt wurde, dann erst Request (kein ai/apikey/summarize vor Token)
api.interceptors.request.use(
  async (config) => {
    try {
      await whenTokenReadyForApi
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        debugLog('🔐 JWT Token für Request hinzugefügt:', {
          url: config.url,
          method: config.method,
          hasToken: !!token,
        })
      } else {
        debugLog('⚠️ Kein JWT Token verfügbar für Request:', config.url)
      }
    } catch (error) {
      debugLog('❌ Fehler beim Token-Abruf:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response-Interceptor für Token-Erneuerung
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    if (error.response?.status === 401) {
      debugLog('Token abgelaufen, versuche Erneuerung...')
      try {
        await whenTokenReadyForApi
        const token = await getToken()
        if (token && error.config) {
          // Request mit neuem Token wiederholen
          const originalRequest = error.config
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        debugLog('❌ Token-Erneuerung fehlgeschlagen:', refreshError)
      }
    }
    return Promise.reject(error)
  },
)

// Orval Mutator-Funktion (Default Export für Orval)
// Diese Funktion wird von Orval verwendet, um API-Calls zu machen
const orvalMutator = async <T = any, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<AxiosResponse<T>> => {
  return api.request<T, AxiosResponse<T>, D>(config)
}

// Default-Export: Orval Mutator (wird von Orval verwendet)
export default orvalMutator

// Named Export: Axios-Instanz für direkte Nutzung
export { api }

// Named Export: Orval Mutator (für Kompatibilität)
export { orvalMutator }

// TypeScript-Typen exportieren
export type { AxiosRequestConfig, AxiosResponse }
