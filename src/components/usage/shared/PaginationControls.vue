<template>
  <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t border-gray-200">
    <div class="text-sm text-gray-700">
      Seite {{ pagination.page }} von {{ pagination.totalPages }} ({{ pagination.total }} Einträge)
    </div>
    <div class="flex space-x-2">
      <button
        @click="$emit('page-change', pagination.page - 1)"
        :disabled="pagination.page <= 1"
        :class="[
          'px-3 py-2 text-sm font-medium rounded-md',
          pagination.page <= 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
        ]"
      >
        Zurück
      </button>
      <button
        @click="$emit('page-change', pagination.page + 1)"
        :disabled="pagination.page >= pagination.totalPages"
        :class="[
          'px-3 py-2 text-sm font-medium rounded-md',
          pagination.page >= pagination.totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
        ]"
      >
        Weiter
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PaginationInfo } from '@/api/types/types'

interface Props {
  pagination?: PaginationInfo
}

defineProps<Props>()

defineEmits<{
  'page-change': [page: number]
}>()
</script>
