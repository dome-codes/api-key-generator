<template>
  <div class="bg-white rounded-xl shadow-lg overflow-hidden">
    <!-- Akkumulierte Verbrauchsansicht für Entwicklung-Nutzer -->
    <div v-if="isEntwicklung && !isAdmin" class="p-4 bg-gray-50 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-900">Gesamtverbrauch (Aktueller Monat)</h3>
          <p class="text-xs text-gray-600">Akkumulierte Kosten aller API-Schlüssel</p>
        </div>

        <!-- Progress Bar mit Tooltip -->
        <div class="relative flex items-center space-x-3 group">
          <div class="w-48 bg-gray-200 rounded-full h-3">
            <div
              class="h-3 rounded-full transition-all duration-300"
              :class="totalProgressBarColor"
              :style="{ width: totalProgressPercentage + '%' }"
            ></div>
          </div>

          <!-- Tooltip nur bei Hover -->
          <div
            class="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs z-20 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <div>Aktuell: {{ formatCurrency(totalCost) }}</div>
            <div>Limit: {{ formatCurrency(budgetLimit) }}</div>
            <div>Verbraucht: {{ totalProgressPercentage.toFixed(1) }}%</div>
            <div>Verbleibend: {{ formatCurrency(budgetLimit - totalCost) }}</div>
            <div>
              Tokens: {{ formatNumber(totalTokensIn) }} In / {{ formatNumber(totalTokensOut) }} Out
            </div>
            <div>Aktive Keys: {{ activeKeysCount }}</div>
            <!-- Tooltip Arrow -->
            <div
              class="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"
            ></div>
          </div>

          <div class="text-sm font-medium text-gray-900">
            {{ formatCurrency(totalCost) }} / {{ formatCurrency(budgetLimit) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Admin Filter Section -->
    <div v-if="isAdmin" class="p-4 bg-gray-50 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <label for="user-filter" class="text-sm font-medium text-gray-700"
              >Benutzer filtern:</label
            >
            <div class="relative">
              <input
                type="text"
                id="user-filter"
                v-model="userSearchQuery"
                @input="handleUserSearchInput"
                @focus="handleUserFocus"
                @blur="handleUserBlur"
                placeholder="Benutzer suchen..."
                class="text-sm border border-gray-300 rounded-lg pl-3 pr-5 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
              />
              <div
                v-if="showUserDropdown && filteredUserOptions.length > 0"
                class="absolute z-10 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto top-full left-0"
              >
                <div
                  class="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-blue-50"
                  @click="selectUser('', 'Alle Benutzer')"
                >
                  Alle Benutzer
                </div>
                <div
                  v-for="user in filteredUserOptions"
                  :key="user.userId"
                  @click="selectUser(user.userId, user.userName)"
                  class="px-3 py-2 text-sm text-gray-900 cursor-pointer hover:bg-blue-50"
                  :class="{ 'bg-blue-100': selectedUserFilter === user.userId }"
                >
                  {{ user.userName || user.userId }} ({{ user.keyCount }} Key{{
                    user.keyCount !== 1 ? 's' : ''
                  }})
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <label for="status-filter" class="text-sm font-medium text-gray-700">Status:</label>
            <select
              id="status-filter"
              v-model="selectedStatusFilter"
              class="text-sm border border-gray-300 rounded-lg pl-3 pr-5 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="revoked">Deaktiviert</option>
            </select>
          </div>

          <div class="flex items-center space-x-2">
            <label for="apikey-search" class="text-sm font-medium text-gray-700"
              >API Key suchen:</label
            >
            <input
              id="apikey-search"
              v-model="apiKeySearchQuery"
              type="text"
              placeholder="Name oder Key-Endung..."
              class="text-sm border border-gray-300 rounded-lg pl-3 pr-5 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
            />
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="clearFilters"
            class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Filter zurücksetzen
          </button>
          <div class="text-sm text-gray-500">
            {{ isAdmin ? adminGroupedKeys.length : filteredKeys.length }} von
            {{ isAdmin ? adminGroupedKeys.length : props.keys.length }} Keys
          </div>
        </div>
      </div>
    </div>

    <!-- API-Key-Suche (für User-Ansicht) -->
    <div
      v-if="!isAdmin && props.keys.length > 0"
      class="p-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2"
    >
      <label for="apikey-search-user" class="text-sm font-medium text-gray-700"
        >API Key suchen:</label
      >
      <input
        id="apikey-search-user"
        v-model="apiKeySearchQuery"
        type="text"
        placeholder="Name oder Key-Endung (z. B. …abcd)"
        class="text-sm border border-gray-300 rounded-lg pl-3 pr-5 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-56"
      />
    </div>

    <table v-if="paginatedKeys.length" class="w-full text-left border-collapse">
      <thead>
        <tr
          class="text-gray-800 border-b border-gray-200 text-xs uppercase tracking-wider bg-gray-50"
        >
          <th
            class="py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
            @click="sortBy('name')"
          >
            <div class="flex items-center gap-1">
              Name
              <svg
                class="w-3 h-3"
                :class="
                  sortField === 'name' ? (sortOrder === 'asc' ? 'rotate-180' : '') : 'opacity-30'
                "
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </div>
          </th>
          <th class="py-3 px-4 font-semibold">Geheimer Schlüssel</th>
          <th v-if="isAdmin" class="py-3 px-4 font-semibold">Benutzer</th>
          <th
            class="py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
            @click="sortBy('status')"
          >
            <div class="flex items-center gap-1">
              Status
              <svg
                class="w-3 h-3"
                :class="
                  sortField === 'status' ? (sortOrder === 'asc' ? 'rotate-180' : '') : 'opacity-30'
                "
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </div>
          </th>
          <th
            class="py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
            @click="sortBy('createdAt')"
          >
            <div class="flex items-center gap-1">
              Erstellt
              <svg
                class="w-3 h-3"
                :class="
                  sortField === 'createdAt'
                    ? sortOrder === 'asc'
                      ? 'rotate-180'
                      : ''
                    : 'opacity-30'
                "
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </div>
          </th>
          <th class="py-3 px-4 font-semibold">Zuletzt verwendet</th>
          <th class="py-3 px-4 font-semibold">Gültig bis</th>
          <th
            v-if="isAdmin"
            class="py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
            @click="sortBy('cost')"
          >
            <div class="flex items-center gap-1">
              Kostenverbrauch<br /><span class="text-xs text-gray-500 font-normal"
                >(Aktueller Monat)</span
              >
              <svg
                class="w-3 h-3"
                :class="
                  sortField === 'cost' ? (sortOrder === 'asc' ? 'rotate-180' : '') : 'opacity-30'
                "
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </div>
          </th>
          <th v-if="isEntwicklung && !isAdmin" class="py-3 px-4 font-semibold">
            Token-Verbrauch<br /><span class="text-xs text-gray-500 font-normal"
              >(Aktueller Monat)</span
            >
          </th>
          <th class="py-3 px-4 font-semibold text-right">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <ApiKeyRow
          v-for="key in paginatedKeys"
          :key="isAdmin ? key.userId : key.id"
          :keyData="isAdmin ? createGroupedKeyData(key) : key"
          :editing="editingKey === (isAdmin ? key.userId : key.id)"
          :editingName="editingName"
          :usageData="getUsageDataForKey(isAdmin ? key.userId : key.id)"
          :budgetLimit="budgetLimit"
          :isAdmin="isAdmin"
          :isEntwicklung="isEntwicklung"
          :adminUsageByUser="adminUsageByUser"
          @edit="$emit('edit', $event)"
          @save="$emit('save', $event)"
          @cancel="$emit('cancel')"
          @revoke="$emit('revoke', $event)"
          @name-input="$emit('name-input', $event)"
        />
      </tbody>
    </table>
    <div v-else class="text-center text-gray-600 py-8">Keine API-Schlüssel verfügbar.</div>

    <!-- Pagination -->
    <Pagination
      v-if="(isAdmin ? adminGroupedKeys.length : filteredKeys.length) > itemsPerPage"
      :current-page="currentPage"
      :total-items="isAdmin ? adminGroupedKeys.length : filteredKeys.length"
      :items-per-page="itemsPerPage"
      @update:current-page="currentPage = $event"
    />
  </div>
</template>

<script setup lang="ts">
import type { ApiKeyDisplay, ApiKeyUsageData } from '@/api/types/frontend'
import { UserRole } from '@/auth/keycloak'
import Pagination from '@/components/ui/Pagination.vue'
import { useAuth } from '@/composables/useAuth'
import { computed, ref } from 'vue'
import ApiKeyRow from './ApiKeyRow.vue'

const props = defineProps<{
  keys: ApiKeyDisplay[]
  editingKey: string | null
  editingName: string
  budgetLimit: number
  usageData?: Record<string, ApiKeyUsageData>
}>()

// Auth composable verwenden
const { isAdmin, highestRole } = useAuth()

// Prüfen ob Benutzer USER-Rolle hat (entspricht früherer ENTWICKLUNG)
const isEntwicklung = computed(() => {
  return highestRole.value === UserRole.USER
})

const emits = defineEmits<{
  edit: [key: ApiKeyDisplay]
  save: [apiKey: string]
  cancel: []
  revoke: [keyId: string]
  'name-input': [value: string]
}>()

// Pagination state
const currentPage = ref(1)
const itemsPerPage = 8 // Zeige 8 API Keys pro Seite

// Sortierung state
const sortField = ref('status')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Filter state
const selectedUserFilter = ref('')
const selectedStatusFilter = ref('')
const userSearchQuery = ref('Alle Benutzer')
const showUserDropdown = ref(false)
const apiKeySearchQuery = ref('')

// Computed properties
// Eindeutige Benutzer für Filter
const uniqueUsers = computed(() => {
  const userMap = new Map()

  props.keys.forEach((key) => {
    if (key.userId) {
      if (!userMap.has(key.userId)) {
        userMap.set(key.userId, {
          userId: key.userId,
          userName: key.userName || key.userId,
          keyCount: 0,
        })
      }
      userMap.get(key.userId).keyCount++
    }
  })

  return Array.from(userMap.values()).sort((a, b) => a.userName.localeCompare(b.userName))
})

// Gefilterte Benutzeroptionen basierend auf Suchanfrage
const filteredUserOptions = computed(() => {
  if (!userSearchQuery.value || userSearchQuery.value === 'Alle Benutzer') {
    return uniqueUsers.value
  }
  const query = userSearchQuery.value.toLowerCase()
  return uniqueUsers.value.filter(
    (user) =>
      user.userName.toLowerCase().includes(query) || user.userId.toLowerCase().includes(query),
  )
})

// Gefilterte Keys basierend auf Benutzer-, Status- und API-Key-Suche
const filteredKeys = computed(() => {
  let keys = [...props.keys]

  // Benutzer-Filter
  if (selectedUserFilter.value) {
    keys = keys.filter((key) => key.userId === selectedUserFilter.value)
  }

  // Status-Filter
  if (selectedStatusFilter.value) {
    keys = keys.filter((key) => key.status === selectedStatusFilter.value)
  }

  // API-Key-Suche (Name, Key-ID, letzte 4 Zeichen des Keys)
  const q = apiKeySearchQuery.value?.trim().toLowerCase()
  if (q) {
    keys = keys.filter((key) => {
      const name = (key.name || '').toLowerCase()
      const id = (key.id || '').toLowerCase()
      const suffix = (key.apiKey || '').slice(-4).toLowerCase()
      return name.includes(q) || id.includes(q) || suffix.includes(q) || q === suffix
    })
  }

  return keys
})

// Für Admins: Gruppiere Keys nach Benutzer
const adminGroupedKeys = computed(() => {
  if (!isAdmin.value) return filteredKeys.value

  const grouped = new Map()

  filteredKeys.value.forEach((key) => {
    if (key.userId) {
      if (!grouped.has(key.userId)) {
        grouped.set(key.userId, {
          userId: key.userId,
          userName: key.userName || key.userId,
          keys: [],
          totalCost: 0,
          totalTokensIn: 0,
          totalTokensOut: 0,
          activeKeys: 0,
          inactiveKeys: 0,
        })
      }

      const group = grouped.get(key.userId)
      group.keys.push(key)

      // Akkumuliere Verbrauchsdaten
      const usage = props.usageData?.[key.id]
      if (usage) {
        group.totalCost += usage.cost
        group.totalTokensIn += usage.tokensIn
        group.totalTokensOut += usage.tokensOut
      }

      // Zähle aktive/inaktive Keys
      if (key.status === 'active') {
        group.activeKeys++
      } else {
        group.inactiveKeys++
      }
    }
  })

  return Array.from(grouped.values()).sort((a, b) => a.userName.localeCompare(b.userName))
})

const sortedKeys = computed(() => {
  // Für Admins: Verwende gruppierte Keys
  const keys = isAdmin.value ? [...adminGroupedKeys.value] : [...filteredKeys.value]

  return keys.sort((a, b) => {
    let comparison = 0

    switch (sortField.value) {
      case 'name':
        if (isAdmin.value) {
          comparison = a.userName.localeCompare(b.userName)
        } else {
          comparison = a.name.localeCompare(b.name)
        }
        break
      case 'createdAt':
        if (isAdmin.value) {
          // Sortiere nach dem neuesten Key pro Benutzer
          const aLatestKey = a.keys.reduce((latest: any, key: any) =>
            new Date(key.createdAt) > new Date(latest.createdAt) ? key : latest,
          )
          const bLatestKey = b.keys.reduce((latest: any, key: any) =>
            new Date(key.createdAt) > new Date(latest.createdAt) ? key : latest,
          )
          comparison =
            new Date(aLatestKey.createdAt).getTime() - new Date(bLatestKey.createdAt).getTime()
        } else {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
        break
      case 'status':
        if (isAdmin.value) {
          // Sortiere nach Anzahl aktiver Keys
          comparison = a.activeKeys - b.activeKeys
        } else {
          // Aktive Keys zuerst, dann deaktivierte (unabhängig von sortOrder)
          if (a.status === 'active' && b.status === 'revoked') comparison = -1
          else if (a.status === 'revoked' && b.status === 'active') comparison = 1
          else comparison = 0
        }
        break
      case 'cost':
        if (isAdmin.value) {
          comparison = a.totalCost - b.totalCost
        } else {
          const costA = props.usageData?.[a.id]?.cost || 0
          const costB = props.usageData?.[b.id]?.cost || 0
          comparison = costA - costB
        }
        break
      default:
        comparison = 0
    }

    // Bei gleichem Wert: nach Erstellungsdatum sortieren (neueste zuerst)
    if (comparison === 0 && sortField.value !== 'createdAt') {
      comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    // Für Status-Sortierung: Aktive Keys immer zuerst (unabhängig von sortOrder)
    if (sortField.value === 'status' && !isAdmin.value) {
      return comparison
    }

    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})

const paginatedKeys = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return sortedKeys.value.slice(startIndex, endIndex)
})

// Methods
const sortBy = (field: string) => {
  if (sortField.value === field) {
    // Toggle sort order if same field
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new field and default to desc
    sortField.value = field
    sortOrder.value = 'desc'
  }
  currentPage.value = 1 // Reset to first page when sorting changes
}

const clearFilters = () => {
  selectedUserFilter.value = ''
  selectedStatusFilter.value = ''
  userSearchQuery.value = 'Alle Benutzer'
  apiKeySearchQuery.value = ''
  currentPage.value = 1
}

const selectUser = (userId: string, userName: string) => {
  selectedUserFilter.value = userId
  userSearchQuery.value = userId === '' ? 'Alle Benutzer' : userName
  showUserDropdown.value = false
  currentPage.value = 1 // Reset pagination
}

const handleUserSearchInput = (event: Event) => {
  userSearchQuery.value = (event.target as HTMLInputElement).value
  selectedUserFilter.value = '' // Clear selected filter if typing
  showUserDropdown.value = true
  currentPage.value = 1 // Reset pagination
}

const handleUserFocus = () => {
  showUserDropdown.value = true
  // Wenn "Alle Benutzer" angezeigt wird, Feld leeren für direkte Eingabe
  if (userSearchQuery.value === 'Alle Benutzer') {
    userSearchQuery.value = ''
  }
}

const handleUserBlur = () => {
  setTimeout(() => {
    showUserDropdown.value = false
    if (selectedUserFilter.value) {
      // If a user is selected, ensure the input displays their name
      const selected = uniqueUsers.value.find((u) => u.userId === selectedUserFilter.value)
      if (selected) {
        userSearchQuery.value = selected.userName
      }
    } else {
      // If no user is selected and field is empty, show placeholder
      if (!userSearchQuery.value) {
        userSearchQuery.value = 'Alle Benutzer'
      }
    }
  }, 100)
}

// Erstelle KeyData für gruppierte Benutzer
const createGroupedKeyData = (groupedKey: any): ApiKeyDisplay => {
  const latestKey = groupedKey.keys.reduce((latest: any, key: any) =>
    new Date(key.createdAt) > new Date(latest.createdAt) ? key : latest,
  )

  return {
    id: groupedKey.userId,
    apiKey: groupedKey.userId,
    name: `${groupedKey.userName} (${groupedKey.keys.length} Keys)`,
    permissions: 'api-access',
    createdAt: latestKey.createdAt,
    createdBy: groupedKey.userName,
    validUntil: latestKey.validUntil,
    lastUsed: 'Never',
    status: groupedKey.activeKeys > 0 ? 'active' : 'revoked',
    userId: groupedKey.userId,
    userName: groupedKey.userName,
  }
}

// Get usage data for a specific key or user group
const getUsageDataForKey = (keyId: string): ApiKeyUsageData => {
  // Für Admins: Wenn es ein gruppierter Key ist, verwende die gruppierten Daten
  if (isAdmin.value) {
    const groupedKey = adminGroupedKeys.value.find((group) => group.userId === keyId)
    if (groupedKey) {
      return {
        cost: groupedKey.totalCost,
        tokensIn: groupedKey.totalTokensIn,
        tokensOut: groupedKey.totalTokensOut,
      }
    }
  }

  if (!props.usageData || !props.usageData[keyId]) {
    return { cost: 0, tokensIn: 0, tokensOut: 0 }
  }

  return props.usageData[keyId]
}

// Berechne akkumulierte Verbrauchsdaten für Entwicklung-Nutzer
const totalCost = computed(() => {
  if (!props.usageData) return 0
  return Object.values(props.usageData).reduce((sum, usage) => sum + usage.cost, 0)
})

const totalTokensIn = computed(() => {
  if (!props.usageData) return 0
  return Object.values(props.usageData).reduce((sum, usage) => sum + usage.tokensIn, 0)
})

const totalTokensOut = computed(() => {
  if (!props.usageData) return 0
  return Object.values(props.usageData).reduce((sum, usage) => sum + usage.tokensOut, 0)
})

// Berechne akkumulierte Verbrauchsdaten für Admins (pro Nutzer gruppiert)
const adminUsageByUser = computed(() => {
  if (!props.usageData || !isAdmin.value) return {}

  const userUsage: {
    [userId: string]: { cost: number; tokensIn: number; tokensOut: number; keys: string[] }
  } = {}

  // Gruppiere Usage-Daten nach Nutzer
  Object.entries(props.usageData).forEach(([keyId, usage]) => {
    const key = props.keys.find((k) => k.id === keyId)
    if (key && key.userId) {
      if (!userUsage[key.userId]) {
        userUsage[key.userId] = { cost: 0, tokensIn: 0, tokensOut: 0, keys: [] }
      }
      userUsage[key.userId].cost += usage.cost
      userUsage[key.userId].tokensIn += usage.tokensIn
      userUsage[key.userId].tokensOut += usage.tokensOut
      userUsage[key.userId].keys.push(keyId)
    }
  })

  return userUsage
})

// Progress Bar Logic für akkumulierte Ansicht
const totalProgressPercentage = computed(() => {
  if (props.budgetLimit <= 0) return 0
  return Math.min((totalCost.value / props.budgetLimit) * 100, 100)
})

const totalProgressBarColor = computed(() => {
  const percentage = totalProgressPercentage.value
  if (percentage >= 100) return 'bg-red-500'
  if (percentage >= 80) return 'bg-yellow-500'
  return 'bg-green-500'
})

const totalStatusTextColor = computed(() => {
  const percentage = totalProgressPercentage.value
  if (percentage >= 100) return 'text-red-600'
  if (percentage >= 80) return 'text-yellow-600'
  return 'text-green-600'
})

// Additional computed properties for enhanced UI
const activeKeysCount = computed(() => {
  return props.keys.filter((key) => key.status === 'active').length
})

const averageCostPerKey = computed(() => {
  const activeKeys = props.keys.filter((key) => key.status === 'active')
  if (activeKeys.length === 0) return 0
  return totalCost.value / activeKeys.length
})

const daysInCurrentMonth = computed(() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
})

// Helper functions for formatting
const formatCurrency = (amount: number): string => {
  return amount.toFixed(2) + ' €'
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}
</script>
