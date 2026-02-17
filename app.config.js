/**
 * App Configuration
 * Funktioniert in Vite (import.meta.env) und in Node (z. B. Orval-Generierung via process.env).
 */
function env(key, fallback = '') {
  try {
    if (
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      typeof import.meta.env[key] !== 'undefined'
    ) {
      return import.meta.env[key]
    }
  } catch (_) {}
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key]
  }
  return fallback
}

export default {
  appBasePath: env('VITE_APP_BASE_PATH') || '__VITE_APP_BASE_PATH__' || '/admin-console',
  apiBaseUrl: env('VITE_API_BASE_URL') || '__VITE_API_BASE_URL__',
  keycloakUrl: env('VITE_KEYCLOAK_URL') || '__VITE_KEYCLOAK_URL__',
  keycloakRealm: env('VITE_KEYCLOAK_REALM') || '__VITE_KEYCLOAK_REALM__',
  keycloakClientId: env('VITE_KEYCLOAK_CLIENT_ID') || '__VITE_KEYCLOAK_CLIENT_ID__',
  keycloakScope: env('VITE_KEYCLOAK_SCOPE') || undefined,
  showDebug: env('VITE_SHOW_DEBUG') === 'true' || '__VITE_SHOW_DEBUG__' === 'true',
}
