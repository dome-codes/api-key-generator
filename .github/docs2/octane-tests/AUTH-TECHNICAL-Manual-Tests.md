## Suite: AUTH – TECHNICAL (UserRole.TECHNICAL)

Format für Octane:

- Aktionen als normale Bullet-Points
- Erwartete Ergebnisse mit vorangestelltem `?`

---

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

