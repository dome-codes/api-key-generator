import type {
  ModelPricing,
  ImageModelPricing,
  EmbeddingModelPricing,
  ExtractionModelPricing,
} from '@/config/pricing'

// Zentrale Stelle für Default-Pricing-Tabellen.
// Alle Preise sind, sofern nicht anders angegeben, in **Euro pro 1M Tokens**.

export const DEFAULT_AZURE_MODEL_PRICING: ModelPricing[] = [
  // GPT-5.2 Serie – Backend liefert hier "gpt-5.2" (Data Zone als Standard)
  {
    modelName: 'gpt-5.2',
    inputPrice: 1.64,
    cachedInputPrice: 0.17,
    outputPrice: 13.05,
  },

  // GPT-5.1 Serie
  // Backend liefert hier nur "gpt-5.1" (Data Zone), daher bündeln wir die Varianten
  // auf einen Eintrag mit den Data-Zone-Preisen.
  {
    modelName: 'gpt-5.1',
    inputPrice: 1.17,
    cachedInputPrice: 0.12,
    outputPrice: 9.33,
  },

  // GPT-5 Serie – Data Zone als Standard, Basisnamen wie sie im Backend ankommen
  {
    modelName: 'gpt-5',
    inputPrice: 1.17,
    cachedInputPrice: 0.12,
    outputPrice: 9.33,
  },
  {
    modelName: 'gpt-5-pro',
    inputPrice: 12.72,
    outputPrice: 101.69,
  },
  {
    modelName: 'gpt-5-mini',
    inputPrice: 0.24,
    cachedInputPrice: 0.03,
    outputPrice: 1.87,
  },
  {
    modelName: 'gpt-5-nano',
    inputPrice: 0.05,
    cachedInputPrice: 0.01,
    outputPrice: 0.38,
  },
  {
    modelName: 'gpt-5-chat',
    inputPrice: 1.06,
    cachedInputPrice: 0.11,
    outputPrice: 8.48,
  },

  // o3 / o4-mini (vereinfacht, Data Zone als Standardnamen)
  {
    modelName: 'o3',
    inputPrice: 1.87,
    cachedInputPrice: 0.47,
    outputPrice: 7.46,
  },
  {
    modelName: 'o4-mini',
    inputPrice: 1.03,
    cachedInputPrice: 0.26,
    outputPrice: 4.11,
  },

  // GPT-4.1 Serie (Standard-Pricing, Basisnamen)
  {
    modelName: 'gpt-4.1',
    inputPrice: 1.7,
    cachedInputPrice: 0.43,
    outputPrice: 6.78,
  },
  {
    modelName: 'gpt-4.1-mini',
    inputPrice: 0.34,
    cachedInputPrice: 0.09,
    outputPrice: 1.36,
  },
  {
    modelName: 'gpt-4.1-nano',
    inputPrice: 0.09,
    cachedInputPrice: 0.03,
    outputPrice: 0.34,
  },

  // GPT-4o / GPT-4o-mini (neue Generation, Basisnamen)
  {
    modelName: 'gpt-4o',
    inputPrice: 2.11838,
    cachedInputPrice: 1.0592,
    outputPrice: 8.4735,
  },
  {
    modelName: 'gpt-4o-mini',
    inputPrice: 0.12711,
    cachedInputPrice: 0.0636,
    outputPrice: 0.5085,
  },

  // GPT-3.5 Turbo (Legacy, vereinfacht)
  {
    modelName: 'gpt-3.5-turbo',
    inputPrice: 0.6,
    outputPrice: 1.6,
  },

  // Offenes OSS-Modell
  {
    modelName: 'gpt-oss-120b',
    inputPrice: 0.1272,
    outputPrice: 0.5085,
  },

  // Fallback für unbekannte Modelle
  {
    modelName: 'unknown',
    inputPrice: 1.0,
    outputPrice: 3.0,
  },
]

// Image-Modelle – hier belassen wir vorerst die bestehenden Default-Werte.
export const DEFAULT_AZURE_IMAGE_MODEL_PRICING: ImageModelPricing[] = [
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
  {
    modelName: 'unknown',
    standardPrice: 3.472,
    hdPrice: 6.943,
  },
]

// Embedding-Preise – vereinfacht übernommen.
export const DEFAULT_AZURE_EMBEDDING_MODEL_PRICING: EmbeddingModelPricing[] = [
  {
    modelName: 'text-embedding-3-large',
    pricePer1000Tokens: 0.000134,
  },
  {
    modelName: 'text-embedding-3-small',
    pricePer1000Tokens: 0.000022,
  },
  {
    modelName: 'ada',
    pricePer1000Tokens: 0.000103,
  },
  {
    modelName: 'unknown',
    pricePer1000Tokens: 0.0001,
  },
]

// Document Intelligence / Extraction Preise (Platzhalter, können via Admin-UI überschrieben werden)
export const DEFAULT_EXTRACTION_MODEL_PRICING: ExtractionModelPricing[] = [
  {
    modelId: 'document-intelligence',
    pricePerPage: 0.05,
  },
  {
    modelId: 'prebuilt-layout',
    pricePerPage: 0.02,
  },
  {
    modelId: 'prebuilt-document',
    pricePerPage: 0.03,
  },
  {
    modelId: 'prebuilt-invoice',
    pricePerPage: 0.05,
  },
  {
    modelId: 'prebuilt-receipt',
    pricePerPage: 0.02,
  },
  {
    modelId: 'prebuilt-businessCard',
    pricePerPage: 0.02,
  },
  {
    modelId: 'unknown',
    pricePerPage: 0.03,
  },
]
