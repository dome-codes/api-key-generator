<template>
  <div class="animate-pulse">
    <!-- Card Skeleton -->
    <div v-if="type === 'card'" class="bg-gray-200 rounded-lg h-24"></div>

    <!-- Table Skeleton -->
    <div v-else-if="type === 'table'" class="space-y-3">
      <div v-for="i in rows" :key="i" class="flex space-x-4">
        <div
          v-for="j in columns"
          :key="j"
          class="h-4 bg-gray-200 rounded flex-1"
          :style="{ width: j === columns ? '20%' : 'auto' }"
        ></div>
      </div>
    </div>

    <!-- Chart Skeleton -->
    <div v-else-if="type === 'chart'" class="bg-gray-200 rounded-lg h-64"></div>

    <!-- Text Skeleton -->
    <div v-else-if="type === 'text'" class="space-y-2">
      <div class="h-4 bg-gray-200 rounded w-3/4"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>

    <!-- Custom Skeleton -->
    <div v-else class="bg-gray-200 rounded" :style="{ height: height, width: width }"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'card' | 'table' | 'chart' | 'text' | 'custom'
  rows?: number
  columns?: number
  height?: string
  width?: string
}

withDefaults(defineProps<Props>(), {
  type: 'custom',
  rows: 5,
  columns: 4,
  height: '100px',
  width: '100%',
})
</script>
