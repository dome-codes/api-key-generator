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

    return true
  }

  try {
    const authenticated = await keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: false,
      enableLogging: true,
      pkceMethod: 'S256',
    })

    keycloakInitialized = true
    debugLog('Keycloak initialisiert!', authenticated)

    if (authenticated) {
      cleanupUrl()
    }

    return authenticated
  } catch (error) {
    console.error('Fehler bei Keycloak-Initialisierung!', error)
    return false
  }
}

// Token-Handling
export const getToken = async (): Promise<string | null> => {
  // Bypass für Development
  if (shouldBypassKeycloak()) {
    return keycloak.token || createMockToken()
  }

  try {
    debugLog('Token wird erneuert (min 30s gültig)...')
    await keycloak.updateToken(30)
    debugLog('Aktuelles Token:', keycloak.token)
    return keycloak.token || null
  } catch (error) {
    console.error('Fehler beim Token-Update:', error)
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

// Keycloak Instanz (default) exportieren
export { keycloak }
export default keycloak
