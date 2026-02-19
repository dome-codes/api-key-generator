import type { ApiKeyDisplay } from '@/types/frontend'
import { apiKeyService } from '@/services/apiService'
import { computed, ref } from 'vue'

interface UserProfile {
  value?: {
    name?: string
  }
}

export function useApiKeys(userProfile: UserProfile) {
  const keys = ref<ApiKeyDisplay[]>([])
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
    return keys.value.map((key: ApiKeyDisplay) => ({
      id: key.id,
      apiKey: key.apiKey || key.id,
      name: key.name,
      permissions: key.permissions || 'api-access',
      createdAt: key.createdAt,
      createdBy: key.createdBy || userProfile.value?.name || 'Unknown',
      validUntil: key.validUntil || 'Never',
      lastUsed: key.lastUsed || 'Never',
      status: key.status || 'active',
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

      createdSecret.value = (data.secret as string) || (data.token as string) || ''
      createdKeyName.value = (data.name as string) || newKeyName.value
      createdKeyPermissions.value = ['api-access']
      createdKeyValidUntil.value =
        (data.expiresAt as string) || (data.validUntil as string) || 'Never'
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
    } catch (_err) {
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
