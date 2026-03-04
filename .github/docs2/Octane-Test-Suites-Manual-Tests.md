# Octane Test Suites – Manual Tests (Rollenbasiert)

Basierend auf dem Rollen-Enum aus `src/auth/keycloak.ts`:

```ts
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  TECHNICAL = 'TECHNICAL',
  NONE = 'NONE',
}
```

---

## Überblick Test-Suites

| Suite | Rolle | Fokus |
|-------|--------|--------|
| **AUTH – ADMIN** | `UserRole.ADMIN` | Vollzugriff: Login, API-Keys, Pricing-Management |
| **AUTH – USER** | `UserRole.USER` | Standard-User: Login, eigene API-Keys, kein Pricing |
| **AUTH – TECHNICAL** | `UserRole.TECHNICAL` | Technische Rolle: erweiterte API-Key-Funktionen, kein Pricing |
| **AUTH – GUEST/UNAUTH** | `UserRole.NONE` | Nicht eingeloggt: öffentliche Seiten, Redirect bei geschützten Seiten |

---

## Template für Manual Tests in Octane

- **Name**: Kurz, eindeutig
- **Beschreibung/Zweck**: Was wird validiert?
- **Preconditions**: Technische/fachliche Voraussetzungen
- **Test Steps**: Schritt 1, 2, 3 …
- **Expected Result**: Erwartetes Verhalten (fachlich + technisch)
- **Priorität**: High / Medium / Low
- **Tags** (optional): `auth`, `api-key`, `pricing`, `negative`, `smoke`, `regression`, `role:ADMIN` usw.

---

# SUITE 1: AUTH – ADMIN (UserRole.ADMIN)

## A) Login / Session / Logout

### TC-ADMIN-001 – Erfolgreicher Login als ADMIN

- **Beschreibung**: Prüft, dass ein gültiger ADMIN-User sich einloggen kann.
- **Preconditions**:
  - ADMIN-Benutzer im Keycloak angelegt.
  - Applikation läuft, Login-Seite erreichbar.
- **Steps**:
  1. Login-Seite öffnen.
  2. ADMIN-Username und korrektes Passwort eingeben.
  3. Auf „Login“ klicken.
- **Expected Result**:
  - Login erfolgreich, keine Fehlermeldung.
  - User wird auf die Standard-Startseite (z. B. Dashboard/API-Key-Übersicht) weitergeleitet.
  - UI zeigt irgendwo erkennbar den eingeloggten Benutzer / Rolle (z. B. im Header).
- **Priorität**: High

---

### TC-ADMIN-002 – Login-Validierung (falsches Passwort)

- **Beschreibung**: Fehlermeldung bei falschem Passwort.
- **Preconditions**:
  - ADMIN-Benutzer existiert.
- **Steps**:
  1. Login-Seite öffnen.
  2. ADMIN-Username und **falsches** Passwort eingeben.
  3. Auf „Login“ klicken.
- **Expected Result**:
  - Login schlägt fehl.
  - Klare und verständliche Fehlermeldung (z. B. „Benutzername oder Passwort ungültig“).
  - Kein Redirect auf geschützte Seiten.
- **Priorität**: High

---

### TC-ADMIN-003 – Session Timeout / Inaktivität

- **Beschreibung**: Prüft, dass inaktive Sessions ablaufen.
- **Preconditions**:
  - ADMIN eingeloggt.
  - Timeout-Konfiguration bekannt (z. B. 15 Minuten).
- **Steps**:
  1. Nach erfolgreichem Login auf einer geschützten Seite verbleiben.
  2. Keine Interaktion bis über den konfigurierten Timeout hinaus.
  3. Versuchen, zu einer anderen geschützten Seite zu navigieren.
- **Expected Result**:
  - Session ist abgelaufen.
  - User wird zur Login-Seite umgeleitet oder muss sich erneut authentifizieren.
- **Priorität**: Medium

---

### TC-ADMIN-004 – Logout-Funktion

- **Beschreibung**: Prüft korrektes Logout.
- **Preconditions**:
  - ADMIN ist eingeloggt.
- **Steps**:
  1. Auf Logout-Button/Link klicken.
  2. Versuchen, per Browser-Back auf eine vorherige geschützte Seite zu navigieren.
- **Expected Result**:
  - User wird auf eine öffentliche Seite (z. B. Login) geleitet.
  - Zugriff auf geschützte Seiten nur nach erneutem Login möglich.
- **Priorität**: High

---

## B) Nicht autorisierte Seite / Zugriffskontrolle (ADMIN)

### TC-ADMIN-010 – Kein „Forbidden“ für ADMIN bei ADMIN-Features

- **Beschreibung**: ADMIN soll keinen 403/„Forbidden“ bekommen, wenn er legitime ADMIN-Funktionen nutzt.
- **Preconditions**:
  - ADMIN ist eingeloggt.
- **Steps**:
  1. Direkt auf eine typische ADMIN-Seite (z. B. Pricing-Management) navigieren.
- **Expected Result**:
  - Seite wird ohne Fehlermeldung geladen.
  - Keine „Zugriff verweigert“-Meldung.
- **Priorität**: High

---

### TC-ADMIN-011 – Zugriff auf Seite mit explizitem Rollen-Check

- **Beschreibung**: Prüft, dass Rollenchecks korrekt greifen (z. B. `UserRole.ADMIN`).
- **Preconditions**:
  - ADMIN eingeloggt.
- **Steps**:
  1. Eine Seite öffnen, die in der App explizit per Rollenlogik geschützt ist (z. B. „Pricing Management“).
- **Expected Result**:
  - Rolle wird erkannt.
  - Seite wird angezeigt.
- **Priorität**: High

---

## C) API-Key-Bereich inkl. Unterseiten (ADMIN)

### TC-ADMIN-020 – API-Key-Übersichtsseite aufrufen

- **Beschreibung**: ADMIN kann API-Key-Übersicht öffnen.
- **Preconditions**:
  - ADMIN eingeloggt.
- **Steps**:
  1. Über Navigation den API-Key-Bereich öffnen.
- **Expected Result**:
  - Übersicht zeigt alle vorhandenen API-Keys (mit Meta-Informationen: Name, Erstellungsdatum, Status etc.).
  - UI-Elemente zum Erstellen/Löschen/Deaktivieren sichtbar.
- **Priorität**: High

---

### TC-ADMIN-021 – API-Key erstellen

- **Beschreibung**: ADMIN generiert neuen API-Key.
- **Preconditions**:
  - ADMIN eingeloggt.
- **Steps**:
  1. Auf „Neuen API-Key erstellen“ klicken.
  2. Pflichtfelder ausfüllen (z. B. Name, Gültigkeit, Scopes).
  3. Speichern/Erstellen.
- **Expected Result**:
  - API-Key wird angelegt.
  - Erfolgsbestätigung wird angezeigt.
  - API-Key erscheint in der Übersicht.
- **Priorität**: High

---

### TC-ADMIN-022 – Validierung beim API-Key-Erstellen (leere Pflichtfelder)

- **Beschreibung**: Prüft Form-Validierung beim Erstellen eines API-Keys.
- **Preconditions**:
  - ADMIN eingeloggt.
- **Steps**:
  1. Dialog „Neuen API-Key erstellen“ öffnen.
  2. Pflichtfelder leer lassen oder ungültige Werte eingeben.
  3. Auf „Speichern“ klicken.
- **Expected Result**:
  - API-Key wird **nicht** angelegt.
  - Fehlermeldung an den betroffenen Feldern.
  - Klarer Hinweis, welche Felder zu korrigieren sind.
- **Priorität**: High

---

### TC-ADMIN-023 – API-Key deaktivieren / reaktivieren

- **Beschreibung**: ADMIN ändert Status eines bestehenden Keys.
- **Preconditions**:
  - Mindestens ein aktiver API-Key vorhanden.
  - ADMIN eingeloggt.
- **Steps**:
  1. In der Übersicht einen aktiven API-Key auswählen.
  2. Auf „Deaktivieren“ klicken und ggf. Bestätigungsdialog bestätigen.
  3. Prüfen, dass Status „deaktiviert“ / „inaktiv“ angezeigt wird.
  4. Optional: Gleichen Key wieder aktivieren.
- **Expected Result**:
  - Status-Änderung wird in UI und Backend übernommen.
- **Priorität**: High

---

### TC-ADMIN-024 – API-Key löschen

- **Beschreibung**: Permanentes Entfernen eines API-Keys.
- **Preconditions**:
  - API-Key vorhanden.
  - ADMIN eingeloggt.
- **Steps**:
  1. API-Key in Übersicht auswählen.
  2. Auf „Löschen“ klicken und Confirm-Dialog bestätigen.
- **Expected Result**:
  - API-Key ist danach nicht mehr in der Übersicht.
  - Kein Zugriff mehr mit diesem Key möglich (falls technisch prüfbar über API-Call).
- **Priorität**: High

---

### TC-ADMIN-025 – Unterseiten des API-Key-Bereichs (Details / Audit / Usage)

- **Beschreibung**: ADMIN kann Unterseiten eines API-Keys einsehen.
- **Preconditions**:
  - ADMIN eingeloggt.
  - API-Key mit Einträgen in Audit/Usage vorhanden.
- **Steps**:
  1. API-Key Detailseite öffnen.
  2. Zu Tabs wie „Details“, „Usage“, „Audit Log“ navigieren.
- **Expected Result**:
  - Daten werden korrekt angezeigt.
  - Tabs sind gemäß Berechtigung sichtbar.
- **Priorität**: Medium

---

## D) Pricing-Management (ADMIN)

### TC-ADMIN-030 – Zugriff auf Pricing-Management

- **Beschreibung**: ADMIN sieht und öffnet Pricing-Management.
- **Preconditions**:
  - ADMIN eingeloggt.
- **Steps**:
  1. Navigation öffnen.
  2. Menüpunkt „Pricing Management“ anklicken.
- **Expected Result**:
  - Seite wird geladen.
  - Liste der Pricing-Pläne/Tiers sichtbar.
- **Priorität**: High

---

### TC-ADMIN-031 – Pricing-Plan erstellen

- **Beschreibung**: ADMIN legt neuen Pricing-Plan an.
- **Preconditions**:
  - ADMIN eingeloggt.
- **Steps**:
  1. Auf „Neuen Plan erstellen“ klicken.
  2. Pflichtfelder ausfüllen (Name, Preis, Limits, Währung, …).
  3. Speichern.
- **Expected Result**:
  - Neuer Plan wird in der Übersicht angezeigt.
  - Plausibilitätsprüfungen (z. B. Preis > 0) erfolgreich.
- **Priorität**: High

---

### TC-ADMIN-032 – Pricing-Plan bearbeiten

- **Beschreibung**: ADMIN ändert existierenden Plan.
- **Preconditions**:
  - Mindestens ein Plan vorhanden.
- **Steps**:
  1. Bestehenden Plan auswählen.
  2. Auf „Bearbeiten“ klicken.
  3. Werte ändern (z. B. Preis, Limits).
  4. Speichern.
- **Expected Result**:
  - Änderungen werden gespeichert und in UI aktualisiert.
- **Priorität**: High

---

### TC-ADMIN-033 – Pricing-Plan deaktivieren / archivieren

- **Beschreibung**: ADMIN kann einen Plan deaktivieren, sodass er nicht mehr neu ausgewählt werden kann.
- **Preconditions**:
  - Plan existiert.
- **Steps**:
  1. Plan auswählen.
  2. „Deaktivieren/Archivieren“ anklicken.
- **Expected Result**:
  - Plan ist als inaktiv markiert.
  - Wird für neue Kunden/Instanzen nicht mehr zur Auswahl angeboten.
- **Priorität**: Medium

---

### TC-ADMIN-034 – UI-Validierungen im Pricing-Formular

- **Beschreibung**: Negative Tests für ungültige Preisdaten.
- **Preconditions**:
  - ADMIN eingeloggt.
- **Steps**:
  1. Pricing-Plan erstellen/bearbeiten.
  2. Ungültige Daten eingeben (z. B. negativer Preis, ungültige Währung).
  3. Speichern klicken.
- **Expected Result**:
  - Speicherung wird verhindert.
  - Deutliche Fehlermeldung.
- **Priorität**: High

---

# SUITE 2: AUTH – USER (UserRole.USER)

## A) Login / Session / Logout (USER)

### TC-USER-001 – Erfolgreicher Login als USER

- **Beschreibung**: Wie TC-ADMIN-001, aber mit USER-Account.
- **Preconditions**: USER-Benutzer im Keycloak angelegt.
- **Steps**: Login-Seite öffnen → USER-Credentials eingeben → Login klicken.
- **Expected Result**:
  - Landing Page evtl. ohne ADMIN-Funktionen (z. B. kein Pricing-Management-Menü).
  - Sichtbare Rolle: USER.
- **Priorität**: High

---

### TC-USER-002 – Login-Fehler (falsches Passwort)

- Analog zu TC-ADMIN-002, gleiche Erwartungen.
- **Priorität**: High

---

### TC-USER-003 – Session Timeout

- Analog zu TC-ADMIN-003.
- **Priorität**: Medium

---

### TC-USER-004 – Logout

- Analog zu TC-ADMIN-004; sicherstellen, dass auch bei USER keine geschützte Seite nach Logout erreichbar ist.
- **Priorität**: High

---

## B) Zugriffskontrolle / Nicht autorisierte Seite (USER)

### TC-USER-010 – Zugriff auf reine USER-Bereiche

- **Beschreibung**: USER sollte alle für ihn definierten Standardseiten sehen (z. B. eigene API-Keys).
- **Steps**: Als USER einloggen, zu USER-Bereichen navigieren.
- **Expected Result**: Kein „Forbidden“ auf USER-Bereichen.
- **Priorität**: High

---

### TC-USER-011 – Verbotener Zugriff auf ADMIN-Bereich (Pricing-Management)

- **Beschreibung**: USER darf kein Pricing-Management sehen/öffnen.
- **Preconditions**: USER eingeloggt.
- **Steps**:
  1. Versuchen, über URL/Navigation auf Pricing-Management zuzugehen.
- **Expected Result**:
  - Menüpunkt evtl. gar nicht sichtbar (Best Case).
  - Direkter URL-Aufruf führt zu „Access Denied“ / 403 oder Redirect auf „Nicht autorisiert“-Seite.
- **Priorität**: High

---

## C) API-Key-Bereich (USER)

### TC-USER-020 – API-Key-Übersicht für USER

- **Beschreibung**: USER sieht nur eigene Keys bzw. erlaubte Aktionen.
- **Expected Result**:
  - Nur eigene Keys sichtbar (falls Multi-Tenant).
  - Evtl. reduzierte Aktionen (z. B. kein Löschen, nur Anzeigen).
- **Priorität**: High

---

### TC-USER-021 – API-Key erstellen (falls erlaubt)

- **Beschreibung**: Wenn USER eigene Keys erstellen darf: analog TC-ADMIN-021.
- **Expected Result**:
  - Prüfen, ob bestimmte Optionen/Scopes nicht verfügbar sind.
  - Keys nur für den eigenen Kontext gelten.
- **Priorität**: High

---

### TC-USER-022 – Versuch, fremde API-Keys aufzurufen

- **Beschreibung**: Security-Test: Kein Zugriff auf fremde Keys.
- **Steps**:
  1. URL eines fremden API-Keys kennen (oder konstruieren).
  2. Als USER auf diese Details-URL gehen.
- **Expected Result**:
  - Zugriff verweigert (403, „Not allowed“, oder Redirect).
- **Priorität**: High (Security)

---

## D) Pricing-Management (USER)

### TC-USER-030 – Pricing-Management ist nicht sichtbar

- **Steps**: Als USER einloggen, Navigation prüfen.
- **Expected Result**: Kein Menüpunkt „Pricing Management“.
- **Priorität**: High

---

### TC-USER-031 – Direktaufruf Pricing-URL

- **Steps**: Als USER eingeloggt, direkte URL zu Pricing-Management aufrufen.
- **Expected Result**: Zugriff verweigert (403/„Access denied“) oder Redirect auf „Nicht autorisiert“-Seite.
- **Priorität**: High

---

# SUITE 3: AUTH – TECHNICAL (UserRole.TECHNICAL)

Annahme: TECHNICAL hat technische Rechte (mehr als USER, ggf. weniger als ADMIN).

## A) Login / Session / Logout (TECHNICAL)

### TC-TECH-001 – Erfolgreicher Login als TECHNICAL

- Analog zu ADMIN/USER; Landing Page kann ggf. direkt API-Key-Bereich oder technische Übersichtsseite sein.
- **Expected Result**: Rolle im UI sichtbar: TECHNICAL.
- **Priorität**: High

---

### TC-TECH-002 – Login-Fehler | TC-TECH-003 – Timeout | TC-TECH-004 – Logout

- Analog zu anderen Rollen.
- **Priorität**: High (002, 004), Medium (003)

---

## B) Zugriffskontrolle / Nicht autorisierte Seite (TECHNICAL)

### TC-TECH-010 – Zugriff auf technische Seiten

- **Beschreibung**: TECHNICAL soll bestimmte interne/diagnostische Seiten sehen (falls vorhanden).
- **Expected Result**: Kein „Forbidden“ auf vorgesehenen technischen Seiten.
- **Priorität**: High

---

### TC-TECH-011 – Zugriff auf ADMIN-exklusive Bereiche verhindern

- **Beschreibung**: Z. B. Pricing-Management.
- **Expected Result**:
  - Menüpunkt nicht sichtbar oder
  - Direktaufruf → 403 / „Access denied“.
- **Priorität**: High

---

## C) API-Key-Bereich (TECHNICAL)

### TC-TECH-020 – API-Key-Übersicht TECHNICAL

- **Expected Result**:
  - Relevante technische Keys sichtbar.
  - Evtl. Admin-Only-Aktionen (z. B. globale Keys löschen) sind ausgeblendet.
- **Priorität**: High

---

### TC-TECH-021 – API-Key erstellen mit erweiterten technischen Optionen

- **Beschreibung**: TECHNICAL kann Keys mit speziellen Scopes/Settings anlegen.
- **Steps**:
  1. Neue API-Key-Erstellung öffnen.
  2. Erweiterte technische Optionen (z. B. IP-Whitelist, Rate Limits) setzen.
- **Expected Result**: Technik-Optionen sind sichtbar und speicherbar.
- **Priorität**: High

---

### TC-TECH-022 – Verbotene „globale“ Aktionen

- **Beschreibung**: TECHNICAL darf bestimmte ADMIN-only Funktionen nicht ausführen (z. B. globale Keys löschen, Mandanten-übergreifende Änderungen).
- **Expected Result**: Buttons ausgeblendet oder führen bei Klick zu „Access denied“.
- **Priorität**: High (Security/Segregation of Duties)

---

## D) Pricing-Management (TECHNICAL)

### TC-TECH-030 – Kein Zugriff auf Pricing-Management

- Analog zu USER: Menüpunkt nicht sichtbar, Direktaufruf → 403/Unauthorized.
- **Priorität**: High

---

# SUITE 4: AUTH – GUEST/UNAUTH (UserRole.NONE)

Nicht eingeloggte User.

## A) Zugriff auf öffentliche Seiten

### TC-GUEST-001 – Start-/Landing-Page ohne Login

- **Beschreibung**: Öffentliche Seite ohne Auth.
- **Steps**: Applikation im Browser aufrufen (ohne Session/Login).
- **Expected Result**:
  - Öffentliche Seite lädt (Landing, Marketing, Doku, Pricing-Info, …).
  - Kein Fehler 401/403.
- **Priorität**: Medium

---

## B) Zugriff auf geschützte Seiten ohne Login

### TC-GUEST-010 – Direkter Aufruf API-Key-Seite ohne Login

- **Steps**: URL der API-Key-Übersicht direkt im Browser eingeben (ohne Login).
- **Expected Result**:
  - Redirect zur Login-Seite **oder**
  - „Nicht autorisiert“-Seite mit Hinweis auf Login.
  - Keine vertraulichen Informationen sichtbar.
- **Priorität**: High

---

### TC-GUEST-011 – Direkter Aufruf Pricing-Management ohne Login

- Analog zu TC-GUEST-010, aber für Pricing-Management.
- **Priorität**: High

---

### TC-GUEST-012 – Direkter Aufruf einer Detailseite (API-Key-ID) ohne Login

- **Expected Result**:
  - Kein Leak von Key-Daten.
  - Redirect/Fehlermeldung.
- **Priorität**: High (Security)

---

## C) Fehlverhalten / Manipulation

### TC-GUEST-020 – Manuelle Manipulation von Rollen-Cookies/Token

- **Beschreibung**: Prüft, dass Client-Manipulation der Rolle nicht ausreicht, um Rechte zu erhalten.
- **Preconditions**: Basiswissen über verwendete Auth (Keycloak/JWT/Cookies).
- **Steps** (manuell so weit möglich):
  1. Ohne gültiges Login ein Token/Cookie manipulieren, um sich als ADMIN/USER/TECHNICAL auszugeben (soweit technisch möglich).
  2. Geschützte Seite aufrufen (z. B. Pricing-Management).
- **Expected Result**:
  - Backend validiert Tokens.
  - Kein unautorisierter Zugriff möglich.
- **Priorität**: High (Security)

---

## D) Fehlerseiten / UX für Unauth

### TC-GUEST-030 – Konsistente „Nicht autorisiert“-Seite

- **Beschreibung**: Darstellung der 401/403-Seiten.
- **Steps**: Irgendeine geschützte URL ohne Login aufrufen.
- **Expected Result**:
  - Einheitliches Layout/Design für Fehlerseite.
  - Verständliche Fehlermeldung und klare Aktion (z. B. „Jetzt einloggen“ Button).
- **Priorität**: Medium

---

# Kurzübersicht Test-IDs

| Suite   | Bereich              | Test-IDs (Beispiele)     |
|---------|----------------------|--------------------------|
| ADMIN   | Login/Session/Logout | TC-ADMIN-001 … 004       |
| ADMIN   | Zugriffskontrolle    | TC-ADMIN-010, 011        |
| ADMIN   | API-Key              | TC-ADMIN-020 … 025       |
| ADMIN   | Pricing              | TC-ADMIN-030 … 034       |
| USER    | Login/Session/Logout | TC-USER-001 … 004        |
| USER    | Zugriffskontrolle    | TC-USER-010, 011         |
| USER    | API-Key              | TC-USER-020 … 022        |
| USER    | Pricing              | TC-USER-030, 031         |
| TECHNICAL | Login/Session/Logout | TC-TECH-001 … 004      |
| TECHNICAL | Zugriffskontrolle  | TC-TECH-010, 011         |
| TECHNICAL | API-Key            | TC-TECH-020 … 022        |
| TECHNICAL | Pricing            | TC-TECH-030              |
| GUEST   | Öffentlich           | TC-GUEST-001             |
| GUEST   | Geschützt            | TC-GUEST-010 … 012       |
| GUEST   | Manipulation/UX      | TC-GUEST-020, 030        |

---

*Erstellt für Octane Test Suites – manuelle Tests nach Rollen (ADMIN, USER, TECHNICAL, NONE).*
