<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Modell-Verteilung Pie-Chart -->
    <div class="bg-white rounded-xl shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Modell-Verteilung</h3>
        <div class="flex items-center gap-2">
          <button
            v-for="period in periods"
            :key="period.value"
            @click="selectedPeriod = period.value"
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
        <div class="flex items-center gap-2">
          <button
            v-for="period in periods"
            :key="period.value"
            @click="selectedPeriod = period.value"
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
import { onMounted, ref, watch } from 'vue'

const pieChartCanvas = ref<HTMLCanvasElement>()
const barChartCanvas = ref<HTMLCanvasElement>()
const pieChartLoaded = ref(false)
const barChartLoaded = ref(false)
const selectedPeriod = ref('daily')

let pieChartInstance: any = null
let barChartInstance: any = null

const periods = [
  { value: 'daily', label: 'Täglich' },
  { value: 'weekly', label: 'Wöchentlich' },
  { value: 'monthly', label: 'Monatlich' },
]

// Mock-Daten für Modell-Verteilung (Pie-Chart)
const modelData = {
  daily: {
    labels: ['GPT-4', 'GPT-3.5', 'GPT-4o-mini', 'Document Intelligence'],
    data: [35, 25, 30, 10],
  },
  weekly: {
    labels: ['GPT-4', 'GPT-3.5', 'GPT-4o-mini', 'Document Intelligence'],
    data: [40, 20, 25, 15],
  },
  monthly: {
    labels: ['GPT-4', 'GPT-3.5', 'GPT-4o-mini', 'Document Intelligence'],
    data: [45, 15, 30, 10],
  },
}

// Mock-Daten für Tags (Bar-Chart)
const tagData = {
  daily: {
    labels: ['API-Key', 'Production', 'Development', 'Testing', 'Demo'],
    data: [85, 60, 45, 30, 15],
  },
  weekly: {
    labels: ['API-Key', 'Production', 'Development', 'Testing', 'Demo', 'Backup'],
    data: [320, 240, 180, 120, 80, 40],
  },
  monthly: {
    labels: ['API-Key', 'Production', 'Development', 'Testing', 'Demo', 'Backup', 'Archive'],
    data: [1200, 900, 650, 450, 300, 200, 100],
  },
}

const createPieChart = async () => {
  if (!pieChartCanvas.value) {
    console.log('Pie chart canvas not found')
    return
  }

  try {
    console.log('Creating pie chart...')

    // Dynamisch Chart.js importieren
    const { Chart } = await import('chart.js/auto')
    console.log('Chart.js imported successfully')

    // Bestehenden Chart zerstören
    if (pieChartInstance) {
      pieChartInstance.destroy()
    }

    const ctx = pieChartCanvas.value.getContext('2d')
    if (!ctx) {
      console.log('Could not get 2D context')
      return
    }

    const data = modelData[selectedPeriod.value as keyof typeof modelData] || modelData.daily
    console.log('Pie chart data:', data)

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
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(34, 197, 94, 1)',
              'rgba(168, 85, 247, 1)',
              'rgba(251, 146, 60, 1)',
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
              label: function (context: any) {
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
    console.log('Pie chart created successfully')
  } catch (error) {
    console.error('Fehler beim Erstellen des Pie-Charts:', error)
    pieChartLoaded.value = false
  }
}

const createBarChart = async () => {
  if (!barChartCanvas.value) {
    console.log('Bar chart canvas not found')
    return
  }

  try {
    console.log('Creating bar chart...')

    // Dynamisch Chart.js importieren
    const { Chart } = await import('chart.js/auto')
    console.log('Chart.js imported successfully for bar chart')

    // Bestehenden Chart zerstören
    if (barChartInstance) {
      barChartInstance.destroy()
    }

    const ctx = barChartCanvas.value.getContext('2d')
    if (!ctx) {
      console.log('Could not get 2D context for bar chart')
      return
    }

    const data = tagData[selectedPeriod.value as keyof typeof tagData] || tagData.daily
    console.log('Bar chart data:', data)

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
              text: 'Anzahl',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Tags',
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    })

    barChartLoaded.value = true
    console.log('Bar chart created successfully')
  } catch (error) {
    console.error('Fehler beim Erstellen des Bar-Charts:', error)
    barChartLoaded.value = false
  }
}

// Charts erstellen wenn Komponente gemountet ist
onMounted(() => {
  console.log('UsageAdditionalCharts mounted - creating charts...')
  setTimeout(() => {
    createPieChart()
    createBarChart()
  }, 100)
})

// Charts aktualisieren wenn sich die Periode ändert
watch(selectedPeriod, () => {
  console.log('Period changed to:', selectedPeriod.value)
  setTimeout(() => {
    createPieChart()
    createBarChart()
  }, 100)
})

// Cleanup beim Unmount
onMounted(() => {
  return () => {
    if (pieChartInstance) {
      pieChartInstance.destroy()
    }
    if (barChartInstance) {
      barChartInstance.destroy()
    }
  }
})
</script>
