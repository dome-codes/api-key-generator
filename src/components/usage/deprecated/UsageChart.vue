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
import type { Chart } from 'chart.js/auto'
import { onMounted, ref, watch } from 'vue'

interface Props {
  title: string
  selectedPeriod: string
  chartPlaceholder?: string
  chartData?: {
    labels: string[]
    tokensIn: number[]
    tokensOut: number[]
    requests: number[]
  }
}

interface Emits {
  (e: 'update:selectedPeriod', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  chartPlaceholder: 'Chart wird hier angezeigt',
  chartData: undefined,
})

defineEmits<Emits>()

const chartCanvas = ref<HTMLCanvasElement>()
const chartLoaded = ref(false)
let chartInstance: Chart | null = null

const periods = [
  { value: 'daily', label: 'Täglich' },
  { value: 'hourly', label: 'Tagesansicht' },
  { value: 'weekly', label: 'Wöchentlich' },
  { value: 'monthly', label: 'Monatlich' },
]

// Leere Daten für verschiedene Perioden (werden durch echte Daten ersetzt)
const emptyData = {
  daily: { labels: [], tokensIn: [], tokensOut: [], requests: [] },
  hourly: { labels: [], tokensIn: [], tokensOut: [], requests: [] },
  weekly: { labels: [], tokensIn: [], tokensOut: [], requests: [] },
  monthly: { labels: [], tokensIn: [], tokensOut: [], requests: [] },
}

// Watch für Änderungen der selectedPeriod
watch(
  () => props.selectedPeriod,
  () => {
    if (chartInstance) {
      createChart()
    }
  },
)

// Watch für Änderungen der chartData
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
    // Dynamisch Chart.js importieren
    const { Chart } = await import('chart.js/auto')

    // Bestehenden Chart zerstören
    if (chartInstance && typeof chartInstance.destroy === 'function') {
      chartInstance.destroy()
    }

    // Verwende echte Daten falls verfügbar, sonst leere Daten
    const data =
      props.chartData ||
      emptyData[props.selectedPeriod as keyof typeof emptyData] ||
      emptyData.daily

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
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y',
            pointRadius: 2,
            pointHoverRadius: 4,
            borderWidth: 2,
            spanGaps: true,
            stepped: false,
          },
          {
            label: 'Tokens Out',
            data: data.tokensOut,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y',
            pointRadius: 2,
            pointHoverRadius: 4,
            borderWidth: 2,
            spanGaps: true,
            stepped: false,
          },
          {
            label: 'Anfragen',
            data: data.requests,
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1',
            pointRadius: 2,
            pointHoverRadius: 4,
            borderWidth: 2,
            spanGaps: true,
            stepped: false,
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
            grid: {
              display: true,
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: data.labels.length > 15 ? 15 : data.labels.length,
              callback: function (value, index) {
                const label = data.labels[index]
                // Für tägliche Ansicht: Zeige Wochentage
                if (props.selectedPeriod === 'daily') {
                  return label
                }
                // Für Tagesansicht: Zeige Stunden-Labels
                if (props.selectedPeriod === 'hourly') {
                  return label
                }
                // Für wöchentliche Ansicht: Zeige alle Wochen-Labels
                if (props.selectedPeriod === 'weekly') {
                  return label
                }
                // Für monatliche Ansicht: Kürze Labels wenn zu viele
                if (props.selectedPeriod === 'monthly' && data.labels.length > 12) {
                  return label.length > 3 ? label.substring(0, 3) : label
                }
                // Standard: Vollständige Labels
                return label
              },
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
          title: {
            display: false,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        elements: {
          line: {
            tension: 0.4,
          },
          point: {
            radius: 4,
            hoverRadius: 6,
          },
        },
      },
    })

    chartLoaded.value = true
    console.log('Chart created successfully with data:', data)
  } catch (error) {
    console.error('Fehler beim Erstellen des Charts:', error)
    chartLoaded.value = false
  }
}

onMounted(() => {
  createChart()
})

// Cleanup beim Unmount
onMounted(() => {
  return () => {
    if (chartInstance && typeof chartInstance.destroy === 'function') {
      chartInstance.destroy()
    }
  }
})
</script>
