---
description: >
  Vertrag des lokalen Qatlas-Backlogs für Tasks, Projekte, Status, Roster, Übergaben und Ideen.
---

# Lokaler Backlog

## Tasks und Projekte

- Ein Task ist eine eigenständig in einer Session erledigbare Arbeitseinheit in
  `.qatlas-project/backlog/task-<id>-<slug>.md`. Die ID folgt den Task-IDs des
  [Projekt-Wissensraums](../../qatlas-core-filing/references/structure.md).
- Ein Projekt ist ein optionaler Ordner `backlog/<project>/` mit eigenen Tasks und `README.md`. Sein Slug ist
  Kebab-Case, beginnt nicht mit `task-` und ist nicht `done`. Setzt das Projekt einen Plan um, verlinkt sein
  Kopf auf `.qatlas-project/plans/plan-<slug>.md`, statt Ziel und Umfang zu wiederholen.
- Die Ordnerzugehörigkeit bestimmt die Projektzugehörigkeit; es gibt kein Feld `project:`.
- Echte Abhängigkeiten und Reihenfolge stehen im Roster, für Tasks eines Projekts in dessen `README.md`. Ein
  Link ersetzt keinen Kontext, den der Task braucht, um eigenständig ausgeführt zu werden.

## Aktueller Taskstand

Ein offener Task ist der kompakte, materialisierte aktuelle Stand seiner Arbeit, kein laufendes Journal. Er
bleibt in einem vollständigen Lesen eigenständig ausführbar:

- Warum, Ergebnis, Scope, geltende Leitplanken, Abhängigkeiten, aktueller Ansatz und Abnahmekriterien
  enthalten nur Aussagen, die noch gelten. Arbeite eine entschiedene Entscheidung an ihrer richtigen Stelle
  ein und entferne dadurch überholte Alternativen. Eine Entscheidung, die über den Task hinaus bindet, wird
  in die reservierte Datei von `.qatlas-project/` eingearbeitet, die sie betrifft, oder in `AGENTS.md`, wenn
  sie in jeder Session gelten muss.
- Bei Arbeit an einem bestehenden System hält der Task die Ausführungsbasis nach der Ausführungsreife der
  Backlog-Norm fest.
- Der Abschnitt `Abschlussbericht` ist die einzige statusabhängige Übergabestelle. Ersetze und verdichte
  seinen bisherigen Inhalt bei einem Übergang, statt Laufberichte oder erledigte Review-Karten anzuhängen;
  nach einer Klärung bleibt nur ein noch nötiger aktueller Stand oder `- Keine.`. Er enthält:
  - bei `review` nur die aktuelle menschliche Übergabe: Entscheidung, Prüfung oder Abnahme, belegten
    Ist-Stand, Empfehlung, Folge und wiederaufnehmbaren Arbeitsstand;
  - bei `waiting` Grund, Wiederaufnahmesignal, verifizierten Stand und nächsten Schritt;
  - bei `done` `- Keine.` oder nur wichtige Entscheidungen, Auffälligkeiten, Risiken, Warnungen und
    Abweichungen sowie die Orte, an denen dauerhafte Projektwahrheiten oder falsch gewordene Dokumentation
    aktualisiert wurden. Nenne jeden dieser Punkte auch im abschließenden Chat.
- Rohe Logs, vollständige Befehlsausgaben, allgemeine Kommunikation, verworfene Versuche und eine Chronologie,
  die für den nächsten Schritt nicht nötig ist, gehören nicht in den Task. Die Git-Historie ist das Protokoll
  der Vergangenheit.
- Verweise auf stabile Repo-Quellen dürfen deren Inhalt kurz zusammenfassen, statt ihn vollständig zu
  duplizieren. Alle Grenzen und Entscheidungen, die für die konkrete Ausführung nötig sind, bleiben im Task.

Schneide nie nach einer harten Token-, Zeilen- oder Zeichengrenze. Lässt sich selbst der noch gültige
Taskvertrag nicht mehr in einer Session ausführen, schneide die verbleibende Arbeit bewusst neu; entferne
keine bindende Entscheidung und keinen nötigen Grund nur für eine kleinere Datei.

Lies vor einem neuen Task [die kanonische Task-Vorlage](../assets/task.md) vollständig, vor einem neuen
Projektkopf zusätzlich [die kanonische Projektvorlage](../assets/project-readme.md). Vorlagen und dieser
Vertrag gelten unabhängig davon, wie ein Task entsteht; Nutzervorlagen unter `.qatlas-project/templates/`
ersetzen sie nicht.

## Status und Zuständigkeit

Normaler Weg: `draft -> ready -> next -> in-progress -> done`.

Zulässige Rück- und Übergabewege:

- `draft -> waiting`
- `ready -> draft | next | waiting`
- `next -> ready | draft | in-progress | waiting`
- `in-progress -> next | draft | review | waiting | done`
- `review -> next | draft | waiting | done`
- `waiting -> draft | ready | next`

- `draft`: Das Arbeitspaket selbst hat eine offene Frage zu Ergebnis, Scope-in, Scope-out, Ansatz, Abnahme
  oder einen ungeprüften Ist-Stand, der diese Punkte wesentlich ändern könnte.
- `ready`: Nach der Backlog-Norm ausführungsreif, aber nicht Teil des nächsten Ausführungshorizonts.
- `next`: Ebenfalls ausführungsreif und zusätzlich für den kommenden Ausführungshorizont eingeplant. Das
  Roster bestimmt Reihenfolge und Abhängigkeiten.
- `in-progress`: Eine laufende Ausführung hat ihn beansprucht. Ohne sichtbaren Worker kläre zuerst die
  Zuständigkeit und versetze den Task nach seinem tatsächlichen nächsten Schritt in einen anderen Status.
- `review`: Der nächste Schritt ist eine konkrete Entscheidung, Prüfung oder Abnahme durch den Nutzer.
- `waiting`: Eine externe Voraussetzung, Ressource oder ein externes Ereignis verhindert das Weiterarbeiten.
  Grund und Wiederaufnahmesignal müssen konkret sein; eine unfertige interne Task-Abhängigkeit allein genügt
  nicht.
- `done`: Abnahmekriterien erfüllt, vereinbarte Prüfungen verifiziert, Dokumentationsauswirkung erledigt und
  keine offene Frage.

Bewusst zurückgestellte, aber weiter ausführbare Arbeit bleibt `ready` und wird nicht in `next`
eingeplant. Sie braucht keinen eigenen Status.

Eine bestehende `next`-Reihenfolge ist eine bewusste Arbeitsdisposition und wird nicht stillschweigend
verdrängt oder umsortiert. Später automatisch ausgewählte Tasks reihen sich dahinter ein. `next` autorisiert
keine Ausführung. Die Größe des Horizonts bestimmt weder die Parallelität noch den Umfang eines einzelnen
Laufs.

Jeder Task trägt genau einen Status. Im lokalen Backlog ist `next` kein zusätzliches Queue-Feld neben
`ready`; es ersetzt `ready`, solange der Task zum nächsten Horizont gehört. Inhaltlich impliziert `next`
weiterhin die volle Ausführungsreife von `ready`.

Setze einen beanspruchten Task unmittelbar vor der ersten schreibenden Ausführung auf `in-progress` und
pflege im selben Schritt sein Roster. Eine bloße Sichtung beansprucht ihn noch nicht.

Technische Schwierigkeit allein macht einen Task weder zu `draft`, `review` noch `waiting`.

Der Abschluss ist ein einziger Schritt: `status: done`, abschließender `Abschlussbericht` und Verschieben
nach `done/`. Ein `done`-Task liegt nur dort. Widersprechen sich Status und Roster, gewinnt der Status.

Projektköpfe nutzen davon unabhängig `active -> final -> archived`. Ihr `active` heißt, dass das Projekt
lebt, nicht dass ein Worker daran arbeitet.

## Roster

`BACKLOG.md` ist die einzige Übersicht. Sie enthält eine Zeile pro unfertigem Root-Task und Projekt: Link,
Status und Kurzstand. Projektzeilen verweisen auf ihre `README.md`. Innerhalb einer für den Gegenstand
zulässigen Reihenfolge stehen Tasks als `review`, `in-progress`, `next`, `waiting`, `ready`, `draft`;
Projektzeilen folgen ihrer Gegenstandsreihenfolge. Fertige Root-Tasks entfallen; Projekte dürfen ihren
Aufbauverlauf behalten.

## Ideen

`IDEAS.md` ist das getrennte Inventar unverbindlicher Ideen und wird mit der ersten Idee angelegt. Sie
trägt keine Task-IDs, Datumsfelder oder Status. Wird eine Idee bewusst zu Arbeit, lege zuerst den
vollständigen Task oder das vollständige Projekt an und entferne dann den übernommenen Ideeneintrag. Bei
einem externen Planungssystem gibt es keine `IDEAS.md`; Ideen gehen an das Entwurfsobjekt, das die Bindung
nennt.
