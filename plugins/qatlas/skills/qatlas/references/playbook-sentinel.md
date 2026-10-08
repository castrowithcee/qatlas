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
an und sende nie Tastatureingaben in eine Orchestrator-Session. `wait` und `ask` blockieren bis zu ihrem
`--timeout`; setze das Befehls-Timeout des Hosts darüber.

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
Lässt sich das nicht belegen, lege die Tasks in dasselbe Paket.

Ein Paket umfasst höchstens fünf Tasks, mit `--limit <n>` höchstens `n`. Bei `--limit 0` bestimmst du die
Größe jedes Pakets selbst danach, was ein Orchestrator in einem Lauf tragen kann: Umfang und Kopplung der
Tasks und ihr absehbarer Kontextbedarf. Was in keinem Paket Platz findet, bleibt in seiner Reihenfolge für
spätere Läufe.

Nenne dem Nutzer die Pakete mit Tasks und Grund des Schnitts in wenigen Zeilen und starte direkt.

## Orchestratoren starten

Starte jedes Paket im Repo-Root:

```text
add --repo <repo-root> --package <Paket> --label "<Projekt>·orchester" --title "<Projekt>·<Paket> · <host>" --cwd <repo-root> -- <cli>
```

- Claude Code: `claude --model <orchestrator> '/qatlas run <Tasks> [--limit <n>] <Laufvorgabe>'`
- Codex: `codex -m <orchestrator> '$qatlas run <Tasks> [--limit <n>] <Laufvorgabe>'`

Quote den Prompt in der Shell einfach, damit `$qatlas` nicht expandiert. Setze `--limit` auf die
Paketgröße, wenn sie fünf übersteigt. Gib `--fly` nie weiter: Ein Orchestrator fragt immer dich, und ob du
den Nutzer fragst, entscheidet dein eigenes `--fly`. Die Laufvorgabe lautet sinngemäß:

> Paket <Paket> eines Sentinels. Weitere Orchestratoren arbeiten parallel im selben Repo; Integrationsbesitzer
> ist der Sentinel. Arbeite nach „Mehrere Orchestratoren“, beanspruche nur Tasks dieses Pakets und übergib
> jeden geprüften Task-Branch mit Bericht. Der Sentinel vertritt den Nutzer: Was du sonst den Nutzer fragen
> würdest, fragst du ausschließlich mit `node <skript> ask --repo <repo-root> --package <Paket> --question
> "<Frage mit Kontext, Optionen und Empfehlung>"`; die Ausgabe ist seine Antwort. Ohne Antwort rufe denselben
> Befehl erneut auf. Setze nach deinem Abschlussblock mit `node <skript> title --repo <repo-root> --package
> <Paket> --title "FERTIG · <Titel>"` den Pane-Titel.

Setze `<skript>`, `<repo-root>` und `<Paket>` als feste Werte ein; verlasse dich nicht auf Umgebungsvariablen
des Panes, weil nicht jeder Host Befehle mit ihnen ausführt.

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
- **`FRAGE`:** `list` zeigt die Frage des Pakets. Belegt das Projektwissen die Antwort, antworte mit
  `answer --repo <repo-root> --package <Paket> --answer "<Antwort mit Quelle>"`. Sonst frage ohne `--fly`
  den Nutzer knapp mit Paket, Frage und Empfehlung und gib seine Antwort weiter. Mit `--fly` entscheide nach
  dessen Regeln in [Arbeit ausführen](playbook-run.md): Eine Annahme gibst du als Antwort weiter und nennst
  sie im Abschluss unter **Angenommen**; was übergeben werden muss, beantwortest du mit der Anweisung, den
  Task an `review` zu übergeben und fortzufahren.
- **Beendetes Pane ohne `FERTIG`:** Sichere die offenen Tasks des Pakets nach dem Git-Ablauf als Übergabe auf
  `review`.
- Schreibt der Nutzer selbst in ein Pane, gehört ihm diese Session; fasse sie nicht an. Hängt ein
  Orchestrator erkennbar ohne Fortschritt, melde es dem Nutzer, statt einzugreifen.

## Beenden

Der Lauf endet, wenn jedes Pane `FERTIG` zeigt oder beendet ist und alle übergebenen Task-Branches
integriert oder als Übergabe gesichert sind. Lass das Fenster offen, damit der Nutzer die Abschlüsse lesen
kann. Schließe mit genau einem Block „Für dich“ über alle Pakete nach [Arbeit ausführen](playbook-run.md).
