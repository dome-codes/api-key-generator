<template>
  <div class="text-center py-12 px-4">
    <div class="max-w-md mx-auto">
      <!-- Icon -->
      <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
        <svg
          class="h-8 w-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <!-- Title -->
      <h3 class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h3>

      <!-- Description -->
      <p class="text-sm text-gray-500 mb-6">{{ description }}</p>

      <!-- Actions -->
      <div v-if="showResetButton" class="flex justify-center gap-3">
        <button
          @click="$emit('reset-filters')"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Filter zurücksetzen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  showResetButton?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Keine Daten verfügbar',
  description: 'Für die gewählten Filter wurden keine Daten gefunden.',
  showResetButton: true,
})

defineEmits<{
  'reset-filters': []
}>()
</script>
