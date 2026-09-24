---
description: >
  Git-Ablauf für Qatlas Run: Eigentum und Isolation je Schreiber, Task- und Unterbranches, Commits und
  Checkpoints, serielle Integration, Übergabe, Wiederaufnahme und mehrere Orchestratoren.
type: playbook
edit: locked
license: MIT
---

# Git-Ablauf von Qatlas Run

Lies diese Referenz nur bei schreibender Arbeit in einem Git-Repo. Qatlas' Git-Norm gilt zusätzlich; ihre
Commitgrenze sowie ihre Regeln zu Checkpoints, Bereinigung und Historie wendet dieser Ablauf nur auf den Run
an.

## Eigentum

- **Steuerbranch:** der im Preflight geprüfte Branch, auf dem Beanspruchung, Spine und integrierte
  Ergebnisse landen. Sein Arbeitsbaum, normalerweise der primäre, dient Beanspruchung, Statuspflege,
  Integration und gemeinsamen Prüfungen, nie als paralleler Implementierungsarbeitsplatz.
- **Task-Branch:** die Integrationslinie genau eines Tasks. Er gehört dem Orchestrator, der den Task
  beansprucht hat.
- **Unterbranch:** der private Branch genau eines schreibenden Subagents innerhalb genau eines Tasks. Der
  Orchestrator legt ihn an, weist ihn zu und integriert ihn in den Task-Branch.
- Jeder gleichzeitig schreibende Orchestrator oder Subagent arbeitet in einem eigenen registrierten
  Worktree auf einem exklusiven Branch. Ein Worktree hat nie zwei gleichzeitige Schreiber, und ein Branch
  ist nie in zwei Worktrees ausgecheckt.
- Read-only-Analyse und Reviews dürfen einen Arbeitsbaum teilen, solange sie nachweislich nichts verändern.
  Ein Test-, Build- oder Formatierungslauf, der Dateien, Caches oder Ausgaben erzeugt, ist schreibend.
- Status, Abschlussbericht, Spine und Refs ändert nur der Orchestrator: die Refs seines Task-Namensraums
  und als Integrationsbesitzer den Steuerbranch. Kein Subagent legt Branches oder Worktrees an, wechselt
  sie oder ändert Repo-Konfiguration und Hooks.

## Isolation entscheiden

Prüfe vor der Beanspruchung, ob die Arbeit einen eigenen Worktree braucht. Er ist erforderlich, wenn

- ein lokaler Qatlas-Task ausgeführt wird,
- mehrere Schreiber gleichzeitig arbeiten, ob Subagents desselben Tasks oder weitere Orchestratoren,
- der vorhandene Arbeitsbaum fremde oder nicht zuordenbare Änderungen enthält,
- ein Arbeitsstand für `review` oder eine spätere Wiederaufnahme getrennt erhalten bleiben muss oder
- Nutzer- beziehungsweise Projektvorgaben ihn verlangen.

Nur genau ein serieller Schreiber ohne gleichzeitigen weiteren Schreiber darf auf einem sauberen,
exklusiven Branch ohne eigenen Worktree arbeiten. Sobald ein Task-Branch, Unterbranch oder Worktree
entsteht, lies vollständig [Git-Worktrees verwalten](worktree.md) und verwende dessen zentralen Pfad-,
Benennungs- und Sicherheitsvertrag. Die Laufautorisierung ersetzt dabei das manuelle `qatlas worktree new`.

Ein Worktree trennt nur Arbeitsdateien, Index und `HEAD`. Refs, Objekte, Stash, Hooks und
Repo-Konfiguration teilen alle Worktrees eines Repos; Ports, Datenbanken, Build-Ausgaben, Caches und
ignorierte Dateien sind weitere Kollisionsflächen. Gib jedem gleichzeitigen Schreiber für jede dieser
Flächen, die er nutzt, eine eigene Instanz oder serialisiere ihre Nutzung. Braucht ein Werkzeug echte Repo-
oder Sicherheitsisolation, benenne einen separaten Clone oder eine Sandbox als Voraussetzung. Fehlt diese
Grenze, ist das eine fehlende Voraussetzung und kein Anlass für einen Ersatz im Worktree.

Überlappen Arbeiten an denselben Dateien, Invarianten oder Migrationen so, dass sie nicht sicher getrennt
integriert werden können, laufen sie seriell oder als ausdrücklich abhängige, gestapelte Branches. Das gilt
für Subagents eines Tasks wie für Tasks mehrerer Orchestratoren. Mehr verfügbare Agenten sind kein Grund für
künstliche Parallelität.

## Beanspruchen und anlegen

- Committe die gesammelte Beanspruchung auf dem sauberen Steuerbranch, bevor Task-Branches entstehen. Der
  Task-Branch startet an dessen Spitze, ein ausdrücklich gestapelter an der Spitze seines Vorgängers.
- Ein einzelner schreibender Subagent darf im Worktree des Task-Branches arbeiten. Schreiben mehrere
  gleichzeitig, erhält jeder einen eigenen Unterbranch ab der aktuellen Spitze des Task-Branches und einen
  eigenen Worktree. Der Auftrag nennt Branch und absoluten Pfad als Arbeitsort.
- Ohne sichere Isolation läuft höchstens ein schreibender Subagent. Trennst du fremde Änderungen nicht sicher,
  übergib den Task mit Befund an den Nutzer.

## Commits und Checkpoints

- Ein Task erhält so viele Commits, wie die Commitgrenze verlangt. Die Fünfergrenze des Runs zählt Tasks,
  keine Commits.
- Der Subagent erstellt keine Commits. Der Orchestrator committet in einem Worktree nur, solange dort kein
  Subagent arbeitet, also nach dessen Rückgabe oder Stopp. Lass eine größere Umsetzung an kohärenten
  Meilensteinen zurückgeben, damit jeder geprüfte Meilenstein als Commit gesichert ist, bevor die Arbeit
  weitergeht.
- Unfertige Arbeit sichert der Orchestrator vor Pause, `review`, Laufende oder Wiederaufnahme als
  ausgewiesenen Checkpoint auf dem privaten Branch, auf dem sie entstand. Ein Checkpoint ist nicht
  integrationsreif. Zweige keinen Unterbranch von einem unbereinigten Checkpoint ab.
- Vor jeder Integration in Task- oder Steuerbranch gilt für jeden Checkpoint die Bereinigung der Git-Norm.

## Integrieren

- Wer integriert, prüft jede Zulieferung selbst: den vollständigen Commit- und Diffbereich gegen das
  Integrationsziel, die vereinbarten Nachweise und die Zuordnung jeder Änderung zum Auftrag. Eine
  Erfolgsmeldung ersetzt diese Prüfung nicht. Nicht zuordenbare Arbeit wird nicht integriert.
- Der Orchestrator integriert Unterbranches einzeln in den Task-Branch und führt danach die gemeinsamen
  Prüfungen des Tasks auf dem Task-Branch aus.
- Genau ein Integrationsbesitzer serialisiert Änderungen auf den Steuerbranch; in einem einzelnen Run ist
  das dessen Orchestrator. Er integriert Task-Branches einzeln und prüft vor jeder Integration erneut, dass
  die Spitze des Steuerbranches seinem zuletzt geprüften Stand entspricht. Ein fremd veränderter
  Steuerbranch stoppt die automatische Integration; Aktualisierung und Konfliktbehandlung sind ein eigener
  bewusster Schritt.
- Schreibe keine geteilte Historie um und löse Konflikte nicht automatisch.

## Übergeben und wiederaufnehmen

- Vor `review`, `waiting` oder dem Laufende sichert der Orchestrator jeden noch nicht integrierten Stand des
  Tasks nach den Checkpoint-Regeln oben. Danach committet er Status, Abschlussbericht und Spine auf dem
  Steuerbranch. Der Task nennt Task-Branch, Unterbranches und Worktree-Pfade samt ihrem Stand:
  integrationsreif oder Checkpoint.
- Task-Branch, Unterbranches und Worktrees bleiben bis zur bestätigten Integration oder zur bewussten
  Aufgabe durch den Nutzer erhalten.
- Wer den Task erneut beansprucht, übernimmt dessen Namensraum erst, wenn kein laufender oder unbekannter
  Worker ihn nutzt und die Branches den im Task genannten Stand tragen. Eine Abweichung klärt er vor jeder
  Änderung.
- Integriere nach einer Klärung vor weiterer Delegation den aktuellen Steuerbranch in den Task-Branch und
  diesen in jeden weiterzuführenden Unterbranch. Prüfe jeden Integrationsdiff und schreibe die Historie
  nicht um.
- Entferne nach dem Aufräumvertrag der Worktree-Referenz nur vom aktuellen Lauf erzeugte, saubere und
  vollständig integrierte Worktrees und Branches. Übernommene, inzwischen integrierte Einträge nennt der
  Laufbericht zur Bereinigung über `qatlas worktree`.

## Mehrere Orchestratoren

- Arbeiten mehrere Orchestratoren, etwa aus verschiedenen Hosts, im selben Repo oder Planungssystem,
  bearbeitet jeder nur eigene, sichtbar beanspruchte Tasks und schreibt nur in deren Namensräumen. Das
  maßgebliche Planungssystem bleibt Quelle für Status und Eigentümerschaft.
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

## Scope-out

Erstelle lokale Commits nur aus vollständig gelesenen Diffs und berichte Nachrichten und IDs nach dem Lauf.
Kein Push, Force-Push, automatischer Stash oder fremdes Staging. Eine Beanspruchung ohne Hostsignal beweist
nicht, dass ein früherer Subagent beendet ist.
