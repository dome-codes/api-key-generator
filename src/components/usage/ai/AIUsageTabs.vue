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
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { hasPermission } from '@/auth/keycloak'
import { useUsageApi } from '@/composables/useUsageApi'
import { computed, onMounted, ref, watch } from 'vue'
import AIUsageCharts from './AIUsageCharts.vue'
import AIUsageFilters from './AIUsageFilters.vue'
import AIUsageSummary from './AIUsageSummary.vue'
import UsageDetailedTable from '../UsageDetailedTable.vue'
import UsagePricingDisclaimer from '../UsagePricingDisclaimer.vue'
import UsageViewToggle from '../UsageViewToggle.vue'

const activeTab = ref('own')
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
}

// Handle page change
const handlePageChange = async (page: number) => {
  const useAdminApi = activeTab.value === 'admin'
  await goToPage(page, useAdminApi)
}

// Handle sort change
const handleSortChange = async (field: string, order: 'asc' | 'desc') => {
  const useAdminApi = activeTab.value === 'admin'
  await updateSort(field, order, useAdminApi)
}

const handleChartPeriodChange = (period: string) => {
  ownChartPeriod.value = period
}

// Watch for tab changes
watch(activeTab, async (newTab) => {
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
  setDefaultDates()
  handleOwnFilterChange()
})
</script>
