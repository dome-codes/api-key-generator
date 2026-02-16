<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h2 class="text-xl font-semibold text-gray-800 mb-4">{{ title }}</h2>
    <p class="text-gray-600 mb-4">{{ description }}</p>

    <div v-if="isLoading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Lade Daten...</p>
    </div>

    <div v-else-if="error">
      <ErrorState :error="error" @retry="$emit('retry')" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Slot für Summary-Karten -->
      <slot name="summary-cards" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ErrorState from './ErrorState.vue'

interface Props {
  title: string
  description: string
  isLoading: boolean
  error: string | null
}

defineProps<Props>()

defineEmits<{
  retry: []
}>()
</script>
