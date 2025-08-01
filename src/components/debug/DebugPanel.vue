<script setup lang="ts">
import { hasPermission } from '@/auth/keycloak'

interface Props {
  showDebugInfo: boolean
  showDebugMode: boolean
  tokenInfo: any
  userRoles: string[]
  highestRole: string
  isApiAdmin: boolean
}

defineProps<Props>()
</script>

<template>
  <div v-if="showDebugInfo && showDebugMode" class="bg-yellow-50 border-b border-yellow-200 p-4">
    <div class="max-w-6xl mx-auto">
      <h3 class="text-sm font-semibold text-yellow-800 mb-2">🔧 Debug Information</h3>
      <div v-if="tokenInfo" class="text-xs text-yellow-700 space-y-1">
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
        <div><strong>User Roles:</strong> {{ userRoles.join(', ') }}</div>
        <div><strong>Highest Role:</strong> {{ highestRole }}</div>
        <div><strong>Is API Admin:</strong> {{ isApiAdmin ? 'Yes' : 'No' }}</div>
        <div>
          <strong>Can View Admin Usage:</strong>
          {{ hasPermission('canViewAdminUsage') ? 'Yes' : 'No' }}
        </div>
      </div>
      <div v-else class="text-xs text-yellow-600">Token-Informationen werden geladen...</div>
    </div>
  </div>
</template>
