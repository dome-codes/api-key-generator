<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Modell-Verteilung Pie-Chart -->
    <div class="bg-white rounded-xl shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Modell-Verteilung</h3>
      </div>

      <div class="h-64">
        <canvas ref="pieChartCanvas" class="w-full h-full"></canvas>
        <div
          v-if="!pieChartLoaded"
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
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            <p class="text-gray-500">Pie-Chart wird geladen...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tags Bar-Chart -->
    <div class="bg-white rounded-xl shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Tag-Verwendung</h3>
      </div>

      <div class="h-64">
        <canvas ref="barChartCanvas" class="w-full h-full"></canvas>
        <div
          v-if="!barChartLoaded"
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
            <p class="text-gray-500">Bar-Chart wird geladen...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TooltipItem } from 'chart.js'
import type { Chart } from 'chart.js/auto'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

interface UsageDataItem {
  modelName?: string
  model?: string
  requests?: number
  tag?: string
}

interface Props {
  usageData?: UsageDataItem[]
}

const props = withDefaults(defineProps<Props>(), {
  usageData: () => [],
})

const pieChartCanvas = ref<HTMLCanvasElement>()
const barChartCanvas = ref<HTMLCanvasElement>()
const pieChartLoaded = ref(false)
const barChartLoaded = ref(false)

let pieChartInstance: Chart | null = null
let barChartInstance: Chart | null = null

// Computed properties für echte Daten
const modelDistributionData = computed(() => {
  if (!props.usageData || props.usageData.length === 0) {
    return { labels: [], data: [] }
  }

  // Gruppiere nach Modelltyp
  const modelGroups = new Map<string, number>()

  props.usageData.forEach((item) => {
    const modelName = item.modelName || item.model || 'Unknown'
    const currentCount = modelGroups.get(modelName) || 0
    modelGroups.set(modelName, currentCount + (item.requests || 1))
  })

  const labels = Array.from(modelGroups.keys())
  const data = Array.from(modelGroups.values())

  return { labels, data }
})

const tagUsageData = computed(() => {
  if (!props.usageData || props.usageData.length === 0) {
    return { labels: [], data: [] }
  }

  // Gruppiere nach Tags
  const tagGroups = new Map<string, number>()

  props.usageData.forEach((item) => {
    const tag = item.tag || 'Unknown'
    const currentCount = tagGroups.get(tag) || 0
    tagGroups.set(tag, currentCount + (item.requests || 1))
  })

  const labels = Array.from(tagGroups.keys())
  const data = Array.from(tagGroups.values())

  return { labels, data }
})

const createPieChart = async () => {
  if (!pieChartCanvas.value) {
    console.log('Pie chart canvas not found')
    return
  }

  try {
    if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
      console.log('Creating pie chart...')
    }

    // Dynamisch Chart.js importieren
    const { Chart } = await import('chart.js/auto')
    if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
      console.log('Chart.js imported successfully')
    }

    // Bestehenden Chart zerstören
    if (pieChartInstance) {
      if (pieChartInstance && typeof pieChartInstance.destroy === 'function') {
        pieChartInstance.destroy()
      }
    }

    const ctx = pieChartCanvas.value.getContext('2d')
    if (!ctx) {
      if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
        console.log('Could not get 2D context')
      }
      return
    }

    const data = modelDistributionData.value
    if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
      console.log('Pie chart data:', data)
    }

    if (data.labels.length === 0) {
      if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
        console.log('No data available for pie chart')
      }
      pieChartLoaded.value = false
      return
    }

    pieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.data,
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(168, 85, 247, 0.8)',
              'rgba(251, 146, 60, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(139, 92, 246, 0.8)',
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(34, 197, 94, 1)',
              'rgba(168, 85, 247, 1)',
              'rgba(251, 146, 60, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(139, 92, 246, 1)',
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: function (context: TooltipItem<'pie'>) {
                const label = context.label || ''
                const value = context.parsed
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
        },
      },
    })

    pieChartLoaded.value = true
  } catch (error) {
    console.error('Fehler beim Erstellen des Pie-Charts:', error)
    pieChartLoaded.value = false
  }
}

const createBarChart = async () => {
  if (!barChartCanvas.value) {
    if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
      console.log('Bar chart canvas not found')
    }
    return
  }

  try {
    if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
      console.log('Creating bar chart...')
    }

    // Dynamisch Chart.js importieren
    const { Chart } = await import('chart.js/auto')
    if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
      console.log('Chart.js imported successfully for bar chart')
    }

    // Bestehenden Chart zerstören
    if (barChartInstance) {
      if (barChartInstance && typeof barChartInstance.destroy === 'function') {
        barChartInstance.destroy()
      }
    }

    const ctx = barChartCanvas.value.getContext('2d')
    if (!ctx) {
      if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
        console.log('Could not get 2D context for bar chart')
      }
      return
    }

    const data = tagUsageData.value
    if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
      console.log('Bar chart data:', data)
    }

    if (data.labels.length === 0) {
      if (import.meta.env.VITE_SHOW_DEBUG === 'true') {
        console.log('No data available for bar chart')
      }
      barChartLoaded.value = false
      return
    }

    barChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Verwendung',
            data: data.data,
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(168, 85, 247, 0.8)',
              'rgba(251, 146, 60, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(139, 92, 246, 0.8)',
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(34, 197, 94, 1)',
              'rgba(168, 85, 247, 1)',
              'rgba(251, 146, 60, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(139, 92, 246, 1)',
            ],
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
              text: 'Anzahl Anfragen',
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context: TooltipItem<'bar'>) {
                return `${context.label}: ${context.parsed.y} Anfragen`
              },
            },
          },
        },
      },
    })

    barChartLoaded.value = true
  } catch (error) {
    console.error('Fehler beim Erstellen des Bar-Charts:', error)
    barChartLoaded.value = false
  }
}

// Charts erstellen wenn Komponente gemountet ist
onMounted(() => {
  createPieChart()
  createBarChart()
})

// Einfacher Watcher für Daten-Änderungen
watch(() => props.usageData, () => {
  if (props.usageData && props.usageData.length > 0) {
    createPieChart()
    createBarChart()
  }
}, { immediate: false })

// Cleanup beim Unmount
onUnmounted(() => {
  if (pieChartInstance && typeof pieChartInstance.destroy === 'function') {
    pieChartInstance.destroy()
  }
  if (barChartInstance && typeof barChartInstance.destroy === 'function') {
    barChartInstance.destroy()
  }
})
</script>
