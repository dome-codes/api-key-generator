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
}
