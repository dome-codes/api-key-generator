<script setup lang="ts">
import type { TooltipItem } from 'chart.js'
import type { Chart } from 'chart.js/auto'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  title: string
  placeholder?: string
  chartData: {
    labels: string[]
    data: number[]
  }
  label?: string
  yAxisLabel?: string
  colors?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Chart wird geladen...',
  label: 'Verwendung',
  yAxisLabel: 'Anzahl',
  // Corporate Design Farbpalette - harmonische Abstufungen für Bar Charts
  colors: () => [
    'rgba(238, 0, 0, 0.85)', // Primary Rot (#e00) - Hauptfarbe
    'rgba(13, 128, 147, 0.85)', // Corporate Blue/Green (#0d8093)
    'rgba(255, 168, 46, 0.85)', // Corporate Yellow (#ffa82e)
    'rgba(255, 135, 22, 0.85)', // Corporate Orange (#ff8716)
    'rgba(153, 29, 103, 0.85)', // Corporate Red/Magenta (#991d67)
    'rgba(213, 0, 0, 0.85)', // Primary Hover (#d50000)
    'rgba(186, 0, 0, 0.85)', // Primary Active (#ba0000)
    'rgba(13, 128, 147, 0.7)', // Blue Variante (heller)
  ],
})

const chartCanvas = ref<HTMLCanvasElement>()
const chartLoaded = ref(false)
let chartInstance: Chart | null = null

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

    const ctx = chartCanvas.value.getContext('2d')
    if (!ctx) return

    if (props.chartData.labels.length === 0) {
      chartLoaded.value = false
      return
    }

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: props.chartData.labels,
        datasets: [
          {
            label: props.label,
            data: props.chartData.data,
            backgroundColor: props.colors,
            borderColor: props.colors.map((c) => c.replace('0.8', '1')),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: props.yAxisLabel,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label(context: TooltipItem<'bar'>) {
                return `${context.label}: ${context.parsed.y}`
              },
            },
          },
        },
      },
    })

    chartLoaded.value = true
  } catch (error) {
    console.error('Fehler beim Erstellen des Bar-Charts:', error)
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
