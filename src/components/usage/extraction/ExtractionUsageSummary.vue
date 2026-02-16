<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h2 class="text-xl font-semibold text-gray-800 mb-4">{{ title }}</h2>
    <p class="text-gray-600 mb-4">{{ description }}</p>

    <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <SkeletonLoader v-for="i in 4" :key="i" type="card" />
    </div>

    <div v-else-if="error">
      <ErrorState :error="error" @retry="$emit('retry')" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="text-sm text-blue-600 font-medium">Operationen</div>
        <div class="text-2xl font-bold text-blue-800">
          {{ summary.totalOperations.toLocaleString() }}
        </div>
      </div>

      <div class="bg-green-50 rounded-lg p-4">
        <div class="text-sm text-green-600 font-medium">Seiten</div>
        <div class="text-2xl font-bold text-green-800">
          {{ summary.totalPages.toLocaleString() }}
        </div>
      </div>

      <div class="bg-purple-50 rounded-lg p-4">
        <div class="text-sm text-purple-600 font-medium">Durchschnittliche Confidence</div>
        <div class="text-2xl font-bold text-purple-800">
          {{ formatConfidence(summary.averageConfidence) }}%
        </div>
      </div>

      <div class="bg-orange-50 rounded-lg p-4">
        <div class="text-sm text-orange-600 font-medium">Gesamtkosten</div>
        <div class="text-2xl font-bold text-orange-800">
          {{ formatCost(summary.totalCost) }}
        </div>
      </div>

      <!-- Additional cards for Admin -->
      <div v-if="showUniqueUsers" class="bg-indigo-50 rounded-lg p-4">
        <div class="text-sm text-indigo-600 font-medium">Eindeutige Benutzer</div>
        <div class="text-2xl font-bold text-indigo-800">
          {{ summary.uniqueUsers?.toLocaleString() || 0 }}
        </div>
      </div>

      <div v-if="showUniqueProviders" class="bg-teal-50 rounded-lg p-4">
        <div class="text-sm text-teal-600 font-medium">Provider</div>
        <div class="text-2xl font-bold text-teal-800">
          {{ summary.uniqueProviders?.toLocaleString() || 0 }}
        </div>
      </div>

      <div v-if="showUniqueModels" class="bg-pink-50 rounded-lg p-4">
        <div class="text-sm text-pink-600 font-medium">Modelle</div>
        <div class="text-2xl font-bold text-pink-800">
          {{ summary.uniqueModels?.toLocaleString() || 0 }}
        </div>
      </div>
    </div>

    <!-- Status Breakdown (optional) -->
    <div v-if="showStatusBreakdown && summary.operationsByStatus" class="mt-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-3">Status-Übersicht</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div
          v-for="(count, status) in summary.operationsByStatus"
          :key="status"
          class="bg-gray-50 rounded-lg p-3"
        >
          <div class="text-xs text-gray-600 font-medium">{{ getStatusLabel(status) }}</div>
          <div class="text-xl font-bold text-gray-800">{{ count }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExtractionUsageAggregation } from '@/api/types/extraction'
import ErrorState from '../shared/ErrorState.vue'
import SkeletonLoader from '../shared/SkeletonLoader.vue'

interface Props {
  title: string
  description: string
  summary: ExtractionUsageAggregation
  isLoading: boolean
  error: string | null
  showUniqueUsers?: boolean
  showUniqueProviders?: boolean
  showUniqueModels?: boolean
  showStatusBreakdown?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showUniqueUsers: false,
  showUniqueProviders: false,
  showUniqueModels: false,
  showStatusBreakdown: false,
})

// Formatting functions
const formatCost = (cost: number): string => {
  if (cost === 0) return '€0.00'
  return `€${cost.toFixed(2)}`
}

const formatConfidence = (confidence: number): string => {
  return (confidence * 100).toFixed(1)
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    processing: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    failed: 'Fehlgeschlagen',
    canceled: 'Abgebrochen',
    skipped: 'Übersprungen',
  }
  return labels[status] || status
}

defineEmits<{
  retry: []
}>()
</script>
