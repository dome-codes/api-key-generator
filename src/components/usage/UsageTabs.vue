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

    <!-- Tab Content -->
    <div v-if="activeTab === 'own'" class="space-y-6">
      <!-- Pricing Disclaimer -->
      <UsagePricingDisclaimer />

      <!-- Filter Section -->
      <UsageFilters
        v-model:time-range="ownTimeRange"
        v-model:model-type="ownModelType"
        v-model:from-date="ownFromDate"
        v-model:to-date="ownToDate"
      />

      <!-- View Toggle -->
      <UsageViewToggle v-model:view="ownView" />

      <!-- Summary Cards -->
      <UsageSummary
        title="Meine Nutzungsdaten"
        description="Hier sehen Sie Ihre persönlichen API-Nutzungsdaten."
        :summary="filteredOwnUsage"
        :is-loading="isLoadingOwnData"
        :error="error"
      />

      <!-- Charts and Details -->
      <div v-if="showOwnChart" class="space-y-6">
        <UsageChart
          title="Nutzungsverlauf"
          :selected-period="ownChartPeriod"
          :chart-data="ownChartData"
          chart-placeholder="Nutzungsdiagramm wird hier angezeigt"
          @update:selected-period="handleChartPeriodChange"
        />

        <UsageAdditionalCharts :usage-data="filteredOwnUsageData || []" />
      </div>

      <UsageDetailedTable
        v-if="showOwnDetails"
        :data="filteredOwnUsageData || []"
        :is-loading="isLoadingOwnData || false"
        :error="error || null"
      />
    </div>

    <div v-else-if="activeTab === 'admin'" class="space-y-6">
      <!-- Pricing Disclaimer -->
      <UsagePricingDisclaimer />

      <!-- Filter Section -->
      <UsageFilters
        v-model:time-range="adminTimeRange"
        v-model:model-type="adminModelType"
        v-model:from-date="adminFromDate"
        v-model:to-date="adminToDate"
        v-model:selected-user="adminUser"
        :show-user-filter="true"
        :users="uniqueUsers"
      />

      <!-- View Toggle -->
      <UsageViewToggle v-model:view="adminView" />

      <!-- Summary Cards -->
      <UsageSummary
        title="Admin-Nutzung - Alle Konten"
        description="Übersicht über die API-Nutzung aller Benutzer."
        :summary="filteredAdminUsage"
        :is-loading="isLoadingAdminData"
        :error="error"
        :show-unique-users="true"
      />

      <!-- Charts and Details -->
      <div v-if="showAdminChart" class="space-y-6">
        <UsageChart
          title="Admin-Nutzungsverlauf"
          :selected-period="'daily'"
          :chart-data="adminChartData"
          chart-placeholder="Admin-Nutzungsdiagramm wird hier angezeigt"
        />

        <UsageAdditionalCharts :usage-data="filteredAdminUsageData || []" />
      </div>

      <UsageDetailedTable
        v-if="showAdminDetails"
        :data="filteredAdminUsageData || []"
        :is-loading="isLoadingAdminData || false"
        :error="error || null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EnhancedUsageRecord, UsageResponse } from '@/api/types/types'
import { adminUsageAISummaryGetV1 } from '@/api/usage/usage'
import { hasPermission } from '@/auth/keycloak'
import { useUsage } from '@/composables/useUsage'
import { calculateCost } from '@/config/pricing'
import { computed, onMounted, ref, watch } from 'vue'
import UsageAdditionalCharts from './UsageAdditionalCharts.vue'
import UsageChart from './UsageChart.vue'
import UsageDetailedTable from './UsageDetailedTable.vue'
import UsageFilters from './UsageFilters.vue'
import UsagePricingDisclaimer from './UsagePricingDisclaimer.vue'
import UsageSummary from './UsageSummary.vue'
import UsageViewToggle from './UsageViewToggle.vue'

// Debug-Log-Funktion
const debugLog = (...args: unknown[]) => {
  if (
    import.meta.env.DEV &&
    (import.meta.env.VITE_SHOW_DEBUG === 'true' || localStorage.getItem('debug') === 'true')
  ) {
    console.log(...args)
  }
}

const activeTab = ref('own')
const isApiAdmin = computed(() => hasPermission('canViewAdminUsage'))

// Usage Composable
const { isLoading, error, loadDetailedUsageData } = useUsage()

// Data State
const ownRawUsageData = ref<UsageResponse['usage']>([])
const adminRawUsageData = ref<EnhancedUsageRecord[]>([])
const isLoadingOwnData = ref(false)
const isLoadingAdminData = ref(false)

// Filter State
const ownTimeRange = ref('30d')
const ownModelType = ref('')
const ownView = ref<'overview' | 'detailed'>('overview')
const ownChartPeriod = ref('daily')
const ownFromDate = ref('')
const ownToDate = ref('')

const adminTimeRange = ref('30d')
const adminModelType = ref('')
const adminUser = ref('')
const adminView = ref<'overview' | 'detailed'>('overview')
const adminFromDate = ref('')
const adminToDate = ref('')

// Initialize default dates
const setDefaultDates = () => {
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  ownFromDate.value = thirtyDaysAgo.toISOString()
  ownToDate.value = today.toISOString()
  adminFromDate.value = thirtyDaysAgo.toISOString()
  adminToDate.value = today.toISOString()
}

// Load own usage data
const loadOwnRawData = async (fromDate: string, toDate: string) => {
  isLoadingOwnData.value = true
  try {
    const usageService = await import('@/services/apiService')
    const response = await usageService.usageService.getOwnUsage(fromDate, toDate)
    ownRawUsageData.value = response.usage || []
    debugLog('🔍 [USAGE-TABS] Own raw data loaded:', ownRawUsageData.value?.length || 0, 'records')
  } catch (err) {
    console.error('❌ [USAGE-TABS] Error loading own raw data:', err)
  } finally {
    isLoadingOwnData.value = false
  }
}

// Load admin usage data
const loadAdminRawData = async (fromDate: string, toDate: string) => {
  isLoadingAdminData.value = true
  try {
    const params: any = {
      from_date: fromDate,
      to_date: toDate,
      by: 'day,month,year', // Use day grouping for admin charts
    }

    const response = await adminUsageAISummaryGetV1(params)
    const responseData = response.data

    // Convert SummaryUsage to EnhancedUsageRecord
    const convertedData = (responseData.usage || []).map((item: any) => {
      const requestTokens = item.requestTokens || 0
      const responseTokens = item.responseTokens || 0
      const totalTokens = requestTokens + responseTokens

      const costCalculation = calculateCost(
        requestTokens,
        responseTokens,
        item.model || 'unknown',
        false,
        item.type || 'CompletionModelUsage',
      )

      return {
        technicalUserId: item.technicalUserId || 'unknown',
        technicalUserName: item.technicalUserId || 'Unknown User', // Fallback to technicalUserId
        modelName: item.model || 'unknown',
        modelType: item.type || 'CompletionModelUsage',
        type: item.type || 'CompletionModelUsage',
        requests: item.requests || 0,
        tokensIn: requestTokens,
        tokensOut: responseTokens,
        totalTokens: totalTokens,
        cost: costCalculation.finalCost || item.cost || 0,
        tag: item.tag || 'production',
        day: item.day,
        month: item.month,
        year: item.year,
        createDate: item.createDate, // Use createDate if available, otherwise undefined
        apiKeyId: item.apiKeyId,
      }
    })

    adminRawUsageData.value = convertedData
    debugLog(
      '🔍 [USAGE-TABS] Admin raw data loaded:',
      adminRawUsageData.value?.length || 0,
      'records',
    )
  } catch (err) {
    console.error('❌ [USAGE-TABS] Error loading admin raw data:', err)
  } finally {
    isLoadingAdminData.value = false
  }
}

// Computed properties for filtered data
const filteredOwnUsageData = computed(() => {
  if (!ownRawUsageData.value || ownRawUsageData.value.length === 0) return []

  let filteredData = ownRawUsageData.value

  // Filter by model type
  if (ownModelType.value) {
    filteredData = filteredData.filter((item) => item.type === ownModelType.value)
  }

  // Filter by date range
  const fromDate = new Date(ownFromDate.value)
  const toDate = new Date(ownToDate.value)

  filteredData = filteredData.filter((item) => {
    const itemDate = item.createDate ? new Date(item.createDate) : new Date()
    return itemDate >= fromDate && itemDate <= toDate
  })

  // Convert to EnhancedUsageRecord
  return filteredData.map((item) => {
    const requestTokens = (item as any).requestTokens || 1000
    const responseTokens = (item as any).responseTokens || 500

    return {
      technicalUserId: 'own',
      technicalUserName: 'Meine Nutzung',
      modelName: item.model || 'unknown',
      modelType: item.type || 'CompletionModelUsage',
      type: item.type || 'CompletionModelUsage',
      requests: 1,
      tokensIn: requestTokens,
      tokensOut: responseTokens,
      totalTokens: requestTokens + responseTokens,
      cost: 0.01, // Estimate
      tag: item.tag || 'production',
      day: undefined,
      month: undefined,
      year: undefined,
      createDate: item.createDate,
      apiKeyId: 'own',
    }
  })
})

const filteredAdminUsageData = computed(() => {
  if (!adminRawUsageData.value || adminRawUsageData.value.length === 0) return []

  let filteredData = adminRawUsageData.value

  // Filter by model type
  if (adminModelType.value) {
    filteredData = filteredData.filter(
      (item) =>
        item.type === adminModelType.value ||
        item.modelType === adminModelType.value ||
        (item as any).model === adminModelType.value,
    )
  }

  // Filter by user
  if (adminUser.value) {
    filteredData = filteredData.filter((item) => {
      const userId = item.technicalUserId || item.apiKeyId || 'unknown'
      return userId === adminUser.value
    })
  }

  // Filter by date range (skip if no date info)
  const fromDate = new Date(adminFromDate.value)
  const toDate = new Date(adminToDate.value)

  filteredData = filteredData.filter((item) => {
    // Admin data has day/month/year from API grouping, but they can be null or partially filled
    if (item.day !== null && item.month !== null && item.year !== null) {
      // Complete date info - filter by date range
      const itemDate = new Date(item.year!, item.month! - 1, item.day!)
      return itemDate >= fromDate && itemDate <= toDate
    } else if (item.day !== null || item.month !== null || item.year !== null) {
      // Partial date info - keep item but don't filter by date
      return true
    } else {
      // No date info at all - keep item
      return true
    }
  })

  return filteredData
})

// Summary computed properties
const filteredOwnUsage = computed(() => {
  const data = filteredOwnUsageData.value
  if (data.length === 0) return { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0 }

  return data.reduce(
    (acc, item) => ({
      tokensIn: acc.tokensIn + item.tokensIn,
      tokensOut: acc.tokensOut + item.tokensOut,
      requests: acc.requests + item.requests,
      cost: acc.cost + item.cost,
    }),
    { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0 },
  )
})

const filteredAdminUsage = computed(() => {
  const data = filteredAdminUsageData.value
  if (data.length === 0) return { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0, uniqueUsers: 0 }

  const uniqueUsers = new Set(data.map((item) => item.technicalUserId)).size

  return data.reduce(
    (acc, item) => ({
      tokensIn: acc.tokensIn + item.tokensIn,
      tokensOut: acc.tokensOut + item.tokensOut,
      requests: acc.requests + item.requests,
      cost: acc.cost + item.cost,
      uniqueUsers,
    }),
    { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0, uniqueUsers: 0 },
  )
})

// Unique users for admin filter
const uniqueUsers = computed(() => {
  if (!adminRawUsageData.value || adminRawUsageData.value.length === 0) return []

  const userMap = new Map<string, string>()
  adminRawUsageData.value.forEach((item) => {
    const userId = item.technicalUserId || item.apiKeyId || 'unknown'
    const userName = item.technicalUserName || `User ${userId}`
    if (!userMap.has(userId)) {
      userMap.set(userId, userName)
    }
  })

  return Array.from(userMap.entries())
    .map(([userId, userName]) => ({
      id: userId,
      name: userName,
      displayName: `${userId} (${userName})`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

// View computed properties
const showOwnChart = computed(() => ownView.value === 'overview')
const showOwnDetails = computed(() => ownView.value === 'detailed')
const showAdminChart = computed(() => adminView.value === 'overview')
const showAdminDetails = computed(() => adminView.value === 'detailed')

// Chart data computed properties
const ownChartData = computed(() => {
  const data = filteredOwnUsageData.value
  if (data.length === 0) return { labels: [], tokensIn: [], tokensOut: [], requests: [] }

  // Group by date (daily)
  const dailyGroups = new Map<string, { tokensIn: number; tokensOut: number; requests: number }>()

  data.forEach((item) => {
    if (!item.createDate) return

    const date = new Date(item.createDate)
    const dayLabel = date.toLocaleDateString('de-DE', { weekday: 'short' })

    if (!dailyGroups.has(dayLabel)) {
      dailyGroups.set(dayLabel, { tokensIn: 0, tokensOut: 0, requests: 0 })
    }

    const group = dailyGroups.get(dayLabel)!
    group.tokensIn += item.tokensIn
    group.tokensOut += item.tokensOut
    group.requests += item.requests
  })

  const sortedEntries = Array.from(dailyGroups.entries())
  return {
    labels: sortedEntries.map(([label]) => label),
    tokensIn: sortedEntries.map(([, data]) => data.tokensIn),
    tokensOut: sortedEntries.map(([, data]) => data.tokensOut),
    requests: sortedEntries.map(([, data]) => data.requests),
  }
})

const adminChartData = computed(() => {
  const data = filteredAdminUsageData.value
  if (data.length === 0) return { labels: [], tokensIn: [], tokensOut: [], requests: [] }

  // Check if we have date information (day/month/year are not null)
  const hasDateInfo = data.some(
    (item) => item.day !== null && item.month !== null && item.year !== null,
  )

  if (hasDateInfo) {
    // Group by date (daily) - only if we have complete date info
    const dailyGroups = new Map<string, { tokensIn: number; tokensOut: number; requests: number }>()

    data.forEach((item) => {
      // Only group by date if we have complete date information
      if (item.day === null || item.month === null || item.year === null) return

      const date = new Date(item.year!, item.month! - 1, item.day!)
      const dayLabel = date.toLocaleDateString('de-DE', { weekday: 'short' })

      if (!dailyGroups.has(dayLabel)) {
        dailyGroups.set(dayLabel, { tokensIn: 0, tokensOut: 0, requests: 0 })
      }

      const group = dailyGroups.get(dayLabel)!
      group.tokensIn += item.tokensIn
      group.tokensOut += item.tokensOut
      group.requests += item.requests
    })

    const sortedEntries = Array.from(dailyGroups.entries())
    return {
      labels: sortedEntries.map(([label]) => label),
      tokensIn: sortedEntries.map(([, data]) => data.tokensIn),
      tokensOut: sortedEntries.map(([, data]) => data.tokensOut),
      requests: sortedEntries.map(([, data]) => data.requests),
    }
  } else {
    // Group by model type (fallback when no complete date info)
    const modelGroups = new Map<string, { tokensIn: number; tokensOut: number; requests: number }>()

    data.forEach((item) => {
      const modelType = item.type || item.modelType || 'Unknown'

      if (!modelGroups.has(modelType)) {
        modelGroups.set(modelType, { tokensIn: 0, tokensOut: 0, requests: 0 })
      }

      const group = modelGroups.get(modelType)!
      group.tokensIn += item.tokensIn
      group.tokensOut += item.tokensOut
      group.requests += item.requests
    })

    const sortedEntries = Array.from(modelGroups.entries()).sort(
      (a, b) => b[1].requests - a[1].requests,
    )
    return {
      labels: sortedEntries.map(([label]) => label),
      tokensIn: sortedEntries.map(([, data]) => data.tokensIn),
      tokensOut: sortedEntries.map(([, data]) => data.tokensOut),
      requests: sortedEntries.map(([, data]) => data.requests),
    }
  }
})

// Chart period handler
const handleChartPeriodChange = (period: string) => {
  ownChartPeriod.value = period
}

// Watchers
watch([ownTimeRange, ownModelType, ownFromDate, ownToDate], async () => {
  const fromDate = ownFromDate.value
  const toDate = ownToDate.value
  if (fromDate && toDate) {
    await loadOwnRawData(fromDate, toDate)
  }
})

watch([adminTimeRange, adminModelType, adminUser, adminFromDate, adminToDate], async () => {
  const fromDate = adminFromDate.value
  const toDate = adminToDate.value
  if (fromDate && toDate) {
    await loadAdminRawData(fromDate, toDate)
  }
})

// Initialize
onMounted(async () => {
  setDefaultDates()

  const fromDate = ownFromDate.value
  const toDate = ownToDate.value

  await loadOwnRawData(fromDate, toDate)

  if (isApiAdmin.value) {
    await loadAdminRawData(fromDate, toDate)
  }
})

// Set default tab based on role
if (!isApiAdmin.value) {
  activeTab.value = 'own'
}
</script>
