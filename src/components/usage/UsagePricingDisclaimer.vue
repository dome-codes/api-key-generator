<script setup lang="ts">
import { PRICING_DISCLAIMER } from '@/config/pricing'
import { computed, ref } from 'vue'

interface Props {
  useFullDisclaimer?: boolean // Optional: Verwende den vollständigen Disclaimer aus pricing.ts
  variant?: 'ai' | 'extraction' // Variante: 'ai' für AI Usage, 'extraction' für Document Intelligence
}

const props = withDefaults(defineProps<Props>(), {
  useFullDisclaimer: false,
  variant: 'ai',
})

const showDetails = ref(false)

// Formatiere den vollständigen Disclaimer für Template-Anzeige (ohne v-html)
interface TextPart {
  text: string
  bold: boolean
  italic?: boolean
}

interface FormattedLine {
  parts: TextPart[]
  isListItem: boolean
}

const formattedFullDisclaimer = computed(() => {
  if (!props.useFullDisclaimer) return []

  // Teile den Text in Absätze auf
  const paragraphs = PRICING_DISCLAIMER.split(/\n\n+/).filter((p) => p.trim())

  return paragraphs.map((paragraph): FormattedLine[] => {
    const lines = paragraph.split('\n').filter((l) => l.trim())
    return lines.map((line): FormattedLine => {
      const isListItem = line.trim().startsWith('- ')
      const lineText = isListItem ? line.trim().substring(2) : line.trim()

      // Ersetze **text** und *text* mit Markern für späteres Rendering
      const parts: TextPart[] = []
      const remaining = lineText
      let lastIndex = 0

      // Kombiniere Regex für **bold** und *italic*
      const formatRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g
      let match

      while ((match = formatRegex.exec(remaining)) !== null) {
        // Text vor dem Format
        if (match.index > lastIndex) {
          parts.push({ text: remaining.slice(lastIndex, match.index), bold: false, italic: false })
        }
        // Formatierter Text
        if (match[1]) {
          // **bold**
          parts.push({ text: match[1], bold: true, italic: false })
        } else if (match[2]) {
          // *italic*
          parts.push({ text: match[2], bold: false, italic: true })
        }
        lastIndex = match.index + match[0].length
      }

      // Restlicher Text
      if (lastIndex < remaining.length) {
        parts.push({ text: remaining.slice(lastIndex), bold: false, italic: false })
      }

      // Wenn keine Format-Marker gefunden wurden, gesamte Zeile als normal
      if (parts.length === 0) {
        parts.push({ text: lineText, bold: false, italic: false })
      }

      return { parts, isListItem }
    })
  })
})
</script>

<template>
  <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
    <div class="flex items-start">
      <svg
        class="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0"
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
        <div v-if="useFullDisclaimer" class="text-sm text-gray-700">
          <div class="space-y-2">
            <template v-for="(paragraph, pIdx) in formattedFullDisclaimer" :key="pIdx">
              <div
                v-if="paragraph.length > 0"
                :class="{ 'mb-2': pIdx < formattedFullDisclaimer.length - 1 }"
              >
                <template v-for="(line, lIdx) in paragraph" :key="lIdx">
                  <p v-if="!line.isListItem" class="mb-1">
                    <template v-for="(part, partIdx) in line.parts" :key="partIdx">
                      <strong v-if="part.bold">{{ part.text }}</strong>
                      <em v-else-if="part.italic">{{ part.text }}</em>
                      <template v-else>{{ part.text }}</template>
                    </template>
                  </p>
                  <div v-else class="ml-4 mb-1">
                    <span class="mr-2">•</span>
                    <template v-for="(part, partIdx) in line.parts" :key="partIdx">
                      <strong v-if="part.bold">{{ part.text }}</strong>
                      <em v-else-if="part.italic">{{ part.text }}</em>
                      <template v-else>{{ part.text }}</template>
                    </template>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </div>

        <!-- Kompakter Disclaimer (Standard) -->
        <div v-else class="text-sm text-gray-700">
          <!-- AI Usage Disclaimer -->
          <div v-if="variant === 'ai'">
            <p class="mb-1">
              <strong>Preisberechnung:</strong> Basierend auf
              <a
                href="https://azure.microsoft.com/de-de/pricing/details/cognitive-services/openai-service/#pricing"
                target="_blank"
                rel="noopener noreferrer"
                class="text-link hover:text-primary-hover underline"
              >
                Azure OpenAI Preisen (2026)
              </a>
              plus einem FITS-Aufschlag von 9%.
            </p>
            <p class="text-xs text-gray-600 italic">
              Diese Preise dienen zur Orientierung und können von den tatsächlichen
              Abrechnungspreisen abweichen.
            </p>
          </div>

          <!-- Extraction/Document Intelligence Disclaimer -->
          <div v-else-if="variant === 'extraction'">
            <p class="mb-1">
              <strong>Preisberechnung:</strong> Basierend auf
              <a
                href="https://azure.microsoft.com/de-de/pricing/details/ai-document-intelligence/"
                target="_blank"
                rel="noopener noreferrer"
                class="text-link hover:text-primary-hover underline"
              >
                Azure Document Intelligence Preisen
              </a>
              plus einem FITS-Aufschlag von 9%.
            </p>
            <p class="text-xs text-gray-600 italic">
              Diese Preise dienen zur Orientierung und können von den tatsächlichen
              Abrechnungspreisen abweichen.
            </p>
          </div>
        </div>

        <!-- Erweiterbare Details (für beide Varianten) -->
        <div v-if="!useFullDisclaimer" class="mt-2">
          <button
            class="text-xs text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1"
            @click="showDetails = !showDetails"
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
          <div v-if="showDetails" class="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-xs text-gray-700 space-y-2">
              <!-- AI Usage Details -->
              <div v-if="variant === 'ai'">
                <div>
                  <strong>Wichtige Hinweise:</strong>
                  <ul class="mt-1 ml-4 space-y-1">
                    <li>
                      • <strong>Completion Models:</strong> Preise sind pro 1 Million Tokens
                      berechnet
                    </li>
                    <li>
                      • <strong>Embedding Models:</strong> Preise sind pro 1000 Tokens berechnet
                    </li>
                    <li>
                      • <strong>Image Models:</strong> Preise sind pro 100 Bilder berechnet
                      (Standard: 1024x1024, HD: 1024x1024, Large: 1024x1792/1792x1024)
                    </li>
                    <li>• Zwischengespeicherte Eingaben können günstiger sein</li>
                    <li>• Alle Preise in Euro (€) inklusive FITS-Aufschlag</li>
                  </ul>
                </div>

                <div class="mt-3">
                  <strong>Preisbeispiele:</strong>
                  <ul class="mt-1 ml-4 space-y-1">
                    <li>
                      • <strong>GPT-4o-mini:</strong> Eingabe €0,14 / Ausgabe €0,55 (pro 1M Tokens)
                    </li>
                    <li>
                      • <strong>GPT-4o:</strong> Eingabe €2,30 / Ausgabe €9,20 (pro 1M Tokens)
                    </li>
                    <li>• <strong>DALL-E-3:</strong> Standard €3,47 / HD €6,94 (pro 100 Bilder)</li>
                    <li>• <strong>text-embedding-3-small:</strong> €0,000018 (pro 1000 Tokens)</li>
                  </ul>
                </div>
              </div>

              <!-- Extraction Details -->
              <div v-else-if="variant === 'extraction'">
                <div>
                  <strong>Wichtige Hinweise:</strong>
                  <ul class="mt-1 ml-4 space-y-1">
                    <li>
                      • <strong>Azure Document Intelligence:</strong> Preise basieren auf der Anzahl
                      der verarbeiteten Seiten/Dokumente. Der FITS-Aufschlag von 9% wird auf die
                      Azure Preise aufgeschlagen.
                    </li>
                    <li>• Alle Preise in Euro (€) inklusive FITS-Aufschlag</li>
                    <li>
                      • Die tatsächlichen Kosten können je nach Dokumenttyp, Modell (Prebuilt vs.
                      Custom) und Komplexität variieren
                    </li>
                    <li>
                      • Für aktuelle Preise konsultieren Sie bitte die offiziellen Pricing-Seiten
                      von Azure Document Intelligence
                    </li>
                  </ul>
                </div>

                <div class="mt-3">
                  <strong>Preisbeispiele (pro 100 Seiten, inkl. 9% FITS-Aufschlag):</strong>
                  <ul class="mt-1 ml-4 space-y-1">
                    <li>
                      • <strong>Azure Document Intelligence:</strong> Standard-Modelle (Prebuilt) ab
                      ca. €1,15 pro 100 Seiten / Custom Modelle ab ca. €1,50 pro 100 Seiten
                    </li>
                  </ul>
                  <p class="text-xs text-gray-600 italic mt-2">
                    Hinweis: Die genannten Preise sind Richtwerte basierend auf öffentlich
                    verfügbaren Informationen und können sich ändern. Bitte konsultieren Sie die
                    offiziellen Pricing-Seiten für aktuelle Preise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
