<template>
  <div class="space-y-6">
    <!-- Main Line Chart -->
    <LineChart
      :title="lineChartTitle"
      :chart-data="lineChartData"
      :datasets="lineChartDatasets"
      placeholder="Extraction-Nutzungsdiagramm wird hier angezeigt"
    />

    <!-- Additional Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Provider Distribution Pie Chart -->
      <PieChart
        v-if="providerDistributionData.labels.length > 0"
        title="Provider-Verteilung"
        :chart-data="providerDistributionData"
        placeholder="Provider-Verteilung wird geladen..."
      />

      <!-- Status Distribution Pie Chart -->
      <PieChart
        v-if="statusDistributionData.labels.length > 0"
        title="Status-Verteilung"
        :chart-data="statusDistributionData"
        placeholder="Status-Verteilung wird geladen..."
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
  lineChartData?: {
    labels: string[]
    operations?: number[]
    pages?: number[]
    cost?: number[]
    confidence?: number[]
  }
  providerDistributionData: {
    labels: string[]
    data: number[]
  }
  statusDistributionData: {
    labels: string[]
    data: number[]
  }
}

const props = defineProps<Props>()

// Line Chart Datasets für Extraction
const lineChartDatasets = computed(() => {
  const data = props.lineChartData
  if (!data) return []

  return [
    {
      label: 'Operationen',
      data: data.operations || [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      yAxisID: 'y',
    },
    {
      label: 'Seiten',
      data: data.pages || [],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      yAxisID: 'y',
    },
    {
      label: 'Kosten (€)',
      data: data.cost || [],
      borderColor: 'rgb(251, 146, 60)',
      backgroundColor: 'rgba(251, 146, 60, 0.2)',
      yAxisID: 'y1',
    },
  ]
})
</script>
