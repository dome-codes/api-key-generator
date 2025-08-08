<script setup lang="ts">
interface Props {
  userProfile: {
    name: string
    avatar: string
  }
  userRoles: string[]
  isDevelopment: boolean
  showDebugMode: boolean
}

interface Emits {
  (e: 'logout'): void
  (e: 'debugTokenInfo'): void
}

defineProps<Props>()
defineEmits<Emits>()

const getRoleColor = (role: string) => {
  switch (role) {
    case 'api-default':
      return 'bg-blue-100 text-blue-800'
    case 'api-stream':
      return 'bg-green-100 text-green-800'
    case 'api-admin':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <header class="flex items-center justify-end bg-white border-b px-8 py-4">
    <div class="flex items-center gap-3">
      <!-- Debug-Button (nur im Debug-Modus) -->
      <button
        v-if="showDebugMode"
        @click="$emit('debugTokenInfo')"
        class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
        title="Debug Info Toggle (Frontend + Console)"
      >
        🔧 Debug
      </button>

      <!-- Rollen-Anzeige -->
      <div class="flex items-center gap-2">
        <span class="text-gray-700 font-medium text-sm">{{ userProfile.name }}</span>
        <div class="flex gap-1">
          <span
            v-for="role in userRoles"
            :key="role"
            class="px-2 py-1 text-xs font-medium rounded-full"
            :class="getRoleColor(role)"
          >
            {{ role }}
          </span>
        </div>
      </div>
      <img :src="userProfile.avatar" alt="avatar" class="w-9 h-9 rounded-full border" />
      <button
        @click="$emit('logout')"
        class="ml-3 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Abmelden"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    </div>
  </header>
</template>
