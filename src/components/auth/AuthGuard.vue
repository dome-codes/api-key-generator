<template>
  <div>
    <!-- Ladezustand während Keycloak-Initialisierung -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
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
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
import { initKeycloak } from '@/auth/keycloak'
import { useAuth } from '@/composables/useAuth'
import { onMounted, ref } from 'vue'

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

const { userProfile, userRoles, highestRole, isApiAdmin } = useAuth()
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
    } else {
      error.value = 'Authentifizierung fehlgeschlagen'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unbekannter Authentifizierungsfehler'
    debugLog('Fehler bei der Authentifizierung:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  initializeAuth()
})
</script>
