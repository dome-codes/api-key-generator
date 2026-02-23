<script setup lang="ts">
import {
  getToken,
  initKeycloak,
  hasPermission,
  hasValidAppUser,
  setTokenReadyForApi,
  type UserRole,
  ROLE_PERMISSIONS,
} from '@/auth/keycloak'
import { debugLog } from '@/utils/debugLog'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'

const route = useRoute()
const router = useRouter()
const isAuthenticated = ref(false)
const isLoading = ref(true)
const tokenReady = ref(false)
const canRenderRoute = computed(() => {
  if (route.meta.requiresAuth === false) return true
  return isAuthenticated.value && tokenReady.value
})

const redirectToNichtAutorisiert = (reason?: 'not_authenticated' | 'no_permission' | 'error') => {
  router.push({ name: 'NichtAutorisiert', query: reason ? { reason } : {} })
}

const initializeAuth = async () => {
  try {
    const authenticated = await initKeycloak()
    isAuthenticated.value = authenticated

    if (authenticated) {
      if (!hasValidAppUser()) {
        isAuthenticated.value = false
        redirectToNichtAutorisiert('no_permission')
        return
      }
      debugLog('Benutzer erfolgreich authentifiziert')
      isAuthenticated.value = true

      if (route.meta.requiredPermissions && route.meta.requiredPermissions.length > 0) {
        const { hasPermission } = await import('@/auth/keycloak')
        const hasAllPermissions = route.meta.requiredPermissions.every((permission) =>
          hasPermission(permission as keyof (typeof ROLE_PERMISSIONS)[UserRole]),
        )
        if (!hasAllPermissions) {
          redirectToNichtAutorisiert('no_permission')
          return
        }
      }

      if (route.meta.requiredRole) {
        const { getHighestRole } = await import('@/auth/keycloak')
        const userRole = getHighestRole()
        if (userRole !== route.meta.requiredRole) {
          redirectToNichtAutorisiert('no_permission')
          return
        }
      }

      const token = await getToken()
      if (!token) {
        isAuthenticated.value = false
        redirectToNichtAutorisiert('error')
      } else {
        tokenReady.value = true
        setTokenReadyForApi()
      }
    } else {
      if (route.meta.requiresAuth === false) {
        return
      }
      redirectToNichtAutorisiert('not_authenticated')
    }
  } catch (err) {
    debugLog('Fehler bei der Authentifizierung:', err)
    redirectToNichtAutorisiert('error')
  } finally {
    isLoading.value = false
    setTokenReadyForApi()
  }
}

watch(
  () => route.path,
  () => {
    if (isAuthenticated.value && route.meta.requiredPermissions) {
      const hasAllPermissions = route.meta.requiredPermissions.every((permission) =>
        hasPermission(permission as keyof (typeof ROLE_PERMISSIONS)[UserRole]),
      )
      if (!hasAllPermissions) {
        redirectToNichtAutorisiert('no_permission')
      }
    }
  },
)

onMounted(() => {
  initializeAuth()
})
</script>

<template>
  <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-gray-600">Authentifizierung läuft...</p>
    </div>
  </div>
  <RouterView v-else-if="canRenderRoute" />
  <div v-else class="flex items-center justify-center min-h-screen">
    <p class="text-gray-600">Weiterleitung...</p>
  </div>
</template>
