---
description: >
  Paralleler Arbeitslauf: Ein Sentinel verteilt unabhängige Tasks auf bis zu vier gleichzeitige
  Orchestrator-Sessions in einem tmux-Fenster, integriert ihre Ergebnisse und pflegt allein das Spine.
type: playbook
edit: locked
license: MIT
---

# Sentinel

Die Session, in der der Nutzer `sentinel` aufruft, ist der Sentinel. Er bleibt für den Nutzer ansprechbar,
verteilt Tasks, startet und überwacht Orchestrator-Sessions, integriert ihre Ergebnisse und pflegt allein
Spine und Steuerbranch. Jeder Orchestrator ist eine eigene interaktive Session mit vollem Qatlas-Kontext, die
genau einen Task mit `run --sentinel` bearbeitet. Fachliche Umsetzung übernimmt der Sentinel nie selbst.

Lies vor dem ersten Schritt vollständig [Arbeit ausführen](playbook-run.md), [den
Git-Ablauf](playbook-git-workflow.md) und [Parallele Arbeit im Run](git-parallel.md). Laufvertrag,
Autorisierung, Laufoptionen, Orchestrierung, Taskauswahl, Integration, Nebenbefunde, Stopbedingungen und
Abschluss gelten für den Sentinel, soweit dieses Verfahren nichts anderes festlegt. Ohne Task-Scope bedient
er sich aus dem Backlog. `--limit` zählt alle Tasks des Laufs, nicht die gleichzeitigen.

Das Steuerskript ist `node <plugin-root>/scripts/qatlas-sentinel-tmux.js`; `<plugin-root>` ist der im
Sessionkontext genannte `QATLAS PLUGIN ROOT`. Fasse Orchestrator-Panes nur über dieses Skript an und sende
nie Tastatureingaben in eine Orchestrator-Session.

## Vorbereiten

1. Prüfe `tmux`, Git-Root und einen sauberen Steuerbranch nach dem Git-Ablauf. Läuft der Sentinel außerhalb
   von tmux, legt das Skript einen eigenen Server an; nenne dem Nutzer dann den ausgegebenen Befehl zum
   Anhängen.
2. Ermittle den Zustandsordner mit `dir --target <repo-root>`. Liegt dort eine Datei `active` eines anderen
   Laufs und zeigt `list --window <lauf-id>` dessen Fenster noch, starte nicht und nenne dem Nutzer das
   Fenster. Ohne Fenster kläre den verwaisten Lauf mit dem Nutzer, bevor du seine Tasks anfasst.
3. Lege eine Lauf-ID `<projekt>-<YYYYMMDD-HHMM>` und darin den Laufordner an und schreibe die Lauf-ID nach
   `active`.
4. Prüfe für jeden vorgesehenen Host seine Sektion in `orchestra.yaml` mit gültigem Orchestrator-Modell und
   seine CLI im `PATH`: `claude` für Claude Code, `codex` für Codex. Standard ist der eigene Host; eine
   Laufvorgabe darf Tasks einem anderen Host zuweisen.

## Verteilen

Laufen dürfen höchstens vier Orchestratoren gleichzeitig; eine Laufvorgabe darf weniger festlegen.
Gleichzeitig starten nur Tasks, die nachweislich unabhängig sind: keine gemeinsamen Dateien, Invarianten,
Migrationen oder Laufzeitressourcen nach [Parallele Arbeit im Run](git-parallel.md). Im Zweifel startet ein
Task erst nach seinem Vorgänger. Jeder Task erhält einen frischen Orchestrator, damit kein Kontext über Tasks
wächst.

Für jeden Task:

1. Prüfe die Ausführungsreife und beanspruche ihn im Spine. Liegt das Spine im Repo, committe die
   Beanspruchung auf dem Steuerbranch.
2. Lege Task-Branch und Worktree im Repo, das der Task verändert, nach dem Worktree-Vertrag an und schreibe
   `<Task-ID>.status` mit `startet`.
3. Starte die Session:

   ```text
   add --window <lauf-id> --label "<Projekt>·orchester" --title "<Projekt>·#<ID> · <host>" --cwd <worktree> -- <cli>
   ```

   - Claude Code: `claude --model <orchestrator> '/qatlas run <Task> --sentinel <laufordner> [--fly] [Laufvorgabe]'`
   - Codex: `codex -m <orchestrator> '$qatlas run <Task> --sentinel <laufordner> [--fly] [Laufvorgabe]'`

   Quote den Prompt in der Shell einfach, damit `$qatlas` nicht expandiert. Nenne den Task so, dass der
   Orchestrator ihn ohne den Projektzustand des Sentinels eindeutig auflöst, bei einem externen Spine als
   Task-URL. Gib `--fly` weiter, wenn der Sentinel damit läuft, und aus der Laufvorgabe nur den Teil, der
   diesen Task betrifft. Füge keine Option hinzu, die Berechtigungen, Sandbox oder Freigaben des Hosts
   lockert.

## Überwachen

Warte mit `wait --dir <laufordner> --window <lauf-id> --timeout 600`. Kann der Host Befehle im Hintergrund
ausführen, tue das, damit du für den Nutzer ansprechbar bleibst. Beantworte Fragen des Nutzers aus
Statusdateien, Abschlüssen und Spine.

- **`wartet: <Grund>`:** Setze den Pane-Titel mit `title` auf `WARTET · <Titel>` und nenne dem Nutzer in
  einem Satz Task und Grund. Stelle den Titel wieder her, sobald der Status weiterläuft.
- **`nutzer`:** Die Session gehört dem Nutzer. Fasse sie nicht an, bis er sie dir zurückgibt.
- **Beendetes Pane ohne `fertig` oder `übergeben`:** Sichere den Task nach dem Git-Ablauf als Übergabe mit
  dem Befund auf `review`.
- Hängt ein Orchestrator erkennbar ohne Fortschritt, melde es dem Nutzer, statt selbst einzugreifen.

## Integrieren

- **`fertig`:** Lies `<Task-ID>.md`. Prüfe als Integrationsbesitzer Diff, Beweise und Abnahme selbst nach
  [Arbeit ausführen](playbook-run.md), integriere den Task-Branch einzeln in den Steuerbranch, führe die
  gemeinsamen Prüfungen aus, erfasse Nebenbefunde und setze den Task erst dann auf `done`. Löse einen
  Integrationskonflikt nicht automatisch; sichere den Task dann als Übergabe.
- **`übergeben`:** Übernimm Abschluss, Branch und Worktree des Tasks in seine Übergabe auf `review` oder
  `waiting`.
- Schließe danach das Pane mit `close --pane <id>` und entferne einen integrierten Worktree nach dem
  Worktree-Vertrag. Starte den nächsten Task, solange Taskgrenze und Stopbedingungen es zulassen.

## Beenden

Der Lauf endet nach den Stopbedingungen von [Arbeit ausführen](playbook-run.md), sobald kein Orchestrator
mehr läuft. Bei einer Stopbedingung startet kein neuer Task, laufende Orchestratoren arbeiten zu Ende. Halte
in deinem eigenen Kontext nur Zusammenfassungen; ist er bereits verdichtet worden, starte keinen weiteren
Task. Entferne `active` und schließe mit genau einem Block „Für dich“ über alle Tasks des Laufs nach
[Arbeit ausführen](playbook-run.md).
