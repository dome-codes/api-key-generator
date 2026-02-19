<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  uploadError: string | null
  uploadSuccess: boolean
}

interface Emits {
  (e: 'upload', file: File): void
  (e: 'download'): void
  (e: 'reset'): void
  (e: 'clear-error'): void
  (e: 'clear-success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // File input zurücksetzen
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }

  emit('upload', file)
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div></div>
    <div class="flex gap-2">
      <label
        class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover cursor-pointer flex items-center gap-2"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleFileUpload"
        />
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        Preise hochladen
      </label>
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover flex items-center gap-2"
        @click="emit('download')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Preise herunterladen
      </button>
      <button
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        @click="emit('reset')"
      >
        Auf Standard zurücksetzen
      </button>
    </div>
  </div>

  <!-- Upload Error Message -->
  <div v-if="props.uploadError" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <div class="flex items-start">
      <svg
        class="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clip-rule="evenodd"
        />
      </svg>
      <div class="flex-1">
        <h3 class="text-sm font-medium text-red-800">Fehler beim Hochladen</h3>
        <p class="mt-1 text-sm text-red-700">{{ props.uploadError }}</p>
      </div>
      <button class="ml-2 text-red-600 hover:text-red-800" @click="emit('clear-error')">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Upload Success Message -->
  <div v-if="props.uploadSuccess" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
    <div class="flex items-start">
      <svg
        class="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clip-rule="evenodd"
        />
      </svg>
      <div class="flex-1">
        <h3 class="text-sm font-medium text-green-800">Erfolgreich hochgeladen</h3>
        <p class="mt-1 text-sm text-green-700">
          Die Preise wurden erfolgreich aus der JSON-Datei geladen.
        </p>
      </div>
      <button class="ml-2 text-green-600 hover:text-green-800" @click="emit('clear-success')">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
