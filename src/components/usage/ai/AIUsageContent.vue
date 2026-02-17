<template>
  <div class="space-y-6">
    <!-- Pricing Disclaimer für AI Usage -->
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

    <!-- Detailed Table: Spalten Größe/Qualität nur bei Image-Filter -->
    <UsageDetailedTable
      v-if="showOwnDetails"
      :data="usageData"
      :is-loading="isLoading"
      :error="error"
      :pagination="pagination"
      :sort-field="currentFilter.sort"
      :sort-order="(currentFilter.order as 'asc' | 'desc' | undefined)"
      :use-backend-sorting="true"
      :model-type-filter="ownModelType"
      @page-change="handlePageChange"
      @sort-change="handleSortChange"
      @retry="handleRetry"
    />
  </div>
</template>

<script setup lang="ts">
import { hasPermission } from '@/auth/keycloak'
import { useUsageApi } from '@/composables/useUsageApi'
import { fromBackendUsageType, toBackendUsageType } from '@/services/usageApiService'
import { useUrlFilters } from '@/composables/useUrlFilters'
import { debugLog } from '@/utils/debugLog'
import { computed, onMounted, ref, watch } from 'vue'
import AIUsageCharts from './AIUsageCharts.vue'
import AIUsageFilters from './AIUsageFilters.vue'
import AIUsageSummary from './AIUsageSummary.vue'
import UsageDetailedTable from '../UsageDetailedTable.vue'
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

// Filter State
const ownTimeRange = ref('')
const ownModelType = ref('')
const ownModel = ref('')
const ownTag = ref('')
const ownApiKeyId = ref('')
const ownView = ref<'overview' | 'detailed'>('overview')
const ownChartPeriod = ref('daily')
const ownFromDate = ref('')
const ownToDate = ref('')

// Default-Zeitraum: aktueller Monat (1. bis heute), damit der erste API-Call Filter im Query hat
const setDefaultDates = () => {
  if (!ownFromDate.value || !ownToDate.value) {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    if (!ownFromDate.value) ownFromDate.value = firstOfMonth.toISOString().split('T')[0]
    if (!ownToDate.value) ownToDate.value = now.toISOString().split('T')[0]
  }
}

// Load filters from URL (usageType = COMPLETION_USAGE etc.)
const loadFiltersFromUrl = () => {
  ownTimeRange.value = getQueryParam('timeRange') || ''
  ownModelType.value = fromBackendUsageType(getQueryParam('usageType')) || getQueryParam('modelType') || ''
  ownModel.value = getQueryParam('model') || ''
  ownTag.value = getQueryParam('tag') || ''
  ownApiKeyId.value = getQueryParam('apiKeyId') || ''
  ownView.value = (getQueryParam('view') as 'overview' | 'detailed') || 'overview'
  ownChartPeriod.value = getQueryParam('chartPeriod') || 'daily'
  ownFromDate.value = getQueryParam('fromDate')?.split('T')[0] || ''
  ownToDate.value = getQueryParam('toDate')?.split('T')[0] || ''
}

// Save filters to URL
const saveFiltersToUrl = () => {
  const params: Record<string, string | number | undefined> = {}
  if (ownTimeRange.value) params.timeRange = ownTimeRange.value
  if (ownModelType.value) params.usageType = toBackendUsageType(ownModelType.value) || ownModelType.value
  if (ownModel.value) params.model = ownModel.value
  if (ownTag.value) params.tag = ownTag.value
  if (ownApiKeyId.value) params.apiKeyId = ownApiKeyId.value
  if (ownView.value) params.view = ownView.value
  if (ownChartPeriod.value) params.chartPeriod = ownChartPeriod.value
  if (ownFromDate.value) params.fromDate = toIsoDate(ownFromDate.value)
  if (ownToDate.value) params.toDate = toIsoDate(ownToDate.value)
  if ((pagination.value.page ?? 1) > 1) params.page = pagination.value.page
  if (currentFilter.value.sort) params.sort = currentFilter.value.sort
  if (currentFilter.value.order) params.order = currentFilter.value.order as 'asc' | 'desc'
  setQueryParams(params)
}

// Convert date string to ISO format
const toIsoDate = (dateStr: string): string | undefined => {
  if (!dateStr || dateStr.trim() === '') return undefined
  return new Date(dateStr + 'T00:00:00Z').toISOString()
}

// Computed properties
const showOwnChart = computed(() => ownView.value === 'overview')
const showOwnDetails = computed(() => ownView.value === 'detailed')

const ownSummary = computed(() => {
  const agg = usageAggregation.value
  return {
    tokensIn: agg.totalTokensIn,
    tokensOut: agg.totalTokensOut,
    requests: agg.totalRequests,
    cost: agg.totalCost,
    imageCount: agg.totalImages,
  }
})

// Handle filter changes
// Flag um doppelte Calls zu vermeiden
let isHandlingFilterChange = false

const handleOwnFilterChange = async () => {
  // Verhindere gleichzeitige Aufrufe
  if (isHandlingFilterChange) {
    debugLog('[AIUsageContent] handleOwnFilterChange already in progress, skipping...')
    return
  }

  try {
    isHandlingFilterChange = true
    
    // updateFilter ruft bereits loadUsageData auf, daher müssen wir nicht nochmal explizit laden
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
      props.useAdminApi,
    )

    // Nur Summary laden wenn im Overview-Modus (updateFilter lädt bereits die detaillierten Daten)
    if (ownView.value === 'overview') {
      await loadUsageSummary({}, props.useAdminApi)
    }
    // else: loadUsageData wird bereits von updateFilter aufgerufen

    saveFiltersToUrl()
  } catch (err) {
    console.error('[AIUsageContent] Error in handleOwnFilterChange:', err)
    error.value = err instanceof Error ? err.message : 'Fehler beim Laden der Daten'
  } finally {
    isHandlingFilterChange = false
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

// Get groupBy for period
const getGroupByForPeriod = (period: string): ('day' | 'month' | 'year' | 'hour' | 'week')[] => {
  switch (period) {
    case 'hourly':
      return ['day', 'month', 'year']
    case 'weekly':
      return ['day', 'month', 'year']
    case 'monthly':
      return ['month', 'year']
    case 'daily':
    default:
      return ['day', 'month', 'year']
  }
}

const handleChartPeriodChange = async (period: string) => {
  ownChartPeriod.value = period
  saveFiltersToUrl()

  if (ownView.value === 'overview') {
    const groupBy = getGroupByForPeriod(period)
    await updateFilter({ groupBy }, props.useAdminApi)
    await loadUsageSummary({}, props.useAdminApi)
  }
}

// Watch for view changes
watch(ownView, async () => {
  await handleOwnFilterChange()
})

// Ticket: Context-Switch User/Admin – beim Wechsel sofort API mit neuem Kontext auslösen
watch(
  () => props.useAdminApi,
  async () => {
    await handleOwnFilterChange()
  },
  { flush: 'post' },
)

// Initialize
onMounted(async () => {
  try {
    loadFiltersFromUrl()
    setDefaultDates()
    await handleOwnFilterChange()
  } catch (err) {
    console.error('Error initializing AIUsageContent:', err)
    error.value = err instanceof Error ? err.message : 'Fehler beim Initialisieren'
  }
})
</script>
