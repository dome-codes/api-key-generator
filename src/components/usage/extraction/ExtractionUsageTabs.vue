<template>
  <div>
    <!-- Tabs Navigation -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          @click="activeTab = 'own'"
          :class="[
            activeTab === 'own'
              ? 'border-primary text-primary'
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
              ? 'border-primary text-primary'
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
        v-model:model-id="ownModelId"
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
                ? 'bg-primary text-white'
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
                ? 'bg-primary text-white'
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
        v-model:model-id="adminModelId"
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
                ? 'bg-primary text-white'
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
                ? 'bg-primary text-white'
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
import { useUrlFilters } from '@/composables/useUrlFilters'
import { computed, onMounted, ref, watch } from 'vue'
import type { DocumentIntelligenceOperationStatus } from '@/api/types'
import ExtractionUsageCharts from './ExtractionUsageCharts.vue'
import ExtractionUsageFilters from './ExtractionUsageFilters.vue'
import ExtractionUsageSummary from './ExtractionUsageSummary.vue'
import ExtractionUsageDetailedTable from './ExtractionUsageDetailedTable.vue'

// URL Filters Composable
const { getQueryParam } = useUrlFilters()

const activeTab = ref('own')
const isApiAdmin = computed(() => hasPermission('canUseAdminFeatures'))

// URL Filters Composable
const { getQueryParam } = useUrlFilters()

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
const ownModelId = ref('')
const ownStatus = ref<DocumentIntelligenceOperationStatus | ''>('')
const ownTag = ref('')
const ownView = ref<'overview' | 'detailed'>('overview')
const ownFromDate = ref('')
const ownToDate = ref('')

// Filter State - Admin
const adminTimeRange = ref('30d')
const adminModelId = ref('')
const adminStatus = ref<DocumentIntelligenceOperationStatus | ''>('')
const adminTag = ref('')
const adminUser = ref('')
const adminUserGroup = ref('')
const adminView = ref<'overview' | 'detailed'>('overview')
const adminFromDate = ref('')
const adminToDate = ref('')

// Unique users for admin filter (would come from API in real implementation)
const uniqueUsers = ref<Array<{ id: string; displayName: string }>>([])

// Initialize default dates - Standardmäßig letzte 30 Tage
const setDefaultDates = () => {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 30)
  const fromStr = startDate.toISOString().split('T')[0]
  const toStr = today.toISOString().split('T')[0]

  if (!ownFromDate.value && !ownToDate.value) {
    ownFromDate.value = fromStr
    ownToDate.value = toStr
  }
  if (!adminFromDate.value && !adminToDate.value) {
    adminFromDate.value = fromStr
    adminToDate.value = toStr
  }
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
      modelId: ownModelId.value || undefined,
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
      modelId: adminModelId.value || undefined,
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

// Load filters from URL
const loadFiltersFromUrl = () => {
  ownTimeRange.value = getQueryParam('timeRange') || '30d'
  ownModelId.value = getQueryParam('modelId') || ''
  ownStatus.value = (getQueryParam('status') as DocumentIntelligenceOperationStatus | '') || ''
  ownTag.value = getQueryParam('tag') || ''
  ownView.value = (getQueryParam('view') as 'overview' | 'detailed') || 'overview'
  ownFromDate.value = getQueryParam('fromDate')?.split('T')[0] || ''
  ownToDate.value = getQueryParam('toDate')?.split('T')[0] || ''
  
  if (activeTab.value === 'admin') {
    adminTimeRange.value = getQueryParam('timeRange') || '30d'
    adminModelId.value = getQueryParam('modelId') || ''
    adminStatus.value = (getQueryParam('status') as DocumentIntelligenceOperationStatus | '') || ''
    adminTag.value = getQueryParam('tag') || ''
    adminUser.value = getQueryParam('userId') || ''
    adminUserGroup.value = getQueryParam('userGroup') || ''
    adminView.value = (getQueryParam('view') as 'overview' | 'detailed') || 'overview'
    adminFromDate.value = getQueryParam('fromDate')?.split('T')[0] || ''
    adminToDate.value = getQueryParam('toDate')?.split('T')[0] || ''
  }
  
  // Wenn timeRange gesetzt ist, aber keine expliziten Daten, dann Datum entsprechend setzen
  if (activeTab.value === 'own' && ownTimeRange.value && ownTimeRange.value !== 'custom' && !ownFromDate.value && !ownToDate.value) {
    const today = new Date()
    let startDate: Date
    switch (ownTimeRange.value) {
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
        ownToDate.value = lastDay.toISOString().split('T')[0]
        break
      default:
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
    if (ownTimeRange.value !== 'lastMonth') {
      ownFromDate.value = startDate.toISOString().split('T')[0]
      ownToDate.value = today.toISOString().split('T')[0]
    } else {
      ownFromDate.value = startDate.toISOString().split('T')[0]
    }
  }
  
  if (activeTab.value === 'admin' && adminTimeRange.value && adminTimeRange.value !== 'custom' && !adminFromDate.value && !adminToDate.value) {
    const today = new Date()
    let startDate: Date
    switch (adminTimeRange.value) {
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
        adminToDate.value = lastDay.toISOString().split('T')[0]
        break
      default:
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
    if (adminTimeRange.value !== 'lastMonth') {
      adminFromDate.value = startDate.toISOString().split('T')[0]
      adminToDate.value = today.toISOString().split('T')[0]
    } else {
      adminFromDate.value = startDate.toISOString().split('T')[0]
    }
  }
}

// Initialize
onMounted(async () => {
  try {
    loadFiltersFromUrl()
    
    // Set defaults ONLY if no dates were loaded from URL
    if (activeTab.value === 'own') {
      if (!ownFromDate.value && !ownToDate.value) {
        if (ownTimeRange.value && ownTimeRange.value !== 'custom') {
          const today = new Date()
          let startDate: Date
          switch (ownTimeRange.value) {
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
              ownToDate.value = lastDay.toISOString().split('T')[0]
              break
            default:
              startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
          if (ownTimeRange.value !== 'lastMonth') {
            ownFromDate.value = startDate.toISOString().split('T')[0]
            ownToDate.value = today.toISOString().split('T')[0]
          } else {
            ownFromDate.value = startDate.toISOString().split('T')[0]
          }
        } else {
          setDefaultDates()
        }
      }
    } else if (activeTab.value === 'admin') {
      if (!adminFromDate.value && !adminToDate.value) {
        if (adminTimeRange.value && adminTimeRange.value !== 'custom') {
          const today = new Date()
          let startDate: Date
          switch (adminTimeRange.value) {
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
              adminToDate.value = lastDay.toISOString().split('T')[0]
              break
            default:
              startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
          if (adminTimeRange.value !== 'lastMonth') {
            adminFromDate.value = startDate.toISOString().split('T')[0]
            adminToDate.value = today.toISOString().split('T')[0]
          } else {
            adminFromDate.value = startDate.toISOString().split('T')[0]
          }
        } else {
          setDefaultDates()
        }
      }
    }
    
    await handleOwnFilterChange()
  } catch (err) {
    console.error('Error initializing ExtractionUsageTabs:', err)
    error.value = err instanceof Error ? err.message : 'Fehler beim Initialisieren'
  }
})
</script>
