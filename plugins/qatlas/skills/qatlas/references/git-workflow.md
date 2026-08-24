---
description: >
  Git-Ablauf für Qatlas Run: Beanspruchung, isolierte Task-Branches, Integration, Review-Übergabe und
  sichere Wiederaufnahme.
type: playbook
edit: locked
license: MIT
---

# Git-Ablauf von Qatlas Run

Lies diese Referenz nur bei schreibender Arbeit in einem Git-Repo. Qatlas' Git-Norm gilt zusätzlich.

## Isolation entscheiden

Prüfe vor der Beanspruchung, ob die Arbeit einen eigenen Worktree braucht. Er ist erforderlich, wenn

- ein lokaler Qatlas-Task ausgeführt wird,
- mehrere Subagents innerhalb desselben Tasks parallel schreiben,
- der vorhandene Arbeitsbaum fremde oder nicht zuordenbare Änderungen enthält,
- ein Arbeitsstand für `review` oder eine spätere Wiederaufnahme getrennt erhalten bleiben muss oder
- Nutzer- beziehungsweise Projektvorgaben ihn verlangen.

Nur genau ein serieller Schreiber auf einem sauberen, exklusiven Branch darf ohne Worktree arbeiten. Sobald
ein Worktree erforderlich ist, lies vollständig [Git-Worktrees verwalten](worktree.md) und verwende dessen
zentralen Pfad-, Benennungs- und Sicherheitsvertrag. Die Laufautorisierung ersetzt dabei das manuelle
`qatlas worktree new`.

## Beanspruchen und isolieren

- Committe die gesammelte Beanspruchung auf dem sauberen Steuerbranch, bevor Task-Branches entstehen.
- Ein lokaler Task mit sechsstelliger ID nutzt `qatlas/task-<id>-<slug>`; `<slug>` stammt aus dem
  Task-Dateinamen.
- Ohne sichere Isolation läuft höchstens ein schreibender Subagent. Trennst du fremde Änderungen nicht sicher,
  übergib den Task mit Befund an den Nutzer.
- Der Subagent erstellt keine Commits. Der Orchestrator liest den vollständigen Diff, prüft die Beweise und
  erstellt den Task-Commit nach der vorhandenen Nachrichtenkonvention.

## Integrieren und übergeben

- Integriere Task-Branches einzeln auf einen seit dem Preflight unveränderten Steuerbranch. Schreibe keine
  geteilte Historie um und löse Konflikte nicht automatisch.
- Sichere vorhandene Arbeit vor `review` in einem lokalen Task-Commit. Committe danach Status,
  Abschlussbericht und Spine auf dem Steuerbranch. Behalte Branch und Worktree bis zur späteren Integration.
- Nach einer Klärung integriere den aktuellen Steuerbranch vor weiterer Delegation in den Task-Branch.
  Prüfe den Integrationsdiff und schreibe die Historie nicht um.
- Entferne nur vom aktuellen Lauf erzeugte, saubere und vollständig integrierte Worktrees und Branches.

## Scope-out

Erstelle lokale Commits nur aus vollständig gelesenen Diffs und berichte Nachrichten und IDs nach dem Lauf.
Kein Push, Force-Push, automatischer Stash oder fremdes Staging. Eine Beanspruchung ohne Hostsignal beweist
nicht, dass ein früherer Subagent beendet ist.
