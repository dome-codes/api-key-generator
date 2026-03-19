<script setup lang="ts">
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
import UsageUserBreakdown from '../shared/UsageUserBreakdown.vue'

interface Props {
  useAdminApi?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  useAdminApi: false,
})

// URL Filters Composable
const { getQueryParam, getQueryParamAsNumber, setQueryParams } = useUrlFilters()

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
  userSummaryData,
  apiKeySummaryData,
  hasMoreTags,
  showAllTagsInChart,
  loadUsageData,
  loadUsageSummary,
  updateFilter,
  goToPage,
  updateSort,
  currentFilter,
  toggleShowAllTags,
} = useUsageApi()

// Filter State
const ownTimeRange = ref('')
const ownModelType = ref('')
const ownModel = ref('')
const ownApiKeyId = ref('')
const ownTag = ref('')
const ownUserId = ref('')
const ownView = ref<'overview' | 'detailed'>('overview')
const ownChartPeriod = ref('daily')
const ownFromDate = ref('')
const ownToDate = ref('')

// Default-Zeitraum: letzte 30 Tage, damit der erste API-Call Filter im Query hat
const setDefaultDates = () => {
  if (!ownFromDate.value || !ownToDate.value) {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 30)
    if (!ownFromDate.value) ownFromDate.value = startDate.toISOString().split('T')[0]
    // Immer aktuelles Datum verwenden (nicht gestern) für Overfetching
    if (!ownToDate.value) {
      const now = new Date()
      ownToDate.value = now.toISOString().split('T')[0]
    }
  }
}

// Load filters from URL (usageType = COMPLETION_USAGE etc.)
const loadFiltersFromUrl = () => {
  // Lade timeRange aus URL oder setze Default auf '30d'
  const urlTimeRange = getQueryParam('timeRange')
  ownTimeRange.value = urlTimeRange || '30d'

  ownModelType.value =
    fromBackendUsageType(getQueryParam('usageType')) || getQueryParam('modelType') || ''
  ownModel.value = getQueryParam('model') || ''
  ownApiKeyId.value = getQueryParam('apiKeyId') || ''
  ownTag.value = getQueryParam('tag') || ''
  ownUserId.value = getQueryParam('userId') || ''
  ownView.value = (getQueryParam('view') as 'overview' | 'detailed') || 'overview'
  ownChartPeriod.value = getQueryParam('chartPeriod') || 'daily'
  ownFromDate.value = getQueryParam('fromDate')?.split('T')[0] || ''
  ownToDate.value = getQueryParam('toDate')?.split('T')[0] || ''

  // Page/Limit aus URL für Pagination (Quelle der Wahrheit für Deep-Links)
  const urlPage = getQueryParamAsNumber('page')
  const urlLimit = getQueryParamAsNumber('limit')
  if (urlPage != null && urlPage >= 1) {
    currentFilter.value = { ...currentFilter.value, page: urlPage }
  }
  if (urlLimit != null && urlLimit >= 1) {
    currentFilter.value = { ...currentFilter.value, limit: urlLimit }
  }

  // Wenn timeRange gesetzt ist, aber keine expliziten Daten aus URL, dann Datum entsprechend setzen
  if (
    ownTimeRange.value &&
    ownTimeRange.value !== 'custom' &&
    !ownFromDate.value &&
    !ownToDate.value
  ) {
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
      case 'lastMonth': {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
        ownToDate.value = lastDay.toISOString().split('T')[0]
        break
      }
      default:
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
    if (ownTimeRange.value !== 'lastMonth') {
      ownFromDate.value = startDate.toISOString().split('T')[0]
      // Immer aktuelles Datum verwenden (nicht gestern) für Overfetching
      const now = new Date()
      ownToDate.value = now.toISOString().split('T')[0]
    } else {
      ownFromDate.value = startDate.toISOString().split('T')[0]
    }
  }
}

// Save filters to URL
const saveFiltersToUrl = () => {
  const params: Record<string, string | number | undefined> = {}
  // Setze alle Filter-Werte explizit (auch leere), damit sie aus der URL entfernt werden können
  params.timeRange = ownTimeRange.value || undefined
  params.usageType = ownModelType.value
    ? toBackendUsageType(ownModelType.value) || ownModelType.value
    : undefined
  params.model = ownModel.value || undefined
  params.apiKey = ownApiKeyId.value || undefined
  params.tag = ownTag.value || undefined
  params.userId = ownUserId.value || undefined
  params.view = ownView.value || undefined
  params.chartPeriod = ownChartPeriod.value || undefined
  params.fromDate = ownFromDate.value ? toIsoDate(ownFromDate.value) : undefined
  params.toDate = ownToDate.value ? toIsoDate(ownToDate.value) : undefined
  // Page/Limit immer mitschreiben, damit URL Quelle der Wahrheit ist und "Seite 20 von 7" vermieden wird
  const safePage = pagination.value.currentPage ?? currentFilter.value.page ?? 1
  const totalPages = pagination.value.totalPages ?? 0
  params.page = totalPages > 0 && safePage > totalPages ? totalPages : safePage
  params.limit = currentFilter.value.limit ?? pagination.value.pageSize ?? 20
  params.sort = currentFilter.value.sort || undefined
  params.order = currentFilter.value.order || undefined
  setQueryParams(params)
}

// Convert date string to ISO format
const toIsoDate = (dateStr: string): string | undefined => {
  if (!dateStr || dateStr.trim() === '') return undefined
  return new Date(`${dateStr}T00:00:00Z`).toISOString()
}

// Computed properties
const showOwnChart = computed(() => ownView.value === 'overview')
const showOwnDetails = computed(() => ownView.value === 'detailed')
const sortOrder = computed(() => {
  const order = currentFilter.value.order
  return order === 'asc' || order === 'desc' ? order : undefined
})

const ownSummary = computed(() => {
  const agg = usageAggregation.value
  return {
    tokensIn: agg.totalTokensIn,
    tokensOut: agg.totalTokensOut,
    cachedTokens: agg.totalCachedTokens ?? 0,
    reasoningTokens: agg.totalReasoningTokens ?? 0,
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

    debugLog('[AIUsageContent] handleOwnFilterChange', {
      view: ownView.value,
      fromDate: ownFromDate.value,
      toDate: ownToDate.value,
      useAdminApi: props.useAdminApi,
    })

    // Setze Filter ohne sofort zu laden
    // WICHTIG: Behalte die aktuelle Seite bei, wenn nur andere Filter geändert werden
    // Setze page nur auf 1 zurück, wenn sich die View ändert (overview <-> detailed)
    const newGroupBy = ownView.value === 'overview' ? ['day', 'month', 'year'] : undefined
    const viewChanged = JSON.stringify(newGroupBy) !== JSON.stringify(currentFilter.value.groupBy)

    currentFilter.value = {
      ...currentFilter.value,
      fromDate: toIsoDate(ownFromDate.value),
      toDate: toIsoDate(ownToDate.value),
      modelType: ownModelType.value || undefined,
      model: ownModel.value || undefined,
      apiKey: ownApiKeyId.value || undefined,
      tag: ownTag.value || undefined,
      userId: ownUserId.value || undefined,
      groupBy: newGroupBy,
      // Seite nur zurücksetzen wenn sich die View ändert, sonst aktuelle Seite behalten
      page: viewChanged ? 1 : currentFilter.value.page || pagination.value.currentPage || 1,
    }

    // Lade je nach View-Modus die richtigen Daten
    if (ownView.value === 'overview') {
      await loadUsageSummary({}, props.useAdminApi)
    } else {
      // In der detaillierten Ansicht müssen wir sowohl die paginierten Daten
      // als auch die Summary-Daten laden, damit die Summary-Werte korrekt berechnet werden
      // Wichtig: loadUsageData muss nach loadUsageSummary aufgerufen werden,
      // damit die Pagination für die Tabelle korrekt gesetzt wird
      await loadUsageSummary({}, props.useAdminApi)
      await loadUsageData({}, props.useAdminApi)
    }

    saveFiltersToUrl()
  } catch (err) {
    debugLog('[AIUsageContent] Error in handleOwnFilterChange:', err)
    error.value = err instanceof Error ? err.message : 'Fehler beim Laden der Daten'
  } finally {
    isHandlingFilterChange = false
  }
}

// Handle page changes
const handlePageChange = async (page: number) => {
  // Aktualisiere currentFilter.page explizit, bevor goToPage aufgerufen wird
  // WICHTIG: Überschreibe page in currentFilter, damit handleOwnFilterChange es nicht auf 1 zurücksetzt
  currentFilter.value = { ...currentFilter.value, page }
  debugLog('[AIUsageContent] handlePageChange:', {
    page,
    currentFilterPage: currentFilter.value.page,
  })
  await goToPage(page, props.useAdminApi)
  // Nach dem Laden: Aktualisiere URL mit der tatsächlichen Seite aus der Pagination
  saveFiltersToUrl()
}

// Handle page size changes
const handlePageSizeChange = async (pageSize: number) => {
  debugLog('[AIUsageContent] handlePageSizeChange:', { pageSize })
  // Setze limit und reset page auf 1
  currentFilter.value = { ...currentFilter.value, limit: pageSize, page: 1 }
  // Lade Daten neu mit neuem limit
  if (ownView.value === 'detailed') {
    await loadUsageData({}, props.useAdminApi)
  } else {
    await loadUsageSummary({}, props.useAdminApi)
  }
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

    // Set defaults ONLY if no dates were loaded from URL
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
          case 'lastMonth': {
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
            ownToDate.value = lastDay.toISOString().split('T')[0]
            break
          }
          default:
            startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
        if (ownTimeRange.value !== 'lastMonth') {
          ownFromDate.value = startDate.toISOString().split('T')[0]
          // Immer aktuelles Datum verwenden (nicht gestern) für Overfetching
          const now = new Date()
          ownToDate.value = now.toISOString().split('T')[0]
        } else {
          ownFromDate.value = startDate.toISOString().split('T')[0]
        }
      } else {
        // Fallback: set default 30 days if no timeRange
        setDefaultDates()
      }
    }

    await handleOwnFilterChange()
  } catch (err) {
    debugLog('Error initializing AIUsageContent:', err)
    error.value = err instanceof Error ? err.message : 'Fehler beim Initialisieren'
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Pricing Disclaimer für AI Usage -->
    <UsagePricingDisclaimer />

    <!-- Filter Section -->
    <AIUsageFilters
      v-model:time-range="ownTimeRange"
      v-model:model-type="ownModelType"
      v-model:model="ownModel"
      v-model:api-key-id="ownApiKeyId"
      v-model:tag="ownTag"
      v-model:user-id="ownUserId"
      v-model:from-date="ownFromDate"
      v-model:to-date="ownToDate"
      @filter-changed="handleOwnFilterChange"
    />

    <!-- View Toggle -->
    <UsageViewToggle v-model:view="ownView" />

    <!-- Overview: Summary-Kacheln + Charts + User/API-Key-Breakdown -->
    <template v-if="showOwnChart">
      <AIUsageSummary
        title="Meine Nutzungsdaten"
        description="Hier sehen Sie Ihre persönlichen API-Nutzungsdaten."
        :summary="ownSummary"
        :is-loading="isLoading"
        :error="error"
        @retry="handleRetry"
      />

      <div class="space-y-6">
        <AIUsageCharts
          line-chart-title="Nutzungsverlauf"
          :selected-period="ownChartPeriod"
          :line-chart-data="chartData"
          :model-distribution-data="modelDistributionChartData"
          :tag-usage-data="tagUsageChartData"
          :has-more-tags="hasMoreTags"
          :show-all-tags-in-chart="showAllTagsInChart"
          @update:selected-period="handleChartPeriodChange"
          @toggle-show-all-tags="toggleShowAllTags"
        />

        <UsageUserBreakdown
          v-if="useAdminApi"
          variant="ai"
          :user-rows="userSummaryData"
          :api-key-rows="apiKeySummaryData"
          title="AI Nutzung nach Benutzer / API-Key"
        />
      </div>
    </template>

    <!-- Detail: nur Tabelle -->
    <!-- Key mit Seite + pageSize erzwingt Neuaufbau bei Pagination, damit Anzeige garantiert aktualisiert -->
    <UsageDetailedTable
      v-if="showOwnDetails"
      :key="`ai-usage-table-${pagination.currentPage ?? 1}-${pagination.pageSize ?? 20}`"
      :data="usageData"
      :is-loading="isLoading"
      :error="error"
      :pagination="pagination"
      :sort-field="currentFilter.sort"
      :sort-order="sortOrder"
      :use-backend-sorting="true"
      :model-type-filter="ownModelType"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @sort-change="handleSortChange"
      @retry="handleRetry"
    />
  </div>
</template>
