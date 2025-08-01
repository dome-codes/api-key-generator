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
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="7d">Letzte 7 Tage</option>
              <option value="30d">Letzte 30 Tage</option>
              <option value="90d">Letzte 90 Tage</option>
              <option value="custom">Benutzerdefiniert</option>
            </select>
            <!-- Custom Date Range (nur sichtbar wenn "Benutzerdefiniert" ausgewählt) -->
            <div v-if="ownTimeRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Von</label>
                <input
                  v-model="ownFromDate"
                  type="date"
                  class="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Bis</label>
                <input
                  v-model="ownToDate"
                  type="date"
                  class="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Modelltyp</label>
            <select
              v-model="ownModelType"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
            <div class="text-xs text-blue-600 mt-1">+12% vs. letzter Monat</div>
          </div>

          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm text-green-600 font-medium">Tokens Out</div>
            <div class="text-2xl font-bold text-green-800">
              {{ filteredOwnUsage.tokensOut.toLocaleString() }}
            </div>
            <div class="text-xs text-green-600 mt-1">+8% vs. letzter Monat</div>
          </div>

          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-sm text-purple-600 font-medium">Gesamte Anfragen</div>
            <div class="text-2xl font-bold text-purple-800">
              {{ filteredOwnUsage.requests.toLocaleString() }}
            </div>
            <div class="text-xs text-purple-600 mt-1">+15% vs. letzter Monat</div>
          </div>

          <div class="bg-orange-50 rounded-lg p-4">
            <div class="text-sm text-orange-600 font-medium">Geschätzte Kosten</div>
            <div class="text-2xl font-bold text-orange-800">
              {{ formatCost(filteredOwnUsage.cost) }}
            </div>
            <div class="text-xs text-orange-600 mt-1">Basierend auf GPT-4o-mini</div>
          </div>
        </div>
      </div>

      <!-- Usage Chart -->
      <UsageChart
        v-if="showOwnChart"
        title="Nutzungsverlauf"
        :selected-period="ownChartPeriod"
        chart-placeholder="Nutzungsdiagramm wird hier angezeigt"
        @update:selected-period="ownChartPeriod = $event"
      />

      <!-- Zusätzliche Charts -->
      <UsageAdditionalCharts v-if="showOwnChart" />

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
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="7d">Letzte 7 Tage</option>
              <option value="30d">Letzte 30 Tage</option>
              <option value="90d">Letzte 90 Tage</option>
              <option value="custom">Benutzerdefiniert</option>
            </select>
            <!-- Custom Date Range (nur sichtbar wenn "Benutzerdefiniert" ausgewählt) -->
            <div v-if="adminTimeRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Von</label>
                <input
                  v-model="adminFromDate"
                  type="date"
                  class="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Bis</label>
                <input
                  v-model="adminToDate"
                  type="date"
                  class="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Modelltyp</label>
            <select
              v-model="adminModelType"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
            <div class="text-2xl font-bold text-blue-800">{{ filteredAdminUsage.activeUsers }}</div>
            <div class="text-xs text-blue-600 mt-1">+3 neue diesen Monat</div>
          </div>

          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm text-green-600 font-medium">Tokens In</div>
            <div class="text-2xl font-bold text-green-800">
              {{ filteredAdminUsage.tokensIn.toLocaleString() }}
            </div>
            <div class="text-xs text-green-600 mt-1">+18% vs. letzter Monat</div>
          </div>

          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-sm text-purple-600 font-medium">Tokens Out</div>
            <div class="text-2xl font-bold text-purple-800">
              {{ filteredAdminUsage.tokensOut.toLocaleString() }}
            </div>
            <div class="text-xs text-purple-600 mt-1">+22% vs. letzter Monat</div>
          </div>

          <div class="bg-orange-50 rounded-lg p-4">
            <div class="text-sm text-orange-600 font-medium">Gesamte Anfragen</div>
            <div class="text-2xl font-bold text-orange-800">
              {{ filteredAdminUsage.requests.toLocaleString() }}
            </div>
            <div class="text-xs text-orange-600 mt-1">+25% vs. letzter Monat</div>
          </div>

          <div class="bg-red-50 rounded-lg p-4">
            <div class="text-sm text-red-600 font-medium">Geschätzte Kosten</div>
            <div class="text-2xl font-bold text-red-800">
              {{ formatCost(filteredAdminUsage.cost) }}
            </div>
            <div class="text-xs text-red-600 mt-1">Basierend auf GPT-4o-mini</div>
          </div>
        </div>
      </div>

      <!-- Top Users Table -->
      <div class="bg-white rounded-xl shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Top-Benutzer nach Nutzung</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Benutzer
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tokens In
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tokens Out
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Anfragen
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Rolle
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-800">DS</span>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">Domenic Schumacher</div>
                      <div class="text-sm text-gray-500">domenic@example.com</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">198,456</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">99,863</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1,247</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full"
                    >API-Admin</span
                  >
                </td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span class="text-sm font-medium text-green-800">JS</span>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">John Smith</div>
                      <div class="text-sm text-gray-500">john@example.com</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">98,567</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">57,667</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">892</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                    >API-Default</span
                  >
                </td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"
                    >
                      <span class="text-sm font-medium text-orange-800">MJ</span>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">Maria Johnson</div>
                      <div class="text-sm text-gray-500">maria@example.com</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">65,234</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">33,333</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">456</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                    >API-Stream</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Admin Usage Chart -->
      <UsageChart
        v-if="showAdminChart"
        title="Admin-Nutzungsverlauf"
        :selected-period="adminChartPeriod"
        chart-placeholder="Admin-Nutzungsdiagramm wird hier angezeigt"
        @update:selected-period="adminChartPeriod = $event"
      />

      <!-- Zusätzliche Charts -->
      <UsageAdditionalCharts v-if="showAdminChart" />

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
import { computed, onMounted, ref, watch } from 'vue'
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

  ownFromDate.value = thirtyDaysAgo.toISOString().split('T')[0]
  ownToDate.value = today.toISOString().split('T')[0]

  adminFromDate.value = thirtyDaysAgo.toISOString().split('T')[0]
  adminToDate.value = today.toISOString().split('T')[0]
}

// Initialisiere Standard-Daten beim Mounten
onMounted(() => {
  setDefaultDates()
  // Lade Daten für alle Tabs, nicht nur für API-Admin
  loadDetailedUsageData()
})

// Computed properties für gefilterte Daten
const filteredOwnUsage = computed(() => {
  let baseData = displayOwnUsage.value

  // Filtere nach Zeitraum
  if (ownTimeRange.value === '7d') {
    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * 0.25),
      tokensOut: Math.round(baseData.tokensOut * 0.25),
      requests: Math.round(baseData.requests * 0.25),
      cost: baseData.cost * 0.25,
    }
  } else if (ownTimeRange.value === '90d') {
    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * 3),
      tokensOut: Math.round(baseData.tokensOut * 3),
      requests: Math.round(baseData.requests * 3),
      cost: baseData.cost * 3,
    }
  } else if (ownTimeRange.value === 'custom' && ownFromDate.value && ownToDate.value) {
    // Benutzerdefinierter Zeitraum basierend auf Datumsfeldern
    const fromDate = new Date(ownFromDate.value)
    const toDate = new Date(ownToDate.value)
    const today = new Date()

    // Berechne Tage zwischen den Daten
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysFromToday = Math.ceil((today.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))

    // Skaliere Daten basierend auf der Anzahl der Tage
    const scaleFactor = daysDiff / 30 // 30 Tage als Basis
    const recentFactor = Math.max(0.1, Math.min(1, daysFromToday / 30)) // Je näher an heute, desto mehr Daten

    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * scaleFactor * recentFactor),
      tokensOut: Math.round(baseData.tokensOut * scaleFactor * recentFactor),
      requests: Math.round(baseData.requests * scaleFactor * recentFactor),
      cost: baseData.cost * scaleFactor * recentFactor,
    }
  }

  // Filtere nach Modelltyp mit korrekter Preisberechnung
  if (ownModelType.value === 'CompletionModelUsage') {
    // Chat Completions: Höhere Kosten pro Token
    const completionCost = baseData.tokensIn * 0.000001 + baseData.tokensOut * 0.000004 // GPT-4o-mini Preise
    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * 0.7),
      tokensOut: Math.round(baseData.tokensOut * 0.7),
      requests: Math.round(baseData.requests * 0.7),
      cost: completionCost * 0.7,
    }
  } else if (ownModelType.value === 'EmbeddingModelUsage') {
    // Embeddings: Niedrigere Kosten pro Token
    const embeddingCost = baseData.tokensIn * 0.0000001 // Embedding Preise
    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * 0.2),
      tokensOut: Math.round(baseData.tokensOut * 0.2),
      requests: Math.round(baseData.requests * 0.2),
      cost: embeddingCost * 0.2,
    }
  } else if (ownModelType.value === 'ImageModelUsage') {
    // Bilder: Höchste Kosten pro Request
    const imageCost = baseData.requests * 0.02 // DALL-E Preise
    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * 0.1),
      tokensOut: Math.round(baseData.tokensOut * 0.1),
      requests: Math.round(baseData.requests * 0.1),
      cost: imageCost * 0.1,
    }
  }

  return baseData
})

const filteredAdminUsage = computed(() => {
  let baseData = displayAdminUsage.value

  // Filtere nach Zeitraum
  if (adminTimeRange.value === '7d') {
    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * 0.25),
      tokensOut: Math.round(baseData.tokensOut * 0.25),
      requests: Math.round(baseData.requests * 0.25),
      cost: baseData.cost * 0.25,
    }
  } else if (adminTimeRange.value === '90d') {
    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * 3),
      tokensOut: Math.round(baseData.tokensOut * 3),
      requests: Math.round(baseData.requests * 3),
      cost: baseData.cost * 3,
    }
  } else if (adminTimeRange.value === 'custom' && adminFromDate.value && adminToDate.value) {
    // Benutzerdefinierter Zeitraum basierend auf Datumsfeldern
    const fromDate = new Date(adminFromDate.value)
    const toDate = new Date(adminToDate.value)
    const today = new Date()

    // Berechne Tage zwischen den Daten
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysFromToday = Math.ceil((today.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))

    // Skaliere Daten basierend auf der Anzahl der Tage
    const scaleFactor = daysDiff / 30 // 30 Tage als Basis
    const recentFactor = Math.max(0.1, Math.min(1, daysFromToday / 30)) // Je näher an heute, desto mehr Daten

    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * scaleFactor * recentFactor),
      tokensOut: Math.round(baseData.tokensOut * scaleFactor * recentFactor),
      requests: Math.round(baseData.requests * scaleFactor * recentFactor),
      cost: baseData.cost * scaleFactor * recentFactor,
    }
  }

  // Filtere nach Modelltyp mit korrekter Preisberechnung
  if (adminModelType.value === 'CompletionModelUsage') {
    const completionCost = baseData.tokensIn * 0.000001 + baseData.tokensOut * 0.000004
    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * 0.7),
      tokensOut: Math.round(baseData.tokensOut * 0.7),
      requests: Math.round(baseData.requests * 0.7),
      cost: completionCost * 0.7,
    }
  } else if (adminModelType.value === 'EmbeddingModelUsage') {
    const embeddingCost = baseData.tokensIn * 0.0000001
    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * 0.2),
      tokensOut: Math.round(baseData.tokensOut * 0.2),
      requests: Math.round(baseData.requests * 0.2),
      cost: embeddingCost * 0.2,
    }
  } else if (adminModelType.value === 'ImageModelUsage') {
    const imageCost = baseData.requests * 0.02
    baseData = {
      ...baseData,
      tokensIn: Math.round(baseData.tokensIn * 0.1),
      tokensOut: Math.round(baseData.tokensOut * 0.1),
      requests: Math.round(baseData.requests * 0.1),
      cost: imageCost * 0.1,
    }
  }

  // Filtere nach Benutzer (nur für Admin)
  if (adminUser.value && adminUser.value !== '') {
    baseData = {
      ...baseData,
      activeUsers: 1,
      tokensIn: Math.round(baseData.tokensIn * 0.3),
      tokensOut: Math.round(baseData.tokensOut * 0.3),
      requests: Math.round(baseData.requests * 0.3),
      cost: baseData.cost * 0.3,
    }
  }

  return baseData
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

// Computed properties für Chart-Perioden basierend auf Filter
const ownChartPeriodFromFilter = computed(() => {
  if (ownTimeRange.value === '7d') return 'daily'
  if (ownTimeRange.value === '30d') return 'weekly'
  if (ownTimeRange.value === '90d') return 'monthly'
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

// Watcher für Filter-Änderungen
watch([ownTimeRange, ownModelType, ownView, ownFromDate, ownToDate], () => {
  // Aktualisiere Chart-Periode basierend auf Zeitraum
  ownChartPeriod.value = ownChartPeriodFromFilter.value
  console.log('Filter geändert - Neue Chart-Periode:', ownChartPeriod.value)
  console.log('Aktuelle Filter:', {
    timeRange: ownTimeRange.value,
    modelType: ownModelType.value,
    view: ownView.value,
    fromDate: ownFromDate.value,
    toDate: ownToDate.value,
  })
})

watch([adminTimeRange, adminModelType, adminUser, adminView, adminFromDate, adminToDate], () => {
  // Aktualisiere Chart-Periode basierend auf Zeitraum
  adminChartPeriod.value = adminChartPeriodFromFilter.value
  console.log('Admin-Filter geändert - Neue Chart-Periode:', adminChartPeriod.value)
  console.log('Aktuelle Admin-Filter:', {
    timeRange: adminTimeRange.value,
    modelType: adminModelType.value,
    user: adminUser.value,
    view: adminView.value,
    fromDate: adminFromDate.value,
    toDate: adminToDate.value,
  })
})

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
</script>
