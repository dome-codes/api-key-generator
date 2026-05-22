# Architecture Decision Record (ADR)

## Title

**ADR-2026-AI-05:** Einheitlicher Spring-Boot-Stack mit Spring AI für den Ingestion Service (Kafka, Kong & State Machine)

---

## Entscheidungsübersicht

| Feld | Inhalt |
| :--- | :--- |
| **Dokumenten-ID** | ADR-2026-AI-05 |
| **Status** | Proposed |
| **Datum** | 22. Mai 2026 |
| **Autor** | Domenic Schumacher (Senior Software Engineer) |
| **Beteiligte** | AI Platform Team, Architecture Board, Enterprise Java Guild |
| **Projektphase** | **Phase 2 — Plattform-Konsolidierung:** Übergang von Python-Prototypen zu produktionsreifen Spring-Boot-Services; erste Iteration der KI-Plattform (Ingestion, Chat, Query, Data) |
| **Bezug** | Baut auf **ADR-2026-AI-04** (hybride Kafka-Orchestrierung) auf; konkretisiert den Technologie-Stack für den *Ingestion Service* |

---

## Infrastruktur-Kontext

Die Entscheidung bezieht sich auf die **bereits angelegte oder in Rollout befindliche Plattform-Infrastruktur**. Der Ingestion Service ist kein Greenfield-Experiment, sondern ein Kernbaustein in einem bestehenden Ökosystem:

| Komponente | Rolle im Ingestion-Flow | Stand |
| :--- | :--- | :--- |
| **Kong API Gateway** | Edge-Layer: Inbound (`POST /ingest`), Outbound-Proxy zu Extraction, LLM/Embedding und Fachteams; Rate-Limiting, Circuit Breaker, einheitliche Metadaten-Injektion | Geplant / in Integration |
| **Apache Kafka** | Asynchroner Transport & Backpressure-Puffer; Topics u. a. `queue.raw-documents`, `topic.billing`; Consumer Groups für horizontale Skalierung | Produktiv verankert (vgl. ADR-2026-AI-04) |
| **Kubernetes (Coder/OpenShift)** | Laufzeit für Spring-Boot-Microservices; Deployments, HPA, Secrets | Standard-Runtime der Plattform |
| **Relationale DB (PostgreSQL)** | Persistente State Machine pro Ingestion-Job (Status, Meilensteine, Retry-Anker) | Geplant für Ingestion Service |
| **Vector Store / Data Service** | Speicherung von Chunks & Embeddings nach Pipeline-Abschluss | Bestehend / angebunden |
| **Cloud LLM / Embedding APIs** | Embedding- und Modell-Aufrufe — ausschließlich über Kong geroutet | Produktiv über Gateway |

**Relevante Kafka-Topics (Auszug):**

* `queue.raw-documents` — Eingang neuer Dokumente (vom Gateway als Event)
* `new-extraction-job`, `new-chunk-job`, `batch-complete` — Pipeline-Schritte (ADR-2026-AI-04)
* `ingestion-error-topic` / DLQ — Fehler- und Dead-Letter-Handling

---

## Plattform-Kontext (Kurzfassung)

Wir bauen eine **geschäftskritische, KI-gestützte Dokumenten-Pipeline** für die interne AI-Plattform. Der fachliche Kernablauf ist sequentiell: Upload → Extraktion → Chunking → Embedding → Bereitstellung für Chat/Query-Services.

Bisherige Prototypen liefen **polyglot** (Python für RAG/Agentik, Java für Kernbank). Mit **Spring AI (2026)** und der in ADR-2026-AI-04 festgelegten **eventgetriebenen Pipeline** (Kafka + zentrale Orchestrierung) ist der Zeitpunkt gekommen, die **neuen Kern-Services einheitlich auf Spring Boot** zu standardisieren — beginnend mit dem **Ingestion Service** als Kafka-Consumer und Process Manager der RAG-State-Machine.

---

## 1. Kontext und Problemstellung

Historisch bedingt ist unsere KI-Landschaft aktuell technologisch gesplittet. Während unsere Kern-Bankeninfrastruktur und Middleware primär auf Java und Spring Boot basieren, wurden frühe KI-Prototypen und -Dienste in Python implementiert. Der Grund hierfür lag in der initialen Marktdominanz von Python-Bibliotheken wie LlamaIndex (für RAG-Muster) und LangGraph (für agentische Workflows), welche damals keine adäquaten Äquivalente im Java-Ökosystem hatten.

### Technische und organisatorische Herausforderungen dieses Polyglot-Ansatzes

* **Hoher Operations- und Wartungsaufwand:** Das parallele Betreiben von zwei völlig unterschiedlichen Laufzeitumgebungen (JVM vs. Python) bindet massive DevOps-Ressourcen.
* **Fragmentierung bei Event-Driven-Architekturen:** Die Integration von Python-Services in unsere unternehmensweite **Kafka-Infrastruktur** erfordert redundantes Schreiben von Consumer/Producer-Infrastruktur-Code und erschwert ein stabiles Offset- und Retry-Management.

### Der technologische Wendepunkt (2026)

Das Framework **Spring AI** hat massiv aufgeholt und bietet mittlerweile produktionsreife, typensichere Abstraktionen für RAG (Dokumenten-Reader, TokenTextSplitter, VectorStore-Anbindungen). Da wir uns im Zuge der Plattform-Modernisierung für eine asynchrone, eventgetriebene Pipeline (vgl. **ADR-2026-AI-04**) entschieden haben, nutzen wir diesen Change, um alle neuen Kern-Services einheitlich auf Spring Boot zu konsolidieren.

---

## 2. Vorgeschlagene Architektur

Wir entscheiden uns dafür, **Spring Boot in Kombination mit Spring AI als einheitlichen und verbindlichen Technologie-Stack für alle neuen KI-Services zu setzen**.

Ein zentraler Fokus liegt hierbei auf dem **Ingestion Service**, welcher als asynchroner Kafka-Consumer implementiert wird und die RAG-Pipeline über eine datenbankgestützte State Machine orchestriert.

### 2.1 Der technologische Workflow (Unified Edge & Pipeline Blueprint)

Das folgende Diagramm zeigt, wie sich die Spring-Boot-Services nahtlos in das Gefüge aus Kong und Kafka einbetten:

```
                      [ CLIENT / FRONTEND ]
                                │
                                ▼ (POST /ingest)
                  ┌───────────────────────────┐
                  │     KONG API GATEWAY      │
                  └───────────────────────────┘
                                │ (Pusht Inbound-Peak direkt als Event)
                                ▼
                  ┌───────────────────────────┐
                  │ KAFKA: queue.raw-documents│
                  └───────────────────────────┘
                                │
                                ▼ (Pull: Spring Kafka Listener)
┌──────────────────────────────────────────────────────────────────┐
│                     INGESTION SERVICE (SPRING BOOT)              │
│                                                                  │
│   1. Liest Payload typensicher via Spring Kafka                  │
│   2. Initialisiert State Machine in Zentral-DB (Status: STARTED) │
│   3. Führt RAG-Pipeline sequentiell aus:                         │
│      - Extraktion ──► (Über Kong zu Extraction Service)          │
│      - Chunking   ──► (Nativ via Spring AI TokenTextSplitter)    │
│      - Embedding  ──► (Über Kong zu Cloud LLM / VectorStore)     │
│   4. Aktualisiert State in DB nach jedem Meilenstein             │
└──────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼ (Nach Erfolg)                 ▼
  ┌───────────────────────────┐    ┌──────────────────────┐
  │ KAFKA: topic.billing      │    │ CHAT / QUERY         │
  └───────────────────────────┘    │ SERVICES (Spring Boot)│
                                   └──────────────────────┘
```

### 2.2 Integration von Kafka, Kong und der State Machine im Ingestion Service

Durch die Wahl von Spring Boot profitiert der *Ingestion Service* von einer hocheffizienten, nativen Umsetzung der Infrastruktur-Vorgaben:

1. **Echtes Backpressure via Spring Kafka:** Der Ingestion Service nutzt den deklarativen `@KafkaListener`. Unabhängig von Lastspitzen am äußeren Gateway (z. B. 10.000 Dokumente) zieht der Service über das Pull-Prinzip exakt nur so viele Nachrichten, wie die JVM-Threads stabil verarbeiten können.

2. **Resiliente State Machine (Spring Data):** Der Ingestion Service steuert die sequentielle Abfolge der RAG-Schritte. Nach jedem Teilschritt (z. B. nach dem Parsing oder dem Chunking über Spring AI) persistiert der Service den aktuellen Zustand über Spring Data in einer relationalen Datenbank. Stürzt die Instanz ab, greift eine andere Instanz der Consumer Group den Kafka-Offset ab, liest den Zustand aus der DB und setzt die Pipeline idempotent fort.

3. **Outbound über das Kong-Nadelöhr:** Der Ingestion Service ruft externe LLM-Modelle für das Embedding oder nachgelagerte Fachteams nicht direkt auf, sondern tunnelt die Requests synchron durch das *Kong API Gateway*.
   * **Vorteil:** Spring AI nutzt standardisierte HTTP-Clients (z. B. RestClient oder WebClient). Tritt ein Cloud-Rate-Limit (HTTP 429) auf, fängt Kong dies über seinen Circuit Breaker ab. Der Ingestion Service profitiert von der Ausfallsicherheit, ohne komplexen Resilience-Code in Java schreiben zu müssen.

---

## 3. Evaluierung der Optionen (Pro & Contra Matrix)

| Kriterium | Option A: Einheitlicher Spring Boot Stack + Spring AI (Empfohlen) | Option B: Polyglot-Ansatz (Python für Ingestion/AI, Java für Kern) |
| :--- | :--- | :--- |
| **Kafka & Event-Driven Integration** | **Pro:** Herausragender, nativer Enterprise-Support über spring-kafka. Einfaches Management von Consumer Groups, Thread-Pooling und Poison-Pill-Handling. | **Contra:** Python-Kafka-Bibliotheken (wie confluent-kafka oder kafka-python) erfordern viel manuelles Plumbing für stabiles Threading und Fehler-Pipelines. |
| **State Machine & Persistenz** | **Pro:** Nahtlose Kombination von Spring-Transaktionsmanagement (`@Transactional`) und Spring Data zur atomaren Absicherung der Pipeline-Zustände. | **Contra:** Zustandshaltung und Datenbank-Synchronisation müssen über Python-ORMs (wie SQLAlchemy) separat hochgezogen und gewartet werden. |
| **RAG- & Chunking-Features** | **Pro:** Spring AI bietet fertige, performante Abstraktionen für typensicheres Dokumenten-Parsing und semantisches Splitting (TokenTextSplitter). | **Pro:** LlamaIndex und LangGraph bieten eine enorme Fülle an vorgefertigten, hoch-experimentellen KI-Ketten. |
| **Infrastruktur-Schutz (Kong-Kopplung)** | **Pro:** Spring AI generiert voll standardisierte OpenAI-kompatible Requests. Kong kann diese perfekt parsen, ratelimitieren und die Metadaten einheitlich injizieren. | **Contra:** Fragmentierte Request-Strukturen je nach genutztem Python-Framework erschweren eine einheitliche Plugin-Richtlinie in Kong. |

---

## 4. Konsequenzen und Risikominimierung (Mitigation)

### 4.1 Risiko: Komplexität der Zustandshaltung (State Machine)

* **Bedenken:** Erzeugt eine datenbankgestützte State Machine im Ingestion Service zu viel Overhead?
* **Minimierung:** Nein. Durch die zustandslose Natur des Services dient die DB lediglich als persistenter Anker. Da Spring Boot über das Projekt Loom (*Virtual Threads*) extrem leichtgewichtige I/O-Operationen erlaubt, blockieren die synchronen DB-Updates und die HTTP-Aufrufe Richtung Kong nicht die Performance der Ingestion-Pipeline.

### 4.2 Vereinfachtes Fehler- und DLQ-Management

* **Konsequenz:** Schlägt ein RAG-Schritt im Ingestion Service endgültig fehl (z. B. ein korruptes PDF), steuert das Spring-Framework das koordinierte Error-Handling. Der Job wird in der State-DB als `FAILED` markiert, und die Kafka-Nachricht kann sauber quittiert werden, ohne dass die gesamte Pipeline blockiert oder unkontrolliert in ein globales Dead-Letter-Topic läuft.

---

## 5. Fazit und Freigabe

Die Festlegung auf **Spring Boot und Spring AI** ist der logische Schlussstein für unsere neue KI-Plattform. Der *Ingestion Service* profitiert massiv von der bewährten Enterprise-Stabilität des Spring-Ökosystems bei der Verarbeitung von Kafka-Events und der Verwaltung von Transaktionszuständen (State Machine).

Gleichzeitig nutzen wir **Kong** als intelligenten Proxylayer für die ausgehenden KI-Aufrufe. Wir schaffen damit eine hochgradig belastbare, wartbare und technologisch homogene Architektur für die erste Iteration unserer KI-Services (Ingestion, Chat, Query, Data).

---

## Verwandte Entscheidungen

| ADR | Titel |
| :--- | :--- |
| ADR-2026-AI-04 | Wahl des Architekturmusters für die Dokumenten-Pipeline (Choreographie vs. Hybride Orchestrierung) |
