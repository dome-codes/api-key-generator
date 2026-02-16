import { getHighestRole, getUserInfo, getUserRoles, hasPermission, keycloak } from '@/auth/keycloak'
import { computed } from 'vue'

export function useAuth() {
  // Benutzerinformationen aus Keycloak
  const userProfile = computed(() => {
    const userInfo = getUserInfo()
    console.log('🔍 [useAuth] getUserInfo() returned:', userInfo)
    
    if (userInfo) {
      const name =
        userInfo.name || userInfo.preferred_username || userInfo.email || 'Unbekannter Benutzer'
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e00&color=fff`
      console.log('🔍 [useAuth] User profile:', { name, avatar })
      return { name, avatar }
    }
    
    // Fallback: Prüfe ob Keycloak-Bypass aktiv ist
    const bypassActive = import.meta.env.DEV && 
      (import.meta.env.VITE_BYPASS_KEYCLOAK === 'true' || localStorage.getItem('bypassKeycloak') === 'true')
    
    if (bypassActive) {
      // Verwende Mock-Daten wenn Bypass aktiv ist
      const mockName = 'Mock Admin User'
      const mockAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(mockName)}&background=e00&color=fff`
      console.log('🔍 [useAuth] Using mock profile (bypass active):', { name: mockName, avatar: mockAvatar })
      return { name: mockName, avatar: mockAvatar }
    }
    
    console.log('🔍 [useAuth] No user info found, using fallback')
    return {
      name: 'Unbekannter Benutzer',
      avatar: 'https://ui-avatars.com/api/?name=Unknown&background=e00&color=fff',
    }
  })

  // Rollenbasierte Computed Properties
  const userRoles = computed(() => getUserRoles())
  const highestRole = computed(() => getHighestRole())
  const isAdmin = computed(() => hasPermission('canViewAdminUsage'))
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
    isAdmin,
    canCreateKeys,
    canViewUsage,
    handleLogout,
  }
}
