import type { MobaRagApiKey } from '@/api/types/types'
import { ref } from 'vue'

// Legacy interface für Kompatibilität mit bestehenden Komponenten
interface LegacyApiKey {
  id: string
  apiKey: string
  name: string
  permissions: string
  createdAt: string
  createdBy: string
  validUntil: string
  lastUsed: string
  status: string
}

export function useModals() {
  const showEditModal = ref(false)
  const editModalName = ref('')
  const editModalPermissions = ref<string[]>([])
  const editModalKey = ref<MobaRagApiKey | null>(null)
  const showEditSuccessMessage = ref(false)
  const showCreateSuccessMessage = ref(false)
  const showCreateModal = ref(false)
  const showKeyDisplayModal = ref(false)
  const showSuccessMessage = ref(false)

  function startEditing(key: LegacyApiKey, keys: MobaRagApiKey[]) {
    const newKey = keys.find((k: MobaRagApiKey) => k.id === key.id)
    if (!newKey) return

    editModalName.value = newKey.name
    editModalPermissions.value = [...newKey.permissions]
    editModalKey.value = newKey
    showEditModal.value = true
  }

  function closeEditModal() {
    showEditModal.value = false
    editModalKey.value = null
  }

  function openModal() {
    showCreateModal.value = true
  }

  function closeCreateModal() {
    showCreateModal.value = false
  }

  function closeKeyDisplayModal() {
    showKeyDisplayModal.value = false
  }

  function showSuccess() {
    showSuccessMessage.value = true
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 3000)
  }

  function showEditSuccess() {
    showEditSuccessMessage.value = true
    setTimeout(() => {
      showEditSuccessMessage.value = false
    }, 3000)
  }

  function showCreateSuccess() {
    showCreateSuccessMessage.value = true
    setTimeout(() => {
      showCreateSuccessMessage.value = false
    }, 3000)
  }

  return {
    showEditModal,
    editModalName,
    editModalPermissions,
    editModalKey,
    showEditSuccessMessage,
    showCreateSuccessMessage,
    showCreateModal,
    showKeyDisplayModal,
    showSuccessMessage,
    startEditing,
    closeEditModal,
    openModal,
    closeCreateModal,
    closeKeyDisplayModal,
    showSuccess,
    showEditSuccess,
    showCreateSuccess,
  }
}
