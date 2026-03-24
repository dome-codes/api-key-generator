<script setup lang="ts">
import type { ApiKeyDisplay, ApiKeyUsageData, UserUsageData } from '@/types/frontend'
import { UserRole } from '@/auth/keycloak'
import Pagination from '@/components/ui/Pagination.vue'
import { useAuth } from '@/composables/useAuth'
import { debugLog, isDebugLogEnabled } from '@/utils/debugLog'
import { computed, ref, watch } from 'vue'
import ApiKeyRow from './ApiKeyRow.vue'

const props = defineProps<{
  keys: ApiKeyDisplay[]
  editingKey: string | null
  editingName: string
  budgetLimit: number
  usageData?: Record<string, ApiKeyUsageData>
  userUsageData?: Record<string, UserUsageData>
}>()

// Auth composable verwenden
const { isAdmin, highestRole } = useAuth()

// Prüfen ob Benutzer USER-Rolle hat (entspricht früherer ENTWICKLUNG)
const isEntwicklung = computed(() => {
  return highestRole.value === UserRole.USER
})

defineEmits<{
  edit: [key: ApiKeyDisplay]
  save: [apiKey: string]
  cancel: []
  revoke: [keyId: string]
  'name-input': [value: string]
}>()

// Pagination state
const currentPage = ref(1)
const itemsPerPage = 8 // Zeige 8 API Keys pro Seite

// Admin: Aufklappbare Zeilen pro User (Ticket 2)
const expandedUserId = ref<string | null>(null)

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

  // Status-Filter (API liefert active: boolean; Filter-Werte bleiben "active" / "revoked")
  if (selectedStatusFilter.value === 'active') {
    keys = keys.filter((key) => key.active === true)
  } else if (selectedStatusFilter.value === 'revoked') {
    keys = keys.filter((key) => key.active === false)
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

      // Zähle aktive/inaktive Keys (API liefert active: boolean)
      if (key.active) {
        group.activeKeys++
      } else {
        group.inactiveKeys++
      }
    }
  })

  // Verbrauch pro Gruppe: Summe aus usageData pro Key (kein Mix mit userUsageData in der Schleife, sonst Doppelzählung).
  // Nur wenn alle Keys 0 haben: Fallback auf Summarize pro Benutzer (z. B. wenn Key-Detail fehlt).
  for (const group of grouped.values()) {
    let totalCost = 0
    let totalTokensIn = 0
    let totalTokensOut = 0
    for (const k of group.keys) {
      const u = props.usageData?.[k.id]
      if (u) {
        totalCost += u.cost
        totalTokensIn += u.tokensIn
        totalTokensOut += u.tokensOut
      }
    }
    const userSumm = props.userUsageData?.[group.userId]
    if (
      totalCost === 0 &&
      totalTokensIn === 0 &&
      totalTokensOut === 0 &&
      userSumm
    ) {
      group.totalCost = userSumm.cost
      group.totalTokensIn = userSumm.tokensIn
      group.totalTokensOut = userSumm.tokensOut
    } else {
      group.totalCost = totalCost
      group.totalTokensIn = totalTokensIn
      group.totalTokensOut = totalTokensOut
    }
  }

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
          const aLatestKey = a.keys.reduce((latest: ApiKeyDisplay, key: ApiKeyDisplay) =>
            new Date(key.createdAt) > new Date(latest.createdAt) ? key : latest,
          )
          const bLatestKey = b.keys.reduce((latest: ApiKeyDisplay, key: ApiKeyDisplay) =>
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
          if (a.active && !b.active) comparison = -1
          else if (!a.active && b.active) comparison = 1
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

// Debug: Log wenn usageData oder Keys ankommen (nur bei Debug-Modus)
if (isDebugLogEnabled()) {
  watch(
    () => ({
      usageDataKeys: props.usageData ? Object.keys(props.usageData) : [],
      usageDataSample: props.usageData
        ? Object.fromEntries(
            Object.entries(props.usageData)
              .slice(0, 3)
              .map(([k, v]) => [k, { ...v }]),
          )
        : null,
      rowKeyIds: paginatedKeys.value.map((g: ApiKeyDisplay & { userId?: string }) =>
        isAdmin.value ? g.userId : g.id,
      ),
      keysFromProps: props.keys.slice(0, 5).map((k) => k.id),
      isAdmin: isAdmin.value,
    }),
    (val) => {
      const usageData = props.usageData
      const rowKeyIds = val.rowKeyIds as string[]
      const lookupCheck =
        usageData && rowKeyIds.length > 0
          ? rowKeyIds.map((rid) => {
              const found = usageData[rid]
              const inKeys = val.usageDataKeys.includes(rid)
              return {
                rowKeyId: rid,
                inUsageDataKeys: inKeys,
                value: found
                  ? { cost: found.cost, tokensIn: found.tokensIn, tokensOut: found.tokensOut }
                  : null,
              }
            })
          : []
      debugLog('[ApiKeyTable] usageData / rows Update', {
        'usageData Keys (Anzahl)': val.usageDataKeys.length,
        'usageData Keys': val.usageDataKeys,
        'usageData Sample (erste 3)': val.usageDataSample,
        'rowKeyIds (aktuelle Seite)': val.rowKeyIds,
        'keys aus props (erste 5 .id)': val.keysFromProps,
        isAdmin: val.isAdmin,
        'Lookup pro Zeile (rowKeyId → inKeys?, value)': lookupCheck,
      })
    },
    { deep: true },
  )
}

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
interface GroupedKey {
  userId: string
  userName: string
  keys: ApiKeyDisplay[]
  totalCost: number
  totalTokensIn: number
  totalTokensOut: number
  activeKeys: number
  inactiveKeys: number
}

/** Spalte „Zuletzt verwendet“ in der Gruppenzeile: jüngstes lastUsed aller Keys (Backend-Felder). */
function pickLatestLastUsed(keys: ApiKeyDisplay[]): string {
  const parse = (s: string): number | null => {
    if (!s || s.trim() === '' || s === 'Never') return null
    const t = Date.parse(s)
    if (!Number.isNaN(t)) return t
    const ms = new Date(s).getTime()
    return Number.isNaN(ms) ? null : ms
  }
  let best = 'Never'
  let bestTs = -Infinity
  for (const k of keys) {
    const ts = parse(k.lastUsed)
    if (ts != null && ts > bestTs) {
      bestTs = ts
      best = k.lastUsed
    }
  }
  return best
}

const createGroupedKeyData = (groupedKey: GroupedKey): ApiKeyDisplay => {
  const latestKey = groupedKey.keys.reduce((latest: ApiKeyDisplay, key: ApiKeyDisplay) =>
    new Date(key.createdAt) > new Date(latest.createdAt) ? key : latest,
  )

  return {
    id: groupedKey.userId,
    apiKey: groupedKey.userId,
    name: `${groupedKey.userName} (${groupedKey.keys.length} Keys)`,
    permissions: 'api-access',
    createdAt: latestKey.createdAt,
    createdBy: groupedKey.userName,
    expiresAt: latestKey.expiresAt,
    lastUsed: pickLatestLastUsed(groupedKey.keys),
    active: groupedKey.activeKeys > 0,
    userId: groupedKey.userId,
    userName: groupedKey.userName,
  }
}

// Get usage data for a specific key or user group.
// usageData ist nach key.id (API-Key-ID) indexiert; pro Zeile getUsageDataForKey(key.id) bzw. bei Admin-Gruppe userId (Ticket 4).
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

  const data = props.usageData?.[keyId]
  if (!data) {
    if (isDebugLogEnabled() && props.usageData && Object.keys(props.usageData).length > 0) {
      debugLog('[ApiKeyTable] getUsageDataForKey: ❌ kein Eintrag für keyId', keyId, {
        'usageData Keys': Object.keys(props.usageData),
        'keyId === erste Key?': keyId === Object.keys(props.usageData)[0],
        'keyId (repr)': JSON.stringify(keyId),
        'erste Key (repr)': JSON.stringify(Object.keys(props.usageData)[0]),
        'Alle usageData Keys (normalized)': Object.keys(props.usageData).map((k) => ({
          original: k,
          normalized: k.toLowerCase().replace(/-/g, ''),
        })),
        'keyId normalized': keyId.toLowerCase().replace(/-/g, ''),
      })
    }
    return { cost: 0, tokensIn: 0, tokensOut: 0 }
  }

  // DEBUG: Zeige gefundene Daten
  if (isDebugLogEnabled()) {
    debugLog(`[ApiKeyTable] getUsageDataForKey: ✅ Key ${keyId} gefunden:`, {
      cost: data.cost,
      tokensIn: data.tokensIn,
      tokensOut: data.tokensOut,
    })
  }

  return { cost: data.cost, tokensIn: data.tokensIn, tokensOut: data.tokensOut }
}

// Helper: Hole ID aus group (userId für Admin-Gruppe, id für einzelner Key)
function getGroupId(group: ApiKeyDisplay | { userId: string; keys?: ApiKeyDisplay[] }): string {
  if (isAdmin.value && 'userId' in group && group.userId) {
    return group.userId
  }
  return (group as ApiKeyDisplay).id
}

// Helper: Hole Keys-Array aus Admin-Gruppe
function getGroupKeys(
  group: ApiKeyDisplay | { userId: string; keys?: ApiKeyDisplay[] },
): ApiKeyDisplay[] {
  if (isAdmin.value && 'keys' in group && Array.isArray(group.keys)) {
    return group.keys
  }
  return []
}

// Helper: Prüfe ob Gruppe Keys hat
function hasGroupKeys(group: ApiKeyDisplay | { userId: string; keys?: ApiKeyDisplay[] }): boolean {
  if (isAdmin.value && 'keys' in group && Array.isArray(group.keys)) {
    return group.keys.length > 0
  }
  return false
}

// Reaktive Map keyId → usageData für die sichtbaren Zeilen, damit ApiKeyRow sicher die aktuellen Werte bekommt
const usageDataByKeyId = computed(() => {
  const out: Record<string, ApiKeyUsageData> = {}
  for (const group of paginatedKeys.value) {
    const id = getGroupId(group)
    if (id) out[id] = getUsageDataForKey(id)
    if (isAdmin.value) {
      const keys = getGroupKeys(group)
      for (const k of keys) {
        out[k.id] = getUsageDataForKey(k.id)
      }
    }
  }
  return out
})

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

// Additional computed properties for enhanced UI
const activeKeysCount = computed(() => {
  return props.keys.filter((key) => key.active).length
})

// Helper functions for formatting
const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} €`
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

<template>
  <div class="bg-white rounded-xl shadow-lg overflow-hidden">
    <!-- Akkumulierte Verbrauchsansicht für Nicht-Admin (Cost + Token-Spalte nutzen dieselben Daten) -->
    <div v-if="!isAdmin" class="p-4 bg-gray-50 border-b border-gray-200">
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
                id="user-filter"
                v-model="userSearchQuery"
                type="text"
                placeholder="Benutzer suchen..."
                class="text-sm border border-gray-300 rounded-lg pl-3 pr-5 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
                @input="handleUserSearchInput"
                @focus="handleUserFocus"
                @blur="handleUserBlur"
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
                  class="px-3 py-2 text-sm text-gray-900 cursor-pointer hover:bg-blue-50"
                  :class="{ 'bg-blue-100': selectedUserFilter === user.userId }"
                  @click="selectUser(user.userId, user.userName)"
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
            class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            @click="clearFilters"
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

    <!-- Filter für User-Ansicht: Status + API-Key-Suche -->
    <div
      v-if="!isAdmin && props.keys.length > 0"
      class="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-3"
    >
      <div class="flex items-center gap-2">
        <label for="status-filter-user" class="text-sm font-medium text-gray-700">Status:</label>
        <select
          id="status-filter-user"
          v-model="selectedStatusFilter"
          class="text-sm border border-gray-300 rounded-lg pl-3 pr-5 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Alle</option>
          <option value="active">Aktiv</option>
          <option value="revoked">Inaktiv</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
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
      <button
        v-if="selectedStatusFilter || apiKeySearchQuery"
        type="button"
        class="text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
        @click="clearFilters"
      >
        Filter zurücksetzen
      </button>
    </div>

    <table v-if="paginatedKeys.length" class="w-full text-left border-collapse">
      <thead>
        <tr
          class="text-gray-800 border-b border-gray-200 text-xs uppercase tracking-wider bg-gray-50"
        >
          <th v-if="isAdmin" class="py-3 px-2 w-10 text-center font-semibold text-gray-500"></th>
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
          <th v-if="!isAdmin" class="py-3 px-4 font-semibold">
            Token-Verbrauch<br /><span class="text-xs text-gray-500 font-normal"
              >(Aktueller Monat)</span
            >
          </th>
          <th class="py-3 px-4 font-semibold text-right">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="group in paginatedKeys" :key="getGroupId(group)">
          <ApiKeyRow
            :keyData="isAdmin ? createGroupedKeyData(group) : group"
            :editing="editingKey === getGroupId(group)"
            :editingName="editingName"
            :usageData="
              usageDataByKeyId[getGroupId(group)] ?? { cost: 0, tokensIn: 0, tokensOut: 0 }
            "
            :budgetLimit="budgetLimit"
            :isAdmin="isAdmin"
            :isEntwicklung="isEntwicklung"
            :adminUsageByUser="adminUsageByUser"
            :expandable="isAdmin && hasGroupKeys(group)"
            :expanded="isAdmin && expandedUserId === getGroupId(group)"
            :child-count="isAdmin ? getGroupKeys(group).length : 0"
            :is-child-row="false"
            @toggle-expand="
              isAdmin &&
              (expandedUserId = expandedUserId === getGroupId(group) ? null : getGroupId(group))
            "
            @edit="$emit('edit', $event)"
            @save="$emit('save', $event)"
            @cancel="$emit('cancel')"
            @revoke="$emit('revoke', $event)"
            @name-input="$emit('name-input', $event)"
          />
          <template v-if="isAdmin && expandedUserId === getGroupId(group) && hasGroupKeys(group)">
            <ApiKeyRow
              v-for="k in getGroupKeys(group)"
              :key="k.id"
              :keyData="k"
              :editing="editingKey === k.id"
              :editingName="editingName"
              :usageData="usageDataByKeyId[k.id] ?? { cost: 0, tokensIn: 0, tokensOut: 0 }"
              :budgetLimit="budgetLimit"
              :isAdmin="isAdmin"
              :isEntwicklung="isEntwicklung"
              :adminUsageByUser="adminUsageByUser"
              :expandable="false"
              :expanded="false"
              :child-count="0"
              :is-child-row="true"
              @edit="$emit('edit', $event)"
              @save="$emit('save', $event)"
              @cancel="$emit('cancel')"
              @revoke="$emit('revoke', $event)"
              @name-input="$emit('name-input', $event)"
            />
          </template>
        </template>
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
