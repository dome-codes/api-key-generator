<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
      <h3 class="text-xl font-bold mb-4">Geheimen Schlüssel rotieren</h3>
      <label class="block mb-1 text-sm font-medium"
        >Name <span class="text-gray-400 font-normal">Optional</span></label
      >
      <input
        v-model="localName"
        @input="$emit('update:name', localName)"
        class="w-full mb-6 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="z.B. Mein App-Schlüssel"
      />
      <div class="flex justify-end gap-2">
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 rounded bg-gray-100 text-gray-700 font-medium"
        >
          Abbrechen
        </button>
        <button
          @click="$emit('save')"
          class="px-4 py-2 rounded bg-green-600 text-white font-medium"
        >
          Rotieren
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
}>()
const emits = defineEmits(['update:name', 'cancel', 'save'])
const localName = ref(props.name)
watch(
  () => props.name,
  (val) => (localName.value = val),
)
</script>
