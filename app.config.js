/**
 * App Configuration
 * This file exports environment variables that work both for:
 * - Local development (via .env.local and import.meta.env)
 * - Docker deployment (via runtime replacement of placeholders)
 */

export default {
  // Application Base Path
  appBasePath: import.meta.env.VITE_APP_BASE_PATH || '__VITE_APP_BASE_PATH__' || '/admin-console',

  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '__VITE_API_BASE_URL__',

  // Keycloak Configuration
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL || '__VITE_KEYCLOAK_URL__',
  keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM || '__VITE_KEYCLOAK_REALM__',
  keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || '__VITE_KEYCLOAK_CLIENT_ID__',

  // Debug Configuration
  showDebug: import.meta.env.VITE_SHOW_DEBUG === 'true' || '__VITE_SHOW_DEBUG__' === 'true',
}
