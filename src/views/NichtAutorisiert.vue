<script setup lang="ts">
import { redirectToKeycloakLogin } from '@/auth/keycloak'
import { useAuth } from '@/composables/useAuth'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const { handleLogout } = useAuth()

const reason = computed(() => (route.query.reason as string) || 'no_permission')
const isNotAuthenticated = computed(() => reason.value === 'not_authenticated')
const hasPermissionIssue = computed(
  () => reason.value === 'no_permission' || reason.value === 'error',
)

const login = () => {
  redirectToKeycloakLogin()
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="text-center max-w-lg mx-auto p-8">
      <div class="text-red-600 text-6xl mb-4">🚫</div>
      <h1 class="text-3xl font-bold text-gray-800 mb-4">
        {{ isNotAuthenticated ? 'Nicht angemeldet' : 'Nicht autorisiert' }}
      </h1>

      <!-- Nicht angemeldet: Einfache Anmeldung-Aufforderung -->
      <template v-if="isNotAuthenticated">
        <p class="text-gray-600 mb-6">Bitte melden Sie sich an, um fortzufahren.</p>
        <button
          class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
          @click="login"
        >
          Anmelden
        </button>
      </template>

      <!-- Angemeldet, aber ohne ausreichende Berechtigung -->
      <template v-else-if="hasPermissionIssue">
        <p class="text-gray-600 mb-6">
          Sie sind angemeldet, verfügen jedoch aktuell über keine ausreichenden Berechtigungen, um
          auf diese Seite zuzugreifen.
        </p>

        <div class="text-left space-y-4 mb-6">
          <p class="text-sm text-gray-600">
            <a
              href="https://wiki.example.com/berechtigungen-beantragen"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline"
            >
              So beantragen Sie die passenden Rechte →
            </a>
          </p>
          <p class="text-sm text-gray-600">
            Bei Fragen wenden Sie sich an einen Administrator:
            <span class="block mt-1">
              <a href="mailto:admin1@example.com" class="text-primary hover:underline"
                >admin1@example.com</a
              >,
              <a href="mailto:admin2@example.com" class="text-primary hover:underline"
                >admin2@example.com</a
              >
            </span>
          </p>
        </div>

        <div class="space-y-4">
          <button
            class="block w-full bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
            @click="handleLogout"
          >
            Abmelden und zum Login zurück
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
