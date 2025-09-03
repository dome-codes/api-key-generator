<template>
  <div class="bg-white rounded-xl shadow-lg overflow-hidden">
    <table v-if="paginatedKeys.length" class="w-full text-left border-collapse">
      <thead>
        <tr
          class="text-gray-800 border-b border-gray-200 text-xs uppercase tracking-wider bg-gray-50"
        >
          <th class="py-3 px-4 font-semibold">Name</th>
          <th class="py-3 px-4 font-semibold">Geheimer Schlüssel</th>
          <th class="py-3 px-4 font-semibold">Erstellt</th>
          <th class="py-3 px-4 font-semibold">Zuletzt verwendet</th>
          <th class="py-3 px-4 font-semibold">Gültig bis</th>
          <th class="py-3 px-4 font-semibold">
            Kostenverbrauch<br /><span class="text-xs text-gray-500 font-normal"
              >(Aktueller Monat)</span
            >
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
      v-if="keys.length > itemsPerPage"
      :current-page="currentPage"
      :total-items="keys.length"
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

// Computed properties
const paginatedKeys = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return props.keys.slice(startIndex, endIndex)
})

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
