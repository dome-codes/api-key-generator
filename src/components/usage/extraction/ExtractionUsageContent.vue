<script setup lang="ts">
import { useExtractionUsageApi } from '@/composables/useExtractionUsageApi'
import { useUrlFilters } from '@/composables/useUrlFilters'
import { debugLog } from '@/utils/debugLog'
import { computed, onMounted, ref, watch } from 'vue'
import ExtractionUsageCharts from './ExtractionUsageCharts.vue'
import ExtractionUsageFilters from './ExtractionUsageFilters.vue'
import ExtractionUsageSummary from './ExtractionUsageSummary.vue'
import ExtractionUsageDetailedTable from './ExtractionUsageDetailedTable.vue'
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
  userSummaryData,
  apiKeySummaryData,
  loadUsageData,
  loadUsageSummary,
  updateSort,
  goToPage,
  currentFilter,
  summaryUsers,
  fetchAllUsageDataForExport,
} = useExtractionUsageApi()

// Filter State
const ownTimeRange = ref('')
const ownModelId = ref('')
const ownTag = ref('')
const ownUserId = ref('')
const ownView = ref<'overview' | 'detailed'>('overview')
const ownFromDate = ref('')
const ownToDate = ref('')
const adminUserGroup = ref('')

// Unique users for admin filter
const uniqueUsers = ref<Array<{ id: string; displayName: string }>>([])

// Admin: Nutzerliste aus Summary(by=userId) für Filter aufbauen
watch(
  summaryUsers,
  (ids) => {
    if (!props.useAdminApi) return
    uniqueUsers.value = ids.map((id) => ({ id, displayName: id }))
  },
  { immediate: true },
)

// Initialize default dates - Standardmäßig letzte 30 Tage
const setDefaultDates = () => {
  // Setze Standard-Zeitraum auf 30 Tage, wenn keine URL-Parameter vorhanden sind
  if (!ownFromDate.value && !ownToDate.value) {
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 30)
    ownFromDate.value = startDate.toISOString().split('T')[0]
    // Immer aktuelles Datum verwenden (nicht gestern) für Overfetching
    ownToDate.value = now.toISOString().split('T')[0]
  }
}

// Load filters from URL
const loadFiltersFromUrl = () => {
  // Lade timeRange aus URL oder setze Default auf '30d'
  const urlTimeRange = getQueryParam('timeRange')
  ownTimeRange.value = urlTimeRange || '30d'

  ownModelId.value = getQueryParam('modelId') || ''
  ownTag.value = getQueryParam('tag') || ''
  ownUserId.value = getQueryParam('userId') || ''
  ownView.value = (getQueryParam('view') as 'overview' | 'detailed') || 'overview'
  ownFromDate.value = getQueryParam('fromDate')?.split('T')[0] || ''
  ownToDate.value = getQueryParam('toDate')?.split('T')[0] || ''
  if (props.useAdminApi) {
    adminUserGroup.value = getQueryParam('userGroup') || ''
  }

  // Page/Limit aus URL für Pagination
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
  params.modelId = ownModelId.value || undefined
  params.tag = ownTag.value || undefined
  params.userId = ownUserId.value || undefined
  params.view = ownView.value || undefined
  params.fromDate = ownFromDate.value ? toIsoDate(ownFromDate.value) : undefined
  params.toDate = ownToDate.value ? toIsoDate(ownToDate.value) : undefined
  if (props.useAdminApi) {
    params.userGroup = adminUserGroup.value || undefined
  }
  // Page/Limit in URL halten (Quelle der Wahrheit)
  const safePage = pagination.value.currentPage ?? currentFilter.value.page ?? 1
  const totalPages = pagination.value.totalPages ?? 0
  params.page = totalPages > 0 && safePage > totalPages ? totalPages : safePage
  params.limit = currentFilter.value.limit ?? pagination.value.pageSize ?? 20
  setQueryParams(params)
}

// Convert date string to ISO format
const toIsoDate = (dateStr: string): string | undefined => {
  if (!dateStr || dateStr.trim() === '') return undefined
  return new Date(`${dateStr}T00:00:00Z`).toISOString()
}

// Computed aggregations
const ownAggregation = computed(() => usageAggregation.value)
const sortOrder = computed(() => {
  const order = currentFilter.value.order
  return order === 'asc' || order === 'desc' ? order : undefined
})

// Handle filter changes
// Flag um doppelte Calls zu vermeiden
let isHandlingFilterChange = false

const handleOwnFilterChange = async () => {
  // Verhindere gleichzeitige Aufrufe
  if (isHandlingFilterChange) {
    debugLog('[ExtractionUsageContent] handleOwnFilterChange already in progress, skipping...')
    return
  }

  try {
    isHandlingFilterChange = true
    debugLog('[ExtractionUsageContent] handleOwnFilterChange', {
      view: ownView.value,
      timeRange: ownTimeRange.value,
      fromDate: ownFromDate.value,
      toDate: ownToDate.value,
      modelId: ownModelId.value,
      tag: ownTag.value,
      useAdminApi: props.useAdminApi,
    })

    // Setze Filter ohne sofort zu laden
    // WICHTIG: Behalte die aktuelle Seite bei, wenn nur andere Filter geändert werden
    // Setze page nur auf 1 zurück, wenn sich die View ändert (overview <-> detailed)
    const newGroupBy: string[] | undefined =
      ownView.value === 'overview' ? (['day', 'month', 'year'] as string[]) : undefined
    const viewChanged = JSON.stringify(newGroupBy) !== JSON.stringify(currentFilter.value.groupBy)
    
    currentFilter.value = {
      ...currentFilter.value,
      fromDate: toIsoDate(ownFromDate.value),
      toDate: toIsoDate(ownToDate.value),
      modelId: ownModelId.value || undefined,
      tag: ownTag.value || undefined,
      userId: ownUserId.value || undefined,
      groupBy: newGroupBy,
      // Seite nur zurücksetzen wenn sich die View ändert, sonst aktuelle Seite behalten
      page: viewChanged ? 1 : (currentFilter.value.page || pagination.value.currentPage || 1),
    }

    // Lade je nach View-Modus die richtigen Daten
    if (ownView.value === 'overview') {
      await loadUsageSummary({}, props.useAdminApi)
    } else {
      await loadUsageData({}, props.useAdminApi)
    }

    saveFiltersToUrl()
  } catch (err) {
    debugLog('[ExtractionUsageContent] Error in handleOwnFilterChange:', err)
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
  debugLog('[ExtractionUsageContent] handlePageChange:', { page, currentFilterPage: currentFilter.value.page })
  await goToPage(page, props.useAdminApi)
  // Nach dem Laden: Aktualisiere URL mit der tatsächlichen Seite aus der Pagination
  saveFiltersToUrl()
}

// Handle page size changes
const handlePageSizeChange = async (pageSize: number) => {
  debugLog('[ExtractionUsageContent] handlePageSizeChange:', { pageSize })
  // Setze limit und reset page auf 1
  currentFilter.value = { ...currentFilter.value, limit: pageSize, page: 1 }
  // Lade Daten neu mit neuem limit
  await loadUsageData({}, props.useAdminApi)
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
// DEAKTIVIERT: Dies führt zu doppelten Calls, da handleTimeRangeChange bereits filter-changed emittet
// watch([ownFromDate, ownToDate], async (newValues, oldValues) => {
//   // Nur neu laden wenn sich die Werte wirklich geändert haben
//   if (newValues[0] !== oldValues?.[0] || newValues[1] !== oldValues?.[1]) {
//     console.log('[ExtractionUsageContent] Dates changed, reloading data:', {
//       fromDate: ownFromDate.value,
//       toDate: ownToDate.value,
//     })
//     // Kleine Verzögerung, damit timeRange-Änderungen vollständig durchlaufen
//     setTimeout(async () => {
//       await handleOwnFilterChange()
//     }, 100)
//   }
// })

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

    // Admin: verfügbare Nutzer aus Summary übernehmen, sobald Daten geladen sind
    if (props.useAdminApi && Array.isArray(usageData.value)) {
      const ids = new Set(
        usageData.value
          .map((item) => item.userId)
          .filter((id): id is string => !!id && String(id).trim() !== ''),
      )
      uniqueUsers.value = Array.from(ids).map((id) => ({ id, displayName: id }))
    }
  } catch (err) {
    debugLog('Error initializing ExtractionUsageContent:', err)
    error.value = err instanceof Error ? err.message : 'Fehler beim Initialisieren'
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Pricing Disclaimer für Document Intelligence -->
    <UsagePricingDisclaimer variant="extraction" />

    <!-- Filter Section -->
    <ExtractionUsageFilters
      v-model:time-range="ownTimeRange"
      v-model:model-id="ownModelId"
      v-model:tag="ownTag"
      v-model:user-id="ownUserId"
      v-model:from-date="ownFromDate"
      v-model:to-date="ownToDate"
      v-model:selected-user="ownUserId"
      v-model:selected-user-group="adminUserGroup"
      :show-user-filter="useAdminApi"
      :users="uniqueUsers"
      @filter-changed="handleOwnFilterChange"
    />

    <!-- View Toggle -->
    <UsageViewToggle v-model:view="ownView" icon-variant="extraction" />

    <!-- Overview: Summary-Kacheln + Charts + User/API-Key-Breakdown -->
    <template v-if="ownView === 'overview'">
      <ExtractionUsageSummary
        :title="
          useAdminApi ? 'Admin Extraction-Nutzung - Alle Konten' : 'Meine Extraction-Nutzungsdaten'
        "
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

      <div class="space-y-6">
      <ExtractionUsageCharts
        line-chart-title="Extraction-Nutzungsverlauf"
        :line-chart-data="chartData"
        :provider-distribution-data="providerDistributionChartData"
        :status-distribution-data="statusDistributionChartData"
      />

      <UsageUserBreakdown
        v-if="useAdminApi"
        variant="extraction"
        :user-rows="userSummaryData"
        :api-key-rows="apiKeySummaryData"
        title="Extraction Nutzung nach Benutzer / API-Key"
      />
      </div>
    </template>

    <!-- Detail: nur Tabelle -->
    <!-- Key mit Seite + pageSize erzwingt Neuaufbau bei Pagination -->
    <ExtractionUsageDetailedTable
      v-if="ownView === 'detailed'"
      :key="`extraction-table-${pagination.currentPage ?? 1}-${pagination.pageSize ?? 20}`"
      :data="usageData"
      :is-loading="isLoading"
      :error="error"
      :pagination="pagination"
      :sort-field="currentFilter.sort"
      :sort-order="sortOrder"
      :use-backend-sorting="true"
      :fetch-all-for-export="() => fetchAllUsageDataForExport(props.useAdminApi)"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @sort-change="handleSortChange"
      @retry="handleRetry"
    />
  </div>
</template>
