---
description: >
  Paralleler Arbeitslauf: Ein Sentinel schneidet den Backlog in unabhängige Pakete, lässt jedes von einem
  eigenen Orchestrator als Run in einem gemeinsamen tmux-Fenster abarbeiten und integriert die Ergebnisse.
type: playbook
edit: locked
license: MIT
---

# Sentinel

Die Session, in der der Nutzer `sentinel` aufruft, ist der Sentinel. Er schneidet unabhängige Pakete,
startet pro Paket einen Orchestrator, integriert dessen Ergebnisse und bleibt für den Nutzer ansprechbar.
Jeder Orchestrator ist eine eigene interaktive Session, die sein Paket als gewöhnlichen `run` mit eigenen
Subagents abarbeitet. Fachliche Umsetzung übernimmt der Sentinel nie selbst.

Lies vor dem ersten Schritt vollständig [Arbeit ausführen](playbook-run.md), [den
Git-Ablauf](playbook-git-workflow.md) und [Parallele Arbeit im Run](git-parallel.md). Autorisierung,
Laufoptionen, Orchestrierung, Taskauswahl, Integration und Abschluss gelten für den Sentinel, soweit dieses
Verfahren nichts anderes festlegt. Er ist Dispatcher und einziger Integrationsbesitzer im Sinn von „Mehrere
Orchestratoren“.

Das Steuerskript ist `node <plugin-root>/skills/qatlas/scripts/qatlas-sentinel-tmux.js`; `<plugin-root>`
ist der im Sessionkontext genannte `QATLAS PLUGIN ROOT`. Fasse Orchestrator-Panes nur über dieses Skript
an und sende nie Tastatureingaben in eine Orchestrator-Session.

## Vorbereiten

1. Prüfe `tmux`, Git-Root und einen sauberen Steuerbranch nach dem Git-Ablauf. Läuft der Sentinel außerhalb
   von tmux, legt das Skript einen eigenen Server an; nenne dem Nutzer dann den ausgegebenen Befehl zum
   Anhängen.
2. Zeigt `list --repo <repo-root>` bereits ein Fenster, läuft für dieses Repo ein Sentinel oder ist ein
   früheres Fenster noch offen. Starte nicht und kläre es mit dem Nutzer.
3. Prüfe für jeden vorgesehenen Host seine Sektion in `orchestra.yaml` mit gültigem Orchestrator-Modell und
   seine CLI im `PATH`: `claude` für Claude Code, `codex` für Codex. Standard ist der eigene Host; eine
   Laufvorgabe darf Pakete einem anderen Host zuweisen.

## Pakete schneiden

Wähle aus dem genannten Scope oder ohne Scope aus dem Backlog die ausführbaren Tasks nach der Taskauswahl
von [Arbeit ausführen](playbook-run.md) und schneide daraus höchstens vier Pakete. Ein Paket ist ein
fachlich zusammenhängender Strang; Abhängigkeiten liegen nur innerhalb eines Pakets. Pakete teilen keine
Dateien, Invarianten, Migrationen oder Laufzeitressourcen nach [Parallele Arbeit im Run](git-parallel.md).
Lässt sich das nicht belegen, lege die Tasks in dasselbe Paket. Ein Paket umfasst höchstens die Taskgrenze
eines Runs, also fünf oder den Wert von `--limit`. Was nicht in ein Paket passt, bleibt für spätere Läufe
in seiner Reihenfolge.

Nenne dem Nutzer die Pakete mit Tasks und Grund des Schnitts in wenigen Zeilen. Ohne `--fly` warte auf seine
Bestätigung; mit `--fly` starte direkt.

## Orchestratoren starten

Starte jedes Paket im Repo-Root:

```text
add --repo <repo-root> --label "<Projekt>·orchester" --title "<Projekt>·<Paket> · <host>" --cwd <repo-root> -- <cli>
```

- Claude Code: `claude --model <orchestrator> '/qatlas run <Tasks> [--limit <n>] [--fly] <Laufvorgabe>'`
- Codex: `codex -m <orchestrator> '$qatlas run <Tasks> [--limit <n>] [--fly] <Laufvorgabe>'`

Quote den Prompt in der Shell einfach, damit `$qatlas` nicht expandiert. Gib `--limit` und `--fly` weiter,
wenn der Sentinel damit läuft. Die Laufvorgabe lautet sinngemäß:

> Paket <Paket> eines Sentinels. Weitere Orchestratoren arbeiten parallel im selben Repo; Integrationsbesitzer
> ist der Sentinel. Arbeite nach „Mehrere Orchestratoren“, beanspruche nur Tasks dieses Pakets und übergib
> jeden geprüften Task-Branch mit Bericht. Setze vor jeder Frage an den Nutzer den Pane-Titel mit
> `node <skript> title --pane "$TMUX_PANE" --title "WARTET · <Titel>"` und danach wieder `<Titel>`; setze
> nach deinem Abschlussblock `FERTIG · <Titel>`.

Ergänze den Teil der Laufvorgabe des Nutzers, der dieses Paket betrifft. Füge keine Option hinzu, die
Berechtigungen, Sandbox oder Freigaben des Hosts lockert.

## Überwachen und integrieren

Warte mit `wait --repo <repo-root> --timeout 600`; es kehrt bei geändertem Pane-Titel, beendetem Pane oder
Zeitablauf zurück. Kann der Host Befehle im Hintergrund ausführen, tue das, damit du für den Nutzer
ansprechbar bleibst. Prüfe danach das Spine.

- **Übergebener Task-Branch:** Prüfe Diff, Beweise und Abnahme selbst nach [Arbeit
  ausführen](playbook-run.md), integriere ihn einzeln nach dem Git-Ablauf, führe die gemeinsamen Prüfungen
  aus und setze den Task erst dann auf `done`. Löse einen Konflikt nicht automatisch; sichere den Task dann
  als Übergabe auf `review`.
- **`WARTET`:** Nenne dem Nutzer in einem Satz Paket und Pane.
- **Beendetes Pane ohne `FERTIG`:** Sichere die offenen Tasks des Pakets nach dem Git-Ablauf als Übergabe auf
  `review`.
- Schreibt der Nutzer selbst in ein Pane, gehört ihm diese Session; fasse sie nicht an. Hängt ein
  Orchestrator erkennbar ohne Fortschritt, melde es dem Nutzer, statt einzugreifen.

## Beenden

Der Lauf endet, wenn jedes Pane `FERTIG` zeigt oder beendet ist und alle übergebenen Task-Branches
integriert oder als Übergabe gesichert sind. Lass das Fenster offen, damit der Nutzer die Abschlüsse lesen
kann. Schließe mit genau einem Block „Für dich“ über alle Pakete nach [Arbeit ausführen](playbook-run.md).
