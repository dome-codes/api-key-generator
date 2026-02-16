# Migration Prioritäten & Status

## Legende

- 🔴 **Must Have (Kritisch)**: Funktionalität ist essentiell, System funktioniert nicht ohne
- 🟡 **Should Have (Wichtig)**: Funktionalität ist wichtig für Produktivbetrieb
- 🟢 **Nice to Have (Optional)**: Verbesserungen, die später kommen können
- ✅ **Abgeschlossen**: Implementiert und getestet
- ⚠️ **Teilweise**: Größtenteils fertig, kleine Anpassungen möglich
- 📋 **Offen**: Noch nicht begonnen

---

## 🔴 Must Have (Kritisch) - Basis-Funktionalität

### ✅ Abgeschlossen

| Ticket | Beschreibung | Status |
|--------|--------------|--------|
| Ticket 1/16 | Router mit AuthGuard Integration | ✅ Abgeschlossen |
| Ticket 2/17 | Keycloak Rollen-System vereinheitlichen | ✅ Abgeschlossen |
| Ticket 3/18 | API.ts Orval Mutator hinzufügen | ✅ Abgeschlossen |
| Ticket 19 | AuthGuard-Komponente vervollständigen | ✅ Abgeschlossen |

**Status**: Alle kritischen Basis-Funktionalitäten sind implementiert ✅

---

## 🟡 Should Have (Wichtig) - Core-Features

### ✅ Abgeschlossen

| Ticket | Beschreibung | Status |
|--------|--------------|--------|
| Ticket 20 | Usage Analytics Service Migration - Helper Utilities | ✅ Abgeschlossen |
| Ticket 21 | Composables-Struktur analysieren und optimieren | ✅ Abgeschlossen |
| Ticket 8 | Integration - Neue Extraction Funktionalitäten | ✅ Abgeschlossen |

### ⚠️ Teilweise abgeschlossen

| Ticket | Beschreibung | Status | Was fehlt |
|--------|--------------|--------|-----------|
| Ticket 4 | Migration - API Service zu Orval | ⚠️ Teilweise | Orval-Konfiguration für automatische Generierung (optional) |
| Ticket 5 | Migration - Usage Analytics Service | ⚠️ Teilweise | Legacy `useUsage.ts` Migration zu `useUsageApi.ts` (schrittweise möglich) |

### 📋 Offen - Priorität: Hoch

| Ticket | Beschreibung | Warum wichtig | Aufwand |
|--------|--------------|---------------|---------|
| Ticket 6 | Migration - Pricing Service | Preisberechnung muss korrekt sein | Mittel |
| Ticket 9 | Erweiterte Chart-Funktionalitäten | Bessere UX für Nutzungsanalyse | Mittel |
| Ticket 10 | Erweiterte Filter-Funktionalitäten | Benutzer benötigen mehr Filteroptionen | Mittel |
| Ticket 12 | Erweiterte Tabellen-Funktionalitäten | Export, Bulk-Actions, etc. | Hoch |

---

## 🟢 Nice to Have (Optional) - Erweiterungen

### 📋 Offen - Priorität: Niedrig

| Ticket | Beschreibung | Warum optional | Aufwand |
|--------|--------------|----------------|---------|
| Ticket 7 | Migration - User Management Service | Kann später migriert werden | Hoch |
| Ticket 11 | Export-Funktionalitäten | CSV/Excel Export ist nice-to-have | Mittel |
| Ticket 13 | Notification & Feedback System | Verbessert UX, aber nicht kritisch | Hoch |
| Ticket 14 | Performance-Optimierungen | System funktioniert bereits | Variabel |
| Ticket 15 | Accessibility & Internationalization | Wichtig für Barrierefreiheit, aber nicht kritisch | Sehr hoch |

---

## 📊 Zusammenfassung nach Priorität

### 🔴 Must Have (Kritisch)
- **Abgeschlossen**: 4/4 (100%) ✅
- **Offen**: 0

### 🟡 Should Have (Wichtig)
- **Abgeschlossen**: 3/8 (37.5%) ✅
- **Teilweise**: 2/8 (25%) ⚠️
- **Offen**: 3/8 (37.5%) 📋

### 🟢 Nice to Have (Optional)
- **Abgeschlossen**: 0/5 (0%)
- **Offen**: 5/5 (100%) 📋

---

## 🎯 Empfohlene nächste Schritte

### Phase 1: Kritische Lücken schließen (Sofort)
- ✅ **Fertig**: Alle Must-Have Tickets sind abgeschlossen

### Phase 2: Wichtige Features vervollständigen (Nächste 2-4 Wochen)
1. **Ticket 6: Pricing Service Migration** 🔴 Priorität: Hoch
   - Preisberechnung muss korrekt sein
   - Betrifft alle Nutzungsanzeigen
   - **Aufwand**: Mittel (2-3 Tage)

2. **Ticket 10: Erweiterte Filter-Funktionalitäten** 🟡 Priorität: Mittel
   - Benutzer benötigen mehr Filteroptionen
   - Verbessert UX erheblich
   - **Aufwand**: Mittel (2-3 Tage)

3. **Ticket 9: Erweiterte Chart-Funktionalitäten** 🟡 Priorität: Mittel
   - Bessere Visualisierung der Daten
   - Verbessert Analysefähigkeiten
   - **Aufwand**: Mittel (2-3 Tage)

### Phase 3: Optional Features (Später)
- Ticket 11: Export-Funktionalitäten (wenn Bedarf besteht)
- Ticket 12: Erweiterte Tabellen-Funktionalitäten (wenn Bedarf besteht)
- Ticket 14: Performance-Optimierungen (wenn Performance-Probleme auftreten)

### Phase 4: Langfristige Verbesserungen
- Ticket 7: User Management Service Migration
- Ticket 13: Notification & Feedback System
- Ticket 15: Accessibility & Internationalization

---

## 📝 Fehlende Funktionalitäten (Was noch nicht implementiert ist)

### 🔴 Kritisch fehlend
- **Nichts** - Alle kritischen Features sind implementiert ✅

### 🟡 Wichtig fehlend
1. **Pricing Service Migration** (Ticket 6)
   - Aktuell: Preisberechnung läuft client-seitig über `calculateCost` aus `pricing.ts`
   - Fehlt: Server-seitige Preisberechnung über API
   - Impact: Bei Preisänderungen müssen Frontend und Backend synchronisiert werden

2. **Erweiterte Filter** (Ticket 10)
   - Aktuell: Basis-Filter vorhanden (Zeitraum, Provider, Status, Tag)
   - Fehlt: Erweiterte Filteroptionen (z.B. Multi-Select, Custom-Date-Ranges, etc.)
   - Impact: Benutzer können Daten nicht so granular filtern wie gewünscht

3. **Erweiterte Chart-Funktionalitäten** (Ticket 9)
   - Aktuell: Basis-Charts vorhanden (Line, Pie, Bar)
   - Fehlt: Erweiterte Interaktionen (Zoom, Drill-Down, Custom-Perioden)
   - Impact: Analysefähigkeiten sind eingeschränkt

### 🟢 Optional fehlend
1. **Export-Funktionalitäten** (Ticket 11)
   - CSV/Excel Export von Tabellen
   - PDF-Reports
   - Scheduled Reports

2. **Erweiterte Tabellen-Funktionalitäten** (Ticket 12)
   - Bulk-Actions
   - Column-Reordering
   - Custom-Column-Selection

3. **Notification & Feedback System** (Ticket 13)
   - Toast-Notifications
   - Error-Feedback
   - Success-Messages

4. **Performance-Optimierungen** (Ticket 14)
   - Caching-Strategien
   - Lazy-Loading
   - Virtual-Scrolling für große Tabellen

5. **Accessibility & Internationalization** (Ticket 15)
   - i18n Support
   - ARIA-Labels
   - Keyboard-Navigation

---

## 🔍 Detaillierte Ticket-Analyse

### Ticket 6: Pricing Service Migration
**Status**: 📋 Offen  
**Priorität**: 🟡 Should Have (Hoch)  
**Aufwand**: Mittel (2-3 Tage)  
**Abhängigkeiten**: Keine  
**Was fehlt**:
- API-Endpunkte für Preisberechnung in `openapi.yaml`
- Service-Migration von client-seitiger zu server-seitiger Berechnung
- Integration in bestehende Components

**Warum wichtig**: 
- Preisänderungen müssen nur im Backend gemacht werden
- Konsistenz zwischen Frontend und Backend
- Bessere Performance bei großen Datenmengen

---

### Ticket 9: Erweiterte Chart-Funktionalitäten
**Status**: 📋 Offen  
**Priorität**: 🟡 Should Have (Mittel)  
**Aufwand**: Mittel (2-3 Tage)  
**Abhängigkeiten**: Ticket 20 (Helper Utilities) ✅  
**Was fehlt**:
- Chart-Zoom-Funktionalität
- Drill-Down in Chart-Datenpunkte
- Custom-Perioden-Auswahl (bereits teilweise vorhanden)
- Chart-Export (PNG/PDF)

**Warum wichtig**:
- Bessere Datenanalyse
- Professionellere Präsentation
- Verbesserte UX

---

### Ticket 10: Erweiterte Filter-Funktionalitäten
**Status**: 📋 Offen  
**Priorität**: 🟡 Should Have (Mittel)  
**Aufwand**: Mittel (2-3 Tage)  
**Abhängigkeiten**: Keine  
**Was fehlt**:
- Multi-Select Filter
- Erweiterte Date-Range-Optionen
- Filter-Presets speichern
- Filter-Kombinationen (AND/OR)

**Warum wichtig**:
- Benutzer benötigen granularere Filterung
- Verbesserte Datenanalyse
- Bessere UX

---

## 📈 Fortschritts-Tracking

### Gesamt-Status
- **Must Have**: 100% abgeschlossen ✅
- **Should Have**: 37.5% abgeschlossen, 25% teilweise, 37.5% offen
- **Nice to Have**: 0% abgeschlossen, 100% offen

### Nächste Meilensteine
1. ✅ **Meilenstein 1**: Basis-Funktionalität (Must Have) - **Abgeschlossen**
2. 🎯 **Meilenstein 2**: Core-Features (Should Have) - **In Arbeit** (62.5% fertig)
3. 📋 **Meilenstein 3**: Erweiterungen (Nice to Have) - **Geplant**

---

## 💡 Empfehlungen

### Sofort umsetzen (Diese Woche)
- **Nichts kritisches** - System ist funktionsfähig ✅

### Nächste 2 Wochen
1. **Ticket 6: Pricing Service Migration** (höchste Priorität)
2. **Ticket 10: Erweiterte Filter** (wenn Bedarf besteht)

### Nächste 4 Wochen
1. **Ticket 9: Erweiterte Chart-Funktionalitäten**
2. **Ticket 12: Erweiterte Tabellen-Funktionalitäten** (wenn Bedarf besteht)

### Später (wenn Bedarf besteht)
- Alle Nice-to-Have Tickets können bei Bedarf umgesetzt werden

---

## 🔄 Review-Zyklus

Diese Prioritäten sollten **monatlich** überprüft werden:
- Sind neue Anforderungen hinzugekommen?
- Haben sich Prioritäten geändert?
- Gibt es neue Abhängigkeiten?
- Sind geschätzte Aufwände noch aktuell?

**Letzte Aktualisierung**: 2026-02-16
