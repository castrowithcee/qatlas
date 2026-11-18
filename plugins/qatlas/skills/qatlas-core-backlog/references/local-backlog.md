---
description: >
  Vertrag des lokalen Qatlas-Backlogs für Tasks, Projekte, Status, Roster, Übergaben und Ideen.
---

# Lokaler Backlog

## Tasks und Projekte

- Ein Task ist eine eigenständig in einer Session erledigbare Arbeitseinheit in
  `.qatlas-brain/backlog/task-<id>-<slug>.md`. Die ID folgt den Task-IDs des
  [Projekt-Wissensraums](../../qatlas-core-filing/references/structure.md).
- Ein Projekt ist ein optionaler Ordner `backlog/<project>/` mit eigenen Tasks und `README.md`. Sein Slug ist
  Kebab-Case, beginnt nicht mit `task-` und ist nicht `done`. Setzt das Projekt einen Plan um, verlinkt sein
  Kopf auf `.qatlas-brain/plans/plan-<slug>.md`, statt Ziel und Umfang zu wiederholen.
- Die Ordnerzugehörigkeit bestimmt die Projektzugehörigkeit. Es gibt kein Feld `project:`.
- Echte Abhängigkeiten und Reihenfolge stehen im Roster, für Tasks eines Projekts in dessen `README.md`. Ein
  Link ersetzt keinen Kontext, den der Task braucht, um eigenständig ausgeführt zu werden.

## Aktueller Taskstand

Ein offener Task ist der kompakte, materialisierte aktuelle Stand seiner Arbeit, kein laufendes Journal. Er
bleibt in einem vollständigen Lesen eigenständig ausführbar:

- Warum, Ergebnis, Scope, geltende Leitplanken, Abhängigkeiten, aktueller Ansatz und Abnahmekriterien
  enthalten nur Aussagen, die noch gelten. Arbeite eine entschiedene Entscheidung an ihrer richtigen Stelle
  ein und entferne dadurch überholte Alternativen. Eine Entscheidung, die über den Task hinaus bindet, wird
  in die reservierte Datei von `.qatlas-brain/` eingearbeitet, die sie betrifft, oder in `AGENTS.md`, wenn
  sie in jeder Session gelten muss.
- Bei Arbeit an einem bestehenden System hält der Task die Ausführungsbasis nach der Ausführungsreife der
  Backlog-Norm fest.
- Der Abschnitt `Abschlussbericht` ist die einzige statusabhängige Übergabestelle. Ersetze und verdichte
  seinen bisherigen Inhalt bei einem Übergang, statt Laufberichte oder erledigte Review-Karten anzuhängen.
  Nach einer Klärung bleibt nur ein noch nötiger aktueller Stand oder `- Keine.`. Er enthält:
  - bei `review` nur die aktuelle Übergabe an den Nutzer nach der Backlog-Norm,
  - bei `waiting` Grund, Wiederaufnahmesignal, verifizierten Stand und nächsten Schritt,
  - bei `done` `- Keine.` oder nur wichtige Entscheidungen, Auffälligkeiten, Risiken, Warnungen und
    Abweichungen sowie die Orte, an denen dauerhafte Projektwahrheiten oder falsch gewordene Dokumentation
    aktualisiert wurden. Nenne jeden dieser Punkte auch im abschließenden Chat.
- Rohe Logs, vollständige Befehlsausgaben, allgemeine Kommunikation, verworfene Versuche und eine Chronologie,
  die für den nächsten Schritt nicht nötig ist, gehören nicht in den Task. Die Git-Historie ist das Protokoll
  der Vergangenheit.
- Verweise auf stabile Repo-Quellen dürfen deren Inhalt kurz zusammenfassen, statt ihn vollständig zu
  duplizieren. Alle Grenzen und Entscheidungen, die für die konkrete Ausführung nötig sind, bleiben im Task.

Schneide nie nach einer harten Token-, Zeilen- oder Zeichengrenze. Lässt sich selbst der noch gültige
Taskvertrag nicht mehr in einer Session ausführen, schneide die verbleibende Arbeit bewusst neu. Entferne
keine bindende Entscheidung und keinen nötigen Grund nur für eine kleinere Datei.

Lies vor einem neuen Task [die kanonische Task-Vorlage](../assets/task.md) vollständig, vor einem neuen
Projektkopf zusätzlich [die kanonische Projektvorlage](../assets/project-readme.md). Vorlagen und dieser
Vertrag gelten unabhängig davon, wie ein Task entsteht. Nutzervorlagen unter `.qatlas-brain/templates/`
ersetzen sie nicht.

## Status

- Der Status steht im Frontmatter-Feld `status` des Tasks. Widersprechen sich Status und Roster, gewinnt der
  Status.
- Die Reihenfolge der `ready`-Tasks ist ihre Reihenfolge im Roster, für Tasks eines Projekts in dessen
  `README.md`.
- Pflege bei jedem Statuswechsel im selben Schritt den Roster.
- Der Abschluss ist ein einziger Schritt: `status: done`, abschließender `Abschlussbericht` und Verschieben
  nach `done/`. Ein `done`-Task liegt nur dort.
- Ein Task mit dem früheren Status `next` gilt als `ready`. Setze ihn bei der nächsten Änderung auf `ready`
  und stelle ihn im Roster vor die übrigen `ready`-Tasks.

Projektköpfe nutzen davon unabhängig `active -> final -> archived`. Ihr `active` heißt, dass das Projekt
lebt, nicht dass ein Worker daran arbeitet.

## Roster

`BACKLOG.md` ist die einzige Übersicht. Sie enthält eine Zeile pro unfertigem Root-Task und Projekt: Link,
Status und Kurzstand. Projektzeilen verweisen auf ihre `README.md`. Innerhalb einer für den Gegenstand
zulässigen Reihenfolge stehen Tasks als `review`, `in-progress`, `waiting`, `ready`, `draft`.
Projektzeilen folgen ihrer Gegenstandsreihenfolge. Fertige Root-Tasks entfallen. Projekte dürfen ihren
Aufbauverlauf behalten.

## Ideen

`IDEAS.md` ist das getrennte Inventar unverbindlicher Ideen und wird mit der ersten Idee angelegt. Sie
trägt keine Task-IDs, Datumsfelder oder Status. Wird eine Idee bewusst zu Arbeit, lege zuerst den
vollständigen Task oder das vollständige Projekt an und entferne dann den übernommenen Ideeneintrag.
