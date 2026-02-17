import type { ApiKeyDisplay } from '@/api/types/frontend'
import { apiKeyService } from '@/services/apiService'
import { computed, ref } from 'vue'

interface UserProfile {
  value?: {
    name?: string
  }
}

export function useApiKeys(userProfile: UserProfile) {
  const keys = ref<any[]>([])
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

  const apiKeys = computed<ApiKeyDisplay[]>(() => {
    return keys.value.map((key: any) => ({
      id: key.id,
      apiKey: key.id,
      name: key.name,
      permissions: 'api-access',
      createdAt: key.createdAt,
      createdBy: userProfile.value?.name || 'Unknown',
      validUntil: key.expiresAt || 'Never',
      lastUsed: 'Never',
      status: key.active ? 'active' : 'revoked',
      userId: key.userId,
      userName: key.userName,
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
      const raw = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
      const secret =
        (raw.secret as string) ??
        (raw.api_key as string) ??
        (raw.apiKey as string) ??
        (raw.value as string) ??
        (raw.key as string) ??
        ''
      createdSecret.value = typeof secret === 'string' ? secret : ''
      createdKeyName.value = (raw.name as string) || (data?.name as string) || ''
      createdKeyPermissions.value = ['api-access']
      createdKeyValidUntil.value =
        (raw.expiresAt as string) || (raw.expires_at as string) || 'Never'
      createdKeyCreatedBy.value = userProfile.value?.name || 'Unknown'
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
    apiKeys,
    loadKeys,
    createKey,
    revokeKey,
    copyApiKey,
  }
}
