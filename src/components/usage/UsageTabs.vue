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
            <label class="block text-sm font-medium text-gray-700 mb-2">Chart-Periode</label>
            <select
              v-model="ownChartPeriod"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="hourly">Stündlich</option>
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
            </select>
          </div>
        </div>

        <!-- View Toggle Buttons -->
        <div class="mt-4 flex justify-center">
          <div class="bg-gray-100 rounded-lg p-1 inline-flex">
            <button
              @click="ownView = 'overview'"
              :class="[
                ownView === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
                'px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200',
              ]"
            >
              <svg
                class="w-4 h-4 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Übersicht
            </button>
            <button
              @click="ownView = 'detailed'"
              :class="[
                ownView === 'detailed'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
                'px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200',
              ]"
            >
              <svg
                class="w-4 h-4 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              Detailliert
            </button>
          </div>
        </div>
      </div>

      <!-- Own Usage Content -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Meine Nutzungsdaten</h2>
        <p class="text-gray-600 mb-4">Hier sehen Sie Ihre persönlichen API-Nutzungsdaten.</p>

        <div v-if="isLoadingOwn" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-gray-600">Lade Daten...</p>
        </div>

        <div v-else-if="ownError" class="text-center py-8">
          <p class="text-red-600">{{ ownError }}</p>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm text-blue-600 font-medium">Tokens In</div>
            <div class="text-2xl font-bold text-blue-800">
              {{ ownUsageSummary.tokensIn.toLocaleString() }}
            </div>
          </div>

          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm text-green-600 font-medium">Tokens Out</div>
            <div class="text-2xl font-bold text-green-800">
              {{ ownUsageSummary.tokensOut.toLocaleString() }}
            </div>
          </div>

          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-sm text-purple-600 font-medium">Gesamte Anfragen</div>
            <div class="text-2xl font-bold text-purple-800">
              {{ ownUsageSummary.requests.toLocaleString() }}
            </div>
          </div>

          <div class="bg-orange-50 rounded-lg p-4">
            <div class="text-sm text-orange-600 font-medium">Geschätzte Kosten</div>
            <div class="text-2xl font-bold text-orange-800">
              {{ formatCost(ownUsageSummary.cost) }}
            </div>
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

      <!-- Additional Charts (Pie Chart, Bar Chart) -->
      <UsageAdditionalCharts
        v-if="showOwnChart"
        :usage-data="ownRawUsageData"
        :is-loading="isLoadingOwn"
        :error="ownError"
      />

      <!-- Detaillierte Tabelle -->
      <UsageDetailedTable
        v-if="showOwnDetails"
        :data="ownUsageData"
        :is-loading="isLoadingOwn"
        :error="ownError"
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
              <option v-for="user in uniqueUsers" :key="user.id" :value="user.id">
                {{ user.displayName }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Chart-Periode</label>
            <select
              v-model="adminChartPeriod"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="hourly">Stündlich</option>
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
            </select>
          </div>
        </div>

        <!-- View Toggle Buttons -->
        <div class="mt-4 flex justify-center">
          <div class="bg-gray-100 rounded-lg p-1 inline-flex">
            <button
              @click="adminView = 'overview'"
              :class="[
                adminView === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
                'px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200',
              ]"
            >
              <svg
                class="w-4 h-4 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Übersicht
            </button>
            <button
              @click="adminView = 'detailed'"
              :class="[
                adminView === 'detailed'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
                'px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200',
              ]"
            >
              <svg
                class="w-4 h-4 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              Detailliert
            </button>
          </div>
        </div>
      </div>

      <!-- Admin Usage Content -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Admin-Nutzung - Alle Konten</h2>
        <p class="text-gray-600 mb-4">Übersicht über die API-Nutzung aller Benutzer.</p>

        <div v-if="isLoadingAdmin" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-gray-600">Lade Admin-Daten...</p>
        </div>

        <div v-else-if="adminError" class="text-center py-8">
          <p class="text-red-600">{{ adminError }}</p>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm text-blue-600 font-medium">Aktive Benutzer</div>
            <div class="text-2xl font-bold text-blue-800">
              {{ adminUsageSummary.uniqueUsers || 0 }}
            </div>
          </div>

          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm text-green-600 font-medium">Tokens In</div>
            <div class="text-2xl font-bold text-green-800">
              {{ adminUsageSummary.tokensIn.toLocaleString() }}
            </div>
          </div>

          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-sm text-purple-600 font-medium">Tokens Out</div>
            <div class="text-2xl font-bold text-purple-800">
              {{ adminUsageSummary.tokensOut.toLocaleString() }}
            </div>
          </div>

          <div class="bg-orange-50 rounded-lg p-4">
            <div class="text-sm text-orange-600 font-medium">Gesamtkosten</div>
            <div class="text-2xl font-bold text-orange-800">
              {{ formatCost(adminUsageSummary.cost) }}
            </div>
          </div>

          <div class="bg-red-50 rounded-lg p-4">
            <div class="text-sm text-red-600 font-medium">Anfragen</div>
            <div class="text-2xl font-bold text-red-800">
              {{ adminUsageSummary.requests.toLocaleString() }}
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

      <!-- Additional Charts (Pie Chart, Bar Chart) for Admin -->
      <UsageAdditionalCharts
        v-if="showAdminChart"
        :usage-data="adminRawUsageData"
        :is-loading="isLoadingAdmin"
        :error="adminError"
      />

      <UsageDetailedTable
        v-if="showAdminDetails"
        :data="adminUsageData"
        :is-loading="isLoadingAdmin"
        :error="adminError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { hasPermission } from '@/auth/keycloak'
import { formatCost } from '@/config/pricing'
import { usageService } from '@/services/apiService'
import { computed, onMounted, ref, watch } from 'vue'
import UsageAdditionalCharts from './UsageAdditionalCharts.vue'
import UsageChart from './UsageChart.vue'
import UsageDetailedTable from './UsageDetailedTable.vue'
import UsagePricingDisclaimer from './UsagePricingDisclaimer.vue'

const activeTab = ref('own')

// Prüfe ob Benutzer API-Admin ist
const isApiAdmin = computed(() => hasPermission('canViewAdminUsage'))

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

// API-basierte Daten
const ownUsageData = ref<any[]>([])
const ownRawUsageData = ref<any[]>([]) // Rohdaten für zusätzliche Charts
const adminUsageData = ref<any[]>([])
const adminRawUsageData = ref<any[]>([]) // Rohdaten für zusätzliche Charts
const isLoadingOwn = ref(false)
const isLoadingAdmin = ref(false)
const ownError = ref<string | null>(null)
const adminError = ref<string | null>(null)

// API-basierte Funktionen
const loadOwnUsageWithGrouping = async () => {
  try {
    isLoadingOwn.value = true
    ownError.value = null

    // Bestimme Gruppierung basierend auf Chart-Periode und View
    let grouping:
      | 'day'
      | 'week'
      | 'month'
      | 'user'
      | 'model'
      | 'apikey'
      | 'tag'
      | ('day' | 'week' | 'month' | 'user' | 'model' | 'apikey' | 'tag')[]
      | string
      | undefined = undefined

    // Nur gruppieren wenn wir Diagramme anzeigen wollen
    if (ownView.value === 'overview') {
      if (ownChartPeriod.value === 'hourly') {
        grouping = 'hour'
      } else if (ownChartPeriod.value === 'weekly') {
        grouping = 'week'
      } else if (ownChartPeriod.value === 'monthly') {
        grouping = 'month'
      } else if (ownChartPeriod.value === 'yearly') {
        grouping = 'month' // Verwende 'month' für jährliche Ansicht
      } else {
        // Täglich: Verwende mehrere Gruppierungen für vollständige Datumsinformation
        grouping = 'day,month'
      }
    }
    // Für 'detailed' view keine Gruppierung - zeige Rohdaten

    // Berechne Datumswerte
    const { fromDate, toDate } = calculateDateRange(
      ownTimeRange.value,
      ownFromDate.value,
      ownToDate.value,
    )

    console.log('🔍 [USAGE-TABS] Loading own usage with params:', {
      grouping,
      fromDate,
      toDate,
      model: ownModelType.value,
      view: ownView.value,
    })

    // Lade gruppierte Daten für Hauptdiagramm
    const response = await usageService.getUsageSummaryWithGrouping(
      grouping,
      fromDate,
      toDate,
      ownModelType.value || undefined,
    )

    ownUsageData.value = response.usage || []

    // Lade zusätzlich Rohdaten für zusätzliche Charts (nur in Overview)
    if (ownView.value === 'overview') {
      try {
        const rawResponse = await usageService.getUsageSummaryWithGrouping(
          undefined, // Keine Gruppierung für Rohdaten
          fromDate,
          toDate,
          ownModelType.value || undefined,
        )
        ownRawUsageData.value = rawResponse.usage || []
      } catch (rawError) {
        console.warn('🔍 [USAGE-TABS] Could not load raw data for additional charts:', rawError)
        ownRawUsageData.value = []
      }
    } else {
      ownRawUsageData.value = ownUsageData.value // Verwende gruppierte Daten als Fallback
    }

    console.log(
      '🔍 [USAGE-TABS] Own usage data loaded:',
      grouping,
      ownUsageData.value.length,
      'records',
      'Raw data:',
      ownRawUsageData.value.length,
      'records',
    )
  } catch (error) {
    console.error('🔍 [USAGE-TABS] Error loading own usage data:', error)
    ownError.value = 'Fehler beim Laden der Nutzungsdaten'
    ownUsageData.value = []
    ownRawUsageData.value = []
  } finally {
    isLoadingOwn.value = false
  }
}

const loadAdminUsageWithGrouping = async () => {
  try {
    isLoadingAdmin.value = true
    adminError.value = null

    // Bestimme Gruppierung basierend auf Chart-Periode und View
    let grouping:
      | 'day'
      | 'week'
      | 'month'
      | 'user'
      | 'model'
      | 'apikey'
      | 'tag'
      | ('day' | 'week' | 'month' | 'user' | 'model' | 'apikey' | 'tag')[]
      | string
      | undefined = undefined

    // Nur gruppieren wenn wir Diagramme anzeigen wollen
    if (adminView.value === 'overview') {
      if (adminChartPeriod.value === 'hourly') {
        grouping = 'hour'
      } else if (adminChartPeriod.value === 'weekly') {
        grouping = 'week'
      } else if (adminChartPeriod.value === 'monthly') {
        grouping = 'month'
      } else if (adminChartPeriod.value === 'yearly') {
        grouping = 'month' // Verwende 'month' für jährliche Ansicht
      } else {
        // Täglich: Verwende mehrere Gruppierungen für vollständige Datumsinformation
        grouping = 'day,month'
      }
    }
    // Für 'detailed' view keine Gruppierung - zeige Rohdaten

    // Berechne Datumswerte
    const { fromDate, toDate } = calculateDateRange(
      adminTimeRange.value,
      adminFromDate.value,
      adminToDate.value,
    )

    // Lade gruppierte Daten für Hauptdiagramm
    const response = await usageService.getAdminUsageSummaryWithGrouping(
      grouping,
      fromDate,
      toDate,
      adminModelType.value || undefined,
      adminUser.value || undefined,
    )

    adminUsageData.value = response.usage || []

    // Lade zusätzlich Rohdaten für zusätzliche Charts (nur in Overview)
    if (adminView.value === 'overview') {
      try {
        const rawResponse = await usageService.getAdminUsageSummaryWithGrouping(
          undefined, // Keine Gruppierung für Rohdaten
          fromDate,
          toDate,
          adminModelType.value || undefined,
          adminUser.value || undefined,
        )
        adminRawUsageData.value = rawResponse.usage || []
      } catch (rawError) {
        console.warn('🔍 [USAGE-TABS] Could not load raw data for additional charts:', rawError)
        adminRawUsageData.value = []
      }
    } else {
      adminRawUsageData.value = adminUsageData.value // Verwende gruppierte Daten als Fallback
    }

    console.log(
      '🔍 [USAGE-TABS] Admin usage data loaded:',
      grouping,
      adminUsageData.value.length,
      'records',
      'Raw data:',
      adminRawUsageData.value.length,
      'records',
    )
  } catch (error) {
    console.error('🔍 [USAGE-TABS] Error loading admin usage data:', error)
    adminError.value = 'Fehler beim Laden der Admin-Nutzungsdaten'
    adminUsageData.value = []
    adminRawUsageData.value = []
  } finally {
    isLoadingAdmin.value = false
  }
}

// Hilfsfunktion zur Berechnung des Datumsbereichs
const calculateDateRange = (timeRange: string, fromDate: string, toDate: string) => {
  if (timeRange === 'custom' && fromDate && toDate) {
    return { fromDate, toDate }
  }

  const today = new Date()
  let startDate: Date

  switch (timeRange) {
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
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      break
    default:
      startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  return {
    fromDate: startDate.toISOString(),
    toDate: today.toISOString(),
  }
}

// Computed properties für gefilterte Daten - EINFACH UND API-BASIERT
const ownUsageSummary = computed(() => {
  if (!ownUsageData.value || ownUsageData.value.length === 0) {
    return {
      tokensIn: 0,
      tokensOut: 0,
      requests: 0,
      cost: 0,
    }
  }

  return ownUsageData.value.reduce(
    (acc, item) => {
      acc.tokensIn += item.tokensIn || 0
      acc.tokensOut += item.tokensOut || 0
      acc.requests += item.requests || 1 // Verwende tatsächliche Anzahl
      acc.cost += item.cost || 0
      return acc
    },
    { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0 },
  )
})

const adminUsageSummary = computed(() => {
  if (!adminUsageData.value || adminUsageData.value.length === 0) {
    return {
      tokensIn: 0,
      tokensOut: 0,
      requests: 0,
      cost: 0,
      uniqueUsers: 0,
    }
  }

  const summary = adminUsageData.value.reduce(
    (acc, item) => {
      acc.tokensIn += item.tokensIn || 0
      acc.tokensOut += item.tokensOut || 0
      acc.requests += item.requests || 1 // Verwende tatsächliche Anzahl
      acc.cost += item.cost || 0
      return acc
    },
    { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0, uniqueUsers: 0 },
  )

  // Berechne eindeutige Benutzer
  const uniqueUsers = new Set(adminUsageData.value.map((item) => item.technicalUserId)).size
  summary.uniqueUsers = uniqueUsers

  return summary
})

// Einfache Chart-Daten - Backend macht die Gruppierung
const ownChartData = computed(() => {
  if (!ownUsageData.value || ownUsageData.value.length === 0) {
    return { labels: [], tokensIn: [], tokensOut: [], requests: [] }
  }

  // Erstelle Labels basierend auf Chart-Periode
  const labels = generateChartLabels(ownChartPeriod.value, ownUsageData.value)
  const tokensIn = ownUsageData.value.map((item) => item.tokensIn || 0)
  const tokensOut = ownUsageData.value.map((item) => item.tokensOut || 0)
  const requests = ownUsageData.value.map((item) => item.requests || 1) // Verwende tatsächliche Anzahl

  return { labels, tokensIn, tokensOut, requests }
})

const adminChartData = computed(() => {
  if (!adminUsageData.value || adminUsageData.value.length === 0) {
    return { labels: [], tokensIn: [], tokensOut: [], requests: [] }
  }

  // Erstelle Labels basierend auf Chart-Periode
  const labels = generateChartLabels(adminChartPeriod.value, adminUsageData.value)
  const tokensIn = adminUsageData.value.map((item) => item.tokensIn || 0)
  const tokensOut = adminUsageData.value.map((item) => item.tokensOut || 0)
  const requests = adminUsageData.value.map((item) => item.requests || 1) // Verwende tatsächliche Anzahl

  return { labels, tokensIn, tokensOut, requests }
})

// Hilfsfunktion zur Generierung von Chart-Labels basierend auf Periode
const generateChartLabels = (period: string, data: any[]) => {
  if (period === 'hourly') {
    // Stündlich: 0:00-24:00 Uhr
    return Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
  } else if (period === 'daily') {
    // Täglich: Mo, Di, Mi, Do, Fr, Sa, So
    const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    return weekdays
  } else if (period === 'weekly') {
    // Wöchentlich: Woche 1, Woche 2, etc.
    return data.map((_, index) => `Woche ${index + 1}`)
  } else if (period === 'monthly') {
    // Monatlich: Jan, Feb, Mar, etc.
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun',
      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
    ]
    return data.map((_, index) => months[index % 12])
  } else {
    // Fallback: Verwende createDate falls verfügbar
    return data.map((item) => {
      if (item.createDate) {
        return new Date(item.createDate).toLocaleDateString('de-DE')
      } else if (item.year && item.month && item.day) {
        return new Date(item.year, item.month - 1, item.day).toLocaleDateString('de-DE')
      } else if (item.year && item.month) {
        return new Date(item.year, item.month - 1, 1).toLocaleDateString('de-DE', {
          month: 'short',
          year: 'numeric',
        })
      } else if (item.year) {
        return new Date(item.year, 0, 1).toLocaleDateString('de-DE', { year: 'numeric' })
      }
      return 'Unknown'
    })
  }
}

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

// Computed property für eindeutige Benutzer (für Admin-Filter)
const uniqueUsers = computed(() => {
  if (!adminUsageData.value || adminUsageData.value.length === 0) {
    return []
  }

  // Extrahiere eindeutige Benutzer aus den Admin-Usage-Daten
  const userMap = new Map<string, string>()

  adminUsageData.value.forEach((item) => {
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

// Einfache Watcher für Filter-Änderungen - API-basiert
watch([ownTimeRange, ownModelType, ownChartPeriod, ownView], async () => {
  await loadOwnUsageWithGrouping()
})

watch([adminTimeRange, adminModelType, adminUser, adminChartPeriod, adminView], async () => {
  await loadAdminUsageWithGrouping()
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

// Initialisiere beim Mounten
onMounted(async () => {
  // Setze Standard-Daten
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  ownFromDate.value = thirtyDaysAgo.toISOString()
  ownToDate.value = today.toISOString()

  adminFromDate.value = thirtyDaysAgo.toISOString()
  adminToDate.value = today.toISOString()

  // Lade initiale Daten
  await loadOwnUsageWithGrouping()
  if (isApiAdmin.value) {
    await loadAdminUsageWithGrouping()
  }
})

// Setze Standard-Tab basierend auf Rolle
if (!isApiAdmin.value) {
  activeTab.value = 'own'
}
</script>
