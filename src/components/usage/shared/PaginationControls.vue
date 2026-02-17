<script setup lang="ts">
import type { PaginationInfo } from '@/api/types'
import { computed } from 'vue'

interface Props {
  pagination?: PaginationInfo
}

const props = defineProps<Props>()

const page = computed(() => props.pagination?.page ?? 1)
const totalPages = computed(() => props.pagination?.totalPages ?? 0)
const total = computed(() => props.pagination?.total ?? 0)

defineEmits<{
  'page-change': [page: number]
}>()
</script>

<template>
  <div
    v-if="pagination && (pagination.totalPages ?? 0) > 1"
    class="flex items-center justify-between px-6 py-4 border-t border-gray-200"
  >
    <div class="text-sm text-gray-700">
      Seite {{ page }} von {{ totalPages }} ({{ total }} Einträge)
    </div>
    <div class="flex space-x-2">
      <button
        :disabled="page <= 1"
        :class="[
          'px-3 py-2 text-sm font-medium rounded-md',
          page <= 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
        ]"
        @click="$emit('page-change', page - 1)"
      >
        Zurück
      </button>
      <button
        :disabled="page >= totalPages"
        :class="[
          'px-3 py-2 text-sm font-medium rounded-md',
          page >= totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
        ]"
        @click="$emit('page-change', page + 1)"
      >
        Weiter
      </button>
    </div>
  </div>
</template>
