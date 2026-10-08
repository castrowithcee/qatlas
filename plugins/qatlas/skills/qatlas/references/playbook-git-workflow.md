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
`git switch -c <task-branch>` auf einen eigenen Branch und sichere dort nur die Arbeitsdateien als
Checkpoint. Status, Abschlussbericht und Spine bleiben ungestagt, kehren mit `git switch <steuerbranch>`
zurück und werden dort nach „Übergeben“ committet. So bleibt der Steuerbranch frei von unfertiger Arbeit und
der Task-Branch frei von Spine-Änderungen, die bei seiner späteren Integration kollidieren würden.

Entsteht ein Task-Branch oder Worktree, lies vollständig den
[Worktree-Vertrag](../../qatlas-work/references/worktree-contract.md). Die Laufautorisierung deckt die Anlage
ab. Ohne sichere Isolation läuft höchstens ein schreibender Subagent. Trennst du fremde Änderungen nicht
sicher, übergib den Task mit Befund an den Nutzer.

## Commits und Checkpoints

- Ein Task erhält so viele Commits, wie die Commitgrenze verlangt. Die Taskgrenze des Runs zählt Tasks,
  keine Commits.
- Der Subagent erstellt keine Commits. Der Orchestrator committet in einem Worktree nur, solange dort kein
  Subagent arbeitet, also nach dessen Rückgabe oder Stopp. Lass eine größere Umsetzung an kohärenten
  Meilensteinen zurückgeben, damit jeder geprüfte Meilenstein als Commit gesichert ist, bevor die Arbeit
  weitergeht.
- Unfertige Arbeit sichert der Orchestrator vor Pause, `review` oder Laufende als ausgewiesenen Checkpoint
  auf dem privaten Branch, auf dem sie entstand. Ein Checkpoint ist nicht integrationsreif.
- Jeder Commit, auch ein Checkpoint, folgt dem Commit-Ablauf der Git-Norm einschließlich ihrer
  Schutzprüfung.
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

## Integration über Pull Requests

Der Abschnitt greift nur, wenn Nutzer- oder Projektvorgaben eine Integration über Pull Requests verlangen,
etwa bei einem geschützten Steuerbranch; erkenne das an diesen Vorgaben, nicht durch Raten. Er ändert keine
Autorisierung: Der Aufruf von `run` autorisiert weder Push noch Pull Request noch Merge, das tun nur Nutzer-
oder Projektvorgaben. Fehlt sie, endet der Task mit einem integrationsreifen, lokal gesicherten Task-Branch
als Übergabe nach „Übergeben“, ohne Push.

- **Arbeitsbasis:** Arbeite im Task-Worktree ab frisch geholtem `origin/<steuerbranch>`. Der primäre
  Arbeitsbaum bleibt unberührt: kein Pull, Switch oder Commit dort durch den Lauf.
- **Vor dem Öffnen oder Aktualisieren eines Pull Requests:** Führe `git fetch` aus, probe Konflikte mit
  `node <plugin-root>/skills/qatlas/scripts/qatlas-run-tools.js probe`, merge den aktuellen
  `origin/<steuerbranch>` in den Task-Branch, löse Konflikte nach den Konfliktregeln oben, prüfe erneut und
  pushe erst dann. Rebase einen bereits gepushten Branch nie. Dieser Merge-Commit schreibt keine Historie um
  und ist keine fremde Veränderung. Warte auf die CI mit `ci-wait` desselben Skripts.
- **Merge Queue:** Ist im Ziel-Repo eine GitHub Merge Queue aktiv, integriere den Pull Request über sie,
  statt die Basis selbst nachzuziehen.
- **Zuschnitt bei Squash-Merge:** Ein Task ergibt so viele Pull Requests, wie die Commitgrenze der Git-Norm
  für ein gesquashtes Review verlangt; ein Pull Request bündelt nie unabhängige Meilensteine. Jeder
  Pull Request erhält einen eigenen Task-Branch desselben Tasks mit eigenem Slug. Ein vorbereitender
  Pull Request, etwa ein mechanisches Refactoring, wird vor der darauf aufbauenden Änderung integriert.
  Prüfe vor dem Öffnen den gesamten Diff des Pull Requests gegen die Commitgrenze und teile ihn, bevor du
  pushst.
- **Abschluss:** Der Merge des Pull Requests ersetzt die lokale Integration. Der Task ist erst `done`, wenn
  alle seine Pull Requests gemergt sind und die Abnahme auf dem neuen `origin/<steuerbranch>` belegt ist.
- **Abhängige Arbeit:** Ein Squash-Merge schließt gestapelte Branches aus. Ein abhängiger Task oder
  Pull Request startet dann erst ab dem integrierten `origin/<steuerbranch>`, nie auf einem nicht
  integrierten Vorgänger-Branch.

## Tasks über mehrere Repos

Integriere zuerst das Repo mit Pull-Request-Pflicht, danach den Anteil desselben Tasks im anderen Repo, per
Fast-Forward, sonst per Merge-Commit; rebase keine fremden Branches. Nicht gepushte Commits erscheinen
gebündelt unter „Nicht gepusht“ im Abschlussblock des [Run-Playbooks](playbook-run.md).

## Scope-out

Erstelle lokale Commits nur aus vollständig gelesenen Diffs und berichte Nachrichten und IDs nach dem Lauf.
Ohne Autorisierung kein Push; mit ihr nur nach „Integration über Pull Requests“; nie Force-Push. Kein
automatischer Stash oder fremdes Staging. Eine Beanspruchung ohne Hostsignal beweist nicht, dass ein
früherer Subagent beendet ist.
