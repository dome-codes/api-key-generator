import { getToken, whenTokenReadyForApi } from '@/auth/keycloak'
import { debugLog } from '@/utils/debugLog'
import appConfig from '@root/app.config.js'
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

// Base-URL immer mit /v1 (OpenAPI server url), damit alle Routes (/apikeys, /usage/ai, …) korrekt angebunden sind
// Wichtig: Orval generiert URLs wie '/usage/ai' (relativ), daher muss baseURL /v1 enthalten
// Verhindert /v1/v1: Wenn apiBaseUrl bereits /v1 enthält (am Ende), nicht nochmal anhängen
const rawBase = (appConfig.apiBaseUrl || '').trim()
// Entferne trailing slash für saubere Prüfung
const baseWithoutTrailingSlash = rawBase.replace(/\/+$/, '')
// Prüfe ob bereits /v1 am Ende vorhanden ist (nach Entfernen von trailing slashes)
const baseURL = baseWithoutTrailingSlash.endsWith('/v1')
  ? baseWithoutTrailingSlash
  : `${baseWithoutTrailingSlash || ''}/v1`

/** Query-Params: Nur & und = escapen, damit usage/ai und summarize so aussehen: .../usage/ai?from_date=2026-01-31T00:00:00.000Z (kein %3A). */
function serializeParams(params: Record<string, unknown>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([key, value]) => {
      const str = Array.isArray(value) ? value.join(',') : String(value)
      const safeValue = str.replace(/&/g, '%26').replace(/=/g, '%3D')
      return `${encodeURIComponent(key)}=${safeValue}`
    })
    .join('&')
}

const api = axios.create({
  baseURL,
  timeout: 10000,
  paramsSerializer: (params) => serializeParams(params ?? {}),
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

/** Zeigt bei 500-Fehlern eine Meldung mit Tracing-ID an (Objekt mit error/code vom Backend). */
function showServerErrorWithTracingId(data: unknown): void {
  if (typeof window === 'undefined') return
  const obj = data && typeof data === 'object' ? (data as { error?: string; code?: string }) : null
  const tracingId = obj?.error ?? obj?.code ?? '–'

  const overlay = document.createElement('div')
  overlay.setAttribute('role', 'alert')
  overlay.setAttribute('aria-live', 'assertive')
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.5); font-family: system-ui, sans-serif;
  `
  const box = document.createElement('div')
  box.style.cssText = `
    background: #fff; padding: 1.5rem; border-radius: 8px; max-width: 420px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    border-left: 4px solid #dc2626;
  `
  box.innerHTML = `
    <p style="margin: 0 0 0.75rem; font-weight: 600; color: #1f2937;">Ups, hier ist etwas schief gelaufen.</p>
    <p style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #4b5563;">Bitte kopieren Sie die folgende Tracing-ID und schicken Sie sie Ihrem Administrator:</p>
    <code id="axios-tracing-id" style="display: block; padding: 0.5rem; background: #f3f4f6; border-radius: 4px; font-size: 0.85rem; word-break: break-all; margin-bottom: 1rem;">${escapeHtml(String(tracingId))}</code>
    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
      <button type="button" id="axios-tracing-copy" style="padding: 0.5rem 1rem; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">Kopieren</button>
      <button type="button" id="axios-tracing-close" style="padding: 0.5rem 1rem; background: #6b7280; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">Schließen</button>
    </div>
  `
  overlay.appendChild(box)

  const close = () => {
    overlay.remove()
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })

  const copyBtn = box.querySelector('#axios-tracing-copy')
  const codeEl = box.querySelector('#axios-tracing-id')
  if (copyBtn && codeEl?.textContent) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText(codeEl.textContent ?? '').then(
        () => {
          ;(copyBtn as HTMLButtonElement).textContent = 'Kopiert!'
          setTimeout(() => {
            ;(copyBtn as HTMLButtonElement).textContent = 'Kopieren'
          }, 2000)
        },
        () => close(),
      )
    })
  }
  box.querySelector('#axios-tracing-close')?.addEventListener('click', close)

  document.body.appendChild(overlay)
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

// Response-Interceptor: 401 Token erneuern; 403 einmal mit frischem Token wiederholen; 500 Meldung mit Tracing-ID
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const config = error.config
    const isRetry = config?.__retry403 === true

    if (status === 401) {
      debugLog('Token abgelaufen, versuche Erneuerung...')
      try {
        await whenTokenReadyForApi
        const token = await getToken()
        if (token && config) {
          config.headers.Authorization = `Bearer ${token}`
          return api(config)
        }
      } catch (refreshError) {
        debugLog('❌ Token-Erneuerung fehlgeschlagen:', refreshError)
      }
    } else if (status === 403 && config && !isRetry) {
      debugLog('403 Forbidden – ein Retry mit frischem Token')
      try {
        await whenTokenReadyForApi
        const token = await getToken()
        if (token) {
          config.__retry403 = true
          config.headers.Authorization = `Bearer ${token}`
          return api(config)
        }
      } catch {
        void 0 // ignore refresh failure, reject with original error
      }
    } else if (status >= 500 && status < 600) {
      const data = error.response?.data
      showServerErrorWithTracingId(data)
    }

    return Promise.reject(error)
  },
)

// Orval Mutator-Funktion (Default Export für Orval)
// Diese Funktion wird von Orval verwendet, um API-Calls zu machen
const orvalMutator = async <T = unknown, D = unknown>(
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
