# Migration Status - Übersicht

> **Hinweis**: Für detaillierte Prioritäten und Empfehlungen siehe [MIGRATION_PRIORITIES.md](./MIGRATION_PRIORITIES.md)

## Abgeschlossene Tickets ✅

### Phase 1 (Kritisch - Basis-Funktionalität)
- ✅ **Ticket 1/16: Router-Konfiguration erweitern**
  - Router mit AuthGuard Integration implementiert
  - Route-Meta-Felder für Permissions hinzugefügt
  - Navigation Guards implementiert
  - NichtAutorisiert View erstellt

- ✅ **Ticket 2/17: Keycloak.ts Rollen-System vereinheitlichen**
  - ROLE_PERMISSIONS erweitert
  - Neue Permissions hinzugefügt (canViewExtractionUsage, canViewAnalytics, etc.)
  - Alias-Permissions für konsistente Namensgebung

- ✅ **Ticket 3/18: API.ts Orval Mutator hinzufügen**
  - orvalMutator als default export erstellt
  - Named exports für direkte Axios-Nutzung
  - Type-Exports hinzugefügt

- ✅ **Ticket 19: AuthGuard-Komponente vervollständigen**
  - Route-basierte Permission-Checks implementiert
  - Watch auf route.path für nested routes
  - Redirect-Logik zu NichtAutorisiert

### Phase 2 (Wichtig - Core-Features)
- ✅ **Ticket 20: Usage Analytics Service Migration**
  - Helper Utilities erstellt:
    - `chartPeriodHelper.ts` (Period-Konvertierung, Label-Generierung)
    - `dateUtils.ts` (Datums-Formatierung, Berechnungen)
  - Helper-Funktionen für Chart-Perioden (daily/weekly/monthly/hourly)
  - UTC-Normalisierung für Datums-Vergleiche

- ✅ **Ticket 21: Composables-Struktur analysieren und optimieren**
  - COMPOSABLES_ANALYSIS.md erstellt
  - Alle Composables dokumentiert
  - `useUsage.ts` als deprecated markiert (Migration zu `useUsageApi.ts`)
  - Keine kritischen Duplikate gefunden

- ✅ **Ticket 8: Integration - Neue Extraction Funktionalitäten**
  - Server-seitige Sortierung für Extraction Usage implementiert
  - ExtractionUsageDetailedTable unterstützt Backend-Sortierung
  - Sortierbare Spalten: Technischer Nutzer, Status, Provider, Seiten, Confidence, Kosten, Datum, API Key ID
  - `updateSort` Funktion in `useExtractionUsageApi` hinzugefügt
  - Sort-Parameter in API Types erweitert
  - ErrorState Komponente integriert

## Teilweise abgeschlossene Tickets ⚠️

- ⚠️ **Ticket 4: Migration - API Service zu Orval**
  - **Status**: API-Clients existieren bereits und werden verwendet
  - `src/api/usage/usage.ts` verwendet `api` aus `@/axios/api`
  - `src/api/usage/extraction.ts` verwendet `api` aus `@/axios/api`
  - Services (`usageApiService`, `extractionUsageApiService`) nutzen diese Clients bereits
  - **Offen**: Orval-Konfiguration für automatische Generierung kann später hinzugefügt werden

- ⚠️ **Ticket 5: Migration - Usage Analytics Service**
  - **Status**: Neue Composables verwenden bereits server-seitige Logik
  - `useUsageApi` und `useExtractionUsageApi` verwenden bereits `usageApiService`/`extractionUsageApiService`
  - Diese Services nutzen direkt die API-Clients
  - **Offen**: `usageAnalyticsService` wird nur noch von deprecated `useUsage.ts` verwendet
  - Migration von `useUsage.ts` zu `useUsageApi.ts` kann schrittweise erfolgen

## Offene Tickets 📋

### Phase 2 (Wichtig - Core-Features)
- 📋 **Ticket 6: Migration - Pricing Service**
  - Pricing-Service analysieren
  - API-Endpunkte definieren (falls nötig)
  - Service-Migration durchführen
  - Integration in Components

### Phase 3 (Erweitert - UX-Verbesserungen)
- 📋 **Ticket 9: Integration - Erweiterte Chart-Funktionalitäten**
- 📋 **Ticket 10: Integration - Erweiterte Filter-Funktionalitäten**
- 📋 **Ticket 12: Integration - Erweiterte Tabellen-Funktionalitäten**
- 📋 **Ticket 13: Integration - Notification & Feedback System**

### Phase 4 (Optional - Nice-to-Have)
- 📋 **Ticket 7: Migration - User Management Service**
- 📋 **Ticket 11: Integration - Export-Funktionalitäten**
- 📋 **Ticket 14: Integration - Performance-Optimierungen**
- 📋 **Ticket 15: Integration - Accessibility & Internationalization**

## Zusammenfassung

**Abgeschlossen**: 7 Tickets (Phase 1 komplett, Phase 2 größtenteils)
**Teilweise abgeschlossen**: 2 Tickets (können später vervollständigt werden)
**Offen**: 9 Tickets (hauptsächlich Phase 3 & 4)

Die wichtigsten Basis-Funktionalitäten sind implementiert:
- ✅ Router mit AuthGuard
- ✅ Keycloak Rollen-System
- ✅ API.ts als Orval-Basis
- ✅ Helper Utilities für Charts/Datums
- ✅ Composables-Struktur optimiert
- ✅ Extraction Sortierung
- ✅ API-Clients existieren bereits

Die Migration ist auf einem guten Stand. Die offenen Tickets sind hauptsächlich Erweiterungen und Nice-to-Have Features.
