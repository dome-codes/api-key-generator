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
      <span class="text-xl font-bold text-primary">API-Dashboard</span>
    </div>
    <nav class="flex-1 flex flex-col gap-2">
      <button
        @click="$emit('update:activeSidebar', 'api')"
        :class="
          activeSidebar === 'api' ? 'bg-primary-100 text-primary font-semibold' : 'text-gray-700'
        "
        class="flex items-center gap-3 px-3 py-2 rounded transition-colors w-full text-left"
      >
        <!-- Schlüssel-Icon für API-Schlüssel -->
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        API-Schlüssel
      </button>
      <button
        v-if="canViewUsage"
        @click="$emit('update:activeSidebar', 'usage')"
        :class="
          activeSidebar === 'usage' ? 'bg-primary-100 text-primary font-semibold' : 'text-gray-700'
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
