/**
 * Pricing Service
 *
 * Lädt Preise aus lokaler JSON-Datei (public/pricing.json)
 * Einfache Implementierung für lokales Testen
 */

import {
  type ModelPricing,
  type ImageModelPricing,
  type EmbeddingModelPricing,
  DEFAULT_AZURE_MODEL_PRICING,
  DEFAULT_AZURE_IMAGE_MODEL_PRICING,
  DEFAULT_AZURE_EMBEDDING_MODEL_PRICING,
} from '@/config/pricing'
import { debugLog } from '@/utils/debugLog'

const PRICING_JSON_URL = '/admin-console/pricing.json'
const SNAPSHOT_BASE = '/admin-console/pricing-snapshots'

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
   * Lädt alle Completion-Model-Preise.
   * Bevorzugt den Snapshot für den aktuellen Monat (API + Override), sonst pricing.json.
   */
  async getModelPricing(): Promise<ModelPricing[]> {
    const yyyyMm = new Date().toISOString().slice(0, 7)
    const snapshot = await this.getModelPricingForDate(yyyyMm)
    if (snapshot?.length) return snapshot
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
   * Lädt Modell-Preise für einen Stichtag (Abrechnungsmonat) aus Snapshot.
   * Für Nachweis: Preise stammen aus Azure Retail Prices (siehe Snapshot-_meta).
   * @param date ISO-Datum (z. B. 2025-03-15) oder YYYY-MM → lädt pricing-YYYY-MM.json
   * @returns modelPricing-Array oder null, wenn kein Snapshot existiert
   */
  async getModelPricingForDate(date: string): Promise<ModelPricing[] | null> {
    const yyyyMm =
      date.length === 7 && date[4] === '-'
        ? date
        : date.slice(0, 7)
    const url = `${SNAPSHOT_BASE}/pricing-${yyyyMm}.json`
    try {
      const response = await fetch(url)
      if (!response.ok) return null
      const data = (await response.json()) as {
        modelPricing?: ModelPricing[]
        _meta?: { effectiveDate: string; source: string }
      }
      if (data.modelPricing?.length) {
        debugLog('[pricingService] Snapshot loaded for', yyyyMm, data._meta?.source)
        return data.modelPricing
      }
    } catch {
      // Snapshot nicht vorhanden oder Netzfehler
    }
    return null
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
          data.modelPricing.forEach((model: unknown, index: number) => {
            if (!model || typeof model !== 'object') {
              throw new Error(`Ungültiges Modell in modelPricing[${index}]: Muss ein Objekt sein.`)
            }
            const modelObj = model as ModelPricing
            if (typeof modelObj.modelName !== 'string' || !modelObj.modelName.trim()) {
              throw new Error(
                `Ungültiges Modell in modelPricing[${index}]: "modelName" muss ein nicht-leerer String sein.`,
              )
            }
            if (typeof modelObj.inputPrice !== 'number' || modelObj.inputPrice < 0) {
              throw new Error(
                `Ungültiges Modell in modelPricing[${index}]: "inputPrice" muss eine positive Zahl sein.`,
              )
            }
            if (typeof modelObj.outputPrice !== 'number' || modelObj.outputPrice < 0) {
              throw new Error(
                `Ungültiges Modell in modelPricing[${index}]: "outputPrice" muss eine positive Zahl sein.`,
              )
            }
            if (
              modelObj.cachedInputPrice !== undefined &&
              (typeof modelObj.cachedInputPrice !== 'number' || modelObj.cachedInputPrice < 0)
            ) {
              throw new Error(
                `Ungültiges Modell in modelPricing[${index}]: "cachedInputPrice" muss eine positive Zahl oder undefined sein.`,
              )
            }
            if (
              modelObj.reasoningPrice !== undefined &&
              (typeof modelObj.reasoningPrice !== 'number' || modelObj.reasoningPrice < 0)
            ) {
              throw new Error(
                `Ungültiges Modell in modelPricing[${index}]: "reasoningPrice" muss eine positive Zahl oder undefined sein.`,
              )
            }
          })

          // Validiere jedes ImageModelPricing-Element
          data.imagePricing.forEach((model: unknown, index: number) => {
            if (!model || typeof model !== 'object') {
              throw new Error(`Ungültiges Modell in imagePricing[${index}]: Muss ein Objekt sein.`)
            }
            const modelObj = model as ImageModelPricing
            if (typeof modelObj.modelName !== 'string' || !modelObj.modelName.trim()) {
              throw new Error(
                `Ungültiges Modell in imagePricing[${index}]: "modelName" muss ein nicht-leerer String sein.`,
              )
            }
            if (typeof modelObj.standardPrice !== 'number' || modelObj.standardPrice < 0) {
              throw new Error(
                `Ungültiges Modell in imagePricing[${index}]: "standardPrice" muss eine positive Zahl sein.`,
              )
            }
            if (typeof modelObj.hdPrice !== 'number' || modelObj.hdPrice < 0) {
              throw new Error(
                `Ungültiges Modell in imagePricing[${index}]: "hdPrice" muss eine positive Zahl sein.`,
              )
            }
            if (
              modelObj.standardPriceLarge !== undefined &&
              (typeof modelObj.standardPriceLarge !== 'number' || modelObj.standardPriceLarge < 0)
            ) {
              throw new Error(
                `Ungültiges Modell in imagePricing[${index}]: "standardPriceLarge" muss eine positive Zahl oder undefined sein.`,
              )
            }
            if (
              modelObj.hdPriceLarge !== undefined &&
              (typeof modelObj.hdPriceLarge !== 'number' || modelObj.hdPriceLarge < 0)
            ) {
              throw new Error(
                `Ungültiges Modell in imagePricing[${index}]: "hdPriceLarge" muss eine positive Zahl oder undefined sein.`,
              )
            }
          })

          // Validiere jedes EmbeddingModelPricing-Element
          data.embeddingPricing.forEach((model: unknown, index: number) => {
            if (!model || typeof model !== 'object') {
              throw new Error(
                `Ungültiges Modell in embeddingPricing[${index}]: Muss ein Objekt sein.`,
              )
            }
            const modelObj = model as EmbeddingModelPricing
            if (typeof modelObj.modelName !== 'string' || !modelObj.modelName.trim()) {
              throw new Error(
                `Ungültiges Modell in embeddingPricing[${index}]: "modelName" muss ein nicht-leerer String sein.`,
              )
            }
            if (
              typeof modelObj.pricePer1000Tokens !== 'number' ||
              modelObj.pricePer1000Tokens < 0
            ) {
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
