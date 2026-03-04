## Kafka-Topics & Values-Beispiel

Dieses Dokument ergänzt die Architektur-Doku in `RAG-Pipeline-Wiki.md` (insbesondere Abschnitt **4. Kafka "Nervensystem" (Topic-Strategie)**) um eine **konkrete Sicht auf Topics und eine Beispiel-Values-Konfiguration**.

Die Idee:

- **Architektur-Doku** liegt in `docs/RAG-Pipeline-Wiki.md`.
- **Konfigurationsnahe Doku** (Topics) liegt hier in `topics/`.
- **Beispiel-Values** (Helm) liegen in `values/`.

---

### 1. Topics im Überblick

Die folgenden Topics sind im RAG-Ingestion-Pfad relevant (siehe auch Abschnitt 4.1/4.2 in der Wiki-Datei):

- `document-received`
- `document-to-extract`
- `content-extracted`
- `metadata-enriched`
- `vector-ready-to-index`

Für jedes Topic sollten mindestens folgende Eigenschaften definiert werden:

- **Name** (technischer Name im Kafka-Cluster)
- **Partitionen** (Skalierung / Parallelität)
- **Replication Factor** (Ausfallsicherheit)
- **Retention / Cleanup-Policy** (je nach Use Case)

Die **Template**-Struktur für diese Konfiguration findest du in:

- `../values/kafka-topics-values-template.yaml`

Aus dem Template wird die **richtige** values-YAML (Deploy-Repo/Pipeline); **nach Merge und Deploy existieren die Topics** im Kafka-Cluster. Siehe `../values/README.md`.

---

### 2. Mapping: Services ↔ Topics

Kurzfassung des Producer/Consumer-Mappings (Details: `RAG-Pipeline-Wiki.md`, Abschnitt 4.4):

- **Middleware**
  - **Producer**: `document-received` (bzw. indirekt Data Service → siehe aktualisierte Diagramme)
- **Data Service**
  - **Consumer**: `document-received`
  - **Producer**: `document-to-extract`
- **Extraction Service**
  - **Consumer**: `document-to-extract`
  - **Producer**: `content-extracted`
- **MinerU Service (optional)**
  - **Consumer**: `content-extracted`
  - **Producer**: `metadata-enriched`
- **AI Service**
  - **Consumer**: `metadata-enriched`
  - **Producer**: `vector-ready-to-index`

Dieses Mapping ist in der Beispiel-Values-Datei als Kommentare bzw. Struktur (services.*.kafka.*) angedeutet.

---

### 3. Template und richtige YAML → Deploy → Topics existieren

- **Template**: `values/kafka-topics-values-template.yaml`  
  Vorlage mit `ragPipeline.kafka.topics.*` und `services.*.kafka.consumerTopics` / `producerTopics`. Wird **nicht** direkt deployed.

- **Richtige YAML**: Die konkrete values-Datei (z. B. im Deploy-Repo) wird aus dem Template abgeleitet bzw. daran angepasst.

- **Nach Merge** → Deploy (Helm/CI) läuft → **die Kafka-Topics werden angelegt und existieren**.

Details zum Ablauf: `values/README.md`.

---

### 4. Nächste Schritte

- Wenn ein dediziertes Infra-/Helm-Repo entsteht, kann diese Struktur 1:1 übernommen und in produktive `values.yaml`-Dateien überführt werden.
- In `docs/RAG-Pipeline-Wiki.md` kann an geeigneter Stelle (z. B. 4.2 Topic-Payloads) ein Hinweis auf den Ordner `topics/` ergänzt werden.

