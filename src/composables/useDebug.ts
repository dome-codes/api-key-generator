import {
  debugToken,
  getHighestRole,
  getToken,
  getTokenInfo,
  getUserRoles,
  hasPermission,
} from '@/auth/keycloak'
import { computed, ref } from 'vue'

export function useDebug() {
  // Debug-Funktionen für Entwicklung
  const showDebugInfo = ref(false)
  const tokenInfo = ref<any>(null)
  const isDevelopment = computed(() => import.meta.env.DEV)
  const showDebugMode = computed(() => isDevelopment.value && (globalThis as any).__SHOW_DEBUG__)

  const loadTokenInfo = async () => {
    if (isDevelopment.value) {
      const token = await getToken()
      if (token) {
        tokenInfo.value = getTokenInfo(token)
      }
    }
  }

  const toggleDebugInfo = () => {
    showDebugInfo.value = !showDebugInfo.value
    if (showDebugInfo.value) {
      loadTokenInfo()
    }
  }

  // Token-Debug-Funktion
  const debugTokenInfo = () => {
    debugToken()
    console.log('🔍 Zusätzliche Debug-Info:')
    console.log('User Roles:', getUserRoles())
    console.log('Highest Role:', getHighestRole())
    console.log('Is API Admin:', hasPermission('canViewAdminUsage'))
    console.log('Can View Admin Usage:', hasPermission('canViewAdminUsage'))
    console.log('Can Create Keys:', hasPermission('canCreateKeys'))
    console.log('Can Edit Keys:', hasPermission('canEditOwnKeys'))
    console.log('Can Deactivate Keys:', hasPermission('canDeactivateOwnKeys'))
    console.log('Can View Usage:', hasPermission('canViewOwnUsage'))
  }

  return {
    showDebugInfo,
    tokenInfo,
    isDevelopment,
    showDebugMode,
    toggleDebugInfo,
    debugTokenInfo,
  }
}
