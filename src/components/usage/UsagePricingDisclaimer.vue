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
      <div class="flex-1">
        <!-- Vollständiger Disclaimer aus pricing.ts -->
        <div v-if="useFullDisclaimer" class="text-sm text-blue-700">
          <div v-html="formattedFullDisclaimer" class="space-y-2"></div>
        </div>

        <!-- Kompakter Disclaimer (Standard) -->
        <div v-else class="text-sm text-blue-700">
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
            plus 9% Service-Aufschlag.
          </p>
          <p class="text-xs italic">
            Diese Preise dienen zur Orientierung und können von den tatsächlichen Abrechnungspreisen
            abweichen.
          </p>
        </div>

        <!-- Erweiterbare Details (nur im kompakten Modus) -->
        <div v-if="!useFullDisclaimer" class="mt-2">
          <button
            @click="showDetails = !showDetails"
            class="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            {{ showDetails ? 'Weniger Details' : 'Mehr Details' }}
            <svg
              :class="['w-3 h-3 transition-transform', showDetails ? 'rotate-180' : '']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- Erweiterte Details -->
          <div v-if="showDetails" class="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
            <div class="text-xs text-blue-800 space-y-2">
              <div>
                <strong>Wichtige Hinweise:</strong>
                <ul class="mt-1 ml-4 space-y-1">
                  <li>
                    • <strong>Completion Models:</strong> Preise sind pro 1 Million Tokens berechnet
                  </li>
                  <li>
                    • <strong>Embedding Models:</strong> Preise sind pro 1000 Tokens berechnet
                  </li>
                  <li>
                    • <strong>Image Models:</strong> Preise sind pro 100 Bilder berechnet (Standard:
                    1024x1024, HD: 1024x1024, Large: 1024x1792/1792x1024)
                  </li>
                  <li>• Zwischengespeicherte Eingaben können günstiger sein</li>
                  <li>• Alle Preise in Euro (€) inklusive Service-Aufschlag</li>
                </ul>
              </div>

              <div>
                <strong>Preisbeispiele:</strong>
                <ul class="mt-1 ml-4 space-y-1">
                  <li>
                    • <strong>GPT-4o-mini:</strong> Eingabe €0,94 / Ausgabe €3,76 (pro 1M Tokens)
                  </li>
                  <li>• <strong>GPT-4o:</strong> Eingabe €2,17 / Ausgabe €8,68 (pro 1M Tokens)</li>
                  <li>• <strong>DALL-E-3:</strong> Standard €3,47 / HD €6,94 (pro 100 Bilder)</li>
                  <li>• <strong>text-embedding-3-small:</strong> €0,000018 (pro 1000 Tokens)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PRICING_DISCLAIMER } from '@/config/pricing'
import { computed, ref } from 'vue'

interface Props {
  useFullDisclaimer?: boolean // Optional: Verwende den vollständigen Disclaimer aus pricing.ts
}

const props = withDefaults(defineProps<Props>(), {
  useFullDisclaimer: false,
})

const showDetails = ref(false)

// Formatiere den vollständigen Disclaimer für HTML-Anzeige
const formattedFullDisclaimer = computed(() => {
  if (!props.useFullDisclaimer) return ''

  // Konvertiere Markdown-ähnliche Formatierung zu HTML
  return PRICING_DISCLAIMER.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br>')
    .replace(/^- (.*?)(?=\n|$)/gm, '• $1')
    .replace(/^<p>/, '<p class="mb-2">')
})
</script>
