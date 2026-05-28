#!/usr/bin/env bash
# setup_dev_container.sh – Interaktive Einrichtung eines Coder-Dev-Containers
# Autor: Domenic Schumacher — bei Fragen gerne melden
# Phase 1: Fragebogen (alle Eingaben sammeln)
# Phase 2: Installation (automatisch ausführen)
# Idempotent: kann gefahrlos mehrfach ausgeführt werden.
#
# Persistenz-Modell (Coder): Alles Wichtige unter $HOME (/home/coder)
#   ~/.linuxbrew/     Dev-Tools (Node, Java, git, zsh, docker, …)
#   ~/.local/         Fonts, bin/setup-dev-container
#   ~/.config/        Setup-State, Restore-Skripte, apt-Proxy-Kopie
#   ~/repos/          Git-Repositories
#   ~/.vscode/        Coder-Terminal-Einstellungen
# apt unter /usr     nur Bootstrap (flüchtig nach Container-Neustart)

set -uo pipefail

# ---------------------------------------------------------------------------
# Pfade & Konstanten
# ---------------------------------------------------------------------------
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Coder: Einstellungen immer unter /home/coder — nie unter /root
normalize_home_for_coder() {
  local coder_user="" coder_home=""

  if [[ -n "${CODER_WORKSPACE_OWNER:-}" ]]; then
    coder_user="$CODER_WORKSPACE_OWNER"
  elif [[ -n "${SUDO_USER:-}" && "$SUDO_USER" != root ]]; then
    coder_user="$SUDO_USER"
  elif id -u coder &>/dev/null 2>&1; then
    coder_user="coder"
  fi

  if [[ -n "$coder_user" ]]; then
    coder_home="$(getent passwd "$coder_user" 2>/dev/null | cut -d: -f6)"
  fi

  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    echo "❌ Bitte nicht als root/sudo ausführen — sonst landet Homebrew in /home/linuxbrew statt in ~/.linuxbrew." >&2
    echo "   In Coder als User 'coder' starten:" >&2
    echo "   cd ~/setup && ./setup_dev_container.sh" >&2
    exit 1
  fi

  if [[ -n "$coder_user" && -n "$coder_home" && -d "$coder_home" ]]; then
    if [[ "${HOME:-}" == /root* ]] || [[ "$(id -un 2>/dev/null || true)" == "$coder_user" ]]; then
      if [[ "${HOME:-}" != "$coder_home" ]]; then
        export HOME="$coder_home"
        export USER="$coder_user"
        export LOGNAME="$coder_user"
      fi
    fi
  fi
}

normalize_home_for_coder

readonly ZSHRC="${HOME}/.zshrc"
readonly SETUP_STATE_DIR="${HOME}/.config/setup_dev_container"
readonly SETUP_MARKER="setup_dev_container"
readonly REPOS_CONF="${SCRIPT_DIR}/setup_dev_container.repos.conf"
readonly SETUP_CONF="${SCRIPT_DIR}/setup_dev_container.conf"
readonly SETUP_CONF_LOCAL="${SCRIPT_DIR}/setup_dev_container.conf.local"
readonly SETUP_CONF_EXAMPLE="${SCRIPT_DIR}/setup_dev_container.conf.example"
readonly SETUP_AUTHOR="Domenic Schumacher"

# Schreibbares Workspace-Root: /workspace nur wenn beschreibbar, sonst $HOME (/home/coder)
resolve_workspace_root() {
  if [[ -n "${WORKSPACE_ROOT:-}" ]]; then
    printf '%s' "$WORKSPACE_ROOT"
    return 0
  fi
  if [[ -d /workspace && -w /workspace ]]; then
    printf '/workspace'
    return 0
  fi
  printf '%s' "$HOME"
}

resolve_repos_dir() {
  if [[ -n "${REPOS_DIR:-}" ]]; then
    printf '%s' "$REPOS_DIR"
    return 0
  fi
  if [[ -n "${WORKSPACE_DIR:-}" ]]; then
    printf '%s' "$WORKSPACE_DIR"
    return 0
  fi
  printf '%s/repos' "$(resolve_workspace_root)"
}

readonly WORKSPACE_ROOT="$(resolve_workspace_root)"
readonly DEFAULT_SETUP_DIR="${WORKSPACE_ROOT}/setup"
readonly DEFAULT_REPOS_DIR="${WORKSPACE_ROOT}/repos"
readonly REPOS_DIR="$(resolve_repos_dir)"

# Standard-Proxy im Coder/K8s-Cluster (Ubuntu)
readonly DEFAULT_CLUSTER_PROXY="http://internet-proxy.internet-proxy.svc.cluster.local:3128"
readonly DEFAULT_NO_PROXY="localhost,127.0.0.1,::1,.svc.cluster.local,.cluster.local"
readonly DEFAULT_DOCKER_REGISTRY="deka.jfrog.io"
readonly EXAMPLE_GIT_URL="https://repo.deka.de/gruppe/mein-service.git"

# Roadmap: alle Schritte im Skript
readonly -a ROADMAP_KEYS=(
  "q_proxy" "q_personal" "q_repos" "q_tools" "q_logins"
  "e_proxy" "e_system" "e_brew_base" "e_personal" "e_repos" "e_tools" "e_logins" "e_terminal" "e_done"
)
readonly -a ROADMAP_LABELS=(
  "Proxy-Einstellungen"
  "Persönliche Daten"
  "Git-Repositories wählen"
  "Optionale Tools wählen"
  "Docker & cloudctl Login"
  "Proxy anwenden"
  "System-Update (Bootstrap)"
  "Homebrew-Basis (persistent)"
  "Git & Identität setzen"
  "Repositories syncen"
  "Tools installieren"
  "Docker & cloudctl Login"
  "Terminal einrichten"
  "Fertig"
)
readonly -a ROADMAP_ICONS=(
  "🌐" "👤" "📁" "🛠️" "🔐"
  "🌐" "🔄" "🍺" "🔑" "🔀" "⚙️" "🔐" "💻" "🎉"
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
readonly ICON_JAVA="☕"
readonly ICON_GRADLE="🐘"
readonly ICON_BREW="🍺"
readonly HOMEBREW_PREFIX_DEFAULT="${HOME}/.linuxbrew"

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
CFG_INSTALL_JAVA=false
CFG_JAVA_VERSION="21"
CFG_INSTALL_GRADLE=false
CFG_SYNC_REPOS=false
CFG_GITLAB_GROUP_URL=""
CFG_GITLAB_TOKEN=""
CFG_DOCKER_LOGIN=false
CFG_DOCKER_REGISTRY=""
CFG_DOCKER_USER=""
CFG_DOCKER_TOKEN=""
CFG_CLOUDCTL_LOGIN=false
CFG_GIT_HTTP_USER=""
CFG_GIT_HTTP_PASSWORD=""
CFG_CONTINUE_ON_ERROR=true
CFG_SKIP_QUESTIONNAIRE=false
CFG_REPO_SELECT_ALL=false
QUESTIONNAIRE_SAVED_AT=""
SETUP_CONF_LOADED=0

# Erkennung aus Repo-Dateien (nach Auswahl / vorhandene Klone)
DETECT_NODE=false
DETECT_PYTHON=false
DETECT_JAVA=false
DETECT_GRADLE=false
DETECT_PNPM=false
DETECT_GRADLE_WRAPPER=false

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
  local answer default="${CFG_NUMBER_TYPE:-}"

  while true; do
    if [[ -n "$default" ]]; then
      echo -ne "${BLUE}Hast du eine E-Nummer oder B-Nummer? (e/b) [${default}]: ${NC}" >&2
    else
      echo -ne "${BLUE}Hast du eine E-Nummer oder B-Nummer? (e/b): ${NC}" >&2
    fi
    read -r answer || true
    [[ -z "$answer" && -n "$default" ]] && { printf '%s' "$default"; return 0; }
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

ask_git_url() {
  log_info "Beispiel-URL: ${EXAMPLE_GIT_URL}"
  ask_input "Git-URL"
}

bool_default_yn() {
  [[ "${1:-false}" == true ]] && printf 'j' || printf 'n'
}

is_conf_true() {
  case "$(tolower "$1")" in
    1|true|yes|ja|j|on) return 0 ;;
    *) return 1 ;;
  esac
}

apply_setup_conf_key() {
  local key="$1" value="$2"

  case "$key" in
    USE_PROXY|CFG_USE_PROXY)
      is_conf_true "$value" && CFG_USE_PROXY=true || CFG_USE_PROXY=false ;;
    PROXY_URL|CFG_PROXY_URL)
      CFG_PROXY_URL="$value"
      [[ -n "$value" ]] && CFG_USE_PROXY=true ;;
    USER_NAME|CFG_USER_NAME) CFG_USER_NAME="$value" ;;
    USER_EMAIL|CFG_USER_EMAIL) CFG_USER_EMAIL="$value" ;;
    NUMBER_TYPE|CFG_NUMBER_TYPE) CFG_NUMBER_TYPE="$(tolower "$value")" ;;
    E_NUMBER|CFG_E_NUMBER) CFG_E_NUMBER="$value" ;;
    B_NUMBER|CFG_B_NUMBER) CFG_B_NUMBER="$value" ;;
    DISPLAY_NAME|CFG_DISPLAY_NAME) CFG_DISPLAY_NAME="$value" ;;
    GITLAB_GROUP_URL|CFG_GITLAB_GROUP_URL) CFG_GITLAB_GROUP_URL="$value" ;;
    GITLAB_TOKEN|CFG_GITLAB_TOKEN) CFG_GITLAB_TOKEN="$value" ;;
    GIT_HTTP_USER|CFG_GIT_HTTP_USER) CFG_GIT_HTTP_USER="$value" ;;
    GIT_HTTP_PASSWORD|CFG_GIT_HTTP_PASSWORD) CFG_GIT_HTTP_PASSWORD="$value" ;;
    SYNC_REPOS|CFG_SYNC_REPOS)
      is_conf_true "$value" && CFG_SYNC_REPOS=true || CFG_SYNC_REPOS=false ;;
    REPO_SELECT_ALL|CFG_REPO_SELECT_ALL)
      is_conf_true "$value" && CFG_REPO_SELECT_ALL=true || CFG_REPO_SELECT_ALL=false ;;
    INSTALL_NODE|INSTALL_NVM|CFG_INSTALL_NVM)
      is_conf_true "$value" && CFG_INSTALL_NVM=true || CFG_INSTALL_NVM=false ;;
    NODE_VERSION|CFG_NODE_VERSION) CFG_NODE_VERSION="$value" ;;
    INSTALL_PYTHON|CFG_INSTALL_PYTHON)
      is_conf_true "$value" && CFG_INSTALL_PYTHON=true || CFG_INSTALL_PYTHON=false ;;
    INSTALL_PNPM|CFG_INSTALL_PNPM)
      is_conf_true "$value" && CFG_INSTALL_PNPM=true || CFG_INSTALL_PNPM=false ;;
    INSTALL_JAVA|CFG_INSTALL_JAVA)
      is_conf_true "$value" && CFG_INSTALL_JAVA=true || CFG_INSTALL_JAVA=false ;;
    JAVA_VERSION|CFG_JAVA_VERSION) CFG_JAVA_VERSION="$value" ;;
    INSTALL_GRADLE|CFG_INSTALL_GRADLE)
      is_conf_true "$value" && CFG_INSTALL_GRADLE=true || CFG_INSTALL_GRADLE=false ;;
    DOCKER_LOGIN|CFG_DOCKER_LOGIN)
      is_conf_true "$value" && CFG_DOCKER_LOGIN=true || CFG_DOCKER_LOGIN=false ;;
    DOCKER_REGISTRY|CFG_DOCKER_REGISTRY) CFG_DOCKER_REGISTRY="$value" ;;
    DOCKER_USER|CFG_DOCKER_USER) CFG_DOCKER_USER="$value" ;;
    DOCKER_TOKEN|CFG_DOCKER_TOKEN) CFG_DOCKER_TOKEN="$value" ;;
    CLOUDCTL_LOGIN|CFG_CLOUDCTL_LOGIN)
      is_conf_true "$value" && CFG_CLOUDCTL_LOGIN=true || CFG_CLOUDCTL_LOGIN=false ;;
    CONTINUE_ON_ERROR|CFG_CONTINUE_ON_ERROR)
      is_conf_true "$value" && CFG_CONTINUE_ON_ERROR=true || CFG_CONTINUE_ON_ERROR=false ;;
    SKIP_QUESTIONNAIRE|CFG_SKIP_QUESTIONNAIRE|AUTO_INSTALL)
      is_conf_true "$value" && CFG_SKIP_QUESTIONNAIRE=true || CFG_SKIP_QUESTIONNAIRE=false ;;
    *) return 1 ;;
  esac
  return 0
}

load_setup_conf_file() {
  local file="$1" key value line count=0

  [[ -f "$file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue

    key="${line%%=*}"
    value="${line#*=}"
    key="$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr '[:lower:]' '[:upper:]')"
    value="$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    value="${value%\"}"; value="${value#\"}"
    value="${value%\'}"; value="${value#\'}"

    apply_setup_conf_key "$key" "$value" && count=$((count + 1))
  done < "$file"

  SETUP_CONF_LOADED=$((SETUP_CONF_LOADED + count))
}

load_setup_conf() {
  SETUP_CONF_LOADED=0
  local conf_path="${SETUP_CONF_FILE:-}"

  if [[ -n "$conf_path" && -f "$conf_path" ]]; then
    load_setup_conf_file "$conf_path"
  else
    load_setup_conf_file "$SETUP_CONF"
    load_setup_conf_file "$SETUP_CONF_LOCAL"
  fi

  [[ -z "$CFG_NUMBER_TYPE" && -n "$CFG_E_NUMBER" ]] && CFG_NUMBER_TYPE="e"
  [[ -z "$CFG_NUMBER_TYPE" && -n "$CFG_B_NUMBER" ]] && CFG_NUMBER_TYPE="b"
  [[ -z "$CFG_DISPLAY_NAME" && -n "$CFG_USER_NAME" ]] && CFG_DISPLAY_NAME="$CFG_USER_NAME"
  [[ -n "${GITLAB_TOKEN:-}" && -z "$CFG_GITLAB_TOKEN" ]] && CFG_GITLAB_TOKEN="$GITLAB_TOKEN"

  return 0
}

conf_questionnaire_complete() {
  [[ -n "$CFG_USER_NAME" && -n "$CFG_USER_EMAIL" ]] || return 1
  [[ -n "$CFG_E_NUMBER" || -n "$CFG_B_NUMBER" ]] || return 1
  [[ -n "$CFG_NUMBER_TYPE" ]] || return 1
  return 0
}

prepare_repos_from_conf() {
  local default_group="" i

  default_group="$(read_repos_conf_directive "gitlab-group")"
  [[ -z "$CFG_GITLAB_GROUP_URL" && -n "$default_group" ]] && CFG_GITLAB_GROUP_URL="$default_group"

  if [[ -n "$CFG_GITLAB_GROUP_URL" ]]; then
    gitlab_load_group_projects "$CFG_GITLAB_GROUP_URL" "${CFG_GITLAB_TOKEN:-}" || true
  fi

  discover_git_repos false

  if [[ ${#REPO_NAME[@]} -eq 0 ]]; then
    CFG_SYNC_REPOS=false
    return 0
  fi

  if [[ "$CFG_SYNC_REPOS" == false ]]; then
    return 0
  fi

  if [[ "$CFG_REPO_SELECT_ALL" == true ]]; then
    REPO_SELECTED=()
    SELECTED_REPO_INDICES=()
    for i in "${!REPO_NAME[@]}"; do
      REPO_SELECTED[$i]=1
      SELECTED_REPO_INDICES+=("$i")
    done
    CFG_SYNC_REPOS=true
    snapshot_sync_repos_from_selection
  fi
}

on_step_error() {
  local label="$1"
  log_error "${label} fehlgeschlagen."
  if [[ "${CFG_CONTINUE_ON_ERROR:-true}" == true ]]; then
    log_info "→ Übersprungen — Setup läuft mit nächstem Schritt weiter."
    return 0
  fi
  if ask_yes_no "Schritt überspringen und fortfahren?" "j"; then
    return 0
  fi
  return 1
}

collect_git_hosts_from_sync_repos() {
  local url host
  for url in "${SYNC_REPO_URL[@]}"; do
    [[ -z "$url" ]] && continue
    if [[ "$url" =~ ^https?://([^/@]+@)?([^/:]+) ]]; then
      host="${BASH_REMATCH[2]}"
      [[ -n "$host" ]] && printf '%s\n' "$host"
    fi
  done | sort -u
}

configure_git_credentials() {
  [[ "$CFG_SYNC_REPOS" != true || ${#SYNC_REPO_URL[@]} -eq 0 ]] && return 0

  local cred_file="${HOME}/.git-credentials"
  git config --global credential.helper "store --file=${cred_file}"
  touch "$cred_file"
  chmod 600 "$cred_file" 2>/dev/null || true

  local hosts=() host
  while IFS= read -r host; do
    [[ -n "$host" ]] && hosts+=("$host")
  done < <(collect_git_hosts_from_sync_repos)

  if [[ ${#hosts[@]} -eq 0 ]]; then
    return 0
  fi

  for host in "${hosts[@]}"; do
    if [[ -n "${CFG_GITLAB_TOKEN:-}" ]] && [[ "$host" == *gitlab* ]]; then
      printf 'protocol=https\nhost=%s\nusername=oauth2\npassword=%s\n\n' \
        "$host" "$CFG_GITLAB_TOKEN" | git credential approve
    elif [[ -n "${CFG_GIT_HTTP_USER:-}" && -n "${CFG_GIT_HTTP_PASSWORD:-}" ]]; then
      printf 'protocol=https\nhost=%s\nusername=%s\npassword=%s\n\n' \
        "$host" "$CFG_GIT_HTTP_USER" "$CFG_GIT_HTTP_PASSWORD" | git credential approve
    fi
  done

  if [[ -n "${CFG_GITLAB_TOKEN:-}" || -n "${CFG_GIT_HTTP_USER:-}" || -s "$cred_file" ]]; then
    export GIT_TERMINAL_PROMPT=0
    log_success "Git-Zugangsdaten aktiv (~/.git-credentials) — kein erneutes Passwort pro Repo."
  fi

  unset CFG_GIT_HTTP_PASSWORD
}

prompt_git_http_credentials() {
  [[ "$CFG_SYNC_REPOS" != true ]] && return 0

  CFG_GITLAB_TOKEN="${CFG_GITLAB_TOKEN:-${GITLAB_TOKEN:-}}"

  if [[ -n "$CFG_GITLAB_TOKEN" ]]; then
    log_success "GitLab-Token vorhanden — Clone ohne wiederholte Passwort-Abfrage."
    return 0
  fi

  if [[ -f "${HOME}/.git-credentials" ]] && [[ -s "${HOME}/.git-credentials" ]]; then
    if ask_yes_no "Gespeicherte Git-Zugangsdaten (~/.git-credentials) verwenden?" "j"; then
      CFG_GIT_HTTP_USER="${CFG_GIT_HTTP_USER:-$(default_docker_username)}"
      return 0
    fi
  fi

  log_info "Git-Zugang einmalig — gilt für alle ausgewählten Repositories (gespeichert in ~/.git-credentials)."
  CFG_GIT_HTTP_USER="$(ask_input "Git-Benutzername (E- oder B-Nummer)" "${CFG_GIT_HTTP_USER:-$(default_docker_username)}")"
  CFG_GIT_HTTP_PASSWORD="$(ask_secret "Git-Passwort oder Personal Access Token")"
}

save_selected_repos_snapshot() {
  local f="${SETUP_STATE_DIR}/selected-repos.list"
  [[ "$CFG_SYNC_REPOS" != true || ${#SYNC_REPO_NAME[@]} -eq 0 ]] && {
    rm -f "$f"
    return 0
  }
  mkdir -p "$SETUP_STATE_DIR"
  : > "$f"
  local i
  for i in "${!SYNC_REPO_NAME[@]}"; do
    printf '%s|%s|%s\n' \
      "${SYNC_REPO_NAME[$i]}" "${SYNC_REPO_PATH[$i]}" "${SYNC_REPO_URL[$i]}" >> "$f"
  done
}

load_selected_repos_snapshot() {
  local f="${SETUP_STATE_DIR}/selected-repos.list"
  [[ -f "$f" ]] || return 1

  SYNC_REPO_NAME=()
  SYNC_REPO_PATH=()
  SYNC_REPO_URL=()
  local line name path url
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    IFS='|' read -r name path url <<< "$line"
    [[ -z "$name" ]] && continue
    SYNC_REPO_NAME+=("$name")
    SYNC_REPO_PATH+=("${path:-${REPOS_DIR}/${name}}")
    SYNC_REPO_URL+=("${url:-}")
  done < "$f"
  [[ ${#SYNC_REPO_NAME[@]} -gt 0 ]] && CFG_SYNC_REPOS=true
}

load_questionnaire_state() {
  local f="${SETUP_STATE_DIR}/questionnaire.env"
  [[ -f "$f" ]] || return 1
  # shellcheck source=/dev/null
  source "$f"
  return 0
}

save_questionnaire_state() {
  mkdir -p "$SETUP_STATE_DIR"
  chmod 700 "$SETUP_STATE_DIR" 2>/dev/null || true
  QUESTIONNAIRE_SAVED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  cat > "${SETUP_STATE_DIR}/questionnaire.env" <<EOF
# Gespeicherte Fragebogen-Antworten — Enter übernimmt beim erneuten Lauf
QUESTIONNAIRE_SAVED_AT="${QUESTIONNAIRE_SAVED_AT}"
CFG_USE_PROXY=${CFG_USE_PROXY}
CFG_PROXY_URL="${CFG_PROXY_URL}"
CFG_USER_NAME="${CFG_USER_NAME}"
CFG_USER_EMAIL="${CFG_USER_EMAIL}"
CFG_E_NUMBER="${CFG_E_NUMBER}"
CFG_B_NUMBER="${CFG_B_NUMBER}"
CFG_NUMBER_TYPE="${CFG_NUMBER_TYPE}"
CFG_DISPLAY_NAME="${CFG_DISPLAY_NAME}"
CFG_INSTALL_NVM=${CFG_INSTALL_NVM}
CFG_INSTALL_PYTHON=${CFG_INSTALL_PYTHON}
CFG_INSTALL_PNPM=${CFG_INSTALL_PNPM}
CFG_INSTALL_JAVA=${CFG_INSTALL_JAVA}
CFG_INSTALL_GRADLE=${CFG_INSTALL_GRADLE}
CFG_NODE_VERSION="${CFG_NODE_VERSION:-lts}"
CFG_JAVA_VERSION="${CFG_JAVA_VERSION:-21}"
CFG_SYNC_REPOS=${CFG_SYNC_REPOS}
CFG_GITLAB_GROUP_URL="${CFG_GITLAB_GROUP_URL}"
CFG_GIT_HTTP_USER="${CFG_GIT_HTTP_USER}"
CFG_DOCKER_LOGIN=${CFG_DOCKER_LOGIN}
CFG_DOCKER_REGISTRY="${CFG_DOCKER_REGISTRY}"
CFG_DOCKER_USER="${CFG_DOCKER_USER}"
CFG_CLOUDCTL_LOGIN=${CFG_CLOUDCTL_LOGIN}
CFG_CONTINUE_ON_ERROR=${CFG_CONTINUE_ON_ERROR}
EOF
  if [[ -n "${CFG_GITLAB_TOKEN:-}" ]]; then
    printf 'CFG_GITLAB_TOKEN="%s"\n' "$CFG_GITLAB_TOKEN" >> "${SETUP_STATE_DIR}/questionnaire.env"
  fi
  chmod 600 "${SETUP_STATE_DIR}/questionnaire.env" 2>/dev/null || true
  save_selected_repos_snapshot
}

show_questionnaire_summary() {
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
  echo -e "  ${ICON_GIT} ${DIM}Git-Repos:${NC}    $([[ "$CFG_SYNC_REPOS" == true ]] && echo "${#SYNC_REPO_NAME[@]} ausgewählt" || echo "übersprungen")"
  [[ -n "$CFG_GITLAB_GROUP_URL" ]] && echo -e "  ${ICON_GIT} ${DIM}GitLab-Gruppe:${NC} ${CFG_GITLAB_GROUP_URL}"
  echo -e "  ${ICON_NODE} ${DIM}Node.js:${NC}     $([[ "$CFG_INSTALL_NVM" == true ]] && echo "ja (${CFG_NODE_VERSION}, Homebrew)" || echo "nein")"
  echo -e "  ${ICON_PYTHON} ${DIM}Python:${NC}       $([[ "$CFG_INSTALL_PYTHON" == true ]] && echo "ja" || echo "nein")"
  echo -e "  ${ICON_PNPM} ${DIM}pnpm:${NC}         $([[ "$CFG_INSTALL_PNPM" == true ]] && echo "ja" || echo "nein")"
  echo -e "  ${ICON_JAVA} ${DIM}Java:${NC}         $([[ "$CFG_INSTALL_JAVA" == true ]] && echo "ja (OpenJDK ${CFG_JAVA_VERSION})" || echo "nein")"
  echo -e "  ${ICON_GRADLE} ${DIM}Gradle:${NC}       $([[ "$CFG_INSTALL_GRADLE" == true ]] && echo "ja" || echo "nein")"
  echo -e "  ${ICON_DOCKER} ${DIM}Docker login:${NC} $([[ "$CFG_DOCKER_LOGIN" == true ]] && echo "ja (${CFG_DOCKER_REGISTRY} / ${CFG_DOCKER_USER})" || echo "nein")"
  echo -e "  ${ICON_CLOUD} ${DIM}cloudctl login:${NC} $([[ "$CFG_CLOUDCTL_LOGIN" == true ]] && echo "ja" || echo "nein")"
  echo -e "  ${ICON_SHELL} ${DIM}Terminal:${NC}     ${ICON_ZSH} Zsh + ${ICON_P10K} Powerlevel10k (immer)"
  echo -e "  ⚙️  ${DIM}Bei Fehlern:${NC}   $([[ "$CFG_CONTINUE_ON_ERROR" == true ]] && echo "überspringen & weiter" || echo "nachfragen")"
  echo ""
}

default_docker_username() {
  if [[ "$CFG_NUMBER_TYPE" == "e" && -n "${CFG_E_NUMBER:-}" ]]; then
    printf '%s' "$CFG_E_NUMBER"
  elif [[ -n "${CFG_B_NUMBER:-}" ]]; then
    printf '%s' "$CFG_B_NUMBER"
  else
    printf '%s' "${CFG_E_NUMBER:-${CFG_B_NUMBER:-}}"
  fi
}

scan_repo_path_for_tooling() {
  local path="$1" repo_name="${2:-$(basename "$path")}"

  [[ -z "$path" || ! -d "$path" ]] && return 0

  if [[ -f "$path/package.json" ]]; then
    DETECT_NODE=true
    log_info "${ICON_FOLDER} ${repo_name}: package.json → Node.js"
    if [[ -f "$path/.nvmrc" ]]; then
      CFG_NODE_VERSION="$(sed 's/^[[:space:]]*v\?//' "$path/.nvmrc" | head -1 | tr -d '[:space:]')"
      log_info "  → .nvmrc: Node ${CFG_NODE_VERSION}"
    fi
    [[ -f "$path/pnpm-lock.yaml" || -f "$path/pnpm-workspace.yaml" ]] && {
      DETECT_PNPM=true
      log_info "  → pnpm-lock/workspace → pnpm"
    }
  fi

  if [[ -f "$path/requirements.txt" || -f "$path/pyproject.toml" || -f "$path/setup.py" || -f "$path/Pipfile" ]]; then
    DETECT_PYTHON=true
    log_info "${ICON_FOLDER} ${repo_name}: Python-Projekt erkannt"
  fi

  if [[ -f "$path/pom.xml" || -f "$path/build.gradle" || -f "$path/build.gradle.kts" ]]; then
    DETECT_JAVA=true
    log_info "${ICON_FOLDER} ${repo_name}: Java-Build (Maven/Gradle) → JDK"
  fi

  if [[ -f "$path/gradlew" ]]; then
    DETECT_JAVA=true
    DETECT_GRADLE_WRAPPER=true
    log_info "${ICON_FOLDER} ${repo_name}: gradlew vorhanden → JDK (Gradle Wrapper reicht)"
  elif [[ -f "$path/build.gradle" || -f "$path/build.gradle.kts" ]]; then
    DETECT_JAVA=true
    DETECT_GRADLE=true
    log_info "${ICON_FOLDER} ${repo_name}: Gradle-Build ohne Wrapper → Gradle-CLI empfohlen"
  fi
}

detect_selected_repo_tooling() {
  local path name

  DETECT_NODE=false
  DETECT_PYTHON=false
  DETECT_JAVA=false
  DETECT_GRADLE=false
  DETECT_PNPM=false
  DETECT_GRADLE_WRAPPER=false

  if [[ ${#SYNC_REPO_PATH[@]} -eq 0 ]]; then
    return 0
  fi

  echo ""
  log_info "Analysiere ausgewählte Repositories auf Tooling …"
  for path in "${SYNC_REPO_PATH[@]}"; do
    name="$(basename "$path")"
    scan_repo_path_for_tooling "$path" "$name"
  done

  if [[ "$DETECT_NODE" != true && "$DETECT_PYTHON" != true && "$DETECT_JAVA" != true ]]; then
    log_info "Noch keine Klone unter ${REPOS_DIR} — volle Erkennung nach dem Sync in Phase 2 möglich."
  fi
}

prompt_tools_from_repo_detection() {
  detect_selected_repo_tooling

  if [[ "$DETECT_NODE" != true && "$DETECT_PYTHON" != true && "$DETECT_JAVA" != true && "$DETECT_PNPM" != true ]]; then
    return 0
  fi

  echo ""
  log_info "Vorschläge aus Repo-Analyse (j/n bestätigen):"
  echo ""

  if [[ "$DETECT_NODE" == true ]]; then
    echo -e "${BOLD}  ${ICON_NODE} Node.js${NC} (erkannt, via Homebrew)"
    if ask_yes_no "Node.js installieren?" "j"; then
      CFG_INSTALL_NVM=true
      CFG_NODE_VERSION="$(ask_input "Node.js-Version" "${CFG_NODE_VERSION:-lts}")"
    fi
    echo ""
  fi

  if [[ "$DETECT_PNPM" == true ]]; then
    echo -e "${BOLD}  ${ICON_PNPM} pnpm${NC} (erkannt)"
    ask_yes_no "pnpm installieren?" "j" && CFG_INSTALL_PNPM=true
    echo ""
  fi

  if [[ "$DETECT_PYTHON" == true ]]; then
    echo -e "${BOLD}  ${ICON_PYTHON} Python${NC} (erkannt)"
    ask_yes_no "Python (pip, venv) installieren?" "j" && CFG_INSTALL_PYTHON=true
    echo ""
  fi

  if [[ "$DETECT_JAVA" == true ]]; then
    echo -e "${BOLD}  ${ICON_JAVA} Java (OpenJDK)${NC} (erkannt)"
    if ask_yes_no "OpenJDK installieren?" "j"; then
      CFG_INSTALL_JAVA=true
      CFG_JAVA_VERSION="$(ask_input "Java-Version (Major)" "${CFG_JAVA_VERSION:-21}")"
    fi
    echo ""
  fi

  if [[ "$DETECT_GRADLE" == true && "$DETECT_GRADLE_WRAPPER" != true ]]; then
    echo -e "${BOLD}  ${ICON_GRADLE} Gradle${NC} (erkannt, kein gradlew)"
    ask_yes_no "Gradle installieren?" "j" && CFG_INSTALL_GRADLE=true
    echo ""
  elif [[ "$DETECT_GRADLE_WRAPPER" == true ]]; then
    log_info "${ICON_GRADLE} gradlew in Repos — separates Gradle-Paket meist nicht nötig."
    echo ""
  fi
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

remove_bashrc_block() {
  local marker="$1"
  local bashrc="${HOME}/.bashrc"
  [[ -f "$bashrc" ]] || return 0
  sed -i.bak "/# ${marker}/,/# END ${marker}/d" "$bashrc" 2>/dev/null || \
    sed -i '' "/# ${marker}/,/# END ${marker}/d" "$bashrc" 2>/dev/null || true
  rm -f "${bashrc}.bak"
}

set_bashrc_block() {
  local marker="$1"
  local content="$2"
  local bashrc="${HOME}/.bashrc"
  touch "$bashrc"
  remove_bashrc_block "$marker"
  { echo ""; echo "# ${marker}"; echo "$content"; echo "# END ${marker}"; } >> "$bashrc"
}

# Wichtig für Coder: Bash-Terminal und Zsh-Terminal gleich konfigurieren
sync_shell_block() {
  set_zshrc_block "$1" "$2"
  set_bashrc_block "$1" "$2"
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

  # Coder: /etc/apt ist flüchtig — Kopie im Home für Wiederherstellung nach Container-Neustart
  mkdir -p "$SETUP_STATE_DIR"
  cat > "${SETUP_STATE_DIR}/apt-proxy.env" <<EOF
PROXY_URL="${proxy_url}"
EOF
  install_apt_proxy_restore_script
}

install_apt_proxy_restore_script() {
  mkdir -p "$SETUP_STATE_DIR"
  cat > "${SETUP_STATE_DIR}/restore-apt-proxy.sh" <<'RESTORE'
#!/usr/bin/env bash
# Stellt apt-Proxy nach Coder-Container-Neustart wieder her (/etc/apt ist flüchtig)
set -euo pipefail
state="${HOME}/.config/setup_dev_container/apt-proxy.env"
[[ -f "$state" ]] || exit 0
# shellcheck disable=SC1090
source "$state"
[[ -n "${PROXY_URL:-}" ]] || exit 0
[[ -f /etc/apt/apt.conf.d/95proxies ]] && exit 0

apply_proxy_files() {
  printf 'Acquire::http::Proxy "%s";\nAcquire::https::Proxy "%s";\n' "$PROXY_URL" "$PROXY_URL" \
    > /etc/apt/apt.conf.d/95proxies
  printf 'Acquire::ForceIPv4 "true";\n' > /etc/apt/apt.conf.d/98force-ipv4
}

if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
  apply_proxy_files
elif command -v sudo &>/dev/null; then
  sudo PROXY_URL="$PROXY_URL" bash -c '
    printf "Acquire::http::Proxy \"%s\";\nAcquire::https::Proxy \"%s\";\n" "$PROXY_URL" "$PROXY_URL" \
      > /etc/apt/apt.conf.d/95proxies
    printf "Acquire::ForceIPv4 \"true\";\n" > /etc/apt/apt.conf.d/98force-ipv4
  '
fi
RESTORE
  chmod +x "${SETUP_STATE_DIR}/restore-apt-proxy.sh"
}

restore_coder_ephemeral_config() {
  if [[ ! -f "${SETUP_STATE_DIR}/apt-proxy.env" ]]; then
    return 0
  fi
  if [[ -f /etc/apt/apt.conf.d/95proxies ]]; then
    return 0
  fi
  log_info "Coder: apt-Proxy aus ${SETUP_STATE_DIR} wiederherstellen …"
  "${SETUP_STATE_DIR}/restore-apt-proxy.sh" 2>/dev/null || \
    log_info "Hinweis: apt-Proxy-Wiederherstellung beim Login via ~/.zshrc erneut versucht."
}

save_coder_setup_state() {
  mkdir -p "$SETUP_STATE_DIR"
  cat > "${SETUP_STATE_DIR}/last-run.env" <<EOF
# Gespeichert von setup_dev_container.sh — für erneuten Lauf nach Container-Neustart
SAVED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
HOME="${HOME}"
CFG_USE_PROXY=${CFG_USE_PROXY}
CFG_PROXY_URL="${CFG_PROXY_URL}"
CFG_INSTALL_NVM=${CFG_INSTALL_NVM}
CFG_INSTALL_PYTHON=${CFG_INSTALL_PYTHON}
CFG_INSTALL_PNPM=${CFG_INSTALL_PNPM}
CFG_INSTALL_JAVA=${CFG_INSTALL_JAVA}
CFG_INSTALL_GRADLE=${CFG_INSTALL_GRADLE}
CFG_NODE_VERSION="${CFG_NODE_VERSION:-lts}"
REPOS_DIR="${REPOS_DIR}"
EOF
  install_restore_brew_script
}

install_restore_brew_script() {
  mkdir -p "$SETUP_STATE_DIR"
  cat > "${SETUP_STATE_DIR}/restore-brew-tools.sh" <<'RESTORE'
#!/usr/bin/env bash
# Stellt Homebrew-Tools nach Coder-Neustart wieder her (fehlende Formulae nachinstallieren)
set -euo pipefail
state="${HOME}/.config/setup_dev_container/last-run.env"
[[ -f "$state" ]] || exit 0
# shellcheck disable=SC1090
source "$state"

load_brew() {
  if [[ -x "${HOME}/.linuxbrew/bin/brew" ]]; then
    eval "$("${HOME}/.linuxbrew/bin/brew" shellenv)"
  else
    return 1
  fi
}

load_brew || exit 0
export HOMEBREW_NO_AUTO_UPDATE=1

install_if_missing() {
  local pkg="$1"
  brew list --formula "$pkg" &>/dev/null 2>&1 && return 0
  brew install "$pkg" >/dev/null 2>&1 || true
}

# Basis-Stack — immer persistent unter ~/.linuxbrew
for _base_pkg in git zsh fontconfig; do
  install_if_missing "$_base_pkg"
done
[[ "${CFG_DOCKER_LOGIN:-false}" == true ]] && install_if_missing docker

[[ "${CFG_INSTALL_NVM:-false}" == true ]] && {
  ver="${CFG_NODE_VERSION:-lts}"
  if [[ "$ver" =~ ^[0-9]+$ ]]; then
    brew list --formula "node@${ver}" &>/dev/null 2>&1 || install_if_missing "node@${ver}" || install_if_missing node
  else
    install_if_missing node
  fi
}
[[ "${CFG_INSTALL_PNPM:-false}" == true ]] && install_if_missing pnpm
[[ "${CFG_INSTALL_PYTHON:-false}" == true ]] && install_if_missing python
[[ "${CFG_INSTALL_JAVA:-false}" == true ]] && {
  jver="${CFG_JAVA_VERSION:-21}"
  brew list --formula "openjdk@${jver}" &>/dev/null 2>&1 || install_if_missing "openjdk@${jver}" || install_if_missing openjdk
}
[[ "${CFG_INSTALL_GRADLE:-false}" == true ]] && install_if_missing gradle
RESTORE
  chmod +x "${SETUP_STATE_DIR}/restore-brew-tools.sh"
  rm -f "${SETUP_STATE_DIR}/restore-node.sh"
}

install_coder_shell_hooks() {
  set_zshrc_block "${SETUP_MARKER}: coder-restore" "$(cat <<'HOOK'
# Nach Coder-Container-Neustart: apt-Proxy + Homebrew-Tools
if [[ -f "$HOME/.config/setup_dev_container/restore-apt-proxy.sh" ]]; then
  "$HOME/.config/setup_dev_container/restore-apt-proxy.sh" 2>/dev/null || true
fi
if [[ -f "$HOME/.config/setup_dev_container/restore-brew-tools.sh" ]]; then
  "$HOME/.config/setup_dev_container/restore-brew-tools.sh" 2>/dev/null || true
fi
HOOK
)"
  set_bashrc_block "${SETUP_MARKER}: coder-restore" "$(cat <<'HOOK'
# Nach Coder-Container-Neustart: apt-Proxy + Homebrew-Tools
if [[ -f "$HOME/.config/setup_dev_container/restore-apt-proxy.sh" ]]; then
  "$HOME/.config/setup_dev_container/restore-apt-proxy.sh" 2>/dev/null || true
fi
if [[ -f "$HOME/.config/setup_dev_container/restore-brew-tools.sh" ]]; then
  "$HOME/.config/setup_dev_container/restore-brew-tools.sh" 2>/dev/null || true
fi
HOOK
)"
}

remove_legacy_nvm_blocks() {
  remove_zshrc_block "${SETUP_MARKER}: nvm"
  remove_bashrc_block "${SETUP_MARKER}: nvm"
}

remove_legacy_system_linuxbrew_shell() {
  local rc
  for rc in "${HOME}/.zshrc" "${HOME}/.bashrc"; do
    [[ -f "$rc" ]] || continue
    sed -i.bak '/\/home\/linuxbrew\/\.linuxbrew/d' "$rc" 2>/dev/null || \
      sed -i '' '/\/home\/linuxbrew\/\.linuxbrew/d' "$rc" 2>/dev/null || true
    rm -f "${rc}.bak"
  done
}

strip_system_linuxbrew_from_path() {
  local cleaned="" part
  IFS=':' read -ra _path_parts <<< "${PATH:-}"
  for part in "${_path_parts[@]}"; do
    [[ -z "$part" ]] && continue
    [[ "$part" == /home/linuxbrew/* ]] && continue
    cleaned+="${part}:"
  done
  export PATH="${cleaned%:}"
}

configure_brew_shell_profile() {
  sync_shell_block "${SETUP_MARKER}: brew" "$(cat <<'EOF'
# Homebrew (Linux) — persistiert unter ~/.linuxbrew (/home/coder/.linuxbrew)
if [[ -x "${HOME}/.linuxbrew/bin/brew" ]]; then
  eval "$("${HOME}/.linuxbrew/bin/brew" shellenv)"
fi
EOF
)"
}

brew_prefix_ok() {
  local prefix
  prefix="$(brew --prefix 2>/dev/null || true)"
  [[ "$prefix" == "${HOME}/.linuxbrew" ]]
}

ensure_brew_in_path() {
  strip_system_linuxbrew_from_path
  if [[ ! -x "${HOME}/.linuxbrew/bin/brew" ]]; then
    return 1
  fi
  # shellcheck source=/dev/null
  eval "$("${HOME}/.linuxbrew/bin/brew" shellenv)"
  export HOMEBREW_NO_AUTO_UPDATE=1
  brew_prefix_ok
}

install_homebrew_user_local() {
  local prefix="${HOME}/.linuxbrew"
  local brew_repo="${prefix}/Homebrew"

  strip_system_linuxbrew_from_path
  remove_legacy_system_linuxbrew_shell

  if [[ -d /home/linuxbrew/.linuxbrew && ! -x "${prefix}/bin/brew" ]]; then
    log_info "${ICON_BREW} Vorhandenes /home/linuxbrew wird ignoriert — Ziel: ${prefix} (User-Home, persistent)."
  fi

  mkdir -p "${prefix}/Cellar" "${prefix}/bin"

  if [[ ! -d "${brew_repo}/.git" ]]; then
    log_info "${ICON_BREW} Klone Homebrew-Core nach ${brew_repo} …"
    if command -v timeout &>/dev/null; then
      timeout 180 git clone --depth=1 https://github.com/Homebrew/brew "${brew_repo}" || return 1
    else
      git clone --depth=1 https://github.com/Homebrew/brew "${brew_repo}" || return 1
    fi
  fi

  ln -sf "${brew_repo}/bin/brew" "${prefix}/bin/brew"
  ensure_brew_in_path || return 1

  log_info "${ICON_BREW} Homebrew-Basis einrichten …"
  brew update --force >/dev/null 2>&1 || brew update >/dev/null 2>&1 || true
  configure_brew_shell_profile
  brew_prefix_ok
}

install_homebrew() {
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    log_error "Homebrew darf nicht als root installiert werden (Ziel: ${HOME}/.linuxbrew)."
    return 1
  fi

  if ensure_brew_in_path 2>/dev/null; then
    configure_brew_shell_profile
    log_info "${ICON_BREW} Homebrew vorhanden: $(brew --prefix 2>/dev/null)"
    return 0
  fi

  log_info "${ICON_BREW} Installiere Homebrew (Linux) nach ${HOMEBREW_PREFIX_DEFAULT} …"
  run_apt install -y --no-install-recommends build-essential procps file 2>/dev/null || true

  install_homebrew_user_local || {
    log_error "Homebrew-Installation fehlgeschlagen (erwartet: ${HOME}/.linuxbrew)."
    return 1
  }

  ensure_brew_in_path || {
    log_error "Homebrew liegt nicht unter ${HOME}/.linuxbrew (aktuell: $(brew --prefix 2>/dev/null || echo ?))."
    return 1
  }
  log_success "${ICON_BREW} Homebrew installiert: $(brew --prefix)"
  remove_legacy_nvm_blocks
}

brew_install_formula() {
  local pkg="$1"
  ensure_brew_in_path || return 1
  if brew list --formula "$pkg" &>/dev/null 2>&1; then
    log_info "${ICON_BREW} ${pkg} bereits installiert."
    return 0
  fi
  log_info "${ICON_BREW} brew install ${pkg} …"
  brew install "$pkg"
}

install_node_via_brew() {
  local ver="${CFG_NODE_VERSION:-lts}"
  if [[ "$ver" =~ ^[0-9]+$ ]]; then
    brew_install_formula "node@${ver}" 2>/dev/null || brew_install_formula node
  else
    brew_install_formula node
  fi
  log_success "${ICON_NODE} Node.js $(node --version 2>/dev/null || echo installiert) via Homebrew"
}

install_java_via_brew() {
  local pkg="openjdk@${CFG_JAVA_VERSION}"
  brew_install_formula "$pkg" 2>/dev/null || brew_install_formula openjdk
  local prefix
  prefix="$(brew --prefix "$pkg" 2>/dev/null || brew --prefix openjdk 2>/dev/null || true)"
  if [[ -n "$prefix" ]]; then
    sync_shell_block "${SETUP_MARKER}: java" "$(cat <<EOF
export JAVA_HOME="${prefix}"
export PATH="\${JAVA_HOME}/bin:\${PATH}"
EOF
)"
  fi
  log_success "${ICON_JAVA} Java via Homebrew $(java -version 2>&1 | head -1 || true)"
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
  if ! mkdir -p "$REPOS_DIR" 2>/dev/null; then
    log_error "Konnte ${REPOS_DIR} nicht anlegen (Permission denied)."
    log_info "Tipp: REPOS_DIR setzen, z. B. export REPOS_DIR=\"\${HOME}/repos\""
    return 1
  fi
  log_success "Repos-Ordner bereit — geklonte Repositories landen hier."
}

ensure_setup_hint() {
  if [[ "$SCRIPT_DIR" != "$DEFAULT_SETUP_DIR" ]]; then
    log_info "Skript liegt in: ${SCRIPT_DIR}"
    log_info "Empfohlen: ${DEFAULT_SETUP_DIR}/ (Skripte dorthin kopieren)"
  fi
  log_info "Coder-Home: ${HOME} · Repos: ${REPOS_DIR} · State: ${SETUP_STATE_DIR}"
  if [[ -f "${SETUP_STATE_DIR}/last-run.env" ]]; then
    log_info "Vorheriges Setup gefunden — bei Container-Neustart: setup-dev-container erneut ausführen (apt-Pakete sind flüchtig)."
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
  # Coder: User-Settings unter $HOME/.vscode persistieren (nicht flüchtiges /workspace)
  local settings_dir="${HOME}/.vscode"
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

set_default_shell_zsh() {
  local zsh_path
  zsh_path="$(command -v zsh 2>/dev/null || true)"
  [[ -n "$zsh_path" ]] || return 0
  [[ "${SHELL:-}" == "$zsh_path" ]] && return 0

  # chsh wartet in Containern oft auf Passwort — nur kurz versuchen, nie blockieren
  if command -v timeout &>/dev/null; then
    if timeout 3 chsh -s "$zsh_path" 2>/dev/null; then
      log_success "Standard-Shell → zsh"
      return 0
    fi
    if [[ -n "$SUDO" ]]; then
      timeout 3 $SUDO -n chsh -s "$zsh_path" "$USER" 2>/dev/null && {
        log_success "Standard-Shell → zsh (via sudo)"
        return 0
      }
    fi
  fi

  log_info "Standard-Shell unverändert (chsh blockiert/verweigert). Bitte: ${CYAN}exec zsh${NC}"
}

declare -a REPO_NAME=() REPO_PATH=() REPO_URL=() REPO_BRANCH=() REPO_STATUS=()
declare -a SELECTED_REPO_INDICES=() REPO_SELECTED=()
declare -a SYNC_REPO_NAME=() SYNC_REPO_PATH=() SYNC_REPO_URL=()
declare -a GITLAB_PROJECT_NAME=() GITLAB_PROJECT_URL=()
GITLAB_CACHE_KEY=""

read_repos_conf_directive() {
  local directive="$1"
  [[ -f "$REPOS_CONF" ]] || return 0
  grep -E "^@${directive}\\|" "$REPOS_CONF" 2>/dev/null | head -1 | cut -d'|' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

gitlab_load_group_projects() {
  local group_url="$1" token="${2:-}" proxy="${3:-}"
  local cache_key output err_line http_code

  [[ -z "$group_url" ]] && return 1

  if [[ "$CFG_USE_PROXY" == true && -n "$CFG_PROXY_URL" ]]; then
    proxy="$CFG_PROXY_URL"
  fi

  cache_key="${group_url}|${token}|${proxy}"
  if [[ "$GITLAB_CACHE_KEY" == "$cache_key" && ${#GITLAB_PROJECT_NAME[@]} -gt 0 ]]; then
    return 0
  fi

  if ! command -v python3 &>/dev/null; then
    log_error "python3 wird für die GitLab-Gruppen-Abfrage benötigt."
    return 1
  fi

  if ! command -v curl &>/dev/null; then
    log_error "curl wird für die GitLab-Gruppen-Abfrage benötigt."
    return 1
  fi

  log_info "Lade Repository-Liste von GitLab …"

  local err_file out_file
  err_file="$(mktemp)"
  out_file="$(mktemp)"

  if ! GITLAB_GROUP_URL="$group_url" \
       GITLAB_TOKEN="$token" \
       GITLAB_PROXY="$proxy" \
       python3 <<'PY' >"$out_file" 2>"$err_file"
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

group_url = os.environ.get("GITLAB_GROUP_URL", "").strip().rstrip("/")
token = os.environ.get("GITLAB_TOKEN", "").strip()
proxy = os.environ.get("GITLAB_PROXY", "").strip()

if not group_url:
    print("ERROR:0|Keine GitLab-Gruppen-URL", file=sys.stderr)
    sys.exit(1)

stripped = re.sub(r"/-/.*$", "", group_url)
match = re.match(r"^(https?://[^/]+)/(.+)$", stripped)
if not match:
    print("ERROR:0|Ungültige GitLab-Gruppen-URL", file=sys.stderr)
    sys.exit(1)

base = match.group(1)
path = match.group(2).strip("/")
if path.startswith("groups/"):
    path = path[7:]

encoded = urllib.parse.quote(path, safe="")
handlers = []
if proxy:
    handlers.append(urllib.request.ProxyHandler({"http": proxy, "https": proxy}))
opener = urllib.request.build_opener(*handlers)

projects = []
page = 1
while True:
    api = (
        f"{base}/api/v4/groups/{encoded}/projects"
        f"?include_subgroups=true&per_page=100&page={page}"
        f"&order_by=path&sort=asc&with_shared=false"
    )
    req = urllib.request.Request(api)
    if token:
        req.add_header("PRIVATE-TOKEN", token)
    try:
        with opener.open(req, timeout=45) as resp:
            batch = json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        print(f"ERROR:{exc.code}|GitLab API HTTP {exc.code}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as exc:
        print(f"ERROR:0|{exc.reason}", file=sys.stderr)
        sys.exit(1)

    if not batch:
        break
    projects.extend(batch)
    if len(batch) < 100:
        break
    page += 1

for project in projects:
    name = project.get("path") or project.get("name") or ""
    url = project.get("http_url_to_repo") or project.get("ssh_url_to_repo") or ""
    if name and url:
        print(f"{name}|{url}")
PY
  then
    if [[ -s "$err_file" ]]; then
      sed 's/^/    /' "$err_file" >&2
    fi
    rm -f "$out_file" "$err_file"
    log_error "GitLab-Gruppe konnte nicht geladen werden."
    return 1
  fi

  if [[ -s "$err_file" ]]; then
    err_line="$(head -1 "$err_file")"
    if [[ "$err_line" == ERROR:* ]]; then
      http_code="${err_line#ERROR:}"
      http_code="${http_code%%|*}"
      sed 's/^/    /' "$err_file" >&2
      rm -f "$out_file" "$err_file"
      log_error "GitLab-Gruppe nicht erreichbar (HTTP ${http_code:-?})."
      return 1
    fi
  fi

  GITLAB_PROJECT_NAME=()
  GITLAB_PROJECT_URL=()
  while IFS='|' read -r name url; do
    [[ -z "$name" || -z "$url" ]] && continue
    GITLAB_PROJECT_NAME+=("$name")
    GITLAB_PROJECT_URL+=("$url")
  done < "$out_file"

  rm -f "$out_file" "$err_file"
  GITLAB_CACHE_KEY="$cache_key"

  if [[ ${#GITLAB_PROJECT_NAME[@]} -eq 0 ]]; then
    log_info "GitLab-Gruppe enthält keine Projekte (oder kein Lesezugriff)."
  fi

  return 0
}

discover_gitlab_group_repos() {
  local do_fetch="${1:-false}" i

  [[ -z "$CFG_GITLAB_GROUP_URL" ]] && return 0

  if [[ ${#GITLAB_PROJECT_NAME[@]} -eq 0 ]]; then
    gitlab_load_group_projects "$CFG_GITLAB_GROUP_URL" "${CFG_GITLAB_TOKEN:-${GITLAB_TOKEN:-}}" || return 0
  fi

  for i in "${!GITLAB_PROJECT_NAME[@]}"; do
    add_repo_entry \
      "${GITLAB_PROJECT_NAME[$i]}" \
      "${REPOS_DIR}/${GITLAB_PROJECT_NAME[$i]}" \
      "${GITLAB_PROJECT_URL[$i]}" \
      "$do_fetch"
  done
}

prompt_gitlab_group() {
  local default_group gitlab_default="n"

  default_group="$(read_repos_conf_directive "gitlab-group")"
  [[ -n "$default_group" ]] && gitlab_default="y"

  if ! ask_yes_no "Repositories aus GitLab-Gruppe laden?" "$gitlab_default"; then
    return 0
  fi

  CFG_GITLAB_GROUP_URL="$(ask_input "GitLab-Gruppen-URL (URL der Gruppe im Browser)" "${default_group}")"
  if [[ -z "$CFG_GITLAB_GROUP_URL" ]]; then
    log_error "Keine GitLab-Gruppen-URL — übersprungen."
    return 0
  fi

  CFG_GITLAB_TOKEN="${GITLAB_TOKEN:-}"

  if ! gitlab_load_group_projects "$CFG_GITLAB_GROUP_URL" "$CFG_GITLAB_TOKEN"; then
    if ask_yes_no "GitLab-Zugang erfordert ggf. Token — Personal Access Token eingeben?" "y"; then
      CFG_GITLAB_TOKEN="$(ask_secret "GitLab Token (Scope: read_api)")"
      gitlab_load_group_projects "$CFG_GITLAB_GROUP_URL" "$CFG_GITLAB_TOKEN" || {
        log_error "GitLab-Gruppe konnte nicht geladen werden."
        return 1
      }
    else
      log_info "GitLab-Gruppe übersprungen."
      CFG_GITLAB_GROUP_URL=""
      return 0
    fi
  fi

  if [[ ${#GITLAB_PROJECT_NAME[@]} -gt 0 ]]; then
    log_success "${#GITLAB_PROJECT_NAME[@]} Repositories in GitLab-Gruppe gefunden."
  else
    log_info "Keine Repositories in der Gruppe gefunden."
  fi
}

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

  discover_gitlab_group_repos "$do_fetch"

  while IFS= read -r git_dir; do
    add_repo_entry "$(basename "$(dirname "$git_dir")")" "$(dirname "$git_dir")" "" "$do_fetch"
  done < <(find "$REPOS_DIR" -maxdepth 3 -name .git -type d 2>/dev/null | sort)

  if [[ -f "$REPOS_CONF" ]]; then
    while IFS='|' read -r name url target || [[ -n "$name" ]]; do
      [[ -z "$name" || "$name" =~ ^[[:space:]]*# ]] && continue
      name="$(echo "$name" | xargs)"
      [[ "$name" == @* ]] && continue
      url="$(echo "$url" | xargs)"
      target="$(echo "${target:-}" | xargs)"
      [[ -z "$name" || -z "$url" ]] && continue
      add_repo_entry "$name" "${target:-${REPOS_DIR}/${name}}" "$url" "$do_fetch"
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
    if ask_yes_no "GitLab-Gruppe laden oder Repository manuell hinzufügen?" "y"; then
      if ask_yes_no "GitLab-Gruppe laden?" "y"; then
        prompt_gitlab_group
        discover_git_repos false
      fi
    fi
    if [[ ${#REPO_NAME[@]} -eq 0 ]]; then
      if ask_yes_no "Einzelnes Repository manuell hinzufügen?" "n"; then
        local name url target
        name="$(ask_input "Repository-Name")"
        url="$(ask_git_url)"
        target="$(ask_input "Zielpfad" "${REPOS_DIR}/${name}")"
        add_repo_entry "$name" "$target" "$url" false
      else
        CFG_SYNC_REPOS=false
        return 0
      fi
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
  finalize_sync_repo_list
  CFG_SYNC_REPOS=true
}

finalize_sync_repo_list() {
  SYNC_REPO_NAME=()
  SYNC_REPO_PATH=()
  SYNC_REPO_URL=()
  local idx
  for idx in "${SELECTED_REPO_INDICES[@]}"; do
    [[ -z "${REPO_NAME[$idx]:-}" ]] && continue
    SYNC_REPO_NAME+=("${REPO_NAME[$idx]}")
    SYNC_REPO_PATH+=("${REPO_PATH[$idx]:-}")
    SYNC_REPO_URL+=("${REPO_URL[$idx]:-}")
  done
}

sync_single_repo_entry() {
  local name="$1" path="$2" url="$3"
  local log_file; log_file="$(mktemp)"
  local -a git_cmd=(git)

  if [[ "${GIT_TERMINAL_PROMPT:-1}" == "0" ]]; then
    git_cmd=(env GIT_TERMINAL_PROMPT=0 git)
  fi

  if [[ ! -d "${path}/.git" ]]; then
    [[ -z "$url" ]] && { log_error "${ICON_FOLDER} ${name}: keine URL – übersprungen."; rm -f "$log_file"; return 1; }
    mkdir -p "$(dirname "$path")" 2>/dev/null || {
      log_error "${name}: Zielordner ${path} nicht anlegbar."
      rm -f "$log_file"; return 1
    }
    if "${git_cmd[@]}" clone --progress "$url" "$path" >"$log_file" 2>&1; then
      rm -f "$log_file"; return 0
    fi
    log_error "${name}: Clone fehlgeschlagen."; tail -3 "$log_file" | sed 's/^/    /'
    rm -f "$log_file"; return 1
  fi

  if "${git_cmd[@]}" -C "$path" pull --progress --ff-only >"$log_file" 2>&1 || \
     "${git_cmd[@]}" -C "$path" pull --progress >"$log_file" 2>&1; then
    rm -f "$log_file"; return 0
  fi
  log_error "${name}: Pull fehlgeschlagen."; tail -3 "$log_file" | sed 's/^/    /'
  rm -f "$log_file"; return 1
}

sync_single_repo() {
  local idx="$1"
  sync_single_repo_entry "${REPO_NAME[$idx]:-}" "${REPO_PATH[$idx]:-}" "${REPO_URL[$idx]:-}"
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

  load_setup_conf
  if [[ "$SETUP_CONF_LOADED" -gt 0 ]]; then
    log_success "${SETUP_CONF_LOADED} Einstellungen aus setup_dev_container.conf geladen."
    log_info "Conf: ${SETUP_CONF_LOCAL} (lokal) oder ${SETUP_CONF} — Vorlage: ${SETUP_CONF_EXAMPLE}"
  elif [[ ! -f "$SETUP_CONF_LOCAL" && -f "$SETUP_CONF_EXAMPLE" ]]; then
    log_info "Tipp: cp setup_dev_container.conf.example setup_dev_container.conf.local — Werte vorab eintragen."
  fi

  if [[ "$CFG_SKIP_QUESTIONNAIRE" == true ]] && conf_questionnaire_complete; then
    prepare_repos_from_conf
    [[ "$CFG_SYNC_REPOS" == true ]] && prompt_git_http_credentials
    show_questionnaire_summary
    if ask_yes_no "Installation mit Conf-Werten starten?" "j"; then
      return 0
    fi
    log_info "Fragebogen wird trotzdem durchlaufen …"
  fi

  if load_questionnaire_state; then
    load_selected_repos_snapshot || true
    log_info "Gespeicherte Einstellungen gefunden (${QUESTIONNAIRE_SAVED_AT:-?})."
    if ask_yes_no "Fragebogen überspringen und gespeicherte Werte verwenden?" "j"; then
      show_questionnaire_summary
      if ask_yes_no "Installation starten?" "j"; then
        return 0
      fi
      log_info "Fragebogen wird erneut durchlaufen — Enter übernimmt gespeicherte Standardwerte."
    else
      log_info "Gespeicherte Werte als Voreinstellung — Enter übernimmt Standardwerte."
    fi
  fi

  # --- 1/5 Proxy ---
  section_header "q_proxy" "🌐 Frage 1/5 · Proxy" "Brauchst du einen Firmen-Proxy?"
  if ask_yes_no "Proxy konfigurieren?" "$(bool_default_yn "$CFG_USE_PROXY")"; then
    CFG_USE_PROXY=true
    local proxy_default
    proxy_default="${CFG_PROXY_URL:-$(detect_default_proxy_url)}"
    if [[ "$proxy_default" == "$DEFAULT_CLUSTER_PROXY" ]]; then
      log_info "Cluster-Proxy erkannt (internet-proxy.internet-proxy.svc.cluster.local)."
    fi
    CFG_PROXY_URL="$(ask_input "Proxy-URL" "$proxy_default")"
    log_success "Proxy wird eingerichtet: ${CFG_PROXY_URL}"
    log_info "apt: 95proxies + ForceIPv4 (98force-ipv4) werden gesetzt."
  else
    CFG_USE_PROXY=false
    log_info "Kein Proxy."
  fi

  # --- 2/5 Persönliche Daten ---
  section_header "q_personal" "👤 Frage 2/5 · Persönliche Daten" "Git-Identität und Container-Variablen."
  CFG_USER_NAME="$(ask_input "Wie ist dein Name?" "${CFG_USER_NAME}")"
  CFG_USER_EMAIL="$(ask_input "Wie lautet deine E-Mail-Adresse?" "${CFG_USER_EMAIL}")"
  CFG_NUMBER_TYPE="$(ask_number_type)"
  if [[ "$CFG_NUMBER_TYPE" == "e" ]]; then
    CFG_E_NUMBER="$(ask_input "Wie lautet deine E-Nummer?" "${CFG_E_NUMBER}")"
    CFG_B_NUMBER=""
  else
    CFG_B_NUMBER="$(ask_input "Wie lautet deine B-Nummer?" "${CFG_B_NUMBER}")"
    CFG_E_NUMBER=""
  fi
  CFG_DISPLAY_NAME="$(ask_input "Wie möchtest du gerne genannt werden?" "${CFG_DISPLAY_NAME:-${CFG_USER_NAME}}")"
  log_success "Persönliche Daten erfasst."

  # --- 3/5 Git-Repos ---
  section_header "q_repos" "📁 Frage 3/5 · Git-Repositories" "GitLab-Gruppe laden und Repositories auswählen."
  log_info "${ICON_WORKSPACE} Repos-Ordner: ${REPOS_DIR} (wird bei Installation angelegt)"
  if [[ "$CFG_SYNC_REPOS" == true && ${#SYNC_REPO_NAME[@]} -gt 0 ]]; then
    if ask_yes_no "Gespeicherte Repository-Auswahl (${#SYNC_REPO_NAME[@]} Repos) beibehalten?" "j"; then
      log_success "${#SYNC_REPO_NAME[@]} Repositories aus gespeichertem Lauf übernommen."
    else
      prompt_gitlab_group
      select_repos_interactive
    fi
  else
    prompt_gitlab_group
    select_repos_interactive
  fi
  if [[ "$CFG_SYNC_REPOS" == true ]]; then
    prompt_git_http_credentials
    log_success "${#SYNC_REPO_NAME[@]} Repository/Repositories ausgewählt."
  else
    log_info "Repository-Sync wird übersprungen."
  fi

  # --- 4/5 Optionale Tools ---
  section_header "q_tools" "🛠️  Frage 4/5 · Optionale Tools" "Automatische Erkennung aus Repos + manuelle Auswahl."
  prompt_tools_from_repo_detection
  echo ""
  log_info "Weitere Tools manuell hinzufügen (falls nicht erkannt):"
  echo ""
  if [[ "$CFG_INSTALL_NVM" != true ]]; then
    echo -e "${BOLD}  ${ICON_NODE} Node.js${NC} (via Homebrew)"
    if ask_yes_no "Node.js installieren?" "n"; then
      CFG_INSTALL_NVM=true
      CFG_NODE_VERSION="$(ask_input "Node.js-Version" "lts")"
    fi
    echo ""
  fi
  if [[ "$CFG_INSTALL_PYTHON" != true ]]; then
    echo -e "${BOLD}  ${ICON_PYTHON} Python${NC}"
    ask_yes_no "Python (und pip) installieren?" "n" && CFG_INSTALL_PYTHON=true
    echo ""
  fi
  if [[ "$CFG_INSTALL_PNPM" != true ]]; then
    echo -e "${BOLD}  ${ICON_PNPM} pnpm${NC}"
    ask_yes_no "pnpm installieren?" "n" && CFG_INSTALL_PNPM=true
    echo ""
  fi
  if [[ "$CFG_INSTALL_JAVA" != true ]]; then
    echo -e "${BOLD}  ${ICON_JAVA} Java (OpenJDK)${NC}"
    if ask_yes_no "OpenJDK installieren?" "n"; then
      CFG_INSTALL_JAVA=true
      CFG_JAVA_VERSION="$(ask_input "Java-Version (Major)" "21")"
    fi
    echo ""
  fi
  if [[ "$CFG_INSTALL_GRADLE" != true ]]; then
    echo -e "${BOLD}  ${ICON_GRADLE} Gradle${NC}"
    ask_yes_no "Gradle installieren?" "n" && CFG_INSTALL_GRADLE=true
    echo ""
  fi

  # --- 5/5 Docker & cloudctl ---
  section_header "q_logins" "🔐 Frage 5/5 · Docker & cloudctl" "Registry- und Cloud-Zugang einrichten."
  echo ""
  echo -e "${BOLD}  ${ICON_DOCKER} Docker Registry Login${NC}"
  if ask_yes_no "Docker login durchführen?" "$(bool_default_yn "$CFG_DOCKER_LOGIN")"; then
    CFG_DOCKER_LOGIN=true
    CFG_DOCKER_REGISTRY="$(ask_input "Registry-URL" "${CFG_DOCKER_REGISTRY:-$DEFAULT_DOCKER_REGISTRY}")"
    CFG_DOCKER_USER="$(ask_input "Docker-Benutzername (E- oder B-Nummer)" "${CFG_DOCKER_USER:-$(default_docker_username)}")"
    if ask_yes_no "Token/Passwort jetzt eingeben? (Enter = interaktiv in Phase 2)" "n"; then
      CFG_DOCKER_TOKEN="$(ask_secret "Docker Token/Passwort")"
    fi
    log_success "Docker login geplant für: ${CFG_DOCKER_REGISTRY}"
  else
    log_info "Docker login übersprungen."
  fi
  echo ""
  echo -e "${BOLD}  ${ICON_CLOUD} cloudctl Login${NC}"
  if ask_yes_no "cloudctl login durchführen?" "$(bool_default_yn "$CFG_CLOUDCTL_LOGIN")"; then
    CFG_CLOUDCTL_LOGIN=true
    log_success "cloudctl login wird in Phase 2 interaktiv ausgeführt."
    log_info "Halte ggf. Browser/Token bereit (SSO)."
  else
    log_info "cloudctl login übersprungen."
  fi

  echo ""
  if ask_yes_no "Bei Fehlern in Phase 2 automatisch überspringen und fortfahren?" "$(bool_default_yn "$CFG_CONTINUE_ON_ERROR")"; then
    CFG_CONTINUE_ON_ERROR=true
  else
    CFG_CONTINUE_ON_ERROR=false
  fi

  show_questionnaire_summary

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
  sync_shell_block "${SETUP_MARKER}: proxy" "$(cat <<EOF
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

  install_coder_shell_hooks

  echo ""; echo ""
  log_success "Proxy aktiv (apt, Shell, Git) + ForceIPv4 für apt."
  log_info "Coder: Proxy-Kopie in ${SETUP_STATE_DIR}/ — wird nach Container-Neustart automatisch für apt wiederhergestellt."
}

exec_system_update() {
  section_header "e_system" "🔄 Installation · System-Update (Bootstrap)"

  local labels=("${ICON_APT} Paketlisten" "⬆️  Upgrade" "📦 apt-Bootstrap")
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
  log_success "System-Bootstrap abgeschlossen (apt unter /usr — flüchtig)."
  log_info "Persistente Dev-Tools folgen unter ${HOME}/.linuxbrew …"
}

exec_install_persistent_base() {
  section_header "e_brew_base" "🍺 Installation · Persistente Basis (${HOME})"

  draw_progress_bar 1 2 "${ICON_BREW} Homebrew → ${HOME}/.linuxbrew …"
  install_homebrew || { on_step_error "Homebrew-Basis"; return 0; }

  draw_progress_bar 2 2 "${ICON_GIT} git (persistent via Homebrew) …"
  brew_install_formula git || on_step_error "git (Homebrew)" || true

  install_restore_brew_script
  echo ""
  log_success "Persistente Basis: ${HOME}/.linuxbrew (git, später zsh, docker, Dev-Tools)"
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
  sync_shell_block "${SETUP_MARKER}: identity" "$identity_exports"
  sync_shell_block "${SETUP_MARKER}: repos" "$(cat <<EOF
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

  if [[ "$CFG_SYNC_REPOS" != true ]] || [[ ${#SYNC_REPO_NAME[@]} -eq 0 ]]; then
    log_info "Übersprungen."
    return 0
  fi

  configure_git_credentials

  if [[ "$CFG_SYNC_REPOS" == true ]] && [[ ! -s "${HOME}/.git-credentials" ]] \
    && [[ -z "${CFG_GITLAB_TOKEN:-}" ]] && [[ -z "${CFG_GIT_HTTP_PASSWORD:-}" ]]; then
    log_info "Git-Zugangsdaten für Clone benötigt …"
    prompt_git_http_credentials
    configure_git_credentials
  fi

  ensure_repos_directory || { on_step_error "Repos-Ordner anlegen"; return 0; }
  local total="${#SYNC_REPO_NAME[@]}" current=0 ok=0 fail=0 i

  for i in "${!SYNC_REPO_NAME[@]}"; do
    current=$((current + 1))
    local repo_icon="${ICON_PULL}"
    [[ ! -d "${SYNC_REPO_PATH[$i]}/.git" ]] && repo_icon="${ICON_CLONE}"
    draw_progress_bar "$current" "$((total + 1))" "${repo_icon} ${SYNC_REPO_NAME[$i]} …"
    sync_single_repo_entry "${SYNC_REPO_NAME[$i]}" "${SYNC_REPO_PATH[$i]}" "${SYNC_REPO_URL[$i]}" \
      && ok=$((ok + 1)) || fail=$((fail + 1))
  done

  draw_progress_bar "$((total + 1))" "$((total + 1))" "Fertig!"
  echo ""; echo ""
  log_success "${ok}/${total} Repositories synchronisiert."
  [[ "$fail" -gt 0 ]] && {
    log_error "${fail} Fehler."
    on_step_error "Repository-Sync (${fail} fehlgeschlagen)" || true
  }

  # Nach frischem Clone: Tooling-Hinweis (Installation war vor dem Sync geplant)
  if [[ "$ok" -gt 0 ]]; then
    detect_selected_repo_tooling
    [[ "$DETECT_JAVA" == true && "$CFG_INSTALL_JAVA" != true ]] && \
      log_info "Java-Projekte erkannt — ggf. Setup erneut mit OpenJDK-Option oder: brew install openjdk@${CFG_JAVA_VERSION:-21}"
    [[ "$DETECT_NODE" == true && "$CFG_INSTALL_NVM" != true ]] && \
      log_info "Node-Projekte erkannt — ggf. Node.js via Homebrew nachinstallieren"
  fi
}

exec_install_tools() {
  section_header "e_tools" "⚙️  Installation · Optionale Tools (Homebrew)"

  local steps=0 current=0
  [[ "$CFG_INSTALL_NVM" == true || "$CFG_INSTALL_PYTHON" == true || "$CFG_INSTALL_PNPM" == true \
    || "$CFG_INSTALL_JAVA" == true || "$CFG_INSTALL_GRADLE" == true ]] || {
    log_info "Keine optionalen Tools gewählt – übersprungen."
    return 0
  }

  steps=1
  [[ "$CFG_INSTALL_JAVA" == true ]] && steps=$((steps + 1))
  [[ "$CFG_INSTALL_GRADLE" == true ]] && steps=$((steps + 1))
  [[ "$CFG_INSTALL_NVM" == true ]] && steps=$((steps + 1))
  [[ "$CFG_INSTALL_PYTHON" == true ]] && steps=$((steps + 1))
  [[ "$CFG_INSTALL_PNPM" == true ]] && steps=$((steps + 1))

  current=$((current + 1))
  draw_progress_bar "$current" "$steps" "${ICON_BREW} Homebrew prüfen …"
  install_homebrew || { on_step_error "Homebrew"; return 0; }

  if [[ "$CFG_INSTALL_JAVA" == true ]]; then
    echo -e "${BOLD}  ${ICON_JAVA} Java (OpenJDK)${NC}"
    current=$((current + 1))
    draw_progress_bar "$current" "$steps" "${ICON_JAVA} OpenJDK ${CFG_JAVA_VERSION} …"
    install_java_via_brew
  fi

  if [[ "$CFG_INSTALL_GRADLE" == true ]]; then
    echo -e "${BOLD}  ${ICON_GRADLE} Gradle${NC}"
    current=$((current + 1))
    draw_progress_bar "$current" "$steps" "${ICON_GRADLE} Gradle installieren …"
    brew_install_formula gradle
    log_success "${ICON_GRADLE} Gradle $(gradle --version 2>/dev/null | grep Gradle | head -1 || echo installiert)"
  fi

  if [[ "$CFG_INSTALL_NVM" == true ]]; then
    echo -e "${BOLD}  ${ICON_NODE} Node.js${NC}"
    current=$((current + 1))
    draw_progress_bar "$current" "$steps" "${ICON_NODE} Node.js ${CFG_NODE_VERSION} …"
    install_node_via_brew
  fi

  if [[ "$CFG_INSTALL_PYTHON" == true ]]; then
    echo -e "${BOLD}  ${ICON_PYTHON} Python${NC}"
    current=$((current + 1))
    draw_progress_bar "$current" "$steps" "${ICON_PYTHON} Python installieren …"
    brew_install_formula python
    log_success "${ICON_PYTHON} Python $(python3 --version 2>/dev/null | cut -d' ' -f2 || python --version 2>/dev/null | cut -d' ' -f2)"
  fi

  if [[ "$CFG_INSTALL_PNPM" == true ]]; then
    echo -e "${BOLD}  ${ICON_PNPM} pnpm${NC}"
    current=$((current + 1))
    draw_progress_bar "$current" "$steps" "${ICON_PNPM} pnpm installieren …"
    brew_install_formula pnpm
    log_success "${ICON_PNPM} pnpm $(pnpm --version 2>/dev/null || echo installiert)"
  fi

  install_restore_brew_script
  log_info "${ICON_BREW} Dev-Tools unter $(brew --prefix) (persistiert in \$HOME)"
  echo ""
}

ensure_docker_cli() {
  if command -v docker &>/dev/null; then
    return 0
  fi
  if ensure_brew_in_path 2>/dev/null; then
    log_info "Docker CLI via Homebrew (${HOME}/.linuxbrew) …"
    brew_install_formula docker && return 0
  fi
  log_info "Docker CLI via apt (flüchtig unter /usr) — für Persistenz: Homebrew-Basis aktivieren."
  run_apt install -y docker.io
}

exec_docker_login() {
  if [[ "$CFG_DOCKER_LOGIN" != true ]]; then
    return 0
  fi

  ensure_docker_cli || {
    on_step_error "Docker CLI" || return 1
  }

  local registry="${CFG_DOCKER_REGISTRY:-$DEFAULT_DOCKER_REGISTRY}"
  local user="${CFG_DOCKER_USER:-}"

  if [[ -n "$CFG_DOCKER_TOKEN" && -n "$user" ]]; then
    if echo "$CFG_DOCKER_TOKEN" | docker login "$registry" -u "$user" --password-stdin; then
      log_success "${ICON_DOCKER} Docker login erfolgreich (${registry})."
      return 0
    fi
    log_error "${ICON_DOCKER} Docker login fehlgeschlagen (Token/User)."
    on_step_error "Docker login" || return 1
    return 0
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
    on_step_error "Docker login" || return 1
  fi
}

exec_cloudctl_login() {
  if [[ "$CFG_CLOUDCTL_LOGIN" != true ]]; then
    return 0
  fi

  if ! command -v cloudctl &>/dev/null; then
    on_step_error "cloudctl nicht im PATH" || return 1
    return 0
  fi

  log_info "${ICON_CLOUD} cloudctl login (interaktiv) …"
  if cloudctl login; then
    log_success "${ICON_CLOUD} cloudctl login erfolgreich."
  else
    on_step_error "cloudctl login" || return 1
  fi
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

  install_homebrew || { on_step_error "Homebrew"; return 0; }

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "${ICON_ZSH} Zsh & fontconfig (Homebrew) …"
  brew_install_formula zsh || on_step_error "zsh (Homebrew)" || true
  brew_install_formula fontconfig || on_step_error "fontconfig (Homebrew)" || true

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "🔤 Meslo Nerd Fonts installieren …"
  install_meslo_nerd_fonts

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "${ICON_P10K} Powerlevel10k klonen …"
  if [[ ! -d "$p10k_dir" ]]; then
    if command -v timeout &>/dev/null; then
      timeout 120 git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "$p10k_dir" \
        || log_error "Powerlevel10k-Clone fehlgeschlagen (Netzwerk/Proxy prüfen)."
    else
      git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "$p10k_dir" \
        || log_error "Powerlevel10k-Clone fehlgeschlagen (Netzwerk/Proxy prüfen)."
    fi
  fi

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "🎨 P10k-Lean Preset (nerdfont) …"
  [[ -d "$p10k_dir" ]] && install_p10k_preset "$p10k_dir"

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "${ICON_SHELL} Shell konfigurieren …"
  if [[ -d "$p10k_dir" ]]; then
    set_zshrc_block "${SETUP_MARKER}: powerlevel10k" "$(cat <<EOF
# Meslo Nerd Font + offizielles P10k-Lean-Preset (Ordner-Icons, Git-Status)
source ${p10k_dir}/powerlevel10k.zsh-theme
[[ -f ~/.p10k.zsh ]] && source ~/.p10k.zsh
EOF
)"
  fi
  set_default_shell_zsh

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "🖥️  Coder Terminal-Font setzen …"
  configure_coder_terminal_font

  step=$((step + 1)); draw_progress_bar "$step" "$total_steps" "Fertig!"
  echo ""; echo ""
  install_restore_brew_script
  log_success "Terminal eingerichtet (${ICON_ZSH} Zsh + ${ICON_P10K} P10k + 🔤 Meslo Nerd Font)."
  log_info "Alles persistent unter ${HOME}: .linuxbrew, .local/share/fonts, .powerlevel10k, .vscode"
}

link_setup_scripts() {
  local bin_dir="${HOME}/.local/bin"
  local link_name="${bin_dir}/setup-dev-container"
  local setup_link="${WORKSPACE_ROOT}/setup"

  mkdir -p "$bin_dir"
  ln -sf "${SCRIPT_DIR}/setup_dev_container.sh" "$link_name"

  # ~/.local/bin in PATH (idempotent)
  sync_shell_block "${SETUP_MARKER}: path" 'export PATH="${HOME}/.local/bin:${PATH}"'

  log_success "Befehl verlinkt: setup-dev-container → ${SCRIPT_DIR}/setup_dev_container.sh"

  # Optional: ~/setup als Symlink — nur wenn Skript woanders liegt
  if [[ "$SCRIPT_DIR" != "$setup_link" && "$SCRIPT_DIR" != "$DEFAULT_SETUP_DIR" ]]; then
    if [[ ! -e "$setup_link" ]] && [[ -w "$(dirname "$setup_link")" ]]; then
      ln -sfn "$SCRIPT_DIR" "$setup_link"
      log_success "Symlink: ${setup_link} → ${SCRIPT_DIR}"
    fi
  fi
}

print_finish() {
  save_coder_setup_state
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
  echo -e "${DIM}  Persistenz (Coder — alles unter ${HOME}):${NC}"
  echo -e "${DIM}    · Dev-Tools (git, zsh, Node, Java, docker, …) → ${HOME}/.linuxbrew${NC}"
  echo -e "${DIM}    · Shell/Proxy/Git → ${HOME}/.zshrc, .bashrc & .gitconfig${NC}"
  echo -e "${DIM}    · Fonts → ${HOME}/.local/share/fonts · P10k → ${HOME}/.powerlevel10k${NC}"
  echo -e "${DIM}    · Repos → ${REPOS_DIR} · Setup-State → ${SETUP_STATE_DIR}/${NC}"
  echo -e "${DIM}    · apt unter /usr → nur Bootstrap, flüchtig — Proxy-Kopie wird automatisch restored${NC}"
  echo ""
  echo -e "${DIM}  Nächster Schritt:${NC}  ${ICON_SHELL} ${CYAN}${BOLD}exec zsh${NC}"
  echo -e "${DIM}  Setup erneut starten:${NC}  ${CYAN}${BOLD}setup-dev-container${NC}"
  echo ""
}

run_installation() {
  echo ""
  echo -e "${BOLD}  ⚙️  Phase 2: Installation startet …${NC}"
  echo -e "${DIM}  Alle Schritte laufen automatisch durch.${NC}"
  echo -e "${DIM}  Ziel-Home: ${HOME}${NC}"
  echo ""

  restore_coder_ephemeral_config
  if [[ -f "${SETUP_STATE_DIR}/restore-brew-tools.sh" ]]; then
    log_info "Prüfe Homebrew-Tools unter ${HOME}/.linuxbrew …"
    "${SETUP_STATE_DIR}/restore-brew-tools.sh" 2>/dev/null || true
  fi
  apply_proxy
  exec_system_update
  exec_install_persistent_base
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
  save_questionnaire_state
  run_installation
}

main "$@"
