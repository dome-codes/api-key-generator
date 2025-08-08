import { getHighestRole, getUserInfo, getUserRoles, hasPermission, keycloak } from '@/auth/keycloak'
import { computed } from 'vue'

export function useAuth() {
  // Benutzerinformationen aus Keycloak
  const userProfile = computed(() => {
    const userInfo = getUserInfo()
    if (userInfo) {
      const name =
        userInfo.name || userInfo.preferred_username || userInfo.email || 'Unbekannter Benutzer'
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`
      return { name, avatar }
    }
    return {
      name: 'Unbekannter Benutzer',
      avatar: 'https://ui-avatars.com/api/?name=Unknown&background=0D8ABC&color=fff',
    }
  })

  // Rollenbasierte Computed Properties
  const userRoles = computed(() => getUserRoles())
  const highestRole = computed(() => getHighestRole())
  const isApiAdmin = computed(() => hasPermission('canViewAdminUsage'))
  const canCreateKeys = computed(() => hasPermission('canCreateKeys'))
  const canViewUsage = computed(() => hasPermission('canViewOwnUsage'))

  // Logout-Funktion
  const handleLogout = () => {
    keycloak.logout({})
  }

  return {
    userProfile,
    userRoles,
    highestRole,
    isApiAdmin,
    canCreateKeys,
    canViewUsage,
    handleLogout,
  }
}
