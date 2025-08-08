import { debugToken, getHighestRole, getUserRoles, hasPermission } from '@/auth/keycloak'
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

  // Debug-Log-Funktion (nur im Debug-Modus)
  const debugLog = (...args: any[]) => {
    if (showDebugMode.value) {
      console.log(...args)
    }
  }

  // Token-Debug-Funktion (zeigt Frontend-Info UND Console-Logs)
  const debugTokenInfo = () => {
    if (showDebugMode.value) {
      // Toggle Debug-Info anzeigen/verstecken
      showDebugInfo.value = !showDebugInfo.value

      // Console-Logs
      debugToken()
      debugLog('🔍 Zusätzliche Debug-Info:')
      debugLog('User Roles:', getUserRoles())
      debugLog('Highest Role:', getHighestRole())
      debugLog('Is API Admin:', hasPermission('canViewAdminUsage'))
      debugLog('Can View Admin Usage:', hasPermission('canViewAdminUsage'))
      debugLog('Can Create Keys:', hasPermission('canCreateKeys'))
      debugLog('Can Edit Keys:', hasPermission('canEditOwnKeys'))
      debugLog('Can Deactivate Keys:', hasPermission('canDeactivateOwnKeys'))
      debugLog('Can View Usage:', hasPermission('canViewOwnUsage'))
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
