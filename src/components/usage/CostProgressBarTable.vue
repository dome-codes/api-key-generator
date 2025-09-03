<template>
  <div class="flex items-center space-x-2">
    <!-- Progress Bar -->
    <div class="flex-1 min-w-0">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all duration-300 ease-in-out"
          :class="progressBarColor"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>

    <!-- Cost Display -->
    <div class="text-xs text-gray-600 min-w-0">
      <div class="font-medium" :class="statusTextColor">
        {{ formatCost(currentCost) }}
      </div>
      <div v-if="showDetailedInfo && isApiAdmin" class="text-xs text-gray-500">
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
