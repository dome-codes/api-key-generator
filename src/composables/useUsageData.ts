import { ref, computed, watch } from 'vue'
import { usageService } from '@/services/apiService'
import { useAuth } from '@/composables/useAuth'

export function useUsage() {
  const { isApiAdmin } = useAuth()

  // Own usage state
  const ownUsageData = ref<any[]>([])
  const ownRawUsageData = ref<any[]>([])
  const isLoadingOwn = ref(false)
  const ownError = ref<string | null>(null)

  // Admin usage state
  const adminUsageData = ref<any[]>([])
  const adminRawUsageData = ref<any[]>([])
  const isLoadingAdmin = ref(false)
  const adminError = ref<string | null>(null)

  // Filter state
  const ownTimeRange = ref('30d')
  const ownModelType = ref('')
  const ownFromDate = ref('')
  const ownToDate = ref('')
  const ownView = ref<'overview' | 'detailed'>('overview')

  const adminTimeRange = ref('30d')
  const adminModelType = ref('')
  const adminUser = ref('')
  const adminFromDate = ref('')
  const adminToDate = ref('')
  const adminView = ref<'overview' | 'detailed'>('overview')

  // Date calculation helper
  const calculateDateRange = (timeRange: string, fromDate: string, toDate: string) => {
    const today = new Date()
    let startDate: Date
    let endDate: Date

    switch (timeRange) {
      case '7d':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        endDate = today
        break
      case '30d':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate = today
        break
      case '90d':
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        endDate = today
        break
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = today
        break
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case 'custom':
        startDate = fromDate ? new Date(fromDate) : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate = toDate ? new Date(toDate) : today
        break
      default:
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate = today
    }

    return {
      fromDate: startDate.toISOString().split('T')[0],
      toDate: endDate.toISOString().split('T')[0],
    }
  }

  // Load own usage data
  const loadOwnUsageWithGrouping = async () => {
    try {
      isLoadingOwn.value = true
      ownError.value = null

      const { fromDate, toDate } = calculateDateRange(ownTimeRange.value, ownFromDate.value, ownToDate.value)

      console.log('🔍 [USAGE-COMPOSABLE] Loading own usage with:', {
        timeRange: ownTimeRange.value,
        modelType: ownModelType.value,
        fromDate,
        toDate,
        view: ownView.value,
      })

      // Determine grouping based on view
      let grouping: string | undefined = undefined

      // Nur gruppieren wenn wir Diagramme anzeigen wollen
      if (ownView.value === 'overview') {
        // Verwende 'day,month' für vollständige Datumsinformation
        grouping = 'day,month'
      }
      // Für 'detailed' view keine Gruppierung - zeige Rohdaten

      // Lade gruppierte Daten für Hauptdiagramm
      if (grouping) {
        const response = await usageService.getUsageSummaryWithGrouping(
          grouping,
          fromDate,
          toDate,
          ownModelType.value || undefined,
        )
        ownUsageData.value = response.usage || []
        console.log('🔍 [USAGE-COMPOSABLE] Grouped data loaded:', ownUsageData.value.length, 'items')
      } else {
        ownUsageData.value = []
      }

      // Lade Rohdaten für Summary, zusätzliche Diagramme und detaillierte Tabelle
      const rawResponse = await usageService.getOwnUsage(fromDate, toDate)
      ownRawUsageData.value = rawResponse.usage || []
      console.log('🔍 [USAGE-COMPOSABLE] Raw data loaded:', ownRawUsageData.value.length, 'items')
    } catch (error) {
      console.error('🔍 [USAGE-COMPOSABLE] Error loading own usage:', error)
      ownError.value = 'Fehler beim Laden der Nutzungsdaten'
      ownUsageData.value = []
      ownRawUsageData.value = []
    } finally {
      isLoadingOwn.value = false
    }
  }

  // Load admin usage data
  const loadAdminUsageWithGrouping = async () => {
    if (!isApiAdmin.value) return

    try {
      isLoadingAdmin.value = true
      adminError.value = null

      const { fromDate, toDate } = calculateDateRange(adminTimeRange.value, adminFromDate.value, adminToDate.value)

      console.log('🔍 [USAGE-COMPOSABLE] Loading admin usage with:', {
        timeRange: adminTimeRange.value,
        modelType: adminModelType.value,
        user: adminUser.value,
        fromDate,
        toDate,
        view: adminView.value,
      })

      // Determine grouping based on view
      let grouping: string | undefined = undefined

      // Nur gruppieren wenn wir Diagramme anzeigen wollen
      if (adminView.value === 'overview') {
        // Verwende 'day,month' für vollständige Datumsinformation
        grouping = 'day,month'
      }
      // Für 'detailed' view keine Gruppierung - zeige Rohdaten

      // Lade gruppierte Daten für Hauptdiagramm
      if (grouping) {
        const response = await usageService.getAdminUsageSummaryWithGrouping(
          grouping,
          fromDate,
          toDate,
          adminModelType.value || undefined,
          adminUser.value || undefined,
        )
        adminUsageData.value = response.usage || []
        console.log('🔍 [USAGE-COMPOSABLE] Admin grouped data loaded:', adminUsageData.value.length, 'items')
      } else {
        adminUsageData.value = []
      }

      // Lade Rohdaten für Summary, zusätzliche Diagramme und detaillierte Tabelle
      const rawResponse = await usageService.getAdminUsage(
        fromDate,
        toDate,
        adminModelType.value || undefined,
        adminUser.value || undefined,
      )
      adminRawUsageData.value = rawResponse.usage || []
      console.log('🔍 [USAGE-COMPOSABLE] Admin raw data loaded:', adminRawUsageData.value.length, 'items')
    } catch (error) {
      console.error('🔍 [USAGE-COMPOSABLE] Error loading admin usage:', error)
      adminError.value = 'Fehler beim Laden der Admin-Nutzungsdaten'
      adminUsageData.value = []
      adminRawUsageData.value = []
    } finally {
      isLoadingAdmin.value = false
    }
  }

  // Computed properties for summary calculations
  const ownUsageSummary = computed(() => {
    // Verwende Rohdaten für Summary-Berechnung, da diese die vollständigen Werte haben
    const dataToUse = ownRawUsageData.value.length > 0 ? ownRawUsageData.value : ownUsageData.value

    if (!dataToUse || dataToUse.length === 0) {
      return {
        tokensIn: 0,
        tokensOut: 0,
        requests: 0,
        cost: 0,
      }
    }

    return dataToUse.reduce(
      (acc, item) => {
        // Verwende die korrekten Felder basierend auf dem API-Response-Typ
        const tokensIn = item.requestTokens || item.tokensIn || 0
        const tokensOut = item.responseTokens || item.tokensOut || 0
        const requests = item.requests || 1
        const cost = item.cost || 0
        
        acc.tokensIn += tokensIn
        acc.tokensOut += tokensOut
        acc.requests += requests
        acc.cost += cost
        return acc
      },
      { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0 },
    )
  })

  const adminUsageSummary = computed(() => {
    // Verwende Rohdaten für Summary-Berechnung, da diese die vollständigen Werte haben
    const dataToUse =
      adminRawUsageData.value.length > 0 ? adminRawUsageData.value : adminUsageData.value

    if (!dataToUse || dataToUse.length === 0) {
      return {
        tokensIn: 0,
        tokensOut: 0,
        requests: 0,
        cost: 0,
        uniqueUsers: 0,
      }
    }

    const summary = dataToUse.reduce(
      (acc, item) => {
        // Verwende die korrekten Felder basierend auf dem API-Response-Typ
        const tokensIn = item.requestTokens || item.tokensIn || 0
        const tokensOut = item.responseTokens || item.tokensOut || 0
        const requests = item.requests || 1
        const cost = item.cost || 0
        
        acc.tokensIn += tokensIn
        acc.tokensOut += tokensOut
        acc.requests += requests
        acc.cost += cost
        return acc
      },
      { tokensIn: 0, tokensOut: 0, requests: 0, cost: 0, uniqueUsers: 0 },
    )

    // Berechne eindeutige Benutzer
    const uniqueUsers = new Set(dataToUse.map((item) => item.technicalUserId)).size
    summary.uniqueUsers = uniqueUsers

    return summary
  })

  // Chart data computed properties
  const ownChartData = computed(() => {
    if (!ownUsageData.value || ownUsageData.value.length === 0) {
      return {
        labels: [],
        tokensIn: [],
        tokensOut: [],
        requests: [],
      }
    }

    // Erstelle Labels basierend auf Chart-Periode
    const labels = generateChartLabels('daily', ownUsageData.value)
    const tokensIn = ownUsageData.value.map((item) => item.tokensIn || 0)
    const tokensOut = ownUsageData.value.map((item) => item.tokensOut || 0)
    const requests = ownUsageData.value.map((item) => item.requests || 1)

    return {
      labels,
      tokensIn,
      tokensOut,
      requests,
    }
  })

  const adminChartData = computed(() => {
    if (!adminUsageData.value || adminUsageData.value.length === 0) {
      return {
        labels: [],
        tokensIn: [],
        tokensOut: [],
        requests: [],
      }
    }

    // Erstelle Labels basierend auf Chart-Periode
    const labels = generateChartLabels('daily', adminUsageData.value)
    const tokensIn = adminUsageData.value.map((item) => item.tokensIn || 0)
    const tokensOut = adminUsageData.value.map((item) => item.tokensOut || 0)
    const requests = adminUsageData.value.map((item) => item.requests || 1)

    return {
      labels,
      tokensIn,
      tokensOut,
      requests,
    }
  })

  // Helper function for chart labels
  const generateChartLabels = (period: string, data: any[]) => {
    if (period === 'daily') {
      const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
      return weekdays
    } else if (period === 'weekly') {
      return data.map((_, index) => `Woche ${index + 1}`)
    } else if (period === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
      return data.map((_, index) => months[index % 12])
    } else {
      // Fallback: Verwende createDate falls verfügbar
      return data.map((item) => {
        if (item.createDate) {
          return new Date(item.createDate).toLocaleDateString('de-DE')
        } else if (item.year && item.month && item.day) {
          return new Date(item.year, item.month - 1, item.day).toLocaleDateString('de-DE')
        } else if (item.year && item.month) {
          return new Date(item.year, item.month - 1, 1).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
        } else if (item.year) {
          return new Date(item.year, 0, 1).toLocaleDateString('de-DE', { year: 'numeric' })
        }
        return 'Unknown'
      })
    }
  }

  // Computed properties for view states
  const showOwnChart = computed(() => {
    return ownView.value === 'overview' || ownView.value === 'chart'
  })

  const showOwnDetails = computed(() => {
    return ownView.value === 'detailed'
  })

  const showAdminChart = computed(() => {
    return adminView.value === 'overview' || adminView.value === 'chart'
  })

  const showAdminDetails = computed(() => {
    return adminView.value === 'detailed'
  })

  // Computed property für eindeutige Benutzer (für Admin-Filter)
  const uniqueUsers = computed(() => {
    if (!adminUsageData.value || adminUsageData.value.length === 0) {
      return []
    }

    // Extrahiere eindeutige Benutzer aus den Admin-Usage-Daten
    const userMap = new Map<string, string>()

    adminUsageData.value.forEach((item) => {
      const userId = item.technicalUserId || item.apiKeyId || 'unknown'
      const userName = item.technicalUserName || `User ${userId}`

      if (!userMap.has(userId)) {
        userMap.set(userId, userName)
      }
    })

    // Konvertiere zu Array und sortiere nach Benutzername
    return Array.from(userMap.entries())
      .map(([userId, userName]) => ({
        id: userId,
        name: userName,
        displayName: `${userId} (${userName})`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  // Watchers for filter changes
  watch(
    [ownTimeRange, ownModelType, ownView],
    async () => {
      console.log('🔍 [USAGE-COMPOSABLE] Own filter changed:', {
        timeRange: ownTimeRange.value,
        modelType: ownModelType.value,
        view: ownView.value,
      })
      await loadOwnUsageWithGrouping()
    },
    { immediate: false },
  )

  watch(
    [adminTimeRange, adminModelType, adminUser, adminView],
    async () => {
      console.log('🔍 [USAGE-COMPOSABLE] Admin filter changed:', {
        timeRange: adminTimeRange.value,
        modelType: adminModelType.value,
        user: adminUser.value,
        view: adminView.value,
      })
      await loadAdminUsageWithGrouping()
    },
    { immediate: false },
  )

  return {
    // State
    ownUsageData,
    ownRawUsageData,
    isLoadingOwn,
    ownError,
    adminUsageData,
    adminRawUsageData,
    isLoadingAdmin,
    adminError,
    
    // Filter state
    ownTimeRange,
    ownModelType,
    ownFromDate,
    ownToDate,
    ownView,
    adminTimeRange,
    adminModelType,
    adminUser,
    adminFromDate,
    adminToDate,
    adminView,
    
    // Computed
    ownUsageSummary,
    adminUsageSummary,
    ownChartData,
    adminChartData,
    showOwnChart,
    showOwnDetails,
    showAdminChart,
    showAdminDetails,
    uniqueUsers,
    
    // Methods
    loadOwnUsageWithGrouping,
    loadAdminUsageWithGrouping,
    calculateDateRange,
  }
}
