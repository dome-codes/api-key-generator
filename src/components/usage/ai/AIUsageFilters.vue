<template>
  <BaseFilters
    :time-range="timeRange"
    :tag="tag"
    :api-key-id="apiKeyId"
    :from-date="fromDate"
    :to-date="toDate"
    tag-type="ai"
    :use-admin-api="showUserFilter"
    @update:time-range="$emit('update:timeRange', $event)"
    @update:tag="$emit('update:tag', $event)"
    @update:api-key-id="$emit('update:apiKeyId', $event)"
    @update:from-date="$emit('update:fromDate', $event)"
    @update:to-date="$emit('update:toDate', $event)"
    @filter-changed="handleFilterChange"
  >
    <!-- AI-spezifische Filter -->
    <template #specific-filters>
      <!-- Model Type Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Modelltyp</label>
        <select
          v-model="localModelType"
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
          v-model="localModelInput"
          type="text"
          placeholder="z.B. gpt-4o"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          @keyup.enter="handleFilterChange"
          @blur="handleFilterChange"
        />
      </div>
    </template>

    <!-- Admin-Filter -->
    <template #admin-filters>
      <div v-if="showUserFilter">
        <label class="block text-sm font-medium text-gray-700 mb-2">Benutzer</label>
        <select
          v-model="localSelectedUser"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          @change="handleFilterChange"
        >
          <option value="">Alle Benutzer</option>
          <option v-for="user in filteredUsers" :key="user.id" :value="user.id">
            {{ user.displayName }}
          </option>
        </select>
      </div>

      <div v-if="showUserFilter">
        <label class="block text-sm font-medium text-gray-700 mb-2">Gruppe</label>
        <select
          v-model="localSelectedUserGroup"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          @change="handleFilterChange"
        >
          <option value="">Alle Gruppen</option>
          <option v-for="group in availableGroups" :key="group.id" :value="group.id">
            {{ group.name }} ({{ group.count }})
          </option>
        </select>
      </div>
    </template>
  </BaseFilters>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseFilters from '../shared/BaseFilters.vue'

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

const localModelType = computed({
  get: () => props.modelType,
  set: (value) => emit('update:modelType', value),
})

// Local Model Input (wird erst beim Button-Klick oder Enter aktualisiert)
const localModelInput = ref(props.model || '')

// Sync props changes back to local input
watch(
  () => props.model,
  (newValue) => {
    if (newValue !== localModelInput.value) {
      localModelInput.value = newValue || ''
    }
  },
)

const localSelectedUser = computed({
  get: () => props.selectedUser || '',
  set: (value) => emit('update:selectedUser', value),
})

const localSelectedUserGroup = computed({
  get: () => props.selectedUserGroup || '',
  set: (value) => emit('update:selectedUserGroup', value),
})

const handleFilterChange = () => {
  // Aktualisiere alle Werte bevor der Filter ausgelöst wird
  emit('update:modelType', localModelType.value)
  emit('update:model', localModelInput.value)
  emit('update:selectedUser', localSelectedUser.value)
  emit('update:selectedUserGroup', localSelectedUserGroup.value)
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

  props.users.forEach((user) => {
    const group = getUserGroup(user.id)
    if (groups[group]) {
      groups[group].count++
    }
  })

  return Object.values(groups).filter((group) => group.count > 0)
})

const filteredUsers = computed(() => {
  if (!localSelectedUserGroup.value) {
    return props.users
  }

  return props.users.filter((user) => getUserGroup(user.id) === localSelectedUserGroup.value)
})

watch(localSelectedUserGroup, (newGroup) => {
  if (newGroup) {
    localSelectedUser.value = ''
  }
})

watch(localSelectedUser, (newUser) => {
  if (newUser) {
    localSelectedUserGroup.value = ''
  }
})
</script>
