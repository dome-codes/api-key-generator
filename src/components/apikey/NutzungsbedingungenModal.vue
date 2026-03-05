<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'accept'): void
  (e: 'close'): void
}>()

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const accept = () => {
  emit('accept')
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="close"
  >
    <div
      class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl relative animate-in fade-in zoom-in"
    >
      <!-- Header -->
      <div class="flex items-start gap-3 mb-4">
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
          <h3 class="text-xl font-bold text-gray-900">Nutzungsbedingungen für API-Schlüssel</h3>
          <p class="text-sm text-gray-600">
            Bitte bestätige, dass du die folgenden Bedingungen für die Verwendung von API-Schlüsseln
            gelesen und verstanden hast.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="space-y-3 text-sm text-gray-700 mb-6 max-h-[320px] overflow-y-auto">
        <p>
          API-Schlüssel sind persönliche Geheimnisse, die den Zugriff auf dein Konto und deine
          Ressourcen ermöglichen. Behandle sie wie Passwörter.
        </p>
        <ul class="list-disc pl-5 space-y-1">
          <li>API-Schlüssel dürfen nicht in Client-Code (Browser, Mobile Apps, Single Page Apps) eingebettet werden.</li>
          <li>API-Schlüssel dürfen nicht öffentlich geteilt oder in öffentlichen Repositories gespeichert werden.</li>
          <li>Lege API-Schlüssel ausschließlich in sicheren Secrets-Stores ab (z. B. Vault, Kubernetes Secrets, CI/CD-Secret-Management).</li>
          <li>Wenn ein API-Schlüssel kompromittiert ist, muss er sofort rotiert oder deaktiviert werden.</li>
          <li>API-Schlüssel können automatisch deaktiviert werden, wenn sie als kompromittiert erkannt werden.</li>
        </ul>
        <p>
          Durch das Erstellen eines neuen API-Schlüssels bestätigst du, dass du diese
          Nutzungsbedingungen für die aktuelle Sitzung akzeptierst.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          class="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          type="button"
          @click="close"
        >
          Abbrechen
        </button>
        <button
          class="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors shadow-sm hover:shadow-md"
          type="button"
          @click="accept"
        >
          Nutzungsbedingungen akzeptieren
        </button>
      </div>
    </div>
  </div>
</template>

