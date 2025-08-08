<template>
  <table v-if="keys.length" class="w-full text-left border-collapse bg-white rounded-xl shadow-lg">
    <thead>
      <tr
        class="text-gray-800 border-b border-gray-200 text-xs uppercase tracking-wider bg-gray-50"
      >
        <th class="py-3 px-4 font-semibold">Name</th>
        <th class="py-3 px-4 font-semibold">Geheimer Schlüssel</th>
        <th class="py-3 px-4 font-semibold">Erstellt</th>
        <th class="py-3 px-4 font-semibold">Zuletzt verwendet</th>
        <th class="py-3 px-4 font-semibold">Gültig bis</th>
        <th class="py-3 px-4 font-semibold text-right">Aktionen</th>
      </tr>
    </thead>
    <tbody>
      <ApiKeyRow
        v-for="key in keys"
        :key="key.id"
        :keyData="key"
        :editing="editingKey === key.id"
        :editingName="editingName"
        @edit="$emit('edit', $event)"
        @save="$emit('save', $event)"
        @cancel="$emit('cancel')"
        @revoke="$emit('revoke', $event)"
        @name-input="$emit('name-input', $event)"
      />
    </tbody>
  </table>
  <div v-else class="text-center text-gray-600 py-8">Keine API-Schlüssel verfügbar.</div>
</template>

<script setup lang="ts">
import ApiKeyRow from './ApiKeyRow.vue'

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
  status: string
}

const props = defineProps<{
  keys: LegacyApiKey[]
  editingKey: string | null
  editingName: string
}>()

const emits = defineEmits<{
  edit: [key: LegacyApiKey]
  save: [apiKey: string]
  cancel: []
  revoke: [keyId: string]
  'name-input': [value: string]
}>()
</script>
