import {
  getHighestRole,
  getUserInfo,
  UserRole,
  hasPermission,
  keycloak,
  clearTokenStorage,
} from '@/auth/keycloak'
import { computed } from 'vue'

export function useAuth() {
  // Benutzerinformationen aus Keycloak
  const userProfile = computed(() => {
    const userInfo = getUserInfo()
    if (userInfo) {
      const name =
        userInfo.name || userInfo.preferred_username || userInfo.email || 'Unbekannter Benutzer'
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=608ABC&color=FFF`
      return { name, avatar }
    }
    return {
      name: 'Unbekannter Benutzer',
      avatar: 'https://ui-avatars.com/api/?name=Unknown&background=0D8ABC&color=FFF',
    }
  })

  // Rollenbasierte Computed Properties
  const highestRole = computed(() => getHighestRole())
  const isAdmin = computed(() => highestRole.value === UserRole.ADMIN)
  const isUser = computed(() => highestRole.value === UserRole.USER)
  const isTechnical = computed(() => highestRole.value === UserRole.TECHNICAL)

  // Feature Permissions
  const canUseAdminFeatures = computed(() => hasPermission('canUseAdminFeatures'))
  const canCreateKeys = computed(() => hasPermission('canCreateKeys'))
  const canSeeOwnUsage = computed(() => hasPermission('canSeeOwnUsage'))

  // Logout-Funktion: wirft nie – bei fehlendem Keycloak/Token immer Fallback (Session leeren, Reload)
  const handleLogout = () => {
    // WICHTIG: Token-Cache explizit leeren BEVOR Keycloak logout aufgerufen wird
    // Verhindert, dass nach neuem Login der alte Token verwendet wird
    clearTokenStorage()

    const doFallback = () => {
      try {
        sessionStorage.clear()
        localStorage.removeItem('bypassKeycloak')
      } catch (_) {}
      window.location.href = window.location.pathname || '/'
      window.location.reload()
    }
    try {
      const k = keycloak
      if (k != null && typeof (k as { logout?: () => void }).logout === 'function') {
        ;(k as { logout: () => void }).logout()
        return
      }
    } catch (_) {
      // z. B. keycloak oder logout undefined → Fallback
    }
    doFallback()
  }

  return {
    userProfile,
    highestRole,
    isAdmin,
    isUser,
    isTechnical,
    canUseAdminFeatures,
    canCreateKeys,
    canSeeOwnUsage,
    handleLogout,
  }
}
