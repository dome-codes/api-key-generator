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
    console.log(...args)
  }
}

/**
 * Zeigt eine Begrüßungsnachricht in der Konsole beim App-Start.
 * Wird immer angezeigt (nicht nur im Debug-Modus), da es eine Info-Nachricht ist.
 */
export function showWelcomeMessage(): void {
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV
  const version = '1.0.0'
  
  const asciiArt = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ███████╗██╗  ██╗ █████╗ ██████╗  █████╗  ██████╗   ║
║   ██╔══██╗██╔════╝██║ ██╔╝██╔══██╗██╔══██╗██╔══██╗██╔════╝   ║
║   ██║  ██║█████╗  █████╔╝ ███████║██████╔╝███████║██║        ║
║   ██║  ██║██╔══╝  ██╔═██╗ ██╔══██║██╔══██╗██╔══██║██║        ║
║   ██████╔╝███████╗██║  ██╗██║  ██║██║  ██║██║  ██║╚██████╗   ║
║   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝   ║
║                                                               ║
║              API Key Generator & Management                    ║
║                      Version ${version}${' '.repeat(47 - version.length)}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`

  const styles = [
    'color: #3b82f6; font-weight: bold; font-size: 12px;',
    'color: #6b7280; font-size: 11px;',
    'color: #10b981; font-size: 11px;',
    'color: #f59e0b; font-size: 11px;',
  ]

  console.log(`%c${asciiArt}`, styles[0])
  console.log(
    `%c🚀 App gestartet${isDev ? ' (Development Mode)' : ''}`,
    styles[1],
  )
  console.log(
    `%c💡 Tipp: Setze localStorage.setItem('debug', 'true') für Debug-Logs`,
    styles[2],
  )
  console.log(
    `%c🐛 Bugs oder Anregungen? Kontaktiere: Domenic Schumacher`,
    styles[3],
  )
  console.log('─'.repeat(63))
}
