# OpenText ALM Octane API Beispiel-App (Vue)

Hier ist eine schlanke Test-UI fuer **OpenText ALM Octane**, mit der du:

- Tickets ziehen (z. B. Defects / Work Items)
- Tickets erstellen (z. B. Defect per POST)
- API Header/Auth testen
- aus Ticket-Daten Branch-Namen nach Pattern ableiten kannst

## Ort

`api-key-generator/docs/octane`

## Start

1. `index.html` im Browser oeffnen
2. `Base URL`, `Shared Space`, `Workspace`, `Client ID`, `API Key` eintragen
3. Template-Button waehlen oder Endpoint/Methode manuell setzen
4. `Request senden` klicken

Optional per lokalem Server:

- `cd /Users/domenic.schumacher/Documents/deka/api-key-generator/docs/octane`
- `python3 -m http.server 8787`
- [http://localhost:8787](http://localhost:8787) aufrufen

## Features

- freie HTTP-Methode: `GET/POST/PUT/PATCH/DELETE`
- Octane Platzhalter im Endpoint: `{sharedSpace}`, `{workspace}`
- Auth-Modi:
  - `Basic (clientId:apiKey)`
  - `ALM-Client-Id` + `ALM-Api-Key`
  - `Bearer`
- Query-Parameter als JSON
- Request-Body als JSON
- Anzeige von Status, Dauer, Response-Headers und Response-Body
- Templates fuer:
  - Tickets ziehen (`defects`)
  - Ticket erstellen (`defects` POST)
  - Ticket by ID (`work_items/{id}`)
- Branch-Pattern Generator fuer GitLab (`{type}/{id}-{slug}`)
- Ausgabe fuer:
  - `git checkout -b "..."`
  - GitLab Branch Create Payload

## Hinweis

Wenn Octane CORS restriktiv konfiguriert ist, teste am besten ueber einen kleinen Backend-Proxy.

## Beispiele fuer Endpoints

- Defects listen:
  - `/api/shared_spaces/{sharedSpace}/workspaces/{workspace}/defects`
- Work Item per ID:
  - `/api/shared_spaces/{sharedSpace}/workspaces/{workspace}/work_items/{id}`
