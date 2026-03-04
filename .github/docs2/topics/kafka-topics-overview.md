## Kafka-Topics & Values-Beispiel

Dieses Dokument ergänzt die Architektur-Doku in `RAG-Pipeline-Wiki.md` (insbesondere Abschnitt **4. Kafka "Nervensystem" (Topic-Strategie)**) um eine **konkrete Sicht auf Topics und eine Beispiel-Values-Konfiguration**.

Die Idee:

- **Architektur-Doku** bleibt in `RAG-Pipeline-Wiki.md`.
- **Konfigurationsnahe Doku** (Topics + Beispiel-`values.yaml`) liegt hier im Unterordner `topics/`.

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

Eine mögliche beispielhafte Struktur für diese Konfiguration findest du in:

- `./kafka-topics-values-example.yaml`

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

### 3. Beispiel-Values (`kafka-topics-values-example.yaml`)

Die Datei `kafka-topics-values-example.yaml` demonstriert, wie eine **Helm-Values-Datei** für Topics und deren Verwendung in Services aussehen könnte, z. B.:

- Zentrales `ragPipeline.kafka.topics.*`-Objekt
- Pro Service ein Block `services.<service>.kafka.consumerTopics` / `producerTopics`

Diese Datei ist **nicht** produktiv, sondern dient:

- als **Referenz** für SRE/DevOps,
- als **Diskussionsgrundlage** für Naming, Partitionierung und Retention,
- als **Blaupause**, falls ein eigenes Helm-Chart oder ein zentrales Infra-Repo aufgebaut wird.

---

### 4. Nächste Schritte

- Wenn ein dediziertes Infra-/Helm-Repo entsteht, kann diese Struktur 1:1 übernommen und in produktive `values.yaml`-Dateien überführt werden.
- In `RAG-Pipeline-Wiki.md` kann an geeigneter Stelle (z. B. 4.2 Topic-Payloads) ein Hinweis auf diesen Ordner `topics/` ergänzt werden.

