// Azure OpenAI Preise (Stand: 2025) - pro 1 Million Tokens
export interface ModelPricing {
  modelName: string
  inputPrice: number // € pro 1M Tokens
  outputPrice: number // € pro 1M Tokens
  cachedInputPrice?: number // € pro 1M Tokens (optional)
}

// Image-basierte Preise (pro Bild)
export interface ImageModelPricing {
  modelName: string
  standardPrice: number // € pro Bild (standard quality)
  hdPrice: number // € pro Bild (hd quality)
}

export const AZURE_MODEL_PRICING: ModelPricing[] = [
  // GPT-4o-mini
  {
    modelName: 'gpt-4o-mini',
    inputPrice: 0.94,
    outputPrice: 3.76,
  },

  // GPT-4.1 Serie
  {
    modelName: 'gpt-4.1',
    inputPrice: 1.71,
    outputPrice: 6.84,
    cachedInputPrice: 0.43,
  },
  {
    modelName: 'gpt-4.1-mini',
    inputPrice: 0.35,
    outputPrice: 1.37,
    cachedInputPrice: 0.09,
  },
  {
    modelName: 'gpt-4.1-nano',
    inputPrice: 0.09,
    outputPrice: 0.35,
    cachedInputPrice: 0.03,
  },

  // GPT-Image-1 Serie
  {
    modelName: 'gpt-image-1-global',
    inputPrice: 4.28, // Text input
    outputPrice: 34.17, // Image output
  },
  {
    modelName: 'gpt-image-1-regional',
    inputPrice: 5.17, // Text input
    outputPrice: 41.34, // Image output
  },
  {
    modelName: 'gpt-image-1-data-zone',
    inputPrice: 4.7, // Text input
    outputPrice: 37.59, // Image output
  },

  // Fallback für unbekannte Modelle
  {
    modelName: 'unknown',
    inputPrice: 1.0,
    outputPrice: 3.0,
  },
]

// Image-Modell Preise (pro Bild)
export const AZURE_IMAGE_MODEL_PRICING: ImageModelPricing[] = [
  {
    modelName: 'gpt-image-1-global',
    standardPrice: 0.04, // € pro Bild (standard)
    hdPrice: 0.08, // € pro Bild (hd)
  },
  {
    modelName: 'gpt-image-1-regional',
    standardPrice: 0.05, // € pro Bild (standard)
    hdPrice: 0.1, // € pro Bild (hd)
  },
  {
    modelName: 'gpt-image-1-data-zone',
    standardPrice: 0.045, // € pro Bild (standard)
    hdPrice: 0.09, // € pro Bild (hd)
  },
  // Fallback für unbekannte Image-Modelle
  {
    modelName: 'unknown',
    standardPrice: 0.04,
    hdPrice: 0.08,
  },
]

// Service-Aufschlag (9%)
export const SERVICE_MARKUP_PERCENTAGE = 0.09

// Erweiterte Preisberechnung mit Unterstützung für verschiedene ModelUsageTypes
export function calculateCost(
  tokensIn: number,
  tokensOut: number,
  modelName: string,
  useCachedInput: boolean = false,
  modelType?: string,
  imageQuality?: string,
  imageCount?: number,
): {
  inputCost: number
  outputCost: number
  totalCost: number
  serviceMarkup: number
  finalCost: number
} {
  // Spezielle Behandlung für Image-Modelle
  if (modelType === 'ImageModelUsage' || modelName.toLowerCase().includes('image')) {
    return calculateImageCost(modelName, imageQuality, imageCount)
  }

  // Spezielle Behandlung für Embedding-Modelle (nur Input-Tokens)
  if (modelType === 'EmbeddingModelUsage' || modelName.toLowerCase().includes('embedding')) {
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
  // Finde das Modell in der Preisliste
  const model =
    AZURE_MODEL_PRICING.find((m) => m.modelName.toLowerCase() === modelName.toLowerCase()) ||
    AZURE_MODEL_PRICING.find((m) => m.modelName === 'unknown')!

  // Berechne Kosten pro Token (Preise sind pro 1M Tokens)
  const inputPricePerToken =
    (useCachedInput && model.cachedInputPrice ? model.cachedInputPrice : model.inputPrice) / 1000000

  const outputPricePerToken = model.outputPrice / 1000000

  // Berechne Rohkosten
  const inputCost = tokensIn * inputPricePerToken
  const outputCost = tokensOut * outputPricePerToken
  const totalCost = inputCost + outputCost

  // Berechne Service-Aufschlag
  const serviceMarkup = totalCost * SERVICE_MARKUP_PERCENTAGE
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
  useCachedInput: boolean = false,
): {
  inputCost: number
  outputCost: number
  totalCost: number
  serviceMarkup: number
  finalCost: number
} {
  // Finde das Modell in der Preisliste
  const model =
    AZURE_MODEL_PRICING.find((m) => m.modelName.toLowerCase() === modelName.toLowerCase()) ||
    AZURE_MODEL_PRICING.find((m) => m.modelName === 'unknown')!

  // Berechne Kosten pro Token (Preise sind pro 1M Tokens)
  const inputPricePerToken =
    (useCachedInput && model.cachedInputPrice ? model.cachedInputPrice : model.inputPrice) / 1000000

  // Berechne Rohkosten (nur Input-Tokens)
  const inputCost = tokensIn * inputPricePerToken
  const outputCost = 0 // Embedding-Modelle haben keine Output-Tokens
  const totalCost = inputCost + outputCost

  // Berechne Service-Aufschlag
  const serviceMarkup = totalCost * SERVICE_MARKUP_PERCENTAGE
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
): {
  inputCost: number
  outputCost: number
  totalCost: number
  serviceMarkup: number
  finalCost: number
} {
  // Finde das Image-Modell in der Preisliste
  const model =
    AZURE_IMAGE_MODEL_PRICING.find((m) => m.modelName.toLowerCase() === modelName.toLowerCase()) ||
    AZURE_IMAGE_MODEL_PRICING.find((m) => m.modelName === 'unknown')!

  // Bestimme den Preis basierend auf der Qualität
  const pricePerImage = imageQuality === 'hd' ? model.hdPrice : model.standardPrice

  // Berechne Rohkosten
  const inputCost = 0 // Image-Modelle haben keine Input-Token-Kosten
  const outputCost = pricePerImage * imageCount
  const totalCost = inputCost + outputCost

  // Berechne Service-Aufschlag
  const serviceMarkup = totalCost * SERVICE_MARKUP_PERCENTAGE
  const finalCost = totalCost + serviceMarkup

  return {
    inputCost,
    outputCost,
    totalCost,
    serviceMarkup,
    finalCost,
  }
}

// Formatierung für Anzeige
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `€${(cost * 1000).toFixed(2)}m` // Millicents
  } else if (cost < 1) {
    return `€${(cost * 100).toFixed(2)}c` // Cents
  } else {
    return `€${cost.toFixed(2)}` // Euros
  }
}

// Disclaimer Text
export const PRICING_DISCLAIMER = `
**Preisberechnung basierend auf Azure OpenAI Tarifen**

Die angezeigten Kosten basieren auf den aktuellen Azure OpenAI Preisen (Stand: 2025) plus einem Service-Aufschlag von 9%.

**Wichtige Hinweise:**
- Preise sind pro 1 Million Tokens berechnet
- Zwischengespeicherte Eingaben können günstiger sein
- Bild-Modelle haben separate Preise für Text- und Bild-Tokens
- Alle Preise in Euro (€) inklusive Service-Aufschlag

**Preisbeispiele (pro 1M Tokens):**
- GPT-4o-mini: Eingabe €0,94 / Ausgabe €3,76
- GPT-4.1: Eingabe €1,71 / Ausgabe €6,84
- GPT-Image-1: Text €4,28 / Bild €34,17

*Diese Preise dienen zur Orientierung und können von den tatsächlichen Abrechnungspreisen abweichen.*
`

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
