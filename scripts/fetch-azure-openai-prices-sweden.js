#!/usr/bin/env node
/**
 * Lädt alle Azure OpenAI Consumption-Preise für Sweden Central von der Azure Retail Prices API
 * und speichert sie in einer JSON-Datei.
 *
 * Wichtige Anpassungen gegenüber der ursprünglichen Abfrage:
 * - serviceName ist in der API "Foundry Models", nicht "Azure OpenAI" → Filter: productName eq 'Azure OpenAI'
 * - Verbrauchstyp heißt in der API "type", nicht "priceType" → Filter: type eq 'Consumption'
 * Währung: currencyCode=EUR oder USD (Query-Parameter).
 *
 * Verwendung: node scripts/fetch-azure-openai-prices-sweden.js [Ausgabedatei] [EUR|USD]
 * Default: openai_preise_schweden.json, USD
 * Beispiel EUR: node scripts/fetch-azure-openai-prices-sweden.js openai_preise_schweden_maerz_eur.json EUR
 *
 * Einzelne Seite per curl (EUR, max. 100 Einträge):
 *   curl -G "https://prices.azure.com/api/retail/prices" \
 *     --data-urlencode "currencyCode=EUR" \
 *     --data-urlencode "\$filter=armRegionName eq 'swedencentral' and productName eq 'Azure OpenAI' and type eq 'Consumption'" \
 *     -o openai_preise_schweden_eur.json
 */

const BASE_URL = 'https://prices.azure.com/api/retail/prices';
const FILTER = "armRegionName eq 'swedencentral' and productName eq 'Azure OpenAI' and type eq 'Consumption'";

async function fetchPage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.url}`);
  return res.json();
}

async function fetchAllPages(currencyCode) {
  const allItems = [];
  const params = new URLSearchParams({ $filter: FILTER });
  if (currencyCode) params.set('currencyCode', currencyCode);
  let url = `${BASE_URL}?${params.toString()}`;
  let billingCurrency = currencyCode || 'USD';

  while (url) {
    const data = await fetchPage(url);
    if (data.BillingCurrency) billingCurrency = data.BillingCurrency;
    if (data.Items?.length) allItems.push(...data.Items);
    url = data.NextPageLink || null;
  }

  return { items: allItems, billingCurrency: billingCurrency };
}

async function main() {
  const outFile = process.argv[2] || 'openai_preise_schweden.json';
  const currencyCode = (process.argv[3] || 'USD').toUpperCase();
  if (currencyCode !== 'USD' && currencyCode !== 'EUR') {
    console.error('Währung muss EUR oder USD sein.');
    process.exit(1);
  }
  console.log(`Lade Azure OpenAI Consumption-Preise (Sweden Central, ${currencyCode}) …`);

  const { items, billingCurrency } = await fetchAllPages(currencyCode);
  const result = {
    BillingCurrency: billingCurrency,
    CustomerEntityId: 'Default',
    CustomerEntityType: 'Retail',
    Count: items.length,
    Items: items,
    NextPageLink: null,
  };

  const fs = await import('fs');
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');
  console.log(`${items.length} Einträge (${billingCurrency}) nach ${outFile} geschrieben.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
