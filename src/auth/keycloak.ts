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

// Keycloak-Konfiguration
const keycloakConfig = {
  url: appConfig.keycloakUrl,
  realm: appConfig.keycloakRealm,
  clientId: appConfig.keycloakClientId,
}

// Rollen-Definitionen
export enum UserRole {
  API_DEFAULT = 'api-default',
  API_STREAM = 'api-stream',
  API_ADMIN = 'api-admin',
  ENTWICKLUNG = 'api-entwicklung',
}

// API-Berechtigungen pro Rolle
// Konsistente Namensgebung: can* für alle Berechtigungen
export const ROLE_PERMISSIONS = {
  [UserRole.API_DEFAULT]: {
    // API Key Management
    canViewOwnKeys: true,
    canCreateKeys: true,
    canEditOwnKeys: true,
    canDeactivateOwnKeys: true,
    canManageApiKeys: true, // Alias für canCreateKeys + canEditOwnKeys
    // Usage Viewing
    canViewOwnUsage: true,
    canSeeOwnUsage: true, // Alias für canViewOwnUsage
    canViewAdminUsage: false,
    canUseAdminFeatures: false, // Alias für canViewAdminUsage
    canViewExtractionUsage: true, // Neue Berechtigung für Extraction
    // User Management
    canManageUsers: false,
    // Analytics & Export
    canViewAnalytics: true,
    canExportData: true,
  },
  [UserRole.API_STREAM]: {
    // API Key Management
    canViewOwnKeys: true,
    canCreateKeys: true,
    canEditOwnKeys: true,
    canDeactivateOwnKeys: true,
    canManageApiKeys: true,
    // Usage Viewing
    canViewOwnUsage: true,
    canSeeOwnUsage: true,
    canViewAdminUsage: false,
    canUseAdminFeatures: false,
    canViewExtractionUsage: true,
    // User Management
    canManageUsers: false,
    // Analytics & Export
    canViewAnalytics: true,
    canExportData: true,
  },
  [UserRole.API_ADMIN]: {
    // API Key Management
    canViewOwnKeys: true,
    canCreateKeys: true,
    canEditOwnKeys: true,
    canDeactivateOwnKeys: true,
    canManageApiKeys: true,
    // Usage Viewing
    canViewOwnUsage: true,
    canSeeOwnUsage: true,
    canViewAdminUsage: true,
    canUseAdminFeatures: true,
    canViewExtractionUsage: true,
    // User Management
    canManageUsers: false, // Kann später erweitert werden
    // Analytics & Export
    canViewAnalytics: true,
    canExportData: true,
  },
  [UserRole.ENTWICKLUNG]: {
    // API Key Management
    canViewOwnKeys: true,
    canCreateKeys: true,
    canEditOwnKeys: true,
    canDeactivateOwnKeys: true,
    canManageApiKeys: true,
    // Usage Viewing
    canViewOwnUsage: true,
    canSeeOwnUsage: true,
    canViewAdminUsage: false,
    canUseAdminFeatures: false,
    canViewExtractionUsage: true,
    // User Management
    canManageUsers: false,
    // Analytics & Export
    canViewAnalytics: true,
    canExportData: true,
  },
}

// Keycloak-Instanz erstellen
const keycloak = new Keycloak(keycloakConfig)

// URL-Parameter nach der Authentifizierung bereinigen
const cleanupUrl = () => {
  if (window.location.hash.includes('state=') || window.location.search.includes('code=')) {
    // Entferne alle OAuth2-Parameter aus der URL
    const cleanUrl = window.location.pathname
    window.history.replaceState({}, document.title, cleanUrl)
    debugLog('URL bereinigt:', cleanUrl)
  }
}

// Keycloak-Bypass für Development (über Environment Variable)
const shouldBypassKeycloak = (): boolean => {
  const bypassFromEnv = import.meta.env.VITE_BYPASS_KEYCLOAK === 'true'
  const bypassFromLocalStorage = localStorage.getItem('bypassKeycloak') === 'true'
  return import.meta.env.DEV && (bypassFromEnv || bypassFromLocalStorage)
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
    groups: ['API-Admin'],
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
  // Bypass für Development
  if (shouldBypassKeycloak()) {
    debugLog('🔓 Keycloak-Bypass aktiviert für Development')
    // Setze Mock-Token
    const mockToken = createMockToken()
    const tokenPayload = JSON.parse(atob(mockToken.split('.')[1]))
    
    keycloak.token = mockToken
    keycloak.tokenParsed = tokenPayload
    keycloak.authenticated = true
    keycloak.idToken = mockToken
    keycloak.idTokenParsed = tokenPayload
    
    // Stelle sicher, dass userInfo verfügbar ist
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

    debugLog('Keycloak initialisiert:', authenticated)

    // URL nach erfolgreicher Authentifizierung bereinigen
    if (authenticated) {
      cleanupUrl()
    }

    return authenticated
  } catch (error) {
    console.error('Fehler bei Keycloak-Initialisierung:', error)
    return false
  }
}

// Token für API-Requests abrufen
export const getToken = async (): Promise<string | null> => {
  // Bypass für Development
  if (shouldBypassKeycloak()) {
    return keycloak.token || createMockToken()
  }

  try {
    await keycloak.updateToken(30)
    return keycloak.token || null
  } catch (error) {
    console.error('Fehler beim Token-Update:', error)
    return null
  }
}

// Benutzerinformationen abrufen
export const getUserInfo = () => {
  // Prüfe zuerst tokenParsed
  if (keycloak.tokenParsed) {
    debugLog('🔍 getUserInfo() from tokenParsed:', keycloak.tokenParsed)
    return keycloak.tokenParsed
  }
  
  // Fallback: Prüfe idTokenParsed
  if (keycloak.idTokenParsed) {
    debugLog('🔍 getUserInfo() from idTokenParsed:', keycloak.idTokenParsed)
    return keycloak.idTokenParsed
  }
  
  // Wenn Bypass aktiv ist, aber kein Token gesetzt wurde, erstelle Mock-Daten
  if (shouldBypassKeycloak()) {
    debugLog('🔍 getUserInfo() - Bypass aktiv, aber kein Token gefunden, erstelle Mock-Daten')
    const mockToken = createMockToken()
    const tokenPayload = JSON.parse(atob(mockToken.split('.')[1]))
    keycloak.tokenParsed = tokenPayload
    return tokenPayload
  }
  
  debugLog('🔍 getUserInfo() - Keine Benutzerinformationen gefunden')
  return null
}

// Hilfsfunktion: Gruppennamen case-insensitiv prüfen (Keycloak kann API-Admin oder api-admin liefern)
function groupMatches(groups: string[], name: string): boolean {
  const lower = name.toLowerCase()
  return groups.some(
    (g) => typeof g === 'string' && (g.toLowerCase() === lower || g.toLowerCase() === `/${lower}`),
  )
}

// Benutzer-Rollen abrufen (aus groups)
export const getUserRoles = (): UserRole[] => {
  if (!keycloak.tokenParsed) return []

  const groups: string[] = Array.isArray(keycloak.tokenParsed.groups)
    ? keycloak.tokenParsed.groups
    : []
  const roles: UserRole[] = []

  if (groupMatches(groups, 'api-admin')) {
    roles.push(UserRole.API_ADMIN)
  } else if (groupMatches(groups, 'api-stream')) {
    roles.push(UserRole.API_STREAM)
  } else if (groupMatches(groups, 'api-entwicklung')) {
    roles.push(UserRole.ENTWICKLUNG)
  } else if (groupMatches(groups, 'api-default')) {
    roles.push(UserRole.API_DEFAULT)
  }

  if (roles.length === 0) {
    roles.push(UserRole.API_DEFAULT)
  }

  return roles
}

// Höchste Rolle des Benutzers abrufen
export const getHighestRole = (): UserRole => {
  const roles = getUserRoles()

  if (roles.includes(UserRole.API_ADMIN)) {
    return UserRole.API_ADMIN
  } else if (roles.includes(UserRole.API_STREAM)) {
    return UserRole.API_STREAM
  } else if (roles.includes(UserRole.ENTWICKLUNG)) {
    return UserRole.ENTWICKLUNG
  } else {
    return UserRole.API_DEFAULT
  }
}

// Berechtigung prüfen
export const hasPermission = (permission: keyof (typeof ROLE_PERMISSIONS)[UserRole]): boolean => {
  const userRole = getHighestRole()
  return ROLE_PERMISSIONS[userRole][permission] || false
}

// Mehrere Berechtigungen prüfen (alle müssen erfüllt sein)
export const hasAllPermissions = (
  permissions: (keyof (typeof ROLE_PERMISSIONS)[UserRole])[],
): boolean => {
  return permissions.every((permission) => hasPermission(permission))
}

// Mindestens eine Berechtigung prüfen
export const hasAnyPermission = (
  permissions: (keyof (typeof ROLE_PERMISSIONS)[UserRole])[],
): boolean => {
  return permissions.some((permission) => hasPermission(permission))
}

// Benutzer-ID abrufen
export const getUserId = (): string | null => {
  return keycloak.tokenParsed?.sub || null
}

// Benutzer-E-Mail abrufen
export const getUserEmail = (): string | null => {
  return keycloak.tokenParsed?.email || null
}

// Debug-Funktion für Token-Analyse
export const debugToken = () => {
  if (!keycloak.tokenParsed) {
    debugLog('❌ Kein Token verfügbar')
    return
  }

  debugLog('🔍 Token Debug Information:')
  debugLog('Raw tokenParsed:', keycloak.tokenParsed)
  debugLog('Available keys:', Object.keys(keycloak.tokenParsed))

  // Spezifische Felder prüfen
  debugLog('sub:', keycloak.tokenParsed.sub)
  debugLog('email:', keycloak.tokenParsed.email)
  debugLog('name:', keycloak.tokenParsed.name)
  debugLog('family_name:', keycloak.tokenParsed.family_name)
  debugLog('given_name:', keycloak.tokenParsed.given_name)
  debugLog('preferred_username:', keycloak.tokenParsed.preferred_username)
  debugLog('groups:', keycloak.tokenParsed.groups)
  debugLog('realm_access:', keycloak.tokenParsed.realm_access)
  debugLog('resource_access:', keycloak.tokenParsed.resource_access)

  // Rollen-Analyse
  const roles = getUserRoles()
  debugLog('Erkannte Rollen:', roles)
  debugLog('Höchste Rolle:', getHighestRole())

  // Gruppen-Detection-Debug
  const groups = keycloak.tokenParsed.groups || []
  debugLog('🔍 Gruppen-Detection:')
  debugLog('  Raw groups:', groups)
  debugLog('  Contains /api-admin:', groups.includes('/api-admin'))
  debugLog('  Contains api-admin:', groups.includes('api-admin'))
  debugLog('  Contains /api-stream:', groups.includes('/api-stream'))
  debugLog('  Contains api-stream:', groups.includes('api-stream'))
  debugLog('  Contains /api-default:', groups.includes('/api-default'))
  debugLog('  Contains api-default:', groups.includes('api-default'))
}

// Keycloak-Instanz exportieren
export { keycloak }
export default keycloak
