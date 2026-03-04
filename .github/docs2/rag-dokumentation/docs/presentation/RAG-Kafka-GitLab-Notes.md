## GitLab-Kafka-Repo & offene Fragen

### Struktur im Repo (vereinfacht)

- **Zentrale Templates**
  - Ordner `dbd2poc/`
    - `acls.tpl` / `acls.values.yaml`: zentrale Definition, wie ACLs generiert werden.
    - `topics.tpl` / `topics.values.yaml`: zentrale Definition, wie Topics angelegt werden (Naming, Defaults).
- **Projekt-spezifische Konfiguration**
  - Ordner `dome-rag/` (auf gleicher Ebene wie z. B. `de.deka.kafka-ops/`)
    - `acls.tpl` / `acls.values.yaml`: projektspezifische ACLs für unsere Services.
    - `topics.tpl` / `topics.values.yaml`: projektspezifische Topics für die RAG-Pipeline.

_Annahme:_ Die `.tpl`-Dateien im Projekt erben/verfeinern nur die globalen Templates aus `dbd2poc`, die eigentliche Facheinstellung passiert über die jeweiligen `*.values.yaml`.

---

### Geplante Topics für `dome-rag`

Für unsere RAG-Pipeline plane ich folgende Topics:

1. `document-received`
2. `document-to-extract`
3. `content-extracted`
4. `metadata-enriched`
5. `vector-ready-to-index`

Diese Topics bilden die komplette Ingestion-Strecke ab (vom Upload bis zum Indexing in Milvus) und tauchen in den Architekturdiagrammen als Events auf.

---

### Fragen für die Runde

1. **Naming-Konventionen**
   - Passen die geplanten Topic-Namen zu euren Standards (Präfixe, Umgebungskennung, Tenant-Bezug)?
   - Sollten wir z. B. Namespaces verwenden wie `dome-rag.document-received` oder Umgebungssuffixe (`...-prd`, `...-tst`)?

2. **Partitions/Retention-Defaults**
   - Gibt es im Repo etablierte Defaults (z. B. `partitions: 6`, `replication: 3`, `retention: 7d/30d`), an die wir uns für diese Topics halten sollten?
   - Seht ihr für `vector-ready-to-index` oder `content-extracted` besondere Anforderungen (größere Retention, eigene Config)?

3. **ACL-Konzept pro Service**
   - Grober Plan:
     - Middleware: `produce` auf `document-received`, ggf. `consume` für synchrone Pfade.
     - Data Service: `consume` `document-received` / `vector-ready-to-index`, `produce` `document-to-extract`.
     - Extraction, Miner, AI Service: jeweils `consume` / `produce` genau für „ihre“ Topics.
   - Entspricht das eurem üblichen ACL-Pattern im Repo (z. B. pro Service-Account ein eigenes ACL-Set in `dome-rag/acls.values.yaml`), oder gibt es eine bevorzugte Struktur (Rollen pro Domäne)?

4. **Umgang mit DLQs**
   - Gibt es im GitLab-Repo ein etabliertes Muster für DLQ-Topics (z. B. Suffix `.dlq` und eigene Defaults in `topics.values.yaml`), an das wir uns für:
     - `document-to-extract.dlq`
     - `content-extracted.dlq`
     - `vector-ready-to-index.dlq`
     halten sollten?

5. **CI-/Deploy-Workflow**
   - Wie ist der typische Weg, um Änderungen an `dome-rag/topics.values.yaml` und `acls.values.yaml` zu testen und auszurollen?
   - Gibt es z. B.:
     - einen Dry-Run / Lint-Schritt in der Pipeline,
     - eine Staging-Umgebung für neue Topics/ACLs,
     - ein Standard-Vorgehen für Breaking Changes (Renames, Retention-Änderungen)?

