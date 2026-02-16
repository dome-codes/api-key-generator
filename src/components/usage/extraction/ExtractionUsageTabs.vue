<template>
  <div>
    <!-- Tabs Navigation -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          @click="activeTab = 'own'"
          :class="[
            activeTab === 'own'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
          ]"
        >
          <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Meine Extraction-Nutzung
        </button>

        <button
          v-if="isApiAdmin"
          @click="activeTab = 'admin'"
          :class="[
            activeTab === 'admin'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
          ]"
        >
          <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Admin Extraction-Nutzung (Alle Konten)
        </button>
      </nav>
    </div>

    <!-- Tab Content: Own Usage -->
    <div v-if="activeTab === 'own'" class="space-y-6">
      <!-- Filter Section -->
      <ExtractionUsageFilters
        v-model:time-range="ownTimeRange"
        v-model:provider="ownProvider"
        v-model:status="ownStatus"
        v-model:tag="ownTag"
        v-model:from-date="ownFromDate"
        v-model:to-date="ownToDate"
        @filter-changed="handleOwnFilterChange"
      />

      <!-- View Toggle -->
      <div class="flex justify-end">
        <div class="inline-flex rounded-lg border border-gray-300 bg-white p-1">
          <button
            @click="ownView = 'overview'"
            :class="[
              ownView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100',
              'px-4 py-2 rounded-md text-sm font-medium',
            ]"
          >
            Übersicht
          </button>
          <button
            @click="ownView = 'detailed'"
            :class="[
              ownView === 'detailed'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100',
              'px-4 py-2 rounded-md text-sm font-medium',
            ]"
          >
            Details
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <ExtractionUsageSummary
        title="Meine Extraction-Nutzungsdaten"
        description="Hier sehen Sie Ihre persönlichen Document Intelligence Nutzungsdaten."
        :summary="ownAggregation"
        :is-loading="isLoading"
        :error="error"
        @retry="handleRetry"
      />

      <!-- Charts -->
      <div v-if="ownView === 'overview'" class="space-y-6">
        <ExtractionUsageCharts
          line-chart-title="Extraction-Nutzungsverlauf"
          :line-chart-data="chartData"
          :provider-distribution-data="providerDistributionChartData"
          :status-distribution-data="statusDistributionChartData"
        />
      </div>

      <!-- Detailed Table -->
      <ExtractionUsageDetailedTable
        v-if="ownView === 'detailed'"
        :data="usageData"
        :is-loading="isLoading"
        :error="error"
        :pagination="pagination"
        @page-change="handlePageChange"
      />
    </div>

    <!-- Tab Content: Admin Usage -->
    <div v-else-if="activeTab === 'admin'" class="space-y-6">
      <!-- Filter Section -->
      <ExtractionUsageFilters
        v-model:time-range="adminTimeRange"
        v-model:provider="adminProvider"
        v-model:status="adminStatus"
        v-model:tag="adminTag"
        v-model:from-date="adminFromDate"
        v-model:to-date="adminToDate"
        v-model:selected-user="adminUser"
        v-model:selected-user-group="adminUserGroup"
        :show-user-filter="true"
        :users="uniqueUsers"
        @filter-changed="handleAdminFilterChange"
      />

      <!-- View Toggle -->
      <div class="flex justify-end">
        <div class="inline-flex rounded-lg border border-gray-300 bg-white p-1">
          <button
            @click="adminView = 'overview'"
            :class="[
              adminView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100',
              'px-4 py-2 rounded-md text-sm font-medium',
            ]"
          >
            Übersicht
          </button>
          <button
            @click="adminView = 'detailed'"
            :class="[
              adminView === 'detailed'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100',
              'px-4 py-2 rounded-md text-sm font-medium',
            ]"
          >
            Details
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <ExtractionUsageSummary
        title="Admin Extraction-Nutzung - Alle Konten"
        description="Übersicht über die Document Intelligence Nutzung aller Benutzer."
        :summary="adminAggregation"
        :is-loading="isLoading"
        :error="error"
        :show-unique-users="true"
        :show-unique-providers="true"
        :show-unique-models="true"
        :show-status-breakdown="true"
        @retry="handleRetry"
      />

      <!-- Charts -->
      <div v-if="adminView === 'overview'" class="space-y-6">
        <ExtractionUsageCharts
          line-chart-title="Admin Extraction-Nutzungsverlauf"
          :line-chart-data="chartData"
          :provider-distribution-data="providerDistributionChartData"
          :status-distribution-data="statusDistributionChartData"
        />
      </div>

      <!-- Detailed Table -->
      <ExtractionUsageDetailedTable
        v-if="adminView === 'detailed'"
        :data="usageData"
        :is-loading="isLoading"
        :error="error"
        :pagination="pagination"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { hasPermission } from '@/auth/keycloak'
import { useExtractionUsageApi } from '@/composables/useExtractionUsageApi'
import { computed, onMounted, ref, watch } from 'vue'
import type { ExtractionOperationStatus } from '@/api/types/extraction'
import ExtractionUsageCharts from './ExtractionUsageCharts.vue'
import ExtractionUsageFilters from './ExtractionUsageFilters.vue'
import ExtractionUsageSummary from './ExtractionUsageSummary.vue'
import ExtractionUsageDetailedTable from './ExtractionUsageDetailedTable.vue'

const activeTab = ref('own')
const isApiAdmin = computed(() => hasPermission('canViewAdminUsage'))

// Extraction Usage Composable mit API-basierter Filterung
const {
  isLoading,
  error,
  usageData,
  pagination,
  usageAggregation,
  chartData,
  providerDistributionChartData,
  statusDistributionChartData,
  loadUsageData,
  loadUsageSummary,
  updateFilter,
  goToPage,
} = useExtractionUsageApi()

// Filter State - Own
const ownTimeRange = ref('30d')
const ownProvider = ref('')
const ownStatus = ref<ExtractionOperationStatus | ''>('')
const ownTag = ref('')
const ownView = ref<'overview' | 'detailed'>('overview')
const ownFromDate = ref('')
const ownToDate = ref('')

// Filter State - Admin
const adminTimeRange = ref('30d')
const adminProvider = ref('')
const adminStatus = ref<ExtractionOperationStatus | ''>('')
const adminTag = ref('')
const adminUser = ref('')
const adminUserGroup = ref('')
const adminView = ref<'overview' | 'detailed'>('overview')
const adminFromDate = ref('')
const adminToDate = ref('')

// Unique users for admin filter (would come from API in real implementation)
const uniqueUsers = ref<Array<{ id: string; displayName: string }>>([])

// Initialize default dates - Standardmäßig KEINE Datumsfilterung (leer = alle Daten)
const setDefaultDates = () => {
  // Leer lassen = keine Datumsfilterung, zeigt alle verfügbaren Daten
  ownFromDate.value = ''
  ownToDate.value = ''
  adminFromDate.value = ''
  adminToDate.value = ''
}

// Computed aggregations
const ownAggregation = computed(() => usageAggregation.value)
const adminAggregation = computed(() => usageAggregation.value)

// Convert date string to ISO format
const toIsoDate = (dateStr: string): string | undefined => {
  if (!dateStr || dateStr.trim() === '') return undefined
  return new Date(dateStr + 'T00:00:00Z').toISOString()
}

// Handle filter changes - Own
const handleOwnFilterChange = async () => {
  await updateFilter(
    {
      fromDate: toIsoDate(ownFromDate.value),
      toDate: toIsoDate(ownToDate.value),
      provider: ownProvider.value || undefined,
      status: ownStatus.value || undefined,
      tag: ownTag.value || undefined,
      groupBy: ownView.value === 'overview' ? ['day', 'month', 'year'] : undefined,
    },
    false, // useAdminApi = false
  )

  if (ownView.value === 'overview') {
    await loadUsageSummary({}, false)
  } else {
    await loadUsageData({}, false)
  }
}

// Handle filter changes - Admin
const handleAdminFilterChange = async () => {
  await updateFilter(
    {
      fromDate: toIsoDate(adminFromDate.value),
      toDate: toIsoDate(adminToDate.value),
      provider: adminProvider.value || undefined,
      status: adminStatus.value || undefined,
      tag: adminTag.value || undefined,
      userId: adminUser.value || undefined,
      groupBy: adminView.value === 'overview' ? ['day', 'month', 'year'] : undefined,
    },
    true, // useAdminApi = true
  )

  if (adminView.value === 'overview') {
    await loadUsageSummary({}, true)
  } else {
    await loadUsageData({}, true)
  }
}

// Handle page change
const handlePageChange = async (page: number) => {
  const useAdminApi = activeTab.value === 'admin'
  await goToPage(page, useAdminApi)
}

// Handle retry
const handleRetry = async () => {
  if (activeTab.value === 'own') {
    await handleOwnFilterChange()
  } else if (activeTab.value === 'admin') {
    await handleAdminFilterChange()
  }
}

// Watch for tab changes
watch(activeTab, async (newTab) => {
  if (newTab === 'own') {
    await handleOwnFilterChange()
  } else if (newTab === 'admin') {
    await handleAdminFilterChange()
  }
})

// Initialize
onMounted(() => {
  setDefaultDates()
  handleOwnFilterChange()
})
</script>
