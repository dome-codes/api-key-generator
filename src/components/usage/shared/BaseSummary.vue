<script setup lang="ts">
import ErrorState from './ErrorState.vue'
import SkeletonLoader from './SkeletonLoader.vue'

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

<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h2 class="text-xl font-semibold text-gray-800 mb-2">{{ title }}</h2>
    <p class="text-sm text-gray-500 mb-4">{{ description }}</p>

    <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <SkeletonLoader v-for="i in 4" :key="i" type="card" />
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
