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
- Ein Arbeitsbaum hat nie zwei gleichzeitige Schreiber, und ein Branch ist nie in zwei Worktrees ausgecheckt.
  Ein Test-, Build- oder Formatierungslauf, der Dateien, Caches oder Ausgaben erzeugt, ist schreibend.
- Status, Abschlussbericht, Spine und Refs ändert nur der Orchestrator. Kein Subagent legt Branches oder
  Worktrees an, wechselt sie oder ändert Repo-Konfiguration und Hooks. Staging und Commits führt ebenfalls
  nur der Orchestrator aus.

## Isolation entscheiden

Arbeitet genau ein Schreiber zur Zeit und ist der Arbeitsbaum sauber, gilt der **leichte Pfad**: Der
Subagent oder bei einem Kleinsttask der Orchestrator arbeitet direkt im Arbeitsbaum des Steuerbranches, und
der Orchestrator committet dort nach der Prüfung. Die Beanspruchung erhält dabei keinen eigenen Commit; der
Ergebnis- oder Checkpointcommit nimmt den Status mit. Arbeiten weitere Orchestratoren im selben Repo oder
Planungssystem oder entsteht ein Task-Branch, committe die Beanspruchung zuerst auf dem sauberen
Steuerbranch. Einen eigenen Task-Branch mit
Worktree braucht es, wenn

- mehrere Schreiber gleichzeitig arbeiten,
- der Arbeitsbaum fremde oder nicht zuordenbare Änderungen enthält oder
- Nutzer- beziehungsweise Projektvorgaben ihn verlangen.

Endet ein Task im leichten Pfad unfertig in `review` oder `waiting`, verschiebe seinen Stand mit
`git switch -c <task-branch>` auf einen eigenen Branch, sichere ihn dort als Checkpoint und kehre mit
`git switch <steuerbranch>` zurück. Der Steuerbranch bleibt so frei von unfertiger Arbeit.

Entsteht ein Task-Branch oder Worktree, lies vollständig den
[Worktree-Vertrag](../../qatlas-work/references/worktree-contract.md). Die Laufautorisierung deckt die Anlage
ab. Ohne sichere Isolation läuft höchstens ein schreibender Subagent. Trennst du fremde Änderungen nicht
sicher, übergib den Task mit Befund an den Nutzer.

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
  Erfolgsmeldung ersetzt diese Prüfung nicht. Nicht zuordenbare Arbeit wird nicht integriert. Im leichten
  Pfad ist das Committen nach dieser Prüfung die Integration.
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
- Entferne nach dem Worktree-Vertrag nur vom aktuellen Lauf erzeugte, saubere und
  vollständig integrierte Worktrees und Branches.

## Scope-out

Erstelle lokale Commits nur aus vollständig gelesenen Diffs und berichte Nachrichten und IDs nach dem Lauf.
Kein Push, Force-Push, automatischer Stash oder fremdes Staging. Eine Beanspruchung ohne Hostsignal beweist
nicht, dass ein früherer Subagent beendet ist.
