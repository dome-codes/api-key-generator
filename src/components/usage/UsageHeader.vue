<template>
  <div class="flex flex-col gap-4 mb-6">
    <!-- Haupt-Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-800">Nutzung</h1>
      <div class="flex items-center gap-2">
        <select
          v-model="selectedProject"
          class="border rounded px-2 py-1 text-sm"
          @change="onProjectChange"
        >
          <option value="">Alle Projekte</option>
          <option value="project1">Standard-Projekt</option>
          <option value="project2">Test-Projekt</option>
        </select>
        <input
          type="text"
          class="border rounded px-2 py-1 text-sm w-40"
          :value="dateRangeDisplay"
          readonly
        />
        <button
          @click="exportData"
          class="border rounded px-3 py-1 text-sm bg-white hover:bg-gray-100"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Exportiere...' : 'Exportieren' }}
        </button>
      </div>
    </div>

    <!-- Erweiterte Filter -->
    <div class="bg-white rounded-lg border p-4">
      <h3 class="text-sm font-medium text-gray-700 mb-3">Erweiterte Filter</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Zeitraum Filter -->
        <div>
          <label class="block text-xs text-gray-600 mb-1">Zeitraum</label>
          <select
            v-model="selectedTimeRange"
            class="w-full border rounded px-2 py-1 text-sm"
            @change="onTimeRangeChange"
          >
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d">Letzte 30 Tage</option>
            <option value="90d">Letzte 90 Tage</option>
            <option value="thisMonth">Diesen Monat</option>
            <option value="lastMonth">Vormonat</option>
            <option value="custom">Benutzerdefiniert</option>
          </select>
          <!-- Custom Date Range (nur sichtbar wenn "Benutzerdefiniert" ausgewählt) -->
          <div v-if="selectedTimeRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Von</label>
              <input
                v-model="customFromDate"
                type="date"
                class="w-full border rounded px-2 py-1 text-xs"
                @change="onCustomDateChange"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Bis</label>
              <input
                v-model="customToDate"
                type="date"
                class="w-full border rounded px-2 py-1 text-xs"
                @change="onCustomDateChange"
              />
            </div>
          </div>
        </div>

        <!-- Modelltyp Filter -->
        <div>
          <label class="block text-xs text-gray-600 mb-1">Modelltyp</label>
          <select
            v-model="selectedModelType"
            class="w-full border rounded px-2 py-1 text-sm"
            @change="onModelTypeChange"
          >
            <option value="">Alle Modelltypen</option>
            <option value="CompletionModelUsage">Chat Completions</option>
            <option value="EmbeddingModelUsage">Embeddings</option>
            <option value="ImageModelUsage">Bilder</option>
          </select>
        </div>

        <!-- Technischer Nutzer Filter -->
        <div>
          <label class="block text-xs text-gray-600 mb-1">Technischer Nutzer</label>
          <select
            v-model="selectedTechnicalUser"
            class="w-full border rounded px-2 py-1 text-sm"
            @change="onTechnicalUserChange"
          >
            <option value="">Alle Nutzer</option>
            <option
              v-for="user in availableUsers"
              :key="user.technicalUserId"
              :value="user.technicalUserId"
            >
              {{ user.technicalUserName }}
            </option>
          </select>
        </div>

        <!-- Gruppierung -->
        <div>
          <label class="block text-xs text-gray-600 mb-1">Gruppierung</label>
          <select
            v-model="selectedGroupBy"
            class="w-full border rounded px-2 py-1 text-sm"
            @change="onGroupByChange"
          >
            <option value="day">Nach Tag</option>
            <option value="week">Nach Woche</option>
            <option value="month">Nach Monat</option>
            <option value="user">Nach Nutzer</option>
            <option value="model">Nach Modell</option>
          </select>
        </div>
      </div>

      <!-- Benutzerdefinierter Zeitraum (nur wenn ausgewählt) -->
      <div v-if="selectedTimeRange === 'custom'" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-gray-600 mb-1">Von Datum</label>
          <input
            type="date"
            v-model="customFromDate"
            class="w-full border rounded px-2 py-1 text-sm"
            @change="onCustomDateChange"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-600 mb-1">Bis Datum</label>
          <input
            type="date"
            v-model="customToDate"
            class="w-full border rounded px-2 py-1 text-sm"
            @change="onCustomDateChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModelUsageType, UsageFilter } from '@/api/types/types'
import { useUsage } from '@/composables/useUsage'
import { computed, onMounted, ref } from 'vue'

// Props
interface Props {
  onFilterChange?: (filter: UsageFilter) => void
}

const props = withDefaults(defineProps<Props>(), {
  onFilterChange: () => {},
})

// Composable
const { loadDetailedUsageData, exportUsageData, isLoading, userUsageSummary } = useUsage()

// Local state
const selectedProject = ref('')
const selectedTimeRange = ref('30d')
const selectedModelType = ref<ModelUsageType | ''>('')
const selectedTechnicalUser = ref('')
const selectedGroupBy = ref<'day' | 'week' | 'month' | 'user' | 'model'>('day')
const customFromDate = ref('')
const customToDate = ref('')

// Computed
const dateRangeDisplay = computed(() => {
  if (selectedTimeRange.value === 'custom') {
    return `${customFromDate.value} - ${customToDate.value}`
  }

  const today = new Date()
  const fromDate = new Date()

  switch (selectedTimeRange.value) {
    case '7d':
      fromDate.setDate(today.getDate() - 7)
      break
    case '30d':
      fromDate.setDate(today.getDate() - 30)
      break
    case '90d':
      fromDate.setDate(today.getDate() - 90)
      break
  }

  return `${fromDate.toLocaleDateString('de-DE')} - ${today.toLocaleDateString('de-DE')}`
})

const availableUsers = computed(() => {
  return userUsageSummary.value.map((user) => ({
    technicalUserId: user.technicalUserId,
    technicalUserName: user.technicalUserName,
  }))
})

// Methods
const onProjectChange = () => {
  // Projekt-spezifische Filterlogik hier implementieren
  console.log('Projekt geändert:', selectedProject.value)
}

const onTimeRangeChange = () => {
  if (selectedTimeRange.value !== 'custom') {
    updateFilter()
  }
}

const onModelTypeChange = () => {
  updateFilter()
}

const onTechnicalUserChange = () => {
  updateFilter()
}

const onGroupByChange = () => {
  updateFilter()
}

const onCustomDateChange = () => {
  if (customFromDate.value && customToDate.value) {
    updateFilter()
  }
}

const updateFilter = () => {
  const filter = {
    fromDate: getFromDate(),
    toDate: getToDate(),
    modelType: selectedModelType.value || undefined,
    technicalUserIds: selectedTechnicalUser.value ? [selectedTechnicalUser.value] : undefined,
    groupBy: selectedGroupBy.value,
  }

  props.onFilterChange(filter)
  loadDetailedUsageData(filter)
}

const getFromDate = (): string => {
  if (selectedTimeRange.value === 'custom') {
    return customFromDate.value
  }

  const today = new Date()
  const fromDate = new Date()

  switch (selectedTimeRange.value) {
    case '7d':
      fromDate.setDate(today.getDate() - 7)
      break
    case '30d':
      fromDate.setDate(today.getDate() - 30)
      break
    case '90d':
      fromDate.setDate(today.getDate() - 90)
      break
    case 'thisMonth':
      // Erster Tag des aktuellen Monats
      fromDate.setDate(1)
      fromDate.setHours(0, 0, 0, 0)
      break
    case 'lastMonth':
      // Erster Tag des Vormonats
      fromDate.setMonth(today.getMonth() - 1)
      fromDate.setDate(1)
      fromDate.setHours(0, 0, 0, 0)
      break
  }

  return fromDate.toISOString()
}

const getToDate = (): string => {
  if (selectedTimeRange.value === 'custom') {
    return customToDate.value
  }

  const today = new Date()

  switch (selectedTimeRange.value) {
    case 'thisMonth':
      // Letzter Tag des aktuellen Monats
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return lastDayOfMonth.toISOString()
    case 'lastMonth':
      // Letzter Tag des Vormonats
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      return lastDayOfLastMonth.toISOString()
    default:
      return today.toISOString()
  }
}

const exportData = async () => {
  await exportUsageData('csv')
}

// Initialize
onMounted(() => {
  updateFilter()
})
</script>
