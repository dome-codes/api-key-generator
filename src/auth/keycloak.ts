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
}

// API-Berechtigungen pro Rolle
export const ROLE_PERMISSIONS = {
  [UserRole.API_DEFAULT]: {
    canViewOwnKeys: true,
    canCreateKeys: true,
    canEditOwnKeys: true,
    canDeactivateOwnKeys: true,
    canViewOwnUsage: true,
    canViewAdminUsage: false,
    canManageUsers: false,
  },
  [UserRole.API_STREAM]: {
    canViewOwnKeys: true,
    canCreateKeys: true,
    canEditOwnKeys: true,
    canDeactivateOwnKeys: true,
    canViewOwnUsage: true,
    canViewAdminUsage: false,
    canManageUsers: false,
  },
  [UserRole.API_ADMIN]: {
    canViewOwnKeys: true,
    canCreateKeys: true,
    canEditOwnKeys: true,
    canDeactivateOwnKeys: true,
    canViewOwnUsage: true,
    canViewAdminUsage: true,
    canManageUsers: false,
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

// Keycloak initialisieren
export const initKeycloak = async (): Promise<boolean> => {
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
  return keycloak.tokenParsed
}

// Benutzer-Rollen abrufen (aus groups)
export const getUserRoles = (): UserRole[] => {
  if (!keycloak.tokenParsed) return []

  const groups = keycloak.tokenParsed.groups || []
  const roles: UserRole[] = []

  if (groups.includes('api-admin') || groups.includes('/api-admin')) {
    roles.push(UserRole.API_ADMIN)
  } else if (groups.includes('api-stream') || groups.includes('/api-stream')) {
    roles.push(UserRole.API_STREAM)
  } else if (groups.includes('api-default') || groups.includes('/api-default')) {
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
