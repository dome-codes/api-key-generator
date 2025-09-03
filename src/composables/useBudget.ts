import { onMounted, ref } from 'vue'
import { useUsage } from './useUsage'

export interface BudgetConfig {
  monthlyLimit: number
  weeklyLimit: number
  dailyLimit: number
  currency: string
}

export function useBudget() {
  const { usageAggregation, loadDetailedUsageData } = useUsage()

  // Budget configuration
  const budgetConfig = ref<BudgetConfig>({
    monthlyLimit: 100, // Default: 100€ pro Monat
    weeklyLimit: 25, // Default: 25€ pro Woche
    dailyLimit: 5, // Default: 5€ pro Tag
    currency: 'EUR',
  })

  // Current period costs
  const currentMonthCost = ref(0)
  const currentWeekCost = ref(0)
  const currentDayCost = ref(0)

  // Loading state
  const isLoadingBudget = ref(false)

  // Load budget data
  const loadBudgetData = async () => {
    isLoadingBudget.value = true

    try {
      // Lade aktuelle Usage-Daten für den aktuellen Monat
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Lade Daten für verschiedene Zeiträume
      await loadDetailedUsageData({
        fromDate: startOfMonth.toISOString().split('T')[0],
        toDate: now.toISOString().split('T')[0],
      })

      // Berechne Kosten für verschiedene Zeiträume basierend auf den geladenen Daten
      if (usageAggregation.value) {
        // Für dieses Beispiel verwenden wir die Gesamtkosten
        currentMonthCost.value = usageAggregation.value.totalCost

        // Vereinfachte Berechnung für Woche und Tag (proportional)
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const currentDay = now.getDate()

        currentWeekCost.value = (currentMonthCost.value / daysInMonth) * 7
        currentDayCost.value = currentMonthCost.value / daysInMonth
      }

      // Lade gespeicherte Budget-Konfiguration aus localStorage
      loadBudgetConfig()
    } catch (error) {
      console.error('Fehler beim Laden der Budget-Daten:', error)
    } finally {
      isLoadingBudget.value = false
    }
  }

  // Save budget configuration
  const saveBudgetConfig = (config: Partial<BudgetConfig>) => {
    budgetConfig.value = { ...budgetConfig.value, ...config }
    localStorage.setItem('budgetConfig', JSON.stringify(budgetConfig.value))
  }

  // Load budget configuration from localStorage
  const loadBudgetConfig = () => {
    const saved = localStorage.getItem('budgetConfig')
    if (saved) {
      try {
        const config = JSON.parse(saved)
        budgetConfig.value = { ...budgetConfig.value, ...config }
      } catch (error) {
        console.warn('Fehler beim Laden der Budget-Konfiguration:', error)
      }
    }
  }

  // Update budget limits
  const updateBudgetLimit = (type: 'monthly' | 'weekly' | 'daily', limit: number) => {
    switch (type) {
      case 'monthly':
        saveBudgetConfig({ monthlyLimit: limit })
        break
      case 'weekly':
        saveBudgetConfig({ weeklyLimit: limit })
        break
      case 'daily':
        saveBudgetConfig({ dailyLimit: limit })
        break
    }
  }

  // Initialize
  onMounted(() => {
    loadBudgetData()
  })

  return {
    // State
    budgetConfig,
    currentMonthCost,
    currentWeekCost,
    currentDayCost,
    isLoadingBudget,

    // Methods
    loadBudgetData,
    saveBudgetConfig,
    updateBudgetLimit,
  }
}
