<script setup lang="ts">
interface Props {
  activeSidebar: 'api' | 'usage'
  canViewUsage: boolean
}

interface Emits {
  (e: 'update:activeSidebar', value: 'api' | 'usage'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <aside class="w-56 bg-white border-r flex flex-col py-6 px-6 min-h-screen">
    <div class="mb-8">
      <span class="text-xl font-bold text-blue-700">API-Dashboard</span>
    </div>
    <nav class="flex-1 flex flex-col gap-2">
      <button
        @click="$emit('update:activeSidebar', 'api')"
        :class="
          activeSidebar === 'api' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
        "
        class="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full text-left"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2a4 4 0 014-4h4" />
        </svg>
        API-Schlüssel
      </button>
      <button
        v-if="canViewUsage"
        @click="$emit('update:activeSidebar', 'usage')"
        :class="
          activeSidebar === 'usage' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
        "
        class="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full text-left"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
        Nutzung
      </button>
    </nav>
  </aside>
</template>
