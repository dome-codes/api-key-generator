# Architecture Decision Record (ADR)

## Title
ADR-2026-004: Wahl des Architekturmusters für die Dokumenten-Pipeline (Choreographie vs. Hybride Orchestrierung)

## Status
**Decided**

## Kontext und Problemstellung
Wir entwickeln und implementieren eine geschäftskritische, mehrstufige Pipeline zur automatisierten, KI-gestützten Dokumentenverarbeitung. Der fachliche Ablauf erfordert eine strikte, sequentielle Kette von Verarbeitungsschritten: Ein Dokument wird hochgeladen, durchläuft ein strukturiertes Text-Parsing samt Chunking, persistiert Zwischenstände und Metadaten, erzeugt mathematische Vektor-Embeddings und übergibt die angereicherten Datensätze schließlich an nachgelagerte KI-Modelle zur finalen Analyse.

Technologisch besteht dieses Ökosystem aus 4 bis 5 spezialisierten Microservices: Einer zentralen **Middleware** (Ingestion-Schnittstelle), einem **Extraction & Chunking Service**, einem **AI/Embedding Service** sowie einem dedizierten **Data Service**, welcher als exklusiver Abstraktions- und Storage-Knotenpunkt zur zugrundeliegenden Datenbank (SQL/NoSQL/S3) agiert.

**Der aktuelle Implementierungsstand:** Ein erheblicher Teil der verteilten Infrastruktur wurde bereits erfolgreich realisiert. Die grundlegenden Apache Kafka-Verbindungen, die Broker-Konfigurationen sowie die dedizierten Topics (z. B. `new-extraction-job`, `new-chunk-job`, `batch-complete`, `ingestion-error-topic`) sind vollständig in die Services integriert und in den entsprechenden Deployment-Pipelines produktiv verankert.

Es steht nun die fundamentale Architekturfrage im Raum, wie der funktionale Daten- und Kontrollfluss langfristig ausgestaltet werden soll. Zur Debatte steht das ursprünglich angedachte, rein dezentrale *Choreographie-Modell* (in dem sich Services autonom über aufeinanderfolgende Topics gegenseitig triggern) im direkten Vergleich zu einem *hybriden Orchestrierungs-Modell*, welches die logische Ablaufsteuerung in der Middleware bündelt, ohne die getätigten Infrastruktur-Investitionen in Kafka zu verwerfen. Gleichzeitig muss die Architektur zukunftssicher für die geplante Integration des Enterprise API Gateways **Kong** vorbereitet sein.

## Betrachtete Optionen

### Option A: Reine dezentrale Choreographie (Event-Chain)
In diesem klassischen ereignisgesteuerten Muster agieren alle Microservices technologisch autonom. Die Middleware fungiert lediglich als initialer Producer. Nach dem Upload eines Dokuments wirft sie ein Event in das Topic `new-extraction-job`. Der *Extraction Service* konsumiert dieses Signal, verarbeitet die Daten, führt einen Speicher-Call zum *Data Service* aus und produziert anschließend eigenständig das Folge-Event in das Topic `new-chunk-job`. 

Der *AI Service* lauscht darauf, berechnet Embeddings, speichert das Ergebnis und feuert schließlich das Event `batch-complete`, welches von der Middleware abgefangen wird, um dem Client das synchrone Feedback zu liefern. Jeder Service verwaltet hierbei seine eigenen Kafka-Clients und benötigt feingranulare Lese- und Schreibrechte (ACLs) auf Cluster-Ebene.

### Option B: Hybride Orchestrierung über die Middleware (Process Manager)
Diese Option behält die bereits vollständig implementierte Kafka-Topologie und die bestehenden Topics eins zu eins bei, ordnet jedoch den Kontroll- und Datenfluss fundamental neu. Die logische Oberhoheit über den Gesamtprozess wandert exklusiv in die Middleware, welche fortan als zentraler *Orchestrator (Process Manager)* agiert. Die nachgelagerten Services werden zu fokussierten Ausführungseinheiten („Dumb Worker“).

Die Middleware triggert Phase 1 aktiv über das Topic `new-extraction-job`. Der Extraction Service führt seine Aufgabe aus, meldet seinen Erfolg jedoch über ein spezifisches Quittungs-Topic (oder direkt an den Orchestrator) zurück. Erst nach dieser Validierung prüft die Middleware den Zustand und triggert isoliert Phase 2 über das Topic `new-chunk-job`. Die Services wissen nichts von der Existenz des jeweils anderen; sie kennen ausschließlich ihre eigenen Arbeitsanweisungen und die Middleware.

---

## Detaillierte Pro & Contra Matrix

| Kriterium | Option A: Reine Choreographie | Option B: Hybride Orchestrierung (Gewählt) |
| :--- | :--- | :--- |
| **Kopplung & Autonomie** | Sehr geringe Code-Kopplung. Services sind technologisch autark und hängen physikalisch nur am Broker. | Erhöhte logische Kopplung in der Middleware. Die Middleware muss die Sequenz der Schritte kennen. |
| **Developer Experience (DX)** | **Schlecht.** Hohe kognitive Last. Entwickler müssen die gesamte Topic-Kette und implizite Datenstrukturen aller Services im Kopf behalten. | **Exzellent.** KI-Entwickler bauen isolierte, leicht testbare Endpunkte/Worker. Kein systemweites Ablaufwissen erforderlich. |
| **Schema-Evolution (Properties)** | **Kaskadierendes Risiko.** Änderungen an Daten-Properties in Service 1 erfordern oft synchrone Schema-Updates in allen Folge-Services. | **Isoliert abgefedert.** Der Orchestrator fängt veränderte Properties zentral ab, filtert oder mappt sie, bevor nachgelagerte Services bedient werden. |
| **Infrastruktur- & ACL-Overhead** | **Sehr hoch.** Jeder Service benötigt komplexe, spezifische Read- und Write-ACLs für wechselnde Topics im Cluster. | **Minimal.** Klares, reduziertes Berechtigungsmuster. Nur die Middleware benötigt umfassende Ablaufrechte. |
| **Transparenz & Debugging** | Schwierig. Der Systemzustand ist blind über den Cluster verteilt. Fehler müssen über verteiltes Tracing mühsam korreliert werden. | **Sofort gegeben.** Ein Blick in den Orchestrator zeigt exakt, welcher Pipeline-Schritt (State) für welches Dokument aktiv ist. |

---

## Entscheidung
Wir entscheiden uns formell für die Umsetzung von **Option B: Hybride Orchestrierung über die Middleware**.

Die Middleware übernimmt ab sofort die strategische Rolle des Prozess-Managers (Zentrale State Machine), während Apache Kafka weiterhin als hochperformantes, asynchrones Transportmedium und ausfallsicherer Backpressure-Puffer für die Daten-Payloads zwischen den Verarbeitungsschritten beibehalten wird. Die bereits geleistete Implementierungsarbeit der Topics und Kafka-Anbindungen in den Services bleibt vollständig erhalten, wird jedoch unter eine zentrale logische Kontrolle gestellt.

---

## Zukünftige Workflow-Szenarien als Entscheidungs-Enabler

Ein Hauptargument für die Wahl der hybriden Orchestrierung ist die Flexibilität bei der Einführung neuer Geschäftsmodelle. Da die Kern-Services als isolierte Funktionseinheiten („Dumb Worker“) agieren, kann die Middleware zukünftig komplexe, alternative Datenflüsse steuern, ohne dass bestehender Service-Code modifiziert werden muss:

### Szenario 1: Der „Fast-Track“ / Bypass-Flow (Kurztext-Optimierung)
Wenn der Client anstelle eines mehrseitigen PDF-Dokuments einen kurzen, reinen Rohtext (z. B. eine Chat-Nachricht) an den REST-Endpunkt übermittelt, ist ein zeitaufwendiges Parsing und Chunking redundant.
* **Umsetzung im Orchestrator:** Die Middleware erkennt diesen Zustand anhand der Payload-Metadaten, umgeht Phase 1 komplett, speichert den Text direkt im Data Service und publiziert das Event unmittelbar in das Topic `new-chunk-job` für den AI Service.
* **Vergleichsweise ohne Orchestrator (Entwicklungsaufwand):** In einer reinen Choreographie müsste der *Extraction Service* diesen Bypass-Code selbst enthalten. Er müsste das Event konsumieren, die logische Abkürzung prüfen und die Nachricht ungelesen an das nächste Topic weiterreichen. Dies verletzt das Prinzip des *Separation of Concerns* und führt zu Code-Wildwuchs in den KI-Komponenten.

### Szenario 2: Der „Multi-Model-Parallelismus“ (Ensemble-Routing)
Für sicherheitskritische Klassifizierungen (z. B. Kreditverträge) reicht ein einzelnes KI-Modell oft nicht aus. Die Chunks müssen parallel von zwei unterschiedlichen Modellen analysiert werden.
* **Umsetzung im Orchestrator:** Nach erfolgreichem Abschluss des Chunkings splitte der Orchestrator den Job in der State Machine auf. Er befeuert parallel die Topics `new-chunk-job-model-a` und `new-chunk-job-model-b`. Er hält eine integrierte Join-Bedingung: Erst wenn *beide* Modelle ihre Ergebnisse erfolgreich zurückgemeldet haben, führt der Orchestrator die Datensätze zusammen und deklariert den Batch als beendet.
* **Vergleichsweise ohne Orchestrator (Entwicklungsaufwand):** Die KI-Services müssten eng miteinander verdrahtet werden. Service B müsste aktiv prüfen, ob Service A schon fertig ist, oder es müsste ein hochkomplexes, verteiltes Kstream-Join-Verfahren auf Kafka-Ebene aufgesetzt werden, was den Entwicklungsaufwand massiv verlängert.

### Szenario 3: Die Human-in-the-Loop Integration (Asynchroner Review-Workflow)
Liefert der Extraction Service bei einem schlecht gescannten Dokument einen Konfidenzwert (Confidence Score) unterhalb von 80 %, darf keine automatisierte Weiterverarbeitung durch den AI Service erfolgen. Eine manuelle Freigabe ist zwingend erforderlich.
* **Umsetzung im Orchestrator:** Der Extraction Service muscle die Daten mitsamt dem niedrigen Score an den Orchestrator. Die State Machine stoppt den automatischen Fluss, setzt den Job auf `PENDING_HUMAN_REVIEW` und schreibt einen Task in die Datenbank des Mitarbeiter-Frontends. Erst wenn ein Sachbearbeiter das Dokument visuell freigibt, reaktiviert der Orchestrator den Job und wirft ihn in das Topic `new-chunk-job`.
* **Vergleichsweise ohne Orchestrator (Entwicklungsaufwand):** Nahezu unmöglich sauber abbildbar. Der AI Service müsste tagelang auf ein Topic lauschen oder man müsste künstliche, langlebige Blockaden in den Kafka-Consumer-Schleifen erzeugen, was die Gefahr von Rebalances und Timeouts im gesamten Cluster drastisch erhöht.

---

## Analyse des Entwicklungsaufwands & Technische Schulden

### Der akute Entwicklungsaufwand ohne Orchestrierung (Die Schmerzanalyse)
Würden wir den dezentralen Ansatz (Option A) erzwingen, würde dies die Entwickler der einzelnen Services mit massiver administrativer und konzeptioneller Arbeit belasten, die nichts mit der eigentlichen KI-Wertschöpfung zu tun hat:
1. **Infrastruktur-Tickets & Wartezeiten:** Für jede funktionale Änderung, die ein neues Topic erfordert, müssten die Entwickler über DevOps/SRE-Schnittstellen neue Topic-Berechtigungen und ACL-Zuweisungen beantragen. Dies führt in der Praxis zu erheblichen Blocker-Zeiten im Sprint.
2. **Fehler-Behandlung im Anwendungscode:** Wenn der AI Service bei Schritt 7 wegbricht, kann Kafka das Dokument nicht automatisch "heilen". Da die HTTP-Verbindung zum Client zu diesem Zeitpunkt bei einer reinen Event-Chain längst geschlossen ist, müssen die KI-Entwickler komplexe asynchrone Fehler-Rückmelde-Mechanismen, Dead Letter Queues (DLQ) und Benachrichtigungs-Logiken in *jeden* einzelnen Service einprogrammieren.

### Bewusste Akzeptanz Technischer Schulden bei Option B
Wir gehen mit der Wahl der Orchestrierung eine bewusste und klar definierte technische Schuld ein: **Die Prozess-Kopplung**. Die Middleware mutiert zu einem "intelligenten" Knotenpunkt, der die Schnittstellenverträge der Arbeiter kennen muss.

**Mitigation (Risikominimierung):** Diese Schuld wird durch strikte API-Versionierung auf Service-Ebene (z. B. `/v1/extract`, `/v2/extract`) kontrolliert. Da die Services selbst streng atomar und zustandslos gehalten werden, bleibt ihre horizontale Skalierbarkeit im Kubernetes-Cluster zu 100 % unangetastet. Die Middleware steuert lediglich das *„Wann“* (die Orchestrierung), die Services behalten die volle Hoheit über das *„Wie“* (die fachliche Verarbeitung). Der massive Gewinn an Developer Experience (DX) und die radikale Reduzierung von Infrastruktur-Komplexität wiegen diese kontrollierte Kopplung vollständig auf.

---

## Strategischer Ausblick: API Gateway (Kong) Integration

Die Entscheidung für Option B stellt einen optimalen, risikofreien Evolutionspfad für die zukünftige Einführung des Enterprise API Gateways **Kong** dar.

Wenn Kong zu einem späteren Zeitpunkt in die Infrastruktur integriert wird, muss das Gateway die hochkomplexe, asynchrone Kafka-Topologie des internen Clusters überhaupt nicht verstehen oder abbilden. Kong wird als schlanker, hochperformanter Edge-Proxy direkt vor die Middleware gesetzt.

Kong übernimmt an der Netzwerkgrenze zentrale Cross-Cutting Concerns wie globale Authentifizierung (OAuth2/mTLS), Rate Limiting und IP-Whitelisting. Es leitet den validierten Request synchron via HTTP an die Middleware weiter. Der Orchestrator startet daraufhin die bewährte, über Kafka gepufferte Pipeline. Durch dieses Design bleibt die gesamte interne Event-Logik bei der Einführung von Kong völlig unangetastet. Der Migrationsaufwand ist minimal (**XS**).