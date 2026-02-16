<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Filter & Zeitraum</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <!-- Time Range Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
        <select
          v-model="timeRange"
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

        <!-- Custom Date Range (nur sichtbar wenn "Benutzerdefiniert" ausgewählt) -->
        <div v-if="timeRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Von</label>
            <input
              v-model="fromDate"
              type="date"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
              @change="handleFilterChange"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Bis</label>
            <input
              v-model="toDate"
              type="date"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
              @change="handleFilterChange"
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
          @change="handleFilterChange"
        >
          <option value="">Alle Modelltypen</option>
          <option value="CompletionModelUsage">Chat Completions</option>
          <option value="EmbeddingModelUsage">Embeddings</option>
          <option value="ImageModelUsage">Bilder</option>
        </select>
      </div>

      <!-- Model Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Modell</label>
        <input
          v-model="model"
          type="text"
          placeholder="z.B. gpt-4o"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          @input="handleFilterChange"
        />
      </div>

      <!-- Tag Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Tag</label>
        <input
          v-model="tag"
          type="text"
          placeholder="z.B. production"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          @input="handleFilterChange"
        />
      </div>

      <!-- API Key Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
        <input
          v-model="apiKeyId"
          type="text"
          placeholder="API Key ID"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          @input="handleFilterChange"
        />
      </div>

      <!-- User Filter (nur für Admin) -->
      <div v-if="showUserFilter">
        <label class="block text-sm font-medium text-gray-700 mb-2">Benutzer</label>
        <select
          v-model="selectedUser"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          @change="handleFilterChange"
        >
          <option value="">Alle Benutzer</option>
          <option v-for="user in filteredUsers" :key="user.id" :value="user.id">
            {{ user.displayName }}
          </option>
        </select>
      </div>

      <!-- Gruppen Filter (nur für Admin) -->
      <div v-if="showUserFilter">
        <label class="block text-sm font-medium text-gray-700 mb-2">Gruppe</label>
        <select
          v-model="selectedUserGroup"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          @change="handleFilterChange"
        >
          <option value="">Alle Gruppen</option>
          <option v-for="group in availableGroups" :key="group.id" :value="group.id">
            {{ group.name }} ({{ group.count }})
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

// Props
interface Props {
  timeRange: string
  modelType: string
  model?: string
  tag?: string
  apiKeyId?: string
  fromDate?: string
  toDate?: string
  selectedUser?: string
  selectedUserGroup?: string
  showUserFilter?: boolean
  users?: Array<{ id: string; displayName: string }>
}

const props = withDefaults(defineProps<Props>(), {
  showUserFilter: false,
  users: () => [],
})

// Emits
const emit = defineEmits<{
  'update:timeRange': [value: string]
  'update:modelType': [value: string]
  'update:model': [value: string]
  'update:tag': [value: string]
  'update:apiKeyId': [value: string]
  'update:fromDate': [value: string]
  'update:toDate': [value: string]
  'update:selectedUser': [value: string]
  'update:selectedUserGroup': [value: string]
  'filter-changed': []
}>()

// Local reactive state
const timeRange = computed({
  get: () => props.timeRange,
  set: (value) => emit('update:timeRange', value),
})

const modelType = computed({
  get: () => props.modelType,
  set: (value) => emit('update:modelType', value),
})

const fromDate = computed({
  get: () => props.fromDate || '',
  set: (value) => emit('update:fromDate', value),
})

const toDate = computed({
  get: () => props.toDate || '',
  set: (value) => emit('update:toDate', value),
})

const selectedUser = computed({
  get: () => props.selectedUser || '',
  set: (value) => emit('update:selectedUser', value),
})

const selectedUserGroup = computed({
  get: () => props.selectedUserGroup || '',
  set: (value) => emit('update:selectedUserGroup', value),
})

const model = computed({
  get: () => props.model || '',
  set: (value) => emit('update:model', value),
})

const tag = computed({
  get: () => props.tag || '',
  set: (value) => emit('update:tag', value),
})

const apiKeyId = computed({
  get: () => props.apiKeyId || '',
  set: (value) => emit('update:apiKeyId', value),
})

// Handler
const handleTimeRangeChange = () => {
  const today = new Date()
  let startDate: Date

  switch (timeRange.value) {
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
      toDate.value = lastDay.toISOString().split('T')[0]
      break
    default:
      return
  }

  if ((timeRange.value as string) !== 'custom') {
    fromDate.value = startDate.toISOString().split('T')[0]
    toDate.value = today.toISOString().split('T')[0]
  }

  handleFilterChange()
}

const handleFilterChange = () => {
  emit('filter-changed')
}

// Gruppierungslogik
const getUserGroup = (userId: string): string => {
  if (userId.startsWith('SVC_ADMIN')) {
    return 'ADMIN'
  } else if (userId.startsWith('SVC_')) {
    return 'TECHNICAL'
  } else if (userId.startsWith('e') || userId.startsWith('b')) {
    return 'DEVELOPMENT'
  } else {
    return 'DEFAULT'
  }
}

const availableGroups = computed(() => {
  const groups: Record<string, { id: string; name: string; count: number }> = {
    DEVELOPMENT: { id: 'DEVELOPMENT', name: 'Entwicklung', count: 0 },
    TECHNICAL: { id: 'TECHNICAL', name: 'Technische Nutzer', count: 0 },
    ADMIN: { id: 'ADMIN', name: 'ADMIN', count: 0 },
    DEFAULT: { id: 'DEFAULT', name: 'Default', count: 0 },
  }

  // Zähle Nutzer pro Gruppe
  props.users.forEach((user) => {
    const group = getUserGroup(user.id)
    if (groups[group]) {
      groups[group].count++
    }
  })

  // Nur Gruppen mit Nutzern zurückgeben
  return Object.values(groups).filter((group) => group.count > 0)
})

// Gefilterte Nutzer basierend auf ausgewählter Gruppe
const filteredUsers = computed(() => {
  if (!selectedUserGroup.value) {
    return props.users
  }

  return props.users.filter((user) => getUserGroup(user.id) === selectedUserGroup.value)
})

// Watcher für Gruppenänderungen
watch(selectedUserGroup, (newGroup) => {
  // Wenn eine Gruppe ausgewählt wird, lösche die individuelle Nutzerauswahl
  if (newGroup) {
    selectedUser.value = ''
  }
})

// Watcher für Einzelner Nutzeränderungen
watch(selectedUser, (newUser) => {
  // Wenn ein Einzelner Nutzer ausgewählt wird, lösche die Gruppenauswahl
  if (newUser) {
    selectedUserGroup.value = ''
  }
})
</script>
