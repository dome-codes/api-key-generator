// Azure OpenAI Preise – pro 1 Million Tokens
export interface ModelPricing {
  modelName: string
  inputPrice: number // € pro 1M Tokens
  outputPrice: number // € pro 1M Tokens
  cachedInputPrice?: number // € pro 1M Tokens (optional)
  reasoningPrice?: number // € pro 1M Tokens (optional, für Reasoning-Tokens)
}

// Image-basierte Preise (pro Bild)
export interface ImageModelPricing {
  modelName: string
  standardPrice: number // € pro 100 Bilder (standard quality)
  hdPrice: number // € pro 100 Bilder (hd quality)
  standardPriceLarge?: number // € pro 100 Bilder (large resolution)
  hdPriceLarge?: number // € pro 100 Bilder (hd large resolution)
}

// Embedding-basierte Preise (pro 1000 Tokens)
export interface EmbeddingModelPricing {
  modelName: string
  pricePer1000Tokens: number // € pro 1000 Tokens
}

// Document Intelligence / Extraction Preise (pro Seite)
export interface ExtractionModelPricing {
  modelId: string
  pricePerPage: number // € pro Seite
}

// Default Preise (werden verwendet wenn keine localStorage-Daten vorhanden)
// Ausgelagert in eigene Datei, damit Pricing-Tabellen leichter gepflegt werden können.
import {
  DEFAULT_AZURE_EMBEDDING_MODEL_PRICING,
  DEFAULT_AZURE_IMAGE_MODEL_PRICING,
  DEFAULT_AZURE_MODEL_PRICING,
  DEFAULT_EXTRACTION_MODEL_PRICING,
} from './pricingModels'

// FITS-Aufschlag (9%) - kann aus localStorage geladen werden
const DEFAULT_SERVICE_MARKUP_PERCENTAGE = 0.09

// Pricing-Quelle:
// Standardmäßig nutzen wir **nur Defaults** aus pricingModels.ts, damit es keine Inkonsistenzen
// durch veraltete localStorage-Daten gibt (z.B. alte Modelllisten -> alles fällt auf "unknown").
//
// Optional kann localStorage wieder aktiviert werden (z.B. solange Preisverwaltung noch genutzt wird)
// über ein Env-Flag:
// - VITE_USE_PRICING_STORAGE=true
const USE_PRICING_STORAGE = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (import.meta as any)?.env?.VITE_USE_PRICING_STORAGE
    return String(v).toLowerCase() === 'true'
  } catch {
    return false
  }
})()

// Lade Preise aus localStorage oder verwende Defaults
// WICHTIG: Diese Funktionen werden verwendet wenn pricing.ts direkt importiert wird.
function loadPricingFromStorage<T>(key: string, defaults: T[]): T[] {
  if (!USE_PRICING_STORAGE) return defaults
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored) as T[]
    }
  } catch (_error) {
    // Error loading pricing - fallback to defaults
  }
  return defaults
}

function loadMarkupFromStorage(): number {
  if (!USE_PRICING_STORAGE) return DEFAULT_SERVICE_MARKUP_PERCENTAGE
  try {
    const stored = localStorage.getItem('pricing:markup')
    if (stored) {
      return parseFloat(stored)
    }
  } catch (_error) {
    // Error loading markup - fallback to default
  }
  return DEFAULT_SERVICE_MARKUP_PERCENTAGE
}

// Exportierte Preise - werden aus localStorage geladen oder verwenden Defaults
// Diese werden verwendet wenn calculateCost aufgerufen wird
// localStorage wird automatisch von pricingService aktualisiert wenn Admin Preise ändert
export const AZURE_MODEL_PRICING: ModelPricing[] = loadPricingFromStorage(
  'pricing:model',
  DEFAULT_AZURE_MODEL_PRICING,
)

export const AZURE_IMAGE_MODEL_PRICING: ImageModelPricing[] = loadPricingFromStorage(
  'pricing:image',
  DEFAULT_AZURE_IMAGE_MODEL_PRICING,
)

export const AZURE_EMBEDDING_MODEL_PRICING: EmbeddingModelPricing[] = loadPricingFromStorage(
  'pricing:embedding',
  DEFAULT_AZURE_EMBEDDING_MODEL_PRICING,
)

export const AZURE_EXTRACTION_MODEL_PRICING: ExtractionModelPricing[] = loadPricingFromStorage(
  'pricing:extraction',
  DEFAULT_EXTRACTION_MODEL_PRICING,
)

export const SERVICE_MARKUP_PERCENTAGE = loadMarkupFromStorage()

// Helper: Lade aktuelle Preise dynamisch (wird bei jedem calculateCost-Aufruf verwendet)
// Diese Funktionen werden aktuell nicht verwendet, aber für zukünftige Verwendung bereitgehalten
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getCurrentModelPricing(): ModelPricing[] {
  return loadPricingFromStorage('pricing:model', DEFAULT_AZURE_MODEL_PRICING)
}

function getCurrentImagePricing(): ImageModelPricing[] {
  return loadPricingFromStorage('pricing:image', DEFAULT_AZURE_IMAGE_MODEL_PRICING)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getCurrentEmbeddingPricing(): EmbeddingModelPricing[] {
  return loadPricingFromStorage('pricing:embedding', DEFAULT_AZURE_EMBEDDING_MODEL_PRICING)
}

function getCurrentMarkup(): number {
  return loadMarkupFromStorage()
}

// Exportiere auch die Defaults für Reset-Funktionalität
export {
  DEFAULT_AZURE_EMBEDDING_MODEL_PRICING,
  DEFAULT_AZURE_IMAGE_MODEL_PRICING,
  DEFAULT_AZURE_MODEL_PRICING,
  DEFAULT_EXTRACTION_MODEL_PRICING,
  DEFAULT_SERVICE_MARKUP_PERCENTAGE,
}

// Erweiterte Preisberechnung mit Unterstützung für verschiedene ModelUsageTypes
export function calculateCost(
  tokensIn: number,
  tokensOut: number,
  modelName: string,
  useCachedInput: boolean = false,
  modelType?: string,
  imageQuality?: string,
  imageCount?: number,
  sizeWidth?: number,
  sizeHeight?: number,
): {
  inputCost: number
  outputCost: number
  totalCost: number
  serviceMarkup: number
  finalCost: number
} {
  // Spezielle Behandlung für Image-Modelle (API: IMAGE_USAGE, alt: ImageModelUsage)
  if (
    modelType === 'ImageModelUsage' ||
    modelType === 'IMAGE_USAGE' ||
    modelName.toLowerCase().includes('image') ||
    modelName.toLowerCase().includes('dall-e') ||
    modelName.toLowerCase().includes('midjourney')
  ) {
    return calculateImageCost(modelName, imageQuality, imageCount, sizeWidth, sizeHeight)
  }

  // Spezielle Behandlung für Embedding-Modelle (API: EMBEDDING_USAGE, alt: EmbeddingModelUsage)
  if (
    modelType === 'EmbeddingModelUsage' ||
    modelType === 'EMBEDDING_USAGE' ||
    modelName.toLowerCase().includes('embedding')
  ) {
    return calculateEmbeddingCost(tokensIn, modelName, useCachedInput)
  }

  // Standard-Token-basierte Berechnung für Completion-Modelle
  return calculateCompletionCost(tokensIn, tokensOut, modelName, useCachedInput)
}

/**
 * Completion-Kostenberechnung mit getrennten Token-Typen:
 * - inputTokens (normal)
 * - cachedInputTokens (Prompt-Cache)
 * - outputTokens (normal)
 * - reasoningTokens (optional, eigener Preis; fallback auf outputPrice)
 *
 * WICHTIG: Wenn das Modell nicht in der Preisliste gepflegt ist, liefert diese Funktion
 * bewusst 0-Kosten (usedFallbackPricing=true), um keine irreführenden Summen anzuzeigen.
 */
export function calculateCompletionCostDetailed(params: {
  modelName: string
  inputTokens: number
  cachedInputTokens?: number
  /** Output Tokens gesamt (inkl. Reasoning, falls Backend Reasoning als Teil von Output zählt) */
  outputTokens: number
  reasoningTokens?: number
}): {
  inputCost: number
  cachedInputCost: number
  outputCost: number
  reasoningCost: number
  totalCost: number
  serviceMarkup: number
  finalCost: number
  usedFallbackPricing: boolean
} {
  const currentPricing = loadPricingFromStorage('pricing:model', DEFAULT_AZURE_MODEL_PRICING)
  const currentMarkup = loadMarkupFromStorage()

  const normalizedName = (params.modelName || '').toLowerCase()
  // WICHTIG: localStorage kann veraltete Pricing-Listen enthalten.
  // Wenn ein Modell im aktuellen Storage nicht vorhanden ist, aber in unseren Defaults,
  // dann soll es trotzdem korrekt gematcht werden (sonst fällt alles auf "unknown").
  const directMatch =
    currentPricing.find((m) => m.modelName.toLowerCase() === normalizedName) ??
    DEFAULT_AZURE_MODEL_PRICING.find((m) => m.modelName.toLowerCase() === normalizedName)

  const fallbackModel =
    currentPricing.find((m) => m.modelName === 'unknown') ??
    DEFAULT_AZURE_MODEL_PRICING.find((m) => m.modelName === 'unknown')

  const model = directMatch ?? fallbackModel

  if (!model) {
    throw new Error(`Model ${params.modelName} not found in pricing`)
  }

  if (!directMatch && fallbackModel && model === fallbackModel) {
    return {
      inputCost: 0,
      cachedInputCost: 0,
      outputCost: 0,
      reasoningCost: 0,
      totalCost: 0,
      serviceMarkup: 0,
      finalCost: 0,
      usedFallbackPricing: true,
    }
  }

  const safeInput =
    Number.isFinite(params.inputTokens) && params.inputTokens > 0 ? params.inputTokens : 0
  const safeCached =
    Number.isFinite(params.cachedInputTokens) && (params.cachedInputTokens as number) > 0
      ? (params.cachedInputTokens as number)
      : 0
  const safeReasoning =
    Number.isFinite(params.reasoningTokens) && (params.reasoningTokens as number) > 0
      ? (params.reasoningTokens as number)
      : 0
  const safeOutputTotal =
    Number.isFinite(params.outputTokens) && params.outputTokens > 0 ? params.outputTokens : 0
  // Single Source of Truth:
  // Reasoning wird im Backend häufig als Teil der Output-Tokens gezählt.
  // Für getrennte Bepreisung trennen wir hier:
  // - outputBase = outputTotal - reasoning
  // - reasoning = reasoning
  const safeOutput = Math.max(0, safeOutputTotal - safeReasoning)

  const inputPricePerToken = model.inputPrice / 1000000
  const cachedInputPricePerToken = (model.cachedInputPrice ?? model.inputPrice) / 1000000
  const outputPricePerToken = model.outputPrice / 1000000
  const reasoningPricePerToken = (model.reasoningPrice ?? model.outputPrice) / 1000000

  const inputCost = safeInput * inputPricePerToken
  const cachedInputCost = safeCached * cachedInputPricePerToken
  const outputCost = safeOutput * outputPricePerToken
  const reasoningCost = safeReasoning * reasoningPricePerToken

  const totalCost = inputCost + cachedInputCost + outputCost + reasoningCost
  const serviceMarkup = totalCost * currentMarkup
  const finalCost = totalCost + serviceMarkup

  // Debug-Logging (nur wenn aktiviert)
  try {
    const dbg = localStorage.getItem('debug')
    if (dbg && dbg.toLowerCase() === 'true') {
      // eslint-disable-next-line no-console
      console.debug('[pricing] calculateCompletionCostDetailed', {
        modelName: params.modelName,
        tokens: {
          inputTokens: safeInput,
          cachedInputTokens: safeCached,
          outputTokensTotal: safeOutputTotal,
          outputTokensExcludingReasoning: safeOutput,
          reasoningTokens: safeReasoning,
        },
        pricesPer1M: {
          input: model.inputPrice,
          cachedInput: model.cachedInputPrice ?? model.inputPrice,
          output: model.outputPrice,
          reasoning: model.reasoningPrice ?? model.outputPrice,
        },
        costs: {
          inputCost,
          cachedInputCost,
          outputCost,
          reasoningCost,
          totalCost,
          serviceMarkup,
          finalCost,
        },
        markup: currentMarkup,
      })
    }
  } catch {
    // ignore debug logging failures
  }

  return {
    inputCost,
    cachedInputCost,
    outputCost,
    reasoningCost,
    totalCost,
    serviceMarkup,
    finalCost,
    usedFallbackPricing: false,
  }
}

// Seiten-basierte Kostenberechnung für Document Intelligence / Extraction
export function calculateExtractionCost(
  pages: number,
  modelId: string,
): {
  totalCost: number
  serviceMarkup: number
  finalCost: number
} {
  const currentPricing = AZURE_EXTRACTION_MODEL_PRICING
  const currentMarkup = getCurrentMarkup()

  const normalizedModelId = (modelId || '').toLowerCase()
  const model =
    currentPricing.find((m) => m.modelId.toLowerCase() === normalizedModelId) ||
    currentPricing.find((m) => m.modelId === 'unknown') ||
    currentPricing[0]

  const safePages = Number.isFinite(pages) && pages > 0 ? pages : 0
  const totalCost = safePages * (model?.pricePerPage ?? 0)
  const serviceMarkup = totalCost * currentMarkup
  const finalCost = totalCost + serviceMarkup

  return {
    totalCost,
    serviceMarkup,
    finalCost,
  }
}

// Token-basierte Kostenberechnung für Completion-Modelle
function calculateCompletionCost(
  tokensIn: number,
  tokensOut: number,
  modelName: string,
  useCachedInput: boolean = false,
): {
  inputCost: number
  outputCost: number
  totalCost: number
  serviceMarkup: number
  finalCost: number
} {
  // Lade aktuelle Preise dynamisch (können sich geändert haben)
  const currentPricing = loadPricingFromStorage('pricing:model', DEFAULT_AZURE_MODEL_PRICING)
  const currentMarkup = loadMarkupFromStorage()

  // Finde das Modell in der Preisliste
  const normalizedName = (modelName || '').toLowerCase()
  const directMatch =
    currentPricing.find((m) => m.modelName.toLowerCase() === normalizedName) ??
    DEFAULT_AZURE_MODEL_PRICING.find((m) => m.modelName.toLowerCase() === normalizedName)

  const fallbackModel =
    currentPricing.find((m) => m.modelName === 'unknown') ??
    DEFAULT_AZURE_MODEL_PRICING.find((m) => m.modelName === 'unknown')

  const model = directMatch ?? fallbackModel

  if (!model) {
    throw new Error(`Model ${modelName} not found in pricing`)
  }

  // Wenn wir nur den 'unknown'-Fallback gefunden haben, aber das angefragte Modell
  // nicht explizit gepflegt ist, wollen wir im Frontend keine "echten" Kosten anzeigen.
  // In diesem Fall liefern wir 0-Kosten zurück; Analyse/Tooltips können den Fallback
  // separat kennzeichnen, aber die reguläre Kostenanzeige bleibt neutral.
  if (!directMatch && fallbackModel && model === fallbackModel) {
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      serviceMarkup: 0,
      finalCost: 0,
    }
  }

  // Berechne Kosten pro Token (Preise sind pro 1M Tokens)
  const inputPricePerToken =
    (useCachedInput && model.cachedInputPrice ? model.cachedInputPrice : model.inputPrice) / 1000000

  const outputPricePerToken = model.outputPrice / 1000000

  // Berechne Rohkosten
  const inputCost = tokensIn * inputPricePerToken
  const outputCost = tokensOut * outputPricePerToken
  const totalCost = inputCost + outputCost

  // Berechne FITS-Aufschlag (dynamisch geladen)
  const serviceMarkup = totalCost * currentMarkup
  const finalCost = totalCost + serviceMarkup

  return {
    inputCost,
    outputCost,
    totalCost,
    serviceMarkup,
    finalCost,
  }
}

// Token-basierte Kostenberechnung für Embedding-Modelle (nur Input-Tokens)
function calculateEmbeddingCost(
  tokensIn: number,
  modelName: string,
  _useCachedInput: boolean = false,
): {
  inputCost: number
  outputCost: number
  totalCost: number
  serviceMarkup: number
  finalCost: number
} {
  // Lade aktuelle Preise dynamisch (können sich geändert haben)
  const currentPricing = loadPricingFromStorage(
    'pricing:embedding',
    DEFAULT_AZURE_EMBEDDING_MODEL_PRICING,
  )
  const currentMarkup = loadMarkupFromStorage()

  // Finde das Modell in der Preisliste
  const model =
    currentPricing.find((m) => m.modelName.toLowerCase() === modelName.toLowerCase()) ||
    currentPricing.find((m) => m.modelName === 'unknown') ||
    currentPricing[0] // Fallback auf erstes Modell
  if (!model) {
    throw new Error(`Embedding model ${modelName} not found in pricing`)
  }

  // Berechne Kosten pro Token (Preise sind pro 1000 Tokens)
  const pricePerToken = model.pricePer1000Tokens / 1000

  // Berechne Rohkosten (nur Input-Tokens)
  const inputCost = tokensIn * pricePerToken
  const outputCost = 0 // Embedding-Modelle haben keine Output-Tokens
  const totalCost = inputCost + outputCost

  // Berechne FITS-Aufschlag (dynamisch geladen)
  const serviceMarkup = totalCost * currentMarkup
  const finalCost = totalCost + serviceMarkup

  return {
    inputCost,
    outputCost,
    totalCost,
    serviceMarkup,
    finalCost,
  }
}

// Bild-basierte Kostenberechnung für Image-Modelle
function calculateImageCost(
  modelName: string,
  imageQuality: string = 'standard',
  imageCount: number = 1,
  sizeWidth?: number,
  sizeHeight?: number,
): {
  inputCost: number
  outputCost: number
  totalCost: number
  serviceMarkup: number
  finalCost: number
} {
  // Lade aktuelle Preise dynamisch (können sich geändert haben)
  const currentPricing = getCurrentImagePricing()
  const currentMarkup = getCurrentMarkup()

  // Finde das Image-Modell in der Preisliste
  const model =
    currentPricing.find((m) => m.modelName.toLowerCase() === modelName.toLowerCase()) ||
    currentPricing.find((m) => m.modelName === 'unknown') ||
    currentPricing[0] // Fallback auf erstes Modell
  if (!model) {
    throw new Error(`Image model ${modelName} not found in pricing`)
  }

  // Bestimme den Preis basierend auf der Qualität und Größe
  let pricePer100Images: number

  if (imageQuality === 'hd') {
    // HD Qualität
    if (sizeWidth && sizeHeight && (sizeWidth > 1024 || sizeHeight > 1024)) {
      // Large resolution (1024x1792, 1792x1024)
      pricePer100Images = model.hdPriceLarge || model.hdPrice
    } else {
      // Standard resolution (1024x1024)
      pricePer100Images = model.hdPrice
    }
  } else {
    // Standard Qualität
    if (sizeWidth && sizeHeight && (sizeWidth > 1024 || sizeHeight > 1024)) {
      // Large resolution (1024x1792, 1792x1024)
      pricePer100Images = model.standardPriceLarge || model.standardPrice
    } else {
      // Standard resolution (1024x1024)
      pricePer100Images = model.standardPrice
    }
  }

  // Berechne Kosten pro Bild
  const pricePerImage = pricePer100Images / 100

  // Berechne Rohkosten
  const inputCost = 0 // Image-Modelle haben keine Input-Token-Kosten
  const outputCost = pricePerImage * imageCount
  const totalCost = inputCost + outputCost

  // Berechne FITS-Aufschlag (dynamisch geladen)
  const serviceMarkup = totalCost * currentMarkup
  const finalCost = totalCost + serviceMarkup

  return {
    inputCost,
    outputCost,
    totalCost,
    serviceMarkup,
    finalCost,
  }
}

// Formatierung für Anzeige - nur normale Dezimalzahlen
export function formatCost(cost: number): string {
  return `€${cost.toFixed(2)}`
}

// Hilfsfunktion für Beispiel-Berechnungen
export function calculateExampleCosts(): {
  tokensIn198456: number
  tokensOut99863: number
  tokensIn892456: number
  tokensOut355436: number
  tokensIn65234: number
  tokensOut33333: number
} {
  // Beispiel-Token aus den Tabs
  const tokensIn198456 = 198456
  const tokensOut99863 = 99863
  const tokensIn892456 = 892456
  const tokensOut355436 = 355436
  const tokensIn65234 = 65234
  const tokensOut33333 = 33333

  // Verwende GPT-4o-mini als Standard-Modell für Beispiele
  const modelName = 'gpt-4o-mini'

  return {
    tokensIn198456: calculateCost(tokensIn198456, tokensOut99863, modelName).finalCost,
    tokensOut99863: calculateCost(tokensIn198456, tokensOut99863, modelName).finalCost,
    tokensIn892456: calculateCost(tokensIn892456, tokensOut355436, modelName).finalCost,
    tokensOut355436: calculateCost(tokensIn892456, tokensOut355436, modelName).finalCost,
    tokensIn65234: calculateCost(tokensIn65234, tokensOut33333, modelName).finalCost,
    tokensOut33333: calculateCost(tokensIn65234, tokensOut33333, modelName).finalCost,
  }
}

// Funktionen zum Hinzufügen neuer Modelle
export function addCompletionModel(model: ModelPricing): void {
  const existingIndex = AZURE_MODEL_PRICING.findIndex(
    (m) => m.modelName.toLowerCase() === model.modelName.toLowerCase(),
  )
  if (existingIndex >= 0) {
    AZURE_MODEL_PRICING[existingIndex] = model
  } else {
    AZURE_MODEL_PRICING.push(model)
  }
}

export function addImageModel(model: ImageModelPricing): void {
  const existingIndex = AZURE_IMAGE_MODEL_PRICING.findIndex(
    (m) => m.modelName.toLowerCase() === model.modelName.toLowerCase(),
  )
  if (existingIndex >= 0) {
    AZURE_IMAGE_MODEL_PRICING[existingIndex] = model
  } else {
    AZURE_IMAGE_MODEL_PRICING.push(model)
  }
}

export function addEmbeddingModel(model: EmbeddingModelPricing): void {
  const existingIndex = AZURE_EMBEDDING_MODEL_PRICING.findIndex(
    (m) => m.modelName.toLowerCase() === model.modelName.toLowerCase(),
  )
  if (existingIndex >= 0) {
    AZURE_EMBEDDING_MODEL_PRICING[existingIndex] = model
  } else {
    AZURE_EMBEDDING_MODEL_PRICING.push(model)
  }
}

// Funktion zum Entfernen von Modellen
export function removeModel(
  modelName: string,
  modelType: 'completion' | 'image' | 'embedding',
): boolean {
  const normalizedName = modelName.toLowerCase()

  switch (modelType) {
    case 'completion': {
      const completionIndex = AZURE_MODEL_PRICING.findIndex(
        (m) => m.modelName.toLowerCase() === normalizedName,
      )
      if (completionIndex >= 0) {
        AZURE_MODEL_PRICING.splice(completionIndex, 1)
        return true
      }
      break
    }
    case 'image': {
      const imageIndex = AZURE_IMAGE_MODEL_PRICING.findIndex(
        (m) => m.modelName.toLowerCase() === normalizedName,
      )
      if (imageIndex >= 0) {
        AZURE_IMAGE_MODEL_PRICING.splice(imageIndex, 1)
        return true
      }
      break
    }
    case 'embedding': {
      const embeddingIndex = AZURE_EMBEDDING_MODEL_PRICING.findIndex(
        (m) => m.modelName.toLowerCase() === normalizedName,
      )
      if (embeddingIndex >= 0) {
        AZURE_EMBEDDING_MODEL_PRICING.splice(embeddingIndex, 1)
        return true
      }
      break
    }
  }
  return false
}

// Aktualisierter Disclaimer Text
export const PRICING_DISCLAIMER = `
**Preisberechnung basierend auf Azure OpenAI Tarifen**

Die angezeigten Kosten basieren auf den aktuellen Azure OpenAI Preisen (Stand: 2026) plus einem FITS-Aufschlag von 9%. Für Completion-Modelle werden die Preise pro 1 Million Tokens berechnet, für Embeddings pro 1000 Tokens und für Bildmodelle pro 100 Bilder.

**Wichtige Hinweise:**
- **Completion Models**: Preise sind pro 1 Million Tokens berechnet
- **Embedding Models**: Preise sind pro 1000 Tokens berechnet
- **Image Models**: Preise sind pro 100 Bilder berechnet (Standard: 1024x1024, HD: 1024x1024, Large: 1024x1792/1792x1024)
- Zwischengespeicherte Eingaben können günstiger sein
- Alle Preise in Euro (€) inklusive FITS-Aufschlag

**Preisbeispiele:**
- **GPT-4o-mini**: Eingabe ca. €0,13 / Ausgabe ca. €0,51 (pro 1M Tokens)
- **GPT-4o**: Eingabe ca. €2,12 / Ausgabe ca. €8,47 (pro 1M Tokens)
- **DALL-E-3**: Standard €3,47 / HD €6,94 (pro 100 Bilder)
- **text-embedding-3-small**: €0,000018 (pro 1000 Tokens)

*Diese Preise dienen zur Orientierung und können von den tatsächlichen Abrechnungspreisen abweichen.*
`
