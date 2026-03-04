# Values: Template und Deployment

## Ablauf

1. **Template** – `kafka-topics-values-template.yaml`  
   Vorlage mit allen Topic-Definitionen und Service-Mappings. Wird **nicht** direkt deployed.

2. **Richtige YAML** – die konkrete `values.yaml` (oder umgebungspezifisch z. B. `values-prod.yaml`)  
   Wird im Deploy-Repo bzw. in der Pipeline verwendet. Kann vom Template abgeleitet oder daraus generiert werden.

3. **Nach Merge** → Deploy läuft (Helm/ArgoCD/CI) → die **Topics werden angelegt** und existieren im Kafka-Cluster.

---

## Dateien in diesem Ordner

| Datei | Zweck |
|-------|--------|
| `kafka-topics-values-template.yaml` | Vorlage: Topic-Namen, Partitionen, Replication, Service-Mapping. Basis für die richtige YAML. |
| *(richtige YAML)* | Liegt typischerweise im Deploy-Repo / in der Pipeline; wird nach Merge deployed, danach existieren die Topics. |

---

## Kurz: Template vs. richtige YAML

- **Template**: Struktur und Defaults, Versionierung hier im Doku-/Bündel-Repo.
- **Richtige YAML**: Env-spezifische Werte (z. B. andere Partitionen/Retention pro Umgebung), lebt im Deploy und wird nach Merge deployed – dann existieren die Kafka-Topics.
