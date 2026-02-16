<template>
  <div class="bg-white rounded-xl shadow overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
        <div class="flex items-center gap-2">
          <span v-if="pagination" class="text-sm text-gray-500">
            {{ pagination.total }} Einträge (Seite {{ pagination.page }} von {{ pagination.totalPages }})
          </span>
          <span v-else class="text-sm text-gray-500">{{ data.length }} Einträge</span>
          <slot name="actions" />
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="p-6">
      <SkeletonLoader type="table" :rows="5" :columns="6" />
    </div>

    <div v-else-if="error">
      <ErrorState :error="error" @retry="$emit('retry')" />
    </div>

    <div v-else-if="!data || data.length === 0">
      <EmptyState
        :title="emptyStateTitle"
        :description="emptyStateDescription"
        :show-reset-button="showResetButton"
        @reset-filters="$emit('reset-filters')"
      />
    </div>

    <div v-else>
      <!-- Table Content -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <slot name="table-header" />
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <slot name="table-body" :data="data" />
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <PaginationControls
        v-if="pagination"
        :pagination="pagination"
        @page-change="$emit('page-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PaginationInfo } from '@/api/types/types'
import EmptyState from './EmptyState.vue'
import ErrorState from './ErrorState.vue'
import PaginationControls from './PaginationControls.vue'
import SkeletonLoader from './SkeletonLoader.vue'

interface Props {
  title: string
  data: unknown[]
  isLoading: boolean
  error: string | null
  pagination?: PaginationInfo
  emptyStateTitle?: string
  emptyStateDescription?: string
  showResetButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  emptyStateTitle: 'Keine Daten verfügbar',
  emptyStateDescription: 'Für die gewählten Filter wurden keine Daten gefunden.',
  showResetButton: false,
})

defineEmits<{
  'page-change': [page: number]
  'reset-filters': []
  retry: []
}>()
</script>
