import { getToken } from '@/auth/keycloak'
import appConfig from '@root/app.config.js'
import axios from 'axios'

// Debug-Log-Funktion (nur im Debug-Modus)
const debugLog = (...args: any[]) => {
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

// Request-Interceptor für JWT-Token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        debugLog('🔐 JWT Token für Request hinzugefügt:', {
          url: config.url,
          method: config.method,
          hasToken: !!token,
        })
      }
    } catch (error) {
      debugLog('Fehler beim Token-Abruf:', error)
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
        const token = await getToken()
        if (token) {
          // Request mit neuem Token wiederholen
          const originalRequest = error.config
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        debugLog('Token-Erneuerung fehlgeschlagen:', refreshError)
      }
    }
    return Promise.reject(error)
  },
)

export default api
