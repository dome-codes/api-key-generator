## Commit-Message-Vorschlag

`Usage: Kosten-Tooltips, Cached/Reasoning-Transparenz und Overview/Detail-Trennung`

## Pull-Request-Titel

`Usage UI: Transparente Kostenaufschlüsselung & klare Trennung Overview/Detail`

## Pull-Request-Beschreibung

### Änderungen

- **AI Usage – Kacheln & Views**
  - Cached Tokens und Reasoning Tokens in den Summary-Kacheln ergänzt.
  - Kosten-Kachel ohne Tooltip (keine missverständlichen Fallback-Hinweise mehr).
  - Overview-Tab: nur Kacheln, Charts und User/API-Key-Breakdown.
  - Detail-Tab: nur die detaillierte Tabelle.

- **AI Usage – Detailtabelle**
  - Neue Kosten-Hover-Tooltips pro Zeile mit:
    - Gesamt-Kosten (fett hervorgehoben).
    - Tokens In/Out inkl. Cached/Reasoning-Anteile.
    - Modellpreise pro 1M Tokens (Input, Cached Input, Output, Reasoning).
    - Aufschlüsselung der Berechnung (Input/Output-Kosten, Aufschlag, Endbetrag).
    - Klarer Hinweis bei Fallback-Modell `"unknown"`.

- **Extraction – Overview & Detail**
  - Gleiche Trennung wie bei AI: Kacheln/Charts/Breakdown nur in Overview, Tabelle nur in Detail.

- **Extraction – Detailtabelle**
  - Kosten-Hover-Tooltips pro Zeile mit:
    - Seitenzahl, Modell-ID, Preis pro Seite.
    - Berechnung Basis-Kosten + Service-Aufschlag + Endbetrag.
    - Hinweis, wenn für das Modell der Fallback-Preis `"unknown"` verwendet wurde.

- **User-Breakdown**
  - Anzeige und Sortierung um Cached Tokens und Reasoning Tokens ergänzt (AI-Variante).

- **Technik**
  - Lokale Typisierung der Pagination-Props in `UsageDetailedTable` (kein Orval-`Page` mehr).
  - Aufräumen ungenutzter Props und Hover-States (z. B. `costTooltip` in `AIUsageSummary`).

### Motivation

- Erhöhte Transparenz, **wie** Kosten zustande kommen (Tokens, Preise, Aufschläge).
- Klare Trennung zwischen **High-Level-Overview** und **Detail-Analyse**.
- Vermeidung missverständlicher Fallback-Hinweise in der Oberfläche (Kachel), während Entwickler/Analysten weiterhin alle Details in den Tabellen-Tooltips sehen können.

### Test

- **AI Usage**
  - Overview/Detail-Tab durchklicken, Kacheln und Tabelle wie erwartet.
  - In der Detailtabelle über Kosten hovern: Tooltip mit vollständiger Berechnung (Tokens, Preise, Aufschlag).
- **Extraction**
  - Overview/Detail-Tab, Kacheln/Charts/Breakdown nur in Overview, Tabelle in Detail.
  - In der Extraction-Tabelle über Kosten hovern: Tooltip mit Seiten * Preis/Seite + Aufschlag und Fallback-Hinweis (falls zutreffend).

