<template>
  <div class="bg-white rounded-xl shadow-lg overflow-hidden">
    <table v-if="paginatedKeys.length" class="w-full text-left border-collapse">
      <thead>
        <tr
          class="text-gray-800 border-b border-gray-200 text-xs uppercase tracking-wider bg-gray-50"
        >
          <th
            class="py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
            @click="sortBy('name')"
          >
            <div class="flex items-center gap-1">
              Name
              <svg
                v-if="sortField === 'name'"
                class="w-3 h-3"
                :class="sortOrder === 'asc' ? 'rotate-180' : ''"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </div>
          </th>
          <th class="py-3 px-4 font-semibold">Geheimer Schlüssel</th>
          <th
            class="py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
            @click="sortBy('createdAt')"
          >
            <div class="flex items-center gap-1">
              Erstellt
              <svg
                v-if="sortField === 'createdAt'"
                class="w-3 h-3"
                :class="sortOrder === 'asc' ? 'rotate-180' : ''"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </div>
          </th>
          <th class="py-3 px-4 font-semibold">Zuletzt verwendet</th>
          <th class="py-3 px-4 font-semibold">Gültig bis</th>
          <th
            class="py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
            @click="sortBy('cost')"
          >
            <div class="flex items-center gap-1">
              Kostenverbrauch<br /><span class="text-xs text-gray-500 font-normal"
                >(Aktueller Monat)</span
              >
              <svg
                v-if="sortField === 'cost'"
                class="w-3 h-3"
                :class="sortOrder === 'asc' ? 'rotate-180' : ''"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </div>
          </th>
          <th class="py-3 px-4 font-semibold text-right">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <ApiKeyRow
          v-for="key in paginatedKeys"
          :key="key.id"
          :keyData="key"
          :editing="editingKey === key.id"
          :editingName="editingName"
          :usageData="getUsageDataForKey(key.id)"
          :budgetLimit="budgetLimit"
          @edit="$emit('edit', $event)"
          @save="$emit('save', $event)"
          @cancel="$emit('cancel')"
          @revoke="$emit('revoke', $event)"
          @name-input="$emit('name-input', $event)"
        />
      </tbody>
    </table>
    <div v-else class="text-center text-gray-600 py-8">Keine API-Schlüssel verfügbar.</div>

    <!-- Pagination -->
    <Pagination
      v-if="sortedKeys.length > itemsPerPage"
      :current-page="currentPage"
      :total-items="sortedKeys.length"
      :items-per-page="itemsPerPage"
      @update:current-page="currentPage = $event"
    />
  </div>
</template>

<script setup lang="ts">
import Pagination from '@/components/ui/Pagination.vue'
import { computed, ref } from 'vue'
import ApiKeyRow from './ApiKeyRow.vue'

// Legacy interface for backward compatibility
interface LegacyApiKey {
  id: string
  apiKey: string
  name: string
  permissions: string
  createdAt: string
  createdBy: string
  validUntil: string
  lastUsed: string
  status: string
}

interface UsageData {
  cost: number
  tokensIn: number
  tokensOut: number
}

const props = defineProps<{
  keys: LegacyApiKey[]
  editingKey: string | null
  editingName: string
  budgetLimit: number
  usageData?: { [keyId: string]: UsageData }
}>()

const emits = defineEmits<{
  edit: [key: LegacyApiKey]
  save: [apiKey: string]
  cancel: []
  revoke: [keyId: string]
  'name-input': [value: string]
}>()

// Pagination state
const currentPage = ref(1)
const itemsPerPage = 8 // Zeige 8 API Keys pro Seite

// Sortierung state
const sortField = ref('status')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Computed properties
const sortedKeys = computed(() => {
  const keys = [...props.keys]

  return keys.sort((a, b) => {
    let comparison = 0

    switch (sortField.value) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'status':
        // Aktive Keys zuerst, dann deaktivierte
        if (a.status === 'active' && b.status === 'revoked') comparison = -1
        else if (a.status === 'revoked' && b.status === 'active') comparison = 1
        else comparison = 0
        break
      case 'cost':
        const costA = props.usageData?.[a.id]?.cost || 0
        const costB = props.usageData?.[b.id]?.cost || 0
        comparison = costA - costB
        break
      default:
        comparison = 0
    }

    // Bei gleichem Wert: nach Erstellungsdatum sortieren (neueste zuerst)
    if (comparison === 0 && sortField.value !== 'createdAt') {
      comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})

const paginatedKeys = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return sortedKeys.value.slice(startIndex, endIndex)
})

// Methods
const sortBy = (field: string) => {
  if (sortField.value === field) {
    // Toggle sort order if same field
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new field and default to desc
    sortField.value = field
    sortOrder.value = 'desc'
  }
  currentPage.value = 1 // Reset to first page when sorting changes
}

// Get usage data for a specific key
const getUsageDataForKey = (keyId: string): UsageData => {
  if (!props.usageData || !props.usageData[keyId]) {
    return {
      cost: 0,
      tokensIn: 0,
      tokensOut: 0,
    }
  }
  return props.usageData[keyId]
}
</script>
