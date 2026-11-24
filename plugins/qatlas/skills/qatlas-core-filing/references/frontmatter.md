---
description: >
  Frontmatter-Schema für Inhalts-Markdown-Dateien: description, die vier Inhaltstypen, wo sie gelten und
  wie sie sich unterscheiden, Bearbeitungsrechte, Pflichtfelder und Änderungen an Ort und Stelle.
---

# Frontmatter-Schema

Jede Inhalts-Markdown-Datei beginnt mit Frontmatter. Die beiden Zonen bleiben davon frei, ebenso die Issues
des lokalen Backlogs, deren Felder das Backlog-Skript führt. Dateien, die einem
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

Einen `type` trägt nur eine Inhaltsdatei, deren Ort ihre Behandlung nicht schon festlegt: Dateien in
`knowledge/` und `playbooks/` des Wissensraums und der Library sowie Inhaltsdateien außerhalb davon.
Reservierte Dateien, die Dateien ihrer Ordner, `BACKLOG.md`, `MEMORY.md`, Memories und eine `FRAMEWORK.md`
tragen keinen: Ihre Aufgabe sagt, wie sie zu behandeln sind.

`type` sagt, wie eine Datei zu behandeln ist, ohne ihren Inhalt zu lesen. Prüfe die Fragen in dieser
Reihenfolge. Der erste Treffer entscheidet:

| Reihenfolge | `type` | Frage | Standard-`edit` |
|---|---|---|---|
| 1 | `policy` | Bindet es alle, die in seinem Geltungsbereich arbeiten, Mensch oder Agent, bis der Nutzer es ändert? | `locked` |
| 2 | `playbook` | Beschreibt es Schritte, wie etwas zu tun ist, für Mensch oder Agent? | `shared` |
| 3 | `fact` | Gibt es eine externe Quelle wieder? | `shared` |
| 4 | `knowledge` | Alles andere: Fachwissen und Synthese. | `shared` |

Eine `policy` als eigene Datei gibt es nur im Fachinhalt außerhalb von Wissensraum und Library. Dort steht
Bindendes in der reservierten Datei, deren Aufgabe es betrifft.

- **Vorhaben oder Policy:** Ein Vorhaben hat ein Ende („Mountainbike kaufen“). Es ist Arbeit und lebt als
  Tasks im Planungssystem, nicht als Datei im Wissensraum. Eine Policy hat kein Ende. Sie gilt („das Fahrrad ist
  rot“) und bindet jedes spätere Vorhaben, bis der Nutzer sie ändert. Was ein Vorhaben dauerhaft festlegt,
  wird zur Policy.
- **Was eine Policy enthält:** eine einzelne festgelegte Wahl („die Datenbank ist Postgres“) ebenso wie ein
  Bündel von Normen dafür, wie gearbeitet wird („Dateinamen sind Kebab-Case“). Wo ihr Grund nicht
  selbstverständlich ist, trägt sie ihn mit, damit eine spätere Änderung ihn abwägen kann. Ihr Ort bestimmt
  ihre Reichweite: Was das Projekt bindet, steht in den reservierten Dateien seines Wissensraums, was den
  Nutzer projektübergreifend bindet, in denen seiner Library, die Regeln von Qatlas im Plugin.
- **Playbook oder Skill:** Ein Playbook ist Inhalt, dem jeder folgen kann. Ein Skill ist eine
  agentenstandardkonforme `SKILL.md` und liegt außerhalb dieses Schemas.

Repo-Wissen hat Vorrang vor Trainingswissen. `fact` bleibt an seine externe Quelle gebunden, Bindendes
an eine Entscheidung des Nutzers. Der Agent hält eine eigene Entscheidung nie als `policy` oder als Regel in
einer reservierten Datei fest. Eine offene Frage bleibt in ihrem Task, bis der Nutzer sie entscheidet.

## Bearbeitungsrechte

`edit` legt die zulässige Pflege unabhängig vom `type` fest. `edit: locked` schützt Policies und wirklich
normative oder anweisende Inhalte. Ändere sie nur mit Freigabe des Nutzers oder eines ausdrücklich gestarteten
Qatlas-Verfahrens und an Ort und Stelle. `edit: shared` lässt Agent und Nutzer die Datei im autorisierten
Ablauf pflegen, ändert aber nie die Absicht des Projekts ohne passende Entscheidung des Nutzers. Folge dem
Standard und weiche nur mit benanntem Grund ab: für eine Datei mit `type` aus der Tabelle oben, für eine
reservierte Datei und die Dateien ihres Ordners aus dem [Projekt-Wissensraum](structure.md), für
`BACKLOG.md`, `MEMORY.md` und Memories `shared`, für eine `FRAMEWORK.md` `locked`. Entferne ein bestehendes `locked` nie
pauschal. Ordne Inhalte nach ihrem Inhalt ein und hole die nötige Freigabe ein. Weder Umbenennen, Verschieben,
`type`, Ordner noch bloßes Lesen ändern Bearbeitungsrechte, Geltungsbereich oder Rang einer Aussage.

## Felder

`description` und `edit` sind immer vorhanden, `type` nur nach dem Abschnitt „Typen“. Die zusätzlichen Felder
sind abschließend: `policy` darf `paths` tragen, `fact` darf `source` tragen.

Eine mitgelieferte, kopierfertige Vorlage unter `skills/*/assets/` darf das Frontmatter ihres Ziels schon
tragen, wenn ihr Text die konkrete Zieldatei nennt und verlangt, vor dem Schreiben alle Platzhalter zu
ersetzen. Beurteile ihr Frontmatter am Ziel. Die Ausnahme gilt weder für gewöhnliche Inhaltsdateien noch für
Vorlagen im Besitz des Nutzers.

## Änderungen

Es gibt genau eine gültige Datei pro Gegenstand, nie eine Kopie mit einer Version im Namen. Eine Datei wird
an Ort und Stelle geändert. Git bewahrt ihre früheren Stände.

- Eine Policy ändert sich nur auf Entscheidung des Nutzers. Eine Datei pro Kontext darf um weitere Policies
  desselben Kontexts wachsen.
- Der aktuelle Stand gilt, bis der Nutzer anders entscheidet. Lies frühere Stände in Git nur, um etwas
  wiederherzustellen oder wenn der Nutzer die Historie verlangt.

## Invarianten

1. Ändere `type` nachträglich nur nach Rückfrage. Setze `edit` nach tatsächlicher Verbindlichkeit und
   Pflegeberechtigung, nicht allein nach `type`, Pfad oder Dateiname.
2. Vermische in einer Datei mit `type` nicht `policy` mit unverbindlichem Inhalt.
3. Eine Datei hat ein `edit`, bestimmt durch ihr strengstes Material. Kennzeichne Abschnitte nicht einzeln.
4. Teile eine Datei nicht künstlich nur wegen ihres Frontmatters.
5. Ändere ein `fact` nur zusammen mit seiner Quelle.

Minimale Form für `knowledge`. Eine Datei ohne `type` lässt nur diese Zeile weg:

```yaml
---
description: >
  Subject and purpose of the file as one sentence with the decisive search terms.
type: knowledge
edit: shared
---
```
