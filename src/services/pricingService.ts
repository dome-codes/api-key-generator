/**
 * Pricing Service
 *
 * Lädt Preise aus lokaler JSON-Datei (public/pricing.json)
 * Einfache Implementierung für lokales Testen
 */

import type { ModelPricing, ImageModelPricing, EmbeddingModelPricing } from '@/config/pricing'
import {
  DEFAULT_AZURE_MODEL_PRICING,
  DEFAULT_AZURE_IMAGE_MODEL_PRICING,
  DEFAULT_AZURE_EMBEDDING_MODEL_PRICING,
} from '@/config/pricing'
import { debugLog } from '@/utils/debugLog'

const PRICING_JSON_URL = '/admin-console/pricing.json'

// Cache für geladene Preise
let cachedPricing: {
  modelPricing?: ModelPricing[]
  imagePricing?: ImageModelPricing[]
  embeddingPricing?: EmbeddingModelPricing[]
  markupPercentage?: number
} | null = null

// Lade JSON-Datei einmalig
async function loadPricingJson() {
  if (cachedPricing) {
    return cachedPricing
  }

  try {
    const response = await fetch(PRICING_JSON_URL)
    if (response.ok) {
      const data = await response.json()
      cachedPricing = data
      debugLog('[pricingService] Loaded pricing from JSON file')
      return data
    }
  } catch (error) {
    debugLog('[pricingService] Error loading pricing.json:', error)
  }

  // Fallback zu Defaults
  return {
    modelPricing: DEFAULT_AZURE_MODEL_PRICING,
    imagePricing: DEFAULT_AZURE_IMAGE_MODEL_PRICING,
    embeddingPricing: DEFAULT_AZURE_EMBEDDING_MODEL_PRICING,
    markupPercentage: 0.09,
  }
}

export const pricingService = {
  /**
   * Lädt alle Completion-Model-Preise aus JSON-Datei
   */
  async getModelPricing(): Promise<ModelPricing[]> {
    const pricing = await loadPricingJson()
    return pricing.modelPricing || DEFAULT_AZURE_MODEL_PRICING
  },

  /**
   * Lädt alle Image-Model-Preise aus JSON-Datei
   */
  async getImagePricing(): Promise<ImageModelPricing[]> {
    const pricing = await loadPricingJson()
    return pricing.imagePricing || DEFAULT_AZURE_IMAGE_MODEL_PRICING
  },

  /**
   * Lädt alle Embedding-Model-Preise aus JSON-Datei
   */
  async getEmbeddingPricing(): Promise<EmbeddingModelPricing[]> {
    const pricing = await loadPricingJson()
    return pricing.embeddingPricing || DEFAULT_AZURE_EMBEDDING_MODEL_PRICING
  },

  /**
   * Lädt FITS-Aufschlag aus JSON-Datei
   */
  async getMarkupPercentage(): Promise<number> {
    const pricing = await loadPricingJson()
    return pricing.markupPercentage || 0.09
  },

  /**
   * Aktualisiert Cache (wird aufgerufen wenn JSON-Datei geändert wurde)
   */
  reloadPricing() {
    cachedPricing = null
    debugLog('[pricingService] Pricing cache cleared')
  },

  /**
   * Erstellt Download-Link für aktuelle Preise (als JSON-Datei)
   * Da keine API vorhanden ist, wird die Datei zum Download bereitgestellt
   */
  downloadPricingJson(pricing: {
    modelPricing: ModelPricing[]
    imagePricing: ImageModelPricing[]
    embeddingPricing: EmbeddingModelPricing[]
    markupPercentage: number
  }): void {
    // Erstelle Zeitstempel für Dateinamen (Format: YYYY-MM-DD-HH-MM-SS)
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`

    const jsonString = JSON.stringify(pricing, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pricing-${timestamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    debugLog('[pricingService] Pricing JSON downloaded')
  },

  /**
   * Lädt Pricing-Daten aus einer hochgeladenen JSON-Datei
   * Validiert die Struktur und gibt detaillierte Fehlermeldungen zurück
   */
  async uploadPricingJson(file: File): Promise<{
    modelPricing: ModelPricing[]
    imagePricing: ImageModelPricing[]
    embeddingPricing: EmbeddingModelPricing[]
    markupPercentage: number
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)

          // Validierung der Top-Level-Struktur
          if (!data || typeof data !== 'object') {
            throw new Error('Ungültige JSON-Struktur: Die Datei muss ein Objekt enthalten.')
          }

          // Prüfe ob alle erforderlichen Felder vorhanden sind
          if (!data.modelPricing) {
            throw new Error('Fehlendes Feld: "modelPricing" ist erforderlich.')
          }
          if (!data.imagePricing) {
            throw new Error('Fehlendes Feld: "imagePricing" ist erforderlich.')
          }
          if (!data.embeddingPricing) {
            throw new Error('Fehlendes Feld: "embeddingPricing" ist erforderlich.')
          }
          if (typeof data.markupPercentage !== 'number') {
            throw new Error(
              'Fehlendes oder ungültiges Feld: "markupPercentage" muss eine Zahl sein.',
            )
          }

          // Prüfe ob Arrays vorhanden sind
          if (!Array.isArray(data.modelPricing)) {
            throw new Error('Ungültiger Typ: "modelPricing" muss ein Array sein.')
          }
          if (!Array.isArray(data.imagePricing)) {
            throw new Error('Ungültiger Typ: "imagePricing" muss ein Array sein.')
          }
          if (!Array.isArray(data.embeddingPricing)) {
            throw new Error('Ungültiger Typ: "embeddingPricing" muss ein Array sein.')
          }

          // Validiere jedes ModelPricing-Element
          data.modelPricing.forEach((model: any, index: number) => {
            if (!model || typeof model !== 'object') {
              throw new Error(`Ungültiges Modell in modelPricing[${index}]: Muss ein Objekt sein.`)
            }
            if (typeof model.modelName !== 'string' || !model.modelName.trim()) {
              throw new Error(
                `Ungültiges Modell in modelPricing[${index}]: "modelName" muss ein nicht-leerer String sein.`,
              )
            }
            if (typeof model.inputPrice !== 'number' || model.inputPrice < 0) {
              throw new Error(
                `Ungültiges Modell in modelPricing[${index}]: "inputPrice" muss eine positive Zahl sein.`,
              )
            }
            if (typeof model.outputPrice !== 'number' || model.outputPrice < 0) {
              throw new Error(
                `Ungültiges Modell in modelPricing[${index}]: "outputPrice" muss eine positive Zahl sein.`,
              )
            }
            if (
              model.cachedInputPrice !== undefined &&
              (typeof model.cachedInputPrice !== 'number' || model.cachedInputPrice < 0)
            ) {
              throw new Error(
                `Ungültiges Modell in modelPricing[${index}]: "cachedInputPrice" muss eine positive Zahl oder undefined sein.`,
              )
            }
            if (
              model.reasoningPrice !== undefined &&
              (typeof model.reasoningPrice !== 'number' || model.reasoningPrice < 0)
            ) {
              throw new Error(
                `Ungültiges Modell in modelPricing[${index}]: "reasoningPrice" muss eine positive Zahl oder undefined sein.`,
              )
            }
          })

          // Validiere jedes ImageModelPricing-Element
          data.imagePricing.forEach((model: any, index: number) => {
            if (!model || typeof model !== 'object') {
              throw new Error(`Ungültiges Modell in imagePricing[${index}]: Muss ein Objekt sein.`)
            }
            if (typeof model.modelName !== 'string' || !model.modelName.trim()) {
              throw new Error(
                `Ungültiges Modell in imagePricing[${index}]: "modelName" muss ein nicht-leerer String sein.`,
              )
            }
            if (typeof model.standardPrice !== 'number' || model.standardPrice < 0) {
              throw new Error(
                `Ungültiges Modell in imagePricing[${index}]: "standardPrice" muss eine positive Zahl sein.`,
              )
            }
            if (typeof model.hdPrice !== 'number' || model.hdPrice < 0) {
              throw new Error(
                `Ungültiges Modell in imagePricing[${index}]: "hdPrice" muss eine positive Zahl sein.`,
              )
            }
            if (
              model.standardPriceLarge !== undefined &&
              (typeof model.standardPriceLarge !== 'number' || model.standardPriceLarge < 0)
            ) {
              throw new Error(
                `Ungültiges Modell in imagePricing[${index}]: "standardPriceLarge" muss eine positive Zahl oder undefined sein.`,
              )
            }
            if (
              model.hdPriceLarge !== undefined &&
              (typeof model.hdPriceLarge !== 'number' || model.hdPriceLarge < 0)
            ) {
              throw new Error(
                `Ungültiges Modell in imagePricing[${index}]: "hdPriceLarge" muss eine positive Zahl oder undefined sein.`,
              )
            }
          })

          // Validiere jedes EmbeddingModelPricing-Element
          data.embeddingPricing.forEach((model: any, index: number) => {
            if (!model || typeof model !== 'object') {
              throw new Error(
                `Ungültiges Modell in embeddingPricing[${index}]: Muss ein Objekt sein.`,
              )
            }
            if (typeof model.modelName !== 'string' || !model.modelName.trim()) {
              throw new Error(
                `Ungültiges Modell in embeddingPricing[${index}]: "modelName" muss ein nicht-leerer String sein.`,
              )
            }
            if (typeof model.pricePer1000Tokens !== 'number' || model.pricePer1000Tokens < 0) {
              throw new Error(
                `Ungültiges Modell in embeddingPricing[${index}]: "pricePer1000Tokens" muss eine positive Zahl sein.`,
              )
            }
          })

          // Validiere markupPercentage
          if (data.markupPercentage < 0 || data.markupPercentage > 1) {
            throw new Error(
              'Ungültiger Wert: "markupPercentage" muss zwischen 0 und 1 liegen (z.B. 0.09 für 9%).',
            )
          }

          debugLog('[pricingService] Pricing JSON uploaded and parsed successfully')
          resolve(data)
        } catch (error) {
          if (error instanceof SyntaxError) {
            reject(
              new Error(
                'Ungültige JSON-Syntax: Die Datei konnte nicht geparst werden. Bitte überprüfen Sie die Datei auf Syntaxfehler.',
              ),
            )
          } else {
            reject(
              error instanceof Error
                ? error
                : new Error('Unbekannter Fehler beim Validieren der JSON-Datei'),
            )
          }
        }
      }
      reader.onerror = () => {
        reject(new Error('Fehler beim Lesen der Datei. Bitte versuchen Sie es erneut.'))
      }
      reader.readAsText(file)
    })
  },
}
