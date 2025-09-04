<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Filter & Zeitraum</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Time Range Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
        <select
          v-model="timeRange"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
        >
          <option value="7d">Letzte 7 Tage</option>
          <option value="30d">Letzte 30 Tage</option>
          <option value="90d">Letzte 90 Tage</option>
          <option value="thisMonth">Diesen Monat</option>
          <option value="lastMonth">Vormonat</option>
          <option value="custom">Benutzerdefiniert</option>
        </select>
        
        <!-- Custom Date Range (nur sichtbar wenn "Benutzerdefiniert" ausgewählt) -->
        <div v-if="timeRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Von</label>
            <input
              v-model="fromDate"
              type="date"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Bis</label>
            <input
              v-model="toDate"
              type="date"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
            />
          </div>
        </div>
      </div>

      <!-- Model Type Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Modelltyp</label>
        <select
          v-model="modelType"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
        >
          <option value="">Alle Modelltypen</option>
          <option value="CompletionModelUsage">Chat Completions</option>
          <option value="EmbeddingModelUsage">Embeddings</option>
          <option value="ImageModelUsage">Bilder</option>
        </select>
      </div>

      <!-- User Filter (nur für Admin) -->
      <div v-if="showUserFilter">
        <label class="block text-sm font-medium text-gray-700 mb-2">Benutzer</label>
        <select
          v-model="selectedUser"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
        >
          <option value="">Alle Benutzer</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.displayName }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  timeRange: string
  modelType: string
  fromDate?: string
  toDate?: string
  selectedUser?: string
  showUserFilter?: boolean
  users?: Array<{ id: string; displayName: string }>
}

const props = withDefaults(defineProps<Props>(), {
  showUserFilter: false,
  users: () => []
})

// Emits
const emit = defineEmits<{
  'update:timeRange': [value: string]
  'update:modelType': [value: string]
  'update:fromDate': [value: string]
  'update:toDate': [value: string]
  'update:selectedUser': [value: string]
}>()

// Local reactive state
const timeRange = computed({
  get: () => props.timeRange,
  set: (value) => emit('update:timeRange', value)
})

const modelType = computed({
  get: () => props.modelType,
  set: (value) => emit('update:modelType', value)
})

const fromDate = computed({
  get: () => props.fromDate || '',
  set: (value) => emit('update:fromDate', value)
})

const toDate = computed({
  get: () => props.toDate || '',
  set: (value) => emit('update:toDate', value)
})

const selectedUser = computed({
  get: () => props.selectedUser || '',
  set: (value) => emit('update:selectedUser', value)
})
</script>
