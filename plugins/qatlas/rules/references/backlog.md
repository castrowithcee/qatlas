---
description: >
  Vollständige, bei tatsächlicher Arbeit im lokalen Qatlas-Backlog geladene Rule-Referenz für Tasks,
  Projekte, Status, Roster, Übergaben und Ideen.
license: MIT
type: rule
edit: locked
---

# Vollständiger Vertrag des lokalen Backlogs

Dieser Vertrag gilt nur, wenn `__qatlas__/backlog/BACKLOG.md` den lokalen Qatlas-Backlog als
maßgebliches Planungssystem ausweist. Bei externer Autorität gilt stattdessen deren Binding; ein lokaler
Spiegel entsteht nicht.

## Aufgaben und Projekte

- Ein Task ist eine eigenständig in einer Session leistbare Arbeitseinheit in
  `__qatlas__/backlog/task-<id>-<slug>.md`. Die ID besteht aus sechs zufälligen kleingeschriebenen
  Hex-Zeichen, wird gegen alle offenen und archivierten Tasks geprüft und nie wiederverwendet.
- Ein Projekt ist ein optionaler Ordner `backlog/<project>/` mit eigenen Tasks und `INDEX.md`. Sein Slug ist
  kebab-case, beginnt nicht mit `task-` und heißt nicht `done`.
- Die Ordnerzugehörigkeit bestimmt die Projektmitgliedschaft; es gibt kein Feld `project:`.
- Echte Abhängigkeiten und Reihenfolge stehen im Roster. Ein Link ersetzt keinen Kontext, den der Task zu
  seiner eigenständigen Ausführung braucht.

## Aktueller Taskzustand

Ein offener Task ist der kompakte, materialisierte Ist-Stand seiner Arbeit, kein fortgeschriebenes Journal.
Er bleibt in einem vollständigen Lesen eigenständig ausführbar:

- Warum, Ergebnis, Scope, geltende Leitplanken, Abhängigkeiten, aktuelles Vorgehen und Abnahmekriterien
  enthalten nur weiterhin gültige Aussagen. Arbeite eine geklärte Entscheidung am fachlich passenden Ort
  ein und entferne dadurch überholte Alternativen.
- Der `Abschlussbericht` ist der einzige statusabhängige Übergabepunkt. Er enthält bei `review` nur die
  aktuelle menschliche Übergabe, bei `waiting` Grund, Wiederaufnahmesignal, belegten Stand und nächsten
  Schritt und bei `done` den kompakten endgültigen Bericht. Ersetze und konsolidiere seinen bisherigen
  Inhalt bei einem Übergang, statt Laufberichte oder erledigte Review-Karten anzuhängen.
- Rohlogs, vollständige Befehlsausgaben, allgemeine Kommunikation, verworfene Versuche und eine für den
  nächsten Schritt nicht nötige Chronologie gehören nicht in den Task. Die lokale Git-Historie ist der
  normale Verlaufsspeicher; eine eigene History-Datei entsteht nur, wenn die Chronologie selbst dauerhaftes
  Projektwissen ist.
- Verweise auf stabile Repo-Quellen dürfen deren Inhalt knapp zusammenfassen, statt ihn vollständig zu
  duplizieren. Alle für die konkrete Ausführung nötigen Grenzen und Entscheidungen bleiben trotzdem im Task.

Kürze nie nach einer harten Token-, Zeilen- oder Zeichengrenze. Ist schon der weiterhin gültige Taskvertrag
nicht mehr in einer Session ausführbar, schneide die verbleibende Arbeit bewusst neu zu; entferne keine
bindende Entscheidung oder nötige Begründung nur für eine kleinere Datei.

Lies vor einem neuen Task vollständig
[die kanonische Taskvorlage](../../store/backlog/task.md), vor einem neuen Projektkopf zusätzlich
[die kanonische Projektvorlage](../../store/backlog/project-index.md). Diese Vorlagen gelten auch ohne
Planungsskill; Nutzervorlagen unter `__qatlas__/templates/` ersetzen sie nicht.

Erzeuge eine Task-ID mit Node und wiederhole bei einer Kollision:

```sh
node -e "process.stdout.write(require('crypto').randomBytes(3).toString('hex'))"
```

## Status und Eigentümerschaft

Normalpfad: `draft -> ready -> next -> in-progress -> done`.

Zulässige Rück- und Übergabepfade:

- `ready -> draft | next`
- `next -> ready | draft | in-progress | waiting`
- `in-progress -> next | draft | review | waiting | done`
- `review -> next | draft | waiting | done`
- `waiting -> draft | ready | next`

- `draft`: Das Arbeitspaket selbst hat eine offene Frage zu Scope-in, Scope-out, Vorgehen oder Abnahme.
- `ready`: Ohne bekannte Vertragsfrage eigenständig ausführbar, aber nicht Teil des nächsten
  Ausführungshorizonts.
- `next`: Ebenfalls vollständig ausführbar und für den kommenden Ausführungshorizont zusätzlich disponiert.
  Der Roster bestimmt Reihenfolge und Abhängigkeiten.
- `in-progress`: Eine laufende Ausführung hat es beansprucht. Ohne sichtbaren Worker kläre zuerst die
  Eigentümerschaft und überführe den Task anhand des tatsächlichen nächsten Schritts in einen anderen Status.
- `review`: Der nächste Schritt ist eine konkrete Entscheidung, Prüfung oder Abnahme des Nutzers.
- `waiting`: Eine externe Voraussetzung, Ressource oder ein Ereignis verhindert die Fortsetzung. Grund und
  Wiederaufnahmesignal müssen konkret sein; eine unerledigte interne Task-Abhängigkeit allein genügt nicht.
- `done`: Abnahmekriterien erfüllt, keine offene Frage.

Bewusst zurückgestellte, aber weiterhin ausführbare Arbeit bleibt `ready` und wird nicht nach `next`
disponiert. Dafür braucht es keinen eigenen Zustand.

Eine bestehende `next`-Reihenfolge ist eine bewusste Arbeitsdisposition und wird nicht still verdrängt oder
umsortiert. Automatisch später ausgewählte Tasks folgen hinter ihr. `next` autorisiert keine Ausführung.
Die Größe des Horizonts bestimmt weder Parallelität noch den Umfang eines einzelnen Laufs.

Jeder Task trägt genau einen Status. `next` ist im lokalen Backlog kein zusätzliches Queue-Feld neben
`ready`, sondern ersetzt `ready`, solange der Task zum nächsten Horizont gehört. Inhaltlich impliziert
`next` weiterhin die vollständige Ausführungsreife von `ready`.

Setze einen beanspruchten Task unmittelbar vor der ersten schreibenden Ausführung auf `in-progress` und
pflege seinen Roster im selben Schritt. Eine bloße Bestandsaufnahme beansprucht ihn noch nicht.

Technische Schwierigkeit allein macht einen Task nicht zu `draft`, `review` oder `waiting`. Ein historisch
archivierter Task darf `final` behalten, bis seine Datei aus anderem Grund bearbeitet wird; dann wird er
vollständig auf die aktuellen Normen und `done` gehoben.

Der Abschluss ist ein Schritt: `status: done`, endgültiger Abschlussbericht und Verschieben nach `done/`.
Ein `done`-Task liegt nur dort. Widersprechen sich Status und Roster, gewinnt der Status.

Projektindizes verwenden unabhängig davon `active -> final -> archived`. Ihr `active` bedeutet, dass das
Projekt lebt, nicht dass ein Worker daran arbeitet.

## Roster

`BACKLOG.md` ist die einzige Übersicht. Sie enthält eine Zeile pro nicht abgeschlossenem Root-Task und
Projekt: Link, Status und kurzer Stand. Projektzeilen zeigen auf deren `INDEX.md`. Innerhalb fachlich
zulässiger Reihenfolge stehen Tasks als `review`, `in-progress`, `next`, `waiting`, `ready`, `draft`;
Projektzeilen folgen ihrer fachlichen Reihenfolge. Abgeschlossene Root-Tasks fallen heraus, Projekte dürfen
ihre Bauhistorie behalten.

Nutze Roster und Projektindizes zuerst zur Auswahl anhand von Status, Kurzstand, Reihenfolge, Abhängigkeiten
und Eigentümerschaft. Lies danach nur die gewählten Tasks und ihre echten Blocker vollständig. Ein
ausdrücklich gewählter einzelner Task darf direkt vollständig gelesen werden; der Roster verpflichtet nie
dazu, vorsorglich alle offenen Task-Dateien zu laden.

## Ideen

`IDEAS.md` ist das getrennte Inventar unverbindlicher Ideen und wird nicht beim Sessionstart geladen. Öffne
es nur zum Erfassen, Sichten oder Ausarbeiten von Ideen. Es trägt keine Task-IDs, Datumsfelder oder Status.
Wird eine Idee bewusst zu Arbeit, lege zuerst den vollständigen Task oder das Projekt an und entferne danach
den übernommenen Ideenpunkt.
