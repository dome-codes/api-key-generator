<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{
  modelValue: boolean
  name: string
  isCreating: boolean
}>()
defineEmits(['update:name', 'cancel', 'create'])
const localName = ref(props.name)
watch(
  () => props.name,
  (val) => (localName.value = val),
)
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="$emit('cancel')"
  >
    <div
      class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative animate-in fade-in zoom-in"
    >
      <!-- Header mit Icon -->
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-primary/10 rounded-lg">
          <svg
            class="w-6 h-6 text-primary"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900">Neuen API-Schlüssel erstellen</h3>
          <p class="text-sm text-gray-600">
            Erstellen Sie einen neuen geheimen Schlüssel für Ihre Anwendung
          </p>
        </div>
      </div>

      <!-- Info-Box -->
      <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-start gap-2">
          <svg
            class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-1">Wichtiger Hinweis</p>
            <p>
              Der API-Schlüssel wird nur einmal angezeigt. Speichern Sie ihn sicher, da Sie ihn
              später nicht mehr einsehen können.
            </p>
          </div>
        </div>
      </div>

      <!-- Formular -->
      <div class="space-y-4">
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-900">
            Name <span class="text-gray-500 font-normal">(Optional)</span>
          </label>
          <input
            v-model="localName"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900 placeholder-gray-400 transition-all"
            placeholder="z.B. Produktions-Key, Entwicklungs-Key, Mobile App"
            @input="$emit('update:name', localName)"
            @keyup.enter="!isCreating && $emit('create')"
          />
          <p class="mt-1.5 text-xs text-gray-500">
            Ein beschreibender Name hilft Ihnen, den Schlüssel später wiederzufinden.
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button
          :disabled="isCreating"
          class="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('cancel')"
        >
          Abbrechen
        </button>
        <button
          :disabled="isCreating"
          class="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium flex items-center justify-center min-w-[120px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          @click="$emit('create')"
        >
          <svg
            v-if="isCreating"
            class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <svg
            v-else
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {{ isCreating ? 'Erstelle...' : 'Schlüssel erstellen' }}
        </button>
      </div>
    </div>
  </div>
</template>
