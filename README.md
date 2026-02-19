# MobaRAG API Key Generator

Ein Vue.js-basiertes Frontend für die Verwaltung von API-Keys mit Mock-API-Server für Entwicklung und Testing.

## 📋 Inhaltsverzeichnis

- [Voraussetzungen](#voraussetzungen)
- [Installation](#installation)
- [Schnellstart](#schnellstart)
- [Verfügbare Scripts](#verfügbare-scripts)
- [Projektstruktur](#projektstruktur)
- [Entwicklung](#entwicklung)
- [Datenbank](#datenbank)
- [API-Generierung](#api-generierung)

## 🔧 Voraussetzungen

- **Node.js** >= 18.x
- **npm** oder **pnpm**
- **Git**

## 📦 Installation

```bash
# Repository klonen
git clone <repository-url>
cd api-key-generator

# Dependencies installieren
npm install
# oder
pnpm install

# Datenbank initialisieren
npm run db:setup
```

## 🚀 Schnellstart

### Entwicklung (Frontend + Backend)

```bash
# Startet Mock-API-Server und Frontend parallel
npm run dev:all
```

- **Mock-API:** http://localhost:5713
- **Frontend:** http://localhost:5173

### Nur Mock-API-Server

```bash
# Produktion
npm start

# Entwicklung (mit Watch-Mode)
npm run dev
```

### Nur Frontend

```bash
# Entwicklung
npm run frontend:dev

# Entwicklung ohne Debug-Mode
npm run frontend:dev:no-debug

# Build für Produktion
npm run frontend:build

# Preview des Builds
npm run frontend:preview
```

## 📜 Verfügbare Scripts

### Server-Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm start` | Startet den Mock-API-Server (Produktion) |
| `npm run dev` | Startet den Mock-API-Server mit Watch-Mode |

### Frontend-Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run frontend` | Startet Vite Dev-Server |
| `npm run frontend:dev` | Startet Vite Dev-Server (Alias) |
| `npm run frontend:dev:no-debug` | Startet ohne Debug-Mode |
| `npm run frontend:build` | Erstellt Production-Build |
| `npm run frontend:preview` | Preview des Production-Builds |

### Kombinierte Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run dev:all` | Startet Mock-API + Frontend parallel |
| `npm run dev:all:no-debug` | Wie oben, ohne Debug-Mode |
| `npm run dev:all:debug` | Wie oben, mit explizitem Debug-Mode |

### Datenbank-Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run db:init` | Initialisiert die SQLite-Datenbank |
| `npm run db:generate` | Generiert Mock-Daten |
| `npm run db:setup` | Führt beide DB-Scripts aus (init + generate) |

### Code-Qualität

| Script | Beschreibung |
|--------|--------------|
| `npm run lint` | Führt ESLint aus und behebt Fehler automatisch |
| `npm run format` | Formatiert Code mit Prettier |
| `npm run type-check` | Prüft TypeScript-Typen ohne Build |

### API-Generierung

| Script | Beschreibung |
|--------|--------------|
| `npm run api:generate` | Generiert API-Client aus OpenAPI-Spezifikation (Orval) |

## 📁 Projektstruktur

```
api-key-generator/
├── data/                    # Datenbank-Dateien
│   └── mock-data.db        # SQLite-Datenbank
│
├── docs/                    # Dokumentation
│   ├── assets/             # Asset-Dokumentation
│   ├── components/         # Komponenten-Dokumentation
│   ├── composables/        # Composable-Dokumentation
│   └── migration/          # Migrations-Dokumentation
│
├── public/                  # Statische Assets
│   └── ...
│
├── scripts/                 # Utility-Scripts
│   ├── db-helper.js        # Datenbank-Helper-Funktionen
│   ├── generate-mock-data.js # Mock-Daten-Generator
│   └── init-database.js    # Datenbank-Initialisierung
│
├── server/                  # Mock-API-Server
│   ├── mock-api.js         # Express-Server (Hauptdatei)
│   └── mock-data.js        # Mock-Daten-Definitionen
│
├── src/                     # Frontend-Quellcode
│   ├── api/                # Generierte API-Clients (Orval)
│   ├── assets/             # Frontend-Assets
│   ├── auth/               # Authentifizierung (Keycloak)
│   ├── axios/              # Axios-Konfiguration
│   ├── components/         # Vue-Komponenten
│   │   ├── admin/          # Admin-Komponenten
│   │   │   └── pricing/    # Preisverwaltung-Komponenten
│   │   ├── apikey/         # API-Key-Komponenten
│   │   ├── layout/         # Layout-Komponenten
│   │   └── usage/          # Usage-Komponenten
│   ├── composables/        # Vue Composables
│   ├── config/             # Konfigurationen
│   ├── router/             # Vue Router
│   ├── services/           # API-Services
│   ├── stores/             # Pinia Stores
│   ├── utils/              # Utility-Funktionen
│   └── views/              # Vue Views/Pages
│
├── .env.example            # Beispiel-Umgebungsvariablen
├── Dockerfile              # Docker-Container-Definition
├── index.html              # HTML-Entry-Point
├── nginx.conf              # Nginx-Konfiguration
├── openapi.yaml            # OpenAPI-Spezifikation
├── package.json            # npm-Dependencies & Scripts
├── tsconfig.json           # TypeScript-Konfiguration
└── vite.config.ts          # Vite-Konfiguration
```

### Wichtige Ordner erklärt

- **`server/`**: Mock-API-Server für Entwicklung und Testing
- **`src/`**: Frontend-Quellcode (Vue.js 3 + TypeScript)
- **`src/components/admin/pricing/`**: Preisverwaltung-Komponenten (aufgeteilt für bessere Wartbarkeit)
- **`data/`**: SQLite-Datenbank-Dateien
- **`docs/`**: Projekt-Dokumentation nach Kategorien organisiert
- **`scripts/`**: Utility-Scripts für Datenbank und Entwicklung
- **`public/`**: Statische Assets, die direkt serviert werden

## 💻 Entwicklung

### Entwicklungsumgebung einrichten

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Datenbank initialisieren:**
   ```bash
   npm run db:setup
   ```

3. **Umgebungsvariablen konfigurieren:**
   ```bash
   cp .env.example .env.local
   # Bearbeite .env.local nach Bedarf
   ```

4. **Entwicklung starten:**
   ```bash
   npm run dev:all
   ```

### Code-Qualität

- **Linting:** `npm run lint` - Behebt automatisch ESLint-Fehler
- **Formatting:** `npm run format` - Formatiert Code mit Prettier
- **Type-Checking:** `npm run type-check` - Prüft TypeScript-Typen

### Best Practices

- Verwende TypeScript für alle neuen Dateien
- Folge den ESLint-Regeln (werden automatisch beim Commit geprüft)
- Verwende Vue 3 Composition API mit `<script setup>`
- Dokumentiere komplexe Funktionen und Komponenten

## 🗄️ Datenbank

Das Projekt verwendet **SQLite** für Mock-Daten. Die Datenbank befindet sich in `data/mock-data.db`.

### Datenbank-Setup

```bash
# Datenbank initialisieren und Mock-Daten generieren
npm run db:setup

# Oder einzeln:
npm run db:init      # Erstellt Datenbank-Schema
npm run db:generate  # Generiert Mock-Daten
```

### Datenbank-Helper

Die Datenbank-Helper-Funktionen befinden sich in `scripts/db-helper.js` und werden vom Mock-API-Server verwendet.

## 🔌 API-Generierung

Das Projekt verwendet **Orval** zur Generierung von TypeScript-API-Clients aus der OpenAPI-Spezifikation.

### API-Client neu generieren

```bash
npm run api:generate
```

Die generierten Dateien befinden sich in `src/api/` und sollten **nicht manuell bearbeitet** werden.

### OpenAPI-Spezifikation

Die OpenAPI-Spezifikation befindet sich in `openapi.yaml` im Root-Verzeichnis.

## 🐳 Docker

Das Projekt kann mit Docker deployed werden:

```bash
# Build
docker build -t api-key-generator .

# Run
docker run -p 80:8080 api-key-generator
```

Die Docker-Konfiguration verwendet Nginx für das Frontend und erwartet, dass der Build bereits erstellt wurde (`npm run frontend:build`).

## 📚 Weitere Dokumentation

- **Komponenten:** `docs/components/`
- **Composables:** `docs/composables/`
- **Migration:** `docs/migration/`
- **Assets:** `docs/assets/`

## 📝 Lizenz

MIT License - siehe LICENSE-Datei für Details.

## 👤 Autor

Domenic Schumacher
