# Migration & Integration Tickets

## Übersicht
Dieses Dokument beschreibt alle Tickets für die Migration des bestehenden Systems und die Integration neuer Funktionalitäten.

---

## Ticket 1: Router mit AuthGuard Integration

### Beschreibung
Integration eines zentralen AuthGuard-Komponenten in den Vue Router, um alle Routen zu schützen und Benutzer basierend auf ihren Rollen und Berechtigungen zu authentifizieren.

### Unterpunkte
1. **AuthGuard-Komponente erstellen**
   - Neue Komponente `src/components/auth/AuthGuard.vue` erstellen
   - Keycloak-Initialisierung prüfen
   - Loading-State während Authentifizierung anzeigen
   - Redirect zu Login bei fehlender Authentifizierung
   - Error-Handling für Auth-Fehler

2. **Router-Konfiguration erweitern**
   - `src/router/index.ts` anpassen
   - Geschützte Routen mit AuthGuard wrappen
   - Route-Meta-Felder für Rollen-Berechtigungen hinzufügen
   - Nested Routes für Admin-Bereich (`/admin-console/*`)
   - Public Routes (z.B. `/about`) ohne AuthGuard

3. **Route-Guards implementieren**
   - `beforeEach` Navigation Guard für globale Auth-Prüfung
   - Prüfung auf `canViewOwnUsage`, `canViewAdminUsage` etc.
   - Redirect-Logik zu `/nicht-autorisiert` bei fehlenden Berechtigungen
   - URL-Parameter nach Auth-Callback bereinigen

4. **Integration mit Keycloak**
   - `initKeycloak()` beim Router-Start aufrufen
   - Token-Refresh während Navigation
   - Session-Management bei Token-Expiry

### Akzeptanzkriterien
- ✅ Alle geschützten Routen erfordern Authentifizierung
- ✅ Redirect zu Login bei fehlender Auth
- ✅ Rollenbasierte Zugriffskontrolle funktioniert
- ✅ URL-Parameter werden nach Auth-Callback bereinigt
- ✅ Loading-States werden korrekt angezeigt

---

## Ticket 2: Keycloak.ts - Neue Rollen-Logik

### Beschreibung
Anpassung der Keycloak-Integration für erweiterte Rollen-Logik mit flexibleren Berechtigungen und besserer Gruppierung.

### Unterpunkte
1. **Rollen-Enum erweitern**
   - Bestehende Rollen analysieren: `API_DEFAULT`, `API_STREAM`, `API_ADMIN`, `ENTWICKLUNG`
   - Neue Rollen hinzufügen falls nötig (z.B. `API_READONLY`, `API_MANAGER`)
   - Rollen-Priorität definieren (Admin > Stream > Entwicklung > Default)

2. **Berechtigungen-System erweitern**
   - `ROLE_PERMISSIONS` Objekt erweitern
   - Neue Permissions hinzufügen:
     - `canViewExtractionUsage`
     - `canExportData`
     - `canManageApiKeys` (bereits vorhanden)
     - `canViewAnalytics`
   - Granulare Berechtigungen für Extraction vs. AI Usage

3. **Gruppen-Matching verbessern**
   - `groupMatches()` Funktion robuster machen
   - Unterstützung für verschiedene Gruppennamen-Formate
   - Case-insensitive Matching (bereits vorhanden)
   - Unterstützung für verschachtelte Gruppen (`/api/admin/subgroup`)

4. **Token-Handling optimieren**
   - `getToken()` mit besserem Error-Handling
   - Token-Refresh-Strategie verbessern
   - Token-Expiry-Warnungen implementieren
   - Mock-Token für Development beibehalten

5. **Debug-Funktionen erweitern**
   - `debugToken()` erweitern für neue Rollen
   - Rollen-Mapping-Logging verbessern
   - Permission-Check-Logging hinzufügen

### Akzeptanzkriterien
- ✅ Alle Rollen werden korrekt erkannt
- ✅ Berechtigungen werden korrekt geprüft
- ✅ Gruppen-Matching funktioniert mit verschiedenen Formaten
- ✅ Token-Handling ist robust
- ✅ Debug-Funktionen liefern aussagekräftige Informationen

---

## Ticket 3: API.ts als Grundlage für Orval

### Beschreibung
Setup von `src/axios/api.ts` als zentrale Axios-Instanz mit automatischem Token-Handling für Orval-generierte API-Calls.

### Unterpunkte
1. **Axios-Instanz konfigurieren**
   - Base-URL aus `appConfig` setzen
   - Timeout konfigurieren
   - Request/Response-Interceptors einrichten
   - Error-Handling für Netzwerk-Fehler

2. **Request-Interceptor für Token**
   - Automatisches Hinzufügen von `Authorization: Bearer <token>`
   - Token von `getToken()` aus Keycloak abrufen
   - Fallback bei fehlendem Token (Development-Mode)
   - Logging für Debug-Zwecke

3. **Response-Interceptor für Token-Refresh**
   - 401-Error erkennen
   - Automatischer Token-Refresh
   - Retry des ursprünglichen Requests
   - Error-Propagation bei Refresh-Fehler

4. **Orval Mutator-Funktion**
   - Default-Export `orvalMutator` erstellen
   - Typisierung mit `AxiosRequestConfig` und `AxiosResponse`
   - Kompatibilität mit Orval-generierten Clients sicherstellen

5. **Export-Struktur**
   - Default-Export für Orval
   - Named-Export für direkte Axios-Nutzung
   - TypeScript-Typen exportieren

### Akzeptanzkriterien
- ✅ Alle API-Calls enthalten automatisch Token
- ✅ Token-Refresh funktioniert bei 401-Fehlern
- ✅ Orval-generierte Clients funktionieren ohne Anpassungen
- ✅ Error-Handling ist robust
- ✅ Development-Bypass funktioniert

---

## Ticket 4: Migration - API Service zu Orval

### Beschreibung
Migration des bestehenden `apiService.ts` zu Orval-generierten API-Clients basierend auf `openapi.yaml`.

### Unterpunkte
1. **Orval-Konfiguration**
   - `orval.config.ts` erstellen
   - Input: `openapi.yaml`
   - Output: Generierte Clients in `src/api/generated/`
   - Mutator: `@/axios/api` (default export)

2. **Bestehende Services analysieren**
   - `apiKeyService` aus `apiService.ts` analysieren
   - `usageApiService.ts` analysieren
   - `extractionUsageApiService.ts` analysieren
   - Abhängigkeiten identifizieren

3. **Service-Migration**
   - API Key Service zu Orval-Clients migrieren
   - Usage API Service migrieren
   - Extraction Usage API Service migrieren
   - Alte Service-Dateien als deprecated markieren

4. **Composables anpassen**
   - `useApiKeys.ts` auf neue Services umstellen
   - `useUsageApi.ts` auf neue Services umstellen
   - `useExtractionUsageApi.ts` auf neue Services umstellen
   - Type-Safety sicherstellen

5. **Testing & Validierung**
   - Alle API-Calls testen
   - Error-Handling validieren
   - Type-Checking sicherstellen

### Akzeptanzkriterien
- ✅ Orval generiert Clients korrekt
- ✅ Alle bestehenden Services funktionieren mit neuen Clients
- ✅ Type-Safety ist gewährleistet
- ✅ Keine Breaking Changes für Components
- ✅ Alte Services sind deprecated aber noch funktional

---

## Ticket 5: Migration - Usage Analytics Service

### Beschreibung
Migration des `usageAnalyticsService.ts` zu server-seitiger Verarbeitung über die neue API.

### Unterpunkte
1. **Client-seitige Logik identifizieren**
   - Gruppierungs-Funktionen analysieren
   - Aggregations-Logik identifizieren
   - Filter-Logik prüfen

2. **Backend-Migration planen**
   - Welche Funktionen bleiben client-seitig?
   - Welche Funktionen werden zu API-Endpunkten?
   - Chart-Daten-Berechnung auf Backend verschieben

3. **Service refactoren**
   - Client-seitige Helper-Funktionen beibehalten
   - API-Calls für komplexe Berechnungen
   - Caching-Strategie implementieren

4. **Composables anpassen**
   - `useUsage.ts` auf neue Struktur umstellen
   - Chart-Daten über API laden
   - Client-seitige Aggregation nur für einfache Fälle

### Akzeptanzkriterien
- ✅ Komplexe Berechnungen laufen server-seitig
- ✅ Performance ist verbessert
- ✅ Client-seitige Helper bleiben für einfache Fälle
- ✅ Chart-Daten werden korrekt geladen

---

## Ticket 6: Migration - Pricing Service

### Beschreibung
Integration des Pricing-Services in das neue System mit Orval-Clients.

### Unterpunkte
1. **Pricing-Service analysieren**
   - `pricing-service.ts` analysieren
   - `pricing-breakdown-service.ts` analysieren
   - Abhängigkeiten identifizieren

2. **API-Endpunkte definieren**
   - Pricing-Endpunkte in `openapi.yaml` definieren
   - Orval-Clients generieren
   - Service-Migration durchführen

3. **Integration**
   - Pricing-Service in Components integrieren
   - `UsagePricingDisclaimer` aktualisieren
   - Preisberechnung in Tabellen integrieren

### Akzeptanzkriterien
- ✅ Pricing-Daten werden über API geladen
- ✅ Preisberechnung funktioniert korrekt
- ✅ Disclaimer zeigt korrekte Informationen
- ✅ Performance ist akzeptabel

---

## Ticket 7: Migration - User Management Service

### Beschreibung
Migration des User-Management-Services zu Orval-Clients mit vollständiger Implementierung.

### Unterpunkte
1. **API-Endpunkte definieren**
   - User-Management-Endpunkte in `openapi.yaml`
   - GET /users (für Admins)
   - PUT /users/:id/role
   - DELETE /users/:id (deaktivieren)

2. **Service implementieren**
   - Orval-Clients generieren
   - `userService` aus `apiService.ts` vollständig implementieren
   - Permission-Checks integrieren

3. **UI-Komponenten**
   - User-Management-View erstellen
   - User-Liste mit Rollen-Anzeige
   - Rollen-Änderung-UI
   - User-Deaktivierung

### Akzeptanzkriterien
- ✅ Admins können alle User sehen
- ✅ Rollen können geändert werden
- ✅ User können deaktiviert werden
- ✅ Permission-Checks funktionieren

---

## Ticket 8: Integration - Neue Extraction Funktionalitäten

### Beschreibung
Vollständige Integration der Document Intelligence (Extraction) Funktionalitäten in das bestehende System.

### Unterpunkte
1. **Extraction API-Endpunkte**
   - Extraction-Endpunkte in `openapi.yaml` validieren
   - Orval-Clients generieren
   - Service-Integration abschließen

2. **Extraction Components**
   - `ExtractionUsageContent.vue` finalisieren
   - `ExtractionUsageCharts.vue` optimieren
   - `ExtractionUsageDetailedTable.vue` vervollständigen
   - Alle Felder anzeigen (inkl. API Key ID)

3. **Filter & Pagination**
   - Extraction-Filter vollständig implementieren
   - Server-seitige Pagination
   - Server-seitige Sortierung
   - URL-State-Management

4. **Charts & Visualisierung**
   - Provider-Verteilung-Chart
   - Status-Verteilung-Chart
   - Zeitreihen-Chart für Extraction
   - Chart-Daten über API laden

### Akzeptanzkriterien
- ✅ Alle Extraction-Funktionen funktionieren
- ✅ Charts zeigen korrekte Daten
- ✅ Filterung und Pagination funktionieren
- ✅ Alle Felder werden angezeigt

---

## Ticket 9: Integration - Erweiterte Chart-Funktionalitäten

### Beschreibung
Erweiterte Chart-Funktionalitäten für beide Usage-Typen (AI & Extraction).

### Unterpunkte
1. **Chart-Perioden**
   - Täglich, Wöchentlich, Monatlich
   - Custom-Date-Range
   - Period-Wechsel ohne Daten-Reload

2. **Chart-Interaktionen**
   - Tooltip-Verbesserungen
   - Zoom-Funktionalität
   - Datenpunkt-Details anzeigen
   - Export-Funktion (PNG/CSV)

3. **Multi-Chart-Layout**
   - Responsive Grid-Layout
   - Chart-Vergleich
   - Synchronisierte Zeitachsen

### Akzeptanzkriterien
- ✅ Alle Chart-Perioden funktionieren
- ✅ Interaktionen sind intuitiv
- ✅ Export funktioniert
- ✅ Responsive Design

---

## Ticket 10: Integration - Erweiterte Filter-Funktionalitäten

### Beschreibung
Erweiterte Filter-Optionen für beide Usage-Typen.

### Unterpunkte
1. **Multi-Select-Filter**
   - Mehrere Tags gleichzeitig
   - Mehrere Modelle gleichzeitig
   - Mehrere Provider gleichzeitig

2. **Erweiterte Datumsfilter**
   - Preset-Zeiträume (Letzte 7/30/90 Tage)
   - Custom-Date-Range mit Kalender
   - Relative Datumsangaben (z.B. "Dieser Monat")

3. **Filter-Presets**
   - Gespeicherte Filter-Kombinationen
   - Quick-Filter-Buttons
   - Filter-Export/Import

4. **URL-State-Management**
   - Filter in URL-Parametern speichern
   - Bookmarkable URLs
   - Browser-History-Unterstützung

### Akzeptanzkriterien
- ✅ Multi-Select funktioniert
- ✅ Datumsfilter sind benutzerfreundlich
- ✅ Filter-Presets können gespeichert werden
- ✅ URLs sind bookmarkable

---

## Ticket 11: Integration - Export-Funktionalitäten

### Beschreibung
Umfassende Export-Funktionalitäten für Usage-Daten.

### Unterpunkte
1. **CSV-Export**
   - Tabellen-Daten als CSV
   - Chart-Daten als CSV
   - Custom-Felder-Auswahl
   - Encoding (UTF-8 mit BOM)

2. **Excel-Export**
   - Multi-Sheet-Export
   - Formatierte Tabellen
   - Charts als Bilder einbetten
   - Pivot-Tabellen für Analyse

3. **PDF-Export**
   - Formatted Reports
   - Charts als Bilder
   - Multi-Page-Support
   - Branding/Header-Footer

4. **API-Export**
   - Export-Endpunkt für Backend
   - Bulk-Export für große Datenmengen
   - Asynchroner Export mit Status-Tracking

### Akzeptanzkriterien
- ✅ CSV-Export funktioniert für alle Tabellen
- ✅ Excel-Export mit Formatierung
- ✅ PDF-Reports sind formatiert
- ✅ API-Export für große Datenmengen

---

## Ticket 12: Integration - Erweiterte Tabellen-Funktionalitäten

### Beschreibung
Erweiterte Tabellen-Features für bessere UX.

### Unterpunkte
1. **Spalten-Management**
   - Spalten ein-/ausblenden
   - Spalten-Reihenfolge ändern
   - Spalten-Breite anpassen
   - Spalten-Präferenzen speichern

2. **Erweiterte Sortierung**
   - Multi-Column-Sortierung
   - Custom-Sort-Logik
   - Sort-Indikatoren verbessern

3. **Inline-Editing**
   - Tag-Änderung direkt in Tabelle
   - Bulk-Editing
   - Validation

4. **Row-Actions**
   - Context-Menu pro Zeile
   - Quick-Actions (z.B. "Details anzeigen")
   - Bulk-Actions (z.B. "Mehrere Tags ändern")

### Akzeptanzkriterien
- ✅ Spalten-Management funktioniert
- ✅ Multi-Column-Sortierung
- ✅ Inline-Editing mit Validation
- ✅ Row-Actions sind intuitiv

---

## Ticket 13: Integration - Notification & Feedback System

### Beschreibung
Zentrales Notification-System für User-Feedback.

### Unterpunkte
1. **Toast-Notifications**
   - Success/Error/Info/Warning
   - Auto-Dismiss mit Timer
   - Action-Buttons in Notifications
   - Notification-Queue

2. **Loading-States**
   - Skeleton-Loaders (bereits vorhanden)
   - Progress-Indicators
   - Optimistic Updates

3. **Error-Handling**
   - Zentrale Error-Boundary
   - User-freundliche Fehlermeldungen
   - Retry-Mechanismen
   - Error-Logging

4. **Success-Feedback**
   - Operation-Bestätigungen
   - Visual Feedback für Aktionen
   - Confirmation-Dialogs für kritische Aktionen

### Akzeptanzkriterien
- ✅ Toast-Notifications funktionieren
- ✅ Loading-States sind konsistent
- ✅ Error-Handling ist benutzerfreundlich
- ✅ Success-Feedback ist klar

---

## Ticket 14: Integration - Performance-Optimierungen

### Beschreibung
Performance-Optimierungen für bessere UX.

### Unterpunkte
1. **Lazy-Loading**
   - Route-based Code-Splitting
   - Component-Lazy-Loading
   - Chart-Lazy-Loading

2. **Caching-Strategien**
   - API-Response-Caching
   - Chart-Daten-Caching
   - Filter-State-Caching

3. **Debouncing & Throttling**
   - Filter-Input-Debouncing (bereits vorhanden)
   - Scroll-Throttling
   - Resize-Observer-Optimierung

4. **Virtualisierung**
   - Virtual-Scrolling für große Tabellen
   - Virtual-List für lange Listen
   - Chart-Data-Virtualisierung

### Akzeptanzkriterien
- ✅ Lazy-Loading reduziert Initial-Load-Time
- ✅ Caching verbessert Performance
- ✅ Debouncing reduziert API-Calls
- ✅ Virtualisierung ermöglicht große Datensätze

---

## Ticket 15: Integration - Accessibility & Internationalization

### Beschreibung
Barrierefreiheit und Internationalisierung.

### Unterpunkte
1. **Accessibility (a11y)**
   - ARIA-Labels für alle interaktiven Elemente
   - Keyboard-Navigation
   - Screen-Reader-Unterstützung
   - Focus-Management

2. **Internationalization (i18n)**
   - Vue-I18n Integration
   - Deutsche/Englische Übersetzungen
   - Datum/Zeit-Formatierung
   - Zahl-Formatierung

3. **Responsive Design**
   - Mobile-Optimierung
   - Tablet-Layout
   - Desktop-Layout
   - Touch-Gesten

4. **Theme-Support**
   - Dark-Mode
   - Light-Mode
   - User-Präferenzen
   - System-Präferenzen

### Akzeptanzkriterien
- ✅ WCAG 2.1 AA Compliance
- ✅ Deutsch/Englisch vollständig übersetzt
- ✅ Responsive auf allen Geräten
- ✅ Dark/Light-Mode funktioniert

---

## Priorisierung

### Phase 1 (Kritisch - Basis-Funktionalität)
1. Ticket 1: Router mit AuthGuard Integration
2. Ticket 2: Keycloak.ts - Neue Rollen-Logik
3. Ticket 3: API.ts als Grundlage für Orval
4. Ticket 4: Migration - API Service zu Orval

### Phase 2 (Wichtig - Core-Features)
5. Ticket 5: Migration - Usage Analytics Service
6. Ticket 6: Migration - Pricing Service
7. Ticket 8: Integration - Neue Extraction Funktionalitäten

### Phase 3 (Erweitert - UX-Verbesserungen)
9. Ticket 9: Integration - Erweiterte Chart-Funktionalitäten
10. Ticket 10: Integration - Erweiterte Filter-Funktionalitäten
11. Ticket 12: Integration - Erweiterte Tabellen-Funktionalitäten
13. Ticket 13: Integration - Notification & Feedback System

### Phase 4 (Optional - Nice-to-Have)
7. Ticket 7: Migration - User Management Service
11. Ticket 11: Integration - Export-Funktionalitäten
14. Ticket 14: Integration - Performance-Optimierungen
15. Ticket 15: Integration - Accessibility & Internationalization

---

## Abhängigkeiten

```
Ticket 1 (Router) 
  └─> Ticket 2 (Keycloak)
      └─> Ticket 3 (API.ts)
          └─> Ticket 4 (Orval Migration)
              ├─> Ticket 5 (Analytics)
              ├─> Ticket 6 (Pricing)
              └─> Ticket 8 (Extraction)
                  ├─> Ticket 9 (Charts)
                  ├─> Ticket 10 (Filters)
                  └─> Ticket 12 (Tables)
```

---

## Notizen

- Alle Tickets sollten in separaten Git-Commits umgesetzt werden
- Jedes Ticket sollte vollständig getestet werden bevor das nächste startet
- Deprecated Services sollten erst entfernt werden, wenn Migration vollständig abgeschlossen ist
- Breaking Changes sollten dokumentiert werden
- Migration sollte schrittweise erfolgen (beide Systeme parallel laufen lassen)
