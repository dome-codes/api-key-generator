# Coder Dev-Container Onboarding & Setup Guide

> **Ein Befehl. Einheitliche Umgebung. Sofort produktiv.**

Das interaktive Setup-Skript `setup_dev_container.sh` automatisiert die Ersteinrichtung des Coder-Dev-Containers. Statt stundenlang Proxy, Git, Tools und Shell manuell zu konfigurieren, durchläuft jedes Teammitglied denselben geführten Prozess — reproduzierbar, nachvollziehbar und idempotent.

---

## Warum dieses Skript?

| Problem | Lösung durch das Setup-Skript |
|--------|-------------------------------|
| „Bei mir geht's, bei dir nicht" | Gleiche Basis-Konfiguration für alle |
| Vergessene Proxy-Einstellungen | Proxy für Session, `apt` und Shell persistent |
| Manuelle Git-Config in jedem Container | Identität wird einmal abgefragt und gespeichert |
| Unklarer Stand der Repositories | Auswahl & Sync in einem Schritt |
| Unterschiedliche Tool-Versionen | Optional einheitliche Runtimes (Node, Python, pnpm) |

> **Hinweis:** Das Skript ist für **Linux-Dev-Container** (Debian/Ubuntu mit `apt`) konzipiert. Ein Testlauf des Fragebogens ist auf macOS möglich; die Installation (`apt-get`) funktioniert nur im Container.

---

## Inhaltsverzeichnis

- [Quick Start](#quick-start) (inkl. **Setup-Dateien in der Confluence-Doku**)
- [Was du bereithalten solltest](#was-du-bereithalten-solltest)
- [Ablauf im Überblick](#ablauf-im-überblick)
- [Features & Automations-Schritte](#features--automations-schritte)
- [Installierte Tools & Dependencies](#installierte-tools--dependencies)
- [Git-Repositories](#git-repositories)
- [Terminal, MOTD & Aliase](#terminal-motd--aliase)
- [Konfigurationsdateien](#konfigurationsdateien)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Troubleshooting](#troubleshooting)
- [Skript erneut ausführen](#skript-erneut-ausführen)
- [Anhang: Setup-Dateien (Quelltext)](#anhang-setup-dateien-quelltext)

---

## Quick Start

### 1. Skripte in den Coder-Container kopieren

#### Setup-Dateien (Teil der Confluence-Doku)

> **Confluence:** Dieses README **und die Skripte** werden direkt in den Confluence-Artikel übernommen. Die **vollständigen Dateien** stehen im **[Anhang: Setup-Dateien (Quelltext)](#anhang-setup-dateien-quelltext)** — dort jeden Block als Code-Block oder Expand-Makro einfügen.

| Datei | Pflicht? | Im Anhang |
|-------|----------|-----------|
| `setup_dev_container.sh` | ✅ Ja | [→ Quelltext](#setup_dev_containersh) |
| `setup_dev_container.repos.conf` | ✅ Ja | [→ Quelltext](#setup_dev_containerreposconf) |
| `setup_dev_container.p10k.zsh` | Optional | [→ Quelltext](#setup_dev_containerp10kzsh-optional) |

Entwickler kopieren den Inhalt aus dem Anhang in Dateien im Container:

```bash
mkdir -p /workspace/setup
# Inhalt aus Confluence-Codeblock → Datei anlegen, z. B.:
#   setup_dev_container.sh
#   setup_dev_container.repos.conf
#   setup_dev_container.p10k.zsh   (optional)
chmod +x /workspace/setup/setup_dev_container.sh
```

Ziel im Container nach dem Kopieren:

```
/workspace/setup/
├── setup_dev_container.sh
├── setup_dev_container.repos.conf
└── setup_dev_container.p10k.zsh   (optional)
```

> **Hinweis:** Im Container liegen nur die **Skript-Dateien** unter `/workspace/setup/` — nicht der Confluence-Artikel selbst.

---

Das Setup läuft **im Dev-Container**. Die Skripte werden einmalig in den Container nach `/workspace/setup/` gebracht:

```bash
# Option A: Ordner manuell anlegen und Dateien reinkopieren (Coder UI / Drag & Drop)
mkdir -p /workspace/setup
# → setup_dev_container.sh, setup_dev_container.repos.conf nach /workspace/setup/
#    (optional: setup_dev_container.p10k.zsh)

# Option B: per scp vom lokalen Rechner
scp setup_dev_container.sh setup_dev_container.repos.conf user@coder-host:/workspace/setup/

# Option C: aus GitLab/GitHub klonen
git clone <url-zum-setup-repo> /workspace/setup

# Option D: Symlink statt Kopie (Setup liegt bereits in einem Repo unter repos/)
ln -sfn /workspace/repos/dev-tools/setup /workspace/setup
```

> **Symlink vs. Kopie:** Wenn die Skripte in einem Git-Repo unter `/workspace/repos/` liegen, reicht ein Symlink nach `/workspace/setup` — bei `git pull` im Quell-Repo sind die Skripte automatisch aktuell. Das Setup legt den Link ggf. selbst an.

### 2. Setup starten

```bash
cd /workspace/setup
chmod +x setup_dev_container.sh
./setup_dev_container.sh
```

Nach dem ersten Lauf steht der Befehl **`setup-dev-container`** global zur Verfügung (Symlink in `~/.local/bin/`).

### 3. Repositories

Das Skript legt automatisch **`/workspace/repos/`** an. Ausgewählte Git-Repositories werden dort **geklont** bzw. **gepullt**:

```
/workspace/
├── setup/                          ← Skripte (manuell kopiert)
│   ├── setup_dev_container.sh
│   ├── setup_dev_container.repos.conf
│   └── setup_dev_container.p10k.zsh   (optional)
└── repos/                          ← automatisch angelegt
    ├── mein-service/               ← git clone / pull
    └── frontend-app/
```

Optional anderer Repos-Pfad:

```bash
REPOS_DIR=/custom/path/repos ./setup_dev_container.sh
```

Nach erfolgreichem Setup:

```bash
exec zsh
```

> **Kein `p10k configure` nötig:** Das Skript installiert automatisch **Meslo Nerd Fonts** und kopiert das offizielle **P10k-Lean-Preset** (`nerdfont-complete`) nach `~/.p10k.zsh` — inkl. Ordner-Icons und Git-Symbolen in der Prompt-Zeile.

Falls Icons trotzdem fehlen: In Coder/VS Code prüfen, ob `terminal.integrated.fontFamily` auf `'MesloLGS NF'` steht (wird in `.vscode/settings.json` gesetzt, falls noch nicht vorhanden).

---

## Was du bereithalten solltest

| Information | Pflicht? | Beispiel |
|-------------|----------|----------|
| **Proxy-URL** | Im Coder-Cluster oft nötig | `http://internet-proxy.internet-proxy.svc.cluster.local:3128` |
| **Vollständiger Name** | Ja | `Max Mustermann` |
| **E-Mail-Adresse** | Ja | `max.mustermann@deka.de` |
| **E-Nummer *oder* B-Nummer** | Ja (eines von beiden) | `E12345` oder `B67890` |
| **Anzeigename** | Ja | `Max` |
| **Git-Zugang** | Für Repo-Sync | SSH-Key oder Token für GitLab |
| **Docker-Token** | Optional für Registry | JFrog/Artifactory Access Token |
| **cloudctl** | Für Cloud-Login | SSO-Zugang / bereits installierte CLI |

> **Tipp:** Du wirst gefragt, ob du eine **E-** oder **B-Nummer** hast — es wird nur **eine** der beiden abgefragt und in der Shell persistiert.

---

## Ablauf im Überblick

Das Skript arbeitet in **zwei Phasen**:

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1 · Fragebogen                                       │
│  ─────────────────────                                      │
│  Alle Eingaben sammeln → Zusammenfassung → Bestätigen       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2 · Installation (automatisch)                       │
│  ─────────────────────────────────────                      │
│  Proxy → System-Update → Git/Identität → Repos → Tools → Zsh│
└─────────────────────────────────────────────────────────────┘
```

Während des gesamten Laufs zeigt eine **Live-Roadmap** deine aktuelle Position:

```
  ┌─────────────────────────────────────────────────────────┐
  │  📍 CODER DEV-CONTAINER SETUP                              │
  │  Phase: Fragebogen · Gesamt 27%                         │
  ├─────────────────────────────────────────────────────────┤
  │  ── Fragebogen ────────────────────────────────────────│
  │    ✓  1. Proxy-Einstellungen                            │
  │  >>▶  2. Persönliche Daten                             │
  │    ○  3. Git-Repositories wählen                       │
  │  ── Installation ─────────────────────────────────────  │
  │    ○  5. Proxy anwenden                                 │
  │    ...                                                  │
  └─────────────────────────────────────────────────────────┘
```

Symbole: `▶` = aktueller Schritt · `✓` = erledigt · `○` = ausstehend

---

## Features & Automations-Schritte

### Phase 1 — Fragebogen

| # | Schritt | Beschreibung |
|---|---------|--------------|
| 1 | **Proxy** | Optional: Firmen-Proxy-URL erfassen |
| 2 | **Persönliche Daten** | Name, E-Mail, E-/B-Nummer, Anzeigename |
| 3 | **Git-Repositories** | Interaktive Mehrfachauswahl per Checkbox-Menü |
| 4 | **Optionale Tools** | NVM/Node.js, Python, pnpm — je nach Bedarf |
| 5 | **Docker & cloudctl** | Registry-Login (`docker login`) und `cloudctl login` |

Anschließend: **Zusammenfassung** aller Eingaben und Bestätigung vor Start der Installation.

---

### Phase 2 — Installation

#### Netzwerk & Proxy

Wenn ein Proxy konfiguriert wurde, richtet das Skript ihn **sofort und persistent** ein:

| Ebene | Was passiert |
|-------|--------------|
| **Aktuelle Session** | `http_proxy`, `https_proxy`, `no_proxy` werden exportiert |
| **APT** | `/etc/apt/apt.conf.d/95proxies` — Proxy für `apt-get` |
| **APT IPv4** | `/etc/apt/apt.conf.d/98force-ipv4` — `Acquire::ForceIPv4 "true"` (Cluster-Fix) |
| **Git** | `git config --global http.proxy` / `https.proxy` |
| **Neue Shells** | Proxy-Variablen in `~/.zshrc` |

> **Cluster-Hinweis:** Im Coder/K8s-Cluster erkennt das Skript den internen Proxy automatisch und schlägt  
> `http://internet-proxy.internet-proxy.svc.cluster.local:3128` als Standard vor.  
> **ForceIPv4** behebt typische apt-Fehler, wenn der Proxy nur über IPv4 erreichbar ist.

> **Warum zuerst?** Ohne Proxy schlagen `apt-get update`, `git clone` und `curl` (NVM) im Firmennetz oft still fehl. Der Proxy wird deshalb als erster Installationsschritt angewendet.

---

#### System-Updates

```bash
apt-get update && apt-get upgrade -y
```

Zusätzlich werden Basis-Tools installiert:

`ca-certificates` · `curl` · `git` · `wget` · `gnupg`

> **Warum?** Aktuelle Paketquellen und TLS-Zertifikate sind Voraussetzung für alle weiteren Installationsschritte.

---

#### Identitäts-Setup

| Einstellung | Ziel |
|-------------|------|
| `git config --global user.name` | Korrekte Commit-Autoren |
| `git config --global user.email` | GitLab-Integration & Hooks |
| `E_NUMBER` **oder** `B_NUMBER` | Container-weite Personalisierung |
| `DISPLAY_NAME` | Begrüßung & MOTD |

Alle Shell-Variablen werden in markierten Blöcken in `~/.zshrc` gespeichert und sind in jeder neuen Terminal-Session verfügbar.

---

#### Git-Repositories syncen

- **Auto-Discovery:** Findet bestehende Repos unter `/workspace/repos/`
- **Konfiguration:** Ergänzt Einträge aus `setup_dev_container.repos.conf`
- **Ordner:** `/workspace/repos/` wird bei Bedarf automatisch erstellt
- **Clone oder Pull:** Fehlende Repos werden geklont, vorhandene aktualisiert
- **Fortschritt:** Pro Repository mit Statusanzeige (Branch, ahead/behind)

**Repository-Auswahl im Fragebogen:**

```
  [x]  1  mein-service           main · aktuell
  [ ]  2  frontend-app           main · 3 hinter
  [x]  3  shared-lib             nicht geklont

  Steuerung: Nummer togglen · a=alle · n=keine · s=überspringen · Enter=OK
```

---

#### Optionale Tools & Terminal

Je nach Auswahl im Fragebogen, plus **immer**:

- **Zsh** als Standard-Shell
- **Powerlevel10k** als Theme

---

#### Docker & cloudctl Login

Nach Proxy und Tool-Installation (wenn im Fragebogen gewählt):

| Schritt | Beschreibung |
|---------|--------------|
| **🐳 Docker login** | `docker login` gegen die Firmen-Registry (Standard: `deka.jfrog.io`) |
| **☁️ cloudctl login** | Interaktiver Cloud-Login (SSO/Browser/Token) |

**Docker — zwei Modi:**

1. **Token im Fragebogen** → automatisch via `--password-stdin` (nicht in Logs)
2. **Ohne Token** → interaktiver `docker login` in Phase 2

Falls `docker` fehlt, wird `docker.io` per apt nachinstalliert.

> **Hinweis:** `cloudctl` muss im Container bereits vorinstalliert sein. Das Skript führt `cloudctl login` interaktiv aus — halte SSO/Token bereit.

---

## Installierte Tools & Dependencies

### Immer installiert / konfiguriert

| Tool | Zweck |
|------|-------|
| **Git** | Repository-Sync, Versionskontrolle |
| **Zsh** | Moderne, erweiterbare Shell |
| **Powerlevel10k** | Schnelles, informationsreiches Prompt-Theme |

### Optional (im Fragebogen wählbar)

| Tool | Warum wir das nutzen |
|------|----------------------|
| **NVM + Node.js** | Mehrere Node-Versionen pro Projekt wechseln, ohne System-Node zu verbiegen. Standard: `lts`. |
| **Python 3 + pip + venv** | Backend-Services, Skripte, ML/RAG-Pipelines im Python-Stack. |
| **pnpm** | Schneller Package Manager für Node-Monorepos — spart Disk & Zeit durch content-addressable Storage und hartes Linking. Benötigt Node.js. |

### Zsh, Powerlevel10k & Nerd Fonts

Das Setup installiert drei zusammengehörige Bausteine — **ohne interaktiven Wizard**:

| Baustein | Was passiert |
|----------|--------------|
| **Meslo Nerd Font** | Offizielle P10k-Empfehlung; 4 Schnitte nach `~/.local/share/fonts` |
| **P10k-Lean-Preset** | Offizielles Config aus dem P10k-Repo (`config/p10k-lean.zsh`) → `~/.p10k.zsh` |
| **Coder Terminal-Font** | `.vscode/settings.json` → `terminal.integrated.fontFamily: MesloLGS NF` |

**Warum Meslo Nerd Font?**

Powerlevel10k zeigt Ordner (`📁`), Git-Branch (`🔀`) und Status-Icons direkt in der Prompt — dafür braucht das Terminal eine **Nerd Font**. Ohne sie siehst du Kästchen statt Icons.

**Warum P10k-Lean wiederverwenden?**

Das ist dasselbe Preset, das `p10k configure` erzeugen würde — nur ohne interaktive Auswahl. Es setzt u.a.:

```zsh
typeset -g POWERLEVEL9K_MODE=nerdfont-complete
```

Team-eigenes Layout? Datei `setup_dev_container.p10k.zsh` neben dem Skript ablegen — sie überschreibt das Lean-Preset.

> **Optional:** Später mit `p10k configure` anpassen — erzeugt eine neue `~/.p10k.zsh` auf Basis deiner Wahl.

### K9s — Kubernetes-Terminal-UI

**K9s** ist *nicht* Teil des Setup-Skripts, gehört aber zum typischen Coder-Workflow:

| Vorteil | Beschreibung |
|---------|--------------|
| **Cluster-Übersicht** | Pods, Deployments, Services in einer TUI |
| **Schnelle Fehlersuche** | Logs und Events ohne endlose `kubectl`-Ketten |
| **Ressourcen-Monitoring** | CPU/RAM live pro Pod |

Manuelle Installation im Container:

```bash
# Beispiel (Version anpassen)
curl -sL https://github.com/derailed/k9s/releases/latest/download/k9s_Linux_amd64.tar.gz \
  | tar xz -C /tmp && sudo mv /tmp/k9s /usr/local/bin/
```

> **Empfehlung fürs Team:** K9s ins Container-Image oder als optionalen Setup-Schritt aufnehmen, wenn alle im Kubernetes-Cluster arbeiten.

---

## Git-Repositories

### Konfiguration: `setup_dev_container.repos.conf`

```ini
# Format: NAME|GIT_URL|ZIELPFAD (optional, Standard: /workspace/repos/NAME)
mein-service|https://gitlab.company.com/team/mein-service.git
frontend-app|https://gitlab.company.com/team/frontend-app.git
shared-lib|git@gitlab.company.com:team/shared-lib.git
```

| Spalte | Beschreibung |
|--------|--------------|
| `NAME` | Anzeigename im Auswahlmenü |
| `GIT_URL` | Clone-URL (HTTPS oder SSH) |
| `ZIELPFAD` | Optional; Standard: `/workspace/repos/$NAME` |

### Post-Setup: Dependencies installieren

Das Skript **klont/pullt** Repositories — ein automatischer Build danach ist **noch nicht** im Skript enthalten. Das ist der empfohlene **manuelle Folgeschritt** je nach Tech-Stack:

```bash
# Node / Frontend
cd mein-projekt && pnpm install

# Java / Gradle
cd mein-service && ./gradlew build

# Python
cd mein-projekt && pip install -r requirements.txt
```

> **Roadmap-Idee:** Post-Clone-Hooks pro Repository in `setup_dev_container.repos.conf` (z. B. `NAME|URL|PATH|pnpm install`) — aktuell noch nicht implementiert.

---

## Terminal, MOTD & Aliase

### Message of the Day (MOTD)

Beim **ersten interaktiven Zsh-Start** erscheint eine personalisierte Begrüßung:

```
👋 Willkommen, Max! Dein Coder-Dev-Container ist bereit.
✍️  Setup-Skript by Domenic Schumacher — bei Fragen gerne melden.
```

Technisch: Block `setup_dev_container: greeting` in `~/.zshrc` — nutzt `$DISPLAY_NAME` und zeigt die Meldung pro Session einmal an.

### Persistierte Identitäts-Variablen

```bash
echo $DISPLAY_NAME    # Anzeigename
echo $E_NUMBER        # oder $B_NUMBER — je nach Auswahl
```

### Aliase

Das Setup-Skript schreibt **keine projektspezifischen Aliase** automatisch in die `~/.zshrc`. Typische Ergänzungen, die Teams manuell oder per Container-Image pflegen:

```bash
# ~/.zshrc — Beispiele
alias ll='ls -lah'
alias k='kubectl'
alias k9='k9s'
alias gs='git status'
alias gp='git pull --ff-only'
```

> **Tipp:** Aliase in einem separaten Block `# setup_dev_container: aliases` pflegen — erleichtert Updates bei erneutem Setup-Lauf.

Powerlevel10k zeigt Git-Status bereits in der Prompt — `gs` bleibt trotzdem praktisch für detaillierte Ausgabe.

---

## Konfigurationsdateien

> Die **Setup-Dateien** mit vollständigem Quelltext stehen im **[Anhang](#anhang-setup-dateien-quelltext)**.

| Datei | Zweck |
|-------|-------|
| `setup_dev_container.sh` | Hauptskript (Wizard + Installation) |
| `setup_dev_container.repos.conf` | Repository-Liste für Clone/Sync |
| `setup_dev_container.p10k.zsh` | Optional: eigenes P10k-Theme (sonst Lean-Preset) |
| `~/.p10k.zsh` | Aktives Powerlevel10k-Config (auto-generiert) |
| `~/.local/share/fonts/MesloLGS NF *.ttf` | Nerd Fonts für Icons |
| `.vscode/settings.json` | Coder-Terminal-Font |
| `~/.zshrc` | Proxy, Identität, NVM, P10k, MOTD |
| `/etc/apt/apt.conf.d/95proxies` | APT-Proxy (wenn konfiguriert) |
| `/etc/apt/apt.conf.d/98force-ipv4` | APT ForceIPv4 (Cluster) |

### Idempotenz

Das Skript kann **mehrfach** ausgeführt werden:

- `~/.zshrc`-Blöcke werden anhand von Markern (`# setup_dev_container: …`) ersetzt, nicht dupliziert
- Bereits installierte Tools werden erkannt und übersprungen
- Git-Repos werden erneut gepullt, nicht doppelt geklont

---

## Umgebungsvariablen

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `REPOS_DIR` | `/workspace/repos` | Zielordner für alle Git-Repositories |
| `WORKSPACE_ROOT` | `/workspace` | Container-Workspace-Root |
| `WORKSPACE_DIR` | *(deprecated)* | Alias für `REPOS_DIR` (Abwärtskompatibilität) |
| `NO_PROXY` | `localhost,127.0.0.1,::1,.svc.cluster.local,.cluster.local` | Bypass-Liste für Proxy |

Beispiel:

```bash
export REPOS_DIR=/workspace/repos
cd /workspace/setup && ./setup_dev_container.sh
```

---

## Troubleshooting

### Prompt erscheint nicht / Skript „hängt"

**Ursache:** Eingabeaufforderungen laufen über stderr — bei Umleitung von stdout kann es so wirken, als ob nichts passiert.

**Lösung:** Skript **interaktiv** im Terminal starten, nicht per Pipe.

---

### `${answer,,}: bad substitution` (macOS)

**Ursache:** macOS liefert Bash 3.2.

**Lösung:** Aktuelle Skriptversion nutzen (portable `tolower()`-Funktion). Vollständige Installation nur im Linux-Container.

---

### `apt-get: command not found`

**Ursache:** Skript außerhalb eines Debian/Ubuntu-Containers gestartet.

**Lösung:** Im Coder-Dev-Container ausführen.

---

### Git Clone/Pull schlägt fehl

| Prüfung | Aktion |
|---------|--------|
| Proxy korrekt? | Im Fragebogen `j` + URL prüfen |
| SSH-Key / Token? | `ssh -T git@gitlab.company.com` testen |
| URL in `repos.conf`? | GitLab-URL mit Team abgleichen |

---

### pnpm-Installation übersprungen

pnpm benötigt **Node.js**. Im Fragebogen zuerst **NVM & Node.js** wählen, dann pnpm.

---

## Skript erneut ausführen

```bash
./setup_dev_container.sh
```

Einstellungen können jederzeit angepasst werden — bestehende Blöcke in `~/.zshrc` werden aktualisiert.

Konfiguration manuell prüfen:

```bash
git config --global --list
grep -A5 'setup_dev_container' ~/.zshrc
```

---

## Dateistruktur im Container

```
/workspace/
├── setup/                              # Skripte (einmalig reinkopieren)
│   ├── setup_dev_container.sh
│   ├── setup_dev_container.repos.conf
│   └── setup_dev_container.p10k.zsh   (optional)
├── repos/                              # automatisch angelegt
│   ├── mein-service/                   # Git-Repos
│   └── frontend-app/
└── .vscode/
    └── settings.json                   # Terminal-Font (Meslo)
```

Nach dem Setup in der Shell verfügbar: `$REPOS_DIR`, `$WORKSPACE_ROOT`, Befehl `setup-dev-container`

### Symlinks im Überblick

| Link | Ziel | Zweck |
|------|------|--------|
| `~/.local/bin/setup-dev-container` | `setup_dev_container.sh` | Setup jederzeit neu starten |
| `/workspace/setup` → Quellordner | optional | Einheitlicher Pfad, kein Kopieren |

---

## Anhang: Setup-Dateien (Quelltext)

> **Confluence:** Die folgenden Abschnitte enthalten die **vollständigen Dateien**. Beim Übernehmen in Confluence jeden Block als eigenen Code-Block oder Expand-Makro einfügen. Entwickler kopieren den Inhalt nach `/workspace/setup/`.

| Abschnitt | Dateiname | Pflicht? |
|-----------|-----------|----------|
| [setup_dev_container.sh](#setup_dev_containersh) | `setup_dev_container.sh` | ✅ Ja |
| [setup_dev_container.repos.conf](#setup_dev_containerreposconf) | `setup_dev_container.repos.conf` | ✅ Ja |
| [setup_dev_container.p10k.zsh](#setup_dev_containerp10kzsh-optional) | `setup_dev_container.p10k.zsh` | Optional |

### setup_dev_container.sh

Hauptskript — nach `/workspace/setup/setup_dev_container.sh` kopieren, dann `chmod +x`.

```bash
#!/usr/bin/env bash
# setup_dev_container.sh – Interaktive Einrichtung eines Coder-Dev-Containers
# Autor: Domenic Schumacher — bei Fragen gerne melden
# Phase 1: Fragebogen (alle Eingaben sammeln)
# Phase 2: Installation (automatisch ausführen)
# Idempotent: kann gefahrlos mehrfach ausgeführt werden.

set -uo pipefail

# ---------------------------------------------------------------------------
# Pfade & Konstanten
# ---------------------------------------------------------------------------
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ZSHRC="${HOME}/.zshrc"
readonly SETUP_MARKER="setup_dev_container"
readonly REPOS_CONF="${SCRIPT_DIR}/setup_dev_container.repos.conf"
readonly SETUP_AUTHOR="Domenic Schumacher"

# Container-Layout: Skripte nach /workspace/setup kopieren, Repos nach /workspace/repos
readonly WORKSPACE_ROOT="${WORKSPACE_ROOT:-/workspace}"
readonly DEFAULT_SETUP_DIR="${WORKSPACE_ROOT}/setup"
readonly DEFAULT_REPOS_DIR="${WORKSPACE_ROOT}/repos"
# REPOS_DIR = Zielordner für alle Git-Repositories (wird automatisch angelegt)
readonly REPOS_DIR="${REPOS_DIR:-${WORKSPACE_DIR:-$DEFAULT_REPOS_DIR}"

# Standard-Proxy im Coder/K8s-Cluster (Ubuntu)
readonly DEFAULT_CLUSTER_PROXY="http://internet-proxy.internet-proxy.svc.cluster.local:3128"
readonly DEFAULT_NO_PROXY="localhost,127.0.0.1,::1,.svc.cluster.local,.cluster.local"
readonly DEFAULT_DOCKER_REGISTRY="deka.jfrog.io"

# Roadmap: alle Schritte im Skript
readonly -a ROADMAP_KEYS=(
  "q_proxy" "q_personal" "q_repos" "q_tools" "q_logins"
  "e_proxy" "e_system" "e_personal" "e_repos" "e_tools" "e_logins" "e_terminal" "e_done"
)
readonly -a ROADMAP_LABELS=(
  "Proxy-Einstellungen"
  "Persönliche Daten"
  "Git-Repositories wählen"
  "Optionale Tools wählen"
  "Docker & cloudctl Login"
  "Proxy anwenden"
  "System-Update"
  "Git & Identität setzen"
  "Repositories syncen"
  "Tools installieren"
  "Docker & cloudctl Login"
  "Terminal einrichten"
  "Fertig"
)
readonly -a ROADMAP_ICONS=(
  "🌐" "👤" "📁" "🛠️" "🔐"
  "🌐" "🔄" "🔑" "🔀" "⚙️" "🔐" "💻" "🎉"
)

# Tool- & UI-Icons
readonly ICON_NODE="⬢"
readonly ICON_PYTHON="🐍"
readonly ICON_PNPM="📦"
readonly ICON_GIT="🔀"
readonly ICON_FOLDER="📁"
readonly ICON_PATH="📂"
readonly ICON_ZSH="🐚"
readonly ICON_P10K="⚡"
readonly ICON_WORKSPACE="🗂️"
readonly ICON_APT="🐧"
readonly ICON_CLONE="📥"
readonly ICON_PULL="⬇️"
readonly ICON_SHELL="🖥️"
readonly ICON_DOCKER="🐳"
readonly ICON_CLOUD="☁️"

CURRENT_ROADMAP_KEY=""

# Gesammelte Konfiguration (Phase 1)
CFG_USE_PROXY=false
CFG_PROXY_URL=""
CFG_USER_NAME=""
CFG_USER_EMAIL=""
CFG_E_NUMBER=""
CFG_B_NUMBER=""
CFG_NUMBER_TYPE=""
CFG_DISPLAY_NAME=""
CFG_INSTALL_NVM=false
CFG_NODE_VERSION="lts"
CFG_INSTALL_PYTHON=false
CFG_INSTALL_PNPM=false
CFG_SYNC_REPOS=false
CFG_DOCKER_LOGIN=false
CFG_DOCKER_REGISTRY=""
CFG_DOCKER_USER=""
CFG_DOCKER_TOKEN=""
CFG_CLOUDCTL_LOGIN=false

# ---------------------------------------------------------------------------
# Farben & Logging
# ---------------------------------------------------------------------------
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly BOLD='\033[1m'
readonly DIM='\033[2m'
readonly NC='\033[0m'

log_question() { echo -e "${BLUE}❓ $1${NC}" >&2; }
log_success()  { echo -e "${GREEN}✅ $1${NC}" >&2; }
log_error()    { echo -e "${RED}❌ $1${NC}" >&2; }
log_info()     { echo -e "${YELLOW}💡 $1${NC}" >&2; }
log_step()     { echo -e "${CYAN}${BOLD}▶ $1${NC}" >&2; }

# ---------------------------------------------------------------------------
# Sudo-Erkennung
# ---------------------------------------------------------------------------
if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
  if ! command -v sudo &>/dev/null; then
    log_error "Nicht als root ausgeführt und 'sudo' ist nicht verfügbar."
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Roadmap – zeigt jederzeit die Position im Gesamtskript
# ---------------------------------------------------------------------------
show_roadmap() {
  local active_key="${1:-$CURRENT_ROADMAP_KEY}"
  local phase_name="Fragebogen"
  [[ "$active_key" == e_* ]] && phase_name="Installation"

  local active_idx=-1 idx=0
  for key in "${ROADMAP_KEYS[@]}"; do
    [[ "$key" == "$active_key" ]] && active_idx=$idx
    idx=$((idx + 1))
  done

  local overall_pct=0
  [[ "$active_idx" -ge 0 ]] && overall_pct=$(( (active_idx + 1) * 100 / ${#ROADMAP_KEYS[@]} ))

  echo ""
  echo -e "${CYAN}${BOLD}  ┌─────────────────────────────────────────────────────────┐${NC}"
  echo -e "${CYAN}${BOLD}  │  📍 CODER DEV-CONTAINER SETUP                              │${NC}"
  printf "${CYAN}${BOLD}  │  %-57s│${NC}\n" "Phase: ${phase_name} · Gesamt ${overall_pct}%"
  echo -e "${CYAN}${BOLD}  ├─────────────────────────────────────────────────────────┤${NC}"

  idx=0
  local section_printed=""
  for key in "${ROADMAP_KEYS[@]}"; do
    local label="${ROADMAP_LABELS[$idx]}"
    local step_icon="${ROADMAP_ICONS[$idx]}"
    local icon="○"
    local style="${DIM}"
    local marker="  "

    if [[ "$key" == q_* && "$section_printed" != "q" ]]; then
      echo -e "${DIM}  │  ── 📝 Fragebogen ───────────────────────────────────────${NC}${DIM}│${NC}"
      section_printed="q"
    elif [[ "$key" == e_* && "$section_printed" != "e" ]]; then
      echo -e "${DIM}  │  ── ⚙️  Installation ────────────────────────────────────${NC}${DIM}│${NC}"
      section_printed="e"
    fi

    if [[ "$key" == "$active_key" ]]; then
      icon="▶"
      style="${BOLD}${YELLOW}"
      marker=">>"
    elif [[ "$active_idx" -ge 0 && "$idx" -lt "$active_idx" ]]; then
      icon="✓"
      style="${GREEN}"
    fi

    printf "  ${style}│  ${marker}${icon} %2d. ${step_icon} %-43s${NC}${style}│${NC}\n" "$((idx + 1))" "$label"
    idx=$((idx + 1))
  done

  echo -e "${CYAN}${BOLD}  └─────────────────────────────────────────────────────────┘${NC}"
  echo ""
}

section_header() {
  local roadmap_key="$1"
  local title="$2"
  local subtitle="${3:-}"

  CURRENT_ROADMAP_KEY="$roadmap_key"
  show_roadmap "$roadmap_key"

  echo -e "${MAGENTA}${BOLD}  ── ${title} ──${NC}"
  [[ -n "$subtitle" ]] && echo -e "${DIM}  ${subtitle}${NC}"
  echo ""
}

draw_progress_bar() {
  local current="$1"
  local total="$2"
  local label="$3"
  local width=30
  local pct=0 filled=0 empty=0 bar="" i

  [[ "$total" -gt 0 ]] && pct=$(( current * 100 / total ))
  filled=$(( pct * width / 100 ))
  empty=$(( width - filled ))
  for ((i=0; i<filled; i++)); do bar+="▓"; done
  for ((i=0; i<empty; i++)); do bar+="░"; done

  printf "\r  ${CYAN}[%s]${NC} ${DIM}%3d%%${NC}  ${label}%-40s" "$bar" "$pct" ""
}

print_banner() {
  echo ""
  echo -e "${CYAN}${BOLD}"
  cat <<'BANNER'
  ╔═══════════════════════════════════════════════════════════╗
  ║   🚀  CODER DEV-CONTAINER SETUP WIZARD                     ║
  ║       Erst fragen · dann automatisch installieren         ║
  ╚═══════════════════════════════════════════════════════════╝
BANNER
  echo -e "${NC}"
  echo -e "${DIM}  📝 Phase 1: Alle Fragen beantworten${NC}"
  echo -e "${DIM}  ⚙️  Phase 2: Setup läuft automatisch durch${NC}"
  echo -e "${DIM}  ✍️  Setup-Skript by ${SETUP_AUTHOR} — bei Fragen gerne melden.${NC}"
  echo ""
}

# ---------------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------------
# Bash-3.2-kompatibel (macOS): kein ${var,,}
tolower() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

ask_yes_no() {
  local prompt="$1"
  local default="${2:-n}"
  local answer

  while true; do
    echo -ne "${BLUE}${prompt} (y/n) [${default}]: ${NC}" >&2
    read -r answer || true
    answer="${answer:-$default}"
    case "$(tolower "$answer")" in
      y|yes|j|ja) return 0 ;;
      n|no|nein) return 1 ;;
      *) log_error "Bitte 'y' oder 'n' eingeben." ;;
    esac
  done
}

ask_number_type() {
  local answer

  while true; do
    echo -ne "${BLUE}Hast du eine E-Nummer oder B-Nummer? (e/b): ${NC}" >&2
    read -r answer || true
    case "$(tolower "$answer")" in
      e|e-nummer|enummer) printf '%s' "e"; return 0 ;;
      b|b-nummer|bnummer) printf '%s' "b"; return 0 ;;
      *) log_error "Bitte 'e' oder 'b' eingeben." ;;
    esac
  done
}

ask_input() {
  local prompt="$1"
  local default="${2:-}"
  local required="${3:-true}"
  local value

  while true; do
    if [[ -n "$default" ]]; then
      echo -ne "${BLUE}${prompt} [${default}]: ${NC}" >&2
    else
      echo -ne "${BLUE}${prompt}: ${NC}" >&2
    fi
    read -r value || true
    value="${value:-$default}"

    if [[ "$required" == "false" ]] || [[ -n "$value" ]]; then
      printf '%s' "$value"
      return 0
    fi
    log_error "Eingabe darf nicht leer sein."
  done
}

# Passwort/Token ohne Echo (Docker Registry etc.)
ask_secret() {
  local prompt="$1"
  local secret

  while true; do
    echo -ne "${BLUE}${prompt}: ${NC}" >&2
    read -rs secret || true
    echo "" >&2
    [[ -n "$secret" ]] && { printf '%s' "$secret"; return 0; }
    log_error "Eingabe darf nicht leer sein."
  done
}

remove_zshrc_block() {
  local marker="$1"
  [[ -f "$ZSHRC" ]] || return 0
  sed -i.bak "/# ${marker}/,/# END ${marker}/d" "$ZSHRC" 2>/dev/null || \
    sed -i '' "/# ${marker}/,/# END ${marker}/d" "$ZSHRC" 2>/dev/null || true
  rm -f "${ZSHRC}.bak"
}

set_zshrc_block() {
  local marker="$1"
  local content="$2"
  touch "$ZSHRC"
  remove_zshrc_block "$marker"
  { echo ""; echo "# ${marker}"; echo "$content"; echo "# END ${marker}"; } >> "$ZSHRC"
}

run_apt() {
  export DEBIAN_FRONTEND=noninteractive
  $SUDO apt-get "$@"
}

detect_default_proxy_url() {
  if getent hosts internet-proxy.internet-proxy.svc.cluster.local &>/dev/null; then
    printf '%s' "$DEFAULT_CLUSTER_PROXY"
    return 0
  fi
  printf '%s' "http://proxy.company.com:8080"
}

write_apt_proxy_config() {
  local proxy_url="$1"

  # Wie manuell: /etc/apt/apt.conf.d/95proxies (+ ForceIPv4 für Cluster-Ubuntu)
  $SUDO tee /etc/apt/apt.conf.d/95proxies > /dev/null <<EOF
Acquire::http::Proxy "${proxy_url}";
Acquire::https::Proxy "${proxy_url}";
EOF

  $SUDO tee /etc/apt/apt.conf.d/98force-ipv4 > /dev/null <<'EOF'
Acquire::ForceIPv4 "true";
EOF

  # Alte Datei aus früheren Skript-Versionen entfernen
  $SUDO rm -f /etc/apt/apt.conf.d/99proxy
}

remove_apt_proxy_config() {
  $SUDO rm -f /etc/apt/apt.conf.d/95proxies /etc/apt/apt.conf.d/98force-ipv4 /etc/apt/apt.conf.d/99proxy
}

ensure_repos_directory() {
  if [[ -d "$REPOS_DIR" ]]; then
    log_info "${ICON_FOLDER} Repos-Ordner vorhanden: ${REPOS_DIR}"
    return 0
  fi
  log_info "${ICON_FOLDER} Lege Repos-Ordner an: ${REPOS_DIR}"
  mkdir -p "$REPOS_DIR"
  log_success "Repos-Ordner bereit — geklonte Repositories landen hier."
}

ensure_setup_hint() {
  if [[ "$SCRIPT_DIR" != "$DEFAULT_SETUP_DIR" && "$SCRIPT_DIR" != "/workspace/setup" ]]; then
    log_info "Skript liegt in: ${SCRIPT_DIR}"
    log_info "Empfohlen im Container: ${DEFAULT_SETUP_DIR}/ (Skripte dorthin kopieren)"
  fi
}

# ---------------------------------------------------------------------------
# Nerd Fonts & Powerlevel10k Preset (offizielles P10k-Lean + Meslo)
# ---------------------------------------------------------------------------
readonly MESLO_FONT_BASE="https://github.com/romkatv/powerlevel10k-media/raw/master"
readonly MESLO_FONT_DIR="${HOME}/.local/share/fonts"

install_meslo_nerd_fonts() {
  # Empfohlene Schrift laut https://github.com/romkatv/powerlevel10k/blob/master/font.md
  local -a font_files=(
    "MesloLGS NF Regular.ttf"
    "MesloLGS NF Bold.ttf"
    "MesloLGS NF Italic.ttf"
    "MesloLGS NF Bold Italic.ttf"
  )
  local -a font_urls=(
    "${MESLO_FONT_BASE}/MesloLGS%20NF%20Regular.ttf"
    "${MESLO_FONT_BASE}/MesloLGS%20NF%20Bold.ttf"
    "${MESLO_FONT_BASE}/MesloLGS%20NF%20Italic.ttf"
    "${MESLO_FONT_BASE}/MesloLGS%20NF%20Bold%20Italic.ttf"
  )
  local i dest

  command -v fc-cache &>/dev/null || run_apt install -y fontconfig

  mkdir -p "$MESLO_FONT_DIR"
  for i in "${!font_files[@]}"; do
    dest="${MESLO_FONT_DIR}/${font_files[$i]}"
    [[ -f "$dest" ]] && continue
    curl -fsSL "${font_urls[$i]}" -o "$dest"
  done

  fc-cache -fv "$MESLO_FONT_DIR" >/dev/null 2>&1 || fc-cache -fv >/dev/null 2>&1 || true
}

install_p10k_preset() {
  local p10k_dir="$1"
  local target="${HOME}/.p10k.zsh"
  local preset="${SCRIPT_DIR}/setup_dev_container.p10k.zsh"
  local upstream="${p10k_dir}/config/p10k-lean.zsh"

  # Offizielles P10k-Lean-Preset (nerdfont-complete, Ordner-Icons, Git-Segmente)
  if [[ -f "$preset" ]]; then
    cp "$preset" "$target"
  elif [[ -f "$upstream" ]]; then
    cp "$upstream" "$target"
  else
    log_error "Kein P10k-Preset gefunden – bitte p10k configure manuell ausführen."
    return 1
  fi
}

configure_coder_terminal_font() {
  local settings_dir="${WORKSPACE_ROOT}/.vscode"
  local settings_file="${settings_dir}/settings.json"

  mkdir -p "$settings_dir"

  if [[ -f "$settings_file" ]] && grep -q 'terminal.integrated.fontFamily' "$settings_file"; then
    log_info "Coder/VS Code Terminal-Font bereits konfiguriert."
    return 0
  fi

  if [[ ! -f "$settings_file" ]]; then
    cat > "$settings_file" <<'JSON'
{
  "terminal.integrated.fontFamily": "'MesloLGS NF', monospace",
  "terminal.integrated.fontSize": 13
}
JSON
    log_success "Coder/VS Code: Terminal-Font → MesloLGS NF"
    return 0
  fi

  log_info "Ergänze in ${settings_file}: \"terminal.integrated.fontFamily\": \"'MesloLGS NF', monospace\""
}

declare -a REPO_NAME=() REPO_PATH=() REPO_URL=() REPO_BRANCH=() REPO_STATUS=()
declare -a SELECTED_REPO_INDICES=() REPO_SELECTED=()

get_repo_git_status() {
  local repo_path="$1" do_fetch="${2:-false}"

  if [[ ! -d "${repo_path}/.git" ]]; then
    echo "nicht geklont"
    return
  fi

  local branch behind ahead
  branch="$(git -C "$repo_path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")"
  [[ "$do_fetch" == "true" ]] && git -C "$repo_path" fetch --quiet 2>/dev/null || true

  behind="$(git -C "$repo_path" rev-list --count "HEAD..@{upstream}" 2>/dev/null || echo "?")"
  ahead="$(git -C "$repo_path" rev-list --count "@{upstream}..HEAD" 2>/dev/null || echo "0")"

  if [[ "$behind" == "0" ]] && [[ "$ahead" == "0" ]]; then
    echo "${branch} · aktuell"
  elif [[ "$behind" != "?" ]]; then
    echo "${branch} · ${behind} hinter · ${ahead} voraus"
  else
    echo "${branch}"
  fi
}

add_repo_entry() {
  local name="$1" path="$2" url="${3:-}" do_fetch="${4:-false}"
  local i

  for i in "${!REPO_NAME[@]}"; do
    if [[ "${REPO_PATH[$i]}" == "$path" ]]; then
      [[ -n "$url" ]] && REPO_URL[$i]="$url"
      REPO_STATUS[$i]="$(get_repo_git_status "$path" "$do_fetch")"
      return 0
    fi
  done

  if [[ -d "${path}/.git" ]] && [[ -z "$url" ]]; then
    url="$(git -C "$path" remote get-url origin 2>/dev/null || echo "")"
  fi

  REPO_NAME+=("$name")
  REPO_PATH+=("$path")
  REPO_URL+=("$url")
  REPO_BRANCH+=("")
  REPO_STATUS+=("$(get_repo_git_status "$path" "$do_fetch")")
}

discover_git_repos() {
  local do_fetch="${1:-false}"
  REPO_NAME=() REPO_PATH=() REPO_URL=() REPO_BRANCH=() REPO_STATUS=()

  while IFS= read -r git_dir; do
    add_repo_entry "$(basename "$(dirname "$git_dir")")" "$(dirname "$git_dir")" "" "$do_fetch"
  done < <(find "$REPOS_DIR" -maxdepth 3 -name .git -type d 2>/dev/null | sort)

  if [[ -f "$REPOS_CONF" ]]; then
    while IFS='|' read -r name url target || [[ -n "$name" ]]; do
      [[ -z "$name" || "$name" =~ ^[[:space:]]*# ]] && continue
      name="$(echo "$name" | xargs)"
      url="$(echo "$url" | xargs)"
      target="$(echo "${target:-}" | xargs)"
      [[ -z "$name" || -z "$url" ]] && continue
      add_repo_entry "$name" "${target:-${REPOS_DIR}/${name}" "$url" "$do_fetch"
    done < "$REPOS_CONF"
  fi
}

print_repo_selection_menu() {
  echo -e "${BOLD}  ${ICON_GIT} Verfügbare Git-Repositories${NC}"
  echo ""

  local i
  for i in "${!REPO_NAME[@]}"; do
    local check=" "
    [[ "${REPO_SELECTED[$i]:-0}" -eq 1 ]] && check="x"
    printf "  ${CYAN}[%s]${NC} ${BOLD}%2d${NC}  ${ICON_FOLDER} %-26s ${DIM}%s${NC}\n" \
      "$check" "$((i+1))" "${REPO_NAME[$i]}" "${REPO_STATUS[$i]}"
    printf "       ${ICON_PATH} ${DIM}%s${NC}\n" "${REPO_PATH[$i]}"
    [[ -n "${REPO_URL[$i]}" ]] && printf "       ${ICON_GIT} ${DIM}%s${NC}\n" "${REPO_URL[$i]}"
    echo ""
  done

  echo -e "${DIM}  Nummer togglen · a=alle · n=keine · s=überspringen · Enter=bestätigen${NC}"
  echo ""
}

select_repos_interactive() {
  local i

  REPO_SELECTED=()
  discover_git_repos false

  if [[ ${#REPO_NAME[@]} -eq 0 ]]; then
    log_info "Keine Git-Repositories gefunden."
    if ask_yes_no "Repository manuell hinzufügen?" "n"; then
      local name url target
      name="$(ask_input "Repository-Name")"
      url="$(ask_input "Git-URL")"
      target="$(ask_input "Zielpfad" "${REPOS_DIR}/${name}")"
      add_repo_entry "$name" "$target" "$url" false
    else
      CFG_SYNC_REPOS=false
      return 0
    fi
  fi

  for i in "${!REPO_NAME[@]}"; do REPO_SELECTED[$i]=1; done

  while true; do
    print_repo_selection_menu
    echo -ne "${BLUE}Auswahl: ${NC}" >&2
    read -r input || true

    if [[ -z "$input" ]]; then
      local any=0
      for i in "${!REPO_SELECTED[@]}"; do [[ "${REPO_SELECTED[$i]}" -eq 1 ]] && any=1 && break; done
      [[ "$any" -eq 0 ]] && { log_error "Mindestens ein Repo wählen oder 's' zum Überspringen."; continue; }
      break
    fi

    case "$(tolower "$input")" in
      a|all|alle) for i in "${!REPO_SELECTED[@]}"; do REPO_SELECTED[$i]=1; done ;;
      n|keine|none) for i in "${!REPO_SELECTED[@]}"; do REPO_SELECTED[$i]=0; done ;;
      s|skip|überspringen) CFG_SYNC_REPOS=false; return 0 ;;
      *)
        local num
        IFS=',' read -ra nums <<< "$input"
        for num in "${nums[@]}"; do
          num="$(echo "$num" | tr -d ' ')"
          if [[ "$num" =~ ^[0-9]+$ ]] && (( num >= 1 && num <= ${#REPO_NAME[@]} )); then
            local idx=$((num - 1))
            REPO_SELECTED[$idx]=$((1 - REPO_SELECTED[idx]))
          else
            log_error "Ungültige Nummer: ${num}"
          fi
        done
        ;;
    esac
  done

  SELECTED_REPO_INDICES=()
  for i in "${!REPO_SELECTED[@]}"; do [[ "${REPO_SELECTED[$i]}" -eq 1 ]] && SELECTED_REPO_INDICES+=("$i"); done
  CFG_SYNC_REPOS=true
}

sync_single_repo() {
  local idx="$1"
  local name="${REPO_NAME[$idx]}" path="${REPO_PATH[$idx]}" url="${REPO_URL[$idx]}"
  local log_file; log_file="$(mktemp)"

  if [[ ! -d "${path}/.git" ]]; then
    [[ -z "$url" ]] && { log_error "${ICON_FOLDER} ${name}: keine URL – übersprungen."; rm -f "$log_file"; return 1; }
    mkdir -p "$(dirname "$path")"
    if git clone --progress "$url" "$path" >"$log_file" 2>&1; then
      REPO_STATUS[$idx]="$(get_repo_git_status "$path" true)"
      rm -f "$log_file"; return 0
    fi
    log_error "${name}: Clone fehlgeschlagen."; tail -3 "$log_file" | sed 's/^/    /'
    rm -f "$log_file"; return 1
  fi

  if git -C "$path" pull --progress --ff-only >"$log_file" 2>&1 || \
     git -C "$path" pull --progress >"$log_file" 2>&1; then
    REPO_STATUS[$idx]="$(get_repo_git_status "$path" true)"
    rm -f "$log_file"; return 0
  fi
  log_error "${name}: Pull fehlgeschlagen."; tail -3 "$log_file" | sed 's/^/    /'
  rm -f "$log_file"; return 1
}

# ---------------------------------------------------------------------------
# PHASE 1: Fragebogen – alle Eingaben am Anfang
# ---------------------------------------------------------------------------
run_questionnaire() {
  print_banner
  show_roadmap "q_proxy"
  ensure_setup_hint

  echo -e "${BOLD}  Willkommen! Bevor etwas installiert wird, sammeln wir alle Einstellungen.${NC}"
  echo -e "${DIM}  Du kannst danach zuschauen, wie das Setup automatisch durchläuft.${NC}"
  echo -e "${DIM}  ✍️  Setup by ${SETUP_AUTHOR} — bei Fragen oder Problemen gerne melden.${NC}"
  echo ""

  # --- 1/5 Proxy ---
  section_header "q_proxy" "🌐 Frage 1/5 · Proxy" "Brauchst du einen Firmen-Proxy?"
  if ask_yes_no "Proxy konfigurieren?" "n"; then
    CFG_USE_PROXY=true
    local proxy_default
    proxy_default="$(detect_default_proxy_url)"
    if [[ "$proxy_default" == "$DEFAULT_CLUSTER_PROXY" ]]; then
      log_info "Cluster-Proxy erkannt (internet-proxy.internet-proxy.svc.cluster.local)."
    fi
    CFG_PROXY_URL="$(ask_input "Proxy-URL" "$proxy_default")"
    log_success "Proxy wird eingerichtet: ${CFG_PROXY_URL}"
    log_info "apt: 95proxies + ForceIPv4 (98force-ipv4) werden gesetzt."
  else
    log_info "Kein Proxy."
  fi

  # --- 2/5 Persönliche Daten ---
  section_header "q_personal" "👤 Frage 2/5 · Persönliche Daten" "Git-Identität und Container-Variablen."
  CFG_USER_NAME="$(ask_input "Wie ist dein Name?")"
  CFG_USER_EMAIL="$(ask_input "Wie lautet deine E-Mail-Adresse?")"
  CFG_NUMBER_TYPE="$(ask_number_type)"
  if [[ "$CFG_NUMBER_TYPE" == "e" ]]; then
    CFG_E_NUMBER="$(ask_input "Wie lautet deine E-Nummer?")"
    CFG_B_NUMBER=""
  else
    CFG_B_NUMBER="$(ask_input "Wie lautet deine B-Nummer?")"
    CFG_E_NUMBER=""
  fi
  CFG_DISPLAY_NAME="$(ask_input "Wie möchtest du gerne genannt werden?")"
  log_success "Persönliche Daten erfasst."

  # --- 3/5 Git-Repos ---
  section_header "q_repos" "📁 Frage 3/5 · Git-Repositories" "Welche Repositories sollen synchronisiert werden?"
  log_info "${ICON_WORKSPACE} Repos-Ordner: ${REPOS_DIR} (wird bei Installation angelegt)"
  select_repos_interactive
  if [[ "$CFG_SYNC_REPOS" == true ]]; then
    log_success "${#SELECTED_REPO_INDICES[@]} Repository/Repositories ausgewählt."
  else
    log_info "Repository-Sync wird übersprungen."
  fi

  # --- 4/5 Optionale Tools ---
  section_header "q_tools" "🛠️  Frage 4/5 · Optionale Tools" "Was soll installiert werden?"
  echo ""
  echo -e "${BOLD}  ${ICON_NODE} Node.js & NVM${NC}"
  if ask_yes_no "NVM & Node.js installieren?" "n"; then
    CFG_INSTALL_NVM=true
    CFG_NODE_VERSION="$(ask_input "Node.js-Version" "lts")"
  fi
  echo ""
  echo -e "${BOLD}  ${ICON_PYTHON} Python${NC}"
  ask_yes_no "Python (und pip) installieren?" "n" && CFG_INSTALL_PYTHON=true
  echo ""
  echo -e "${BOLD}  ${ICON_PNPM} pnpm${NC}"
  ask_yes_no "pnpm installieren?" "n" && CFG_INSTALL_PNPM=true

  # --- 5/5 Docker & cloudctl ---
  section_header "q_logins" "🔐 Frage 5/5 · Docker & cloudctl" "Registry- und Cloud-Zugang einrichten."
  echo ""
  echo -e "${BOLD}  ${ICON_DOCKER} Docker Registry Login${NC}"
  if ask_yes_no "Docker login durchführen?" "y"; then
    CFG_DOCKER_LOGIN=true
    CFG_DOCKER_REGISTRY="$(ask_input "Registry-URL" "$DEFAULT_DOCKER_REGISTRY")"
    CFG_DOCKER_USER="$(ask_input "Docker-Benutzername" "${CFG_USER_EMAIL:-}")"
    if ask_yes_no "Token/Passwort jetzt eingeben? (Enter = interaktiv in Phase 2)" "n"; then
      CFG_DOCKER_TOKEN="$(ask_secret "Docker Token/Passwort")"
    fi
    log_success "Docker login geplant für: ${CFG_DOCKER_REGISTRY}"
  else
    log_info "Docker login übersprungen."
  fi
  echo ""
  echo -e "${BOLD}  ${ICON_CLOUD} cloudctl Login${NC}"
  if ask_yes_no "cloudctl login durchführen?" "y"; then
    CFG_CLOUDCTL_LOGIN=true
    log_success "cloudctl login wird in Phase 2 interaktiv ausgeführt."
    log_info "Halte ggf. Browser/Token bereit (SSO)."
  else
    log_info "cloudctl login übersprungen."
  fi

  # Zusammenfassung
  echo ""
  section_header "q_tools" "📋 Zusammenfassung deiner Auswahl"
  echo -e "  🌐 ${DIM}Proxy:${NC}        $([[ "$CFG_USE_PROXY" == true ]] && echo "${CFG_PROXY_URL}" || echo "nein")"
  echo -e "  👤 ${DIM}Name:${NC}         ${CFG_DISPLAY_NAME} (${CFG_USER_NAME})"
  echo -e "  ✉️  ${DIM}E-Mail:${NC}       ${CFG_USER_EMAIL}"
  if [[ "$CFG_NUMBER_TYPE" == "e" ]]; then
    echo -e "  🪪 ${DIM}E-Nummer:${NC}     ${CFG_E_NUMBER}"
  else
    echo -e "  🪪 ${DIM}B-Nummer:${NC}     ${CFG_B_NUMBER}"
  fi
  echo -e "  ${ICON_GIT} ${DIM}Git-Repos:${NC}    $([[ "$CFG_SYNC_REPOS" == true ]] && echo "${#SELECTED_REPO_INDICES[@]} ausgewählt" || echo "übersprungen")"
  echo -e "  ${ICON_NODE} ${DIM}NVM/Node:${NC}     $([[ "$CFG_INSTALL_NVM" == true ]] && echo "ja (${CFG_NODE_VERSION})" || echo "nein")"
  echo -e "  ${ICON_PYTHON} ${DIM}Python:${NC}       $([[ "$CFG_INSTALL_PYTHON" == true ]] && echo "ja" || echo "nein")"
  echo -e "  ${ICON_PNPM} ${DIM}pnpm:${NC}         $([[ "$CFG_INSTALL_PNPM" == true ]] && echo "ja" || echo "nein")"
  echo -e "  ${ICON_DOCKER} ${DIM}Docker login:${NC} $([[ "$CFG_DOCKER_LOGIN" == true ]] && echo "ja (${CFG_DOCKER_REGISTRY})" || echo "nein")"
  echo -e "  ${ICON_CLOUD} ${DIM}cloudctl login:${NC} $([[ "$CFG_CLOUDCTL_LOGIN" == true ]] && echo "ja" || echo "nein")"
  echo -e "  ${ICON_SHELL} ${DIM}Terminal:${NC}     ${ICON_ZSH} Zsh + ${ICON_P10K} Powerlevel10k (immer)"
  echo ""

  if ! ask_yes_no "Alles korrekt? Installation starten?" "j"; then
    log_info "Abgebrochen. Starte das Skript erneut, um die Eingaben anzupassen."
    exit 0
  fi
}

# ---------------------------------------------------------------------------
# PHASE 2: Installation – automatisch ausführen
# ---------------------------------------------------------------------------
apply_proxy() {
  section_header "e_proxy" "🌐 Installation · Proxy anwenden"

  if [[ "$CFG_USE_PROXY" != true ]]; then
    log_info "Kein Proxy – übersprungen."
    return 0
  fi

  local no_proxy="${NO_PROXY:-$DEFAULT_NO_PROXY}"

  export http_proxy="$CFG_PROXY_URL" https_proxy="$CFG_PROXY_URL"
  export HTTP_PROXY="$CFG_PROXY_URL" HTTPS_PROXY="$CFG_PROXY_URL"
  export no_proxy="$no_proxy" NO_PROXY="$no_proxy"

  draw_progress_bar 1 4 "🌐 Session-Variablen setzen …"

  draw_progress_bar 2 4 "🐧 apt: 95proxies + ForceIPv4 …"
  write_apt_proxy_config "$CFG_PROXY_URL"

  draw_progress_bar 3 4 "📂 ~/.zshrc aktualisieren …"
  set_zshrc_block "${SETUP_MARKER}: proxy" "$(cat <<EOF
export http_proxy="${CFG_PROXY_URL}"
export https_proxy="${CFG_PROXY_URL}"
export HTTP_PROXY="${CFG_PROXY_URL}"
export HTTPS_PROXY="${CFG_PROXY_URL}"
export no_proxy="${no_proxy}"
export NO_PROXY="${no_proxy}"
EOF
)"

  draw_progress_bar 4 4 "🔀 Git-Proxy setzen …"
  git config --global http.proxy "$CFG_PROXY_URL" 2>/dev/null || true
  git config --global https.proxy "$CFG_PROXY_URL" 2>/dev/null || true

  echo ""; echo ""
  log_success "Proxy aktiv (apt, Shell, Git) + ForceIPv4 für apt."
}

exec_system_update() {
  section_header "e_system" "🔄 Installation · System-Update"

  local labels=("${ICON_APT} Paketlisten" "⬆️  Upgrade" "📦 Basis-Tools")
  local cmds=(
    "run_apt update -y"
    "run_apt upgrade -y"
    "run_apt install -y --no-install-recommends ca-certificates curl git wget gnupg"
  )
  local i
  for i in "${!labels[@]}"; do
    draw_progress_bar "$((i + 1))" "${#labels[@]}" "${labels[$i]} …"
    eval "${cmds[$i]}"
  done
  echo ""; echo ""
  log_success "System aktualisiert."
}

apply_user_data() {
  section_header "e_personal" "🔑 Installation · Git & Identität"

  draw_progress_bar 1 2 "${ICON_GIT} Git-Konfiguration …"
  git config --global user.name "$CFG_USER_NAME"
  git config --global user.email "$CFG_USER_EMAIL"

  draw_progress_bar 2 2 "📂 ~/.zshrc aktualisieren …"
  local identity_exports="export DISPLAY_NAME=\"${CFG_DISPLAY_NAME}\""
  if [[ "$CFG_NUMBER_TYPE" == "e" ]]; then
    identity_exports="export E_NUMBER=\"${CFG_E_NUMBER}\"
${identity_exports}"
  else
    identity_exports="export B_NUMBER=\"${CFG_B_NUMBER}\"
${identity_exports}"
  fi
  set_zshrc_block "${SETUP_MARKER}: identity" "$identity_exports"
  set_zshrc_block "${SETUP_MARKER}: repos" "$(cat <<EOF
export REPOS_DIR="${REPOS_DIR}"
export WORKSPACE_ROOT="${WORKSPACE_ROOT}"
EOF
)"
  set_zshrc_block "${SETUP_MARKER}: greeting" "$(cat <<GREETING
if [[ -o interactive ]] && [[ -z "${SETUP_WELCOME_SHOWN:-}" ]]; then
  export SETUP_WELCOME_SHOWN=1
  echo ""
  echo "👋 Willkommen, \${DISPLAY_NAME}! Dein Coder-Dev-Container ist bereit."
  echo "✍️  Setup-Skript by ${SETUP_AUTHOR} — bei Fragen gerne melden."
  echo ""
fi
GREETING
)"
  export DISPLAY_NAME="$CFG_DISPLAY_NAME"
  echo ""; echo ""
  log_success "Identität konfiguriert."
}

exec_sync_repos() {
  section_header "e_repos" "🔀 Installation · Git-Repositories syncen"

  if [[ "$CFG_SYNC_REPOS" != true ]] || [[ ${#SELECTED_REPO_INDICES[@]} -eq 0 ]]; then
    log_info "Übersprungen."
    return 0
  fi

  ensure_repos_directory
  discover_git_repos true
  local total="${#SELECTED_REPO_INDICES[@]}" current=0 ok=0 fail=0

  for idx in "${SELECTED_REPO_INDICES[@]}"; do
    current=$((current + 1))
    local repo_icon="${ICON_PULL}"
    [[ ! -d "${REPO_PATH[$idx]}/.git" ]] && repo_icon="${ICON_CLONE}"
    draw_progress_bar "$current" "$((total + 1))" "${repo_icon} ${REPO_NAME[$idx]} …"
    sync_single_repo "$idx" && ok=$((ok + 1)) || fail=$((fail + 1))
  done

  draw_progress_bar "$((total + 1))" "$((total + 1))" "Fertig!"
  echo ""; echo ""
  log_success "${ok}/${total} Repositories synchronisiert."
  [[ "$fail" -gt 0 ]] && log_error "${fail} Fehler."
}

exec_install_tools() {
  section_header "e_tools" "⚙️  Installation · Optionale Tools"

  local steps=0 current=0
  [[ "$CFG_INSTALL_NVM" == true ]] && steps=$((steps + 3))
  [[ "$CFG_INSTALL_PYTHON" == true ]] && steps=$((steps + 1))
  [[ "$CFG_INSTALL_PNPM" == true ]] && steps=$((steps + 1))
  [[ "$steps" -eq 0 ]] && { log_info "Keine optionalen Tools gewählt – übersprungen."; return 0; }

  if [[ "$CFG_INSTALL_NVM" == true ]]; then
    echo -e "${BOLD}  ${ICON_NODE} Node.js & NVM${NC}"
    current=$((current + 1)); draw_progress_bar "$current" "$steps" "${ICON_NODE} NVM installieren …"
    [[ ! -d "${HOME}/.nvm" ]] && curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    set_zshrc_block "${SETUP_MARKER}: nvm" "$(cat <<'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF
)"
    export NVM_DIR="${HOME}/.nvm"
    # shellcheck source=/dev/null
    [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"

    current=$((current + 1)); draw_progress_bar "$current" "$steps" "${ICON_NODE} Node.js ${CFG_NODE_VERSION} …"
    nvm install "$CFG_NODE_VERSION" && nvm alias default "$CFG_NODE_VERSION" && nvm use default

    current=$((current + 1)); draw_progress_bar "$current" "$steps" "${ICON_NODE} Node.js fertig …"
    log_success "${ICON_NODE} Node.js $(node --version 2>/dev/null || echo installiert)"
  fi

  if [[ "$CFG_INSTALL_PYTHON" == true ]]; then
    echo -e "${BOLD}  ${ICON_PYTHON} Python${NC}"
    current=$((current + 1)); draw_progress_bar "$current" "$steps" "${ICON_PYTHON} Python installieren …"
    command -v python3 &>/dev/null || run_apt install -y python3 python3-pip python3-venv
    log_success "${ICON_PYTHON} Python $(python3 --version 2>/dev/null | cut -d' ' -f2)"
  fi

  if [[ "$CFG_INSTALL_PNPM" == true ]]; then
    echo -e "${BOLD}  ${ICON_PNPM} pnpm${NC}"
    current=$((current + 1)); draw_progress_bar "$current" "$steps" "${ICON_PNPM} pnpm installieren …"
    if ! command -v node &>/dev/null; then
      log_error "pnpm braucht Node.js – übersprungen."
    elif command -v pnpm &>/dev/null; then
      log_info "pnpm bereits vorhanden."
    elif command -v corepack &>/dev/null; then
      corepack enable && corepack prepare pnpm@latest --activate
      log_success "${ICON_PNPM} pnpm $(pnpm --version)"
    else
      npm install -g pnpm && log_success "${ICON_PNPM} pnpm $(pnpm --version)"
    fi
  fi

  echo ""
}

ensure_docker_cli() {
  if command -v docker &>/dev/null; then
    return 0
  fi
  log_info "Docker CLI nicht gefunden — installiere docker.io …"
  run_apt install -y docker.io
}

exec_docker_login() {
  if [[ "$CFG_DOCKER_LOGIN" != true ]]; then
    return 0
  fi

  ensure_docker_cli || {
    log_error "Docker CLI konnte nicht installiert werden."
    return 1
  }

  local registry="${CFG_DOCKER_REGISTRY:-$DEFAULT_DOCKER_REGISTRY}"
  local user="${CFG_DOCKER_USER:-}"

  if [[ -n "$CFG_DOCKER_TOKEN" && -n "$user" ]]; then
    if echo "$CFG_DOCKER_TOKEN" | docker login "$registry" -u "$user" --password-stdin; then
      log_success "${ICON_DOCKER} Docker login erfolgreich (${registry})."
      return 0
    fi
    log_error "${ICON_DOCKER} Docker login fehlgeschlagen (Token/User)."
    return 1
  fi

  log_info "${ICON_DOCKER} Interaktiver docker login für ${registry} …"
  log_info "Benutzer: ${user:-<wird abgefragt>}"
  if [[ -n "$user" ]]; then
    docker login "$registry" -u "$user"
  else
    docker login "$registry"
  fi

  if docker info &>/dev/null; then
    log_success "${ICON_DOCKER} Docker login erfolgreich."
  else
    log_error "${ICON_DOCKER} Docker login fehlgeschlagen oder Daemon nicht erreichbar."
    return 1
  fi
}

exec_cloudctl_login() {
  if [[ "$CFG_CLOUDCTL_LOGIN" != true ]]; then
    return 0
  fi

  if ! command -v cloudctl &>/dev/null; then
    log_error "${ICON_CLOUD} cloudctl nicht im PATH — bitte manuell installieren."
    return 1
  fi

  log_info "${ICON_CLOUD} cloudctl login (interaktiv) …"
  if cloudctl login; then
    log_success "${ICON_CLOUD} cloudctl login erfolgreich."
    return 0
  fi

  log_error "${ICON_CLOUD} cloudctl login fehlgeschlagen."
  return 1
}

exec_logins() {
  section_header "e_logins" "🔐 Installation · Docker & cloudctl Login"

  local steps=0 current=0
  [[ "$CFG_DOCKER_LOGIN" == true ]] && steps=$((steps + 1))
  [[ "$CFG_CLOUDCTL_LOGIN" == true ]] && steps=$((steps + 1))
  [[ "$steps" -eq 0 ]] && { log_info "Keine Logins gewählt — übersprungen."; return 0; }

  if [[ "$CFG_DOCKER_LOGIN" == true ]]; then
    current=$((current + 1))
    draw_progress_bar "$current" "$steps" "${ICON_DOCKER} docker login …"
    exec_docker_login || true
  fi

  if [[ "$CFG_CLOUDCTL_LOGIN" == true ]]; then
    current=$((current + 1))
    draw_progress_bar "$current" "$steps" "${ICON_CLOUD} cloudctl login …"
    exec_cloudctl_login || true
  fi

  echo ""
}

exec_install_terminal() {
  section_header "e_terminal" "💻 Installation · Terminal (${ICON_ZSH} Zsh + ${ICON_P10K} P10k)"

  local p10k_dir="${HOME}/.powerlevel10k/powerlevel10k"
  local total_steps=7 step=0

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "${ICON_ZSH} Zsh & fontconfig …"
  command -v zsh &>/dev/null || run_apt install -y zsh
  command -v fc-cache &>/dev/null || run_apt install -y fontconfig

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "🔤 Meslo Nerd Fonts installieren …"
  install_meslo_nerd_fonts

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "${ICON_P10K} Powerlevel10k klonen …"
  [[ ! -d "$p10k_dir" ]] && git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "$p10k_dir"

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "🎨 P10k-Lean Preset (nerdfont) …"
  install_p10k_preset "$p10k_dir"

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "${ICON_SHELL} Shell konfigurieren …"
  set_zshrc_block "${SETUP_MARKER}: powerlevel10k" "$(cat <<EOF
# Meslo Nerd Font + offizielles P10k-Lean-Preset (Ordner-Icons, Git-Status)
source ${p10k_dir}/powerlevel10k.zsh-theme
[[ -f ~/.p10k.zsh ]] && source ~/.p10k.zsh
EOF
)"
  local zsh_path; zsh_path="$(command -v zsh)"
  [[ -n "$zsh_path" && "${SHELL:-}" != "$zsh_path" ]] && \
    chsh -s "$zsh_path" 2>/dev/null || chsh -s "$zsh_path" "$USER" 2>/dev/null || true

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "🖥️  Coder Terminal-Font setzen …"
  configure_coder_terminal_font

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "Fertig!"
  echo ""; echo ""
  log_success "Terminal eingerichtet (${ICON_ZSH} Zsh + ${ICON_P10K} P10k + 🔤 Meslo Nerd Font)."
  log_info "Ordner-Icons & Git-Symbole erscheinen mit MesloLGS NF im Coder-Terminal."
}

link_setup_scripts() {
  local bin_dir="${HOME}/.local/bin"
  local link_name="${bin_dir}/setup-dev-container"
  local setup_link="${WORKSPACE_ROOT}/setup"

  mkdir -p "$bin_dir"
  ln -sf "${SCRIPT_DIR}/setup_dev_container.sh" "$link_name"

  # ~/.local/bin in PATH (idempotent)
  set_zshrc_block "${SETUP_MARKER}: path" 'export PATH="${HOME}/.local/bin:${PATH}"'

  log_success "Befehl verlinkt: setup-dev-container → ${SCRIPT_DIR}/setup_dev_container.sh"

  # Optional: /workspace/setup als Symlink — nur wenn Skript woanders liegt
  if [[ "$SCRIPT_DIR" != "$setup_link" && "$SCRIPT_DIR" != "$DEFAULT_SETUP_DIR" ]]; then
    if [[ ! -e "$setup_link" ]]; then
      ln -sfn "$SCRIPT_DIR" "$setup_link"
      log_success "Symlink: ${setup_link} → ${SCRIPT_DIR}"
    fi
  fi
}

print_finish() {
  section_header "e_done" "🎉 Setup abgeschlossen!"

  echo -e "${GREEN}${BOLD}"
  cat <<'FINISH'
  ╔═══════════════════════════════════════════════════════════╗
  ║   ✨  ALLES FERTIG – DEV-CONTAINER IST BEREIT             ║
  ╚═══════════════════════════════════════════════════════════╝
FINISH
  echo -e "${NC}"
  echo -e "${GREEN}${BOLD}  👋 Willkommen, ${CFG_DISPLAY_NAME:-Entwickler}!${NC}"
  echo -e "${DIM}  ✍️  Setup-Skript by ${SETUP_AUTHOR} — bei Fragen gerne melden.${NC}"
  echo ""
  echo -e "${DIM}  Nächster Schritt:${NC}  ${ICON_SHELL} ${CYAN}${BOLD}exec zsh${NC}"
  echo -e "${DIM}  Setup erneut starten:${NC}  ${CYAN}${BOLD}setup-dev-container${NC}"
  echo ""
}

run_installation() {
  echo ""
  echo -e "${BOLD}  ⚙️  Phase 2: Installation startet …${NC}"
  echo -e "${DIM}  Alle Schritte laufen jetzt automatisch durch.${NC}"
  echo ""

  apply_proxy
  exec_system_update
  apply_user_data
  exec_sync_repos
  exec_install_tools
  exec_logins
  exec_install_terminal
  link_setup_scripts
  print_finish
}

# ---------------------------------------------------------------------------
# Hauptprogramm
# ---------------------------------------------------------------------------
main() {
  run_questionnaire
  run_installation
}

main "$@"
```

### setup_dev_container.repos.conf

Repository-Vorlage — eigene Repos eintragen, nach `/workspace/setup/setup_dev_container.repos.conf` kopieren.

```ini
# Git-Repositories für setup_dev_container.sh
# Format: NAME|GIT_URL|ZIELPFAD (ZIELPFAD optional, Standard: /workspace/repos/NAME)
#
# Beispiele (auskommentiert — eigene Repos eintragen):
# mein-service|https://gitlab.company.com/team/mein-service.git
# frontend-app|https://gitlab.company.com/team/frontend-app.git
# shared-lib|git@gitlab.company.com:team/shared-lib.git|/workspace/repos/shared-lib
#
# Geklonte Repositories landen standardmäßig unter /workspace/repos/
```

### setup_dev_container.p10k.zsh (optional)

> **Nur bei eigenem Theme.** Standardmäßig installiert das Skript das offizielle **P10k-Lean-Preset** automatisch — dieser Abschnitt kann leer bleiben oder entfallen.

```zsh
# Optional: eigenes Powerlevel10k-Theme hier einfügen.
# Datei nach /workspace/setup/setup_dev_container.p10k.zsh kopieren.
```


---

> **Fragen oder Erweiterungswünsche?** Setup-Skript by **Domenic Schumacher** — bei Fragen, Bugs oder Ideen gerne direkt melden.
