---
description: >
  Frontmatter-Schema für inhaltliche Markdown-Dateien: description, Inhaltstypen, Bearbeitungsrechte,
  Pflichtfelder, Datumsfelder sowie Versionierung und Ablösung wichtiger Dokumente.
license: MIT
type: rule
edit: locked
---

# Frontmatter-Schema

Jede inhaltliche Markdown-Datei beginnt mit Frontmatter. Rohzonen und ausdrücklich definierte strukturelle
READMEs außerhalb von `.qatlas-project/` bleiben frei davon.

## Suchfelder

`description` ist ein knapper, eigenständiger Satz über Gegenstand und Zweck mit den unterscheidenden
Suchbegriffen. Bereich und Thema stehen im Pfad. Schreibe sie als gefalteten Block-Skalar:

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
Entferne ein vorhandenes `locked` nie pauschal; klassifiziere Inhalt für Inhalt und hole die erforderliche
Freigabe ein. Ein Entwurf ist noch keine akzeptierte Entscheidung. Beschreibende Architektur, Wissen,
Navigation und operative Dokumentation sind gewöhnlich `shared`. Aktualisiere einen Architektur-Fakt nach
autorisierter Umsetzung, ohne dadurch eine akzeptierte Entscheidung zu entsperren. Weder Umbenennen,
Verschieben, `type`, Präfix, Dotfolder-Lage noch bloßes Lesen ändern Bearbeitungsrecht, Geltungsbereich
oder Rang einer Aussage.

## Typen und Pflichtfelder

`description`, `type` und `edit` sind immer vorhanden. `status` und `tags` sind optional, wenn sie
einen echten Zweck erfüllen. Die zusätzlichen Felder dieser Tabelle sind abschließend:

| `type` | Bedeutung und zusätzliche Felder | Übliche Pflege |
|---|---|---|
| `meta` | Dauerhafte Steuerung, Rahmen oder Navigation; keine Datumsfelder, nur eine `FRAMEWORK.md` trägt `version` und `updated`. | Normativer Rahmen `locked`, Navigation und beschreibende Projektpflege `shared`. |
| `rule` | Dauerhafte Verhaltensnorm; `version`, `updated`, optional `paths`. | `locked` |
| `skill` | Aktiv ausgelöstes Verfahren; `name`, optional `argument-hint` und `disable-model-invocation`, keine Datumsfelder. | `locked` |
| `fact` | Extern gebundene Wahrheit; optional `source`, Pflichtfelder `version` und `updated`. | `shared`, wenn sie im Arbeitsfluss gegen die Quelle gepflegt werden soll; sonst begründet `locked`. |
| `knowledge` | Veränderliches Fachwissen und Synthese; `version`, `created`, `updated`. | `shared` |
| `playbook` | Wiederholbares neutrales Verfahren; `version`, `updated`. | Beschreibendes Verfahren `shared`, tatsächlich normative Vorgabe `locked`. |
| `decision` | Entscheidung oder bestätigter Plan des Nutzers; `created`, `status`, bei Ablösung `supersedes` oder `superseded_by`. | Akzeptierte Entscheidung `locked`, noch nicht akzeptierter Entwurf `shared`. |
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
nicht in dieses allgemeine Inhaltsschema. Für lokale Tasks bestimmt der lokale Backlog-Vertrag die
aktuelle Zustandsmenge. Projektköpfe und andere Inhaltstypen behalten ihre eigenen
Statusmodelle.

`source` steht nur auf einem Snapshot von etwas Externem. Datumsfelder stehen nie auf `skill` und auf
`meta` nur in einer `FRAMEWORK.md`.

## Versionierung und Ablösung

Ob und wann sich ein wichtiges Dokument geändert hat, steht in der Datei selbst; Git beantwortet, was sich
geändert hat. Es gibt genau eine gültige Datei je Gegenstand, nie eine Kopie mit Versionssuffix im Namen.

- **Fortgeschrieben:** `knowledge`, `fact`, `rule`, `playbook` und `FRAMEWORK.md` werden am Ort geändert.
  `version` ist eine ganze Zahl ab `1`. Jede inhaltliche Änderung erhöht sie um eins und setzt `updated`
  auf das Änderungsdatum. Reine Form-, Tippfehler- oder Verweiskorrekturen ändern keines der beiden
  Felder.
- **Festgeschrieben:** Eine `decision` hält mit `status` ihren Zustand: `draft`, `accepted` oder
  `superseded`. Eine angenommene Entscheidung bleibt bis auf Formkorrekturen unverändert. Ihre inhaltliche
  Änderung braucht eine neue Nutzerentscheidung und entsteht als neues Dokument mit neuer Kennung, das das
  alte vollständig ersetzt und `supersedes: <alte Kennung>` trägt. Das alte erhält nur `status:
  superseded` und `superseded_by: <neue Kennung>`. Ziehe Verweise in Navigation und offenen Tasks auf das
  neue Dokument nach. Die Kennung ist der Dateiname ohne `.md`.
- **Ohne Version:** `task`, `history`, `memory`, `skill`, übriges `meta` und Vorlagen folgen ihrem eigenen
  Lebenszyklus. Ausgelieferter Plugin-Text wird über die Plugin-Version versioniert und trägt kein
  `version`.

Fehlen einem bestehenden Dokument diese Felder, ergänze sie still, sobald du die Datei schreibst, auch bei
`edit: locked`; sie ändern keine Aussage. Der vorgefundene Stand wird `version: 1` mit `updated` aus dem
Datum des letzten Commits der Datei, ohne Git-Historie aus dem heutigen Datum. Ändert derselbe Schreibvorgang
den Inhalt, folgt darauf `version: 2` mit heutigem Datum. Eine Entscheidung erhält bei `edit: locked`
`status: accepted`, sonst `status: draft`.

## Invarianten

1. Ändere `type` nachträglich nur nach Rückfrage. Bestimme `edit` nach der tatsächlichen Verbindlichkeit und
   Pflegebefugnis, nicht allein aus `type`, Pfad oder Dateiname.
2. Mische Rahmen (`meta`, `rule`, `skill`) und Inhaltstypen nicht in derselben Datei.
3. Eine Datei hat ein `edit`, bestimmt vom strengsten Material. Markiere keine Abschnitte einzeln.
4. Teile eine Datei nicht künstlich nur für ihr Frontmatter auf.
5. Ändere `fact` nur mit seiner Quelle. Löse eine akzeptierte `decision` nur auf eine neue
   Nutzerentscheidung durch ein neues Dokument ab.

Minimale Form für `knowledge`:

```yaml
---
description: >
  Gegenstand und Zweck der Datei als ein Satz mit den entscheidenden Suchbegriffen.
type: knowledge
edit: shared
version: 1
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Offizielle Agentenstandards für Skills, Rules und Commands haben Vorrang vor diesem Inhaltsschema. Ein
agent-nativer Command trägt kein `type` oder `edit`. Ausgelieferter Qatlas-Text darf `license` tragen;
Projektinhalt nicht.
