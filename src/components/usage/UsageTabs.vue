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
        :is-loading="isLoading"
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
        :is-loading="isLoading || false"
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
        :is-loading="isLoading"
        :error="error"
        :show-unique-users="true"
      />

      <!-- Charts and Details -->
      <div v-if="showAdminChart" class="space-y-6">
        <UsageChart
          title="Admin-Nutzungsverlauf"
          :chart-data="adminChartData"
          chart-placeholder="Admin-Nutzungsdiagramm wird hier angezeigt"
        />

        <UsageAdditionalCharts :usage-data="filteredAdminUsageData || []" />
      </div>

      <UsageDetailedTable
        v-if="showAdminDetails"
        :data="filteredAdminUsageData || []"
        :is-loading="isLoading || false"
        :error="error || null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EnhancedUsageRecord, UsageResponse } from '@/api/types/types'
import { adminUsageAISummaryGetV1 } from '@/api/usage/usage'
import { getHighestRole, getUserRoles, hasPermission } from '@/auth/keycloak'
import { useUsage } from '@/composables/useUsage'
import { calculateCost, calculateExampleCosts } from '@/config/pricing'
import { computed, onMounted, ref, watch } from 'vue'
import UsageAdditionalCharts from './UsageAdditionalCharts.vue'
import UsageChart from './UsageChart.vue'
import UsageDetailedTable from './UsageDetailedTable.vue'
import UsageFilters from './UsageFilters.vue'
import UsagePricingDisclaimer from './UsagePricingDisclaimer.vue'
import UsageSummary from './UsageSummary.vue'
import UsageViewToggle from './UsageViewToggle.vue'

// Debug-Log-Funktion (nur im Debug-Modus)
const debugLog = (...args: unknown[]) => {
  const isDevelopment = import.meta.env.DEV
  const debugFromEnv = import.meta.env.VITE_SHOW_DEBUG === 'true'
  const debugFromLocalStorage = localStorage.getItem('debug') === 'true'
  const showDebugMode = isDevelopment && (debugFromEnv || debugFromLocalStorage)
  if (showDebugMode) {
    console.log(...args)
  }
}

const activeTab = ref('own')

// Prüfe ob Benutzer API-Admin ist
const isApiAdmin = computed(() => hasPermission('canViewAdminUsage'))

// Usage Composable
const {
  isLoading,
  error,
  detailedUsageData,
  usageAggregation,
  userUsageSummary,
  modelUsageSummary,
  filteredUsageData,
  topUsers,
  topModels,
  loadDetailedUsageData,
  loadUsageSummary,
} = useUsage()

// Eigene Rohdaten für "Meine Nutzung"
const ownRawUsageData = ref<UsageResponse['usage']>([])
const isLoadingOwnData = ref(false)

// Admin-Rohdaten für "Admin-Nutzung"
const adminRawUsageData = ref<EnhancedUsageRecord[]>([])
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

// Setze Standard-Datumswerte
const setDefaultDates = () => {
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  ownFromDate.value = thirtyDaysAgo.toISOString()
  ownToDate.value = today.toISOString()

  adminFromDate.value = thirtyDaysAgo.toISOString()
  adminToDate.value = today.toISOString()
}

// Initialisiere Standard-Daten beim Mounten
onMounted(async () => {
  setDefaultDates()

  // Berechne Standard-Zeitraum (30 Tage)
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const fromDate = thirtyDaysAgo.toISOString()
  const toDate = today.toISOString()

  // Verwende bereits geladene Daten von HomeView
  // Nur laden wenn wirklich keine Daten vorhanden sind
  if (!usageAggregation.value || Object.keys(usageAggregation.value).length === 0) {
    debugLog('🔍 [USAGE-TABS] No data available, loading usage summary...')
    await loadUsageSummary({
      fromDate,
      toDate,
    })
  } else {
    debugLog('🔍 [USAGE-TABS] Using existing data from HomeView')
  }

  // Lade eigene Rohdaten für "Meine Nutzung"
  await loadOwnRawData(fromDate, toDate)

  // Lade Admin-Rohdaten für "Admin-Nutzung" (nur wenn Admin-Berechtigung vorhanden)
  if (isApiAdmin.value) {
    await loadAdminRawData(fromDate, toDate)
  }
})

// Funktion zum Laden der eigenen Rohdaten
const loadOwnRawData = async (fromDate: string, toDate: string) => {
  isLoadingOwnData.value = true
  try {
    const usageService = await import('@/services/apiService')
    const response = await usageService.usageService.getOwnUsage(fromDate, toDate)
    ownRawUsageData.value = response.usage || []
    console.log(
      '🔍 [USAGE-TABS] Own raw data loaded:',
      ownRawUsageData.value?.length || 0,
      'records',
    )
  } catch (err) {
    console.error('❌ [USAGE-TABS] Error loading own raw data:', err)
  } finally {
    isLoadingOwnData.value = false
  }
}

// Funktion zum Laden der Admin-Rohdaten
const loadAdminRawData = async (fromDate: string, toDate: string) => {
  isLoadingAdminData.value = true
  try {
    // Debug: Prüfe Admin-Berechtigung
    debugLog('🔍 [USAGE-TABS] Checking admin permission:', hasPermission('canViewAdminUsage'))
    debugLog('🔍 [USAGE-TABS] User roles:', getUserRoles())
    debugLog('🔍 [USAGE-TABS] Highest role:', getHighestRole())

    // Verwende die Admin-API direkt mit by Parametern für Chart-Daten
    const params: any = {}
    if (fromDate) params.from_date = fromDate
    if (toDate) params.to_date = toDate
    
    // Füge by Parameter hinzu für day, month, year Gruppierung
    const chartPeriod = adminChartPeriod.value || 'daily'
    if (chartPeriod === 'daily') {
      params.by = 'day'
    } else if (chartPeriod === 'weekly') {
      params.by = 'day,week'
    } else if (chartPeriod === 'monthly') {
      params.by = 'month'
    }

    const response = await adminUsageAISummaryGetV1(params)
    const responseData = response.data

    // Konvertiere SummaryUsage zu EnhancedUsageRecord
    const convertedData = (responseData.usage || []).map((item) => {
      // Berechne Token-Werte aus den verfügbaren Daten
      const requestTokens = (item as any).requestTokens || 0
      const responseTokens = (item as any).responseTokens || 0
      const totalTokens = requestTokens + responseTokens

      // Berechne Kosten mit der calculateCost Funktion
      const costCalculation = calculateCost(
        requestTokens,
        responseTokens,
        item.model || 'unknown',
        false, // useCachedInput
        item.type || 'CompletionModelUsage',
      )

      return {
        technicalUserId: item.technicalUserId || 'unknown',
        technicalUserName: item.technicalUserId || 'Unknown User', // Verwende technicalUserId als Name
        modelName: item.model || 'unknown',
        modelType: item.type || 'CompletionModelUsage',
        type: item.type || 'CompletionModelUsage',
        requests: item.requests || 0,
        tokensIn: requestTokens,
        tokensOut: responseTokens,
        totalTokens: totalTokens,
        cost: costCalculation.finalCost || item.cost || 0,
        tag: item.tag || 'production',
        day: (item as any).day,
        month: (item as any).month,
        year: (item as any).year,
        createDate: undefined,
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

// Computed properties für gefilterte Daten
const filteredOwnUsage = computed(() => {
  if (!ownRawUsageData.value || ownRawUsageData.value.length === 0) {
    return {
      tokensIn: 0,
      tokensOut: 0,
      requests: 0,
      cost: 0,
    }
  }

  // Filtere nach Modelltyp und Zeitraum
  let filteredData = ownRawUsageData.value

  // Filtere nach Modelltyp falls ausgewählt
  if (ownModelType.value) {
    filteredData = filteredData.filter((item) => item.type === ownModelType.value)
  }

  // Filtere nach Zeitraum
  let fromDate: Date
  let toDate: Date

  if (ownTimeRange.value === 'custom' && ownFromDate.value && ownToDate.value) {
    fromDate = new Date(ownFromDate.value)
    toDate = new Date(ownToDate.value)
  } else if (ownTimeRange.value !== 'custom') {
    const today = new Date()

    switch (ownTimeRange.value) {
      case '7d':
        fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        toDate = today
        break
      case '30d':
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        toDate = today
        break
      case '90d':
        fromDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        toDate = today
        break
      case 'thisMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
        toDate = today
        break
      case 'lastMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        toDate = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      default:
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        toDate = today
    }
  } else {
    // Fallback: Letzte 30 Tage
    const today = new Date()
    fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    toDate = today
  }

  // Filtere nach Datum
  filteredData = filteredData.filter((item) => {
    const itemDate = item.createDate ? new Date(item.createDate) : new Date()
    return itemDate >= fromDate && itemDate <= toDate
  })

  // Berechne aggregierte Werte für ModelUsage
  const aggregatedData = filteredData.reduce(
    (acc, item) => {
      // Verwende echte Token-Daten falls verfügbar
      if (item.type === 'CompletionModelUsage') {
        const requestTokens = (item as any).requestTokens || 1000
        const responseTokens = (item as any).responseTokens || 500
        acc.tokensIn += requestTokens
        acc.tokensOut += responseTokens
        acc.cost += 0.01 // Schätzung: ~1 Cent pro Request
      } else if (item.type === 'EmbeddingModelUsage') {
        const requestTokens = (item as any).requestTokens || 1000
        acc.tokensIn += requestTokens
        acc.tokensOut += 0
        acc.cost += 0.001 // Schätzung: ~0.1 Cent pro Request
      } else if (item.type === 'ImageModelUsage') {
        acc.tokensIn += 0
        acc.tokensOut += 0
        acc.cost += 0.02 // Schätzung: ~2 Cent pro Bild
      }
      return acc
    },
    { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0 },
  )

  // Jedes Objekt repräsentiert einen Request
  aggregatedData.requests = filteredData.length

  return aggregatedData
})

// Computed property für gefilterte eigene Rohdaten (für Charts und Details)
const filteredOwnUsageData = computed(() => {
  if (!ownRawUsageData.value || ownRawUsageData.value.length === 0) {
    return []
  }

  // Filtere nach eigenen Filtern
  let filteredData = ownRawUsageData.value

  // Filtere nach Modelltyp falls ausgewählt
  if (ownModelType.value) {
    filteredData = filteredData.filter((item) => item.type === ownModelType.value)
  }

  // Filtere nach Zeitraum
  let fromDate: Date
  let toDate: Date

  if (ownTimeRange.value === 'custom' && ownFromDate.value && ownToDate.value) {
    fromDate = new Date(ownFromDate.value)
    toDate = new Date(ownToDate.value)
  } else if (ownTimeRange.value !== 'custom') {
    const today = new Date()

    switch (ownTimeRange.value) {
      case '7d':
        fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        toDate = today
        break
      case '30d':
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        toDate = today
        break
      case '90d':
        fromDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        toDate = today
        break
      case 'thisMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
        toDate = today
        break
      case 'lastMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        toDate = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      default:
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        toDate = today
    }
  } else {
    // Fallback: Letzte 30 Tage
    const today = new Date()
    fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    toDate = today
  }

  // Filtere nach Datum
  filteredData = filteredData.filter((item) => {
    const itemDate = item.createDate ? new Date(item.createDate) : new Date()
    return itemDate >= fromDate && itemDate <= toDate
  })

  // Konvertiere zu EnhancedUsageRecord für Kompatibilität
  return filteredData.map((item) => {
    // Berechne Token-Werte basierend auf dem Typ
    let tokensIn = 0
    let tokensOut = 0
    let cost = 0

    if (item.type === 'CompletionModelUsage') {
      // Verwende echte Token-Daten falls verfügbar
      tokensIn = (item as any).requestTokens || 1000 // Fallback-Schätzung
      tokensOut = (item as any).responseTokens || 500 // Fallback-Schätzung
      cost = 0.01 // Schätzung: ~1 Cent pro Request
    } else if (item.type === 'EmbeddingModelUsage') {
      tokensIn = (item as any).requestTokens || 1000 // Fallback-Schätzung
      tokensOut = 0
      cost = 0.001 // Schätzung: ~0.1 Cent pro Request
    } else if (item.type === 'ImageModelUsage') {
      tokensIn = 0
      tokensOut = 0
      cost = 0.02 // Schätzung: ~2 Cent pro Bild
    }

    return {
      technicalUserId: 'own',
      technicalUserName: 'Meine Nutzung',
      modelName: item.model || 'unknown',
      modelType: item.type || 'CompletionModelUsage',
      type: item.type || 'CompletionModelUsage',
      requests: 1,
      tokensIn,
      tokensOut,
      totalTokens: tokensIn + tokensOut,
      cost,
      tag: item.tag || 'production',
      day: undefined,
      month: undefined,
      year: undefined,
      createDate: item.createDate,
      apiKeyId: 'own',
    }
  })
})

// Computed property für gefilterte Admin-Rohdaten (für Charts)
const filteredAdminUsageData = computed(() => {
  if (!adminRawUsageData.value || adminRawUsageData.value.length === 0) {
    return []
  }

  // Filtere nach Admin-Filtern
  let filteredData = adminRawUsageData.value

  // Filtere nach Modelltyp falls ausgewählt
  if (adminModelType.value) {
    filteredData = filteredData.filter(
      (item) => item.type === adminModelType.value || item.modelType === adminModelType.value || (item as any).model === adminModelType.value,
    )
  }

  // Filtere nach Benutzer falls ausgewählt
  if (adminUser.value) {
    filteredData = filteredData.filter((item) => {
      const userId = item.technicalUserId || item.apiKeyId || 'unknown'
      return userId === adminUser.value
    })
  }

  // Filtere nach Zeitraum
  let fromDate: Date
  let toDate: Date

  if (adminTimeRange.value === 'custom' && adminFromDate.value && adminToDate.value) {
    fromDate = new Date(adminFromDate.value)
    toDate = new Date(adminToDate.value)
  } else if (adminTimeRange.value !== 'custom') {
    const today = new Date()

    switch (adminTimeRange.value) {
      case '7d':
        fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        toDate = today
        break
      case '30d':
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        toDate = today
        break
      case '90d':
        fromDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        toDate = today
        break
      case 'thisMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
        toDate = today
        break
      case 'lastMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        toDate = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      default:
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        toDate = today
    }
  } else {
    // Fallback: Letzte 30 Tage
    const today = new Date()
    fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    toDate = today
  }

  // Filtere nach Datum
  filteredData = filteredData.filter((item) => {
    // Admin-Daten aus SummaryUsage haben keine Datums-Informationen
    // Deshalb überspringen wir die Datum-Filterung für Admin-Daten
    if (!item.createDate && !item.day && !item.month && !item.year) {
      return true // Behalte alle Admin-Daten ohne Datum
    }

    let itemDate: Date
    if (item.createDate) {
      itemDate = new Date(item.createDate)
    } else if (item.day && item.month && item.year) {
      itemDate = new Date(item.year, item.month - 1, item.day)
    } else {
      return false
    }
    return itemDate >= fromDate && itemDate <= toDate
  })

  return filteredData
})

// Computed property für eindeutige Benutzer aus den Admin-Usage-Daten
const uniqueUsers = computed(() => {
  if (!adminRawUsageData.value || adminRawUsageData.value.length === 0) {
    return []
  }

  // Extrahiere eindeutige Benutzer aus den Admin-Usage-Daten
  const userMap = new Map<string, string>()

  adminRawUsageData.value.forEach((item) => {
    const userId = item.technicalUserId || item.apiKeyId || 'unknown'
    const userName = item.technicalUserName || `User ${userId}`

    if (!userMap.has(userId)) {
      userMap.set(userId, userName)
    }
  })

  // Konvertiere zu Array und sortiere nach Benutzername
  return Array.from(userMap.entries())
    .map(([userId, userName]) => ({
      id: userId,
      name: userName,
      displayName: `${userId} (${userName})`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const filteredAdminUsage = computed(() => {
  console.log(
    '🔍 [USAGE-TABS] filteredAdminUsage - filteredAdminUsageData length:',
    filteredAdminUsageData.value?.length || 0,
  )

  if (!filteredAdminUsageData.value || filteredAdminUsageData.value.length === 0) {
    console.log('🔍 [USAGE-TABS] filteredAdminUsage - No filteredAdminUsageData available')
    return {
      tokensIn: 0,
      tokensOut: 0,
      requests: 0,
      cost: 0,
      uniqueUsers: 0,
    }
  }

  // Verwende die gefilterten Admin-Daten
  const filteredData = filteredAdminUsageData.value
  console.log(
    '🔍 [USAGE-TABS] filteredAdminUsage - Using filteredData length:',
    filteredData.length,
  )

  // Berechne aggregierte Werte
  const aggregatedData = filteredData.reduce(
    (acc, item) => {
      acc.tokensIn += item.tokensIn || 0
      acc.tokensOut += item.tokensOut || 0
      acc.cost += item.cost || 0
      acc.requests += item.requests || 0 // Verwende item.requests statt 1
      return acc
    },
    { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0, uniqueUsers: 0 },
  )

  // Berechne eindeutige Benutzer
  const uniqueUsers = new Set(filteredData.map((item) => item.technicalUserId)).size
  aggregatedData.uniqueUsers = uniqueUsers

  console.log('🔍 [USAGE-TABS] filteredAdminUsage - Aggregated data:', aggregatedData)

  return aggregatedData
})

// Computed properties für die Anzeige basierend auf Ansicht
const showOwnChart = computed(() => {
  return ownView.value === 'overview'
})

const showOwnDetails = computed(() => {
  return ownView.value === 'detailed'
})

const showAdminChart = computed(() => {
  return adminView.value === 'overview'
})

const showAdminDetails = computed(() => {
  return adminView.value === 'detailed'
})

// Lade detaillierte Daten nur wenn benötigt
const loadDetailedDataIfNeeded = async () => {
  if (showOwnDetails.value || showAdminDetails.value) {
    await loadDetailedUsageData()
  }
}

// Watch für View-Änderungen
watch([showOwnDetails, showAdminDetails], async ([ownDetails, adminDetails]) => {
  if (ownDetails || adminDetails) {
    await loadDetailedDataIfNeeded()
  }
})

// Computed property für Chart-Perioden basierend auf Filter
const ownChartPeriodFromFilter = computed(() => {
  if (ownTimeRange.value === '7d') return 'daily'
  if (ownTimeRange.value === '30d') return 'weekly'
  if (ownTimeRange.value === '90d') return 'monthly'
  if (ownTimeRange.value === 'thisMonth') return 'daily'
  if (ownTimeRange.value === 'lastMonth') return 'daily'
  if (ownTimeRange.value === 'custom' && ownFromDate.value && ownToDate.value) {
    // Berechne Tage für benutzerdefinierte Zeiträume
    const fromDate = new Date(ownFromDate.value)
    const toDate = new Date(ownToDate.value)
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff <= 7) return 'daily'
    if (daysDiff <= 30) return 'weekly'
    return 'monthly'
  }
  return 'daily'
})

// Watch für Änderungen der Chart-Periode
watch(ownChartPeriodFromFilter, (newPeriod) => {
  ownChartPeriod.value = newPeriod
})

// Watch für manuelle Änderungen der Chart-Periode
watch(ownChartPeriod, (newPeriod) => {
  // Nur loggen, keine Aktionen
})

<<<<<<< HEAD
// Watch für manuelle Änderungen der Admin Chart-Periode
watch(adminChartPeriod, async (newPeriod) => {
  // Lade Admin-Daten neu mit der neuen Periode
  if (adminTimeRange.value) {
    let fromDate: string | undefined
    let toDate: string | undefined

    if (adminTimeRange.value === 'custom' && adminFromDate.value && adminToDate.value) {
      fromDate = adminFromDate.value
      toDate = adminToDate.value
    } else if (adminTimeRange.value !== 'custom') {
      const today = new Date()
      const fromDateObj = new Date()

      switch (adminTimeRange.value) {
        case '7d':
          fromDateObj.setDate(today.getDate() - 7)
          break
        case '30d':
          fromDateObj.setDate(today.getDate() - 30)
          break
        case '90d':
          fromDateObj.setDate(today.getDate() - 90)
          break
        case 'thisMonth':
          fromDateObj.setDate(1)
          fromDateObj.setHours(0, 0, 0, 0)
          break
        case 'lastMonth':
          fromDateObj.setMonth(today.getMonth() - 1)
          fromDateObj.setDate(1)
          fromDateObj.setHours(0, 0, 0, 0)
          break
      }

      fromDate = fromDateObj.toISOString()

      if (adminTimeRange.value === 'thisMonth') {
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        toDate = lastDayOfMonth.toISOString()
      } else if (adminTimeRange.value === 'lastMonth') {
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
        toDate = lastDayOfLastMonth.toISOString()
      } else {
        toDate = today.toISOString()
      }
    }

    // Lade Admin-Daten neu mit der neuen Periode
    if (fromDate && toDate) {
      await loadAdminRawData(fromDate, toDate)
    }
  }
})

=======
>>>>>>> e88ca74 (fix: Remove admin chart period controls and simplify admin strategy - Remove adminChartPeriod variable and related watchers/handlers - Remove chart period controls from admin UsageChart component - Admin charts now only show data grouped by model type - This simplifies admin view and removes time-based complexity)
// Watch für Filter-Änderungen
watch([ownTimeRange, ownModelType, ownView, ownFromDate, ownToDate], async () => {
  // Berechne from_date und to_date basierend auf dem ausgewählten Zeitraum
  let fromDate: string | undefined
  let toDate: string | undefined

  if (ownTimeRange.value === 'custom' && ownFromDate.value && ownToDate.value) {
    fromDate = ownFromDate.value
    toDate = ownToDate.value
  } else if (ownTimeRange.value !== 'custom') {
    const today = new Date()
    const fromDateObj = new Date()

    switch (ownTimeRange.value) {
      case '7d':
        fromDateObj.setDate(today.getDate() - 7)
        break
      case '30d':
        fromDateObj.setDate(today.getDate() - 30)
        break
      case '90d':
        fromDateObj.setDate(today.getDate() - 90)
        break
      case 'thisMonth':
        fromDateObj.setDate(1)
        fromDateObj.setHours(0, 0, 0, 0)
        break
      case 'lastMonth':
        fromDateObj.setMonth(today.getMonth() - 1)
        fromDateObj.setDate(1)
        fromDateObj.setHours(0, 0, 0, 0)
        break
    }

    fromDate = fromDateObj.toISOString()

    if (ownTimeRange.value === 'thisMonth') {
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      toDate = lastDayOfMonth.toISOString()
    } else if (ownTimeRange.value === 'lastMonth') {
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      toDate = lastDayOfLastMonth.toISOString()
    } else {
      toDate = today.toISOString()
    }
  }

  // Lade Daten mit den korrekten Parametern
  if (fromDate && toDate) {
    await loadDetailedUsageData({
      fromDate,
      toDate,
      modelType: ownModelType.value || undefined,
    })

    // Lade eigene Rohdaten neu
    await loadOwnRawData(fromDate, toDate)
  }
})

// Zusätzlicher Watch für modelType-Änderungen - Charts neu rendern
watch(ownModelType, () => {
  // Keine Aktionen
})

// Zusätzlicher Watch für adminModelType-Änderungen
watch(adminModelType, () => {
  // Keine Aktionen
})

watch(
  [adminTimeRange, adminModelType, adminUser, adminView, adminFromDate, adminToDate],
  async () => {
    // Berechne from_date und to_date basierend auf dem ausgewählten Zeitraum
    let fromDate: string | undefined
    let toDate: string | undefined

    if (adminTimeRange.value === 'custom' && adminFromDate.value && adminToDate.value) {
      fromDate = adminFromDate.value
      toDate = adminToDate.value
    } else if (adminTimeRange.value !== 'custom') {
      const today = new Date()
      const fromDateObj = new Date()

      switch (adminTimeRange.value) {
        case '7d':
          fromDateObj.setDate(today.getDate() - 7)
          break
        case '30d':
          fromDateObj.setDate(today.getDate() - 30)
          break
        case '90d':
          fromDateObj.setDate(today.getDate() - 90)
          break
        case 'thisMonth':
          fromDateObj.setDate(1)
          fromDateObj.setHours(0, 0, 0, 0)
          break
        case 'lastMonth':
          fromDateObj.setMonth(today.getMonth() - 1)
          fromDateObj.setDate(1)
          fromDateObj.setHours(0, 0, 0, 0)
          break
      }

      fromDate = fromDateObj.toISOString()

      if (adminTimeRange.value === 'thisMonth') {
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        toDate = lastDayOfMonth.toISOString()
      } else if (adminTimeRange.value === 'lastMonth') {
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
        toDate = lastDayOfLastMonth.toISOString()
      } else {
        toDate = today.toISOString()
      }
    }

    // Lade Daten mit den korrekten Parametern
    if (fromDate && toDate) {
      await loadDetailedUsageData({
        fromDate,
        toDate,
        modelType: adminModelType.value || undefined,
      })

      // Lade Admin-Rohdaten neu
      await loadAdminRawData(fromDate, toDate)
    }

    console.log('Admin-Filter geändert')
    console.log('Aktuelle Admin-Filter:', {
      timeRange: adminTimeRange.value,
      modelType: adminModelType.value,
      user: adminUser.value,
      view: adminView.value,
      fromDate,
      toDate,
    })
  },
)

// Setze Standard-Tab basierend auf Rolle
if (!isApiAdmin.value) {
  activeTab.value = 'own'
}

// Computed properties für statische Daten (Fallback)
const staticOwnUsage = computed(() => {
  const exampleCosts = calculateExampleCosts()
  return {
    tokensIn: 198456,
    tokensOut: 99863,
    requests: 1247,
    cost: exampleCosts.tokensIn198456,
  }
})

const staticAdminUsage = computed(() => {
  const exampleCosts = calculateExampleCosts()
  return {
    activeUsers: 24,
    tokensIn: 892456,
    tokensOut: 355436,
    requests: 45123,
    cost: exampleCosts.tokensIn892456,
  }
})

// Computed properties für die Anzeige - verwende echte Daten oder Fallback
const displayOwnUsage = computed(() => {
  // Wenn echte Daten verfügbar sind, verwende diese
  if (usageAggregation.value && usageAggregation.value.totalRequests > 0) {
    return {
      tokensIn: usageAggregation.value.totalTokensIn,
      tokensOut: usageAggregation.value.totalTokensOut,
      requests: usageAggregation.value.totalRequests,
      cost: usageAggregation.value.totalCost,
    }
  }
  // Sonst verwende statische Daten
  return staticOwnUsage.value
})

const displayAdminUsage = computed(() => {
  // Wenn echte Daten verfügbar sind, verwende diese
  if (usageAggregation.value && usageAggregation.value.totalRequests > 0) {
    return {
      activeUsers: usageAggregation.value.uniqueUsers,
      tokensIn: usageAggregation.value.totalTokensIn,
      tokensOut: usageAggregation.value.totalTokensOut,
      requests: usageAggregation.value.totalRequests,
      cost: usageAggregation.value.totalCost,
    }
  }
  // Sonst verwende statische Daten
  return staticAdminUsage.value
})

// Computed properties für Chart-Daten
const ownChartData = computed(() => {
  // Reaktive Dependencies explizit referenzieren
  const modelType = ownModelType.value
  const chartPeriod = ownChartPeriod.value
  const timeRange = ownTimeRange.value
  const fromDate = ownFromDate.value
  const toDate = ownToDate.value

  console.log(
    '🔍 [USAGE-TABS] ownChartData - ownRawUsageData length:',
    ownRawUsageData.value?.length || 0,
  )

  if (!ownRawUsageData.value || ownRawUsageData.value.length === 0) {
    // Keine Daten verfügbar - leere Chart-Daten zurückgeben
    console.log('🔍 [USAGE-TABS] ownChartData - No ownRawUsageData available')
    return {
      labels: [],
      tokensIn: [],
      tokensOut: [],
      requests: [],
    }
  }

  // Gruppiere Daten basierend auf der ausgewählten Periode
  let sortedData = ownRawUsageData.value
    .filter((item) => item.createDate)
    // Filtere nach Modelltyp falls ausgewählt
    .filter((item) => {
      if (!modelType) return true // Alle Modelltypen anzeigen
      return item.type === modelType
    })

  console.log('🔍 [USAGE-TABS] ownChartData - Filtered data length:', sortedData.length)

  const period = chartPeriod

  // Sortiere die Daten nach Datum
  sortedData = sortedData.sort((a, b) => {
    // Verwende createDate falls verfügbar
    if (a.createDate && b.createDate) {
      return new Date(a.createDate).getTime() - new Date(b.createDate).getTime()
    }
    return 0
  })

  if (period === 'daily') {
    // Gruppiere nach Wochentagen (Montag-Sonntag)
    const dailyGroups = new Map<
      string,
      { tokensIn: number; tokensOut: number; requests: number; count: number; dayNumber: number }
    >()

    sortedData.forEach((item) => {
      let date: Date
      if (item.createDate) {
        date = new Date(item.createDate)
      } else if (item.day && item.month && item.year) {
        date = new Date(item.year, item.month - 1, item.day)
      } else {
        return
      }

      // Berechne Wochentag (0=Sonntag, 1=Montag, ..., 6=Samstag)
      const dayOfWeek = date.getDay()
      const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
      const dayLabel = dayNames[dayOfWeek]

      if (!dailyGroups.has(dayLabel)) {
        dailyGroups.set(dayLabel, {
          tokensIn: 0,
          tokensOut: 0,
          requests: 0,
          count: 0,
          dayNumber: dayOfWeek,
        })
      }

      const group = dailyGroups.get(dayLabel)!
      group.tokensIn += item.tokensIn || 0
      group.tokensOut += item.tokensOut || 0
      group.requests += 1 // Jedes Objekt repräsentiert einen Request
      group.count++
    })

    // Sortiere nach Wochentagen (Montag-Sonntag)
    const sortedEntries = Array.from(dailyGroups.entries()).sort((a, b) => {
      // Montag = 1, Sonntag = 0, also sortiere entsprechend
      const dayA = a[1].dayNumber === 0 ? 7 : a[1].dayNumber // Sonntag ans Ende
      const dayB = b[1].dayNumber === 0 ? 7 : b[1].dayNumber
      return dayA - dayB
    })

    const labels = sortedEntries.map(([label]) => label)
    const tokensIn = sortedEntries.map(([, data]) => data.tokensIn)
    const tokensOut = sortedEntries.map(([, data]) => data.tokensOut)
    const requests = sortedEntries.map(([, data]) => data.requests)

    return { labels, tokensIn, tokensOut, requests }
  } else if (period === 'hourly') {
    // Gruppiere nach Stunden (0:00-24:00)
    const hourlyGroups = new Map<
      string,
      { tokensIn: number; tokensOut: number; requests: number; count: number; hour: number }
    >()

    sortedData.forEach((item) => {
      let date: Date
      if (item.createDate) {
        date = new Date(item.createDate)
      } else if (item.day && item.month && item.year) {
        date = new Date(item.year, item.month - 1, item.day)
      } else {
        return
      }

      const hour = date.getHours()
      const hourLabel = `${String(hour).padStart(2, '0')}:00`

      if (!hourlyGroups.has(hourLabel)) {
        hourlyGroups.set(hourLabel, { tokensIn: 0, tokensOut: 0, requests: 0, count: 0, hour })
      }

      const group = hourlyGroups.get(hourLabel)!
      group.tokensIn += item.tokensIn || 0
      group.tokensOut += item.tokensOut || 0
      group.requests += 1 // Jedes Objekt repräsentiert einen Request
      group.count++
    })

    const sortedEntries = Array.from(hourlyGroups.entries()).sort((a, b) => a[1].hour - b[1].hour)
    const labels = sortedEntries.map(([label]) => label)
    const tokensIn = sortedEntries.map(([, data]) => data.tokensIn)
    const tokensOut = sortedEntries.map(([, data]) => data.tokensOut)
    const requests = sortedEntries.map(([, data]) => data.requests)

    return { labels, tokensIn, tokensOut, requests }
  } else if (period === 'weekly') {
    // Gruppiere nach Wochen (Woche 1, Woche 2, etc.)
    const weeklyGroups = new Map<
      string,
      { tokensIn: number; tokensOut: number; requests: number; count: number; weekNumber: number }
    >()

    sortedData.forEach((item) => {
      let date: Date
      if (item.createDate) {
        date = new Date(item.createDate)
      } else if (item.day && item.month && item.year) {
        date = new Date(item.year, item.month - 1, item.day)
      } else {
        return
      }

      // Berechne Woche des Jahres
      const startOfYear = new Date(date.getFullYear(), 0, 1)
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
      const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
      const weekLabel = `Woche ${weekNumber}`

      if (!weeklyGroups.has(weekLabel)) {
        weeklyGroups.set(weekLabel, {
          tokensIn: 0,
          tokensOut: 0,
          requests: 0,
          count: 0,
          weekNumber,
        })
      }

      const group = weeklyGroups.get(weekLabel)!
      group.tokensIn += item.tokensIn || 0
      group.tokensOut += item.tokensOut || 0
      group.requests += 1 // Jedes Objekt repräsentiert einen Request
      group.count++
    })

    const sortedEntries = Array.from(weeklyGroups.entries()).sort(
      (a, b) => a[1].weekNumber - b[1].weekNumber,
    )
    const labels = sortedEntries.map(([label]) => label)
    const tokensIn = sortedEntries.map(([, data]) => data.tokensIn)
    const tokensOut = sortedEntries.map(([, data]) => data.tokensOut)
    const requests = sortedEntries.map(([, data]) => data.requests)

    return { labels, tokensIn, tokensOut, requests }
  } else if (period === 'monthly') {
    // Gruppiere nach Monaten (Jan bis zum aktuellen/letzten Monat im Zeitraum)
    const monthlyGroups = new Map<
      string,
      { tokensIn: number; tokensOut: number; requests: number; count: number; monthNumber: number }
    >()

    sortedData.forEach((item) => {
      let date: Date
      if (item.createDate) {
        date = new Date(item.createDate)
      } else if (item.day && item.month && item.year) {
        date = new Date(item.year, item.month - 1, item.day)
      } else {
        return
      }

      const monthNumber = date.getMonth()
      const monthLabel = date.toLocaleDateString('de-DE', { month: 'short' })

      if (!monthlyGroups.has(monthLabel)) {
        monthlyGroups.set(monthLabel, {
          tokensIn: 0,
          tokensOut: 0,
          requests: 0,
          count: 0,
          monthNumber,
        })
      }

      const group = monthlyGroups.get(monthLabel)!
      group.tokensIn += item.tokensIn || 0
      group.tokensOut += item.tokensOut || 0
      group.requests += 1 // Jedes Objekt repräsentiert einen Request
      group.count++
    })

    const sortedEntries = Array.from(monthlyGroups.entries()).sort(
      (a, b) => a[1].monthNumber - b[1].monthNumber,
    )
    const labels = sortedEntries.map(([label]) => label)
    const tokensIn = sortedEntries.map(([, data]) => data.tokensIn)
    const tokensOut = sortedEntries.map(([, data]) => data.tokensOut)
    const requests = sortedEntries.map(([, data]) => data.requests)

    return { labels, tokensIn, tokensOut, requests }
  }

  // Fallback: Zeige individuelle Datenpunkte
  const labels = sortedData.map((item) => {
    if (item.createDate) {
      const date = new Date(item.createDate)
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (item.day && item.month && item.year) {
      const date = new Date(item.year, item.month - 1, item.day)
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    }
    return 'Unknown'
  })

  const tokensIn = sortedData.map((item) => item.tokensIn || 0)
  const tokensOut = sortedData.map((item) => item.tokensOut || 0)
  const requests = sortedData.map((item) => 1) // Jedes Objekt repräsentiert einen Request

  return { labels, tokensIn, tokensOut, requests }
})

const adminChartData = computed(() => {
  // Verwende gefilterte Admin-Daten für Chart
  if (!filteredAdminUsageData.value || filteredAdminUsageData.value.length === 0) {
    return { labels: [], tokensIn: [], tokensOut: [], requests: [] }
  }

  // Admin-Daten können day, month, year Felder haben (wenn by Parameter verwendet wurde)
  const data = filteredAdminUsageData.value

  // Prüfe ob Admin-Daten Datums-Informationen haben
  const hasDateInfo = data.some(item => item.day || item.month || item.year)
  
  if (hasDateInfo) {
    // Admin-Daten haben Datums-Informationen - verwende Zeit-basierte Gruppierung
    const period = adminChartPeriod.value || 'daily'
    
    if (period === 'daily') {
      // Gruppiere nach Tagen
      const dailyGroups = new Map<
        string,
        { tokensIn: number; tokensOut: number; requests: number; count: number; dayNumber: number }
      >()

      data.forEach((item) => {
        if (!item.day || !item.month || !item.year) return
        
        const date = new Date(item.year, item.month - 1, item.day)
        const dayOfWeek = date.getDay()
        const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
        const dayLabel = dayNames[dayOfWeek]

        if (!dailyGroups.has(dayLabel)) {
          dailyGroups.set(dayLabel, {
            tokensIn: 0,
            tokensOut: 0,
            requests: 0,
            count: 0,
            dayNumber: dayOfWeek,
          })
        }

        const group = dailyGroups.get(dayLabel)!
        group.tokensIn += item.tokensIn || 0
        group.tokensOut += item.tokensOut || 0
        group.requests += item.requests || 0
        group.count++
      })

      // Sortiere nach Wochentagen (Montag-Sonntag)
      const sortedEntries = Array.from(dailyGroups.entries()).sort((a, b) => {
        const dayA = a[1].dayNumber === 0 ? 7 : a[1].dayNumber // Sonntag ans Ende
        const dayB = b[1].dayNumber === 0 ? 7 : b[1].dayNumber
        return dayA - dayB
      })

      const labels = sortedEntries.map(([label]) => label)
      const tokensIn = sortedEntries.map(([, data]) => data.tokensIn)
      const tokensOut = sortedEntries.map(([, data]) => data.tokensOut)
      const requests = sortedEntries.map(([, data]) => data.requests)

      return { labels, tokensIn, tokensOut, requests }
    } else if (period === 'weekly') {
      // Gruppiere nach Wochen
      const weeklyGroups = new Map<
        string,
        { tokensIn: number; tokensOut: number; requests: number; count: number; weekNumber: number }
      >()

      data.forEach((item) => {
        if (!item.day || !item.month || !item.year) return
        
        const date = new Date(item.year, item.month - 1, item.day)
        const weekNumber = Math.ceil(
          (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
        )
        const weekLabel = `KW ${weekNumber}`

        if (!weeklyGroups.has(weekLabel)) {
          weeklyGroups.set(weekLabel, {
            tokensIn: 0,
            tokensOut: 0,
            requests: 0,
            count: 0,
            weekNumber,
          })
        }

        const group = weeklyGroups.get(weekLabel)!
        group.tokensIn += item.tokensIn || 0
        group.tokensOut += item.tokensOut || 0
        group.requests += item.requests || 0
        group.count++
      })

      const sortedEntries = Array.from(weeklyGroups.entries()).sort(
        (a, b) => a[1].weekNumber - b[1].weekNumber,
      )
      const labels = sortedEntries.map(([label]) => label)
      const tokensIn = sortedEntries.map(([, data]) => data.tokensIn)
      const tokensOut = sortedEntries.map(([, data]) => data.tokensOut)
      const requests = sortedEntries.map(([, data]) => data.requests)

      return { labels, tokensIn, tokensOut, requests }
    } else if (period === 'monthly') {
      // Gruppiere nach Monaten
      const monthlyGroups = new Map<
        string,
        { tokensIn: number; tokensOut: number; requests: number; count: number; monthNumber: number }
      >()

      data.forEach((item) => {
        if (!item.month || !item.year) return
        
        const monthNumber = item.month - 1 // JavaScript Monate sind 0-basiert
        const monthLabel = new Date(item.year, monthNumber).toLocaleDateString('de-DE', { month: 'short' })

        if (!monthlyGroups.has(monthLabel)) {
          monthlyGroups.set(monthLabel, {
            tokensIn: 0,
            tokensOut: 0,
            requests: 0,
            count: 0,
            monthNumber,
          })
        }

        const group = monthlyGroups.get(monthLabel)!
        group.tokensIn += item.tokensIn || 0
        group.tokensOut += item.tokensOut || 0
        group.requests += item.requests || 0
        group.count++
      })

      const sortedEntries = Array.from(monthlyGroups.entries()).sort(
        (a, b) => a[1].monthNumber - b[1].monthNumber,
      )
      const labels = sortedEntries.map(([label]) => label)
      const tokensIn = sortedEntries.map(([, data]) => data.tokensIn)
      const tokensOut = sortedEntries.map(([, data]) => data.tokensOut)
      const requests = sortedEntries.map(([, data]) => data.requests)

      return { labels, tokensIn, tokensOut, requests }
    }
  }

  // Fallback: Gruppiere nach Modelltyp (wenn keine Datums-Informationen vorhanden)
  const modelGroups = new Map<
    string,
    { tokensIn: number; tokensOut: number; requests: number; count: number }
  >()

  data.forEach((item) => {
    const modelType = item.type || item.modelType || 'Unknown'
    
    if (!modelGroups.has(modelType)) {
      modelGroups.set(modelType, {
        tokensIn: 0,
        tokensOut: 0,
        requests: 0,
        count: 0,
      })
    }

    const group = modelGroups.get(modelType)!
    group.tokensIn += item.tokensIn || 0
    group.tokensOut += item.tokensOut || 0
    group.requests += item.requests || 0
    group.count++
  })

  const sortedEntries = Array.from(modelGroups.entries()).sort((a, b) => b[1].requests - a[1].requests)
  const labels = sortedEntries.map(([label]) => label)
  const tokensIn = sortedEntries.map(([, data]) => data.tokensIn)
  const tokensOut = sortedEntries.map(([, data]) => data.tokensOut)
  const requests = sortedEntries.map(([, data]) => data.requests)

  return { labels, tokensIn, tokensOut, requests }
})

        return { labels, tokensIn, tokensOut, requests }
})

// Handle Chart Period Change
const handleChartPeriodChange = (period: string) => {
  ownChartPeriod.value = period
  console.log('Chart Period changed to:', period)
}
</script>
