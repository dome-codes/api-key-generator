import type { MobaRagApiKey } from '@/api/types/types'
import { apiKeyService } from '@/services/apiService'
import { computed, ref } from 'vue'

// Legacy interface für Kompatibilität mit bestehenden Komponenten
interface LegacyApiKey {
  apiKey: string
  name: string
  permissions: string
  createdAt: string
  createdBy: string
  validUntil: string
  lastUsed: string
  status: string
}

interface UserProfile {
  value?: {
    name?: string
  }
}

export function useApiKeys(userProfile: UserProfile) {
  const keys = ref<MobaRagApiKey[]>([])
  const isLoading = ref(false)
  const error = ref('')
  const isCreating = ref(false)

  const newKeyName = ref('')
  const newKeyPermissions = ref<string[]>(['api-access'])
  const createdSecret = ref('')
  const createdKeyName = ref('')
  const createdKeyPermissions = ref<string[]>([])
  const createdKeyValidUntil = ref('')
  const createdKeyCreatedBy = ref('')
  const editingKey = ref<string | null>(null)
  const editingName = ref('')
  const showRevokeSuccessMessage = ref(false)

  // Legacy-Kompatibilität für bestehende Komponenten
  const legacyKeys = computed(() => {
    return keys.value.map((key: MobaRagApiKey) => ({
      id: key.id,
      apiKey: key.id,
      name: key.name,
      permissions: key.permissions.join(', '),
      createdAt: key.created_at,
      // TODO: createdBy can be retrieved from Keycloak later
      createdBy: userProfile.value?.name || 'Unknown',
      validUntil: key.expires_at || 'Never',
      lastUsed: 'Never',
      status: key.is_active ? 'active' : 'revoked',
    }))
  })

  const loadKeys = async () => {
    isLoading.value = true
    error.value = ''
    try {
      const data = await apiKeyService.getApiKeys()
      keys.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Laden der API-Keys'
    } finally {
      isLoading.value = false
    }
  }

  const createKey = async () => {
    isCreating.value = true
    error.value = ''
    try {
      const data = await apiKeyService.createApiKey(newKeyName.value, newKeyPermissions.value)

      createdSecret.value = data.secret || ''
      createdKeyName.value = data.name
      createdKeyPermissions.value = data.permissions
      createdKeyValidUntil.value = data.expires_at || 'Never'
      createdKeyCreatedBy.value = userProfile.value.name
      await loadKeys()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Erstellen des API-Keys'
    } finally {
      isCreating.value = false
    }
  }

  const revokeKey = async (keyId: string) => {
    error.value = ''
    try {
      await apiKeyService.deactivateApiKey(keyId)
      await loadKeys()
      showRevokeSuccessMessage.value = true
      setTimeout(() => {
        showRevokeSuccessMessage.value = false
      }, 3000)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Deaktivieren'
    }
  }

  const copyApiKey = async (apiKey: string) => {
    try {
      await navigator.clipboard.writeText(apiKey)
      return true
    } catch (err) {
      error.value = 'Fehler beim Kopieren'
      return false
    }
  }

  return {
    keys,
    isLoading,
    error,
    isCreating,
    newKeyName,
    newKeyPermissions,
    createdSecret,
    createdKeyName,
    createdKeyPermissions,
    createdKeyValidUntil,
    createdKeyCreatedBy,
    editingKey,
    editingName,
    showRevokeSuccessMessage,
    legacyKeys,
    loadKeys,
    createKey,
    revokeKey,
    copyApiKey,
  }
}
