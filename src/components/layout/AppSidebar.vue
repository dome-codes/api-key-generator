<script setup lang="ts">
import { hasPermission } from '@/auth/keycloak'
import { api } from '@/axios/api'
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const isDev = import.meta.env.DEV
const test500Loading = ref(false)

async function triggerTest500() {
  if (test500Loading.value) return
  test500Loading.value = true
  try {
    await api.get('/dev/test-500')
  } catch {
    // 500 wird erwartet – Popup mit Tracing-ID wird vom Axios-Interceptor angezeigt
  } finally {
    test500Loading.value = false
  }
}

interface Props {
  activeSidebar?: 'api' | 'usage'
  canViewUsage?: boolean
}

interface Emits {
  (e: 'update:activeSidebar', value: 'api' | 'usage'): void
}

withDefaults(defineProps<Props>(), {
  activeSidebar: 'api',
  canViewUsage: true,
})

const emit = defineEmits<Emits>()

const router = useRouter()
const route = useRoute()

const isAdmin = computed(() => hasPermission('canUseAdminFeatures'))

const navigateTo = (path: string) => {
  router.push(path)
}

const handleSidebarClick = (value: 'api' | 'usage') => {
  if (route.name === 'home') {
    emit('update:activeSidebar', value)
  } else {
    router.push({ name: 'home', query: { sidebar: value } })
  }
}
</script>

<template>
  <aside class="w-56 bg-white border-r flex flex-col py-6 px-6 min-h-screen">
    <div class="mb-8 flex items-center justify-center">
      <!-- Logo SVG -->
      <img src="/rag.svg" alt="RAG Logo" class="w-10 h-10 text-primary" />
    </div>
    <nav class="flex-1 flex flex-col gap-2">
      <button
        :class="
          activeSidebar === 'api' && route.name === 'home'
            ? 'bg-primary-100 text-primary font-semibold'
            : 'text-gray-700'
        "
        class="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full text-left"
        @click="handleSidebarClick('api')"
      >
        <!-- Schlüssel-Icon für API-Schlüssel -->
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        API-Schlüssel
      </button>
      <button
        v-if="canViewUsage"
        :class="
          activeSidebar === 'usage' && route.name === 'home'
            ? 'bg-primary-100 text-primary font-semibold'
            : 'text-gray-700'
        "
        class="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full text-left"
        @click="handleSidebarClick('usage')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
        Nutzung
      </button>

      <!-- Admin-Bereich -->
      <div v-if="isAdmin" class="mt-4 pt-4 border-t border-gray-200">
        <p class="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">Administration</p>
        <button
          :class="
            route.name === 'PricingManagement'
              ? 'bg-primary-100 text-primary font-semibold'
              : 'text-gray-700'
          "
          class="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full text-left"
          @click="navigateTo('/admin/preise')"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Preisverwaltung
        </button>
      </div>

      <!-- Dev: 500-Popup testen (nur in Entwicklung sichtbar) -->
      <button
        v-if="isDev"
        type="button"
        class="mt-4 flex items-center gap-3 px-3 py-2 rounded transition-colors w-full text-left text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs"
        :disabled="test500Loading"
        @click="triggerTest500"
      >
        {{ test500Loading ? '…' : '🧪 500-Popup testen' }}
      </button>
    </nav>
  </aside>
</template>
