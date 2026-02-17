/**
 * Pricing Service
 * 
 * Lädt Preise aus lokaler JSON-Datei (public/pricing.json)
 * Einfache Implementierung für lokales Testen
 */

import type {
  ModelPricing,
  ImageModelPricing,
  EmbeddingModelPricing,
} from '@/config/pricing'
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
          
          // Validierung der Struktur
          if (!data.modelPricing || !data.imagePricing || !data.embeddingPricing || typeof data.markupPercentage !== 'number') {
            throw new Error('Ungültige JSON-Struktur. Erwartet: modelPricing, imagePricing, embeddingPricing, markupPercentage')
          }
          
          debugLog('[pricingService] Pricing JSON uploaded and parsed')
          resolve(data)
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Fehler beim Parsen der JSON-Datei'))
        }
      }
      reader.onerror = () => {
        reject(new Error('Fehler beim Lesen der Datei'))
      }
      reader.readAsText(file)
    })
  },
}
