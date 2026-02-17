<template>
  <tr
    :class="[
      'border-b border-gray-200 last:border-0 group transition-colors',
      keyData.status === 'revoked' ? 'bg-gray-100 opacity-75' : 'hover:bg-gray-50',
      isChildRow ? 'bg-gray-50/50 border-l-4 border-l-blue-300' : '',
      expandable && expanded ? 'bg-blue-50/30' : '',
    ]"
  >
    <td v-if="isAdmin" class="py-3 px-2 w-10 text-center align-middle">
      <button
        v-if="expandable"
        type="button"
        @click="$emit('toggleExpand')"
        class="p-1 rounded hover:bg-gray-200 text-gray-600 transition-transform"
        :class="expanded ? 'rotate-90' : ''"
        :aria-expanded="expanded"
        :title="expanded ? 'Zuklappen' : 'Aufklappen'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <span v-else-if="isChildRow" class="inline-block w-4">&nbsp;</span>
    </td>
    <td class="py-3 px-4 text-sm" :class="isChildRow ? 'pl-10' : ''">
      <div :class="keyData.status === 'revoked' ? 'text-gray-500' : 'text-gray-900'">
        <span :class="keyData.status === 'revoked' ? 'line-through' : ''">{{ keyData.name }}</span>
        <!-- Badge nur bei Parent-Rows anzeigen, nicht bei Child-Rows -->
        <span
          v-if="keyData.status === 'revoked' && !isChildRow"
          class="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
        >
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
    <td v-if="isAdmin" class="py-3 px-4 text-xs">
      <!-- Bei Child-Rows: User-Info ausblenden (wird bereits in Parent-Row angezeigt) -->
      <template v-if="!isChildRow">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div>
            <div class="font-medium text-gray-900">
              {{ keyData.userName || keyData.userId || 'Unbekannt' }}
            </div>
            <div class="text-gray-500 text-xs">{{ keyData.userId || 'N/A' }}</div>
            <div
              v-if="keyData.userId && adminUsageByUser && adminUsageByUser[keyData.userId]"
              class="text-xs text-blue-600"
            >
              {{ adminUsageByUser[keyData.userId].keys.length }} Key(s)
            </div>
          </div>
        </div>
      </template>
      <!-- Bei Child-Rows: Leer lassen für bessere visuelle Gruppierung -->
      <span v-else class="text-gray-300">—</span>
    </td>
    <td class="py-3 px-4 text-xs">
      <!-- Status-Badge: Bei Child-Rows kompakter anzeigen -->
      <template v-if="!isChildRow">
        <span
          v-if="keyData.status === 'active'"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
        >
          Aktiv
        </span>
        <span
          v-else
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
        >
          Deaktiviert
        </span>
      </template>
      <!-- Bei Child-Rows: Kompaktere Anzeige -->
      <span
        v-else
        :class="[
          'inline-flex items-center px-1.5 py-0.5 rounded text-xs',
          keyData.status === 'active'
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700',
        ]"
      >
        {{ keyData.status === 'active' ? '✓' : '✗' }}
      </span>
    </td>
    <td class="py-3 px-4 text-xs text-gray-700">
      {{ new Date(keyData.createdAt).toLocaleDateString() }}
    </td>
    <td class="py-3 px-4 text-xs text-gray-700">{{ keyData.lastUsed }}</td>
    <td class="py-3 px-4 text-xs text-gray-700">
      {{ keyData.validUntil ? new Date(keyData.validUntil).toLocaleDateString() : '—' }}
    </td>
    <td v-if="isAdmin" class="py-3 px-4 text-xs">
      <div v-if="keyData.status === 'active'">
        <CostProgressBarTable
          :current-cost="usageData.cost"
          :budget-limit="budgetLimit"
          :tokens-in="usageData.tokensIn"
          :tokens-out="usageData.tokensOut"
          :show-detailed-info="true"
        />
      </div>
      <!-- Deaktivierte Keys: Verbrauch optional anzeigbar -->
      <div v-else>
        <button
          v-if="!showRevokedUsage"
          type="button"
          @click="showRevokedUsage = true"
          class="text-blue-600 hover:text-blue-800 text-xs underline"
        >
          Verbrauch anzeigen
        </button>
        <template v-else>
          <CostProgressBarTable
            :current-cost="usageData.cost"
            :budget-limit="budgetLimit"
            :tokens-in="usageData.tokensIn"
            :tokens-out="usageData.tokensOut"
            :show-detailed-info="true"
          />
          <button
            type="button"
            @click="showRevokedUsage = false"
            class="mt-1 text-gray-500 hover:text-gray-700 text-xs underline"
          >
            Ausblenden
          </button>
        </template>
      </div>
    </td>
    <td v-if="!isAdmin" class="py-3 px-4 text-xs">
      <div v-if="keyData.status === 'active'" class="text-center">
        <div class="text-sm text-gray-700">
          {{ formatNumber(usageData.tokensIn) }} In / {{ formatNumber(usageData.tokensOut) }} Out
        </div>
      </div>
      <!-- Deaktivierte Keys: Token-Verbrauch optional anzeigbar -->
      <div v-else class="text-center">
        <button
          v-if="!showRevokedUsage"
          type="button"
          @click="showRevokedUsage = true"
          class="text-blue-600 hover:text-blue-800 text-xs underline"
        >
          Verbrauch anzeigen
        </button>
        <template v-else>
          <div class="text-sm text-gray-700">
            {{ formatNumber(usageData.tokensIn) }} In / {{ formatNumber(usageData.tokensOut) }} Out
          </div>
          <button
            type="button"
            @click="showRevokedUsage = false"
            class="mt-1 text-gray-500 hover:text-gray-700 text-xs underline"
          >
            Ausblenden
          </button>
        </template>
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
import type { ApiKeyDisplay, ApiKeyUsageData } from '@/api/types/frontend'
import CostProgressBarTable from '@/components/usage/CostProgressBarTable.vue'
import { computed, ref } from 'vue'

const showRevokedUsage = ref(false)

const props = withDefaults(
  defineProps<{
    keyData: ApiKeyDisplay
    editing: boolean
    editingName: string
    usageData: ApiKeyUsageData
    budgetLimit: number
    isAdmin: boolean
    isEntwicklung: boolean
    adminUsageByUser?: {
      [userId: string]: { cost: number; tokensIn: number; tokensOut: number; keys: string[] }
    }
    /** Admin: Zeile ist aufklappbar (Gruppenzeile) */
    expandable?: boolean
    /** Admin: Gruppe ist aufgeklappt */
    expanded?: boolean
    /** Admin: Anzahl Keys in der Gruppe */
    childCount?: number
    /** Admin: Zeile ist eine Unterzeile (einzelner Key unter Gruppe) */
    isChildRow?: boolean
  }>(),
  {
    expandable: false,
    expanded: false,
    childCount: 0,
    isChildRow: false,
  },
)

const emits = defineEmits<{
  edit: [key: ApiKeyDisplay]
  save: [apiKey: string]
  cancel: []
  revoke: [keyId: string]
  rotate: [key: ApiKeyDisplay]
  'name-input': [value: string]
  toggleExpand: []
}>()

// Check if key expires within 30 days to show rotate button
const shouldShowRotateButton = computed(() => {
  if (!props.keyData.validUntil || props.keyData.validUntil === 'Never') return false
  const expiryDate = new Date(props.keyData.validUntil)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  return expiryDate <= thirtyDaysFromNow
})

// Helper function for number formatting
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

// Helper function for token ratio formatting
const formatTokenRatio = (tokensIn: number, tokensOut: number): string => {
  if (tokensIn === 0) return '0:0'
  const ratio = tokensOut / tokensIn
  if (ratio >= 1) {
    return `1:${ratio.toFixed(1)}`
  } else {
    return `${(1 / ratio).toFixed(1)}:1`
  }
}
</script>
