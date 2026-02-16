# Usage Components - Strukturierte & Wiederverwendbare Komponenten

## 📁 Ordnerstruktur

```
src/components/usage/
├── shared/              # Wiederverwendbare Basis-Komponenten
│   ├── BaseFilters.vue      # Basis-Filter-Komponente mit Slots
│   ├── BaseSummary.vue      # Basis-Summary-Komponente mit Slots
│   ├── BaseTable.vue        # Basis-Tabelle mit Pagination
│   └── PaginationControls.vue # Pagination-Steuerelemente
├── charts/              # Chart-Komponenten (Chart.js)
│   ├── LineChart.vue        # Liniendiagramm (für Zeitreihen)
│   ├── PieChart.vue         # Kreisdiagramm (für Verteilungen)
│   └── BarChart.vue         # Balkendiagramm (für Kategorien)
├── ai/                  # AI Usage spezifische Komponenten
│   ├── AIUsageTabs.vue      # Hauptkomponente für AI Usage
│   ├── AIUsageFilters.vue   # AI-spezifische Filter (nutzt BaseFilters)
│   ├── AIUsageSummary.vue   # AI-spezifische Summary (nutzt BaseSummary)
│   └── AIUsageCharts.vue    # AI-spezifische Charts (nutzt Chart-Komponenten)
├── extraction/          # Extraction Usage spezifische Komponenten
│   ├── ExtractionUsageTabs.vue
│   ├── ExtractionUsageFilters.vue
│   ├── ExtractionUsageSummary.vue
│   └── ExtractionUsageDetailedTable.vue
└── [weitere gemeinsame Komponenten]
    ├── UsageDetailedTable.vue
    ├── UsageViewToggle.vue
    └── UsagePricingDisclaimer.vue
```

## 🎯 Design-Prinzipien

### 1. **Wiederverwendbarkeit**
- Gemeinsame Komponenten in `shared/` für alle Usage-Bereiche
- Spezifische Komponenten in `ai/` und `extraction/` erweitern die Basis-Komponenten
- Chart-Komponenten sind generisch und konfigurierbar

### 2. **Server-seitige Logik**
- **Alle Filterung, Gruppierung und Pagination** erfolgt über die API
- Frontend-Komponenten triggern nur API-Calls mit den richtigen Parametern
- Chart-Daten kommen vom Backend über `groupBy` Parameter

### 3. **Composables für State Management**
- `useUsageApi` - für AI Usage
- `useExtractionUsageApi` - für Extraction Usage
- Beide nutzen server-seitige Filterung und Pagination

## 📊 Chart-Daten über API

### Wie es funktioniert:

1. **Backend-Gruppierung**: Wenn `groupBy: ['day', 'month', 'year']` gesetzt ist, gruppiert das Backend die Daten nach Datum
2. **Frontend-Verarbeitung**: Die `chartData` computed property im Composable transformiert die gruppierten Daten in Chart.js-Format
3. **Chart-Komponenten**: Die wiederverwendbaren Chart-Komponenten (`LineChart`, `PieChart`, `BarChart`) rendern die Daten

### Beispiel:

```typescript
// Im Composable (useUsageApi.ts)
const chartData = computed(() => {
  // Transformiert Backend-Daten (bereits gruppiert) in Chart-Format
  return {
    labels: ['01.01.2024', '02.01.2024', ...],
    tokensIn: [1000, 2000, ...],
    tokensOut: [500, 1000, ...],
    requests: [10, 20, ...],
    cost: [0.5, 1.0, ...]
  }
})

// In der Komponente
<LineChart
  :chart-data="chartData"
  :selected-period="selectedPeriod"
/>
```

## 🔧 Verwendung der Basis-Komponenten

### BaseFilters

```vue
<BaseFilters
  :time-range="timeRange"
  :tag="tag"
  @update:time-range="..."
  @filter-changed="..."
>
  <!-- Spezifische Filter über Slots -->
  <template #specific-filters>
    <select v-model="model">...</select>
  </template>
  
  <template #admin-filters>
    <select v-model="user">...</select>
  </template>
</BaseFilters>
```

### BaseSummary

```vue
<BaseSummary
  title="Meine Nutzung"
  description="..."
  :is-loading="isLoading"
  :error="error"
>
  <template #summary-cards>
    <div class="card">...</div>
  </template>
</BaseSummary>
```

### BaseTable

```vue
<BaseTable
  title="Detaillierte Nutzung"
  :data="usageData"
  :is-loading="isLoading"
  :error="error"
  :pagination="pagination"
  @page-change="handlePageChange"
>
  <template #table-header>
    <tr>...</tr>
  </template>
  
  <template #table-body="{ data }">
    <tr v-for="item in data">...</tr>
  </template>
</BaseTable>
```

## 🚀 Migration von alten Komponenten

Die alten Komponenten (`UsageTabs.vue`, `UsageChart.vue`, etc.) wurden refactored:

- ✅ `UsageTabs.vue` → nutzt jetzt `AIUsageTabs.vue`
- ✅ `UsageChart.vue` → ersetzt durch `charts/LineChart.vue`
- ✅ `UsageAdditionalCharts.vue` → ersetzt durch `charts/PieChart.vue` und `charts/BarChart.vue`
- ✅ Filter-Logik → jetzt über API mit `groupBy` Parameter

## 📝 Nächste Schritte

1. **Extraction Komponenten refactoren**: Nutze die gleichen Basis-Komponenten wie AI Usage
2. **Sortierung**: Client-seitige Sortierung in `UsageDetailedTable.vue` auf Backend verschieben
3. **Weitere Chart-Typen**: Bei Bedarf weitere Chart-Komponenten hinzufügen
