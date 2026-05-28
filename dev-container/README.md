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
| 4 | **Optionale Tools** | Node.js, Python, Java, Gradle, pnpm — via **Homebrew** (persistiert unter `~/.linuxbrew`) |
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

> **Warum zuerst?** Ohne Proxy schlagen `apt-get update`, `git clone` und `curl` (Homebrew-Installer) im Firmennetz oft still fehl. Der Proxy wird deshalb als erster Installationsschritt angewendet.

---

#### System-Updates (Bootstrap — flüchtig)

```bash
apt-get update && apt-get upgrade -y
apt-get install -y ca-certificates curl git wget gnupg
```

> **Nur Bootstrap:** Diese apt-Pakete landen unter `/usr` und sind nach Container-Neustart oft weg. Sie dienen nur dazu, Homebrew und Git-Repos initial zu bootstrappen.

---

#### Homebrew-Basis (persistent — immer)

Direkt nach dem Bootstrap wird Homebrew nach **`/home/coder/.linuxbrew`** installiert (Git-Clone, kein `/home/linuxbrew`):

| Was | Pfad |
|-----|------|
| Homebrew | `~/.linuxbrew/` |
| git, zsh, fontconfig | `~/.linuxbrew/bin/` |
| Node, Java, docker, … | `~/.linuxbrew/` (je nach Auswahl) |

> **Warum?** In Coder ist `/home/coder` persistent — alles darunter überlebt Workspace-Neustarts.

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

Je nach Auswahl im Fragebogen — **alles via Homebrew unter `~/.linuxbrew`**, plus **immer**:

- **git, zsh, fontconfig** (persistente Basis)
- **Meslo Nerd Fonts** → `~/.local/share/fonts`
- **Powerlevel10k** → `~/.powerlevel10k`
- **Coder Terminal-Font** → `~/.vscode/settings.json`

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

Falls `docker` fehlt, wird es via **Homebrew** nach `~/.linuxbrew` installiert (Login-Daten landen in `~/.docker/` — persistent). apt (`docker.io`) nur als Fallback.

> **Hinweis:** `cloudctl` muss im Container bereits vorinstalliert sein. Das Skript führt `cloudctl login` interaktiv aus — halte SSO/Token bereit.

---

## Installierte Tools & Dependencies

### Immer installiert / konfiguriert

| Tool | Zweck |
|------|-------|
| **Git** | Repository-Sync, Versionskontrolle |
| **Zsh** | Moderne, erweiterbare Shell |
| **Powerlevel10k** | Schnelles, informationsreiches Prompt-Theme |

### Optional (im Fragebogen wählbar — via Homebrew)

Dev-Tools werden unter **`~/.linuxbrew`** installiert und überleben Coder-Neustarts im User-Home.

| Tool | Warum wir das nutzen |
|------|----------------------|
| **Node.js** | Frontend/Backend im Node-Stack. Version aus `.nvmrc` oder `lts`. Installiert als Homebrew-Formula (`node` / `node@20`). |
| **Python** | Backend-Services, Skripte, ML/RAG-Pipelines. |
| **OpenJDK + Gradle** | Java/Spring-Services, Build-Tooling. |
| **pnpm** | Schneller Package Manager für Node-Monorepos — benötigt Node.js. |

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
| `~/.zshrc` | Proxy, Identität, Homebrew, P10k, MOTD |
| `~/.config/setup_dev_container/` | Coder: apt-Proxy-Kopie + Wiederherstellungs-Skript |
| `/etc/apt/apt.conf.d/95proxies` | APT-Proxy (flüchtig — Kopie im Home) |
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

pnpm benötigt **Node.js**. Im Fragebogen zuerst **Node.js** wählen, dann pnpm.

---

### Coder: Einstellungen verschwinden nach Neustart

**Ursache:** In Coder ist `/home/coder` persistent, der **Container-Root** (`/etc`, `/usr`, apt-Pakete) oft **flüchtig**. Wenn das Skript als **root** lief, landen Shell-Einstellungen in `/root` statt in `/home/coder`.

| Was | Speicherort | Nach Neustart |
|-----|-------------|---------------|
| Proxy (Shell, Git) | `~/.zshrc`, `~/.gitconfig` | ✅ bleibt |
| Proxy (apt) | `/etc/apt/…` + Kopie in `~/.config/setup_dev_container/` | ⚙️ Auto-Restore |
| **git, zsh, fontconfig, Node, Java, docker, …** | **`~/.linuxbrew/`** | ✅ bleibt — Auto-Restore |
| Fonts, P10k, VS Code | `~/.local/share/fonts`, `~/.powerlevel10k`, `~/.vscode` | ✅ bleibt |
| Repos | `~/repos/` | ✅ bleibt |
| apt-Bootstrap | `/usr` | ❌ flüchtig (nur für Erst-Setup nötig) |

**Wenn brew/node trotzdem fehlt**, typische Ursachen:

1. Setup lief als **root/sudo** → abgebrochen; Homebrew muss unter **`/home/coder/.linuxbrew`** liegen, nicht `/home/linuxbrew`
2. Terminal war **bash**, brew nur in `.zshrc` (Fix: Skript schreibt auch `.bashrc`)
3. **`~/.linuxbrew` gelöscht** aber Config noch da → beim Login läuft `restore-brew-tools.sh` automatisch
4. Coder-Home **nicht persistent** → `ls ~/.linuxbrew` prüfen; ggf. Admin wegen PVC

**Lösung:**

```bash
# Immer als User coder — ohne sudo:
cd ~/setup && ./setup_dev_container.sh

# Nach Container-Neustart:
setup-dev-container
```

Prüfen, ob Einstellungen im richtigen Home liegen:

```bash
echo "HOME=$HOME USER=$USER"
grep setup_dev_container ~/.zshrc
ls ~/.config/setup_dev_container/
ls -la ~/.linuxbrew/bin/brew 2>/dev/null || echo "Homebrew fehlt — setup-dev-container erneut"
exec zsh   # oder neues Terminal — restore-brew-tools.sh läuft beim Login
```

---

### Setup hängt nach Powerlevel10k / Shell-Konfiguration

**Ursache:** `chsh` (Standard-Shell auf zsh umstellen) blockiert in Containern oft auf einem Passwort-Prompt.

**Fix im Skript:** `chsh` läuft nur noch mit **3-Sekunden-Timeout**; bei Fehler geht das Setup weiter. Danach manuell:

```bash
exec zsh
```

P10k und Meslo-Font sind trotzdem in `~/.zshrc` und `~/.p10k.zsh` konfiguriert.

---

### Homebrew-Pfad prüfen

Homebrew muss **im User-Home** liegen — nicht neben `coder` unter `/home/linuxbrew`:

```bash
echo "HOME=$HOME"
brew --prefix    # Erwartung: /home/coder/.linuxbrew
ls -la ~/.linuxbrew/bin/brew
```

| Pfad | Persistenz in Coder |
|------|---------------------|
| `/home/coder/.linuxbrew` | ✅ ja (User-PVC) |
| `/home/linuxbrew/.linuxbrew` | ❌ oft flüchtig (System-Image) |

Das Skript installiert Brew per **Git-Clone direkt nach `~/.linuxbrew`** (nicht den offiziellen Installer, der oft `/home/linuxbrew` wählt). Vorhandenes `/home/linuxbrew` wird **ignoriert**; alte Einträge in `.zshrc`/`.bashrc` werden entfernt.

**Nach Umstellung:** Setup einmal neu als User `coder` ausführen — Tools werden in `~/.linuxbrew` nachinstalliert.

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
