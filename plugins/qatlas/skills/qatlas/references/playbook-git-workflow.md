---
description: >
  Git-Ablauf für Qatlas Run mit einem Orchestrator und seriellen Schreibern: Eigentum, Isolation,
  Beanspruchung, Commits und Checkpoints, Integration und Übergabe.
type: playbook
edit: locked
license: MIT
---

# Git-Ablauf von Qatlas Run

Lies diese Referenz nur bei schreibender Arbeit in einem Git-Repo. Qatlas' Git-Norm gilt zusätzlich; ihre
Commitgrenze sowie ihre Regeln zu Checkpoints, Bereinigung und Historie wendet dieser Ablauf nur auf den Run
an. Schreiben mehrere Subagents gleichzeitig, wird ein Task übernommen oder wieder aufgenommen oder
arbeiten weitere Orchestratoren im selben Repo oder Planungssystem, lies zusätzlich vollständig
[Parallele Arbeit im Run](git-parallel.md).

## Eigentum

- **Steuerbranch:** der im Preflight geprüfte Branch, auf dem Beanspruchung, Spine und integrierte
  Ergebnisse landen. Sein Arbeitsbaum, normalerweise der primäre, dient Beanspruchung, Statuspflege,
  Integration und gemeinsamen Prüfungen, nie als paralleler Implementierungsarbeitsplatz.
- **Task-Branch:** die Integrationslinie genau eines Tasks. Er gehört dem Orchestrator, der den Task
  beansprucht hat.
- Ein Worktree hat nie zwei gleichzeitige Schreiber, und ein Branch ist nie in zwei Worktrees ausgecheckt.
  Ein Test-, Build- oder Formatierungslauf, der Dateien, Caches oder Ausgaben erzeugt, ist schreibend.
- Status, Abschlussbericht, Spine und Refs ändert nur der Orchestrator. Kein Subagent legt Branches oder
  Worktrees an, wechselt sie oder ändert Repo-Konfiguration und Hooks. Staging und Commits führt ebenfalls
  nur der Orchestrator aus.

## Isolation entscheiden

Prüfe vor der Beanspruchung, ob die Arbeit einen eigenen Worktree braucht. Er ist erforderlich, wenn

- ein lokaler Qatlas-Task ausgeführt wird,
- mehrere Schreiber gleichzeitig arbeiten,
- der vorhandene Arbeitsbaum fremde oder nicht zuordenbare Änderungen enthält,
- ein Arbeitsstand für `review` oder eine spätere Wiederaufnahme getrennt erhalten bleiben muss oder
- Nutzer- beziehungsweise Projektvorgaben ihn verlangen.

Nur genau ein serieller Schreiber ohne gleichzeitigen weiteren Schreiber darf auf einem sauberen, exklusiven
Branch ohne eigenen Worktree arbeiten. Sobald ein Task-Branch oder Worktree entsteht, lies vollständig
[Git-Worktrees verwalten](../../qatlas-work/references/playbook-worktree.md) und verwende dessen zentralen
Pfad-, Benennungs- und Sicherheitsvertrag. Die Laufautorisierung deckt die Anlage ab.

## Beanspruchen und anlegen

- Committe die gesammelte Beanspruchung auf dem sauberen Steuerbranch, bevor Task-Branches entstehen. Der
  Task-Branch startet an dessen Spitze.
- Ein einzelner schreibender Subagent arbeitet im Worktree des Task-Branches. Der Auftrag nennt Branch und
  absoluten Pfad als Arbeitsort.
- Ohne sichere Isolation läuft höchstens ein schreibender Subagent. Trennst du fremde Änderungen nicht sicher,
  übergib den Task mit Befund an den Nutzer.

## Commits und Checkpoints

- Ein Task erhält so viele Commits, wie die Commitgrenze verlangt. Die Fünfergrenze des Runs zählt Tasks,
  keine Commits.
- Der Subagent erstellt keine Commits. Der Orchestrator committet in einem Worktree nur, solange dort kein
  Subagent arbeitet, also nach dessen Rückgabe oder Stopp. Lass eine größere Umsetzung an kohärenten
  Meilensteinen zurückgeben, damit jeder geprüfte Meilenstein als Commit gesichert ist, bevor die Arbeit
  weitergeht.
- Unfertige Arbeit sichert der Orchestrator vor Pause, `review` oder Laufende als ausgewiesenen Checkpoint
  auf dem privaten Branch, auf dem sie entstand. Ein Checkpoint ist nicht integrationsreif.
- Vor jeder Integration in den Steuerbranch gilt für jeden Checkpoint die Bereinigung der Git-Norm.

## Integrieren

- Wer integriert, prüft jede Zulieferung selbst: den vollständigen Commit- und Diffbereich gegen das
  Integrationsziel, die vereinbarten Nachweise und die Zuordnung jeder Änderung zum Auftrag. Eine
  Erfolgsmeldung ersetzt diese Prüfung nicht. Nicht zuordenbare Arbeit wird nicht integriert.
- Der Orchestrator ist Integrationsbesitzer des Steuerbranches. Er integriert Task-Branches einzeln und
  prüft vor jeder Integration erneut, dass die Spitze des Steuerbranches seinem zuletzt geprüften Stand
  entspricht. Ein fremd veränderter Steuerbranch stoppt die automatische Integration; Aktualisierung und
  Konfliktbehandlung sind ein eigener bewusster Schritt.
- Schreibe keine geteilte Historie um und löse Konflikte nicht automatisch. Delegiere einen Konflikt als
  eigenen Integrationsauftrag und prüfe die Lösung vor der Übernahme.

## Übergeben

- Vor `review`, `waiting` oder dem Laufende sichert der Orchestrator jeden noch nicht integrierten Stand des
  Tasks nach den Checkpoint-Regeln oben. Danach committet er Status, Abschlussbericht und Spine auf dem
  Steuerbranch. Der Task nennt Task-Branch und Worktree-Pfad samt Stand: integrationsreif oder Checkpoint.
- Task-Branch und Worktree bleiben bis zur bestätigten Integration oder zur bewussten Aufgabe durch den
  Nutzer erhalten.
- Entferne nach dem Aufräumvertrag der Worktree-Referenz nur vom aktuellen Lauf erzeugte, saubere und
  vollständig integrierte Worktrees und Branches.

## Scope-out

Erstelle lokale Commits nur aus vollständig gelesenen Diffs und berichte Nachrichten und IDs nach dem Lauf.
Kein Push, Force-Push, automatischer Stash oder fremdes Staging. Eine Beanspruchung ohne Hostsignal beweist
nicht, dass ein früherer Subagent beendet ist.
