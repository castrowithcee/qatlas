---
name: qatlas
description: >
  Steuert auf ausdrücklichen Aufruf Qatlas' Einrichtung und Arbeitsloop: ein Projekt einrichten, Ziele
  klären, Arbeit ausarbeiten und disponieren, Aufgaben autonom ausführen, Übergaben klären und gemeinsame
  Git-Worktrees verwalten. Ohne Modus nur den nächsten sinnvollen Einstieg empfehlen. Niemals automatisch
  starten.
disable-model-invocation: true
argument-hint: "[setup|goal|shape|backlog|run|review|worktree] [context]"
license: MIT
type: skill
edit: locked
---

# Qatlas

Qatlas verbindet passive Sessioninfrastruktur mit ausdrücklich gestarteten Werkzeugen und
Arbeitsschleifen. Der Nutzer besitzt den Start jedes Modus; ein Modus autorisiert nie still den nächsten.

Für `shape`, `backlog`, `run` und `review` bestimme zuerst das maßgebliche Planungssystem. Ist der lokale
Qatlas-Backlog maßgeblich, lies vor der ersten Taskauswahl oder -änderung vollständig
`<plugin-root>/rules/references/backlog.md`. `<plugin-root>` ist der im Sessionkontext genannte
`QATLAS PLUGIN ROOT`; ohne Hook leite ihn aus dem Pfad dieser `SKILL.md` ab. Kannst du den Plugin-Root
nicht auflösen, schreibe nicht in den lokalen Backlog. Bei einem externen System gilt stattdessen nur dessen
Binding.

## Modus wählen

### Einrichtung

- **`setup`:** Lies vollständig [Qatlas einrichten](references/setup.md) und führe nur dieses Verfahren
  aus.
### Arbeitsloop

- **`goal [Idee, Vision oder Ziel]`:** Lies vollständig [Zielbild klären](references/goal.md). Kläre das
  Zielbild ausschließlich im Gespräch und ohne dauerhafte Änderung.
- **`shape [Idee oder Quelle]`:** Lies vollständig [Ideen ausarbeiten](references/shape.md). Erzeuge aus
  Chat, Import oder bestehender Arbeit bestätigtes Projektwissen, ausführbare Arbeitspakete und bei leerem
  Horizont eine begrenzte `next`-Auswahl. Setze nichts um.
- **`backlog [Scope]`:** Lies vollständig [Backlog disponieren](references/backlog.md). Besprich ohne Scope
  die offenen Vertragsfragen aller Drafts im maßgeblichen Backlog; ein Scope begrenzt diese Menge. Reife
  geklärte Tasks zu `ready`, bilde einen sinnvollen `next`-Horizont und prüfe ruhende Arbeit. Setze nichts
  um.
- **`run [Task, Projekt oder Backlog]`:** Lies vollständig [Arbeit ausführen](references/run.md). Führe
  höchstens fünf ausführbare Tasks seriell durch einen Orchestrator und seine Subagents aus. Lies vor dem
  ersten schreibenden Git-Schritt zusätzlich vollständig [den Git-Ablauf](references/git-workflow.md).
- **`review [Scope]`:** Lies vollständig [Übergaben klären](references/review.md). Kläre ausschließlich
  Entscheidungen, Prüfungen und Nutzerhandlungen. Beginne danach keine Ausführung.
- **`worktree`:** Lies vollständig [Git-Worktrees verwalten](references/worktree.md). Ohne weitere Angabe
  zeige nur die nummerierte Übersicht. `worktree new [Auftrag]` legt für den aktuellen Kontext einen
  Worktree an; jeder andere Rest ist eine natürliche Auswahl oder Aufräumanweisung. Namen und Pfade bestimmt
  immer der Agent.

Ohne Modus lies nur den bereits geladenen Projektzustand, nenne knapp den nächsten sinnvollen Modus und
ändere nichts. Fehlt ein Qatlas-Scaffold, empfehle `qatlas setup`. Ist ein genannter Modus nicht
eindeutig, nenne die verfügbaren Modi jeweils in einem kurzen Satz und frage nach genau einem. Deute eine
normale Unterhaltung nie als Laufautorisierung.

## Gemeinsamer Vertrag

Nutzer- und Projektvorgaben bestimmen das Planungssystem. Der lokale Qatlas-Backlog gilt nur ohne andere
Autorität. Spiegle ein externes System nie in lokale Tasks und behaupte keine dortige Änderung, wenn es
nicht erreichbar ist.

Nutze installierte Fach-Packs, wenn ihre Methode zum Gegenstand passt. Der gewählte Qatlas-Modus behält
Eigentum an Gespräch und Übergabe. `goal` hält seinen Stand ausschließlich im Gespräch; die übrigen
Arbeitsmodi pflegen dauerhaftes Projektwissen, Spine und Status nur im Rahmen ihres jeweiligen Vertrags.
Ein Fach-Pack liefert Methode und Prüfperspektive, keinen konkurrierenden Workflow.

Jede Schleife endet mit ihrem eigenen Ergebnis:

- `goal` endet mit einem bestätigten Zielbild im Gespräch und ohne dauerhafte Änderung.
- `shape` endet mit bestätigtem Wissen, `draft`- oder `ready`-Arbeit und einem gepflegten `next`-Horizont.
- `backlog` endet mit einzeln besprochenen Drafts, einem konsolidierten Arbeitsvorrat und einem geordneten
  `next`-Horizont.
- `run` endet nach höchstens fünf seriell bearbeiteten Tasks oder an einer definierten Stopbedingung.
- `review` endet nach den gewählten menschlichen Übergaben.

`worktree` ist keine Arbeitsschleife und startet keine Umsetzung. Der Modus verwaltet nur die gemeinsame
Isolation, die ein späterer oder bereits autorisierter Lauf verwenden kann.

`goal` ist eine optionale Vorstufe. Ein direkter Einstieg mit `shape` bleibt gültig. Der Übergang von
`goal` zu `shape` und jeder Übergang zu `run` brauchen einen neuen ausdrücklichen Nutzeraufruf.
