import { debugToken, getHighestRole, hasPermission } from '@/auth/keycloak'
import { debugLog as baseDebugLog, isDebugLogEnabled } from '@/utils/debugLog'
import { computed, ref } from 'vue'

export function useDebug() {
  const isDevelopment = computed(() => import.meta.env.DEV)

  // Debug-Modus prüfen - VITE_SHOW_DEBUG ODER localStorage
  const showDebugMode = computed(() => {
    const isDev = isDevelopment.value

    // Prüfe verschiedene Debug-Variablen
    const debugFromEnv = import.meta.env.VITE_SHOW_DEBUG === 'true'
    const debugFromLocalStorage = localStorage.getItem('debug') === 'true'

    // Debug ist aktiv wenn:
    // 1. Entwicklungsumgebung UND
    // 2. Eine der Debug-Variablen ist true
    return isDev && (debugFromEnv || debugFromLocalStorage)
  })

  // Debug-Info anzeigen/verstecken
  const showDebugInfo = ref(false)

  // Debug-Log-Funktion (nur im Debug-Modus) - verwendet zentrale Funktion
  const debugLog = (...args: unknown[]) => {
    baseDebugLog(...args)
  }

  // Token-Debug-Funktion (zeigt Frontend-Info UND Console-Logs)
  const debugTokenInfo = () => {
    if (showDebugMode.value) {
      // Toggle Debug-Info anzeigen/verstecken
      showDebugInfo.value = !showDebugInfo.value

      // Console-Logs
      debugToken()
      debugLog('🔍 Zusätzliche Debug-Info:')
      debugLog('Highest Role:', getHighestRole())
      debugLog('Can Use Admin Features:', hasPermission('canUseAdminFeatures'))
      debugLog('Can Create Keys:', hasPermission('canCreateKeys'))
      debugLog('Can See Own Usage:', hasPermission('canSeeOwnUsage'))
    }
  }

  return {
    isDevelopment,
    showDebugMode,
    showDebugInfo,
    debugLog,
    debugTokenInfo,
  }
}
