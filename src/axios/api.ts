import { getToken, whenKeycloakInit } from '@/auth/keycloak'
import appConfig from '@root/app.config.js'
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

// Debug-Log-Funktion (nur im Debug-Modus)
const debugLog = (...args: unknown[]) => {
  const isDevelopment = import.meta.env.DEV
  const debugFromEnv = import.meta.env.VITE_SHOW_DEBUG === 'true'
  const debugFromLocalStorage = localStorage.getItem('debug') === 'true'
  const showDebugMode = isDevelopment && (debugFromEnv || debugFromLocalStorage)
  if (showDebugMode) {
    console.log(...args)
  }
}

// Axios-Instanz erstellen
const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 10000,
})

// Request-Interceptor: immer erst Keycloak-Init abwarten, dann Token (api.ts 76 nie vor keycloak.ts 147)
api.interceptors.request.use(
  async (config) => {
    try {
      await whenKeycloakInit
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
        await whenKeycloakInit
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
