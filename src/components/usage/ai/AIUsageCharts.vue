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
      <BarChart
        v-if="tagUsageData.labels.length > 0"
        title="Tag-Verwendung"
        :chart-data="tagUsageData"
        label="Anfragen"
        y-axis-label="Anzahl Anfragen"
        placeholder="Tag-Verwendung wird geladen..."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
}

defineProps<Props>()

defineEmits<{
  'update:selectedPeriod': [value: string]
}>()
</script>
