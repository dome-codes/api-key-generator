import { useRoute, useRouter } from 'vue-router'
import { computed, watch } from 'vue'

/**
 * Composable für URL-Query-Parameter-basierte Filter
 * Synchronisiert Filter-State mit URL-Query-Parametern
 */
export function useUrlFilters() {
  const route = useRoute()
  const router = useRouter()

  /**
   * Liest einen Query-Parameter als String
   */
  const getQueryParam = (key: string): string | undefined => {
    const value = route.query[key]
    if (typeof value === 'string') {
      return value
    }
    if (Array.isArray(value) && value.length > 0) {
      return value[0] as string
    }
    return undefined
  }

  /**
   * Liest einen Query-Parameter als Number
   */
  const getQueryParamAsNumber = (key: string): number | undefined => {
    const value = getQueryParam(key)
    if (value === undefined) return undefined
    const num = Number.parseInt(value, 10)
    return Number.isNaN(num) ? undefined : num
  }

  /**
   * Setzt Query-Parameter in der URL
   */
  const setQueryParams = (params: Record<string, string | number | undefined>) => {
    const query = { ...route.query }

    // Entferne undefined-Werte
    Object.keys(params).forEach((key) => {
      const value = params[key]
      if (value === undefined || value === '') {
        delete query[key]
      } else {
        query[key] = String(value)
      }
    })

    router.replace({ query })
  }

  /**
   * Setzt einen einzelnen Query-Parameter
   */
  const setQueryParam = (key: string, value: string | number | undefined) => {
    setQueryParams({ [key]: value })
  }

  /**
   * Entfernt alle Filter-Parameter aus der URL
   */
  const clearQueryParams = (keys?: string[]) => {
    const query = { ...route.query }
    if (keys) {
      keys.forEach((key) => {
        delete query[key]
      })
    } else {
      // Entferne alle Filter-relevanten Parameter
      const filterKeys = [
        'tab',
        'timeRange',
        'fromDate',
        'toDate',
        'modelType',
        'model',
        'tag',
        'apiKeyId',
        'userId',
        'userGroup',
        'provider',
        'status',
        'page',
        'limit',
        'sort',
        'order',
        'view',
      ]
      filterKeys.forEach((key) => {
        delete query[key]
      })
    }
    router.replace({ query })
  }

  return {
    getQueryParam,
    getQueryParamAsNumber,
    setQueryParam,
    setQueryParams,
    clearQueryParams,
    route,
  }
}
