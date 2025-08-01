<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
      <div class="flex items-center gap-2">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="$emit('update:selectedPeriod', period.value)"
          :class="[
            'px-3 py-1 text-sm rounded-lg transition-colors',
            selectedPeriod === period.value
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          ]"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <div class="h-64">
      <canvas ref="chartCanvas"></canvas>
      <div
        v-if="!chartLoaded"
        class="h-full bg-gray-50 rounded-lg flex items-center justify-center"
      >
        <div class="text-center">
          <svg
            class="w-16 h-16 text-gray-300 mx-auto mb-4"
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
          <p class="text-gray-500">Chart wird geladen...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

interface Props {
  title: string
  selectedPeriod: string
  chartPlaceholder?: string
}

interface Emits {
  (e: 'update:selectedPeriod', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  chartPlaceholder: 'Chart wird hier angezeigt',
})

defineEmits<Emits>()

const chartCanvas = ref<HTMLCanvasElement>()
const chartLoaded = ref(false)
let chartInstance: any = null

const periods = [
  { value: 'daily', label: 'Täglich' },
  { value: 'weekly', label: 'Wöchentlich' },
  { value: 'monthly', label: 'Monatlich' },
]

// Mock-Daten für verschiedene Perioden
const mockData = {
  daily: {
    labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    tokensIn: [15000, 22000, 18000, 25000, 30000, 12000, 8000],
    tokensOut: [8000, 12000, 10000, 15000, 18000, 6000, 4000],
    requests: [45, 67, 52, 78, 92, 35, 24],
  },
  weekly: {
    labels: ['Woche 1', 'Woche 2', 'Woche 3', 'Woche 4'],
    tokensIn: [120000, 180000, 150000, 200000],
    tokensOut: [65000, 95000, 80000, 110000],
    requests: [350, 520, 430, 580],
  },
  monthly: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'],
    tokensIn: [450000, 520000, 480000, 600000, 550000, 680000],
    tokensOut: [240000, 280000, 260000, 320000, 290000, 360000],
    requests: [1200, 1400, 1300, 1600, 1500, 1800],
  },
}

const createChart = async () => {
  if (!chartCanvas.value) return

  try {
    // Dynamisch Chart.js importieren
    const { Chart } = await import('chart.js/auto')

    // Bestehenden Chart zerstören
    if (chartInstance) {
      chartInstance.destroy()
    }

    const data = mockData[props.selectedPeriod as keyof typeof mockData] || mockData.daily

    const ctx = chartCanvas.value.getContext('2d')
    if (!ctx) return

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Tokens In',
            data: data.tokensIn,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Tokens Out',
            data: data.tokensOut,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Anfragen',
            data: data.requests,
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            tension: 0.4,
            fill: false,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Zeitraum',
            },
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Tokens',
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Anfragen',
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: false,
          },
        },
      },
    })

    chartLoaded.value = true
    console.log('Chart created successfully')
  } catch (error) {
    console.error('Fehler beim Erstellen des Charts:', error)
    chartLoaded.value = false
  }
}

// Chart erstellen wenn Komponente gemountet ist
onMounted(() => {
  console.log('UsageChart mounted - creating chart...')
  createChart()
})

// Chart aktualisieren wenn sich die Periode ändert
watch(
  () => props.selectedPeriod,
  () => {
    console.log('Chart period changed to:', props.selectedPeriod)
    createChart()
  },
)

// Cleanup beim Unmount
onMounted(() => {
  return () => {
    if (chartInstance) {
      chartInstance.destroy()
    }
  }
})
</script>
