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
READMEs außerhalb von `.qatlas-project/` bleiben frei davon. Wende Typ, Bearbeitungsrecht und Pflichtfelder
vor jeder Dateiänderung an; ändere einen vorhandenen `type` nur nach Rückfrage.

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

`type` beschreibt die Art des Inhalts. `edit` beschreibt unabhängig davon die zulässige Pflege.
`edit: locked` schützt akzeptierte Entscheidungen und tatsächlich normative oder instruierende Inhalte;
ändere sie nur nach Freigabe und am vorhandenen Ort. `edit: shared` erlaubt Agent und Nutzer die Pflege im
autorisierten Arbeitsfluss, aber keine Änderung der Projektabsicht ohne entsprechende Nutzerentscheidung.
Eine Umbenennung oder Verschiebung ändert das Bearbeitungsrecht nicht.

## Typen und Pflichtfelder

`description`, `type` und `edit` sind immer vorhanden. `status` und `tags` sind optional, wenn sie
einen echten Zweck erfüllen. Die zusätzlichen Felder dieser Tabelle sind abschließend:

| `type` | Bedeutung und zusätzliche Felder | Übliche Pflege |
|---|---|---|
| `meta` | Dauerhafte Steuerung, Rahmen oder Navigation; keine Datumsfelder. | Normativer Rahmen `locked`, Navigation und beschreibende Projektpflege `shared`. |
| `rule` | Dauerhafte Verhaltensnorm; optional `paths`, keine Datumsfelder. | `locked` |
| `skill` | Aktiv ausgelöstes Verfahren; `name`, optional `argument-hint` und `disable-model-invocation`, keine Datumsfelder. | `locked` |
| `fact` | Extern gebundene Wahrheit; optional `source`, Pflichtfeld `updated`. | `shared`, wenn sie im Arbeitsfluss gegen die Quelle gepflegt werden soll; sonst begründet `locked`. |
| `knowledge` | Veränderliches Fachwissen und Synthese; `created`, `updated`. | `shared` |
| `playbook` | Wiederholbares neutrales Verfahren; grundsätzlich keine Datumsfelder. | Beschreibendes Verfahren `shared`, tatsächlich normative Vorgabe `locked`. |
| `decision` | Entscheidung des Nutzers; `created`. | Akzeptierte Entscheidung `locked`, noch nicht akzeptierter Entwurf `shared`. |
| `history` | Nur ergänztes Protokoll, wenn die Chronologie ausgewertet wird; `created`, `updated`. | `shared` |
| `task` | Lokales Arbeitspaket; `status`, `created`, `updated`. | `shared` |
| `memory` | Datei im festen Memory-Subsystem; keine weiteren Pflichtfelder. | `shared` |

Feste Ziele mit `type: meta` und `edit: shared` sind jede README im Projektwissensraum, jede `HISTORY.md`,
`.qatlas-project/backlog/BACKLOG.md` und `.qatlas-project/backlog/IDEAS.md`. Eine `FRAMEWORK.md` im
Projektwissensraum trägt `type: meta` und `edit: locked`; sie enthält nur bestätigte, für ihren Scope
geltende Arbeitsregeln. Ein Projektkopf im lokalen Backlog trägt zusätzlich `status`.

Eine ausgelieferte kopierfertige Vorlage unter `store/` oder `skills/*/assets/` darf bereits das
Frontmatter eines solchen Ausnahmeziels tragen, wenn ihr Body den konkreten Zieldateinamen nennt und vor dem
Schreiben die Ersetzung aller Platzhalter verlangt. Beurteile ihr Frontmatter dann gegen dieses Ziel. Die
Ausnahme gilt weder für gewöhnliche Inhaltsdateien noch für nutzereigene Vorlagen.

`status` ist ein Pflichtfeld oder Suchmerkmal, aber seine Werte gehören zum jeweiligen Lebenszyklus und
nicht in dieses allgemeine Inhaltsschema. Für lokale Tasks bestimmen die Backlog-Regel und ihre bedingt
geladene Referenz die aktuelle Zustandsmenge. Projektköpfe und andere Inhaltstypen behalten ihre eigenen
Statusmodelle.

`source` steht nur auf einem Snapshot von etwas Externem. Datumsfelder stehen nie auf `meta`, `rule` oder
`skill`; ein bewusst datiertes Playbook ist die einzige Ausnahme.

## Invarianten

1. Ändere `type` nachträglich nur nach Rückfrage. Bestimme `edit` nach der tatsächlichen Verbindlichkeit und
   Pflegebefugnis, nicht allein aus `type`, Pfad oder Dateiname.
2. Mische Rahmen (`meta`, `rule`, `skill`) und Inhaltstypen nicht in derselben Datei.
3. Eine Datei hat ein `edit`, bestimmt vom strengsten Material. Markiere keine Abschnitte einzeln.
4. Teile eine Datei nicht künstlich nur für ihr Frontmatter auf.
5. Ändere `fact` nur mit seiner Quelle und eine akzeptierte `decision` nur mit einer neuen
   Nutzerentscheidung.

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
