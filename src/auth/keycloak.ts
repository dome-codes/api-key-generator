import Keycloak from 'keycloak-js'

// Development Mode: Mock Keycloak für lokale Entwicklung
const isDevelopment = import.meta.env.DEV
const useMockAuth = isDevelopment && import.meta.env.VITE_USE_MOCK_AUTH === 'true'

// Keycloak-Konfiguration
const keycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'api-key-generator',
  clientId: 'api-key-generator-frontend',
}

// Mock Keycloak für Entwicklung
class MockKeycloak {
  private _authenticated = false
  private _token: string | null = null
  private _tokenParsed: any = null

  constructor() {
    // Mock-Token für Entwicklung
    this._tokenParsed = {
      sub: 'mock-user-123',
      email: 'dev@example.com',
      name: 'Development User',
      family_name: 'User',
      given_name: 'Development',
      preferred_username: 'devuser',
      groups: ['api-default'],
    }
  }

  async init(options: any): Promise<boolean> {
    console.log('Mock Keycloak: Initialisierung...')

    // Simuliere Login-Formular für verschiedene Rollen
    if (options.onLoad === 'login-required') {
      const role = localStorage.getItem('mock-role') || 'api-default'
      this.setMockRole(role)
    }

    this._authenticated = true
    console.log('Mock Keycloak: Authentifiziert als', this._tokenParsed.groups[0])
    return true
  }

  setMockRole(role: string) {
    const groups = [role]
    this._tokenParsed = {
      ...this._tokenParsed,
      groups,
    }
    localStorage.setItem('mock-role', role)
  }

  async updateToken(minValidity: number): Promise<boolean> {
    return true
  }

  logout(options?: any) {
    this._authenticated = false
    this._token = null
    console.log('Mock Keycloak: Logout')
  }

  get authenticated(): boolean {
    return this._authenticated
  }

  get token(): string | null {
    return this._token
  }

  get tokenParsed(): any {
    return this._tokenParsed
  }
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

// Keycloak-Instanz erstellen (Mock oder echt)
const keycloak = useMockAuth ? new MockKeycloak() : new Keycloak(keycloakConfig)

// Keycloak initialisieren
export const initKeycloak = async (): Promise<boolean> => {
  try {
    if (useMockAuth) {
      console.log('🔧 Mock Keycloak wird verwendet (Entwicklungsmodus)')
      console.log(
        '💡 Tipp: Setze localStorage.setItem("mock-role", "api-stream") für API-Stream-Rolle',
      )
      console.log(
        '💡 Tipp: Setze localStorage.setItem("mock-role", "api-admin") für API-Admin-Rolle',
      )
    }

    const authenticated = await keycloak.init({
      onLoad: 'login-required', // Erzwingt Login beim Laden
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      checkLoginIframe: false, // Deaktiviert iframe-basierte Token-Überprüfung
      enableLogging: true, // Für Debugging
    })

    console.log('Keycloak initialisiert:', authenticated)
    return authenticated
  } catch (error) {
    console.error('Fehler bei Keycloak-Initialisierung:', error)

    // Fallback zu Mock-Auth wenn Keycloak nicht verfügbar
    if (isDevelopment && !useMockAuth) {
      console.log('🔄 Fallback zu Mock-Auth (Keycloak nicht verfügbar)')
      const mockKeycloak = new MockKeycloak()
      const authenticated = await mockKeycloak.init({ onLoad: 'login-required' })
      Object.assign(keycloak, mockKeycloak)
      return authenticated
    }

    return false
  }
}

// JWT Token Utilities
function parseJwtToken(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Fehler beim Parsen des JWT-Tokens:', error)
    return null
  }
}

// Token für API-Requests abrufen
export const getToken = async (): Promise<string | null> => {
  try {
    if (useMockAuth || keycloak instanceof MockKeycloak) {
      // Mock-Token mit echten JWT-Struktur
      const mockPayload = {
        sub: keycloak.tokenParsed?.sub || 'mock-user-123',
        email: keycloak.tokenParsed?.email || 'dev@example.com',
        name: keycloak.tokenParsed?.name || 'Development User',
        family_name: keycloak.tokenParsed?.family_name || 'User',
        given_name: keycloak.tokenParsed?.given_name || 'Development',
        preferred_username: keycloak.tokenParsed?.preferred_username || 'devuser',
        groups: keycloak.tokenParsed?.groups || ['api-default'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 Stunde gültig
      }

      // Erstelle Mock-JWT (Header.Payload.Signature)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify(mockPayload))
      const signature = 'mock-signature'

      return `${header}.${payload}.${signature}`
    }

    await keycloak.updateToken(30) // Token erneuern wenn es in 30 Sekunden abläuft
    return keycloak.token || null
  } catch (error) {
    console.error('Fehler beim Token-Update:', error)
    return null
  }
}

// JWT-Token validieren und parsen
export const validateAndParseToken = (token: string): any => {
  if (!token) return null

  const parsed = parseJwtToken(token)
  if (!parsed) return null

  // Prüfe Token-Ablauf
  const now = Math.floor(Date.now() / 1000)
  if (parsed.exp && parsed.exp < now) {
    console.warn('JWT-Token ist abgelaufen')
    return null
  }

  return parsed
}

// Token-Informationen für Debugging
export const getTokenInfo = (token: string): any => {
  const parsed = validateAndParseToken(token)
  if (!parsed) return null

  return {
    userId: parsed.sub,
    email: parsed.email,
    name: parsed.name,
    familyName: parsed.family_name,
    givenName: parsed.given_name,
    preferredUsername: parsed.preferred_username,
    groups: parsed.groups || [],
    issuedAt: parsed.iat ? new Date(parsed.iat * 1000) : null,
    expiresAt: parsed.exp ? new Date(parsed.exp * 1000) : null,
    isExpired: parsed.exp ? parsed.exp < Math.floor(Date.now() / 1000) : false,
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

  // Rollen aus groups extrahieren (mit und ohne Slash)
  if (groups.includes('api-admin') || groups.includes('/api-admin')) {
    roles.push(UserRole.API_ADMIN)
  } else if (groups.includes('api-stream') || groups.includes('/api-stream')) {
    roles.push(UserRole.API_STREAM)
  } else if (groups.includes('api-default') || groups.includes('/api-default')) {
    roles.push(UserRole.API_DEFAULT)
  }

  // Fallback: Wenn keine Rollen gefunden, Standard-API-Default-Rolle
  if (roles.length === 0) {
    console.warn('Keine gültigen Rollen in groups gefunden, verwende Standard-API-Default-Rolle')
    console.log('Verfügbare Groups:', groups)
    roles.push(UserRole.API_DEFAULT)
  }

  console.log('Gefilterte Rollen aus groups:', roles)
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
    console.log('❌ Kein Token verfügbar')
    return
  }

  console.log('🔍 Token Debug Information:')
  console.log('Raw tokenParsed:', keycloak.tokenParsed)
  console.log('Available keys:', Object.keys(keycloak.tokenParsed))

  // Spezifische Felder prüfen
  console.log('sub:', keycloak.tokenParsed.sub)
  console.log('email:', keycloak.tokenParsed.email)
  console.log('name:', keycloak.tokenParsed.name)
  console.log('family_name:', keycloak.tokenParsed.family_name)
  console.log('given_name:', keycloak.tokenParsed.given_name)
  console.log('preferred_username:', keycloak.tokenParsed.preferred_username)
  console.log('groups:', keycloak.tokenParsed.groups)
  console.log('realm_access:', keycloak.tokenParsed.realm_access)
  console.log('resource_access:', keycloak.tokenParsed.resource_access)

  // Rollen-Analyse
  const roles = getUserRoles()
  console.log('Erkannte Rollen:', roles)
  console.log('Höchste Rolle:', getHighestRole())

  // Gruppen-Detection-Debug
  const groups = keycloak.tokenParsed.groups || []
  console.log('🔍 Gruppen-Detection:')
  console.log('  Raw groups:', groups)
  console.log('  Contains /api-admin:', groups.includes('/api-admin'))
  console.log('  Contains api-admin:', groups.includes('api-admin'))
  console.log('  Contains /api-stream:', groups.includes('/api-stream'))
  console.log('  Contains api-stream:', groups.includes('api-stream'))
  console.log('  Contains /api-default:', groups.includes('/api-default'))
  console.log('  Contains api-default:', groups.includes('api-default'))
}

// Mock-Rolle für Entwicklung setzen
export const setMockRole = (role: string) => {
  if (keycloak instanceof MockKeycloak) {
    keycloak.setMockRole(role)
  }
}

// Keycloak-Instanz exportieren (für erweiterte Funktionen)
export { keycloak }

export default keycloak
