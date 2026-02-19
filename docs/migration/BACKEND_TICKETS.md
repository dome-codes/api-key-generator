# Backend-Tickets (nicht im Frontend lösbar)

Diese Punkte erfordern Anpassungen an API, Auth-Middleware oder JWT/Rollen.

---

## 3.1 Endpoint `GET /v1/admin/apikeys`

- **Fehler:** Response `403 Forbidden`
- **Kontext:** Admins haben keinen Zugriff auf die Liste aller API-Keys
- **Prüfen:** JWT/Scopes (z. B. `canUseAdminFeatures`), Rollenzuweisung, Middleware für `/v1/admin/*`
- **Erwartung:** Berechtigte Admins erhalten `200` und die Liste aller API-Keys

---

## 3.2 Endpoint `GET /v1/admin/usage/ai/summarize`

- **Fehler:** Response `403 Forbidden`
- **Hinweis:** Der Aufruf `GET /v1/usage/ai/summarize?by=apikey` (User-Summarize) funktioniert; nur der Admin-Pfad liefert 403
- **Prüfen:** Rollen/Scopes für Admin-Usage, Path-Middleware (ob `/v1/admin/usage/*` strikter geschützt ist)
- **Erwartung:** Berechtigte Admins erhalten `200` und die globale AI-Summary
