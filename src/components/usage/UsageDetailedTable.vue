<script setup lang="ts">
import type { EnhancedUsageRecord } from '@/types/frontend'
import type { ModelUsageType } from '@/api/types'
import { formatCost } from '@/config/pricing'
import { sortUsageRecords } from '@/utils/sortUsageRecords'
import ErrorState from './shared/ErrorState.vue'
import SkeletonLoader from './shared/SkeletonLoader.vue'
import { computed, ref, watch } from 'vue'
import { debugLog } from '@/utils/debugLog'

const emit = defineEmits<{
  'page-change': [page: number]
  'page-size-change': [pageSize: number]
  'sort-change': [field: string, order: 'asc' | 'desc']
  retry: []
}>()

// Local state
const currentPage = ref(1)
const pageSize = ref(10)

// Page size change handled inline in template

// Props für Backend-Sortierung (optional)
interface Props {
  data: EnhancedUsageRecord[]
  isLoading?: boolean
  error?: string | null
  pagination?: import('@/api/types').Page
  sortField?: string // Aktuelles Sortierfeld vom Backend
  sortOrder?: 'asc' | 'desc' // Aktuelle Sortierreihenfolge vom Backend
  useBackendSorting?: boolean // Ob Backend-Sortierung verwendet werden soll
  /** Wenn gesetzt: Spalten Größe/Qualität nur bei IMAGE_USAGE anzeigen (sonst ausblenden) */
  modelTypeFilter?: string
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
  pagination: undefined,
  sortField: undefined,
  sortOrder: undefined,
  useBackendSorting: false,
  modelTypeFilter: undefined,
})

// Sortierung state - wird von Props übernommen wenn Backend-Sortierung aktiv ist
const localSortField = ref('date')
const localSortOrder = ref<'asc' | 'desc'>('desc')

// Größe/Qualität nur bei Image-Nutzung oder wenn kein Filter gesetzt
const showImageColumns = computed(() => {
  const f = (props.modelTypeFilter || '').toLowerCase()
  if (!f) return true
  return f.includes('image') || f === 'image_model_usage' || f === 'imageusage'
})

// Computed
const filteredData = computed(() => props.data)

// Sortierung: einheitliche Logik aus @/utils/sortUsageRecords (wiederverwendbar für andere Tabellen)
const sortedData = computed(() => {
  const field = props.useBackendSorting && props.sortField ? props.sortField : localSortField.value
  const order =
    (props.useBackendSorting && props.sortOrder ? props.sortOrder : localSortOrder.value) || 'desc'
  return sortUsageRecords(filteredData.value, field, order)
})

// Aktuelles Sortierfeld für Anzeige
const currentSortField = computed(() => {
  return props.useBackendSorting && props.sortField ? props.sortField : localSortField.value
})

const currentSortOrder = computed(() => {
  return props.useBackendSorting && props.sortOrder ? props.sortOrder : localSortOrder.value
})

const paginationPage = computed(() => props.pagination?.currentPage ?? 1)
const paginationTotalPages = computed(() => props.pagination?.totalPages ?? 0)
const paginationTotal = computed(() => props.pagination?.totalItems ?? 0)

// Wenn Backend-Pagination vorhanden ist, nutze diese, sonst Client-seitige Pagination
const totalPages = computed(() => {
  if (props.pagination) {
    return props.pagination?.totalPages ?? 0
  }
  return Math.ceil(sortedData.value.length / pageSize.value)
})

// Display data - nutze Backend-Pagination wenn vorhanden, sonst Client-seitige
const displayData = computed(() => {
  // Wenn Backend-Pagination vorhanden ist, zeige alle Daten (bereits paginiert)
  if (props.pagination) {
    return sortedData.value
  }
  // Sonst nutze Client-seitige Pagination
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedData.value.slice(start, end)
})

// Methods
const getInitials = (name?: string): string => {
  if (!name) return '--'

  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getModelTypeLabel = (type: ModelUsageType | string): string => {
  switch (type) {
    case 'CompletionModelUsage':
    case 'COMPLETION_USAGE':
      return 'Chat'
    case 'EmbeddingModelUsage':
    case 'EMBEDDING_USAGE':
      return 'Embedding'
    case 'ImageModelUsage':
    case 'IMAGE_USAGE':
      return 'Bild'
    default:
      return type || 'Chat'
  }
}

const getModelTypeBadgeClass = (type: ModelUsageType | string): string => {
  switch (type) {
    case 'CompletionModelUsage':
    case 'COMPLETION_USAGE':
      return 'bg-blue-100 text-blue-800'
    case 'EmbeddingModelUsage':
    case 'EMBEDDING_USAGE':
      return 'bg-green-100 text-green-800'
    case 'ImageModelUsage':
    case 'IMAGE_USAGE':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatDate = (day?: number, month?: number, year?: number, createDate?: string): string => {
  if (day != null && month != null && year != null) {
    return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`
  }
  if (createDate && String(createDate).trim()) {
    try {
      const d = new Date(createDate)
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      }
    } catch {
      // ignore
    }
  }
  return '–'
}

const formatImageSize = (width?: number, height?: number): string => {
  if (width != null && height != null) return `${width}×${height}`
  if (width != null) return `${width}×?`
  if (height != null) return `?×${height}`
  return '–'
}

// Methods
const sortBy = (field: string) => {
  if (props.useBackendSorting) {
    // Backend-Sortierung: Emitte Event an Parent-Komponente
    const newOrder =
      currentSortField.value === field && currentSortOrder.value === 'desc' ? 'asc' : 'desc'
    emit('sort-change', field, newOrder)
  } else {
    // Client-seitige Sortierung (Fallback)
    if (localSortField.value === field) {
      // Toggle sort order if same field
      localSortOrder.value = localSortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      // Set new field and default to desc
      localSortField.value = field
      localSortOrder.value = 'desc'
    }
    currentPage.value = 1 // Reset to first page when sorting changes
  }
}

const exportTableData = async () => {
  try {
    const headers = [
      'Technische User ID',
      'Technischer Benutzername',
      'Modell',
      'Modelltyp',
      'Anfragen',
      'Tokens In',
      'Tokens Out',
      'Reasoning Tokens',
      'Cached Tokens',
      'Gesamt Tokens',
      'Kosten (€)',
      'Tag',
      'Größe',
      'Qualität',
      'API Key ID',
      'Tag',
      'Monat',
      'Jahr',
    ]

    const csvContent = [
      headers.join(','),
      ...sortedData.value.map((item) =>
        [
          item.userId,
          item.technicalUserName ?? item.userName,
          item.modelName,
          item.type || item.modelType,
          item.requests,
          item.tokensIn,
          item.tokensOut,
          (item as EnhancedUsageRecord & { reasoningTokens?: number }).reasoningTokens ?? '',
          (item as EnhancedUsageRecord & { cachedTokens?: number }).cachedTokens ?? '',
          item.totalTokens,
          (item.cost ?? 0).toFixed(4),
          item.tag,
          formatImageSize(item.sizeWidth, item.sizeHeight),
          item.quality || '',
          item.apiKeyId || '',
          item.day || '',
          item.month || '',
          item.year || '',
        ].join(','),
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `detailed-usage-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  } catch (err) {
    debugLog('Fehler beim Exportieren:', err)
  }
}

// Reset pagination when data changes
watch(
  () => props.data,
  () => {
    currentPage.value = 1
  },
)
</script>

<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">Detaillierte Nutzungsübersicht</h3>
      <div class="flex items-center gap-2">
        <span v-if="pagination && displayData.length > 0" class="text-sm text-gray-500">
          {{ pagination.totalItems }} Einträge (Seite {{ pagination.currentPage }} von
          {{ pagination.totalPages }})
        </span>
        <span v-else class="text-sm text-gray-500">{{ data.length }} Einträge</span>
        <button
          class="text-sm text-link hover:text-primary-hover"
          :disabled="isLoading"
          @click="exportTableData"
        >
          {{ isLoading ? 'Exportiere...' : 'Als CSV exportieren' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-6">
      <SkeletonLoader type="table" :rows="10" :columns="9" />
    </div>

    <!-- Error State -->
    <div v-else-if="error">
      <ErrorState :error="error" @retry="$emit('retry')" />
    </div>

    <!-- Data Table -->
    <div v-else-if="displayData.length > 0" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              @click="sortBy('userName')"
            >
              <div class="flex items-center gap-1">
                Technischer Nutzer
                <svg
                  class="w-3 h-3"
                  :class="
                    currentSortField === 'userName' ||
                    currentSortField === 'user' ||
                    currentSortField === 'technicalUserName'
                      ? currentSortOrder === 'asc'
                        ? 'rotate-180'
                        : ''
                      : 'opacity-30'
                  "
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
              @click="sortBy('modelName')"
            >
              <div class="flex items-center gap-1">
                Modell
                <svg
                  v-if="currentSortField === 'modelName' || currentSortField === 'model'"
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
              @click="sortBy('modelType')"
            >
              <div class="flex items-center gap-1">
                Modelltyp
                <svg
                  class="w-3 h-3"
                  :class="
                    currentSortField === 'modelType'
                      ? currentSortOrder === 'asc'
                        ? 'rotate-180'
                        : ''
                      : 'opacity-30'
                  "
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
              @click="sortBy('tokensIn')"
            >
              <div class="flex items-center gap-1">
                Tokens In
                <svg
                  v-if="currentSortField === 'tokensIn'"
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
              @click="sortBy('tokensOut')"
            >
              <div class="flex items-center gap-1">
                Tokens Out
                <svg
                  v-if="currentSortField === 'tokensOut'"
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
              @click="sortBy('reasoningTokens')"
            >
              <div class="flex items-center gap-1">
                Reasoning Tokens
                <svg
                  v-if="currentSortField === 'reasoningTokens'"
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
              @click="sortBy('cachedTokens')"
            >
              <div class="flex items-center gap-1">
                Cached Tokens
                <svg
                  v-if="currentSortField === 'cachedTokens'"
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
              @click="sortBy('totalTokens')"
            >
              <div class="flex items-center gap-1">
                Gesamt Tokens
                <svg
                  v-if="currentSortField === 'totalTokens'"
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
                Kosten (€)
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
              @click="sortBy('tag')"
            >
              <div class="flex items-center gap-1">
                Tag
                <svg
                  v-if="currentSortField === 'tag'"
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
              v-if="showImageColumns"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              @click="sortBy('imageSize')"
            >
              <div class="flex items-center gap-1">
                Größe
                <svg
                  v-if="currentSortField === 'imageSize'"
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
              v-if="showImageColumns"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              @click="sortBy('quality')"
            >
              <div class="flex items-center gap-1">
                Qualität
                <svg
                  v-if="currentSortField === 'quality'"
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
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              @click="sortBy('date')"
            >
              <div class="flex items-center gap-1">
                Datum
                <svg
                  v-if="currentSortField === 'date'"
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
          <tr
            v-for="item in displayData"
            :key="`${item.userId}-${item.modelName}-${item.day}-${item.month}-${item.year}`"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-sm font-medium text-blue-800">
                    {{ getInitials(item.technicalUserName ?? item.userName) }}
                  </span>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ item.technicalUserName ?? item.userName }}
                  </div>
                  <div class="text-sm text-gray-500">{{ item.userId || '–' }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-900">{{ item.modelName }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getModelTypeBadgeClass(item.type ?? item.modelType ?? '')"
              >
                {{ getModelTypeLabel(item.type ?? item.modelType ?? 'CompletionModelUsage') }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ (item.tokensIn ?? 0).toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ (item.tokensOut ?? 0).toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ ((item as EnhancedUsageRecord & { reasoningTokens?: number }).reasoningTokens ?? 0).toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ ((item as EnhancedUsageRecord & { cachedTokens?: number }).cachedTokens ?? 0).toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ (item.totalTokens ?? 0).toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatCost(item.cost ?? 0) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ item.tag }}
            </td>
            <td v-if="showImageColumns" class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ formatImageSize(item.sizeWidth, item.sizeHeight) }}
            </td>
            <td v-if="showImageColumns" class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ item.quality || '–' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
              {{ item.apiKeyId || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(item.day, item.month, item.year, item.createDate) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination: Backend-Pagination hat Priorität, sonst Client-seitige Pagination -->
      <!-- Backend-Pagination: immer anzeigen wenn Backend-Pagination und Daten vorhanden -->
      <div
        v-if="pagination && displayData.length > 0"
        class="flex items-center justify-between mt-4 px-6 py-4 border-t border-gray-200"
      >
        <div class="flex items-center gap-4">
          <div class="text-sm text-gray-700">
            Seite {{ paginationPage }} von {{ Math.max(1, paginationTotalPages) }} ({{ paginationTotal }} Einträge)
          </div>
          <div class="flex items-center gap-2">
            <label for="page-size-select" class="text-sm text-gray-700">Einträge pro Seite:</label>
            <select
              id="page-size-select"
              :value="pagination?.pageSize || 20"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @change="$emit('page-size-change', Number(($event.target as HTMLSelectElement).value))"
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
      <!-- Client-seitige Pagination (Fallback wenn keine Backend-Pagination) -->
      <div v-else-if="!pagination && totalPages > 1" class="flex items-center justify-between mt-4">
        <div class="flex items-center text-sm text-gray-700">
          <span>
            Zeige {{ (currentPage - 1) * pageSize + 1 }} bis
            {{ Math.min(currentPage * pageSize, sortedData.length) }} von
            {{ sortedData.length }} Einträgen
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <button
            :disabled="currentPage === 1"
            class="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            @click="currentPage = Math.max(1, currentPage - 1)"
          >
            Zurück
          </button>
          <span class="text-sm text-gray-700"> Seite {{ currentPage }} von {{ totalPages }} </span>
          <button
            :disabled="currentPage === totalPages"
            class="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
          >
            Weiter
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Keine Nutzungsdaten</h3>
      <p class="mt-1 text-sm text-gray-500">
        Für den ausgewählten Zeitraum wurden keine Nutzungsdaten gefunden.
      </p>
    </div>
  </div>
</template>
