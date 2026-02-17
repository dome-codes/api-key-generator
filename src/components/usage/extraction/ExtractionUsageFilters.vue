<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Filter & Zeitraum</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <!-- Time Range Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
        <select
          v-model="timeRange"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          @change="handleTimeRangeChange"
        >
          <option value="7d">Letzte 7 Tage</option>
          <option value="30d">Letzte 30 Tage</option>
          <option value="90d">Letzte 90 Tage</option>
          <option value="thisMonth">Diesen Monat</option>
          <option value="lastMonth">Vormonat</option>
          <option value="custom">Benutzerdefiniert</option>
        </select>

        <!-- Custom Date Range -->
        <div v-if="timeRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Von</label>
            <input
              v-model="fromDate"
              type="date"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
              @change="handleDateChange"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Bis</label>
            <input
              v-model="toDate"
              type="date"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 bg-white"
              @change="handleDateChange"
            />
          </div>
        </div>
      </div>

      <!-- Model ID Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Modell-ID</label>
        <select
          v-model="modelId"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
        >
          <option value="">Alle Modelle</option>
          <option value="prebuilt-layout">Prebuilt Layout</option>
          <option value="prebuilt-document">Prebuilt Document</option>
          <option value="prebuilt-invoice">Prebuilt Invoice</option>
          <option value="prebuilt-receipt">Prebuilt Receipt</option>
          <option value="prebuilt-businessCard">Prebuilt Business Card</option>
          <option value="document-intelligence">Document Intelligence</option>
        </select>
      </div>

      <!-- Status Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <select
          v-model="status"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
        >
          <option value="">Alle Status</option>
          <option value="processing">In Bearbeitung</option>
          <option value="completed">Abgeschlossen</option>
          <option value="failed">Fehlgeschlagen</option>
          <option value="canceled">Abgebrochen</option>
          <option value="skipped">Übersprungen</option>
        </select>
      </div>

      <!-- Tag Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Tag</label>
        <select
          v-model="localTagInput"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          @change="handleFilterChange"
        >
          <option value="">Alle Tags</option>
          <option
            v-for="(tagInfo, index) in displayedTags"
            :key="`tag-${index}-${tagInfo.tag}`"
            :value="tagInfo.tag"
          >
            {{ tagInfo.tag }} ({{ tagInfo.count }})
          </option>
          <option v-if="!showAllTags && availableTags.length > 10" value="__show_more__" disabled class="text-gray-400">
            ────────────────
          </option>
          <option
            v-if="!showAllTags && availableTags.length > 10"
            value=""
            @click.stop="showAllTags = true"
            class="text-primary font-medium"
          >
            + {{ availableTags.length - 10 }} weitere anzeigen
          </option>
        </select>
        <button
          v-if="showAllTags && availableTags.length > 10"
          @click="showAllTags = false"
          class="mt-1 text-xs text-primary hover:text-primary-hover"
        >
          Weniger anzeigen
        </button>
      </div>

      <!-- User Filter (nur für Admin) -->
      <div v-if="showUserFilter">
        <label class="block text-sm font-medium text-gray-700 mb-2">Benutzer</label>
        <select
          v-model="selectedUser"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
        >
          <option value="">Alle Benutzer</option>
          <option v-for="user in filteredUsers" :key="user.id" :value="user.id">
            {{ user.displayName }}
          </option>
        </select>
      </div>

      <!-- Gruppen Filter (nur für Admin) -->
      <div v-if="showUserFilter">
        <label class="block text-sm font-medium text-gray-700 mb-2">Gruppe</label>
        <select
          v-model="selectedUserGroup"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
        >
          <option value="">Alle Gruppen</option>
          <option v-for="group in availableGroups" :key="group.id" :value="group.id">
            {{ group.name }} ({{ group.count }})
          </option>
        </select>
      </div>
    </div>

    <!-- Filter anwenden Button -->
    <div class="mt-4 flex justify-end">
      <button
        @click="handleFilterChange"
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium text-sm"
      >
        Filter anwenden
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { DocumentIntelligenceOperationStatus } from '@/api/types'
import { getTopExtractionTags, getAllExtractionTags, type TagInfo } from '@/services/tagsService'

// Props
interface Props {
  timeRange: string
  modelId?: string
  status?: DocumentIntelligenceOperationStatus | ''
  tag?: string
  fromDate?: string
  toDate?: string
  selectedUser?: string
  selectedUserGroup?: string
  showUserFilter?: boolean
  users?: Array<{ id: string; displayName: string }>
}

const props = withDefaults(defineProps<Props>(), {
  showUserFilter: false,
  users: () => [],
})

// Emits
const emit = defineEmits<{
  'update:timeRange': [value: string]
  'update:modelId': [value: string]
  'update:status': [value: DocumentIntelligenceOperationStatus | '']
  'update:tag': [value: string]
  'update:fromDate': [value: string]
  'update:toDate': [value: string]
  'update:selectedUser': [value: string]
  'update:selectedUserGroup': [value: string]
  'filter-changed': []
}>()

// Local reactive state
const timeRange = computed({
  get: () => props.timeRange,
  set: (value) => emit('update:timeRange', value),
})

const modelId = computed({
  get: () => props.modelId || '',
  set: (value) => emit('update:modelId', value),
})

const status = computed({
  get: () => props.status || '',
    set: (value) => emit('update:status', value as DocumentIntelligenceOperationStatus | ''),
})

// Local Tag Input (wird erst beim Button-Klick oder Enter aktualisiert)
const localTagInput = ref(props.tag || '')
const availableTags = ref<TagInfo[]>([])
const showAllTags = ref(false)
const isLoadingTags = ref(false)

// Sync props changes back to local input
watch(
  () => props.tag,
  (newValue) => {
    if (newValue !== localTagInput.value) {
      localTagInput.value = newValue || ''
    }
  },
)

const fromDate = computed({
  get: () => props.fromDate || '',
  set: (value) => emit('update:fromDate', value),
})

const toDate = computed({
  get: () => props.toDate || '',
  set: (value) => emit('update:toDate', value),
})

const selectedUser = computed({
  get: () => props.selectedUser || '',
  set: (value) => emit('update:selectedUser', value),
})

const selectedUserGroup = computed({
  get: () => props.selectedUserGroup || '',
  set: (value) => emit('update:selectedUserGroup', value),
})

// Gruppierungslogik
const getUserGroup = (userId: string): string => {
  if (userId.startsWith('SVC_ADMIN')) {
    return 'ADMIN'
  } else if (userId.startsWith('SVC_')) {
    return 'TECHNICAL'
  } else if (userId.startsWith('e') || userId.startsWith('b')) {
    return 'DEVELOPMENT'
  } else {
    return 'DEFAULT'
  }
}

const availableGroups = computed(() => {
  const groups: Record<string, { id: string; name: string; count: number }> = {
    DEVELOPMENT: { id: 'DEVELOPMENT', name: 'Entwicklung', count: 0 },
    TECHNICAL: { id: 'TECHNICAL', name: 'Technische Nutzer', count: 0 },
    ADMIN: { id: 'ADMIN', name: 'ADMIN', count: 0 },
    DEFAULT: { id: 'DEFAULT', name: 'Default', count: 0 },
  }

  props.users.forEach((user) => {
    const group = getUserGroup(user.id)
    if (groups[group]) {
      groups[group].count++
    }
  })

  return Object.values(groups).filter((group) => group.count > 0)
})

const filteredUsers = computed(() => {
  if (!selectedUserGroup.value) {
    return props.users
  }

  return props.users.filter((user) => getUserGroup(user.id) === selectedUserGroup.value)
})

// Handler
const handleTimeRangeChange = () => {
  const today = new Date()
  let startDate: Date

  switch (timeRange.value) {
    case '7d':
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'thisMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
      toDate.value = lastDay.toISOString().split('T')[0]
      break
    default:
      return
  }

  if ((timeRange.value as string) !== 'custom') {
    fromDate.value = startDate.toISOString().split('T')[0]
    toDate.value = today.toISOString().split('T')[0]
  }
  // Zeitraum-Änderungen werden sofort angewendet
  handleFilterChange()
}

const handleDateChange = () => {
  // Datumsänderungen werden sofort angewendet
  handleFilterChange()
}

const displayedTags = computed(() => {
  if (showAllTags.value) {
    return availableTags.value
  }
  return availableTags.value.slice(0, 10)
})

// Lade Tags beim Mount und wenn sich Datum ändert
const loadTags = async () => {
  isLoadingTags.value = true
  try {
    const fromDateISO = props.fromDate ? new Date(props.fromDate + 'T00:00:00').toISOString() : undefined
    const toDateISO = props.toDate ? new Date(props.toDate + 'T23:59:59').toISOString() : undefined

    if (showAllTags.value) {
      // Lade alle Tags
      availableTags.value = await getAllExtractionTags(fromDateISO, toDateISO, props.showUserFilter)
    } else {
      // Lade nur Top 10
      availableTags.value = await getTopExtractionTags(fromDateISO, toDateISO, 10, props.showUserFilter)
    }
  } catch (error) {
    console.error('Error loading tags:', error)
    availableTags.value = []
  } finally {
    isLoadingTags.value = false
  }
}

// Watch für Datum-Änderungen
watch([() => props.fromDate, () => props.toDate], () => {
  loadTags()
})

// Watch für showAllTags
watch(showAllTags, (newValue) => {
  if (newValue) {
    loadTags()
  } else {
    // Zurück zu Top 10
    loadTags()
  }
})

const handleFilterChange = () => {
  // Aktualisiere alle Werte bevor der Filter ausgelöst wird
  emit('update:tag', localTagInput.value)
  emit('filter-changed')
}

onMounted(() => {
  loadTags()
})

// Watcher für Gruppenänderungen
watch(selectedUserGroup, (newGroup) => {
  if (newGroup) {
    selectedUser.value = ''
  }
})

watch(selectedUser, (newUser) => {
  if (newUser) {
    selectedUserGroup.value = ''
  }
})
</script>
