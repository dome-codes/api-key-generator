<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Filter & Zeitraum</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <!-- Time Range Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
        <select
          v-model="localTimeRange"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          @change="handleTimeRangeChange"
        >
          <option value="7d">Letzte 7 Tage</option>
          <option value="30d">Letzte 30 Tage</option>
          <option value="90d">Letzte 90 Tage</option>
          <option value="thisMonth">Diesen Monat</option>
          <option value="lastMonth">Vormonat</option>
          <option value="custom">Benutzerdefiniert</option>
        </select>

        <!-- Custom Date Range -->
        <div v-if="localTimeRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Von</label>
            <input
              v-model="localFromDate"
              type="date"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
              @change="handleDateChange"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Bis</label>
            <input
              v-model="localToDate"
              type="date"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
              @change="handleDateChange"
            />
          </div>
        </div>
      </div>

      <!-- Slot für spezifische Filter (z.B. Model Type, Provider, Status) -->
      <slot name="specific-filters" />

      <!-- Tag Filter (Debounced) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Tag</label>
        <input
          v-model="localTagInput"
          type="text"
          placeholder="z.B. production"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
        />
      </div>

      <!-- API Key Filter (Debounced) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
        <input
          v-model="localApiKeyIdInput"
          type="text"
          placeholder="API Key ID"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
        />
      </div>

      <!-- Slot für Admin-Filter (User, User Group) -->
      <slot name="admin-filters" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounce } from '@/composables/useDebounce'
import { computed, ref, watch } from 'vue'

interface Props {
  timeRange: string
  tag?: string
  apiKeyId?: string
  fromDate?: string
  toDate?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:timeRange': [value: string]
  'update:tag': [value: string]
  'update:apiKeyId': [value: string]
  'update:fromDate': [value: string]
  'update:toDate': [value: string]
  'filter-changed': []
}>()

// Local reactive state
const localTimeRange = computed({
  get: () => props.timeRange,
  set: (value) => emit('update:timeRange', value),
})

// Debounced Text-Inputs für Tag und API Key (400ms Delay)
const localTagInput = ref(props.tag || '')
const localApiKeyIdInput = ref(props.apiKeyId || '')

const debouncedTag = useDebounce(localTagInput, 400)
const debouncedApiKeyId = useDebounce(localApiKeyIdInput, 400)

// Watch debounced values und emitte Updates
watch(debouncedTag, (newValue) => {
  emit('update:tag', newValue)
  emit('filter-changed')
})

watch(debouncedApiKeyId, (newValue) => {
  emit('update:apiKeyId', newValue)
  emit('filter-changed')
})

// Sync props changes back to local inputs
watch(
  () => props.tag,
  (newValue) => {
    if (newValue !== localTagInput.value) {
      localTagInput.value = newValue || ''
    }
  },
)

watch(
  () => props.apiKeyId,
  (newValue) => {
    if (newValue !== localApiKeyIdInput.value) {
      localApiKeyIdInput.value = newValue || ''
    }
  },
)

const localFromDate = computed({
  get: () => props.fromDate || '',
  set: (value) => emit('update:fromDate', value),
})

const localToDate = computed({
  get: () => props.toDate || '',
  set: (value) => emit('update:toDate', value),
})

// Handler
const handleTimeRangeChange = () => {
  const today = new Date()
  let startDate: Date

  switch (localTimeRange.value) {
    case '7d':
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'thisMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
      localToDate.value = lastDay.toISOString().split('T')[0]
      break
    default:
      return
  }

  if (localTimeRange.value !== 'custom') {
    localFromDate.value = startDate.toISOString().split('T')[0]
    localToDate.value = today.toISOString().split('T')[0]
  }

  handleFilterChange()
}

const handleDateChange = () => {
  handleFilterChange()
}

const handleFilterChange = () => {
  emit('filter-changed')
}
</script>
