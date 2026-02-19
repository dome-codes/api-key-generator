# Migration Tickets - Basierend auf Screenshots

## Übersicht
Diese Tickets wurden basierend auf den bereitgestellten Screenshots erstellt und ergänzen die bestehenden MIGRATION_TICKETS.md mit spezifischen, screenshot-orientierten Aufgaben.

---

## Ticket 16: Router-Konfiguration erweitern (Screenshot: router/index.ts)

### Beschreibung
Die aktuelle Router-Konfiguration (`src/router/index.ts`) zeigt nur einfache Routes ohne AuthGuard-Integration. Basierend auf dem Screenshot muss die Router-Struktur erweitert werden.

### Screenshot-Analyse
- Aktuell: Nur `/` (Home) und `/about` Routes
- Fehlend: `/admin-console` Route mit AuthGuard
- Fehlend: Nested Routes für Admin-Bereich
- Fehlend: Route-Meta-Felder für Berechtigungen

### Unterpunkte
1. **Admin-Console Route hinzufügen**
   - Route `/admin-console` mit `component: AuthGuard` erstellen
   - Nested Routes für Admin-Bereich (`/admin-console/*`)
   - Default-Route `/admin-console` → `HomeView`
   - Route `/admin-console/nicht-autorisiert` für Unauthorized-Seite

2. **Route-Meta-Felder implementieren**
   - Meta-Feld `requiresAuth: true` für geschützte Routen
   - Meta-Feld `requiredPermissions: []` für rollenbasierte Zugriffskontrolle
   - Meta-Feld `requiredRole: UserRole` für einfache Rollenprüfung

3. **Navigation Guards erweitern**
   - `beforeEach` Guard für globale Auth-Prüfung
   - Prüfung auf `meta.requiresAuth`
   - Prüfung auf `meta.requiredPermissions` mit `hasPermission()`
   - Redirect zu `/admin-console/nicht-autorisiert` bei fehlenden Berechtigungen

4. **Public Routes definieren**
   - `/about` als public Route markieren
   - `/` als public Route (wird durch AuthGuard in App.vue geschützt)
   - Optional: `/login` Route für explizites Login

### Akzeptanzkriterien
- ✅ `/admin-console` Route existiert mit AuthGuard
- ✅ Nested Routes funktionieren korrekt
- ✅ Route-Meta-Felder werden geprüft
- ✅ Navigation Guards leiten korrekt um
- ✅ Public Routes sind ohne Auth erreichbar

---

## Ticket 17: Keycloak.ts Rollen-System vereinheitlichen (Screenshot: keycloak.ts)

### Beschreibung
Die Screenshots zeigen unterschiedliche Rollen-Strukturen. Die aktuelle Implementierung verwendet `API_DEFAULT`, `API_STREAM`, `API_ADMIN`, `ENTWICKLUNG`, während die Screenshots `ADMIN`, `USER`, `TECHNICAL`, `NONE` zeigen. Diese müssen vereinheitlicht werden.

### Screenshot-Analyse
- Screenshot zeigt: `UserRole.ADMIN`, `UserRole.USER`, `UserRole.TECHNICAL`, `UserRole.NONE`
- Aktuelle Implementierung: `UserRole.API_DEFAULT`, `UserRole.API_STREAM`, `UserRole.API_ADMIN`, `UserRole.ENTWICKLUNG`
- Screenshot zeigt: `ROLE_PERMISSIONS` mit `canUseAdminFeatures`, `canCreateKeys`, `canSeeOwnUsage`
- Aktuelle Implementierung: `canViewOwnKeys`, `canCreateKeys`, `canViewOwnUsage`, `canViewAdminUsage`

### Unterpunkte
1. **Rollen-Enum vereinheitlichen**
   - Entscheidung: Welches Rollen-System wird verwendet?
   - Option A: Screenshot-System (`ADMIN`, `USER`, `TECHNICAL`, `NONE`)
   - Option B: Aktuelles System (`API_DEFAULT`, `API_STREAM`, `API_ADMIN`, `ENTWICKLUNG`)
   - Option C: Hybrid-System (Mapping zwischen beiden)
   - Migration aller Verwendungen

2. **Berechtigungen-Namen vereinheitlichen**
   - `canUseAdminFeatures` vs `canViewAdminUsage`
   - `canSeeOwnUsage` vs `canViewOwnUsage`
   - `canManageApiKeys` vs `canCreateKeys` + `canEditOwnKeys`
   - Konsistente Namensgebung festlegen

3. **Gruppen-Mapping aktualisieren**
   - `getUserRoles()` Funktion anpassen
   - Mapping von Keycloak-Gruppen zu neuen Rollen
   - Fallback-Logik für unbekannte Gruppen
   - `groupMatches()` Funktion testen

4. **Permission-Checks aktualisieren**
   - `hasPermission()` Funktion testen
   - Alle Verwendungen von `hasPermission()` prüfen
   - `hasAllPermissions()` und `hasAnyPermission()` validieren
   - Components aktualisieren, die alte Permission-Namen verwenden

5. **Debug-Funktionen erweitern**
   - `debugToken()` erweitern für neue Rollen
   - Rollen-Mapping-Logging verbessern
   - Permission-Check-Logging hinzufügen
   - Gruppen-Detection-Debug (bereits vorhanden) validieren

### Akzeptanzkriterien
- ✅ Rollen-System ist konsistent
- ✅ Alle Berechtigungen funktionieren korrekt
- ✅ Gruppen-Mapping funktioniert für alle Gruppen
- ✅ Permission-Checks sind korrekt
- ✅ Debug-Funktionen zeigen korrekte Informationen

---

## Ticket 18: API.ts Orval Mutator hinzufügen (Screenshot: api.ts)

### Beschreibung
Die aktuelle `src/axios/api.ts` Implementierung zeigt keine Orval Mutator-Funktion. Basierend auf dem Screenshot muss diese hinzugefügt werden.

### Screenshot-Analyse
- Aktuell: Nur `export default api` (Axios-Instanz)
- Fehlend: Orval Mutator-Funktion als Default-Export
- Fehlend: Typisierung für Orval (`AxiosRequestConfig`, `AxiosResponse`)
- Fehlend: Named Export für direkte Axios-Nutzung

### Unterpunkte
1. **Orval Mutator-Funktion erstellen**
   - Default-Export `orvalMutator` Funktion erstellen
   - Typisierung: `(options: AxiosRequestConfig): Promise<T>`
   - Verwendung der bestehenden `api` Axios-Instanz
   - Kompatibilität mit Orval-generierten Clients sicherstellen

2. **Export-Struktur anpassen**
   - Default-Export: Orval Mutator
   - Named Export: `export { api }` für direkte Axios-Nutzung
   - TypeScript-Typen exportieren
   - Rückwärtskompatibilität sicherstellen

3. **Typisierung verbessern**
   - `AxiosRequestConfig` Import prüfen
   - `AxiosResponse` Import hinzufügen
   - Generic Type `<T>` für Response-Typ
   - Type-Safety für Orval-Clients

4. **Testing**
   - Orval-Konfiguration testen
   - Generierte Clients testen
   - Mutator-Funktion validieren
   - Error-Handling prüfen

### Akzeptanzkriterien
- ✅ Orval Mutator-Funktion existiert als Default-Export
- ✅ Axios-Instanz ist als Named Export verfügbar
- ✅ Typisierung ist korrekt
- ✅ Orval-generierte Clients funktionieren
- ✅ Rückwärtskompatibilität ist gewährleistet

---

## Ticket 19: AuthGuard-Komponente vervollständigen (Screenshot: AuthGuard)

### Beschreibung
Die `AuthGuard.vue` Komponente existiert bereits, aber basierend auf dem Screenshot fehlen einige Funktionen.

### Screenshot-Analyse
- Komponente existiert bereits
- Loading-State vorhanden
- Error-State vorhanden
- Fehlend: Vollständige Keycloak-Initialisierung
- Fehlend: Redirect-Logik zu Login
- Fehlend: Route-basierte Berechtigungsprüfung

### Unterpunkte
1. **Keycloak-Initialisierung vervollständigen**
   - `initKeycloak()` korrekt aufrufen
   - `authenticated` Status prüfen
   - Error-Handling verbessern
   - Retry-Mechanismus implementieren

2. **Redirect-Logik implementieren**
   - Redirect zu Keycloak-Login bei fehlender Auth
   - Redirect zu `/nicht-autorisiert` bei fehlenden Berechtigungen
   - URL-Parameter nach Auth-Callback bereinigen
   - Return-URL nach Login setzen

3. **Route-basierte Berechtigungsprüfung**
   - Route-Meta-Felder aus `useRoute()` lesen
   - `requiredPermissions` prüfen
   - `requiredRole` prüfen
   - Redirect bei fehlenden Berechtigungen

4. **Integration mit Router**
   - `useRouter()` für Navigation verwenden
   - `useRoute()` für Route-Informationen
   - Navigation Guards koordinieren
   - Loading-States während Navigation

### Akzeptanzkriterien
- ✅ Keycloak-Initialisierung funktioniert korrekt
- ✅ Redirect zu Login funktioniert
- ✅ Berechtigungsprüfung basierend auf Route-Meta
- ✅ Error-Handling ist robust
- ✅ Loading-States werden korrekt angezeigt

---

## Ticket 20: Usage Analytics Service Migration (Screenshot: File Explorer)

### Beschreibung
Der `usageAnalyticsService.ts` existiert bereits, muss aber zu server-seitiger Verarbeitung migriert werden.

### Screenshot-Analyse
- Datei existiert: `src/services/usageAnalyticsService.ts`
- Fehlend: `chartPeriodHelper.ts` (wird in Screenshot erwähnt)
- Fehlend: `dateUtils.ts` (wird in Screenshot erwähnt)
- Client-seitige Logik muss identifiziert werden

### Unterpunkte
1. **Bestehenden Service analysieren**
   - `usageAnalyticsService.ts` vollständig analysieren
   - Client-seitige Gruppierungs-Funktionen identifizieren
   - Aggregations-Logik identifizieren
   - Filter-Logik prüfen

2. **Helper-Utilities erstellen**
   - `src/utils/chartPeriodHelper.ts` erstellen
     - Funktionen für Period-Konvertierung (daily/weekly/monthly)
     - Datums-Berechnungen für Charts
     - Label-Generierung für Chart-Achsen
   - `src/utils/dateUtils.ts` erstellen
     - Datums-Formatierung
     - Datums-Berechnungen
     - Zeitzonen-Handling
     - Relative Datumsangaben

3. **Backend-Migration planen**
   - Welche Funktionen bleiben client-seitig?
   - Welche Funktionen werden zu API-Endpunkten?
   - Chart-Daten-Berechnung auf Backend verschieben
   - Aggregations-Logik auf Backend verschieben

4. **Service refactoren**
   - Client-seitige Helper-Funktionen beibehalten
   - API-Calls für komplexe Berechnungen
   - Caching-Strategie implementieren
   - Performance-Optimierungen

5. **Composables anpassen**
   - `useUsage.ts` auf neue Struktur umstellen
   - `useUsageTabsLifecycle.ts` anpassen
   - `useUserUsageTabs.ts` anpassen
   - Chart-Daten über API laden

### Akzeptanzkriterien
- ✅ Helper-Utilities existieren (`chartPeriodHelper.ts`, `dateUtils.ts`)
- ✅ Komplexe Berechnungen laufen server-seitig
- ✅ Client-seitige Helper bleiben für einfache Fälle
- ✅ Chart-Daten werden korrekt geladen
- ✅ Performance ist verbessert

---

## Ticket 21: Composables-Struktur analysieren und optimieren (Screenshot: File Explorer)

### Beschreibung
Die File Explorer Screenshots zeigen viele Composables. Diese müssen analysiert und optimiert werden.

### Screenshot-Analyse
- Composables vorhanden:
  - `use-user-usage-summary.ts`
  - `useAdminUsageTabs.ts`
  - `useApiKeys.ts`
  - `useAuth.ts` (bereits vorhanden)
  - `useBudget.ts`
  - `useDebug.ts`
  - `useModals.ts`
  - `useUsage.ts`
  - `useUsageTabsLifecycle.ts`
  - `useUserUsageTabs.ts`

### Unterpunkte
1. **Composables analysieren**
   - Jedes Composable analysieren
   - Abhängigkeiten identifizieren
   - Duplikate finden
   - Verwendungen prüfen

2. **Struktur optimieren**
   - Gemeinsame Logik extrahieren
   - Duplikate entfernen
   - Konsistente Namensgebung
   - Klare Verantwortlichkeiten

3. **Migration zu neuen Services**
   - Composables auf Orval-Clients umstellen
   - Alte Service-Aufrufe ersetzen
   - Type-Safety sicherstellen
   - Error-Handling vereinheitlichen

4. **Testing**
   - Alle Composables testen
   - Integration-Tests
   - Performance-Tests
   - Type-Checking

### Akzeptanzkriterien
- ✅ Alle Composables sind analysiert
- ✅ Duplikate sind entfernt
- ✅ Struktur ist optimiert
- ✅ Migration zu neuen Services abgeschlossen
- ✅ Alle Tests bestehen

---

## Priorisierung

### Phase 1 (Kritisch - Basis-Funktionalität)
1. Ticket 16: Router-Konfiguration erweitern
2. Ticket 17: Keycloak.ts Rollen-System vereinheitlichen
3. Ticket 18: API.ts Orval Mutator hinzufügen
4. Ticket 19: AuthGuard-Komponente vervollständigen

### Phase 2 (Wichtig - Core-Features)
5. Ticket 20: Usage Analytics Service Migration
6. Ticket 21: Composables-Struktur analysieren und optimieren

---

## Abhängigkeiten

```
Ticket 16 (Router)
  └─> Ticket 19 (AuthGuard)
      └─> Ticket 17 (Keycloak Rollen)
          └─> Ticket 18 (API.ts Orval)
              └─> Ticket 20 (Analytics Service)
                  └─> Ticket 21 (Composables)
```

---

## Notizen

- Diese Tickets ergänzen die bestehenden MIGRATION_TICKETS.md
- Screenshots zeigen den aktuellen Zustand vs. gewünschten Zustand
- Jedes Ticket sollte in separaten Git-Commits umgesetzt werden
- Testing ist kritisch für jedes Ticket
