<script setup lang="ts">
import { computed } from 'vue'
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
      borderColor: 'rgb(238, 0, 0)', // Primary Rot (#e00)
      backgroundColor: 'rgba(238, 0, 0, 0.15)',
      yAxisID: 'y',
    },
    {
      label: 'Seiten',
      data: data.pages || [],
      borderColor: 'rgb(13, 128, 147)', // Corporate Blue/Green (#0d8093)
      backgroundColor: 'rgba(13, 128, 147, 0.15)',
      yAxisID: 'y',
    },
    {
      label: 'Kosten (€)',
      data: data.cost || [],
      borderColor: 'rgb(255, 135, 22)', // Corporate Orange (#ff8716)
      backgroundColor: 'rgba(255, 135, 22, 0.15)',
      yAxisID: 'y1',
    },
  ]
})
</script>

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
