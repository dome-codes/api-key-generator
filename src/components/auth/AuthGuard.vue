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
          @click="retryAuth"
          class="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover"
        >
          Erneut versuchen
        </button>
      </div>
    </div>

    <!-- App-Inhalt nach erfolgreicher Authentifizierung -->
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { initKeycloak, hasPermission } from '@/auth/keycloak'
import { useAuth } from '@/composables/useAuth'
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref, watch } from 'vue'

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

const route = useRoute()
const router = useRouter()
const { userProfile, highestRole, isAdmin } = useAuth()
const isAuthenticated = ref(false)
const isLoading = ref(true)
const error = ref('')

const retryAuth = async () => {
  isLoading.value = true
  error.value = ''
  await initializeAuth()
}

const initializeAuth = async () => {
  try {
    const authenticated = await initKeycloak()
    isAuthenticated.value = authenticated
    
    if (authenticated) {
      debugLog('Benutzer erfolgreich authentifiziert')
      
      // Prüfe Route-basierte Berechtigungen
      if (route.meta.requiredPermissions && route.meta.requiredPermissions.length > 0) {
        const { hasPermission } = await import('@/auth/keycloak')
        const hasAllPermissions = route.meta.requiredPermissions.every((permission) =>
          hasPermission(permission as any),
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
    } else {
      error.value = 'Authentifizierung fehlgeschlagen'
      // Redirect zu Keycloak Login wird durch initKeycloak mit onLoad: 'login-required' gemacht
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unbekannter Authentifizierungsfehler'
    debugLog('Fehler bei der Authentifizierung:', err)
  } finally {
    isLoading.value = false
  }
}

// Watch für Route-Änderungen (für nested routes)
watch(
  () => route.path,
  () => {
    if (isAuthenticated.value && route.meta.requiredPermissions) {
      const hasAllPermissions = route.meta.requiredPermissions.every((permission) =>
        hasPermission(permission as any),
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
