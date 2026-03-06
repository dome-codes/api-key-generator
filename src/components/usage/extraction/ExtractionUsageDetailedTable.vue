<script setup lang="ts">
import EmptyState from '../shared/EmptyState.vue'
import SkeletonLoader from '../shared/SkeletonLoader.vue'
import ErrorState from '../shared/ErrorState.vue'
import type { EnhancedExtractionUsageRecord } from '@/types/frontend'
import type { DocumentIntelligenceOperationStatus } from '@/api/types'
import type { Page } from '@/api/types'
import { computed, ref, watch } from 'vue'

interface Props {
  data: EnhancedExtractionUsageRecord[]
  isLoading?: boolean
  error?: string | null
  pagination?: Page
  sortField?: string // Aktuelles Sortierfeld vom Backend
  sortOrder?: 'asc' | 'desc' // Aktuelle Sortierreihenfolge vom Backend
  useBackendSorting?: boolean // Ob Backend-Sortierung verwendet werden soll
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
  pagination: undefined,
  sortField: undefined,
  sortOrder: undefined,
  useBackendSorting: false,
})

const paginationPage = computed(() => props.pagination?.currentPage ?? 1)
const paginationTotalPages = computed(() => props.pagination?.totalPages ?? 0)
const paginationTotal = computed(() => props.pagination?.totalItems ?? 0)

const emit = defineEmits<{
  'page-change': [page: number]
  'page-size-change': [pageSize: number]
  'sort-change': [field: string, order: 'asc' | 'desc']
  retry: []
}>()

// Local sort state (nur wenn useBackendSorting false)
const currentSortField = ref(props.sortField || 'createDate')
const currentSortOrder = ref<'asc' | 'desc'>(props.sortOrder || 'desc')

// Watch für Props-Änderungen
watch(
  () => props.sortField,
  (newValue: string | undefined) => {
    if (newValue !== undefined) {
      currentSortField.value = newValue || 'createDate'
    }
  },
  { immediate: true },
)
watch(
  () => props.sortOrder,
  (newValue: 'asc' | 'desc' | undefined) => {
    if (newValue !== undefined) {
      currentSortOrder.value = newValue || 'desc'
    }
  },
  { immediate: true },
)

// Sort-Funktion
const sortBy = (field: string) => {
  if (props.useBackendSorting) {
    // Backend-Sortierung: Emit Event
    const newOrder =
      currentSortField.value === field && currentSortOrder.value === 'asc' ? 'desc' : 'asc'
    currentSortField.value = field
    currentSortOrder.value = newOrder
    emit('sort-change', field, newOrder)
  } else {
    // Client-seitige Sortierung
    if (currentSortField.value === field) {
      currentSortOrder.value = currentSortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      currentSortField.value = field
      currentSortOrder.value = 'asc'
    }
  }
}

// Helper functions
const getStatusLabel = (status: DocumentIntelligenceOperationStatus | string): string => {
  const labels: Record<string, string> = {
    processing: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    failed: 'Fehlgeschlagen',
    canceled: 'Abgebrochen',
    skipped: 'Übersprungen',
  }
  return labels[status] || status
}

const getStatusClass = (status: DocumentIntelligenceOperationStatus | string): string => {
  const classes: Record<string, string> = {
    processing: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    canceled: 'bg-gray-100 text-gray-800',
    skipped: 'bg-blue-100 text-blue-800',
  }
  return classes[status as string] || 'bg-gray-100 text-gray-800'
}

const formatCost = (cost: number): string => {
  if (cost === 0) return '€0.00'
  return `€${cost.toFixed(2)}`
}

/** Exakter Kostenwert für Tooltip (immer anzeigen bei Hover). */
const costTitle = (cost: number | undefined | null, pages: number | undefined | null): string => {
  const c = cost ?? 0
  const p = pages ?? 0
  if (c > 0) return `Kosten: €${c.toFixed(4)}`
  if (p > 0) return 'Kosten werden vom Backend nicht geliefert.'
  return 'Kosten: €0.00'
}

/** Zeigt "–" wenn Confidence vom API nicht geliefert wird, sonst Prozent. */
const formatConfidence = (confidence: number | undefined | null): string => {
  if (confidence == null || (typeof confidence === 'number' && Number.isNaN(confidence))) return '–'
  return `${(Number(confidence) * 100).toFixed(1)}%`
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const getInitials = (name?: string): string => {
  if (!name) return '--'
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<template>
  <div class="bg-white rounded-xl shadow overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-800">Detaillierte Extraction-Nutzung</h3>
    </div>

    <div v-if="isLoading" class="p-6">
      <SkeletonLoader type="table" :rows="10" :columns="8" />
    </div>

    <div v-else-if="error" class="p-6">
      <ErrorState :error="error" @retry="$emit('retry')" />
    </div>

    <div v-else-if="!data || data.length === 0">
      <EmptyState
        title="Keine Extraction-Daten"
        description="Für die gewählten Filter wurden keine Extraction-Nutzungsdaten gefunden."
        :show-reset-button="false"
      />
    </div>

    <div v-else>
      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                @click="sortBy('userId')"
              >
                <div class="flex items-center gap-1">
                  Technischer Nutzer
                  <svg
                    v-if="currentSortField === 'userId'"
                    class="w-3 h-3"
                    :class="currentSortOrder === 'asc' ? 'rotate-180' : ''"
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
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Operation ID
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                @click="sortBy('status')"
              >
                <div class="flex items-center gap-1">
                  Status
                  <svg
                    v-if="currentSortField === 'status'"
                    class="w-3 h-3"
                    :class="currentSortOrder === 'asc' ? 'rotate-180' : ''"
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
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                @click="sortBy('provider')"
              >
                <div class="flex items-center gap-1">
                  Provider
                  <svg
                    v-if="currentSortField === 'provider'"
                    class="w-3 h-3"
                    :class="currentSortOrder === 'asc' ? 'rotate-180' : ''"
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
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Modell
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                @click="sortBy('pages')"
              >
                <div class="flex items-center gap-1">
                  Seiten
                  <svg
                    v-if="currentSortField === 'pages'"
                    class="w-3 h-3"
                    :class="currentSortOrder === 'asc' ? 'rotate-180' : ''"
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
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                @click="sortBy('confidenceScore')"
              >
                <div class="flex items-center gap-1">
                  Confidence
                  <svg
                    v-if="currentSortField === 'confidenceScore'"
                    class="w-3 h-3"
                    :class="currentSortOrder === 'asc' ? 'rotate-180' : ''"
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
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                @click="sortBy('cost')"
              >
                <div class="flex items-center gap-1">
                  Kosten
                  <svg
                    v-if="currentSortField === 'cost'"
                    class="w-3 h-3"
                    :class="currentSortOrder === 'asc' ? 'rotate-180' : ''"
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
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                @click="sortBy('createDate')"
              >
                <div class="flex items-center gap-1">
                  Datum
                  <svg
                    v-if="currentSortField === 'createDate'"
                    class="w-3 h-3"
                    :class="currentSortOrder === 'asc' ? 'rotate-180' : ''"
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
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tag
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                @click="sortBy('apiKeyId')"
              >
                <div class="flex items-center gap-1">
                  API Key ID
                  <svg
                    v-if="currentSortField === 'apiKeyId'"
                    class="w-3 h-3"
                    :class="currentSortOrder === 'asc' ? 'rotate-180' : ''"
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
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in data" :key="item.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-blue-800">
                      {{ getInitials(item.userName) }}
                    </span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ item.userName }}
                    </div>
                    <div class="text-sm text-gray-500">{{ item.userId || '–' }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                {{ item.operationId ? `${item.operationId.substring(0, 12)}...` : '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    getStatusClass(item.status ?? 'processing'),
                  ]"
                >
                  {{ getStatusLabel(item.status ?? 'processing') }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.provider ?? '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.modelId ?? '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.pages ?? 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatConfidence(item.confidenceScore) }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-help"
                :title="costTitle(item.cost, item.pages)"
              >
                {{ formatCost(item.cost ?? 0) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(item.createDate ?? '') }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800"
                >
                  {{ item.tag ?? '-' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                {{ item.apiKeyId || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination: immer anzeigen wenn Daten und Pagination-Info vorhanden -->
      <div v-if="pagination && data.length > 0" class="px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="text-sm text-gray-700">
              Seite {{ paginationPage }} von {{ Math.max(1, paginationTotalPages) }} ({{
                paginationTotal
              }}
              Einträge)
            </div>
            <div class="flex items-center gap-2">
              <label for="page-size-select-extraction" class="text-sm text-gray-700"
                >Einträge pro Seite:</label
              >
              <select
                id="page-size-select-extraction"
                :value="pagination?.pageSize || 20"
                class="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @change="
                  $emit('page-size-change', Number(($event.target as HTMLSelectElement).value))
                "
              >
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              :disabled="paginationPage <= 1"
              :class="[
                'px-3 py-2 text-sm font-medium rounded-md',
                paginationPage <= 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
              ]"
              @click="$emit('page-change', paginationPage - 1)"
            >
              Zurück
            </button>
            <button
              :disabled="paginationPage >= paginationTotalPages"
              :class="[
                'px-3 py-2 text-sm font-medium rounded-md',
                paginationPage >= paginationTotalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
              ]"
              @click="$emit('page-change', paginationPage + 1)"
            >
              Weiter
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
