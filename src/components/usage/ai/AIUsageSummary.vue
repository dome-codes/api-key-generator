<template>
  <BaseSummary
    :title="title"
    :description="description"
    :is-loading="isLoading"
    :error="error"
  >
    <template #summary-cards>
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="text-sm text-blue-600 font-medium">Tokens In</div>
        <div class="text-2xl font-bold text-blue-800">
          {{ summary.tokensIn.toLocaleString() }}
        </div>
      </div>

      <div class="bg-green-50 rounded-lg p-4">
        <div class="text-sm text-green-600 font-medium">Tokens Out</div>
        <div class="text-2xl font-bold text-green-800">
          {{ summary.tokensOut.toLocaleString() }}
        </div>
      </div>

      <div class="bg-purple-50 rounded-lg p-4">
        <div class="text-sm text-purple-600 font-medium">Gesamte Anfragen</div>
        <div class="text-2xl font-bold text-purple-800">
          {{ summary.requests.toLocaleString() }}
        </div>
      </div>

      <div class="bg-orange-50 rounded-lg p-4">
        <div class="text-sm text-orange-600 font-medium">Geschätzte Kosten</div>
        <div class="text-2xl font-bold text-orange-800">
          {{ formatCost(summary.cost) }}
        </div>
      </div>

      <!-- Additional card for unique users (Admin only) -->
      <div v-if="showUniqueUsers" class="bg-indigo-50 rounded-lg p-4">
        <div class="text-sm text-indigo-600 font-medium">Eindeutige Benutzer</div>
        <div class="text-2xl font-bold text-indigo-800">
          {{ summary.uniqueUsers?.toLocaleString() || 0 }}
        </div>
      </div>
    </template>
  </BaseSummary>
</template>

<script setup lang="ts">
import BaseSummary from '../shared/BaseSummary.vue'

interface UsageSummary {
  tokensIn: number
  tokensOut: number
  requests: number
  cost: number
  uniqueUsers?: number
}

interface Props {
  title: string
  description: string
  summary: UsageSummary
  isLoading: boolean
  error: string | null
  showUniqueUsers?: boolean
}

defineProps<Props>()

const formatCost = (cost: number): string => {
  if (cost === 0) return '€0.00'
  return `€${cost.toFixed(2)}`
}
</script>
