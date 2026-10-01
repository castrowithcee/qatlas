---
name: qatlas-core-git
description: >
  Git-Arbeit sicher und bewusst ausführen. Verwenden zu Beginn der Arbeit in einem Git-Repo einer Session
  und vor dem ersten Eingriff in ein eingebettetes oder benachbartes Repo, bei Status-, Diff-, Fetch- und
  Sync-Aufträgen, vor der ersten schreibenden Operation, wenn mehrere Agenten parallel in ein Repo schreiben
  oder einen Arbeitsstand übernehmen, und immer, wenn der Agent eine fertige Änderung committen will. Ebenso
  bei Commit-Zuschnitt, Commit-Nachrichten und Checkpoints, bei Push und Force-Push, beim Bereinigen oder
  Umschreiben von Historie und vor destruktiven Git-Befehlen wie reset, clean, checkout oder restore, bei
  fehlender Git-Identität, bei großen Dateien, Binärdateien und Git LFS sowie bei qatlas-core-git.
argument-hint: "[status|sync|branch|commit|push|identity|history|lfs]"
license: MIT
type: skill
edit: locked
---

# qatlas-core-git

Verwalte Git als eigenen Arbeitszweck oder wende diese gemeinsame Git-Norm in einem ausdrücklich gestarteten
Qatlas-Verfahren an. Dieser Body gilt bei jedem Aufruf vollständig. Lies zusätzlich nur die Referenzen der
tatsächlich anstehenden Operationen.

## Scope-in

Ein direkter Aufruf umfasst nur das ausdrücklich verlangte Git-Ziel und die davon betroffenen Repos,
Branches, Worktrees und Remotes. Erweitere einen Status-, Diff- oder Sync-Auftrag nicht von selbst um Commit,
Push, Historienänderung oder einen Eingriff in ein benachbartes Repo. Bei `qatlas run` und `qatlas review`
bestimmt der jeweilige Ablauf den Scope für lokale Commits und Integrationen; diese Git-Norm gilt zusätzlich.

## Immer gültig

- Ermittle für jeden betroffenen Pfad das genaue Repo-Root. Ein eingebettetes Repo mit eigener
  `.git`-Struktur ist ein eigenes Repo und wird separat geprüft, gestagt und committet.
- Nicht ausdrücklich betroffene Repos, Branches, Worktrees und Remotes bleiben unverändert.
- Merge, rebase, stash oder ändere bei lokalen Änderungen, Divergenz oder Konflikten nichts eigenmächtig.
  Berichte den Zustand, bevor du darauf aufbaust, und hole die nötige Entscheidung ein.
- Führe destruktive Git-Befehle wie `reset --hard`, `clean -f`, `checkout --` oder ein überschreibendes
  `restore` nur bei ausdrücklichem Auftrag für das exakt geprüfte Repo und Ziel aus.
- Verwende niemals `git push --force`, `-f` oder einen Refspec mit `+`. `--force-with-lease` ist nur als
  Ausnahme nach der Historien-Referenz zulässig. Schreibe geteilte Historie nicht eigenmächtig um.
- Stoppe bei unklarer Berechtigung, Eigentümerschaft oder fachlicher Konfliktlösung und frage, statt zu raten.

## Operation wählen

Lies vor jeder anstehenden Operation deren Referenz vollständig:

- `status`, `sync`: [Zustand und Synchronisierung](references/playbook-state.md)
- `branch`: [Branches und parallele Arbeit](references/branches.md)
- `commit`, `push`, `identity`: [Commit und Push](references/playbook-commit.md)
- `history`: [Historie](references/history.md)
- `lfs`: [Git LFS](references/lfs.md)

Ohne Argument und ohne erkennbare Operation gilt `status`. Ist ein Argument unbekannt, nenne die
Operationen und frage nach genau einer.
