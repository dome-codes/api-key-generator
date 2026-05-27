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
- [Setup-Dateien (Referenz)](#setup-dateien-referenz)

---

## Quick Start

### 1. Skripte in den Coder-Container kopieren

#### Setup-Dateien (Teil der Confluence-Doku)

> **Confluence:** Diese README ist die **Anleitung** auf der Confluence-Seite. Die Skripte (`setup_dev_container.sh`, `.repos.conf`) kommen als **separate Anhänge** oder per `git clone` — das Hauptskript **nicht** als 1.600-Zeilen-Block in die Seite kopieren.

| Datei | Pflicht? | Bereitstellung |
|-------|----------|----------------|
| `setup_dev_container.sh` | ✅ Ja | Git-Repo / Confluence-Anhang |
| `setup_dev_container.repos.conf` | ✅ Ja | Git-Repo / Anhang (Vorlage auch unten im Abschnitt [Setup-Dateien](#setup-dateien-referenz)) |
| `setup_dev_container.p10k.zsh` | Optional | nur bei Custom-Theme |

Entwickler legen die Dateien im Container an:

```bash
mkdir -p ~/setup
# Inhalt aus Confluence-Codeblock → Datei anlegen, z. B.:
#   setup_dev_container.sh
#   setup_dev_container.repos.conf
#   setup_dev_container.p10k.zsh   (optional)
chmod +x ~/setup/setup_dev_container.sh
```

Ziel im Container nach dem Kopieren:

```
~/setup/
├── setup_dev_container.sh
├── setup_dev_container.repos.conf
└── setup_dev_container.p10k.zsh   (optional)
```

> **Hinweis:** Im Container liegen nur die **Skript-Dateien** unter `~/setup/` — nicht der Confluence-Artikel selbst.

---

Das Setup läuft **im Dev-Container**. Die Skripte werden einmalig nach **`~/setup/`** gebracht (Standard: `/home/coder/setup`):

```bash
# Option A: Ordner manuell anlegen und Dateien reinkopieren (Coder UI / Drag & Drop)
mkdir -p ~/setup
# → setup_dev_container.sh, setup_dev_container.repos.conf nach ~/setup/
#    (optional: setup_dev_container.p10k.zsh)

# Option B: per scp vom lokalen Rechner
scp setup_dev_container.sh setup_dev_container.repos.conf user@coder-host:~/setup/

# Option C: aus GitLab/GitHub klonen
git clone <url-zum-setup-repo> ~/setup

# Option D: Symlink statt Kopie (Setup liegt bereits unter ~/repos/)
ln -sfn ~/repos/dev-tools/setup ~/setup
```

> **Symlink vs. Kopie:** Wenn die Skripte in einem Git-Repo unter `~/repos/` liegen, reicht ein Symlink nach `~/setup` — bei `git pull` im Quell-Repo sind die Skripte automatisch aktuell. Das Setup legt den Link ggf. selbst an.

### 2. Setup starten

```bash
cd ~/setup
chmod +x setup_dev_container.sh
./setup_dev_container.sh
```

Nach dem ersten Lauf steht der Befehl **`setup-dev-container`** global zur Verfügung (Symlink in `~/.local/bin/`).

### 3. Repositories

Das Skript legt automatisch **`~/repos/`** an (Standard: `/home/coder/repos`). Ausgewählte Git-Repositories werden dort **geklont** bzw. **gepullt**:

```
~/
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
| 3 | **Git-Repositories** | GitLab-Gruppen-URL → alle Repos laden → interaktive Mehrfachauswahl |
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

- **GitLab-Gruppe:** Gruppen-URL → alle Projekte per API laden (inkl. Untergruppen)
- **Auswahl:** Interaktives Checkbox-Menü im Fragebogen
- **Auto-Discovery:** Findet bestehende Repos unter `~/repos/`
- **Konfiguration:** `@gitlab-group|URL` und optionale Einzelrepos in `setup_dev_container.repos.conf`
- **Ordner:** `~/repos/` wird bei Bedarf automatisch erstellt (Fallback: `$HOME/repos`, nicht `/workspace`)
- **Clone oder Pull:** Fehlende Repos werden geklont, vorhandene aktualisiert
- **Fortschritt:** Pro Repository mit Statusanzeige (Branch, ahead/behind)
- **Token:** `GITLAB_TOKEN` für private Gruppen (Scope: `read_api`)

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

### GitLab-Gruppe (empfohlen)

Im Wizard **Frage 3/5** eine GitLab-Gruppen-URL angeben — z. B. die URL aus dem Browser:

```
https://gitlab.company.com/deka/plattform
```

Das Skript ruft die GitLab-API auf und listet **alle Projekte der Gruppe** (inkl. Untergruppen). Du wählst dann per Checkbox, welche Repos nach **`~/repos/`** geklont werden sollen.

**Vorausgefüllte Gruppe** in `setup_dev_container.repos.conf`:

```ini
@gitlab-group|https://gitlab.company.com/deka/plattform
```

**Privater Zugriff:** Personal Access Token mit Scope `read_api` — als Umgebungsvariable oder im Wizard:

```bash
export GITLAB_TOKEN=glpat-...
./setup_dev_container.sh
```

### Konfiguration: `setup_dev_container.repos.conf`

```ini
# GitLab-Gruppe (Standard-URL für den Wizard)
@gitlab-group|https://gitlab.company.com/deka/plattform

# Optional: einzelne Repos zusätzlich
# Format: NAME|GIT_URL|ZIELPFAD (optional, Standard: ~/repos/NAME)
mein-service|https://gitlab.company.com/team/mein-service.git
frontend-app|https://gitlab.company.com/team/frontend-app.git
```

| Eintrag | Beschreibung |
|---------|--------------|
| `@gitlab-group\|URL` | Standard-Gruppen-URL; alle Projekte werden geladen |
| `NAME\|GIT_URL\|ZIELPFAD` | Einzelnes Repo zusätzlich zur Gruppe |

### Auswahlmenü

```
  [x]   1  api-key-generator          main · aktuell
  [ ]   2  frontend-app               nicht geklont
  [x]   3  shared-lib                 main · 2 hinter · 0 voraus

  Nummer togglen · a=alle · n=keine · s=überspringen · Enter=bestätigen
```

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

> Die **Setup-Dateien** sind im Repo unter `dev-container/` — siehe **[Setup-Dateien (Referenz)](#setup-dateien-referenz)**.

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
| `GITLAB_TOKEN` | — | Personal Access Token für private GitLab-Gruppen (`read_api`) |
| `REPOS_DIR` | `$HOME/repos` | Zielordner für Git-Repositories (z. B. `/home/coder/repos`) |
| `WORKSPACE_ROOT` | `$HOME` | Workspace-Root (nur `/workspace` wenn beschreibbar) |
| `WORKSPACE_DIR` | *(deprecated)* | Alias für `REPOS_DIR` (Abwärtskompatibilität) |
| `NO_PROXY` | `localhost,127.0.0.1,::1,.svc.cluster.local,.cluster.local` | Bypass-Liste für Proxy |

Beispiel:

```bash
export REPOS_DIR="${HOME}/repos"
cd ~/setup && ./setup_dev_container.sh
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
/home/coder/                          # $HOME (Standard in Coder)
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
| `~/setup` → Quellordner | optional | Einheitlicher Pfad, kein Kopieren |

---

## Setup-Dateien (Referenz)

> **Hinweis:** Das Hauptskript `setup_dev_container.sh` (~1.600 Zeilen) steht **nicht** in dieser README — nur in diesem Git-Repo bzw. als **separater Confluence-Anhang** / Download.

| Datei | Pflicht? | Beschreibung |
|-------|----------|--------------|
| `setup_dev_container.sh` | ✅ Ja | Wizard + Installation (aus Repo klonen oder als Anhang) |
| `setup_dev_container.repos.conf` | ✅ Ja | GitLab-Gruppe & optionale Einzelrepos (siehe unten) |
| `setup_dev_container.p10k.zsh` | Optional | Eigenes P10k-Theme (sonst Lean-Preset automatisch) |

### Bezug im Repository

```
dev-container/                    # api-key-generator (Branch feature/coder-dev-container-setup)
├── setup_dev_container.sh
├── setup_dev_container.repos.conf
└── README.md                       # diese Dokumentation
```

### Confluence

| Inhalt | Wo einfügen |
|--------|-------------|
| Diese README (Anleitung) | Confluence-Seite als Fließtext |
| `setup_dev_container.sh` | **Separater Anhang** oder Link zum Git-Repo — nicht inline |
| `setup_dev_container.repos.conf` | Anhang oder Code-Block (kurz, siehe unten) |

### `setup_dev_container.repos.conf` (Vorlage)

```ini
# Git-Repositories für setup_dev_container.sh
#
# --- GitLab-Gruppe (empfohlen) ---
# Alle Projekte der Gruppe werden geladen; im Wizard per Checkbox ausgewählt.
# URL = Gruppen-Seite im Browser (Untergruppen inklusive).
# @gitlab-group|https://gitlab.company.com/deka/plattform
#
# Token optional als Umgebungsvariable: export GITLAB_TOKEN=glpat-...
# Bei privaten Gruppen fragt der Wizard nach einem Personal Access Token (read_api).
#
# --- Einzelne Repos (optional, zusätzlich zur Gruppe) ---
# Format: NAME|GIT_URL|ZIELPFAD (ZIELPFAD optional, Standard: /workspace/repos/NAME)
#
# mein-service|https://repo.deka.de/gruppe/mein-service.git
# frontend-app|https://gitlab.company.com/team/frontend-app.git
#
# Geklonte Repositories landen standardmäßig unter ~/repos (z. B. /home/coder/repos)
```

### `setup_dev_container.p10k.zsh` (optional)

Nur bei eigenem Theme — Standardmäßig installiert das Skript das **P10k-Lean-Preset** automatisch.

---

> **Fragen oder Erweiterungswünsche?** Setup-Skript by **Domenic Schumacher** — bei Fragen, Bugs oder Ideen gerne direkt melden.
