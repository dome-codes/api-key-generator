## Suite: AUTH – USER (UserRole.USER)

Format für Octane:

- Aktionen als normale Bullet-Points
- Erwartete Ergebnisse mit vorangestelltem `?`

---

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
- ? Der Menüpunkt ist nicht sichtbar oder klar deaktiviert.  
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

