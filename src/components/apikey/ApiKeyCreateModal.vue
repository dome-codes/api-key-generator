<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
      <h3 class="text-xl font-bold mb-2 text-gray-900">Neuen geheimen Schlüssel erstellen</h3>
      <p class="mb-4 text-gray-700 text-sm">Geben Sie Ihrem Schlüssel optional einen Namen.</p>
      <label class="block mb-2 text-sm font-medium text-gray-900"
        >Name <span class="text-gray-500 font-normal">Optional</span></label
      >
      <input
        v-model="localName"
        @input="$emit('update:name', localName)"
        class="w-full mb-6 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
        placeholder="z.B. Mein App-Schlüssel"
      />
      <div class="flex justify-end gap-2">
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition-colors"
        >
          Abbrechen
        </button>
        <button
          @click="$emit('create')"
          :disabled="isCreating"
          class="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center min-w-[90px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          {{ isCreating ? 'Erstelle...' : 'Erstellen' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{
  modelValue: boolean
  name: string
  isCreating: boolean
}>()
const emits = defineEmits(['update:name', 'cancel', 'create'])
const localName = ref(props.name)
watch(
  () => props.name,
  (val) => (localName.value = val),
)
</script>
