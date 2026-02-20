<script setup lang="ts">
import BarChart from '../charts/BarChart.vue'
import LineChart from '../charts/LineChart.vue'
import PieChart from '../charts/PieChart.vue'

interface Props {
  lineChartTitle: string
  selectedPeriod: string
  lineChartData?: {
    labels: string[]
    tokensIn?: number[]
    tokensOut?: number[]
    requests?: number[]
    cost?: number[]
  }
  modelDistributionData: {
    labels: string[]
    data: number[]
  }
  tagUsageData: {
    labels: string[]
    data: number[]
  }
  hasMoreTags?: boolean
  showAllTagsInChart?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:selectedPeriod': [value: string]
  'toggle-show-all-tags': []
}>()

const toggleShowAllTags = () => {
  emit('toggle-show-all-tags')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Main Line Chart -->
    <LineChart
      :title="lineChartTitle"
      :selected-period="selectedPeriod"
      :chart-data="lineChartData"
      placeholder="Nutzungsdiagramm wird hier angezeigt"
      @update:selected-period="$emit('update:selectedPeriod', $event)"
    />

    <!-- Additional Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Model Distribution Pie Chart -->
      <PieChart
        v-if="modelDistributionData.labels.length > 0"
        title="Modell-Verteilung"
        :chart-data="modelDistributionData"
        placeholder="Modell-Verteilung wird geladen..."
      />

      <!-- Tag Usage Bar Chart -->
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Tag-Verwendung</h3>
          <button
            v-if="hasMoreTags"
            class="text-xs text-primary hover:text-primary-hover font-medium"
            @click="toggleShowAllTags"
          >
            {{ showAllTagsInChart ? 'Weniger anzeigen' : 'Alle Tags anzeigen' }}
          </button>
        </div>
        <BarChart
          v-if="tagUsageData.labels.length > 0"
          title=""
          :chart-data="tagUsageData"
          label="Anfragen"
          y-axis-label="Anzahl Anfragen"
          placeholder="Tag-Verwendung wird geladen..."
        />
        <div v-else class="h-64 flex items-center justify-center text-sm text-gray-500">
          Noch keine Tags verwendet in AI Usage.
        </div>
      </div>
    </div>
  </div>
</template>
