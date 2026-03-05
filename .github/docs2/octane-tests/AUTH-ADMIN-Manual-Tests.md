## Suite: AUTH – ADMIN (UserRole.ADMIN)

Format für Octane:

- Aktionen als normale Bullet-Points
- Erwartete Ergebnisse mit vorangestelltem `?`

> Hinweis zur späteren CSV-Generierung:  
> Jede Zeile ohne `?` = **Action**, jede Zeile mit `?` = **Expected**.  
> Pro Testcase kannst du diese Paare leicht in Spalten „Step Description“ / „Expected Result“ mappen.

---

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

