<script setup lang="ts">
import {
  getToken,
  initKeycloak,
  hasPermission,
  hasValidAppUser,
  redirectToKeycloakLogin,
  setTokenReadyForApi,
  type UserRole,
  ROLE_PERMISSIONS,
} from '@/auth/keycloak'
import { debugLog } from '@/utils/debugLog'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { onMounted, ref, watch } from 'vue'

const route = useRoute()
const router = useRouter()
const isAuthenticated = ref(false)
const isLoading = ref(true)
const tokenReady = ref(false) // erst true, wenn getToken() erfolgreich – verhindert API-Calls vor Token
const error = ref('')
const redirectingToLogin = ref(false)

const retryAuth = async () => {
  isLoading.value = true
  error.value = ''
  tokenReady.value = false
  redirectingToLogin.value = false
  await initializeAuth()
}

const initializeAuth = async () => {
  try {
    const authenticated = await initKeycloak()
    isAuthenticated.value = authenticated

    if (authenticated) {
      // Kein gültiger Nutzer (Unbekannter Nutzer / keine Rolle) → Nicht autorisiert
      if (!hasValidAppUser()) {
        isAuthenticated.value = false
        router.push({ name: 'NichtAutorisiert' })
        return
      }
      debugLog('Benutzer erfolgreich authentifiziert')
      isAuthenticated.value = true

      // Prüfe Route-basierte Berechtigungen
      if (route.meta.requiredPermissions && route.meta.requiredPermissions.length > 0) {
        const { hasPermission } = await import('@/auth/keycloak')
        const hasAllPermissions = route.meta.requiredPermissions.every((permission) =>
          hasPermission(permission as keyof (typeof ROLE_PERMISSIONS)[UserRole]),
        )
        if (!hasAllPermissions) {
          router.push({ name: 'NichtAutorisiert' })
          return
        }
      }

      // Prüfe spezifische Rolle
      if (route.meta.requiredRole) {
        const { getHighestRole } = await import('@/auth/keycloak')
        const userRole = getHighestRole()
        if (userRole !== route.meta.requiredRole) {
          router.push({ name: 'NichtAutorisiert' })
          return
        }
      }

      // Token zwingend vor Anzeige der App laden; RouterView erst bei tokenReady
      const token = await getToken()
      if (!token) {
        error.value = 'Token konnte nicht geladen werden.'
        isAuthenticated.value = false
      } else {
        tokenReady.value = true
        setTokenReadyForApi() // API-Requests dürfen erst jetzt laufen (ai/apikey/summarize)
      }
    } else {
      // Nicht eingeloggt → Keycloak-Login-Oberfläche anzeigen (Redirect)
      redirectToKeycloakLogin()
      redirectingToLogin.value = true
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unbekannter Authentifizierungsfehler'
    debugLog('Fehler bei der Authentifizierung:', err)
  } finally {
    isLoading.value = false
    setTokenReadyForApi() // Auch bei Fehler/Redirect: Wartende Requests nicht ewig blockieren
  }
}

// Watch für Route-Änderungen (für nested routes)
watch(
  () => route.path,
  () => {
    if (isAuthenticated.value && route.meta.requiredPermissions) {
      const hasAllPermissions = route.meta.requiredPermissions.every((permission) =>
        hasPermission(permission as keyof (typeof ROLE_PERMISSIONS)[UserRole]),
      )
      if (!hasAllPermissions) {
        router.push({ name: 'NichtAutorisiert' })
      }
    }
  },
)

onMounted(() => {
  initializeAuth()
})
</script>

<template>
  <div>
    <!-- Ladezustand während Keycloak-Initialisierung -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
        ></div>
        <p class="text-gray-600">Authentifizierung läuft...</p>
      </div>
    </div>

    <!-- Fehlerzustand -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">Authentifizierungsfehler</h2>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button
          class="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover"
          @click="retryAuth"
        >
          Erneut versuchen
        </button>
      </div>
    </div>

    <!-- App-Inhalt erst, wenn Token bereit (verhindert 403 durch vorzeitige API-Calls) -->
    <template v-else-if="isAuthenticated && tokenReady">
      <RouterView />
    </template>
    <!-- Nicht eingeloggt: Weiterleitung zur Keycloak-Login-Oberfläche -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"
        ></div>
        <p class="text-gray-600">
          {{ redirectingToLogin ? 'Weiterleitung zur Anmeldung…' : 'Nicht angemeldet.' }}
        </p>
        <button
          v-if="!redirectingToLogin"
          class="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover"
          @click="retryAuth"
        >
          Anmelden
        </button>
      </div>
    </div>
  </div>
</template>
