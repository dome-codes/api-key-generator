<script setup lang="ts">
import { getHighestRole, getUserInfo, getUserRoles, hasPermission } from '@/auth/keycloak'
import { computed } from 'vue'

interface Props {
  showDebugMode: boolean
  showDebugInfo: boolean
}

defineProps<Props>()

// Token-Informationen berechnen
const tokenInfo = computed(() => {
  const userInfo = getUserInfo()
  if (!userInfo) return null

  return {
    userId: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name,
    givenName: userInfo.given_name,
    familyName: userInfo.family_name,
    preferredUsername: userInfo.preferred_username,
    groups: userInfo.groups || [],
    issuedAt: userInfo.iat ? new Date(userInfo.iat * 1000) : null,
    expiresAt: userInfo.exp ? new Date(userInfo.exp * 1000) : null,
    isExpired: userInfo.exp ? new Date() > new Date(userInfo.exp * 1000) : false,
  }
})
</script>

<template>
  <div v-if="showDebugMode && showDebugInfo" class="bg-yellow-50 border-b border-yellow-200 p-4">
    <div class="max-w-6xl mx-auto">
      <h3 class="text-sm font-semibold text-yellow-800 mb-2">🔧 Debug Information</h3>
      <div v-if="tokenInfo" class="text-xs text-yellow-700 space-y-1">
        <!-- Token-Informationen -->
        <div><strong>User ID:</strong> {{ tokenInfo.userId }}</div>
        <div><strong>Email:</strong> {{ tokenInfo.email }}</div>
        <div><strong>Name:</strong> {{ tokenInfo.name }}</div>
        <div><strong>Given Name:</strong> {{ tokenInfo.givenName }}</div>
        <div><strong>Family Name:</strong> {{ tokenInfo.familyName }}</div>
        <div><strong>Preferred Username:</strong> {{ tokenInfo.preferredUsername }}</div>
        <div><strong>Groups:</strong> {{ tokenInfo.groups.join(', ') }}</div>
        <div><strong>Issued At:</strong> {{ tokenInfo.issuedAt?.toLocaleString() }}</div>
        <div><strong>Expires At:</strong> {{ tokenInfo.expiresAt?.toLocaleString() }}</div>
        <div><strong>Is Expired:</strong> {{ tokenInfo.isExpired ? 'Yes' : 'No' }}</div>

        <hr class="my-2 border-yellow-300" />

        <!-- Rollen und Berechtigungen -->
        <div><strong>User Roles:</strong> {{ getUserRoles().join(', ') }}</div>
        <div><strong>Highest Role:</strong> {{ getHighestRole() }}</div>
        <div>
          <strong>Is API Admin:</strong> {{ hasPermission('canViewAdminUsage') ? 'Yes' : 'No' }}
        </div>
        <div>
          <strong>Can View Admin Usage:</strong>
          {{ hasPermission('canViewAdminUsage') ? 'Yes' : 'No' }}
        </div>
        <div>
          <strong>Can Create Keys:</strong>
          {{ hasPermission('canCreateKeys') ? 'Yes' : 'No' }}
        </div>
        <div>
          <strong>Can Edit Keys:</strong>
          {{ hasPermission('canEditOwnKeys') ? 'Yes' : 'No' }}
        </div>
        <div>
          <strong>Can Deactivate Keys:</strong>
          {{ hasPermission('canDeactivateOwnKeys') ? 'Yes' : 'No' }}
        </div>
        <div>
          <strong>Can View Usage:</strong>
          {{ hasPermission('canViewOwnUsage') ? 'Yes' : 'No' }}
        </div>
      </div>
      <div v-else class="text-xs text-yellow-600">Token-Informationen werden geladen...</div>
    </div>
  </div>
</template>
