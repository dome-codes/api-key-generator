<script setup lang="ts">
import { computed, ref } from 'vue'
import BarChart from '../charts/BarChart.vue'
import type { EnhancedExtractionUsageRecord, EnhancedUsageRecord } from '@/types/frontend'

type Variant = 'ai' | 'extraction'

interface Props {
  title?: string
  variant: Variant
  rows: Array<EnhancedUsageRecord | EnhancedExtractionUsageRecord>
  defaultTopN?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Nutzung nach Benutzer',
  defaultTopN: 10,
})

type SortKey = 'requests' | 'pages' | 'tokens' | 'cost' | 'userId'
const sortKey = ref<SortKey>('requests')
const sortDir = ref<'asc' | 'desc'>('desc')
const showAll = ref(false)
const search = ref('')

const normalized = computed(() => {
  return props.rows
    .map((r) => {
      const any = r as unknown as Record<string, unknown>
      const userId = typeof any.userId === 'string' ? any.userId : ''
      const requests =
        (typeof any.requests === 'number' ? any.requests : undefined) ??
        (typeof any.operations === 'number' ? any.operations : undefined) ??
        0
      const pages = (typeof any.pages === 'number' ? any.pages : undefined) ?? 0
      const tokensIn = (typeof any.tokensIn === 'number' ? any.tokensIn : undefined) ?? 0
      const tokensOut = (typeof any.tokensOut === 'number' ? any.tokensOut : undefined) ?? 0
      const tokens = tokensIn + tokensOut
      const cost = (typeof any.cost === 'number' ? any.cost : undefined) ?? 0

      return { userId, requests, pages, tokens, cost }
    })
    .filter((r) => r.userId.trim() !== '')
})

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return normalized.value
  return normalized.value.filter((r) => r.userId.toLowerCase().includes(q))
})

const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filteredRows.value].sort((a, b) => {
    if (key === 'userId') return dir * a.userId.localeCompare(b.userId)
    return dir * ((a[key] ?? 0) - (b[key] ?? 0))
  })
})

const displayRows = computed(() => {
  if (showAll.value) return sortedRows.value
  return sortedRows.value.slice(0, props.defaultTopN)
})

const maxRequests = computed(() => Math.max(1, ...displayRows.value.map((r) => r.requests)))

const barChartData = computed(() => {
  const rows = displayRows.value
  return {
    labels: rows.map((r) => r.userId),
    data: rows.map((r) => r.requests),
  }
})

const canShowTokens = computed(() => props.variant === 'ai')
const canShowPages = computed(() => props.variant === 'extraction')

const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'userId' ? 'asc' : 'desc'
  }
}

const formatCost = (value: number) => `€${value.toFixed(2)}`
</script>

<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
        <p class="text-sm text-gray-600">
          Aufschlüsselung der Nutzung pro Benutzer (Top {{ showAll ? 'alle' : defaultTopN }}).
        </p>
      </div>
      <button
        v-if="sortedRows.length > defaultTopN"
        class="text-xs text-primary hover:text-primary-hover font-medium"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Weniger anzeigen' : 'Alle anzeigen' }}
      </button>
    </div>

    <div class="mb-4">
      <input
        v-model="search"
        type="text"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
        placeholder="Benutzer suchen (userId)…"
      />
      <div class="mt-1 text-xs text-gray-500">
        {{ filteredRows.length.toLocaleString() }} Benutzer gefunden
      </div>
    </div>

    <div v-if="displayRows.length === 0" class="text-sm text-gray-500">
      Keine Benutzerdaten vorhanden.
    </div>

    <div v-else class="space-y-6">
      <BarChart
        v-if="barChartData.labels.length > 0"
        title=""
        :chart-data="barChartData"
        label="Requests"
        y-axis-label="Requests"
        placeholder="Benutzer-Verteilung wird geladen..."
      />

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left text-gray-600 border-b">
              <th class="py-2 pr-4 cursor-pointer" @click="toggleSort('userId')">Benutzer</th>
              <th class="py-2 pr-4 cursor-pointer" @click="toggleSort('requests')">Requests</th>
              <th v-if="canShowPages" class="py-2 pr-4 cursor-pointer" @click="toggleSort('pages')">
                Seiten
              </th>
              <th
                v-if="canShowTokens"
                class="py-2 pr-4 cursor-pointer"
                @click="toggleSort('tokens')"
              >
                Tokens
              </th>
              <th class="py-2 pr-4 cursor-pointer" @click="toggleSort('cost')">Kosten</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in displayRows" :key="r.userId" class="border-b last:border-b-0">
              <td class="py-2 pr-4 font-medium text-gray-900">
                <div class="flex items-center gap-2">
                  <div
                    class="h-2 rounded bg-primary"
                    :style="{ width: `${Math.round((r.requests / maxRequests) * 80) + 10}px` }"
                    aria-hidden="true"
                  />
                  <span>{{ r.userId }}</span>
                </div>
              </td>
              <td class="py-2 pr-4 text-gray-900">{{ r.requests.toLocaleString() }}</td>
              <td v-if="canShowPages" class="py-2 pr-4 text-gray-900">
                {{ r.pages.toLocaleString() }}
              </td>
              <td v-if="canShowTokens" class="py-2 pr-4 text-gray-900">
                {{ r.tokens.toLocaleString() }}
              </td>
              <td class="py-2 pr-4 text-gray-900">{{ formatCost(r.cost) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
