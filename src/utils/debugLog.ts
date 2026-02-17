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
