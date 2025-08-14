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

        <button
          v-if="isApiAdmin"
          @click="activeTab = 'detailed'"
          :class="[
            activeTab === 'detailed'
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
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          Detaillierte Übersicht
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div v-if="activeTab === 'own'" class="space-y-6">
      <!-- Pricing Disclaimer -->
      <UsagePricingDisclaimer />

      <!-- Filter Section -->
      <div class="bg-white rounded-xl shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Filter & Zeitraum</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
            <select
              v-model="ownTimeRange"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="7d">Letzte 7 Tage</option>
              <option value="30d">Letzte 30 Tage</option>
              <option value="90d">Letzte 90 Tage</option>
              <option value="thisMonth">Diesen Monat</option>
              <option value="lastMonth">Vormonat</option>
              <option value="custom">Benutzerdefiniert</option>
            </select>
            <!-- Custom Date Range (nur sichtbar wenn "Benutzerdefiniert" ausgewählt) -->
            <div v-if="ownTimeRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Von</label>
                <input
                  v-model="ownFromDate"
                  type="date"
                  class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Bis</label>
                <input
                  v-model="ownToDate"
                  type="date"
                  class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Modelltyp</label>
            <select
              v-model="ownModelType"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="">Alle Modelltypen</option>
              <option value="CompletionModelUsage">Chat Completions</option>
              <option value="EmbeddingModelUsage">Embeddings</option>
              <option value="ImageModelUsage">Bilder</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ansicht</label>
            <select
              v-model="ownView"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="overview">Übersicht</option>
              <option value="chart">Chart-Ansicht</option>
              <option value="detailed">Detailliert</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Own Usage Content -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Meine Nutzungsdaten</h2>
        <p class="text-gray-600 mb-4">Hier sehen Sie Ihre persönlichen API-Nutzungsdaten.</p>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm text-blue-600 font-medium">Tokens In</div>
            <div class="text-2xl font-bold text-blue-800">
              {{ filteredOwnUsage.tokensIn.toLocaleString() }}
            </div>
            <div
              v-if="ownTimeRange === 'thisMonth' || ownTimeRange === 'lastMonth'"
              class="text-xs text-blue-600 mt-1"
            >
              +12% vs. letzter Monat
            </div>
          </div>

          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm text-green-600 font-medium">Tokens Out</div>
            <div class="text-2xl font-bold text-green-800">
              {{ filteredOwnUsage.tokensOut.toLocaleString() }}
            </div>
            <div
              v-if="ownTimeRange === 'thisMonth' || ownTimeRange === 'lastMonth'"
              class="text-xs text-green-600 mt-1"
            >
              +8% vs. letzter Monat
            </div>
          </div>

          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-sm text-purple-600 font-medium">Gesamte Anfragen</div>
            <div class="text-2xl font-bold text-purple-800">
              {{ filteredOwnUsage.requests.toLocaleString() }}
            </div>
            <div
              v-if="ownTimeRange === 'thisMonth' || ownTimeRange === 'lastMonth'"
              class="text-xs text-purple-600 mt-1"
            >
              +15% vs. letzter Monat
            </div>
          </div>

          <div class="bg-orange-50 rounded-lg p-4">
            <div class="text-sm text-orange-600 font-medium">Geschätzte Kosten</div>
            <div class="text-2xl font-bold text-orange-800">
              {{ formatCost(filteredOwnUsage.cost) }}
            </div>
            <div
              v-if="ownTimeRange === 'thisMonth' || ownTimeRange === 'lastMonth'"
              class="text-xs text-orange-600 mt-1"
            >
              +10% vs. letzter Monat
            </div>
            <div v-else class="text-xs text-orange-600 mt-1">Basierend auf aktuellen Preisen</div>
          </div>
        </div>
      </div>

      <!-- Usage Chart -->
      <UsageChart
        v-if="showOwnChart"
        title="Nutzungsverlauf"
        :selected-period="ownChartPeriod"
        :chart-data="ownChartData"
        chart-placeholder="Nutzungsdiagramm wird hier angezeigt"
        @update:selected-period="handleChartPeriodChange"
      />

      <!-- Zusätzliche Charts -->
      <UsageAdditionalCharts v-if="showOwnChart" :usage-data="detailedUsageData || []" />

      <UsageDetailedTable
        v-if="showOwnDetails"
        :data="filteredUsageData || []"
        :is-loading="isLoading || false"
        :error="error || null"
      />
    </div>

    <div v-else-if="activeTab === 'admin'" class="space-y-6">
      <!-- Pricing Disclaimer -->
      <UsagePricingDisclaimer />

      <!-- Filter Section -->
      <div class="bg-white rounded-xl shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Filter & Zeitraum</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
            <select
              v-model="adminTimeRange"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="7d">Letzte 7 Tage</option>
              <option value="30d">Letzte 30 Tage</option>
              <option value="90d">Letzte 90 Tage</option>
              <option value="thisMonth">Diesen Monat</option>
              <option value="lastMonth">Vormonat</option>
              <option value="custom">Benutzerdefiniert</option>
            </select>
            <!-- Custom Date Range (nur sichtbar wenn "Benutzerdefiniert" ausgewählt) -->
            <div v-if="adminTimeRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Von</label>
                <input
                  v-model="adminFromDate"
                  type="date"
                  class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Bis</label>
                <input
                  v-model="adminToDate"
                  type="date"
                  class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Modelltyp</label>
            <select
              v-model="adminModelType"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="">Alle Modelltypen</option>
              <option value="CompletionModelUsage">Chat Completions</option>
              <option value="EmbeddingModelUsage">Embeddings</option>
              <option value="ImageModelUsage">Bilder</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Benutzer</label>
            <select
              v-model="adminUser"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="">Alle Benutzer</option>
              <option value="user-123">user-123 (Domenic)</option>
              <option value="user-456">user-456 (John)</option>
              <option value="user-789">user-789 (Maria)</option>
              <option value="user-101">user-101 (Alex)</option>
              <option value="user-202">user-202 (Sarah)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ansicht</label>
            <select
              v-model="adminView"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="overview">Übersicht</option>
              <option value="chart">Chart-Ansicht</option>
              <option value="detailed">Detailliert</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Admin Usage Content -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Admin-Nutzung - Alle Konten</h2>
        <p class="text-gray-600 mb-4">Übersicht über die API-Nutzung aller Benutzer.</p>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm text-blue-600 font-medium">Aktive Benutzer</div>
            <div class="text-2xl font-bold text-blue-800">
              {{ filteredAdminUsage.uniqueUsers || 0 }}
            </div>
            <div
              v-if="adminTimeRange === 'thisMonth' || adminTimeRange === 'lastMonth'"
              class="text-xs text-blue-600 mt-1"
            >
              +3 neue diesen Monat
            </div>
          </div>

          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm text-green-600 font-medium">Tokens In</div>
            <div class="text-2xl font-bold text-green-800">
              {{ filteredAdminUsage.tokensIn.toLocaleString() }}
            </div>
            <div
              v-if="adminTimeRange === 'thisMonth' || adminTimeRange === 'lastMonth'"
              class="text-xs text-green-600 mt-1"
            >
              +18% vs. letzter Monat
            </div>
          </div>

          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-sm text-purple-600 font-medium">Tokens Out</div>
            <div class="text-2xl font-bold text-purple-800">
              {{ filteredAdminUsage.tokensOut.toLocaleString() }}
            </div>
            <div
              v-if="adminTimeRange === 'thisMonth' || adminTimeRange === 'lastMonth'"
              class="text-xs text-purple-600 mt-1"
            >
              +15% vs. letzter Monat
            </div>
          </div>

          <div class="bg-orange-50 rounded-lg p-4">
            <div class="text-sm text-orange-600 font-medium">Gesamtkosten</div>
            <div class="text-2xl font-bold text-orange-800">
              {{ formatCost(filteredAdminUsage.cost) }}
            </div>
            <div
              v-if="adminTimeRange === 'thisMonth' || adminTimeRange === 'lastMonth'"
              class="text-xs text-orange-600 mt-1"
            >
              +22% vs. letzter Monat
            </div>
          </div>

          <div class="bg-red-50 rounded-lg p-4">
            <div class="text-sm text-red-600 font-medium">Anfragen</div>
            <div class="text-2xl font-bold text-red-800">
              {{ filteredAdminUsage.requests.toLocaleString() }}
            </div>
            <div
              v-if="adminTimeRange === 'thisMonth' || adminTimeRange === 'lastMonth'"
              class="text-xs text-red-600 mt-1"
            >
              +20% vs. letzter Monat
            </div>
          </div>
        </div>
      </div>

      <!-- Admin Usage Chart -->
      <UsageChart
        v-if="showAdminChart"
        title="Admin-Nutzungsverlauf"
        :selected-period="adminChartPeriod"
        :chart-data="adminChartData"
        chart-placeholder="Admin-Nutzungsdiagramm wird hier angezeigt"
        @update:selected-period="handleAdminChartPeriodChange"
      />

      <!-- Zusätzliche Charts -->
      <UsageAdditionalCharts v-if="showAdminChart" :usage-data="detailedUsageData || []" />

      <UsageDetailedTable
        v-if="showAdminDetails"
        :data="filteredUsageData || []"
        :is-loading="isLoading || false"
        :error="error || null"
      />
    </div>

    <div v-else-if="activeTab === 'detailed'" class="space-y-6">
      <!-- Pricing Disclaimer -->
      <UsagePricingDisclaimer />

      <!-- Detaillierte Nutzungsübersicht -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Detaillierte Nutzungsübersicht</h2>
        <p class="text-gray-600 mb-4">
          Hier sehen Sie eine detaillierte Aufschlüsselung der API-Nutzung nach technischen Nutzern,
          Modellen und Zeiträumen.
        </p>

        <!-- Aggregation Cards -->
        <div v-if="usageAggregation" class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm text-blue-600 font-medium">Gesamte Anfragen</div>
            <div class="text-2xl font-bold text-blue-800">
              {{ usageAggregation.totalRequests.toLocaleString() }}
            </div>
          </div>

          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm text-green-600 font-medium">Tokens In</div>
            <div class="text-2xl font-bold text-green-800">
              {{ usageAggregation.totalTokensIn.toLocaleString() }}
            </div>
          </div>

          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-sm text-purple-600 font-medium">Tokens Out</div>
            <div class="text-2xl font-bold text-purple-800">
              {{ usageAggregation.totalTokensOut.toLocaleString() }}
            </div>
          </div>

          <div class="bg-orange-50 rounded-lg p-4">
            <div class="text-sm text-orange-600 font-medium">Gesamt Tokens</div>
            <div class="text-2xl font-bold text-orange-800">
              {{ usageAggregation.totalTokens.toLocaleString() }}
            </div>
          </div>
        </div>

        <!-- Additional Stats -->
        <div v-if="usageAggregation" class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-600 font-medium">Eindeutige Nutzer</div>
            <div class="text-xl font-bold text-gray-800">{{ usageAggregation.uniqueUsers }}</div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-600 font-medium">Eindeutige Modelle</div>
            <div class="text-xl font-bold text-gray-800">{{ usageAggregation.uniqueModels }}</div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-600 font-medium">Ø Tokens/Anfrage</div>
            <div class="text-xl font-bold text-gray-800">
              {{ usageAggregation.averageTokensPerRequest.toFixed(1) }}
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-600 font-medium">Gesamtkosten</div>
            <div class="text-xl font-bold text-gray-800">
              {{ formatCost(usageAggregation.totalCost) }}
            </div>
          </div>
        </div>

        <!-- Top Users und Models -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Top Users -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Top 5 Nutzer</h4>
            <div class="space-y-2">
              <div
                v-for="user in topUsers.slice(0, 5)"
                :key="user.technicalUserId"
                class="flex items-center justify-between text-sm"
              >
                <div>
                  <span class="text-gray-900">{{ user.technicalUserName }}</span>
                  <div class="text-xs text-gray-500">
                    {{ user.totalTokens.toLocaleString() }} Tokens
                  </div>
                </div>
                <span class="text-gray-600"
                  >{{ user.totalRequests.toLocaleString() }} Anfragen</span
                >
              </div>
            </div>
          </div>

          <!-- Top Models -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Top 5 Modelle</h4>
            <div class="space-y-4">
              <div
                v-for="model in topModels.slice(0, 5)"
                :key="model.modelName"
                class="flex items-center justify-between text-sm"
              >
                <div>
                  <span class="text-gray-900">{{ model.modelName }}</span>
                  <div class="text-xs text-gray-500">
                    {{ model.totalTokens.toLocaleString() }} Tokens
                  </div>
                </div>
                <span class="text-gray-600"
                  >{{ model.totalRequests.toLocaleString() }} Anfragen</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detaillierte Tabelle -->
      <UsageDetailedTable :data="filteredUsageData" :is-loading="isLoading" :error="error" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { hasPermission } from '@/auth/keycloak'
import { useUsage } from '@/composables/useUsage'
import { calculateExampleCosts, formatCost } from '@/config/pricing'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import UsageAdditionalCharts from './UsageAdditionalCharts.vue'
import UsageChart from './UsageChart.vue'
import UsageDetailedTable from './UsageDetailedTable.vue'
import UsagePricingDisclaimer from './UsagePricingDisclaimer.vue'

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
} = useUsage()

// Filter State
const ownTimeRange = ref('30d')
const ownModelType = ref('')
const ownView = ref('overview')
const ownChartPeriod = ref('daily')
const ownFromDate = ref('')
const ownToDate = ref('')

const adminTimeRange = ref('30d')
const adminModelType = ref('')
const adminUser = ref('')
const adminView = ref('overview')
const adminChartPeriod = ref('daily')
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

  // Lade Daten mit den korrekten Parametern
  await loadDetailedUsageData({
    fromDate,
    toDate,
  })
})

// Computed properties für gefilterte Daten
const filteredOwnUsage = computed(() => {
  if (!detailedUsageData.value || detailedUsageData.value.length === 0) {
    return {
      tokensIn: 0,
      tokensOut: 0,
      requests: 0,
      cost: 0,
    }
  }

  // Filtere nach Modelltyp falls ausgewählt
  let filteredData = detailedUsageData.value
  if (ownModelType.value) {
    filteredData = detailedUsageData.value.filter((item) => item.modelType === ownModelType.value)
  }

  // Berechne aggregierte Werte
  const aggregatedData = filteredData.reduce(
    (acc, item) => {
      acc.tokensIn += item.tokensIn || 0
      acc.tokensOut += item.tokensOut || 0
      acc.requests += item.requests || 0
      acc.cost += item.cost || 0
      return acc
    },
    { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0 },
  )

  return aggregatedData
})

const filteredAdminUsage = computed(() => {
  if (!detailedUsageData.value || detailedUsageData.value.length === 0) {
    return {
      tokensIn: 0,
      tokensOut: 0,
      requests: 0,
      cost: 0,
      uniqueUsers: 0,
    }
  }

  // Filtere nach Modelltyp falls ausgewählt
  let filteredData = detailedUsageData.value
  if (adminModelType.value) {
    filteredData = detailedUsageData.value.filter((item) => item.modelType === adminModelType.value)
  }

  // Berechne aggregierte Werte
  const aggregatedData = filteredData.reduce(
    (acc, item) => {
      acc.tokensIn += item.tokensIn || 0
      acc.tokensOut += item.tokensOut || 0
      acc.requests += item.requests || 0
      acc.cost += item.cost || 0
      return acc
    },
    { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0, uniqueUsers: 0 },
  )

  // Berechne eindeutige Benutzer
  const uniqueUsers = new Set(filteredData.map((item) => item.technicalUserId)).size
  aggregatedData.uniqueUsers = uniqueUsers

  return aggregatedData
})

// Computed properties für die Anzeige basierend auf Ansicht
const showOwnChart = computed(() => {
  return ownView.value === 'overview' || ownView.value === 'chart'
})

const showOwnDetails = computed(() => {
  return ownView.value === 'detailed'
})

const showAdminChart = computed(() => {
  return adminView.value === 'overview' || adminView.value === 'chart'
})

const showAdminDetails = computed(() => {
  return adminView.value === 'detailed'
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

const adminChartPeriodFromFilter = computed(() => {
  if (adminTimeRange.value === '7d') return 'daily'
  if (adminTimeRange.value === '30d') return 'weekly'
  if (adminTimeRange.value === '90d') return 'monthly'
  if (adminTimeRange.value === 'thisMonth') return 'daily'
  if (adminTimeRange.value === 'lastMonth') return 'daily'
  if (adminTimeRange.value === 'custom' && adminFromDate.value && adminToDate.value) {
    // Berechne Tage für benutzerdefinierte Zeiträume
    const fromDate = new Date(adminFromDate.value)
    const toDate = new Date(adminToDate.value)
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

// Watch für Änderungen der Admin Chart-Periode
watch(adminChartPeriodFromFilter, (newPeriod) => {
  adminChartPeriod.value = newPeriod
})

// Watch für manuelle Änderungen der Chart-Periode
watch(ownChartPeriod, (newPeriod) => {
  console.log('Own chart period manually changed to:', newPeriod)
})

// Watch für manuelle Änderungen der Admin Chart-Periode
watch(adminChartPeriod, (newPeriod) => {
  console.log('Admin chart period manually changed to:', newPeriod)
})

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
  }

  console.log('Filter geändert - Neue Chart-Periode:', ownChartPeriod.value)
  console.log('Aktuelle Filter:', {
    timeRange: ownTimeRange.value,
    modelType: ownModelType.value,
    view: ownView.value,
    fromDate,
    toDate,
  })
})

// Zusätzlicher Watch für modelType-Änderungen - Charts neu rendern
watch(ownModelType, () => {
  console.log('ModelType geändert zu:', ownModelType.value)
  // Force re-computation der Chart-Daten
  nextTick(() => {
    console.log('Chart-Daten neu berechnet für ModelType:', ownModelType.value)
  })
})

// Zusätzlicher Watch für adminModelType-Änderungen
watch(adminModelType, () => {
  console.log('Admin ModelType geändert zu:', adminModelType.value)
  // Force re-computation der Admin Chart-Daten
  nextTick(() => {
    console.log('Admin Chart-Daten neu berechnet für ModelType:', adminModelType.value)
  })
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
    }

    console.log('Admin-Filter geändert - Neue Chart-Periode:', adminChartPeriod.value)
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

  if (!detailedUsageData.value || detailedUsageData.value.length === 0) {
    // Keine Daten verfügbar - leere Chart-Daten zurückgeben
    return {
      labels: [],
      tokensIn: [],
      tokensOut: [],
      requests: [],
    }
  }

  // Gruppiere Daten basierend auf der ausgewählten Periode
  let sortedData = detailedUsageData.value
    .filter((item) => item.createDate || (item.day && item.month && item.year))
    // Filtere nach Modelltyp falls ausgewählt
    .filter((item) => {
      if (!modelType) return true // Alle Modelltypen anzeigen
      return item.modelType === modelType
    })

  const period = chartPeriod

  // Sortiere die Daten nach Datum
  sortedData = sortedData.sort((a, b) => {
    // Verwende createDate falls verfügbar, sonst day/month/year
    if (a.createDate && b.createDate) {
      return new Date(a.createDate).getTime() - new Date(b.createDate).getTime()
    }
    if (a.day && a.month && a.year && b.day && b.month && b.year) {
      const dateA = new Date(a.year, a.month - 1, a.day)
      const dateB = new Date(b.year, b.month - 1, b.day)
      return dateA.getTime() - dateB.getTime()
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
  // Verwende die gleichen Daten wie ownChartData für Admin
  return ownChartData.value
})

// Handle Chart Period Change
const handleChartPeriodChange = (period: string) => {
  ownChartPeriod.value = period
  console.log('Chart Period changed to:', period)
}

const handleAdminChartPeriodChange = (period: string) => {
  adminChartPeriod.value = period
  console.log('Admin Chart Period changed to:', period)
}
</script>
