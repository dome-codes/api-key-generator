<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="text-center max-w-md mx-auto p-8">
      <div class="text-red-600 text-6xl mb-4">🚫</div>
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Nicht autorisiert</h1>
      <p class="text-gray-600 mb-6">
        Sie haben keine Berechtigung, auf diese Seite zuzugreifen. Bitte kontaktieren Sie einen
        Administrator, wenn Sie glauben, dass dies ein Fehler ist.
      </p>
      <div class="space-y-4">
        <button
          @click="goHome"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Zur Startseite
        </button>
        <button
          v-if="canRetry"
          @click="retry"
          class="block w-full text-gray-600 hover:text-gray-800 underline"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'

const router = useRouter()
const canRetry = ref(false)

const goHome = () => {
  router.push('/')
}

const retry = () => {
  router.go(0) // Reload current page
}

onMounted(() => {
  // Erlaube Retry nach kurzer Verzögerung
  setTimeout(() => {
    canRetry.value = true
  }, 2000)
})
</script>
