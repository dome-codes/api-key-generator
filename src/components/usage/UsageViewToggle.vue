<script setup lang="ts">
interface Props {
  view: 'overview' | 'detailed'
  iconVariant?: 'ai' | 'extraction'
}

withDefaults(defineProps<Props>(), {
  iconVariant: 'ai',
})

defineEmits<{
  'update:view': [value: 'overview' | 'detailed']
}>()
</script>

<template>
  <div class="mt-4 flex justify-center">
    <div class="bg-gray-100 rounded-lg p-1 inline-flex">
      <button
        :class="[
          view === 'overview'
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
          'px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200',
        ]"
        @click="$emit('update:view', 'overview')"
      >
        <!-- AI Usage: Balkendiagramm-Icon -->
        <svg
          v-if="iconVariant === 'ai'"
          class="w-4 h-4 inline mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <!-- Extraction: Dokumenten-Icon -->
        <svg
          v-else-if="iconVariant === 'extraction'"
          class="w-4 h-4 inline mr-2"
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
        Übersicht
      </button>
      <button
        :class="[
          view === 'detailed'
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
          'px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200',
        ]"
        @click="$emit('update:view', 'detailed')"
      >
        <!-- AI Usage: Clipboard-Icon -->
        <svg
          v-if="iconVariant === 'ai'"
          class="w-4 h-4 inline mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
        <!-- Extraction: Listen-Icon -->
        <svg
          v-else-if="iconVariant === 'extraction'"
          class="w-4 h-4 inline mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        Detailliert
      </button>
    </div>
  </div>
</template>
