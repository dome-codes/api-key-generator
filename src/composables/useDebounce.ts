import { ref, watch, type Ref } from 'vue'

/**
 * Composable für Debouncing von Werten
 * @param source - Der zu debouncende Wert (ref)
 * @param delay - Verzögerung in Millisekunden (Standard: 300ms)
 * @returns Debounced ref
 */
export function useDebounce<T>(source: Ref<T>, delay: number = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  watch(
    source,
    (newValue) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        debounced.value = newValue
        timeoutId = null
      }, delay)
    },
    { immediate: true },
  )

  return debounced
}

/**
 * Composable für Debounced Callbacks
 * @param fn - Die zu debouncende Funktion
 * @param delay - Verzögerung in Millisekunden (Standard: 300ms)
 * @returns Debounced Funktion
 */
export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}
