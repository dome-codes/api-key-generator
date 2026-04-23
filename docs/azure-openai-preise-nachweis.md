# Azure OpenAI – Preise zum Nachweis

## 1. Preise aus der Retail Prices API (programmatisch)

Für **Sweden Central** und **Consumption** liegen die Preise als JSON vor und können als Nachweis verwendet werden:

| Datei | Währung | Inhalt |
|-------|---------|--------|
| `openai_preise_schweden_maerz.json` | USD | Alle Azure-OpenAI-Consumption-Preise (z. B. GPT-4.1, 4o, o3, o3-mini, 4.5, …) |
| `openai_preise_schweden_maerz_eur.json` | EUR | Dieselben Preise in Euro |

- **Quelle:** [Azure Retail Prices REST API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices)  
- **Aktualisierung:** Skript `scripts/fetch-azure-openai-prices-sweden.js` (siehe Kopfkommentar im Skript).

Die API enthält **keine** Einträge für **GPT-5, GPT-5.1, GPT-5.2**. Diese Modelle sind im öffentlichen Retail-Preis-Katalog von Microsoft (noch) nicht geführt.

---

## 2. Offizielle Preisseite (inkl. GPT-5.x) – Nachweis für alle Modelle

Für **alle** Modelle (inkl. GPT-5, GPT-5.1, GPT-5.2) ist die maßgebliche Quelle die offizielle Azure-Preisseite:

- **DE:** [Azure OpenAI Service – Preise](https://azure.microsoft.com/de-de/pricing/details/azure-openai/)
- **EN:** [Azure OpenAI Service - Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)

Dort sind u. a. aufgeführt:

- GPT-5.2 (Codex Global, Global, Data Zone, -chat)
- GPT-5.1 (Global, Data Zone, -chat, -codex, -codex-max, -codex-mini)
- GPT-5-Serie (2025-08-07 Global, Data Zone, Pro, Codex, -mini, -nano, -chat)
- sowie 4.1, 4o, o3, o4-mini, Sora, etc.

**Für den Nachweis (Audit/Compliance):**

1. Seite öffnen (Link oben).
2. **Region** z. B. „Schweden, Mitte“ (Sweden Central) wählen.
3. **Währung** z. B. „Euro (€) EUR“ wählen.
4. Gewünschte Modell-Tabelle auf der Seite anzeigen lassen.
5. **Als Nachweis sichern:**  
   - **Seite als PDF drucken** (Browser: Drucken → „Als PDF speichern**) oder  
   - **Screenshot** der relevanten Tabellen (inkl. sichtbarer Region/Währung).

So ist dokumentiert, dass die Preise der offiziellen Microsoft-Quelle entstammen und zum gewählten Stichtag/Region/Währung gelten.

---

## 3. Kurzüberblick

| Nachweistyp | Quelle | Geeignet für |
|-------------|--------|----------------|
| JSON (Sweden Central) | Retail Prices API via Skript | GPT-4.1, 4o, o3, o3-mini, 4.5, Embeddings, Speech, … (alles, was die API liefert) |
| Webseite + PDF/Screenshot | azure.microsoft.com Pricing | **Alle** Modelle inkl. GPT-5, GPT-5.1, GPT-5.2 |

Wenn ihr für ein Audit explizit „die gleiche Quelle wie die offizielle Seite“ braucht: Für GPT-5.x gibt es nur die Preisseite (plus ggf. Angebot vom Vertrieb). Für die übrigen Modelle könnt ihr zusätzlich die JSON-Exporte aus der Retail Prices API als programmatischen Nachweis verwenden.
