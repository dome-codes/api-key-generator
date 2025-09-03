<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">Detaillierte Nutzungsübersicht</h3>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">{{ filteredData.length }} Einträge</span>
        <button
          @click="exportTableData"
          class="text-sm text-blue-600 hover:text-blue-800"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Exportiere...' : 'Als CSV exportieren' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">Lade Nutzungsdaten...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="text-red-800">{{ error }}</span>
      </div>
    </div>

    <!-- Data Table -->
    <div v-else-if="filteredData.length > 0" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Technischer Nutzer
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Modell
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Modelltyp
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Anfragen
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Tokens In
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Tokens Out
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Gesamt Tokens
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Kosten (€)
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Tag
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Datum
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="item in paginatedData"
            :key="`${item.technicalUserId}-${item.modelName}-${item.day}-${item.month}-${item.year}`"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-sm font-medium text-blue-800">
                    {{ getInitials(item.technicalUserName) }}
                  </span>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">{{ item.technicalUserName }}</div>
                  <div class="text-sm text-gray-500">{{ item.technicalUserId }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-900">{{ item.modelName }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getModelTypeBadgeClass(item.type || item.modelType)"
              >
                {{ getModelTypeLabel(item.type || item.modelType) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ item.requests.toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ item.tokensIn.toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ item.tokensOut.toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ item.totalTokens.toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatCost(item.cost) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ item.tag }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(item.day, item.month, item.year) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
        <div class="flex items-center text-sm text-gray-700">
          <span>
            Zeige {{ (currentPage - 1) * pageSize + 1 }} bis
            {{ Math.min(currentPage * pageSize, filteredData.length) }} von
            {{ filteredData.length }} Einträgen
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Zurück
          </button>
          <span class="text-sm text-gray-700"> Seite {{ currentPage }} von {{ totalPages }} </span>
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Weiter
          </button>
        </div>
      </div>

      <!-- Page Size Selector -->
      <div class="flex items-center justify-end mt-4">
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-700">Einträge pro Seite:</label>
          <select
            v-model="pageSize"
            @change="currentPage = 1"
            class="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
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

<script setup lang="ts">
import type { EnhancedUsageRecord, ModelUsageType } from '@/api/types/types'
import { formatCost } from '@/config/pricing'
import { computed, ref } from 'vue'

// Props
interface Props {
  data: EnhancedUsageRecord[]
  isLoading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
})

// Local state
const currentPage = ref(1)
const pageSize = ref(10)

// Computed
const filteredData = computed(() => props.data)

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
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

const getModelTypeLabel = (type: ModelUsageType): string => {
  switch (type) {
    case 'CompletionModelUsage':
      return 'Chat'
    case 'EmbeddingModelUsage':
      return 'Embedding'
    case 'ImageModelUsage':
      return 'Bild'
    default:
      return type
  }
}

const getModelTypeBadgeClass = (type: ModelUsageType): string => {
  switch (type) {
    case 'CompletionModelUsage':
      return 'bg-blue-100 text-blue-800'
    case 'EmbeddingModelUsage':
      return 'bg-green-100 text-green-800'
    case 'ImageModelUsage':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatDate = (day?: number, month?: number, year?: number): string => {
  if (day && month && year) {
    return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`
  }
  return '-'
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
      'Gesamt Tokens',
      'Kosten (€)',
      'Tag',
      'Tag',
      'Monat',
      'Jahr',
    ]

    const csvContent = [
      headers.join(','),
      ...filteredData.value.map((item) =>
        [
          item.technicalUserId,
          item.technicalUserName,
          item.modelName,
          item.type || item.modelType,
          item.requests,
          item.tokensIn,
          item.tokensOut,
          item.totalTokens,
          item.cost.toFixed(4),
          item.tag,
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
    console.error('Fehler beim Exportieren:', err)
  }
}

// Reset pagination when data changes
import { watch } from 'vue'
watch(
  () => props.data,
  () => {
    currentPage.value = 1
  },
)
</script>
