<template>
  <tr 
    :class="[
      'border-b border-gray-200 last:border-0 group',
      keyData.status === 'revoked' 
        ? 'bg-gray-100 opacity-75' 
        : 'hover:bg-gray-50'
    ]"
  >
    <td class="py-3 px-4 text-sm">
      <div :class="keyData.status === 'revoked' ? 'text-gray-500' : 'text-gray-900'">
        <span :class="keyData.status === 'revoked' ? 'line-through' : ''">{{ keyData.name }}</span>
        <span v-if="keyData.status === 'revoked'" class="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
          Deaktiviert
        </span>
      </div>
    </td>
    <td class="py-3 px-4 font-mono text-xs break-all">
      <span v-if="keyData.status === 'active'" class="text-gray-900"
        >sk-•••{{ keyData.apiKey.slice(-4) }}</span
      >
      <span v-else class="text-gray-400">sk-•••{{ keyData.apiKey.slice(-4) }}</span>
    </td>
    <td class="py-3 px-4 text-xs text-gray-700">
      {{ new Date(keyData.createdAt).toLocaleDateString() }}
    </td>
    <td class="py-3 px-4 text-xs text-gray-700">{{ keyData.lastUsed }}</td>
    <td class="py-3 px-4 text-xs text-gray-700">
      {{ keyData.validUntil ? new Date(keyData.validUntil).toLocaleDateString() : '—' }}
    </td>
    <td class="py-3 px-4 text-xs">
      <!-- Progress Bar nur für aktive API-Keys anzeigen -->
      <div v-if="keyData.status === 'active'">
        <CostProgressBarTable
          :current-cost="usageData.cost"
          :budget-limit="budgetLimit"
          :tokens-in="usageData.tokensIn"
          :tokens-out="usageData.tokensOut"
          :show-detailed-info="true"
        />
      </div>
      <!-- Für deaktivierte Keys: "Nicht in Gebrauch" anzeigen -->
      <div v-else class="text-gray-400 text-xs italic">
        Nicht in Gebrauch
      </div>
    </td>
    <td class="py-3 px-4 text-xs text-right">
      <div class="flex justify-end gap-1">
        <button
          v-if="keyData.status === 'active' && shouldShowRotateButton"
          @click="$emit('rotate', keyData)"
          class="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-orange-600 transition-colors"
          title="Schlüssel rotieren"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <button
          v-if="keyData.status === 'active'"
          @click="$emit('revoke', keyData.id)"
          class="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-red-600 transition-colors"
          title="Deaktivieren"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
            />
          </svg>
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import CostProgressBarTable from '@/components/usage/CostProgressBarTable.vue'
import { computed } from 'vue'

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
  keyData: LegacyApiKey
  editing: boolean
  editingName: string
  usageData: UsageData
  budgetLimit: number
}>()

const emits = defineEmits<{
  edit: [key: LegacyApiKey]
  save: [apiKey: string]
  cancel: []
  revoke: [keyId: string]
  rotate: [key: LegacyApiKey]
  'name-input': [value: string]
}>()

// Check if key expires within 30 days to show rotate button
const shouldShowRotateButton = computed(() => {
  if (!props.keyData.validUntil || props.keyData.validUntil === 'Never') return false
  const expiryDate = new Date(props.keyData.validUntil)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  return expiryDate <= thirtyDaysFromNow
})
</script>
