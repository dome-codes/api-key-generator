# Composables Analyse & Optimierung

## Übersicht
Diese Datei dokumentiert die Analyse und Optimierung der Composables.

## Vorhandene Composables

### 1. useUsageApi.ts ✅
- **Status**: Modernisiert, verwendet `usageApiService`
- **Zweck**: Server-seitige Filterung und Gruppierung für AI Usage
- **Verwendet**: `usageApiService` (neue API-basierte Services)
- **Optimierung**: Keine nötig, bereits modernisiert

### 2. useExtractionUsageApi.ts ✅
- **Status**: Modernisiert, verwendet `extractionUsageApiService`
- **Zweck**: Server-seitige Filterung und Gruppierung für Extraction Usage
- **Verwendet**: `extractionUsageApiService` (neue API-basierte Services)
- **Optimierung**: Keine nötig, bereits modernisiert

### 3. useApiKeys.ts ⚠️
- **Status**: Verwendet `apiKeyService` aus `apiService.ts`
- **Zweck**: API Key Management
- **Verwendet**: `apiKeyService` (bereits Orval-generierte Clients)
- **Optimierung**: Bereits gut strukturiert, verwendet Orval-Clients

### 4. useUsage.ts ⚠️
- **Status**: Legacy, verwendet `usageService` aus `apiService.ts`
- **Zweck**: Legacy Usage Management
- **Verwendet**: `usageService` + `usageAnalyticsService`
- **Optimierung**: Sollte schrittweise zu `useUsageApi` migriert werden
- **Aktion**: Als deprecated markieren, Migration zu `useUsageApi` dokumentieren

### 5. useAuth.ts ✅
- **Status**: Gut strukturiert
- **Zweck**: Authentication & Authorization
- **Verwendet**: `@/auth/keycloak`
- **Optimierung**: Keine nötig

### 6. useBudget.ts ✅
- **Status**: Gut strukturiert
- **Zweck**: Budget Management
- **Optimierung**: Keine nötig

### 7. useDebug.ts ✅
- **Status**: Gut strukturiert
- **Zweck**: Debug-Funktionalitäten
- **Optimierung**: Keine nötig

### 8. useModals.ts ✅
- **Status**: Gut strukturiert
- **Zweck**: Modal-Management
- **Optimierung**: Keine nötig

### 9. useUrlFilters.ts ✅
- **Status**: Gut strukturiert
- **Zweck**: URL-Parameter-Management
- **Optimierung**: Keine nötig

### 10. useDebounce.ts ✅
- **Status**: Gut strukturiert
- **Zweck**: Debouncing-Funktionalität
- **Optimierung**: Keine nötig

## Duplikate & Redundanzen

### Keine kritischen Duplikate gefunden
- Alle Composables haben klare Verantwortlichkeiten
- `useUsage.ts` ist Legacy, wird schrittweise durch `useUsageApi.ts` ersetzt

## Optimierungsempfehlungen

1. **useUsage.ts als deprecated markieren**
   - Dokumentation hinzufügen
   - Migration zu `useUsageApi.ts` dokumentieren
   - Schrittweise Migration durchführen

2. **Gemeinsame Logik extrahieren**
   - Debug-Log-Funktion könnte in `useDebug.ts` zentralisiert werden
   - Error-Handling könnte vereinheitlicht werden

3. **Type-Safety verbessern**
   - Alle Composables verwenden bereits TypeScript
   - Weitere Typisierung wo nötig

## Migration-Plan

### Phase 1: Legacy-Composables markieren ✅
- `useUsage.ts` als deprecated markieren

### Phase 2: Gemeinsame Utilities extrahieren
- Debug-Log-Funktion zentralisieren
- Error-Handling vereinheitlichen

### Phase 3: Schrittweise Migration
- Components von `useUsage.ts` zu `useUsageApi.ts` migrieren
- `useUsage.ts` entfernen wenn nicht mehr verwendet
