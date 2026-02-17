/**
 * Composable für Preisverwaltung
 * 
 * Lädt Preise aus lokaler JSON-Datei (public/pricing.json)
 * Änderungen werden nur im State gehalten (nicht gespeichert)
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
import { pricingService } from '@/services/pricingService'
import { ref, onMounted } from 'vue'
import { debugLog } from '@/utils/debugLog'

export function usePricingManagement() {
  // State - wird initial aus JSON-Datei geladen
  const modelPricing = ref<ModelPricing[]>([])
  const imagePricing = ref<ImageModelPricing[]>([])
  const embeddingPricing = ref<EmbeddingModelPricing[]>([])
  const markupPercentage = ref<number>(0.09)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Lade initial alle Preise aus JSON-Datei
  const loadPricing = async () => {
    isLoading.value = true
    error.value = null
    try {
      const [models, images, embeddings, markup] = await Promise.all([
        pricingService.getModelPricing(),
        pricingService.getImagePricing(),
        pricingService.getEmbeddingPricing(),
        pricingService.getMarkupPercentage(),
      ])
      modelPricing.value = models
      imagePricing.value = images
      embeddingPricing.value = embeddings
      markupPercentage.value = markup
      debugLog('[PricingManagement] Loaded pricing from JSON file')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Laden der Preise'
      console.error('[PricingManagement] Error loading pricing:', err)
      // Fallback zu Defaults
      modelPricing.value = [...DEFAULT_AZURE_MODEL_PRICING]
      imagePricing.value = [...DEFAULT_AZURE_IMAGE_MODEL_PRICING]
      embeddingPricing.value = [...DEFAULT_AZURE_EMBEDDING_MODEL_PRICING]
      markupPercentage.value = 0.09
    } finally {
      isLoading.value = false
    }
  }

  // Actions - Änderungen werden nur im State gehalten (nicht gespeichert)
  const updateModelPricing = (model: ModelPricing) => {
    const index = modelPricing.value.findIndex(
      (m) => m.modelName.toLowerCase() === model.modelName.toLowerCase(),
    )
    if (index >= 0) {
      modelPricing.value[index] = model
    } else {
      modelPricing.value.push(model)
    }
  }

  const deleteModelPricing = (modelName: string) => {
    const index = modelPricing.value.findIndex(
      (m) => m.modelName.toLowerCase() === modelName.toLowerCase(),
    )
    if (index >= 0) {
      modelPricing.value.splice(index, 1)
    }
  }

  const addModelPricing = (model: ModelPricing) => {
    modelPricing.value.push(model)
  }

  const updateImagePricing = (model: ImageModelPricing) => {
    const index = imagePricing.value.findIndex(
      (m) => m.modelName.toLowerCase() === model.modelName.toLowerCase(),
    )
    if (index >= 0) {
      imagePricing.value[index] = model
    } else {
      imagePricing.value.push(model)
    }
  }

  const deleteImagePricing = (modelName: string) => {
    const index = imagePricing.value.findIndex(
      (m) => m.modelName.toLowerCase() === modelName.toLowerCase(),
    )
    if (index >= 0) {
      imagePricing.value.splice(index, 1)
    }
  }

  const addImagePricing = (model: ImageModelPricing) => {
    imagePricing.value.push(model)
  }

  const updateEmbeddingPricing = (model: EmbeddingModelPricing) => {
    const index = embeddingPricing.value.findIndex(
      (m) => m.modelName.toLowerCase() === model.modelName.toLowerCase(),
    )
    if (index >= 0) {
      embeddingPricing.value[index] = model
    } else {
      embeddingPricing.value.push(model)
    }
  }

  const deleteEmbeddingPricing = (modelName: string) => {
    const index = embeddingPricing.value.findIndex(
      (m) => m.modelName.toLowerCase() === modelName.toLowerCase(),
    )
    if (index >= 0) {
      embeddingPricing.value.splice(index, 1)
    }
  }

  const addEmbeddingPricing = (model: EmbeddingModelPricing) => {
    embeddingPricing.value.push(model)
  }

  const resetToDefaults = () => {
    modelPricing.value = [...DEFAULT_AZURE_MODEL_PRICING]
    imagePricing.value = [...DEFAULT_AZURE_IMAGE_MODEL_PRICING]
    embeddingPricing.value = [...DEFAULT_AZURE_EMBEDDING_MODEL_PRICING]
    markupPercentage.value = 0.09
  }

  /**
   * Speichert aktuelle Preise als JSON-Datei (Download)
   * Die Datei muss manuell in public/pricing.json kopiert werden
   */
  const savePricing = () => {
    const pricingData = {
      modelPricing: modelPricing.value,
      imagePricing: imagePricing.value,
      embeddingPricing: embeddingPricing.value,
      markupPercentage: markupPercentage.value,
    }
    pricingService.downloadPricingJson(pricingData)
  }

  /**
   * Lädt Pricing-Daten aus einer hochgeladenen JSON-Datei
   */
  const uploadPricing = async (file: File) => {
    isLoading.value = true
    error.value = null
    try {
      const data = await pricingService.uploadPricingJson(file)
      modelPricing.value = data.modelPricing
      imagePricing.value = data.imagePricing
      embeddingPricing.value = data.embeddingPricing
      markupPercentage.value = data.markupPercentage
      debugLog('[PricingManagement] Pricing uploaded from JSON file')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Hochladen der Preise'
      console.error('[PricingManagement] Error uploading pricing:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Initial load beim Mount
  onMounted(() => {
    loadPricing()
  })

  return {
    // State
    modelPricing,
    imagePricing,
    embeddingPricing,
    markupPercentage,
    isLoading,
    error,

    // Actions
    loadPricing,
    updateModelPricing,
    deleteModelPricing,
    addModelPricing,
    updateImagePricing,
    deleteImagePricing,
    addImagePricing,
    updateEmbeddingPricing,
    deleteEmbeddingPricing,
    addEmbeddingPricing,
    resetToDefaults,
    savePricing,
    uploadPricing,
  }
}
