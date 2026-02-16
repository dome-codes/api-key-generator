import { getHighestRole, getUserInfo, UserRole, hasPermission, keycloak } from '@/auth/keycloak'
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

  // Logout-Funktion (abgesichert: keycloak kann bei Bypass/Reihenfolge noch undefined sein)
  const handleLogout = () => {
    if (keycloak?.logout && typeof keycloak.logout === 'function') {
      keycloak.logout()
    } else {
      // Fallback: Session bereinigen und Seite neu laden (z. B. bei Bypass oder vor Init)
      try {
        sessionStorage.clear()
        localStorage.removeItem('bypassKeycloak')
      } catch (_) {}
      window.location.href = window.location.pathname || '/'
      window.location.reload()
    }
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
