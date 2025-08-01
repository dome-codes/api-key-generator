<template>
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
    <div class="flex items-start">
      <svg
        class="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clip-rule="evenodd"
        />
      </svg>
      <div class="text-sm text-blue-700">
        <p class="mb-1">
          <strong>Preisberechnung:</strong> Basierend auf
          <a
            href="https://azure.microsoft.com/de-de/pricing/details/cognitive-services/openai-service/#pricing"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:text-blue-800 underline"
          >
            Azure OpenAI Preisen (2025)
          </a>
          plus 9% Service-Aufschlag. Preise pro 1M Tokens, alle in Euro (€).
        </p>
        <p class="text-xs italic">
          Diese Preise dienen zur Orientierung und können von den tatsächlichen Abrechnungspreisen
          abweichen.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Keine Logik nötig, alles statisch
</script>
