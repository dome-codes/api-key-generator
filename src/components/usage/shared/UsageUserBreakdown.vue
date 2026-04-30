<script setup lang="ts">
import { computed, ref } from 'vue'
import BarChart from '../charts/BarChart.vue'
import type { EnhancedExtractionUsageRecord, EnhancedUsageRecord } from '@/types/frontend'
import { calculateExtractionCost } from '@/config/pricing'

type Variant = 'ai' | 'extraction'
interface Props {
  title?: string
  variant: Variant
  userRows: Array<EnhancedUsageRecord | EnhancedExtractionUsageRecord>
  apiKeyRows?: Array<EnhancedUsageRecord | EnhancedExtractionUsageRecord>
  defaultTopN?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Nutzung nach Benutzer',
  defaultTopN: 10,
})

type SortKey =
  | 'requests'
  | 'pages'
  | 'tokens'
  | 'cachedTokens'
  | 'reasoningTokens'
  | 'cost'
  | 'id'
  | 'technicalUsers'
  | 'avgPagesPerOp'
const sortKey = ref<SortKey>('requests')
const sortDir = ref<'asc' | 'desc'>('desc')
const showAll = ref(false)
const search = ref('')

type Mode = 'user' | 'apiKey'
const mode = ref<Mode>('user')

const currentRows = computed(() => {
  return mode.value === 'user' ? props.userRows : (props.apiKeyRows ?? [])
})

type AggregatedRow = {
  id: string
  requests: number
  pages: number
  tokens: number
  cachedTokens: number
  reasoningTokens: number
  cost: number
  avgPagesPerOp: number
  userIds?: string[]
  technicalUsers: string
}

const normalized = computed(() => {
  const aggregated = new Map<string, AggregatedRow>()

  currentRows.value.forEach((r) => {
      const any = r as unknown as Record<string, unknown>
      const id =
        mode.value === 'user'
          ? typeof any.userId === 'string'
            ? any.userId
            : ''
          : (() => {
              const raw = (any.apiKeyId ?? any.apiKey) as unknown
              return typeof raw === 'string' ? raw : ''
            })()
      const requests =
        (typeof any.requests === 'number' ? any.requests : undefined) ??
        (typeof any.operations === 'number' ? any.operations : undefined) ??
        0
      const pages = (typeof any.pages === 'number' ? any.pages : undefined) ?? 0
      const tokensIn = (typeof any.tokensIn === 'number' ? any.tokensIn : undefined) ?? 0
      const tokensOut = (typeof any.tokensOut === 'number' ? any.tokensOut : undefined) ?? 0
      const cachedTokens =
        (typeof (any as { cachedTokens?: number }).cachedTokens === 'number'
          ? (any as { cachedTokens?: number }).cachedTokens
          : undefined) ?? 0
      const reasoningTokens =
        (typeof (any as { reasoningTokens?: number }).reasoningTokens === 'number'
          ? (any as { reasoningTokens?: number }).reasoningTokens
          : undefined) ?? 0
      const tokens = tokensIn + tokensOut + cachedTokens + reasoningTokens
      let cost = (typeof any.cost === 'number' ? any.cost : undefined) ?? 0
      const modelId =
        typeof any.modelId === 'string' && any.modelId.trim() !== '' ? any.modelId : 'unknown'

      if (props.variant === 'extraction' && pages > 0 && (cost === 0 || !Number.isFinite(cost))) {
        cost = calculateExtractionCost(pages, modelId).finalCost
      }

      const userIdRaw = typeof any.userId === 'string' ? any.userId.trim() : ''
      const existing = aggregated.get(id)

      if (!existing) {
        aggregated.set(id, {
          id,
          requests,
          pages,
          tokens,
          cachedTokens,
          reasoningTokens,
          cost,
          avgPagesPerOp: requests > 0 ? pages / requests : 0,
          userIds: mode.value === 'apiKey' && userIdRaw ? [userIdRaw] : [],
          technicalUsers: mode.value === 'apiKey' && userIdRaw ? userIdRaw : '',
        })
        return
      }

      existing.requests += requests
      existing.pages += pages
      existing.tokens += tokens
      existing.cachedTokens += cachedTokens
      existing.reasoningTokens += reasoningTokens
      existing.cost += cost
      existing.avgPagesPerOp = existing.requests > 0 ? existing.pages / existing.requests : 0
      if (mode.value === 'apiKey' && userIdRaw) {
        existing.userIds = Array.from(new Set([...(existing.userIds ?? []), userIdRaw]))
        existing.technicalUsers = (existing.userIds ?? []).join(', ')
      }
    })

  return Array.from(aggregated.values()).filter((r) => r.id.trim() !== '')
})

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return normalized.value
  return normalized.value.filter((r) => r.id.toLowerCase().includes(q))
})

const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filteredRows.value].sort((a, b) => {
    if (key === 'id') return dir * a.id.localeCompare(b.id)
    if (key === 'technicalUsers') return dir * a.technicalUsers.localeCompare(b.technicalUsers)
    return dir * (((a[key] as number) ?? 0) - ((b[key] as number) ?? 0))
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
    labels: rows.map((r) => r.id),
    data: rows.map((r) => r.requests),
  }
})

const canShowTokens = computed(() => props.variant === 'ai')
const canShowPages = computed(() => props.variant === 'extraction')
const isUserMode = computed(() => mode.value === 'user')

const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'id' ? 'asc' : 'desc'
  }
}

const formatCost = (value: number) => `€${value.toFixed(2)}`
</script>

<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex flex-col gap-3 mb-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
        <p class="text-sm text-gray-600">
          Aufschlüsselung der Nutzung pro
          {{ isUserMode ? 'Benutzer' : 'API-Key' }} (Top {{ showAll ? 'alle' : defaultTopN }}).
        </p>
      </div>
      <div class="flex items-center gap-3">
        <label class="text-xs font-medium text-gray-600">Gruppieren nach</label>
        <select
          v-model="mode"
          class="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-900 bg-white"
        >
          <option value="user">Benutzer</option>
          <option value="apiKey">API-Key</option>
        </select>
        <button
          v-if="sortedRows.length > defaultTopN"
          class="text-xs text-primary hover:text-primary-hover font-medium"
          @click="showAll = !showAll"
        >
          {{ showAll ? 'Weniger anzeigen' : 'Alle anzeigen' }}
        </button>
      </div>
    </div>

    <div class="mb-4">
      <input
        v-model="search"
        type="text"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
        :placeholder="isUserMode ? 'Benutzer suchen (userId)…' : 'API-Key suchen (apiKeyId)…'"
      />
      <div class="mt-1 text-xs text-gray-500">
        {{ filteredRows.length.toLocaleString() }}
        {{ isUserMode ? 'Benutzer gefunden' : 'API-Keys gefunden' }}
      </div>
    </div>

    <div v-if="displayRows.length === 0" class="text-sm text-gray-500">
      {{ isUserMode ? 'Keine Benutzerdaten vorhanden.' : 'Keine API-Key-Daten vorhanden.' }}
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
              <th class="py-2 pr-4 cursor-pointer" @click="toggleSort('id')">
                {{ isUserMode ? 'Benutzer' : 'API-Key' }}
              </th>
              <th
                v-if="!isUserMode"
                class="py-2 pr-4 cursor-pointer"
                @click="toggleSort('technicalUsers')"
              >
                Technischer Benutzer
              </th>
              <th class="py-2 pr-4 cursor-pointer" @click="toggleSort('requests')">Requests</th>
              <th v-if="canShowPages" class="py-2 pr-4 cursor-pointer" @click="toggleSort('pages')">
                Seiten
              </th>
              <th
                v-if="canShowPages"
                class="py-2 pr-4 cursor-pointer"
                @click="toggleSort('avgPagesPerOp')"
              >
                Ø Seiten / Op.
              </th>
              <th
                v-if="canShowTokens"
                class="py-2 pr-4 cursor-pointer"
                @click="toggleSort('tokens')"
              >
                Tokens (gesamt)
              </th>
              <th
                v-if="canShowTokens"
                class="py-2 pr-4 cursor-pointer"
                @click="toggleSort('cachedTokens')"
              >
                Cached Tokens
              </th>
              <th
                v-if="canShowTokens"
                class="py-2 pr-4 cursor-pointer"
                @click="toggleSort('reasoningTokens')"
              >
                Reasoning Tokens
              </th>
              <th class="py-2 pr-4 cursor-pointer" @click="toggleSort('cost')">Kosten</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in displayRows" :key="r.id" class="border-b last:border-b-0">
              <td class="py-2 pr-4 font-medium text-gray-900">
                <div class="flex items-center gap-2">
                  <div
                    class="h-2 rounded bg-primary"
                    :style="{ width: `${Math.round((r.requests / maxRequests) * 80) + 10}px` }"
                    aria-hidden="true"
                  />
                  <span>{{ r.id }}</span>
                </div>
              </td>
              <td v-if="!isUserMode" class="py-2 pr-4 text-gray-900">
                {{ r.technicalUsers || '–' }}
              </td>
              <td class="py-2 pr-4 text-gray-900">{{ r.requests.toLocaleString() }}</td>
              <td v-if="canShowPages" class="py-2 pr-4 text-gray-900">
                {{ r.pages.toLocaleString() }}
              </td>
              <td v-if="canShowPages" class="py-2 pr-4 text-gray-900">
                {{ r.avgPagesPerOp > 0 ? r.avgPagesPerOp.toFixed(2) : '–' }}
              </td>
              <td v-if="canShowTokens" class="py-2 pr-4 text-gray-900">
                {{ r.tokens.toLocaleString() }}
              </td>
              <td v-if="canShowTokens" class="py-2 pr-4 text-gray-900">
                {{ r.cachedTokens.toLocaleString() }}
              </td>
              <td v-if="canShowTokens" class="py-2 pr-4 text-gray-900">
                {{ r.reasoningTokens.toLocaleString() }}
              </td>
              <td class="py-2 pr-4 text-gray-900">{{ formatCost(r.cost) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
