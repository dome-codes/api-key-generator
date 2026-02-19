import type { ApiKeyDisplay } from '@/types/frontend'
import { ref } from 'vue'

export function useModals() {
  const showEditModal = ref(false)
  const editModalName = ref('')
  const editModalPermissions = ref<string[]>([])
  const editModalKey = ref<ApiKeyDisplay | null>(null)
  const showEditSuccessMessage = ref(false)
  const showCreateSuccessMessage = ref(false)
  const showCreateModal = ref(false)
  const showKeyDisplayModal = ref(false)
  const showSuccessMessage = ref(false)

  function startEditing(key: ApiKeyDisplay, keys: ApiKeyDisplay[]) {
    const newKey = keys.find((k) => k.id === key.id)
    if (!newKey) return

    editModalName.value = newKey.name
    editModalPermissions.value = (newKey.permissions || 'api-access')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
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
