#!/usr/bin/env node
/**
 * Preise aktuell von Azure ziehen:
 * 1. Ruft die Azure Retail Prices API auf (Sweden Central, EUR, Consumption).
 * 2. Speichert die Rohdaten als JSON (Nachweis/Rohdaten).
 * 3. Baut daraus den App-Snapshot für den aktuellen Monat (pricing-YYYY-MM.json).
 *
 * Verwendung:
 *   node scripts/refresh-azure-pricing.js
 *   node scripts/refresh-azure-pricing.js USD   # USD statt EUR
 *
 * Ausgabe:
 *   - openai_preise_schweden_aktuell_eur.json (Rohdaten von der API)
 *   - public/admin-console/pricing-snapshots/pricing-YYYY-MM.json (für die App)
 *   - public/admin-console/pricing-snapshots/quelle-YYYY-MM.txt (Quellenangabe)
 */

import fs from 'fs'

const BASE_URL = 'https://prices.azure.com/api/retail/prices'
const FILTER =
  "armRegionName eq 'swedencentral' and productName eq 'Azure OpenAI' and type eq 'Consumption'"

async function fetchPage(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.url}`)
  return res.json()
}

async function fetchAllPages(currencyCode) {
  const allItems = []
  const params = new URLSearchParams({ $filter: FILTER })
  if (currencyCode) params.set('currencyCode', currencyCode)
  let url = `${BASE_URL}?${params.toString()}`
  let billingCurrency = currencyCode || 'USD'

  while (url) {
    const data = await fetchPage(url)
    if (data.BillingCurrency) billingCurrency = data.BillingCurrency
    if (data.Items?.length) allItems.push(...data.Items)
    url = data.NextPageLink || null
  }

  return { items: allItems, billingCurrency }
}

async function main() {
  const currencyCode = (process.argv[2] || 'EUR').toUpperCase()
  if (currencyCode !== 'USD' && currencyCode !== 'EUR') {
    console.error('Währung muss EUR oder USD sein.')
    process.exit(1)
  }

  const yyyyMm = new Date().toISOString().slice(0, 7)
  const rawFile = `openai_preise_schweden_aktuell_${currencyCode.toLowerCase()}.json`

  console.log('1/2 Lade Preise von der Azure Retail Prices API (Sweden Central,', currencyCode + ') …')
  const { items, billingCurrency } = await fetchAllPages(currencyCode)
  const raw = {
    BillingCurrency: billingCurrency,
    CustomerEntityId: 'Default',
    CustomerEntityType: 'Retail',
    Count: items.length,
    Items: items,
    NextPageLink: null,
  }
  fs.writeFileSync(rawFile, JSON.stringify(raw, null, 2), 'utf8')
  console.log('   →', items.length, 'Einträge in', rawFile)

  console.log('2/2 Erzeuge App-Snapshot für', yyyyMm, '…')
  const { execSync } = await import('child_process')
  const path = (await import('path')).default
  const convertScript = path.join(process.cwd(), 'scripts', 'azure-retail-prices-to-app-pricing.js')
  execSync(`node "${convertScript}" "${rawFile}" ${yyyyMm}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  console.log('Fertig. Preise sind aktuell (Stand: API-Abfrage jetzt).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
