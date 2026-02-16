<script setup lang="ts">
import { getHighestRole, getUserInfo, hasPermission } from '@/auth/keycloak'
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

  const groups = Array.isArray(userInfo.groups) ? userInfo.groups : []
  return {
    userId: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name,
    givenName: userInfo.given_name,
    familyName: userInfo.family_name,
    preferredUsername: userInfo.preferred_username,
    groups,
    issuedAt: userInfo.iat ? new Date(userInfo.iat * 1000) : null,
    expiresAt: userInfo.exp ? new Date(userInfo.exp * 1000) : null,
    isExpired: userInfo.exp ? new Date() > new Date(userInfo.exp * 1000) : false,
  }
})

// Rollen/Berechtigungen für Anzeige (computed, damit reaktiv)
const highestRole = computed(() => getHighestRole())
const canUseAdminFeatures = computed(() => hasPermission('canUseAdminFeatures'))
const canCreateKeys = computed(() => hasPermission('canCreateKeys'))
const canSeeOwnUsage = computed(() => hasPermission('canSeeOwnUsage'))
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
        <div><strong>Highest Role:</strong> {{ highestRole }}</div>
        <div><strong>Can Use Admin Features:</strong> {{ canUseAdminFeatures ? 'Yes' : 'No' }}</div>
        <div><strong>Can Create Keys:</strong> {{ canCreateKeys ? 'Yes' : 'No' }}</div>
        <div><strong>Can See Own Usage:</strong> {{ canSeeOwnUsage ? 'Yes' : 'No' }}</div>
      </div>
      <div v-else class="text-xs text-yellow-600">Token-Informationen werden geladen...</div>
    </div>
  </div>
</template>
