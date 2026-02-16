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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Meine Nutzung
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
          Admin-Nutzung (Alle Konten)
        </button>
      </nav>
    </div>

    <!-- Tab Content: Own Usage -->
    <div v-if="activeTab === 'own'" class="space-y-6">
      <UsagePricingDisclaimer />

      <!-- Filter Section -->
      <AIUsageFilters
        v-model:time-range="ownTimeRange"
        v-model:model-type="ownModelType"
        v-model:model="ownModel"
        v-model:tag="ownTag"
        v-model:api-key-id="ownApiKeyId"
        v-model:from-date="ownFromDate"
        v-model:to-date="ownToDate"
        @filter-changed="handleOwnFilterChange"
      />

      <!-- View Toggle -->
      <UsageViewToggle v-model:view="ownView" />

      <!-- Summary Cards -->
      <AIUsageSummary
        title="Meine Nutzungsdaten"
        description="Hier sehen Sie Ihre persönlichen API-Nutzungsdaten."
        :summary="ownSummary"
        :is-loading="isLoading"
        :error="error"
        @retry="handleRetry"
      />

      <!-- Charts - Daten kommen vom Backend über groupBy Parameter -->
      <div v-if="showOwnChart" class="space-y-6">
        <AIUsageCharts
          line-chart-title="Nutzungsverlauf"
          :selected-period="ownChartPeriod"
          :line-chart-data="chartData"
          :model-distribution-data="modelDistributionChartData"
          :tag-usage-data="tagUsageChartData"
          @update:selected-period="handleChartPeriodChange"
        />
      </div>

      <!-- Detailed Table -->
      <UsageDetailedTable
        v-if="showOwnDetails"
        :data="usageData"
        :is-loading="isLoading"
        :error="error"
        :pagination="pagination"
        :sort-field="currentFilter.sort"
        :sort-order="currentFilter.order"
        :use-backend-sorting="true"
        @page-change="handlePageChange"
        @sort-change="handleSortChange"
        @retry="handleRetry"
      />
    </div>

    <!-- Tab Content: Admin Usage -->
    <div v-else-if="activeTab === 'admin'" class="space-y-6">
      <UsagePricingDisclaimer />

      <!-- Filter Section -->
      <AIUsageFilters
        v-model:time-range="adminTimeRange"
        v-model:model-type="adminModelType"
        v-model:model="adminModel"
        v-model:tag="adminTag"
        v-model:api-key-id="adminApiKeyId"
        v-model:from-date="adminFromDate"
        v-model:to-date="adminToDate"
        v-model:selected-user="adminUser"
        v-model:selected-user-group="adminUserGroup"
        :show-user-filter="true"
        :users="uniqueUsers"
        @filter-changed="handleAdminFilterChange"
      />

      <!-- View Toggle -->
      <UsageViewToggle v-model:view="adminView" />

      <!-- Summary Cards -->
      <AIUsageSummary
        title="Admin-Nutzung - Alle Konten"
        description="Übersicht über die API-Nutzung aller Benutzer."
        :summary="adminSummary"
        :is-loading="isLoading"
        :error="error"
        :show-unique-users="true"
        @retry="handleRetry"
      />

      <!-- Charts - Daten kommen vom Backend über groupBy Parameter -->
      <div v-if="showAdminChart" class="space-y-6">
        <AIUsageCharts
          line-chart-title="Admin-Nutzungsverlauf"
          selected-period="daily"
          :line-chart-data="chartData"
          :model-distribution-data="modelDistributionChartData"
          :tag-usage-data="tagUsageChartData"
        />
      </div>

      <!-- Detailed Table -->
      <UsageDetailedTable
        v-if="showAdminDetails"
        :data="usageData"
        :is-loading="isLoading"
        :error="error"
        :pagination="pagination"
        :sort-field="currentFilter.sort"
        :sort-order="currentFilter.order"
        :use-backend-sorting="true"
        @page-change="handlePageChange"
        @sort-change="handleSortChange"
        @retry="handleRetry"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { hasPermission } from '@/auth/keycloak'
import { useUsageApi } from '@/composables/useUsageApi'
import { useUrlFilters } from '@/composables/useUrlFilters'
import { computed, onMounted, ref, watch } from 'vue'
import AIUsageCharts from './AIUsageCharts.vue'
import AIUsageFilters from './AIUsageFilters.vue'
import AIUsageSummary from './AIUsageSummary.vue'
import UsageDetailedTable from '../UsageDetailedTable.vue'
import UsagePricingDisclaimer from '../UsagePricingDisclaimer.vue'
import UsageViewToggle from '../UsageViewToggle.vue'

// URL Filters Composable
const { getQueryParam, setQueryParams } = useUrlFilters()

// Initialize activeTab from URL or default
const activeTab = ref<'own' | 'admin'>((getQueryParam('tab') as 'own' | 'admin') || 'own')
const isApiAdmin = computed(() => hasPermission('canViewAdminUsage'))

// Usage API Composable - Nutzt server-seitige Filterung
const {
  isLoading,
  error,
  usageData,
  pagination,
  usageAggregation,
  chartData,
  modelDistributionChartData,
  tagUsageChartData,
  loadUsageData,
  loadUsageSummary,
  updateFilter,
  goToPage,
  updateSort,
  currentFilter,
} = useUsageApi()

// Filter State - Own
const ownTimeRange = ref('30d')
const ownModelType = ref('')
const ownModel = ref('')
const ownTag = ref('')
const ownApiKeyId = ref('')
const ownView = ref<'overview' | 'detailed'>('overview')
const ownChartPeriod = ref('daily')
const ownFromDate = ref('')
const ownToDate = ref('')

// Filter State - Admin
const adminTimeRange = ref('30d')
const adminModelType = ref('')
const adminModel = ref('')
const adminTag = ref('')
const adminApiKeyId = ref('')
const adminUser = ref('')
const adminUserGroup = ref('')
const adminView = ref<'overview' | 'detailed'>('overview')
const adminFromDate = ref('')
const adminToDate = ref('')

// Unique users for admin filter
const uniqueUsers = ref<Array<{ id: string; displayName: string }>>([])

// Initialize default dates
const setDefaultDates = () => {
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  ownFromDate.value = thirtyDaysAgo.toISOString().split('T')[0]
  ownToDate.value = today.toISOString().split('T')[0]
  adminFromDate.value = thirtyDaysAgo.toISOString().split('T')[0]
  adminToDate.value = today.toISOString().split('T')[0]
}

// Load filters from URL
const loadFiltersFromUrl = () => {
  const tab = getQueryParam('tab') || 'own'
  activeTab.value = tab as 'own' | 'admin'

  if (tab === 'own') {
    ownTimeRange.value = getQueryParam('timeRange') || '30d'
    ownModelType.value = getQueryParam('modelType') || ''
    ownModel.value = getQueryParam('model') || ''
    ownTag.value = getQueryParam('tag') || ''
    ownApiKeyId.value = getQueryParam('apiKeyId') || ''
    ownView.value = (getQueryParam('view') as 'overview' | 'detailed') || 'overview'
    ownChartPeriod.value = getQueryParam('chartPeriod') || 'daily'
    ownFromDate.value = getQueryParam('fromDate')?.split('T')[0] || ''
    ownToDate.value = getQueryParam('toDate')?.split('T')[0] || ''
  } else {
    adminTimeRange.value = getQueryParam('timeRange') || '30d'
    adminModelType.value = getQueryParam('modelType') || ''
    adminModel.value = getQueryParam('model') || ''
    adminTag.value = getQueryParam('tag') || ''
    adminApiKeyId.value = getQueryParam('apiKeyId') || ''
    adminUser.value = getQueryParam('userId') || ''
    adminUserGroup.value = getQueryParam('userGroup') || ''
    adminView.value = (getQueryParam('view') as 'overview' | 'detailed') || 'overview'
    adminFromDate.value = getQueryParam('fromDate')?.split('T')[0] || ''
    adminToDate.value = getQueryParam('toDate')?.split('T')[0] || ''
  }
}

// Save filters to URL
const saveFiltersToUrl = () => {
  const params: Record<string, string | number | undefined> = {
    tab: activeTab.value,
  }

  if (activeTab.value === 'own') {
    if (ownTimeRange.value) params.timeRange = ownTimeRange.value
    if (ownModelType.value) params.modelType = ownModelType.value
    if (ownModel.value) params.model = ownModel.value
    if (ownTag.value) params.tag = ownTag.value
    if (ownApiKeyId.value) params.apiKeyId = ownApiKeyId.value
    if (ownView.value) params.view = ownView.value
    if (ownChartPeriod.value) params.chartPeriod = ownChartPeriod.value
    if (ownFromDate.value) params.fromDate = toIsoDate(ownFromDate.value)
    if (ownToDate.value) params.toDate = toIsoDate(ownToDate.value)
  } else {
    if (adminTimeRange.value) params.timeRange = adminTimeRange.value
    if (adminModelType.value) params.modelType = adminModelType.value
    if (adminModel.value) params.model = adminModel.value
    if (adminTag.value) params.tag = adminTag.value
    if (adminApiKeyId.value) params.apiKeyId = adminApiKeyId.value
    if (adminUser.value) params.userId = adminUser.value
    if (adminUserGroup.value) params.userGroup = adminUserGroup.value
    if (adminView.value) params.view = adminView.value
    if (adminFromDate.value) params.fromDate = toIsoDate(adminFromDate.value)
    if (adminToDate.value) params.toDate = toIsoDate(adminToDate.value)
  }

  // Pagination und Sortierung
  if (pagination.value.page > 1) params.page = pagination.value.page
  if (currentFilter.value.sort) params.sort = currentFilter.value.sort
  if (currentFilter.value.order) params.order = currentFilter.value.order

  setQueryParams(params)
}

// Convert date string to ISO format
const toIsoDate = (dateStr: string): string => {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00Z').toISOString()
}

// Computed properties
const showOwnChart = computed(() => ownView.value === 'overview')
const showOwnDetails = computed(() => ownView.value === 'detailed')
const showAdminChart = computed(() => adminView.value === 'overview')
const showAdminDetails = computed(() => adminView.value === 'detailed')

const ownSummary = computed(() => ({
  tokensIn: usageAggregation.value.totalTokensIn,
  tokensOut: usageAggregation.value.totalTokensOut,
  requests: usageAggregation.value.totalRequests,
  cost: usageAggregation.value.totalCost,
}))

const adminSummary = computed(() => ({
  tokensIn: usageAggregation.value.totalTokensIn,
  tokensOut: usageAggregation.value.totalTokensOut,
  requests: usageAggregation.value.totalRequests,
  cost: usageAggregation.value.totalCost,
  uniqueUsers: usageAggregation.value.uniqueUsers,
}))

// Handle filter changes - Own
const handleOwnFilterChange = async () => {
  await updateFilter(
    {
      fromDate: toIsoDate(ownFromDate.value),
      toDate: toIsoDate(ownToDate.value),
      modelType: ownModelType.value || undefined,
      model: ownModel.value || undefined,
      tag: ownTag.value || undefined,
      apiKeyId: ownApiKeyId.value || undefined,
      groupBy: ownView.value === 'overview' ? ['day', 'month', 'year'] : undefined,
    },
    false, // useAdminApi = false
  )

  if (ownView.value === 'overview') {
    await loadUsageSummary({}, false)
  } else {
    await loadUsageData({}, false)
  }

  saveFiltersToUrl()
}

// Handle filter changes - Admin
const handleAdminFilterChange = async () => {
  await updateFilter(
    {
      fromDate: toIsoDate(adminFromDate.value),
      toDate: toIsoDate(adminToDate.value),
      modelType: adminModelType.value || undefined,
      model: adminModel.value || undefined,
      tag: adminTag.value || undefined,
      apiKeyId: adminApiKeyId.value || undefined,
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

  saveFiltersToUrl()
}

// Handle page change
const handlePageChange = async (page: number) => {
  const useAdminApi = activeTab.value === 'admin'
  await goToPage(page, useAdminApi)
  saveFiltersToUrl()
}

// Handle sort change
const handleSortChange = async (field: string, order: 'asc' | 'desc') => {
  const useAdminApi = activeTab.value === 'admin'
  await updateSort(field, order, useAdminApi)
  saveFiltersToUrl()
}

// Map period to groupBy values
const getGroupByForPeriod = (period: string): ('day' | 'month' | 'year' | 'hour' | 'week')[] => {
  switch (period) {
    case 'hourly':
      // Für stündliche Ansicht: nach Stunde gruppieren (falls Backend unterstützt)
      // Fallback zu täglich wenn 'hour' nicht unterstützt wird
      return ['day', 'month', 'year'] // TODO: Backend prüfen ob 'hour' unterstützt wird
    case 'weekly':
      // Für wöchentliche Ansicht: nach Woche gruppieren (falls Backend unterstützt)
      // Fallback zu täglich wenn 'week' nicht unterstützt wird
      return ['day', 'month', 'year'] // TODO: Backend prüfen ob 'week' unterstützt wird
    case 'monthly':
      // Für monatliche Ansicht: nur nach Monat und Jahr
      return ['month', 'year']
    case 'daily':
    default:
      // Standard: täglich nach Tag, Monat, Jahr
      return ['day', 'month', 'year']
  }
}

const handleChartPeriodChange = async (period: string) => {
  ownChartPeriod.value = period
  saveFiltersToUrl()

  // Refetch mit angepasstem groupBy wenn in Overview-Ansicht
  if (ownView.value === 'overview') {
    const groupBy = getGroupByForPeriod(period)
    await updateFilter(
      {
        groupBy,
      },
      false, // useAdminApi = false
    )
    await loadUsageSummary({}, false)
  }
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
  saveFiltersToUrl()
  if (newTab === 'own') {
    await handleOwnFilterChange()
  } else if (newTab === 'admin') {
    await handleAdminFilterChange()
  }
})

// Watch for view changes
watch(ownView, async () => {
  await handleOwnFilterChange()
})

watch(adminView, async () => {
  await handleAdminFilterChange()
})

// Initialize
onMounted(() => {
  // Load from URL first, then set defaults for missing values
  loadFiltersFromUrl()
  setDefaultDates()

  // Apply loaded filters
  if (activeTab.value === 'own') {
    handleOwnFilterChange()
  } else if (activeTab.value === 'admin') {
    handleAdminFilterChange()
  }
})
</script>
