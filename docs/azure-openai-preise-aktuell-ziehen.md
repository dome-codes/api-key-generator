# Azure OpenAI Preise aktuell ziehen

## So bekommt ihr immer die aktuellen Preise (alle GPT-Modelle)

### 1. Regelmäßig ausführen: Preise von Azure holen + Override

```bash
npm run pricing:refresh
```

Das Skript:

1. **Ruft die Azure Retail Prices API auf** (Sweden Central, EUR, Consumption).
2. **Speichert die Rohdaten** in `openai_preise_schweden_aktuell_eur.json`.
3. **Baut den App-Snapshot** und **merged mit der Override-Datei**:
   - `public/admin-console/pricing-snapshots/pricing-YYYY-MM.json` (API + Override)
   - `public/admin-console/pricing-snapshots/quelle-YYYY-MM.txt`

### 2. Override für Modelle, die die API nicht hat (z. B. GPT-5.x)

Die **Azure Retail API** listet nicht alle Modelle (z. B. GPT-5.3, GPT-5.2). Dafür gibt es:

**`public/admin-console/pricing-snapshots/pricing-override.json`**

- Enthält `modelPricing` für GPT-5.x und andere Modelle, die die API nicht liefert.
- Beim `pricing:refresh` werden diese Preise **mit den API-Preisen zusammengeführt**; der Snapshot enthält dann alle Modelle.
- **Pflege:** Preise von der [Azure-Preisseite](https://azure.microsoft.com/de-de/pricing/details/azure-openai/) (Region Schweden Mitte, EUR) übernehmen und in der Override-Datei eintragen/aktualisieren. Neue Modelle einfach als weiteren Eintrag in `modelPricing` hinzufügen.

### 3. Was die App verwendet

- **Aktueller Monat:** Die App lädt automatisch `pricing-YYYY-MM.json` für den laufenden Monat (enthält API + Override). Dafür reicht ein regelmäßiges `npm run pricing:refresh` (z. B. monatlich oder wöchentlich).
- **Vergangene Monate:** Für Abrechnung/Nachweis wird der Snapshot des jeweiligen Monats verwendet (`getModelPricingForDate(date)`).

**Kurz:** Einmal `npm run pricing:refresh` ausführen → API-Preise + Override-Preise (GPT-5.x etc.) landen im Snapshot → die App nutzt den aktuellen Snapshot und ihr habt **immer die aktuellen Preise für alle GPT-Modelle**, sofern ihr die Override-Datei bei Bedarf aktualisiert.

---

## Wie ich an eine konkrete Preisangabe komme (z. B. „GPT-5.3 Codex, Sweden Central, EUR, März“)

### Schritt 1: Azure Retail Prices API (für alle gelisteten Modelle)

**URL (mit Filter):**

```
https://prices.azure.com/api/retail/prices?currencyCode=EUR&$filter=armRegionName eq 'swedencentral' and productName eq 'Azure OpenAI' and type eq 'Consumption'
```

- **currencyCode=EUR** → Preise in Euro  
- **armRegionName eq 'swedencentral'** → Sweden Central  
- **productName eq 'Azure OpenAI'** → nur Azure OpenAI  
- **type eq 'Consumption'** → nur Verbrauchspreise (keine Reservierungen)

Die API liefert JSON mit `Items[]`. Jeder Eintrag hat u. a.:

- `meterName` / `skuName` (z. B. „gpt 4.1 Inp regnl Tokens“, „o3 mini … Outp …“)
- `retailPrice` (Preis pro Einheit)
- `unitOfMeasure` (z. B. „1K“ = pro 1000 Tokens)
- `effectiveStartDate` (ab wann der Preis gilt)

**Suche nach einem Modell (z. B. GPT-5.3 Codex):**

- In der heruntergeladenen JSON (z. B. `openai_preise_schweden_aktuell_eur.json`) nach `"gpt 5.3"` oder `"codex"` in `skuName` / `meterName` suchen.
- Wenn ein Eintrag da ist: `retailPrice` und `unitOfMeasure` auslesen. Bei „1K“ → Preis pro 1 Mio. Tokens = `retailPrice * 1000`.

**Wichtig:** In der öffentlichen API sind **nicht** alle Modelle gelistet (z. B. GPT-5.x fehlte dort lange). Wenn für „GPT-5.3 Codex“ (oder ein anderes Modell) **kein** Eintrag in der API-Antwort ist, kommt der nächste Schritt.

### Schritt 2: Offizielle Azure-Preisseite (für GPT-5.x und alles, was nicht in der API ist)

**Seite:**

- [Azure OpenAI Service – Preise (DE)](https://azure.microsoft.com/de-de/pricing/details/azure-openai/)  
- oder [Azure OpenAI Service - Pricing (EN)](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)

Dort:

1. **Region** wählen (z. B. „Schweden, Mitte“ = Sweden Central).  
2. **Währung** wählen (z. B. Euro).  
3. In der Tabelle das Modell suchen (z. B. „GPT-5.3 Codex“ oder „GPT-5.2 Codex“).  
4. Preise pro 1 Mio. Token (Eingabe / Ausgabe / ggf. Cached) ablesen.

Die Seite zeigt die **aktuell von Microsoft veröffentlichten** Preise. Für einen bestimmten Monat (z. B. März) gilt der Stand, der zu dem Zeitpunkt auf der Seite war – für Nachweise ggf. Screenshot/PDF mit Datum sichern.

### Kurzfassung

| Frage                         | Vorgehen                                                                 |
|------------------------------|---------------------------------------------------------------------------|
| Preise „aktuell“ für unseren Service | `node scripts/refresh-azure-pricing.js` → API + Snapshot für aktuellen Monat |
| Konkreter Preis für Modell X (in API) | In `openai_preise_schweden_aktuell_eur.json` nach Modell in `skuName`/`meterName` suchen |
| Modell nicht in API (z. B. GPT-5.3 Codex) | Offizielle Preisseite → Region Sweden Central, Währung EUR → Tabelle nutzen |

Die gleiche Logik (erst API, bei Fehlen Webseite) nutze ich auch, wenn du fragst: „Was sind die Preise für GPT-5.3 Codex, Sweden Central, EUR, März?“ – dann schaue ich in der API-Antwort bzw. auf der Preisseite nach und führe die Schritte oben aus.
