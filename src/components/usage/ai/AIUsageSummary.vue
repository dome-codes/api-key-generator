<template>
  <BaseSummary
    :title="title"
    :description="description"
    :is-loading="isLoading"
    :error="error"
    @retry="$emit('retry')"
  >
    <template #summary-cards>
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
        <div class="text-sm text-gray-600 font-medium">Tokens In</div>
        <div class="text-2xl font-bold text-gray-900">
          {{ summary.tokensIn.toLocaleString() }}
        </div>
      </div>

      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
        <div class="text-sm text-gray-600 font-medium">Tokens Out</div>
        <div class="text-2xl font-bold text-gray-900">
          {{ summary.tokensOut.toLocaleString() }}
        </div>
      </div>

      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
        <div class="text-sm text-gray-600 font-medium">Gesamte Anfragen</div>
        <div class="text-2xl font-bold text-gray-900">
          {{ summary.requests.toLocaleString() }}
        </div>
      </div>

      <div class="bg-primary-100 border border-primary-200 rounded-lg p-4 hover:bg-primary-200 transition-colors">
        <div class="text-sm text-primary font-medium">Geschätzte Kosten</div>
        <div class="text-2xl font-bold text-primary">
          {{ formatCost(summary.cost) }}
        </div>
      </div>

      <!-- Bei Image-Nutzung: Kachel „Bilder“ -->
      <div
        v-if="summary.imageCount != null && summary.imageCount > 0"
        class="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
      >
        <div class="text-sm text-gray-600 font-medium">Bilder</div>
        <div class="text-2xl font-bold text-gray-900">
          {{ summary.imageCount.toLocaleString() }}
        </div>
      </div>

      <!-- Additional card for unique users (Admin only) -->
      <div v-if="showUniqueUsers" class="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
        <div class="text-sm text-gray-600 font-medium">Eindeutige Benutzer</div>
        <div class="text-2xl font-bold text-gray-900">
          {{ summary.uniqueUsers?.toLocaleString() || 0 }}
        </div>
      </div>
    </template>
  </BaseSummary>
</template>

<script setup lang="ts">
import BaseSummary from '../shared/BaseSummary.vue'
import { debugLog } from '@/utils/debugLog'
import { watch } from 'vue'

interface UsageSummary {
  tokensIn: number
  tokensOut: number
  requests: number
  cost: number
  uniqueUsers?: number
  /** Bei ImageModelUsage: Anzahl erzeugter Bilder */
  imageCount?: number
}

interface Props {
  title: string
  description: string
  summary: UsageSummary
  isLoading: boolean
  error: string | null
  showUniqueUsers?: boolean
}

const props = defineProps<Props>()

// Debug: Log summary changes
watch(
  () => props.summary,
  (newSummary) => {
    debugLog('[AIUsageSummary] Summary changed:', newSummary)
  },
  { immediate: true, deep: true },
)

defineEmits<{
  retry: []
}>()

const formatCost = (cost: number): string => {
  if (cost === 0) return '€0.00'
  return `€${cost.toFixed(2)}`
}
</script>
