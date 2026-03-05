## Octane Manual Tests – Schritt/Erwartung-Format

Dieses Dokument enthält die wichtigsten manuellen Tests für alle Rollen/Suites im von dir verwendeten Octane-Format:

- Aktionsschritte als normale Bullet-Points
- Erwartete Ergebnisse mit vorangestelltem `?`

Struktur:

- `AUTH – ADMIN`
- `AUTH – USER`
- `AUTH – TECHNICAL`
- `AUTH – GUEST/UNAUTH`

Du kannst die einzelnen Testfälle **blockweise in Octane** anlegen (Name + die Bullet-Liste in den Steps).

---

## Suite: AUTH – ADMIN

### TC-ADMIN-001 – Erfolgreicher Login als ADMIN

- Öffne die Login-Seite.  
- Gib einen gültigen ADMIN-Benutzernamen ein.  
- Gib das korrekte Passwort ein.  
- Klicke auf „Login“.  
- ? Login ist erfolgreich, es erscheint keine Fehlermeldung.  
- ? Der Benutzer wird auf die Startseite / das Dashboard weitergeleitet.  
- ? Im UI ist erkennbar, dass der Benutzer als ADMIN angemeldet ist (z. B. Name/Rolle im Header).  

---

### TC-ADMIN-002 – Login-Validierung (falsches Passwort)

- Öffne die Login-Seite.  
- Gib einen gültigen ADMIN-Benutzernamen ein.  
- Gib ein **falsches** Passwort ein.  
- Klicke auf „Login“.  
- ? Login schlägt fehl.  
- ? Eine verständliche Fehlermeldung wird angezeigt (z. B. „Benutzername oder Passwort ungültig“).  
- ? Es erfolgt kein Redirect auf eine geschützte Seite.  

---

### TC-ADMIN-003 – Session Timeout / Inaktivität

- Logge dich als ADMIN ein.  
- Navigiere auf eine geschützte Seite (z. B. API-Key-Übersicht).  
- Lasse die Session länger als die konfigurierte Timeout-Dauer inaktiv.  
- Versuche, eine weitere geschützte Seite aufzurufen (z. B. erneute Navigation im Menü).  
- ? Die Session ist abgelaufen.  
- ? Du wirst zur Login-Seite umgeleitet oder musst dich neu authentifizieren.  

---

### TC-ADMIN-004 – Logout-Funktion

- Logge dich als ADMIN ein.  
- Navigiere auf eine geschützte Seite.  
- Klicke im UI auf „Logout“ bzw. das Abmelde-Icon.  
- Versuche, über den Browser-Zurück-Button auf die vorherige geschützte Seite zurückzugehen.  
- ? Nach dem Logout wirst du auf eine öffentliche Seite (z. B. Login) weitergeleitet.  
- ? Ein Zugriff auf geschützte Seiten ist nur nach erneutem Login möglich.  

---

### TC-ADMIN-010 – Kein „Forbidden“ für ADMIN bei ADMIN-Features

- Logge dich als ADMIN ein.  
- Navigiere direkt zum Pricing-Management-Bereich.  
- Öffne weitere typische ADMIN-Seiten (z. B. globale Konfiguration, Topic-Übersichten – sofern vorhanden).  
- ? Alle ADMIN-Seiten werden ohne 403/„Forbidden“-Fehler geladen.  
- ? Es erscheinen keine „Zugriff verweigert“-Meldungen für ADMIN-Funktionalitäten.  

---

### TC-ADMIN-020 – API-Key-Übersichtsseite aufrufen

- Logge dich als ADMIN ein.  
- Navigiere zum Bereich „API Keys“.  
- ? Die API-Key-Übersichtsseite lädt ohne Fehler.  
- ? Eine Liste vorhandener API Keys wird angezeigt.  
- ? Metadaten wie Name, Status und Erstellungsdatum sind sichtbar.  
- ? Optionen zum Erstellen, Löschen oder Deaktivieren von Keys sind sichtbar.  

---

### TC-ADMIN-021 – API-Key erstellen

- Logge dich als ADMIN ein.  
- Navigiere zum Bereich „API Keys“.  
- Klicke auf „Neuen API Key erstellen“.  
- Fülle alle Pflichtfelder aus (z. B. Name, Gültigkeit, Scopes).  
- Klicke auf „Speichern/Erstellen“.  
- ? Eine Erfolgsnachricht wird angezeigt.  
- ? Der neue API Key erscheint in der Übersicht.  

---

### TC-ADMIN-022 – Validierung beim API-Key-Erstellen (leere Pflichtfelder)

- Logge dich als ADMIN ein.  
- Navigiere zum Bereich „API Keys“.  
- Klicke auf „Neuen API Key erstellen“.  
- Lasse mindestens ein Pflichtfeld leer oder gib einen ungültigen Wert ein.  
- Klicke auf „Speichern/Erstellen“.  
- ? Der API Key wird **nicht** angelegt.  
- ? Eine Fehlermeldung markiert die betroffenen Felder eindeutig.  

---

### TC-ADMIN-023 – API-Key deaktivieren / reaktivieren

- Logge dich als ADMIN ein.  
- Navigiere zur API-Key-Übersicht.  
- Wähle einen aktiven API Key aus.  
- Klicke auf „Deaktivieren“ und bestätige den Dialog (falls vorhanden).  
- ? Der Status des Keys ändert sich auf „deaktiviert“ / „inaktiv“.  
- (Optional) Aktiviere denselben Key wieder über die entsprechende Aktion.  
- ? Der Status wechselt wieder auf „aktiv“.  

---

### TC-ADMIN-024 – API-Key löschen

- Logge dich als ADMIN ein.  
- Navigiere zur API-Key-Übersicht.  
- Wähle einen API Key aus.  
- Klicke auf „Löschen“ und bestätige den Dialog.  
- ? Der API Key verschwindet aus der Übersicht.  
- ? Ein Zugriff über diesen Key ist nach der Löschung nicht mehr möglich (falls mit API-Call testbar).  

---

### TC-ADMIN-030 – Zugriff auf Pricing-Management

- Logge dich als ADMIN ein.  
- Öffne die Hauptnavigation.  
- Klicke auf „Pricing Management“.  
- ? Die Pricing-Management-Seite wird ohne Fehler geladen.  
- ? Eine Liste der existierenden Pricing-Pläne/Tiers ist sichtbar.  

---

### TC-ADMIN-031 – Pricing-Plan erstellen

- Logge dich als ADMIN ein.  
- Navigiere zum „Pricing Management“.  
- Klicke auf „Neuen Plan erstellen“.  
- Fülle alle Pflichtfelder aus (Name, Preis, Limits, Währung, …).  
- Klicke auf „Speichern“.  
- ? Ein neuer Pricing-Plan wird in der Übersicht angezeigt.  

---

## Suite: AUTH – USER

### TC-USER-001 – Erfolgreicher Login als USER

- Öffne die Login-Seite.  
- Gib einen gültigen USER-Benutzernamen ein.  
- Gib das korrekte Passwort ein.  
- Klicke auf „Login“.  
- ? Login ist erfolgreich, es erscheint keine Fehlermeldung.  
- ? Landing Page wird ohne ADMIN-spezifische Funktionen angezeigt (z. B. kein Pricing-Management-Menü).  
- ? Im UI ist erkennbar, dass der Benutzer als USER angemeldet ist.  

---

### TC-USER-004 – Logout als USER

- Logge dich als USER ein.  
- Navigiere auf eine geschützte Seite (z. B. eigene API-Key-Übersicht).  
- Klicke im UI auf „Logout“.  
- Versuche, über den Browser-Zurück-Button auf die vorherige Seite zu gehen.  
- ? Nach dem Logout bist du auf einer öffentlichen Seite (z. B. Login).  
- ? Auf geschützte Seiten kann erst nach erneutem Login zugegriffen werden.  

---

### TC-USER-010 – Zugriff auf USER-Bereiche

- Logge dich als USER ein.  
- Navigiere zu allen für USER vorgesehenen Bereichen (z. B. eigene API Keys, Profilseite).  
- ? Alle USER-Bereiche laden ohne „Forbidden“ / 403-Fehler.  
- ? Es werden nur Features angezeigt, die für die Rolle USER erlaubt sind.  

---

### TC-USER-011 – Verbotener Zugriff auf Pricing-Management

- Logge dich als USER ein.  
- Öffne die Navigation und suche nach dem Eintrag „Pricing Management“.  
- ? Der Menüpunkt ist nicht sichtbar **oder** klar deaktiviert.  
- Rufe die URL des Pricing-Managements direkt im Browser auf.  
- ? Der Zugriff wird verweigert (403 / „Access denied“ oder „Nicht autorisiert“-Seite).  

---

### TC-USER-020 – API-Key-Übersicht für USER

- Logge dich als USER ein.  
- Navigiere zum Bereich „API Keys“.  
- ? Die API-Key-Übersichtsseite lädt ohne Fehler.  
- ? Es werden nur API Keys angezeigt, die dem Benutzer bzw. seinem Tenant zugeordnet sind.  
- ? Funktionen können gegenüber ADMIN eingeschränkt sein (z. B. nur Anzeigen, kein globales Löschen).  

---

### TC-USER-022 – Versuch, fremde API-Keys aufzurufen

- Logge dich als USER ein.  
- Beschaffe/kenne die URL eines API Keys, der einem anderen Benutzer/Tenant gehört.  
- Rufe diese Detail-URL im Browser auf.  
- ? Der Zugriff wird verweigert (403, „Not allowed“ oder „Nicht autorisiert“-Seite).  
- ? Es werden keine sensiblen Daten dieses fremden API Keys angezeigt.  

---

## Suite: AUTH – TECHNICAL

### TC-TECH-001 – Erfolgreicher Login als TECHNICAL

- Öffne die Login-Seite.  
- Gib einen gültigen TECHNICAL-Benutzernamen ein.  
- Gib das korrekte Passwort ein.  
- Klicke auf „Login“.  
- ? Login ist erfolgreich.  
- ? Landing Page kann eine technische Sicht (z. B. API-/Monitoring-Bereich) sein.  
- ? Im UI ist erkennbar, dass der Benutzer als TECHNICAL angemeldet ist.  

---

### TC-TECH-010 – Zugriff auf technische Seiten

- Logge dich als TECHNICAL ein.  
- Navigiere zu den vorgesehenen technischen Seiten (z. B. Logs/Monitoring/Detailansichten für Pipelines, falls vorhanden).  
- ? Alle vorgesehenen technischen Seiten laden ohne 403/„Forbidden“.  
- ? Die Inhalte entsprechen den Erwartungen für eine technische Rolle (mehr Details als USER, aber keine vollständige ADMIN-Kontrolle).  

---

### TC-TECH-011 – Kein Zugriff auf ADMIN-exklusive Bereiche (z. B. Pricing)

- Logge dich als TECHNICAL ein.  
- Prüfe die Navigation auf den Eintrag „Pricing Management“.  
- ? Der Eintrag ist nicht sichtbar oder deaktiviert.  
- Rufe die URL des Pricing-Managements direkt im Browser auf.  
- ? Der Zugriff wird verweigert (403 / „Access denied“ oder „Nicht autorisiert“-Seite).  

---

### TC-TECH-020 – API-Key-Übersicht TECHNICAL

- Logge dich als TECHNICAL ein.  
- Navigiere zum Bereich „API Keys“.  
- ? Relevante API Keys werden angezeigt (z. B. für technische Integrationen).  
- ? Bestimmte ADMIN-only-Aktionen (z. B. globale Löschungen) sind nicht verfügbar.  

---

### TC-TECH-021 – API-Key mit technischen Optionen erstellen

- Logge dich als TECHNICAL ein.  
- Navigiere zum Bereich „API Keys“.  
- Klicke auf „Neuen API Key erstellen“.  
- Fülle Pflichtfelder aus und setze technische Optionen (z. B. IP-Whitelist, Rate Limits), falls vorhanden.  
- Klicke auf „Speichern“.  
- ? Ein neuer API Key wird mit den konfigurierten technischen Optionen erstellt.  
- ? Der Key erscheint in der Übersicht mit den korrekten Metadaten.  

---

## Suite: AUTH – GUEST/UNAUTH

### TC-GUEST-001 – Start-/Landing-Page ohne Login

- Öffne die Anwendung im Browser **ohne** vorherigen Login (neuer Browser/Inkognito-Tab).  
- ? Die öffentliche Start-/Landing-Page wird geladen.  
- ? Es werden nur öffentliche Informationen angezeigt (z. B. Marketing-/Info-Text).  
- ? Es erscheint keine Fehlermeldung 401/403.  

---

### TC-GUEST-010 – API-Key-Seite ohne Login

- Öffne einen neuen Browser/Inkognito-Tab ohne Session.  
- Gib die URL der API-Key-Übersichtsseite direkt in die Adresszeile ein.  
- ? Es werden keine API Keys oder sensiblen Daten angezeigt.  
- ? Du wirst zur Login-Seite oder zu einer „Nicht autorisiert“-Seite umgeleitet.  

---

### TC-GUEST-011 – Pricing-Management ohne Login

- Öffne einen neuen Browser/Inkognito-Tab ohne Session.  
- Gib die URL der Pricing-Management-Seite direkt ein.  
- ? Der Zugriff wird verweigert (Redirect zu Login oder „Nicht autorisiert“-Seite).  
- ? Es werden keine Pricing-Konfigurationen oder internen Informationen angezeigt.  

---

### TC-GUEST-020 – Manipulation von Rollen-Cookies/Token (High-Level)

- Öffne die Anwendung und inspiziere im Browser die gespeicherten Cookies/Token (z. B. DevTools).  
- Manipuliere testweise ein Token/Cookie clientseitig so, als ob du eine höhere Rolle (ADMIN/TECHNICAL) hättest.  
- Rufe eine geschützte ADMIN-Seite (z. B. Pricing-Management) auf.  
- ? Der Server validiert das Token korrekt.  
- ? Kein unautorisierter Zugriff auf ADMIN-Bereiche ist möglich, trotz manipulierter Client-Daten.  

---

### TC-GUEST-030 – Konsistente „Nicht autorisiert“-Seite

- Versuche ohne Login, eine beliebige geschützte URL aufzurufen (z. B. API-Key-Übersicht oder Pricing-Management).  
- ? Du siehst eine konsistente „Nicht autorisiert“- oder Fehlerseite.  
- ? Die Seite bietet eine klare Aktion (z. B. „Jetzt einloggen“-Button).  

