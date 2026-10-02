---
description: >
  Ergänzende Git-Regeln für Qatlas Run bei gleichzeitig schreibenden Subagents, Übernahme oder
  Wiederaufnahme eines Tasks und mehreren Orchestratoren.
type: rule
edit: locked
license: MIT
---

# Parallele Arbeit im Run

## Gleichzeitige Schreiber eines Tasks

- **Unterbranch:** der private Branch genau eines schreibenden Subagents innerhalb genau eines Tasks. Der
  Orchestrator legt ihn ab der aktuellen Spitze des Task-Branches mit eigenem Worktree an, weist ihn zu und
  integriert ihn einzeln in den Task-Branch. Danach führt er die gemeinsamen Prüfungen des Tasks auf dem
  Task-Branch aus. Zweige keinen Unterbranch von einem unbereinigten Checkpoint ab.
- Read-only-Analyse und Reviews dürfen einen Arbeitsbaum teilen, solange sie nachweislich nichts verändern.
- Ein Worktree trennt nur Arbeitsdateien, Index und `HEAD`. Refs, Objekte, Stash, Hooks und
  Repo-Konfiguration teilen alle Worktrees eines Repos; Ports, Datenbanken, Build-Ausgaben, Caches und
  ignorierte Dateien sind weitere Kollisionsflächen. Gib jedem gleichzeitigen Schreiber für jede dieser
  Flächen, die er nutzt, eine eigene Instanz oder serialisiere ihre Nutzung. Braucht ein Werkzeug echte
  Repo- oder Sicherheitsisolation, benenne einen separaten Clone oder eine Sandbox als Voraussetzung.
- Überlappen Arbeiten an denselben Dateien, Invarianten oder Migrationen so, dass sie nicht sicher getrennt
  integriert werden können, laufen sie seriell oder als ausdrücklich abhängige, gestapelte Branches. Ein
  gestapelter Branch startet an der Spitze seines Vorgängers. Mehr verfügbare Agenten sind kein Grund für
  künstliche Parallelität.

## Übernehmen und wiederaufnehmen

- Wer einen Task erneut beansprucht, übernimmt dessen Namensraum aus Task-Branch, Unterbranches und
  Worktrees erst, wenn kein laufender oder unbekannter Worker ihn nutzt und die Branches den im Task
  genannten Stand tragen. Eine Abweichung klärt er vor jeder Änderung.
- Prüfe nach einer Klärung, ob der Task-Branch für die Fortsetzung Änderungen des aktuellen Steuerbranches
  braucht. Integriere ihn nur dann; prüfe ebenso für jeden weiterzuführenden Unterbranch, ob er den neuen
  Stand des Task-Branches braucht. Prüfe jeden Integrationsdiff und schreibe die Historie nicht um.
- Übernommene, inzwischen integrierte Einträge nennt der Laufbericht zur Bereinigung über
  `qatlas-work tree`.

## Mehrere Orchestratoren

- Arbeiten mehrere Orchestratoren, etwa aus verschiedenen Hosts, im selben Repo oder Planungssystem,
  bearbeitet jeder nur eigene, sichtbar beanspruchte Tasks und schreibt nur in deren Namensräumen. Das
  maßgebliche Planungssystem bleibt Quelle für Status und Eigentümerschaft. Genau ein Integrationsbesitzer
  serialisiert Änderungen auf den Steuerbranch.
- Als Claim genügt nur ein Signal, das alle Beteiligten sehen und das nur einem Orchestrator gelingen kann.
  Ein lokal gesetzter, nicht integrierter oder nur in einem eigenen Worktree sichtbarer Status ist kein
  Claim. Fehlt ein solches Signal, weist der Nutzer oder ein von ihm bestimmter Dispatcher vor dem Start
  jedem Orchestrator disjunkte Tasks und genau einen Integrationsbesitzer zu. Kein Orchestrator wählt dann
  außerhalb seiner Zuweisung nach.
- Liegt das Spine im Repo, schreibt nur der Integrationsbesitzer Beanspruchung, Status und Spine auf den
  Steuerbranch. Jeder andere Orchestrator arbeitet dann nur an zugewiesenen Tasks und übergibt je Task
  seinen geprüften Task-Branch mit Bericht im Rückgabeformat. Mit der Übergabe geht die Eigentümerschaft
  des Tasks an den Integrationsbesitzer über; `done` setzt er erst nach Integration und Nachweis auf dem
  Steuerbranch.
- Für die übrigen Orchestratoren ist eine Änderung des Steuerbranches durch den bestimmten
  Integrationsbesitzer keine fremde Veränderung. Jede andere Änderung dort stoppt jeden Beteiligten vor
  seiner nächsten Beanspruchung oder Integration.
- Ist ein Claim unklar, ein Task von einem unbekannten Orchestrator beansprucht oder der Integrationsbesitz
  nicht belegt, ändert kein Orchestrator den betroffenen Task, seine Branches oder den Steuerbranch; er
  stoppt mit dem Befund.
