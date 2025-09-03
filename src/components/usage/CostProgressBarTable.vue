<template>
  <div class="flex items-center space-x-2">
    <!-- Progress Bar Container mit Tooltip -->
    <div class="flex-1 min-w-0 relative group">
      <!-- Progress Bar -->
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all duration-300 ease-in-out"
          :class="progressBarColor"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>

      <!-- Hover Tooltip -->
      <div
        class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10"
      >
        <div class="font-medium mb-1">Budget Status</div>
        <div class="space-y-1">
          <div>Aktuell: {{ formatCost(currentCost) }}</div>
          <div>Limit: {{ formatCost(budgetLimit) }}</div>
          <div>Verbraucht: {{ progressPercentage.toFixed(1) }}%</div>
          <div v-if="budgetLimit > currentCost" class="text-green-300">
            Verbleibend: {{ formatCost(budgetLimit - currentCost) }}
          </div>
          <div v-else class="text-red-300">
            Überschritten: {{ formatCost(currentCost - budgetLimit) }}
          </div>
        </div>
        <!-- Tooltip Arrow -->
        <div
          class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
        ></div>
      </div>
    </div>

    <!-- Cost Display mit Limit -->
    <div class="text-xs text-gray-600 min-w-0">
      <div class="font-medium" :class="statusTextColor">
        {{ formatCost(currentCost) }}
      </div>
      <div class="text-gray-400">/ {{ formatCost(budgetLimit) }}</div>
      <div v-if="showDetailedInfo && isApiAdmin" class="text-xs text-gray-500 mt-1">
        {{ formatNumber(tokensIn) }}/{{ formatNumber(tokensOut) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'
import { formatCost } from '@/config/pricing'
import { computed } from 'vue'

interface Props {
  currentCost: number
  budgetLimit: number
  tokensIn?: number
  tokensOut?: number
  showDetailedInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tokensIn: 0,
  tokensOut: 0,
  showDetailedInfo: false,
})

const { isApiAdmin } = useAuth()

// Computed
const progressPercentage = computed(() => {
  if (props.budgetLimit <= 0) return 0
  return Math.min((props.currentCost / props.budgetLimit) * 100, 100)
})

const progressBarColor = computed(() => {
  const percentage = progressPercentage.value
  if (percentage >= 100) return 'bg-red-500'
  if (percentage >= 80) return 'bg-yellow-500'
  return 'bg-green-500'
})

const statusTextColor = computed(() => {
  const percentage = progressPercentage.value
  if (percentage >= 100) return 'text-red-600'
  if (percentage >= 80) return 'text-yellow-600'
  return 'text-green-600'
})

// Helper function for number formatting
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}
</script>
