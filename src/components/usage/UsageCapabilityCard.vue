<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-2">
      <div class="text-xs text-gray-500">{{ title }}</div>
      <div class="text-xs text-gray-500">{{ requests }} requests</div>
    </div>
    <div class="h-16 w-full flex items-end gap-1">
      <div
        v-for="(h, i) in chartHeights"
        :key="i"
        :style="{ height: h, background: '#a78bfa' }"
        class="flex-1 rounded-t"
      ></div>
    </div>
    <div class="text-xs text-gray-400 mt-2">{{ footer }}</div>
    <div class="text-xs text-gray-500 mt-1">{{ tokensIn }} In / {{ tokensOut }} Out</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  requests: number
  chartHeights: string[]
  footer: string
  tokensIn: number
  tokensOut: number
}>()
</script>
