# Usage API - Paralleler Strang für Server-Side Filtering

## Übersicht

Dieser parallele Strang implementiert die server-seitige Filterung und Gruppierung über die API. Er läuft parallel zum bestehenden `useUsage` Composable, das die Client-seitige Logik enthält.

## Unterschiede

### useUsage (Bestehend - Client-Side)
- Lädt alle Daten vom Server
- Filterung und Gruppierung erfolgt im Frontend
- Keine Pagination
- Verwendet `usageAnalyticsService`

### useUsageApi (Neu - Server-Side)
- Filterung erfolgt server-seitig über API-Parameter
- Pagination wird vollständig über die API gehandhabt
- Gruppierung erfolgt server-seitig über den `by` Parameter
- Keine Client-seitige Filterung oder Gruppierung
- Verwendet `usageApiService`

## Verwendung

### Basis-Beispiel

```typescript
import { useUsageApi } from '@/composables/useUsageApi'

const {
  usageData,
  pagination,
  isLoading,
  error,
  loadUsageData,
  loadUsageSummary,
  nextPage,
  previousPage,
  updateFilter,
} = useUsageApi()

// Daten laden mit Filter
await loadUsageData({
  fromDate: '2025-01-01T00:00:00Z',
  toDate: '2025-12-31T23:59:59Z',
  page: 1,
  limit: 20,
  userId: 'user-123',
  tag: 'production',
  model: 'gpt-4o',
  modelType: 'CompletionModelUsage',
})

// Summary mit Gruppierung laden
await loadUsageSummary({
  fromDate: '2025-01-01T00:00:00Z',
  toDate: '2025-12-31T23:59:59Z',
  page: 1,
  limit: 20,
  groupBy: ['day', 'month', 'year'],
  tag: 'production',
})
```

### Filter aktualisieren

```typescript
// Filter ändern (setzt automatisch page auf 1 zurück)
await updateFilter({
  userId: 'user-456',
  model: 'gpt-4o-mini',
})

// Zur nächsten Seite
await nextPage()

// Zu bestimmter Seite
await goToPage(3)
```

### Admin-Ansicht

```typescript
const hasAdminPermission = await hasPermission('canViewAdminUsage')

await loadUsageData(
  {
    fromDate: '2025-01-01T00:00:00Z',
    toDate: '2025-12-31T23:59:59Z',
    page: 1,
    limit: 50,
  },
  hasAdminPermission // useAdminApi = true für Admin
)
```

## Verfügbare Filter-Parameter

- `fromDate`: Startdatum (ISO 8601)
- `toDate`: Enddatum (ISO 8601)
- `page`: Seitennummer (1-basiert)
- `limit`: Anzahl Einträge pro Seite (1-100)
- `userId`: Filter nach User-ID
- `tag`: Filter nach Tag
- `apiKey`: Filter nach API-Key-ID
- `model`: Filter nach Modell-Name
- `usageType`: Filter nach Nutzungstyp in der API (`COMPLETION_USAGE`, `EMBEDDING_USAGE`, `IMAGE_USAGE`). Die UI verwendet weiterhin Modelltyp-Labels (z. B. CompletionModelUsage), die vor dem API-Call gemappt werden.
- `groupBy`: Array von Gruppierungsfeldern (`['day', 'month', 'year', 'tag', 'apiKey', 'model', 'user']`)

## Migration

### Schrittweise Migration

1. **Phase 1**: Neue Features nutzen `useUsageApi`
2. **Phase 2**: Bestehende Features schrittweise migrieren
3. **Phase 3**: `useUsage` als Legacy-Markierung behalten, aber nicht mehr verwenden

### Beispiel-Migration

**Vorher (Client-Side)**:
```typescript
const { loadUsageSummary } = useUsage()
await loadUsageSummary({ fromDate: '2025-01-01', toDate: '2025-12-31' })
// Filterung im Frontend
const filtered = computed(() => {
  return usageData.value.filter(item => item.tag === 'production')
})
```

**Nachher (Server-Side)**:
```typescript
const { loadUsageSummary, usageData } = useUsageApi()
await loadUsageSummary({
  fromDate: '2025-01-01T00:00:00Z',
  toDate: '2025-12-31T23:59:59Z',
  tag: 'production', // Filterung erfolgt server-seitig
})
// usageData enthält bereits gefilterte Daten
```

## API-Endpunkte

Die neuen Funktionen nutzen die erweiterten API-Endpunkte:

- `GET /v1/usage/ai` - Mit `page`, `limit`, `userId`, `tag`, etc.
- `GET /v1/usage/ai/summarize` - Mit `by` Parameter für Gruppierung
- `GET /v1/admin/usage/ai` - Admin-Version
- `GET /v1/admin/usage/ai/summarize` - Admin-Version mit Gruppierung

Siehe `openapi.yaml` für vollständige Dokumentation.

## Vorteile

1. **Performance**: Nur benötigte Daten werden geladen
2. **Skalierbarkeit**: Große Datenmengen werden server-seitig verarbeitet
3. **Konsistenz**: Filterung erfolgt immer auf dem neuesten Datenstand
4. **Pagination**: Effiziente Navigation durch große Datensätze
5. **Server-Side Grouping**: Komplexe Gruppierungen ohne Client-Last

## Bekannte Einschränkungen

- Backend muss die neuen Parameter unterstützen (siehe `openapi.yaml`)
- Migration erfordert Anpassung der bestehenden Komponenten
- Beide Stränge können parallel genutzt werden während der Migration
