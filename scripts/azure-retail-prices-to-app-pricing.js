#!/usr/bin/env node
/**
 * Konvertiert Azure Retail Prices JSON (Sweden Central, EUR) in das App-Pricing-Format
 * (ModelPricing[] mit inputPrice/outputPrice/cachedInputPrice pro 1M Tokens).
 * Schreibt einen Snapshot mit Stichtag und Quellenangabe für den Nachweis.
 *
 * Verwendung:
 *   node scripts/azure-retail-prices-to-app-pricing.js [azure_eur.json] [YYYY-MM]
 *   node scripts/azure-retail-prices-to-app-pricing.js openai_preise_schweden_maerz_eur.json 2025-03
 *
 * Ausgabe:
 *   - public/admin-console/pricing-snapshots/pricing-YYYY-MM.json (für App + Nachweis)
 *   - Optional: pricing-snapshots/quelle-YYYY-MM.txt mit Kurzinfo zur Quelle
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const AZURE_JSON = process.argv[2] || 'openai_preise_schweden_maerz_eur.json'
const EFFECTIVE_YYYY_MM = process.argv[3] || new Date().toISOString().slice(0, 7) // z.B. 2025-03

// Azure meterName/skuName → App modelName (canonical)
function toCanonicalModel(name) {
  const n = (name || '').toLowerCase()
  if (n.includes('gpt 4.1 nano') || n.includes('gpt-4.1-nano')) return 'gpt-4.1-nano'
  if (n.includes('gpt 4.1 mini') || n.includes('gpt-4.1-mini')) return 'gpt-4.1-mini'
  if (n.includes('gpt 4.1') || n.includes('gpt-4.1')) return 'gpt-4.1'
  if (n.includes('gpt4omini') || n.includes('gpt-4o-mini')) return 'gpt-4o-mini'
  if (n.includes('gpt 4o') || n.includes('gpt-4o')) return 'gpt-4o'
  if (n.includes('gpt 4.5') || n.includes('gpt-4.5')) return 'gpt-4.5'
  if (n.includes('o3 mini')) return 'o3-mini'
  if (n.includes('o3 ')) return 'o3'
  if (n.includes('o4-mini')) return 'o4-mini'
  if (n.includes('o1-pro')) return 'o1-pro'
  if (n.includes('o1 ')) return 'o1'
  if (n.includes('gpt 5.3') || n.includes('gpt-5.3')) return 'gpt-5.3'
  if (n.includes('gpt 5.2') || n.includes('gpt-5.2')) return 'gpt-5.2'
  if (n.includes('gpt 5.1') || n.includes('gpt-5.1')) return 'gpt-5.1'
  if (n.includes('gpt 5 ') || n.includes('gpt-5 ') || n.includes('gpt-5 codex')) return 'gpt-5'
  if (n.includes('codex') && n.includes('gpt')) return n.includes('mini') ? 'gpt-5-codex-mini' : n.includes('max') ? 'gpt-5-codex-max' : 'gpt-5-codex'
  if (n.includes('text-embedding-3-large')) return 'text-embedding-3-large'
  if (n.includes('text-embedding-3-small')) return 'text-embedding-3-small'
  if (n.includes('text-embedding-ada')) return 'text-embedding-ada-002'
  if (n.includes('dall-e-3') || n.includes('dalle-3')) return 'dall-e-3'
  if (n.includes('dall-e-2')) return 'dall-e-2'
  return null
}

// Input / Output / Cached Input aus meterName/skuName
function getPriceType(name) {
  const n = (name || '').toLowerCase()
  if ((n.includes('cached') || n.includes('cchd')) && n.includes('inp')) return 'cachedInput'
  if (n.includes('inp ') || n.includes(' inp') || n.includes('input')) return 'input'
  if (n.includes('outp') || n.includes('output')) return 'output'
  return null
}

// Nur Token-basierte Einträge (1K Tokens); keine Unit/Hour, keine Images/Sprache
function isTokenMeter(item) {
  const u = (item.unitOfMeasure || '').toLowerCase()
  if (u === '1k') return true
  return false
}

function main() {
  let raw
  try {
    raw = JSON.parse(fs.readFileSync(AZURE_JSON, 'utf8'))
  } catch (e) {
    console.error('Fehler: Konnte', AZURE_JSON, 'nicht lesen:', e.message)
    process.exit(1)
  }

  const items = raw.Items || []
  const currency = raw.BillingCurrency || 'EUR'
  const region = items[0]?.armRegionName || 'swedencentral'

  // Pro Modell: { input: [prices], output: [prices], cachedInput: [prices] }
  const byModel = {}

  for (const item of items) {
    if (!isTokenMeter(item)) continue
    const model = toCanonicalModel(item.meterName || item.skuName)
    if (!model) continue
    const priceType = getPriceType(item.meterName || item.skuName)
    if (!priceType) continue

    const pricePer1K = Number(item.retailPrice) || 0
    const pricePer1M = pricePer1K * 1000 // App: Preise pro 1 Mio. Tokens

    if (!byModel[model]) byModel[model] = { input: [], output: [], cachedInput: [] }
    if (priceType === 'input') byModel[model].input.push(pricePer1M)
    if (priceType === 'output') byModel[model].output.push(pricePer1M)
    if (priceType === 'cachedInput') byModel[model].cachedInput.push(pricePer1M)
  }

  // ModelPricing-Array: ein Eintrag pro Modell, repräsentativer Preis (Median oder erstes)
  const pick = (arr) => {
    if (!arr || arr.length === 0) return undefined
    const sorted = [...arr].filter((x) => x > 0).sort((a, b) => a - b)
    return sorted.length ? sorted[Math.floor(sorted.length / 2)] : undefined
  }

  const modelPricing = []
  for (const [modelName, prices] of Object.entries(byModel)) {
    const inputPrice = pick(prices.input)
    const outputPrice = pick(prices.output)
    const cachedInputPrice = pick(prices.cachedInput)
    if (inputPrice == null && outputPrice == null) continue
    modelPricing.push({
      modelName,
      inputPrice: inputPrice ?? 0,
      outputPrice: outputPrice ?? 0,
      ...(cachedInputPrice != null && { cachedInputPrice }),
    })
  }

  // Sortierung: bekannte Modelle zuerst, dann alphabetisch
  const order = [
    'gpt-5.3',
    'gpt-5.2',
    'gpt-5.1',
    'gpt-5',
    'gpt-5-codex',
    'gpt-5-codex-mini',
    'gpt-5-codex-max',
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4.1-nano',
    'gpt-4.1-mini',
    'gpt-4.1',
    'gpt-4.5',
    'o3-mini',
    'o3',
    'o4-mini',
    'o1',
    'o1-pro',
    'text-embedding-3-small',
    'text-embedding-3-large',
    'text-embedding-ada-002',
  ]
  modelPricing.sort((a, b) => {
    const ia = order.indexOf(a.modelName)
    const ib = order.indexOf(b.modelName)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.modelName.localeCompare(b.modelName)
  })

  // Fallback für unbekannte Modelle
  modelPricing.push({
    modelName: 'unknown',
    inputPrice: 1.0,
    outputPrice: 3.0,
  })

  // Override: Modelle die die API nicht hat (z.B. GPT-5.x) aus pricing-override.json
  const outDir = path.join(process.cwd(), 'public', 'admin-console', 'pricing-snapshots')
  const overridePath = path.join(outDir, 'pricing-override.json')
  let mergedPricing = modelPricing
  if (fs.existsSync(overridePath)) {
    try {
      const override = JSON.parse(fs.readFileSync(overridePath, 'utf8'))
      const overrides = override.modelPricing || []
      const byName = new Map(mergedPricing.map((m) => [m.modelName.toLowerCase(), m]))
      for (const o of overrides) {
        if (o.modelName && (o.inputPrice != null || o.outputPrice != null)) {
          byName.set(o.modelName.toLowerCase(), {
            modelName: o.modelName,
            inputPrice: o.inputPrice ?? 0,
            outputPrice: o.outputPrice ?? 0,
            ...(o.cachedInputPrice != null && { cachedInputPrice: o.cachedInputPrice }),
          })
        }
      }
      mergedPricing = Array.from(byName.values())
      mergedPricing.sort((a, b) => {
        const ia = order.indexOf(a.modelName)
        const ib = order.indexOf(b.modelName)
        if (ia !== -1 && ib !== -1) return ia - ib
        if (ia !== -1) return -1
        if (ib !== -1) return 1
        return a.modelName.localeCompare(b.modelName)
      })
      console.log('Override eingelesen:', overrides.length, 'Einträge')
    } catch (e) {
      console.warn('Override konnte nicht geladen werden:', e.message)
    }
  }

  const snapshot = {
    _meta: {
      source: 'Azure Retail Prices API',
      sourceUrl: 'https://prices.azure.com/api/retail/prices',
      region,
      currency,
      effectiveDate: `${EFFECTIVE_YYYY_MM}-01`,
      generatedAt: new Date().toISOString(),
      description: 'Preise für Kostenberechnung und Nachweis (Consumption, Sweden Central)',
    },
    modelPricing: mergedPricing,
    // Für Admin-UI: gleiche Struktur wie pricing.json (optional image/embedding leer)
    imagePricing: [],
    embeddingPricing: [],
    markupPercentage: 0.09,
  }

  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `pricing-${EFFECTIVE_YYYY_MM}.json`)
  fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2), 'utf8')
  const count = mergedPricing.filter((m) => m.modelName !== 'unknown').length
  console.log(outFile, '→', count, 'Modelle (+ unknown)')

  const quelleFile = path.join(outDir, `quelle-${EFFECTIVE_YYYY_MM}.txt`)
  fs.writeFileSync(
    quelleFile,
    `Stichtag: ${EFFECTIVE_YYYY_MM}-01
Region: ${region}
Währung: ${currency}
Quelle: Azure Retail Prices API (Consumption, productName=Azure OpenAI)
Export: ${AZURE_JSON}
Generiert: ${snapshot._meta.generatedAt}
`,
    'utf8',
  )
  console.log(quelleFile, '→ Quellenangabe für Nachweis')
}

main()
