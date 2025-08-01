<script setup lang="ts">
interface Props {
  show: boolean
  message: string
  type?: 'success' | 'error' | 'warning'
}

defineProps<Props>()
</script>

<template>
  <div
    v-if="show"
    class="fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50"
    :class="[
      show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white',
    ]"
  >
    <div class="flex items-center space-x-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        ></path>
      </svg>
      <span>{{ message }}</span>
    </div>
  </div>
</template>
