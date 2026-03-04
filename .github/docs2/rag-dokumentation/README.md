# RAG-Dokumentation (Bündel für neues Repo)

Dieser Ordner **enthält alles**, was ihr als Grundlage für ein eigenes Dokumentations- oder Infra-Repo braucht: **Docs, Topics, Values und Bilder**.

## Struktur

```
rag-dokumentation/
├── README.md              ← diese Datei
├── docs/                  ← Markdown-Dokumentation
│   ├── RAG-Pipeline-Wiki.md
│   ├── RAG-Pipeline-Presentation.md
│   └── presentation/      ← Präsentations-Slides & Notizen
├── topics/                ← Kafka-Topics (Beschreibung + Mapping)
│   └── kafka-topics-overview.md
├── values/                ← Template + Ablauf (Merge → Deploy → Topics existieren)
│   ├── README.md
│   └── kafka-topics-values-template.yaml
└── bilder/                ← Diagramme (Mermaid + SVG + Screenshots)
    ├── diagram-01.mmd / .svg … diagram-10
    ├── rag-pipeline-diagram.mmd
    └── GPU-Enhanced PDF Extraction-*.png
```

## Nutzung als Grundlage für ein neues Repo

1. **Gesamten Ordner** `rag-dokumentation/` in euer neues Repo kopieren (z. B. als Wurzel oder als Unterordner `docs/`).
2. **Docs** könnt ihr mit Docusaurus, MkDocs oder GitHub Pages rendern; Verweise auf Bilder dann z. B. auf `bilder/` anpassen.
3. **Values** als Referenz in Helm-Charts oder Infra-Repos übernehmen und an eure Umgebung anpassen.
4. **Topics-Übersicht** bleibt die zentrale Stelle für Topic-Namen und Service-Mapping; sie verweist auf `values/` für die konkrete YAML-Struktur.

## Kurzüberblick der Inhalte

| Ordner   | Inhalt |
|----------|--------|
| **docs/**   | RAG-Architektur (Wiki), Präsentationstexte |
| **topics/** | Kafka-Topic-Übersicht, Producer/Consumer-Mapping |
| **values/** | Template (`kafka-topics-values-template.yaml`) + README (Ablauf: richtige YAML → Merge → Deploy → Topics existieren) |
| **bilder/** | Mermaid-Quellen (`.mmd`), exportierte SVGs, Screenshots |

Mit diesem Bündel habt ihr eine konsistente Basis für Dokumentation, SEO-Seiten und Deployment-Konfiguration in einem neuen Repo.

## Direkte Links

- **Architektur & Hauptdoku**
  - [RAG-Pipeline-Wiki](docs/RAG-Pipeline-Wiki.md)

- **Präsentation & Templates**
  - [Präsentations-README](docs/presentation/README.md)
  - [Kafka-Topic-Templates (JSON-Payloads)](docs/presentation/tpls/README.md)

- **Kafka-Topics & Values**
  - [Kafka Topics Overview](topics/kafka-topics-overview.md)
  - [Values – Template & Deploy-Ablauf](values/README.md)
  - [Kafka Topics Values Template (Helm)](values/kafka-topics-values-template.yaml)
