<template>
  <div class="space-y-6">
    <!-- Pricing Disclaimer für Document Intelligence -->
    <UsagePricingDisclaimer variant="extraction" />

    <!-- Filter Section -->
    <ExtractionUsageFilters
      v-model:time-range="ownTimeRange"
      v-model:provider="ownProvider"
      v-model:status="ownStatus"
      v-model:tag="ownTag"
      v-model:from-date="ownFromDate"
      v-model:to-date="ownToDate"
      :show-user-filter="useAdminApi"
      :users="uniqueUsers"
      v-model:selected-user="adminUser"
      v-model:selected-user-group="adminUserGroup"
      @filter-changed="handleOwnFilterChange"
    />

    <!-- View Toggle -->
    <UsageViewToggle v-model:view="ownView" icon-variant="extraction" />

    <!-- Summary Cards -->
    <ExtractionUsageSummary
      :title="useAdminApi ? 'Admin Extraction-Nutzung - Alle Konten' : 'Meine Extraction-Nutzungsdaten'"
      :description="
        useAdminApi
          ? 'Übersicht über die Document Intelligence Nutzung aller Benutzer.'
          : 'Hier sehen Sie Ihre persönlichen Document Intelligence Nutzungsdaten.'
      "
      :summary="ownAggregation"
      :is-loading="isLoading"
      :error="error"
      :show-unique-users="useAdminApi"
      :show-unique-providers="useAdminApi"
      :show-unique-models="useAdminApi"
      :show-status-breakdown="useAdminApi"
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
      :sort-field="currentFilter.sort"
      :sort-order="currentFilter.order"
      :use-backend-sorting="true"
      @page-change="handlePageChange"
      @sort-change="handleSortChange"
      @retry="handleRetry"
    />
  </div>
</template>

<script setup lang="ts">
import { useExtractionUsageApi } from '@/composables/useExtractionUsageApi'
import { useUrlFilters } from '@/composables/useUrlFilters'
import { computed, onMounted, ref, watch } from 'vue'
import type { ExtractionOperationStatus } from '@/api/types/extraction'
import ExtractionUsageCharts from './ExtractionUsageCharts.vue'
import ExtractionUsageFilters from './ExtractionUsageFilters.vue'
import ExtractionUsageSummary from './ExtractionUsageSummary.vue'
import ExtractionUsageDetailedTable from './ExtractionUsageDetailedTable.vue'
import UsagePricingDisclaimer from '../UsagePricingDisclaimer.vue'
import UsageViewToggle from '../UsageViewToggle.vue'

interface Props {
  useAdminApi?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  useAdminApi: false,
})

// URL Filters Composable
const { getQueryParam, setQueryParams } = useUrlFilters()

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
  updateSort,
  goToPage,
  currentFilter,
} = useExtractionUsageApi()

// Filter State
const ownTimeRange = ref('')
const ownProvider = ref('')
const ownStatus = ref<ExtractionOperationStatus | ''>('')
const ownTag = ref('')
const ownView = ref<'overview' | 'detailed'>('overview')
const ownFromDate = ref('')
const ownToDate = ref('')
const adminUser = ref('')
const adminUserGroup = ref('')

// Unique users for admin filter
const uniqueUsers = ref<Array<{ id: string; displayName: string }>>([])

// Initialize default dates - Standardmäßig KEINE Datumsfilterung
const setDefaultDates = () => {
  // Setze Standard-Zeitraum auf 90 Tage, wenn keine URL-Parameter vorhanden sind
  if (!ownFromDate.value && !ownToDate.value) {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 90)
    ownFromDate.value = startDate.toISOString().split('T')[0]
    ownToDate.value = today.toISOString().split('T')[0]
  }
}

// Load filters from URL
const loadFiltersFromUrl = () => {
  ownTimeRange.value = getQueryParam('timeRange') || ''
  ownProvider.value = getQueryParam('provider') || ''
  ownStatus.value = (getQueryParam('status') as ExtractionOperationStatus | '') || ''
  ownTag.value = getQueryParam('tag') || ''
  ownView.value = (getQueryParam('view') as 'overview' | 'detailed') || 'overview'
  ownFromDate.value = getQueryParam('fromDate')?.split('T')[0] || ''
  ownToDate.value = getQueryParam('toDate')?.split('T')[0] || ''
  if (props.useAdminApi) {
    adminUser.value = getQueryParam('userId') || ''
    adminUserGroup.value = getQueryParam('userGroup') || ''
  }
}

// Save filters to URL
const saveFiltersToUrl = () => {
  const params: Record<string, string | number | undefined> = {}
  if (ownTimeRange.value) params.timeRange = ownTimeRange.value
  if (ownProvider.value) params.provider = ownProvider.value
  if (ownStatus.value) params.status = ownStatus.value
  if (ownTag.value) params.tag = ownTag.value
  if (ownView.value) params.view = ownView.value
  if (ownFromDate.value) params.fromDate = toIsoDate(ownFromDate.value)
  if (ownToDate.value) params.toDate = toIsoDate(ownToDate.value)
  if (props.useAdminApi) {
    if (adminUser.value) params.userId = adminUser.value
    if (adminUserGroup.value) params.userGroup = adminUserGroup.value
  }
  if (pagination.value.page > 1) params.page = pagination.value.page
  setQueryParams(params)
}

// Convert date string to ISO format
const toIsoDate = (dateStr: string): string | undefined => {
  if (!dateStr || dateStr.trim() === '') return undefined
  return new Date(dateStr + 'T00:00:00Z').toISOString()
}

// Computed aggregations
const ownAggregation = computed(() => usageAggregation.value)

// Handle filter changes
const handleOwnFilterChange = async () => {
  try {
    console.log('[ExtractionUsageContent] handleOwnFilterChange called with:', {
      timeRange: ownTimeRange.value,
      fromDate: ownFromDate.value,
      toDate: ownToDate.value,
      provider: ownProvider.value,
      status: ownStatus.value,
      tag: ownTag.value,
    })

    await updateFilter(
      {
        fromDate: toIsoDate(ownFromDate.value),
        toDate: toIsoDate(ownToDate.value),
        provider: ownProvider.value || undefined,
        status: ownStatus.value || undefined,
        tag: ownTag.value || undefined,
        userId: props.useAdminApi ? adminUser.value || undefined : undefined,
        groupBy: ownView.value === 'overview' ? ['day', 'month', 'year'] : undefined,
      },
      props.useAdminApi,
    )

    if (ownView.value === 'overview') {
      await loadUsageSummary({}, props.useAdminApi)
    } else {
      await loadUsageData({}, props.useAdminApi)
    }

    saveFiltersToUrl()
  } catch (err) {
    console.error('[ExtractionUsageContent] Error in handleOwnFilterChange:', err)
    error.value = err instanceof Error ? err.message : 'Fehler beim Laden der Daten'
  }
}

// Handle page changes
const handlePageChange = async (page: number) => {
  await goToPage(page, props.useAdminApi)
  saveFiltersToUrl()
}

// Handle sort changes
const handleSortChange = async (field: string, order: 'asc' | 'desc') => {
  await updateSort(field, order, props.useAdminApi)
  saveFiltersToUrl()
}

// Handle retry
const handleRetry = async () => {
  await handleOwnFilterChange()
}

// Watch for view changes
watch(ownView, async () => {
  await handleOwnFilterChange()
})

// Watch for date changes (wenn timeRange die Daten setzt)
watch([ownFromDate, ownToDate], async (newValues, oldValues) => {
  // Nur neu laden wenn sich die Werte wirklich geändert haben
  if (newValues[0] !== oldValues?.[0] || newValues[1] !== oldValues?.[1]) {
    console.log('[ExtractionUsageContent] Dates changed, reloading data:', {
      fromDate: ownFromDate.value,
      toDate: ownToDate.value,
    })
    // Kleine Verzögerung, damit timeRange-Änderungen vollständig durchlaufen
    setTimeout(async () => {
      await handleOwnFilterChange()
    }, 100)
  }
})

// Initialize
onMounted(async () => {
  try {
    loadFiltersFromUrl()
    setDefaultDates()
    await handleOwnFilterChange()
  } catch (err) {
    console.error('Error initializing ExtractionUsageContent:', err)
    error.value = err instanceof Error ? err.message : 'Fehler beim Initialisieren'
  }
})
</script>
