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
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
          </svg>
          <p class="text-gray-500">{{ placeholder }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Chart } from 'chart.js/auto'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  title: string
  placeholder?: string
  chartData: {
    labels: string[]
    data: number[]
  }
  colors?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Chart wird geladen...',
  // Corporate Design Farbpalette basierend auf Primary (#e00) und Corporate-Farben
  colors: () => [
    'rgba(238, 0, 0, 0.8)',      // Primary Rot (#e00)
    'rgba(13, 128, 147, 0.8)',    // Corporate Blue/Green (#0d8093)
    'rgba(255, 168, 46, 0.8)',    // Corporate Yellow (#ffa82e)
    'rgba(255, 135, 22, 0.8)',    // Corporate Orange (#ff8716)
    'rgba(153, 29, 103, 0.8)',    // Corporate Red/Magenta (#991d67)
    'rgba(213, 0, 0, 0.8)',       // Primary Hover (#d50000)
    'rgba(186, 0, 0, 0.8)',       // Primary Active (#ba0000)
    'rgba(13, 128, 147, 0.6)',    // Blue Variante (heller)
    'rgba(238, 0, 0, 0.6)',       // Red Variante (heller)
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
      type: 'pie',
      data: {
        labels: props.chartData.labels,
        datasets: [
          {
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
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || ''
                const value = context.parsed || 0
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
        },
      },
    })

    chartLoaded.value = true
  } catch (error) {
    console.error('Fehler beim Erstellen des Pie-Charts:', error)
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
