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

  // Logout-Funktion
  const handleLogout = () => {
    keycloak.logout()
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
