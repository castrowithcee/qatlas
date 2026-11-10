---
description: >
  Frontmatter-Schema für Inhalts-Markdown-Dateien: description, die acht Inhaltstypen und ihre
  Unterscheidung, Bearbeitungsrechte, Pflichtfelder und Änderungen an Ort und Stelle.
---

# Frontmatter-Schema

Jede Inhalts-Markdown-Datei beginnt mit Frontmatter. Die beiden Zonen bleiben davon frei. Dateien, die einem
offiziellen Agentenstandard folgen, etwa `SKILL.md`, agentennative Befehle und Agentenanweisungsdateien wie
`AGENTS.md`, folgen diesem Standard und tragen weder `type` noch `edit`. Mitgelieferte Plugin-Dateien tragen
außer den Feldern ihres Agentenstandards nur `description`.

## Suchfelder

`description` ist ein kurzer, in sich verständlicher Satz zu Gegenstand und Zweck mit den unterscheidenden
Suchbegriffen. Bereich und Thema stehen im Pfad. Schreibe sie als folded block scalar:

```yaml
description: >
  Subject and purpose of the file as one sentence with the decisive search terms.
```

Optionale `tags` sind eine Liste kleingeschriebener Kebab-Case-Werte, kein zweiter Suchtext.

## Typen

`type` sagt, wie eine Datei zu behandeln ist, ohne ihren Inhalt zu lesen. Prüfe die Fragen in dieser
Reihenfolge; der erste Treffer entscheidet:

| Reihenfolge | `type` | Frage | Standard-`edit` |
|---|---|---|---|
| 1 | `task` | Ist es ein Arbeitspaket, das erledigt werden soll? | `shared` |
| 2 | `meta` | Ist es eine Datei, die existiert, weil Qatlas sie ins Projekt bringt: Navigation, Index, Planungseintrag oder Scope-Rahmen? | `shared`; `FRAMEWORK.md` `locked` |
| 3 | `plan` | Ist es ein Vorhaben, das abgeschlossen werden kann? | `shared` |
| 4 | `policy` | Bindet es alle, die in seinem Geltungsbereich arbeiten, Mensch oder Agent, bis der Nutzer es ändert? | `locked` |
| 5 | `playbook` | Beschreibt es Schritte, wie etwas zu tun ist, für Mensch oder Agent? | `shared` |
| 6 | `fact` | Gibt es eine externe Quelle wieder? | `shared` |
| 7 | `memory` | Ist es ein kurzer Hinweis für spätere Sessions? | `shared` |
| 8 | `knowledge` | Alles andere: Fachwissen, Synthese, Beschreibung der aktuellen Architektur. | `shared` |

- **Plan oder Policy:** Ein Plan hat ein Ende. Er hält ein Vorhaben („Mountainbike kaufen“) als Referenz
  fest; die daraus geschnittenen Tasks bestimmen die konkrete Arbeit. Eine Policy hat kein Ende. Sie gilt
  („das Fahrrad ist rot“) und bindet jedes spätere Vorhaben, bis der Nutzer sie ändert. Was ein Plan
  dauerhaft festlegt, wird zur Policy, und der Plan verlinkt sie, statt sie zu wiederholen.
- **Was eine Policy enthält:** eine einzelne festgelegte Wahl („die Datenbank ist Postgres“) ebenso wie ein
  Bündel von Normen dafür, wie gearbeitet wird („Dateinamen sind Kebab-Case“). Wo ihr Grund nicht
  selbstverständlich ist, trägt sie ihn mit, damit eine spätere Änderung ihn abwägen kann. Ihr Ort bestimmt
  ihre Reichweite: Die Policies des Projekts liegen in den reservierten Dateien seines Wissensraums, die
  projektübergreifenden Policies des Nutzers in dessen Library, die Qatlas-Policies im Plugin.
- **Playbook oder Skill:** Ein Playbook ist Inhalt, dem jeder folgen kann. Ein Skill ist eine
  agentenstandardkonforme `SKILL.md` und liegt außerhalb dieses Schemas.

Repo-Wissen hat Vorrang vor Trainingswissen. `fact` bleibt an seine externe Quelle gebunden, eine Projekt-
oder Library-`policy` an eine Entscheidung des Nutzers. Der Agent hält eine eigene Entscheidung nie als
`policy` fest; eine offene Frage bleibt in ihrem Plan oder Task, bis der Nutzer sie entscheidet.

## Bearbeitungsrechte

`edit` legt die zulässige Pflege unabhängig vom `type` fest. `edit: locked` schützt Policies und wirklich
normative oder anweisende Inhalte; ändere sie nur mit Freigabe und an Ort und Stelle. `edit: shared` lässt
Agent und Nutzer die Datei im autorisierten Ablauf pflegen, ändert aber nie die Absicht des Projekts ohne
passende Entscheidung des Nutzers. Folge dem Standard aus der Tabelle und weiche nur mit benanntem Grund ab.
Entferne ein bestehendes `locked` nie pauschal; ordne Inhalte nach ihrem Inhalt ein und hole die nötige
Freigabe ein. Weder Umbenennen, Verschieben, `type`, Ordner noch bloßes Lesen ändern Bearbeitungsrechte,
Geltungsbereich oder Rang einer Aussage.

## Felder

`description`, `type` und `edit` sind immer vorhanden. Die zusätzlichen Felder sind abschließend:

| `type` | Zusätzliche Felder |
|---|---|
| `meta` | keine; ein Projektkopf im lokalen Backlog ergänzt `status` |
| `task` | `status` |
| `plan` | `status` (`active` oder `done`) |
| `policy` | optional `paths` |
| `playbook`, `knowledge`, `memory` | keine |
| `fact` | optional `source` |

Task-Statuswerte gehören zum Vertrag des lokalen Backlogs. Ein Plan ist `done`, sobald er erfüllt oder
verworfen ist; er leitet dann keine laufende Arbeit mehr, und was daraus gilt, steht in den reservierten
Dateien.
Feste `meta`-Ziele sind `BACKLOG.md`, `IDEAS.md`, `MEMORY.md`, ein Projektkopf im lokalen Backlog und eine
`FRAMEWORK.md` außerhalb des Wissensraums. Die reservierten Root-Dateien tragen ihren Inhaltstyp:
`CONVENTIONS.md`, `TESTING.md` und `CONTRIBUTING.md` sind `policy`, `ARCHITECTURE.md` ist `knowledge`.

Eine mitgelieferte, kopierfertige Vorlage unter `skills/*/assets/` darf das Frontmatter ihres Ziels schon
tragen, wenn ihr Text die konkrete Zieldatei nennt und verlangt, vor dem Schreiben alle Platzhalter zu
ersetzen. Beurteile ihr Frontmatter am Ziel. Die Ausnahme gilt weder für gewöhnliche Inhaltsdateien noch für
Vorlagen im Besitz des Nutzers.

## Änderungen

Es gibt genau eine gültige Datei pro Gegenstand, nie eine Kopie mit einer Version im Namen. Eine Datei wird
an Ort und Stelle geändert; Git bewahrt ihre früheren Stände.

- Eine Policy ändert sich nur auf Entscheidung des Nutzers. Eine Datei pro Kontext darf um weitere Policies
  desselben Kontexts wachsen.
- Der aktuelle Stand gilt, bis der Nutzer anders entscheidet. Lies frühere Stände in Git nur, um etwas
  wiederherzustellen oder wenn der Nutzer die Historie verlangt.

## Invarianten

1. Ändere `type` nachträglich nur nach Rückfrage. Setze `edit` nach tatsächlicher Verbindlichkeit und
   Pflegeberechtigung, nicht allein nach `type`, Pfad oder Dateiname.
2. Vermische `meta` nicht mit Inhaltstypen und `policy` nicht mit unverbindlichem Inhalt in derselben Datei.
3. Eine Datei hat ein `edit`, bestimmt durch ihr strengstes Material. Kennzeichne Abschnitte nicht einzeln.
4. Teile eine Datei nicht künstlich nur wegen ihres Frontmatters.
5. Ändere ein `fact` nur zusammen mit seiner Quelle.

Minimale Form für `knowledge`:

```yaml
---
description: >
  Subject and purpose of the file as one sentence with the decisive search terms.
type: knowledge
edit: shared
---
```
