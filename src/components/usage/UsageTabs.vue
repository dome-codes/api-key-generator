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
        :summary="ownUsageSummary"
        :is-loading="isLoadingOwn"
        :error="ownError"
      />

      <!-- Charts and Details -->
      <div v-if="showOwnChart" class="space-y-6">
        <UsageChart
          title="Nutzungsverlauf"
          :selected-period="'daily'"
          :chart-data="ownChartData"
          chart-placeholder="Nutzungsdiagramm wird hier angezeigt"
          @update:selected-period="() => {}"
        />

        <UsageAdditionalCharts
          :usage-data="ownRawUsageData"
          :is-loading="isLoadingOwn"
          :error="ownError"
        />
      </div>

      <UsageDetailedTable
        v-if="showOwnDetails"
        :data="ownRawUsageData"
        :is-loading="isLoadingOwn"
        :error="ownError"
      />
    </div>

    <!-- Admin Tab Content -->
    <div v-if="activeTab === 'admin' && isApiAdmin" class="space-y-6">
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
        title="Admin-Nutzungsdaten"
        description="Hier sehen Sie die Nutzungsdaten aller Benutzer."
        :summary="adminUsageSummary"
        :is-loading="isLoadingAdmin"
        :error="adminError"
        :show-unique-users="true"
      />

      <!-- Charts and Details -->
      <div v-if="showAdminChart" class="space-y-6">
        <UsageChart
          title="Admin-Nutzungsverlauf"
          :selected-period="'daily'"
          :chart-data="adminChartData"
          chart-placeholder="Admin-Nutzungsdiagramm wird hier angezeigt"
          @update:selected-period="() => {}"
        />

        <UsageAdditionalCharts
          :usage-data="adminRawUsageData"
          :is-loading="isLoadingAdmin"
          :error="adminError"
        />
      </div>

      <UsageDetailedTable
        v-if="showAdminDetails"
        :data="adminRawUsageData"
        :is-loading="isLoadingAdmin"
        :error="adminError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'
import { useUsage } from '@/composables/useUsageData'
import { onMounted, ref } from 'vue'
import UsageAdditionalCharts from './UsageAdditionalCharts.vue'
import UsageChart from './UsageChart.vue'
import UsageDetailedTable from './UsageDetailedTable.vue'
import UsageFilters from './UsageFilters.vue'
import UsagePricingDisclaimer from './UsagePricingDisclaimer.vue'
import UsageSummary from './UsageSummary.vue'
import UsageViewToggle from './UsageViewToggle.vue'

const { isApiAdmin } = useAuth()

// Usage composable
const {
  // State
  ownUsageData,
  ownRawUsageData,
  isLoadingOwn,
  ownError,
  adminUsageData,
  adminRawUsageData,
  isLoadingAdmin,
  adminError,

  // Filter state
  ownTimeRange,
  ownModelType,
  ownFromDate,
  ownToDate,
  ownView,
  adminTimeRange,
  adminModelType,
  adminUser,
  adminFromDate,
  adminToDate,
  adminView,

  // Computed
  ownUsageSummary,
  adminUsageSummary,
  ownChartData,
  adminChartData,
  showOwnChart,
  showOwnDetails,
  showAdminChart,
  showAdminDetails,
  uniqueUsers,

  // Methods
  loadOwnUsageWithGrouping,
  loadAdminUsageWithGrouping,
} = useUsage()

// Tab state
const activeTab = ref<'own' | 'admin'>('own')

// Initialize on mount
onMounted(async () => {
  // Set default dates
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  ownFromDate.value = thirtyDaysAgo.toISOString().split('T')[0]
  ownToDate.value = today.toISOString().split('T')[0]

  adminFromDate.value = thirtyDaysAgo.toISOString().split('T')[0]
  adminToDate.value = today.toISOString().split('T')[0]

  // Load initial data
  await loadOwnUsageWithGrouping()
  if (isApiAdmin.value) {
    await loadAdminUsageWithGrouping()
  }
})

// Set default tab based on role
if (!isApiAdmin.value) {
  activeTab.value = 'own'
}
</script>
