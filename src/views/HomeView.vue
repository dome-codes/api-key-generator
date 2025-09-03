<script setup lang="ts">
import type { MobaRagApiKey } from '@/api/types/types'
import ApiKeyCreateModal from '@/components/apikey/ApiKeyCreateModal.vue'
import ApiKeyEditModal from '@/components/apikey/ApiKeyEditModal.vue'
import ApiKeyTable from '@/components/apikey/ApiKeyTable.vue'
import DebugPanel from '@/components/debug/DebugPanel.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import Snackbar from '@/components/ui/Snackbar.vue'
import UsageTabs from '@/components/usage/UsageTabs.vue'
import { useApiKeys } from '@/composables/useApiKeys'
import { useAuth } from '@/composables/useAuth'
import { useBudget } from '@/composables/useBudget'
import { useDebug } from '@/composables/useDebug'
import { useModals } from '@/composables/useModals'
import { useUsage } from '@/composables/useUsage'
import { apiKeyService } from '@/services/apiService'
import { computed, onMounted, ref } from 'vue'

// Legacy interface for backward compatibility
interface LegacyApiKey {
  id: string
  apiKey: string
  name: string
  permissions: string
  createdAt: string
  createdBy: string
  validUntil: string
  lastUsed: string
  status: string // 'active' oder 'revoked' basierend auf is_active
}

// Composables verwenden
const {
  userProfile,
  userRoles,
  highestRole,
  isApiAdmin,
  canCreateKeys,
  canViewUsage,
  handleLogout,
} = useAuth()
const { isDevelopment, showDebugMode, showDebugInfo, debugTokenInfo } = useDebug()
const {
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
} = useApiKeys(userProfile)

const {
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
} = useModals()

// Budget management
const { budgetConfig, currentMonthCost, loadBudgetData } = useBudget()

// Usage data for detailed breakdown
const { usageAggregation, detailedUsageData, loadDetailedUsageData, loadUsageSummary } = useUsage()

// API Key Usage Data from Summarize API (grouped by apiKey)
const apiKeyUsageData = computed(() => {
  const usageMap: { [keyId: string]: { cost: number; tokensIn: number; tokensOut: number } } = {}

  console.log('🔍 [HOMEVIEW] Computing apiKeyUsageData from summarize API...')
  console.log(
    '🔍 [HOMEVIEW] API Keys:',
    legacyKeys.value.map((k) => ({ id: k.id, name: k.name, status: k.status })),
  )
  console.log('🔍 [HOMEVIEW] Usage Summary Data:', detailedUsageData.value)

  // Verwende gruppierte Daten aus der Summarize API
  legacyKeys.value.forEach((key) => {
    // Für deaktivierte API-Keys keine Usage-Daten anzeigen
    if (key.status === 'revoked') {
      usageMap[key.id] = {
        cost: 0,
        tokensIn: 0,
        tokensOut: 0,
      }
      console.log(`🔍 [HOMEVIEW] API Key ${key.name} (${key.id}): Deactivated - no usage data`)
      return
    }

    // Suche nach Usage-Daten für diesen API Key in den gruppierten Daten
    const keyUsage = detailedUsageData.value.filter((item) => item.apiKeyId === key.id)

    console.log(
      `🔍 [HOMEVIEW] API Key ${key.name} (${key.id}): Found ${keyUsage.length} usage records`,
    )
    console.log(
      '🔍 [HOMEVIEW] Available apiKeyIds in detailedUsageData:',
      detailedUsageData.value.map((item) => item.apiKeyId),
    )

    if (keyUsage.length > 0) {
      // Verwende die ersten gruppierten Daten (da bereits nach API Key gruppiert)
      const usage = keyUsage[0]
      const totalCost = usage.cost || 0 // Kosten werden bereits in useUsage berechnet
      const totalTokensIn = usage.tokensIn || 0
      const totalTokensOut = usage.tokensOut || 0

      usageMap[key.id] = {
        cost: totalCost,
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut,
      }

      console.log(
        `🔍 [HOMEVIEW]   → Total: Cost=${totalCost}, Tokens=${totalTokensIn}/${totalTokensOut}`,
      )
    } else {
      // Fallback: Verwende 0-Werte wenn keine Daten vorhanden
      usageMap[key.id] = {
        cost: 0,
        tokensIn: 0,
        tokensOut: 0,
      }

      console.log(`🔍 [HOMEVIEW]   → No usage data found, using 0 values`)
    }
  })

  return usageMap
})

// Sidebar state
const activeSidebar = ref<'api' | 'usage'>('api')

// Modal functions
async function saveEditModal() {
  if (!editModalKey.value) return
  error.value = ''
  try {
    const data = await apiKeyService.rotateApiKey(
      editModalKey.value.id,
      editModalName.value,
      editModalPermissions.value,
    )

    // Show the new key modal with the rotated key data
    createdSecret.value = data.secret || ''
    createdKeyName.value = data.name
    createdKeyPermissions.value = data.permissions
    createdKeyValidUntil.value = data.expires_at || 'Never'
    createdKeyCreatedBy.value = userProfile.value?.name || 'Unknown'

    await loadKeys()
    closeEditModal()
    showKeyDisplayModal.value = true
    showEditSuccess()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Fehler beim Aktualisieren'
  }
}

async function createKeyModal() {
  await createKey()
  closeCreateModal()
  showKeyDisplayModal.value = true
  showCreateSuccess()
}

// Legacy-Funktionen für Kompatibilität
const saveEdit = async (apiKey: string) => {
  const key = keys.value.find((k) => k.id === apiKey)
  if (!key) {
    error.value = 'Schlüssel nicht gefunden'
    return
  }

  await saveEditModal()
  editingKey.value = null
  editingName.value = ''
}

const cancelEdit = () => {
  editingKey.value = null
  editingName.value = ''
}

// Rotate key function
const startRotating = (key: LegacyApiKey, keys: MobaRagApiKey[]) => {
  const foundKey = keys.find((k: MobaRagApiKey) => k.id === key.id)
  if (foundKey) {
    editModalKey.value = foundKey
    editModalName.value = foundKey.name
    editModalPermissions.value = foundKey.permissions
    showEditModal.value = true
  }
}

// Copy API key with success message
const copyApiKeyWithSuccess = async (apiKey: string) => {
  const success = await copyApiKey(apiKey)
  if (success) {
    showSuccess()
  }
}

// Zentralisierte Datenladung - nur einmal beim App-Start
const loadInitialData = async () => {
  console.log('🔍 [HOMEVIEW] Loading initial data...')

  // Lade alle Daten parallel
  await Promise.all([
    loadKeys(),
    loadBudgetData(),
    loadUsageSummary(), // Lädt sowohl Summary als auch API-Key-Daten
  ])

  // Debug: Überprüfe ob API-Key-Daten geladen wurden
  console.log(
    '🔍 [HOMEVIEW] After loading - detailedUsageData length:',
    detailedUsageData.value.length,
  )
  console.log('🔍 [HOMEVIEW] After loading - apiKeyUsageData:', apiKeyUsageData.value)
}

onMounted(() => {
  loadInitialData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">
    <AppSidebar
      :active-sidebar="activeSidebar"
      :can-view-usage="canViewUsage"
      @update:active-sidebar="(value: 'api' | 'usage') => (activeSidebar = value)"
    />
    <div class="flex-1 flex flex-col min-h-screen">
      <AppHeader
        :user-profile="userProfile"
        :user-roles="userRoles"
        :is-development="isDevelopment"
        :show-debug-mode="showDebugMode"
        @logout="handleLogout"
        @debug-token-info="debugTokenInfo"
      />

      <DebugPanel :show-debug-mode="showDebugMode" :show-debug-info="showDebugInfo" />
      <main class="flex-1 bg-gray-50 p-10">
        <!-- API Keys Section -->
        <div v-if="activeSidebar === 'api'">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-1">API-Schlüssel</h1>
              <p class="text-gray-700 text-sm max-w-2xl">
                Als Besitzer dieses Projekts können Sie alle API-Schlüssel in diesem Projekt
                anzeigen und verwalten.<br />Teilen Sie Ihren API-Schlüssel nicht mit anderen oder
                geben Sie ihn im Browser oder anderen Client-seitigen Code preis. Zum Schutz der
                Sicherheit Ihres Kontos können API-Schlüssel automatisch deaktiviert werden, wenn
                sie öffentlich durchgesickert sind.
              </p>
            </div>
            <button
              v-if="canCreateKeys"
              @click="openModal"
              class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Neuen geheimen Schlüssel erstellen
            </button>
          </div>
          <div class="overflow-x-auto">
            <ApiKeyTable
              :keys="legacyKeys"
              :editingKey="editingKey"
              :editingName="editingName"
              :budget-limit="budgetConfig.monthlyLimit"
              :usage-data="apiKeyUsageData"
              @edit="(key: LegacyApiKey) => startEditing(key, keys)"
              @save="saveEdit"
              @cancel="cancelEdit"
              @revoke="revokeKey"
              @rotate="(key: LegacyApiKey) => startRotating(key, keys)"
              @name-input="(val) => (editingName = val)"
            />
          </div>
          <div v-if="error" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>
          <!-- Edit Modal -->
          <ApiKeyEditModal
            :model-value="showEditModal"
            :name="editModalName"
            @update:name="(val: string) => (editModalName = val)"
            @cancel="closeEditModal"
            @save="saveEditModal"
          />
          <!-- Create Modal -->
          <ApiKeyCreateModal
            :model-value="showCreateModal"
            :name="newKeyName"
            :is-creating="isCreating"
            @update:name="(val: string) => (newKeyName = val)"
            @cancel="closeCreateModal"
            @create="createKeyModal"
          />

          <!-- Key Display Modal -->
          <div
            v-if="showKeyDisplayModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
              <h3 class="text-xl font-bold mb-2 text-gray-900">
                {{ editModalKey ? 'Neuer rotierter Key' : 'Speichern Sie Ihren Key' }}
              </h3>
              <p class="mb-4 text-gray-700 text-sm">
                Bitte speichern Sie Ihren Secret Key an einem sicheren Ort, da
                <b>Sie ihn nicht mehr anzeigen können</b>.
              </p>
              <div
                class="mb-4 flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
              >
                <input
                  :value="createdSecret"
                  readonly
                  class="flex-1 bg-transparent font-mono text-xs select-all outline-none text-gray-900"
                />
                <button
                  @click="copyApiKeyWithSuccess(createdSecret)"
                  class="ml-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                >
                  Kopieren
                </button>
              </div>
              <div class="mb-4">
                <label class="block text-xs text-gray-600">Name</label>
                <div class="font-medium text-gray-900">{{ createdKeyName || '—' }}</div>
              </div>
              <div class="mb-4">
                <label class="block text-xs text-gray-600">Berechtigungen</label>
                <div class="font-medium text-gray-900">{{ createdKeyPermissions.join(', ') }}</div>
              </div>
              <div class="mb-4">
                <label class="block text-xs text-gray-600">Gültig bis</label>
                <div class="font-medium text-gray-900">
                  {{
                    createdKeyValidUntil && createdKeyValidUntil !== 'Never'
                      ? new Date(createdKeyValidUntil).toLocaleDateString()
                      : '—'
                  }}
                </div>
              </div>
              <div class="mb-4">
                <label class="block text-xs text-gray-600">Erstellt von</label>
                <div class="font-medium text-gray-900">{{ createdKeyCreatedBy || '—' }}</div>
              </div>
              <div class="flex justify-end gap-2">
                <button
                  @click="closeKeyDisplayModal"
                  class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Fertig
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Usage Section -->
        <div v-else-if="activeSidebar === 'usage' && canViewUsage">
          <UsageTabs />
        </div>
      </main>
    </div>

    <!-- Snackbars -->
    <Snackbar :show="showSuccessMessage" message="API-Schlüssel wurde kopiert!" />
    <Snackbar :show="showEditSuccessMessage" message="API-Schlüssel erfolgreich rotiert!" />
    <Snackbar :show="showCreateSuccessMessage" message="API-Schlüssel erfolgreich erstellt!" />
    <Snackbar :show="showRevokeSuccessMessage" message="API-Schlüssel erfolgreich deaktiviert!" />
  </div>
</template>
