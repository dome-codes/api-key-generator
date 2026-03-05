## Suite: AUTH – GUEST/UNAUTH (UserRole.NONE)

Format für Octane:

- Aktionen als normale Bullet-Points
- Erwartete Ergebnisse mit vorangestelltem `?`

---

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

