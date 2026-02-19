/**
 * Zentrale Prüfung: Sollen Debug-Logs (Console) ausgegeben werden?
 * Entspricht useDebug().showDebugMode: nur in DEV und wenn VITE_SHOW_DEBUG oder localStorage.debug gesetzt.
 */
export function isDebugLogEnabled(): boolean {
  if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) return false
  if (import.meta.env.VITE_SHOW_DEBUG === 'true') return true
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true'
  } catch {
    return false
  }
}

/**
 * Zentrale Debug-Log-Funktion: Loggt nur wenn Debug-Modus aktiviert ist.
 * Verwendet isDebugLogEnabled() für die Prüfung.
 */

export function debugLog(...args: unknown[]): void {
  if (isDebugLogEnabled()) {
    // eslint-disable-next-line no-console
    console.log(...args)
  }
}

/**
 * Zeigt eine Begrüßungsnachricht in der Konsole beim App-Start.
 * Wird nur im Development-Modus angezeigt (nur für interne Entwickler).
 */
export function showWelcomeMessage(): void {
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

  // Nur im Development-Modus anzeigen
  if (!isDev) return

  // Version aus version.yml (zur Build-Zeit eingefügt)
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0'

  const asciiArt = `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   ██████╗ ███████╗██╗  ██╗ █████╗ ██████╗  █████╗  ██████╗     ║
║   ██╔══██╗██╔════╝██║ ██╔╝██╔══██╗██╔══██╗██╔══██╗██╔════╝     ║
║   ██║  ██║█████╗  █████╔╝ ███████║██████╔╝███████║██║  ███╗    ║
║   ██║  ██║██╔══╝  ██╔═██╗ ██╔══██║██╔══██╗██╔══██║██║   ██║    ║
║   ██████╔╝███████╗██║  ██╗██║  ██║██║  ██║██║  ██║╚██████╔╝    ║
║   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝     ║
║                                                                ║
║              API Key Generator & Management                    ║
║         Version ${version}${' '.repeat(47 - version.length)}║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`

  // Primary-Farbe aus dem Farbschema: #e00 (rot)
  const primaryColor = '#e00'

  const styles = [
    `color: ${primaryColor}; font-weight: bold; font-size: 12px;`,
    'color: #6b7280; font-size: 11px;',
    `color: ${primaryColor}; font-size: 11px; font-weight: bold;`,
  ]

  // eslint-disable-next-line no-console
  console.log(`%c${asciiArt}`, styles[0])
  // eslint-disable-next-line no-console
  console.log(`%c🚀 App gestartet (Development Mode)`, styles[1])
  // eslint-disable-next-line no-console
  console.log(`%c🐛 Bei Bugs oder Anregungen melde dich gerne:`, styles[2])
  // Teams-Link für Kontakt
  const linkStyle = `color: ${primaryColor}; text-decoration: underline; cursor: pointer; font-size: 11px;`
  // eslint-disable-next-line no-console
  console.log('%c💬 Teams: Teams-Link kopieren und öffnen', linkStyle)
  // Link als Text für einfaches Kopieren
  // eslint-disable-next-line no-console
  console.log(
    `%c   → https://teams.microsoft.com/l/chat/0/0?users=domenic.schumacher@deka.de`,
    'color: #6b7280; font-size: 10px; font-family: monospace;',
  )
  // eslint-disable-next-line no-console
  console.log('─'.repeat(63))
}
