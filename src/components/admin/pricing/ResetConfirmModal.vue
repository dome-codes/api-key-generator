<script setup lang="ts">
interface Props {
  show: boolean
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="emit('cancel')"
  >
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Auf Standard zurücksetzen?</h3>
      <p class="text-sm text-gray-600 mb-6">
        Alle angepassten Preise werden auf die Standardwerte zurückgesetzt. Diese Aktion kann nicht
        rückgängig gemacht werden.
      </p>
      <div class="flex justify-end gap-2">
        <button
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          @click="emit('cancel')"
        >
          Abbrechen
        </button>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          @click="emit('confirm')"
        >
          Zurücksetzen
        </button>
      </div>
    </div>
  </div>
</template>
