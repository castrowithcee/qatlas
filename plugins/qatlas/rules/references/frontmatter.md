---
description: >
  Vollständige, vor einer Markdown-Änderung geladene Rule-Referenz für Suchtext, Inhaltstypen,
  Bearbeitungsrechte, Pflichtfelder und Datumsfelder.
license: MIT
type: rule
edit: locked
---

# Vollständiges Frontmatter-Schema

Jede inhaltliche Markdown-Datei beginnt mit Frontmatter. Rohzonen und ausdrücklich definierte strukturelle
READMEs bleiben frei davon. Wende Typ, Bearbeitungsrecht und Pflichtfelder vor jeder Dateiänderung an; ändere
einen vorhandenen `type` nur nach Rückfrage.

## Suche

Suche zuerst in `description`, `tags`, `type` und `status`, öffne die Bodies passender Treffer und erweitere
erst danach auf Volltext. `description` ist ein knapper, eigenständiger Satz über Gegenstand und Zweck mit
den unterscheidenden Suchbegriffen. Bereich und Thema stehen im Pfad. Schreibe sie als gefalteten
Block-Skalar:

```yaml
description: >
  Gegenstand und Zweck der Datei als ein Satz mit den entscheidenden Suchbegriffen.
```

Optionale `tags` sind eine Liste aus lowercase-kebab-case-Werten, kein zweiter Suchtext.

## Vorrang und Bearbeitung

Repo-Wissen hat Vorrang vor Trainingswissen. `fact` bleibt an seine externe Quelle, `decision` an eine
Entscheidung des Nutzers gebunden. Der Agent hält keine eigene Entscheidung als `decision` fest.

`edit: locked` schützt autoritative oder instruierende Inhalte. Ändere sie nur nach Freigabe und am
vorhandenen Ort. `edit: shared` erlaubt Agent und Nutzer die Pflege im normalen Arbeitsfluss.

## Typen und Pflichtfelder

`description`, `type` und das feste `edit` sind immer vorhanden. `status` und `tags` sind optional, wenn sie
einen echten Zweck erfüllen. Die zusätzlichen Felder dieser Tabelle sind abschließend:

| `type` | `edit` | Bedeutung und zusätzliche Felder |
|---|---|---|
| `meta` | `locked` | Dauerhafte Steuerung, Rahmen oder Navigation; keine Datumsfelder. |
| `rule` | `locked` | Dauerhafte Verhaltensnorm; optional `paths`, keine Datumsfelder. |
| `skill` | `locked` | Aktiv ausgelöstes Verfahren; `name`, optional `argument-hint` und `disable-model-invocation`, keine Datumsfelder. |
| `fact` | `locked` | Extern gebundene Wahrheit; optional `source`, Pflichtfeld `updated`. |
| `knowledge` | `shared` | Veränderliches Fachwissen und Synthese; `created`, `updated`. |
| `playbook` | `locked` | Wiederholbares neutrales Verfahren; grundsätzlich keine Datumsfelder. |
| `decision` | `locked` | Bindende Entscheidung des Nutzers; `created`. |
| `history` | `shared` | Nur ergänztes Protokoll, wenn die Chronologie ausgewertet wird; `created`, `updated`. |
| `task` | `shared` | Lokales Arbeitspaket; `status`, `created`, `updated`. |
| `memory` | `shared` | Datei im festen Memory-Subsystem; keine weiteren Pflichtfelder. |

Feste Ausnahmen mit `type: meta` und `edit: shared` sind jede `INDEX.md` beziehungsweise `index.md`, jede
`HISTORY.md`, `.qatlas/project/backlog/BACKLOG.md` und `.qatlas/project/backlog/IDEAS.md`. Ein Projektindex trägt
zusätzlich `status`.

`status` ist ein Pflichtfeld oder Suchmerkmal, aber seine Werte gehören zum jeweiligen Lebenszyklus und
nicht in dieses allgemeine Inhaltsschema. Für lokale Tasks bestimmen die Backlog-Regel und ihre bedingt
geladene Referenz die aktuelle Zustandsmenge. Projektindizes und andere Inhaltstypen behalten ihre eigenen
Statusmodelle.

`source` steht nur auf einem Snapshot von etwas Externem. Datumsfelder stehen nie auf `meta`, `rule` oder
`skill`; ein bewusst datiertes Playbook ist die einzige Ausnahme.

## Invarianten

1. Ändere `type` nachträglich nur nach Rückfrage. Leite `edit` aus dem Typ oder einer festen Ausnahme ab.
2. Mische Rahmen (`meta`, `rule`, `skill`) und Inhaltstypen nicht in derselben Datei.
3. Eine Datei hat ein `edit`, bestimmt vom strengsten Material. Markiere keine Abschnitte einzeln.
4. Teile eine Datei nicht künstlich nur für ihr Frontmatter auf.
5. Ändere `fact` nur mit seiner Quelle und `decision` nur mit einer neuen Nutzerentscheidung.

Minimale Form für `knowledge`:

```yaml
---
description: >
  Gegenstand und Zweck der Datei als ein Satz mit den entscheidenden Suchbegriffen.
type: knowledge
edit: shared
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Offizielle Agentenstandards für Skills, Rules und Commands haben Vorrang vor diesem Inhaltsschema. Ein
agent-nativer Command trägt kein `type` oder `edit`. Ausgelieferter Qatlas-Text darf `license` tragen;
Projektinhalt nicht.
