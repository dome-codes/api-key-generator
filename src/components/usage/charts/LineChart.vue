<script setup lang="ts">
import type { Chart } from 'chart.js/auto'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

interface ChartData {
  labels: string[]
  tokensIn?: number[]
  tokensOut?: number[]
  requests?: number[]
  cost?: number[]
  [key: string]: string[] | number[] | undefined
}

interface Props {
  title: string
  placeholder?: string
  chartData?: ChartData
  datasets?: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    yAxisID?: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Chart wird geladen...',
  chartData: undefined,
})

const chartCanvas = ref<HTMLCanvasElement>()
const chartLoaded = ref(false)
let chartInstance: Chart | null = null

// Standard-Datasets für AI Usage
const defaultDatasets = computed(() => {
  if (props.datasets) {
    return props.datasets
  }

  const data = props.chartData
  if (!data) return []

  // Corporate Design Farben für Line Chart
  return [
    {
      label: 'Tokens In',
      data: data.tokensIn || [],
      borderColor: 'rgb(238, 0, 0)', // Primary Rot (#e00)
      backgroundColor: 'rgba(238, 0, 0, 0.15)',
      yAxisID: 'y',
    },
    {
      label: 'Tokens Out',
      data: data.tokensOut || [],
      borderColor: 'rgb(13, 128, 147)', // Corporate Blue/Green (#0d8093)
      backgroundColor: 'rgba(13, 128, 147, 0.15)',
      yAxisID: 'y',
    },
    {
      label: 'Anfragen',
      data: data.requests || [],
      borderColor: 'rgb(255, 168, 46)', // Corporate Yellow (#ffa82e)
      backgroundColor: 'rgba(255, 168, 46, 0.15)',
      yAxisID: 'y1',
    },
  ]
})

watch(
  () => props.chartData,
  () => {
    if (chartInstance) {
      createChart()
    }
  },
  { deep: true },
)

const createChart = async () => {
  if (!chartCanvas.value) return

  try {
    const { Chart } = await import('chart.js/auto')

    if (chartInstance && typeof chartInstance.destroy === 'function') {
      chartInstance.destroy()
    }

    const data = props.chartData || { labels: [] }
    const ctx = chartCanvas.value.getContext('2d')
    if (!ctx) return

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: defaultDatasets.value.map((ds) => ({
          ...ds,
          tension: 0.4,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2,
          spanGaps: true,
          stepped: false,
        })),
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
            grid: {
              display: true,
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: data.labels.length > 15 ? 15 : data.labels.length,
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
            grid: {
              display: true,
            },
            beginAtZero: true,
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
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
      },
    })

    chartLoaded.value = true
  } catch (error) {
    console.error('Fehler beim Erstellen des Charts:', error)
    chartLoaded.value = false
  }
}

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (chartInstance && typeof chartInstance.destroy === 'function') {
    chartInstance.destroy()
  }
})
</script>

<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
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
          <p class="text-gray-500">{{ placeholder }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
