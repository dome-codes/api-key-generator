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
import { onMounted, ref } from 'vue'

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
    if (authenticated) {
      console.log('Benutzer erfolgreich authentifiziert')
    } else {
      error.value = 'Authentifizierung fehlgeschlagen'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unbekannter Authentifizierungsfehler'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  initializeAuth()
})
</script>
