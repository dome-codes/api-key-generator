// Azure OpenAI Preise (Stand: 2026) - pro 1 Million Tokens
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

// Default Preise (werden verwendet wenn keine localStorage-Daten vorhanden)
const DEFAULT_AZURE_MODEL_PRICING: ModelPricing[] = [
  // GPT-4o Serie (Stand: 2026)
  {
    modelName: 'gpt-4o-mini',
    inputPrice: 0.138, // $0.15 * 0.92 EUR/USD
    outputPrice: 0.552, // $0.60 * 0.92 EUR/USD
  },
  {
    modelName: 'gpt-4o',
    inputPrice: 2.3, // $2.50 * 0.92 EUR/USD
    outputPrice: 9.2, // $10.00 * 0.92 EUR/USD
  },

  // GPT-4.1 Serie (Stand: 2026)
  {
    modelName: 'gpt-4.1',
    inputPrice: 1.84, // $2.00 * 0.92 EUR/USD
    outputPrice: 7.36, // $8.00 * 0.92 EUR/USD
    cachedInputPrice: 0.46, // Geschätzt basierend auf Verhältnis
  },
  {
    modelName: 'gpt-4.1-mini',
    inputPrice: 0.32, // Geschätzt basierend auf Verhältnis
    outputPrice: 1.28, // Geschätzt basierend auf Verhältnis
    cachedInputPrice: 0.08, // Geschätzt basierend auf Verhältnis
  },
  {
    modelName: 'gpt-4.1-nano',
    inputPrice: 0.08, // Geschätzt basierend auf Verhältnis
    outputPrice: 0.32, // Geschätzt basierend auf Verhältnis
    cachedInputPrice: 0.02, // Geschätzt basierend auf Verhältnis
  },

  // GPT-3.5 Serie
  {
    modelName: 'gpt-3.5-turbo',
    inputPrice: 0.15,
    outputPrice: 0.2,
  },

  // Claude Serie
  {
    modelName: 'claude-3-sonnet',
    inputPrice: 3.0,
    outputPrice: 15.0,
  },
  {
    modelName: 'claude-3-haiku',
    inputPrice: 0.25,
    outputPrice: 1.25,
  },

  // Fallback für unbekannte Modelle
  {
    modelName: 'unknown',
    inputPrice: 1.0,
    outputPrice: 3.0,
  },
]

// Default Image-Modell Preise (werden verwendet wenn keine localStorage-Daten vorhanden)
const DEFAULT_AZURE_IMAGE_MODEL_PRICING: ImageModelPricing[] = [
  {
    modelName: 'dall-e-3',
    standardPrice: 3.472, // € pro 100 Bilder (1024x1024)
    hdPrice: 6.943, // € pro 100 Bilder (1024x1024 HD)
    standardPriceLarge: 6.943, // € pro 100 Bilder (1024x1792, 1792x1024)
    hdPriceLarge: 10.415, // € pro 100 Bilder (1024x1792, 1792x1024 HD)
  },
  {
    modelName: 'dall-e-2',
    standardPrice: 0.0, // Nicht zutreffend
    hdPrice: 0.0,
  },
  {
    modelName: 'midjourney-v6',
    standardPrice: 5.0, // Beispielpreis
    hdPrice: 8.0,
  },
  // Fallback für unbekannte Image-Modelle
  {
    modelName: 'unknown',
    standardPrice: 3.472,
    hdPrice: 6.943,
  },
]

// Default Embedding-Modell Preise (werden verwendet wenn keine localStorage-Daten vorhanden)
const DEFAULT_AZURE_EMBEDDING_MODEL_PRICING: EmbeddingModelPricing[] = [
  {
    modelName: 'text-embedding-ada-002',
    pricePer1000Tokens: 0.000087,
  },
  {
    modelName: 'text-embedding-3-large',
    pricePer1000Tokens: 0.000113,
  },
  {
    modelName: 'text-embedding-3-small',
    pricePer1000Tokens: 0.000018,
  },
  // Fallback für unbekannte Embedding-Modelle
  {
    modelName: 'unknown',
    pricePer1000Tokens: 0.0001,
  },
]

// FITS-Aufschlag (9%) - kann aus localStorage geladen werden
const DEFAULT_SERVICE_MARKUP_PERCENTAGE = 0.09

// Lade Preise aus localStorage oder verwende Defaults
// WICHTIG: Diese Funktionen werden verwendet wenn pricing.ts direkt importiert wird
// Für Admin-Verwaltung sollte usePricingManagement verwendet werden, das über API lädt
function loadPricingFromStorage<T>(key: string, defaults: T[]): T[] {
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
  DEFAULT_AZURE_MODEL_PRICING,
  DEFAULT_AZURE_IMAGE_MODEL_PRICING,
  DEFAULT_AZURE_EMBEDDING_MODEL_PRICING,
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
  const model =
    currentPricing.find((m) => m.modelName.toLowerCase() === modelName.toLowerCase()) ||
    currentPricing.find((m) => m.modelName === 'unknown') ||
    currentPricing[0] // Fallback auf erstes Modell
  if (!model) {
    throw new Error(`Model ${modelName} not found in pricing`)
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

Die angezeigten Kosten basieren auf den aktuellen Azure OpenAI Preisen (Stand: 2026) plus einem FITS-Aufschlag von 9%.

**Wichtige Hinweise:**
- **Completion Models**: Preise sind pro 1 Million Tokens berechnet
- **Embedding Models**: Preise sind pro 1000 Tokens berechnet
- **Image Models**: Preise sind pro 100 Bilder berechnet (Standard: 1024x1024, HD: 1024x1024, Large: 1024x1792/1792x1024)
- Zwischengespeicherte Eingaben können günstiger sein
- Alle Preise in Euro (€) inklusive FITS-Aufschlag

**Preisbeispiele:**
- **GPT-4o-mini**: Eingabe €0,14 / Ausgabe €0,55 (pro 1M Tokens)
- **GPT-4o**: Eingabe €2,30 / Ausgabe €9,20 (pro 1M Tokens)
- **DALL-E-3**: Standard €3,47 / HD €6,94 (pro 100 Bilder)
- **text-embedding-3-small**: €0,000018 (pro 1000 Tokens)

*Diese Preise dienen zur Orientierung und können von den tatsächlichen Abrechnungspreisen abweichen.*
`
