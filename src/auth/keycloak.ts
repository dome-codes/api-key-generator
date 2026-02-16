import appConfig from '@root/app.config.js'
import Keycloak from 'keycloak-js'

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

// Keycloak-Konfiguration aus zentraler appConfig.js (env-basiert möglich)
const keycloakConfig = {
  url: appConfig.keycloakUrl,
  realm: appConfig.keycloakRealm,
  clientId: appConfig.keycloakClientId,
}

// Gruppennamen kommen direkt über ENV/Helm-Chart (maximale Flexibilität)
export const ADMIN_GROUP_NAME =
  import.meta.env.VITE_ADMIN_GROUP_NAME || 'G_APPL_DEKARAG_API_ADMIN'
export const USER_GROUP_NAME =
  import.meta.env.VITE_USER_GROUP_NAME || 'G_APPL_DEKARAG_ENTWICKLUNG'
export const TECHNICAL_GROUP_NAME =
  import.meta.env.VITE_TECHNICAL_GROUP_NAME || 'G_APPL_DEKARAG_API_DEFAULT'

// Statisches Enum für die Rollenlogik
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  TECHNICAL = 'TECHNICAL',
  NONE = 'NONE',
}

// Feature-/Permission-Mapping pro Rolle - einfach erweiterbar
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: {
    canUseAdminFeatures: true,
    canCreateKeys: true,
    canSeeOwnUsage: true,
  },
  [UserRole.USER]: {
    canUseAdminFeatures: false,
    canCreateKeys: true,
    canSeeOwnUsage: true,
  },
  [UserRole.TECHNICAL]: {
    canUseAdminFeatures: false,
    canCreateKeys: false,
    canSeeOwnUsage: true,
  },
  [UserRole.NONE]: {
    canUseAdminFeatures: false,
    canCreateKeys: false,
    canSeeOwnUsage: false,
  },
}

// Keycloak-Instanz erstellen
const keycloak = new Keycloak(keycloakConfig)

let keycloakInitialized = false

/** Wird aufgelöst, sobald initKeycloak() einmal durchgelaufen ist. */
let _resolveWhenKeycloakInit: () => void
export const whenKeycloakInit = new Promise<void>((resolve) => {
  _resolveWhenKeycloakInit = resolve
})

/**
 * Wird erst aufgelöst, wenn die App den Token geholt und gespeichert hat (AuthGuard nach getToken()).
 * api.ts wartet darauf – so laufen ai/apikey/summarize-Calls nie vor dem Token.
 */
let _resolveTokenReadyForApi: () => void
export const whenTokenReadyForApi = new Promise<void>((resolve) => {
  _resolveTokenReadyForApi = resolve
})
export function setTokenReadyForApi(): void {
  _resolveTokenReadyForApi?.()
}

// URL nach Authentifizierung bereinigen
const cleanupUrl = () => {
  if (window.location.hash || window.location.search) {
    const cleanUrl = window.location.pathname
    window.history.replaceState({}, document.title, cleanUrl)
    debugLog('URL bereinigt:', cleanUrl)
  }
}

// Keycloak-Bypass nur wenn explizit gewünscht (VITE_BYPASS_KEYCLOAK=true).
// Bei 'false' oder nicht gesetzt: Keycloak immer nutzen, alten localStorage-Bypass löschen.
const shouldBypassKeycloak = (): boolean => {
  const envValue = import.meta.env.VITE_BYPASS_KEYCLOAK
  if (envValue === 'false' || envValue === '') {
    localStorage.removeItem('bypassKeycloak')
    return false
  }
  if (envValue === 'true' && import.meta.env.DEV) {
    return true
  }
  // Nicht gesetzt: Keycloak nutzen (kein Bypass)
  if (envValue === undefined) {
    localStorage.removeItem('bypassKeycloak')
    return false
  }
  return false
}

// Mock-Token für Development-Bypass
const createMockToken = () => {
  const mockTokenData = {
    sub: 'mock-user-123',
    email: 'mock-admin@example.com',
    name: 'Mock Admin User',
    family_name: 'User',
    given_name: 'Mock Admin',
    preferred_username: 'mock-admin',
    groups: [ADMIN_GROUP_NAME],
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 Stunde gültig
  }

  // Erstelle Mock-Token (nur für Frontend, Backend akzeptiert auch ohne echten Token)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify(mockTokenData))
  const signature = 'mock-signature'
  return `${header}.${payload}.${signature}`
}

// Keycloak initialisieren
export const initKeycloak = async (): Promise<boolean> => {
  debugLog('Starte Keycloak-Initialisierung...')

  if (keycloakInitialized) {
    _resolveWhenKeycloakInit?.()
    return true
  }

  // Bypass für Development
  if (shouldBypassKeycloak()) {
    debugLog('🔓 Keycloak-Bypass aktiviert für Development')
    const mockToken = createMockToken()
    const tokenPayload = JSON.parse(atob(mockToken.split('.')[1]))

    keycloak.token = mockToken
    keycloak.tokenParsed = tokenPayload
    keycloak.authenticated = true
    keycloak.idToken = mockToken
    keycloak.idTokenParsed = tokenPayload

    keycloakInitialized = true
    debugLog('🔓 Mock-Token gesetzt:', {
      name: tokenPayload.name,
      email: tokenPayload.email,
      preferred_username: tokenPayload.preferred_username,
      groups: tokenPayload.groups,
    })
    _resolveWhenKeycloakInit?.()
    return true
  }

  try {
    const initOptions: Parameters<typeof keycloak.init>[0] = {
      onLoad: 'login-required',
      checkLoginIframe: false,
      enableLogging: true,
      pkceMethod: 'S256',
    }
    const scope = (appConfig as { keycloakScope?: string }).keycloakScope
    if (scope) {
      initOptions.scope = scope
      debugLog('Keycloak Scope angefordert:', scope)
    }
    const authenticated = await keycloak.init(initOptions)

    keycloakInitialized = true
    debugLog('Keycloak initialisiert!', authenticated)

    if (authenticated) {
      cleanupUrl()
    }
    _resolveWhenKeycloakInit?.()
    return authenticated
  } catch (error) {
    console.error('Fehler bei Keycloak-Initialisierung!', error)
    _resolveWhenKeycloakInit?.()
    return false
  }
}

// Token-Cache in sessionStorage (nur bei Ablauf refreshen)
const TOKEN_STORAGE_KEY = 'keycloak_token'
const TOKEN_VALIDITY_BUFFER_SEC = 30 // Refresh, wenn weniger als 30s Restlaufzeit

const getTokenFromStorage = (): { token: string; exp: number } | null => {
  try {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { token: string; exp: number }
    if (!data.token || typeof data.exp !== 'number') return null
    return data
  } catch {
    return null
  }
}

const setTokenInStorage = (token: string, exp: number): void => {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ token, exp }))
  } catch (_) {
    // Quota oder private mode
  }
}

export const clearTokenStorage = (): void => {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch (_) {}
}

// Token-Handling: zuerst aus Storage, nur bei Ablauf Keycloak-Refresh
export const getToken = async (): Promise<string | null> => {
  // Bypass für Development
  if (shouldBypassKeycloak()) {
    return keycloak.token || createMockToken()
  }

  try {
    const cached = getTokenFromStorage()
    const nowSec = Math.floor(Date.now() / 1000)
    if (cached && cached.exp > nowSec + TOKEN_VALIDITY_BUFFER_SEC) {
      debugLog('Token aus sessionStorage (noch gültig)')
      return cached.token
    }

    debugLog('Token abgelaufen oder nicht im Storage, erneuere...')
    await keycloak.updateToken(TOKEN_VALIDITY_BUFFER_SEC)
    const token = keycloak.token || null
    const exp = keycloak.tokenParsed?.exp
    if (token && typeof exp === 'number') {
      setTokenInStorage(token, exp)
    }
    debugLog('Aktuelles Token:', token ? '(gespeichert)' : null)
    return token
  } catch (error) {
    console.error('Fehler beim Token-Update:', error)
    clearTokenStorage()
    return null
  }
}

// Benutzerinformationen aus Keycloak
export const getUserInfo = () => {
  debugLog('Token parsed:', keycloak.tokenParsed)
  return keycloak.tokenParsed
}

// Höchste Rolle des Benutzers abrufen
export function getHighestRole(): UserRole {
  if (!keycloak.tokenParsed) {
    debugLog('Kein tokenParsed verfügbar, gebe NONE zurück')
    return UserRole.NONE
  }

  const groups: string[] = keycloak.tokenParsed.groups || []
  debugLog('Vergleiche Gruppen:', groups, 'mit', ADMIN_GROUP_NAME, USER_GROUP_NAME, TECHNICAL_GROUP_NAME)

  if (groups.includes(ADMIN_GROUP_NAME)) {
    return UserRole.ADMIN
  } else if (groups.includes(USER_GROUP_NAME)) {
    return UserRole.USER
  } else if (groups.includes(TECHNICAL_GROUP_NAME)) {
    return UserRole.TECHNICAL
  }

  debugLog('Keine relevante Gruppe gefunden, gebe NONE zurück')
  return UserRole.NONE
}

// Berechtigung prüfen
export const hasPermission = (
  permission: keyof (typeof ROLE_PERMISSIONS)[UserRole],
): boolean => {
  const userRole = getHighestRole()
  const permitted = ROLE_PERMISSIONS[userRole][permission] || false
  debugLog(`Prüfe Permission "${permission}" für Rolle "${userRole}": ${permitted}`)
  return permitted
}

/**
 * True, wenn der Nutzer eine gültige App-Identität hat (Token + bekannte Rolle).
 * „Unbekannter Nutzer“ / keine Rolle → false → Weiterleitung zu Nicht autorisiert.
 */
export const hasValidAppUser = (): boolean => {
  if (shouldBypassKeycloak()) return true
  if (!keycloak.tokenParsed) return false
  return getHighestRole() !== UserRole.NONE
}

// Restliche Hilfsfunktionen (z.B. userid, userEmail, debugToken)
export const getUserId = (): string | null => keycloak.tokenParsed?.sub || null
export const getUserEmail = (): string | null => keycloak.tokenParsed?.email || null

// Debug-Funktion für Token-Analyse
export const debugToken = () => {
  if (!keycloak.tokenParsed) {
    debugLog('⚠️ Kein Token verfügbar')
    return
  }

  debugLog('Raw tokenParsed:', keycloak.tokenParsed)
  debugLog('Available keys:', Object.keys(keycloak.tokenParsed))
  debugLog('sub:', keycloak.tokenParsed.sub)
  debugLog('email:', keycloak.tokenParsed.email)
  debugLog('groups:', keycloak.tokenParsed.groups)
}

/** Leitet den Browser zur Keycloak-Login-Oberfläche weiter (kein Redirect im Bypass-Modus). */
export const redirectToKeycloakLogin = (): void => {
  if (shouldBypassKeycloak()) return
  try {
    const k = keycloak as { login?: () => void }
    if (k != null && typeof k.login === 'function') {
      k.login()
    }
  } catch (_) {
    console.error('Redirect zu Keycloak Login fehlgeschlagen')
  }
}

// Keycloak Instanz (default) exportieren
export { keycloak }
export default keycloak
