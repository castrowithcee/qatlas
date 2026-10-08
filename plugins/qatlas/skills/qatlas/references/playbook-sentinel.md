---
description: >
  Paralleler Arbeitslauf: Ein Sentinel schneidet den Backlog in unabhängige Pakete, lässt jedes von einem
  eigenen Orchestrator als Run in einer eigenen tmux-Session abarbeiten und integriert die Ergebnisse.
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
Orchestratoren“. Push, Pull Request, Merge, Taskabschluss und der Status `done` gehören ausschließlich ihm;
Projektvorgaben, die einem `run` Push, Pull Request oder Merge erlauben, gelten im Sentinel nur für ihn.
Orchestratoren beanspruchen ihre Tasks im Planungssystem nach „Mehrere Orchestratoren“, setzen aber nie
`done`.

Das Steuerskript ist `node <plugin-root>/skills/qatlas/scripts/qatlas-sentinel-tmux.js`; `<plugin-root>`
ist der im Sessionkontext genannte `QATLAS PLUGIN ROOT`. Die Hilfsbefehle `probe`, `ci-wait` und `slot`
liefert `node <plugin-root>/skills/qatlas/scripts/qatlas-run-tools.js`. Fasse Orchestrator-Panes nur über
das Steuerskript an und sende nie Tastatureingaben in eine Orchestrator-Session. `wait`, `ask` und
`handover` blockieren bis zu ihrem `--timeout`; setze das Befehls-Timeout des Hosts darüber.

## Vorbereiten

1. Prüfe `tmux`, Git-Root und einen sauberen Steuerbranch nach dem Git-Ablauf. Läuft der Sentinel in tmux,
   legt das Skript im Server des Nutzers eine eigene Session `sentinel--<repo>` an; nenne dem Nutzer den
   ausgegebenen Wechselweg. Außerhalb von tmux legt es einen eigenen Server an; nenne dann den ausgegebenen
   Befehl zum Anhängen.
2. Zeigt `list --repo <repo-root>` bereits ein Fenster, läuft für dieses Repo ein Sentinel oder ist ein
   früheres Fenster noch offen. Starte nicht und kläre es mit dem Nutzer.
3. Prüfe für jeden vorgesehenen Host seine Sektion in `orchestra.yaml` mit gültigem Orchestrator-Modell und
   seine CLI im `PATH`: `claude` für Claude Code, `codex` für Codex. Standard ist der eigene Host; eine
   Laufvorgabe darf Pakete einem anderen Host zuweisen.
4. Erkenne an Nutzer- und Projektvorgaben, ob sie Integration über Pull Requests verlangen; dann gilt der
   Abschnitt „Integration über Pull Requests“ des Git-Ablaufs. Prüfe in diesem Fall, ob im Ziel-Repo eine
   Merge Queue aktiv ist und ob `gh` verfügbar und angemeldet ist. Fehlt `gh`, seine Anmeldung oder die
   Autorisierung für Push, Pull Request und Merge, starte nicht und kläre es mit dem Nutzer.

Die Integrationsbasis `<basis>` ist bei Integration über Pull Requests `origin/<steuerbranch>`, sonst der
lokale `<steuerbranch>`.

## Pakete schneiden

Wähle aus dem genannten Scope oder ohne Scope aus dem Backlog die ausführbaren Tasks nach der Taskauswahl
von [Arbeit ausführen](playbook-run.md) und schneide daraus höchstens vier Pakete. Ein Paket bündelt
zusammengehörige Tasks; Abhängigkeiten liegen nur innerhalb eines Pakets. Echte Kopplung durch gemeinsame
Invarianten, Migrationen oder Laufzeitressourcen bleibt in einem Paket; lässt sie sich nicht ausschließen,
lege die Tasks zusammen. Mechanisch gemeinsame Dateien dürfen Pakete nach [Parallele Arbeit im
Run](git-parallel.md) teilen.

Der Sentinel integriert seriell. Ergänze ein Paket, das nur aus einer Abhängigkeitskette besteht, um
unabhängige Tasks, damit sein Orchestrator während des Wartens auf eine Integration weiterarbeiten kann.
Ein übergreifender Task, der viele Bereiche berührt, bildet ein eigenes Paket und startet zuerst.

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
> ist der Sentinel. Arbeite nach „Mehrere Orchestratoren“ und beanspruche nur Tasks dieses Pakets. Push,
> Pull Request, Merge, Taskabschluss und `done` übernimmt ausschließlich der Sentinel, auch wenn
> Projektvorgaben sie einem Run erlauben. Im primären Arbeitsbaum ziehst, wechselst und committest du nichts.
>
> Ist `<basis>` ein `origin/…`-Ref, hole ihn vor jeder Verwendung frisch mit `git fetch`. Lege je Task einen
> eigenen Worktree ab `<basis>` an. Merge vor jeder Übergabe den aktuellen `<basis>` in den Task-Branch, löse
> Konflikte selbst und prüfe danach vollständig; Volltests laufen über `node <tools> slot -- <testbefehl>`.
> Führe vor jedem Commit die Schutzprüfung als eigenen Befehl aus und werte ihren Exit-Code aus, bevor du
> committest.
>
> Übergib jeden geprüften Task mit `node <skript> handover --repo <repo-root> --package <Paket> --task <id>
> --report <bericht>`. Der Bericht folgt dem Rückgabeformat von „Arbeit ausführen“ und nennt zusätzlich
> Branches und Commits, PR-Titel und PR-Body. Die Antwort lautet `integrated <sha>` oder `rework <grund>`;
> ohne Antwort rufe denselben Befehl mit unverändertem Bericht erneut auf. Bis zur Antwort gehören Task,
> Branches und Worktree dem Sentinel; fasse sie nicht an. `rework` gibt sie dir zurück: Bearbeite den Grund
> und übergib erneut.
>
> Hängt der nächste Task vom übergebenen ab, warte auf `integrated` und starte ihn ab dem neuen `<basis>`.
> Einen nachweislich unabhängigen Task dieses Pakets darfst du während des Wartens ab dem aktuellen `<basis>`
> beginnen; der übergebene Task gilt dabei als gesichert übergeben. Rufe `handover` dann nach jeder
> Subagent-Rückgabe mit `--timeout 10` erneut auf, bis die Antwort da ist, und übergib den nächsten Task erst
> danach. Ein `rework` hat Vorrang: Sichere den laufenden Task am nächsten geprüften Meilenstein
> als Checkpoint, bearbeite den Grund, übergib erneut und setze danach fort.
>
> Was du sonst den Nutzer fragen würdest, fragst du ausschließlich mit `node <skript> ask --repo <repo-root>
> --package <Paket> --question "<Frage mit Kontext, Optionen und Empfehlung>"`; die Ausgabe ist seine Antwort.
> Ohne Antwort rufe denselben Befehl erneut auf. Solange eine Übergabe offen ist, ist keine Frage möglich;
> warte dann zuerst mit `handover` ihre Antwort ab. Setze nach deinem Abschlussblock mit `node <skript> title
> --repo <repo-root> --package <Paket> --title "FERTIG · <Titel>"` den Pane-Titel.

Setze `<skript>`, `<tools>`, `<repo-root>`, `<Paket>` und `<basis>` als feste Werte ein: `<skript>` ist das
Steuerskript, `<tools>` `qatlas-run-tools.js`, je mit absolutem Pfad. Verlasse dich nicht auf
Umgebungsvariablen des Panes, weil nicht jeder Host Befehle mit ihnen ausführt.

Ergänze den Teil der Laufvorgabe des Nutzers, der dieses Paket betrifft. Füge keine Option hinzu, die
Berechtigungen, Sandbox oder Freigaben des Hosts lockert.

## Überwachen

Warte mit `wait --repo <repo-root> --since <cursor>`. Beginne mit `--since 0` und übergib danach jeweils
den `cursor` der letzten Ausgabe, damit kein Ereignis verloren geht. Es kehrt bei einem der Ereignisse
`question`, `handover`, `done` oder `exited` oder nach Zeitablauf zurück. Kann der Host Befehle im
Hintergrund ausführen, tue das, damit du für den Nutzer ansprechbar bleibst. Bearbeite jedes Ereignis:

- **`question`:** Belegt das Projektwissen die Antwort, antworte mit `answer --repo <repo-root> --package
  <Paket> --answer "<Antwort mit Quelle>"`. Sonst frage ohne `--fly` den Nutzer knapp mit Paket, Frage und
  Empfehlung und gib seine Antwort weiter. Mit `--fly` entscheide nach dessen Regeln in [Arbeit
  ausführen](playbook-run.md): Eine Annahme gibst du als Antwort weiter und nennst sie im Abschluss unter
  **Angenommen**; was übergeben werden muss, beantwortest du mit der Anweisung, den Task an `review` zu
  übergeben und fortzufahren.
- **`handover`:** Integriere nach dem folgenden Abschnitt.
- **`done` und `exited`:** Verfahre nach „Beenden“.
- Schreibt der Nutzer selbst in ein Pane, gehört ihm diese Session; fasse sie nicht an. Hängt ein
  Orchestrator erkennbar ohne Fortschritt, melde es dem Nutzer, statt einzugreifen.

## Integrieren

Mit der Übergabe gehören Task und Namensraum bis zu einem `rework` dir. Integriere übergebene Tasks einzeln
und protokolliere jeden Integrationsschritt mit `log --repo <repo-root> --type <typ> --package <Paket> --task
<id> --text <text>`, mit den Typen `push`, `pr`, `merge`, `rerun`, `conflict` und `close`.

1. Prüfe Diff, Beweise und Abnahme selbst nach [Arbeit ausführen](playbook-run.md). Inhaltlicher
   Korrekturbedarf geht als `answer … --answer "rework <grund>"` zurück und zählt als Korrekturversuch nach
   „Höchstens zwei Korrekturen“.
2. Probe Konflikte mit `probe --branch <task-branch> --base <basis>`. Einen Konflikt, auch einen beim späteren
   Nachziehen der Basis, gibst du als `rework <grund mit Dateien>` zurück; er zählt nicht als
   Korrekturversuch. Löse Konflikte nie selbst. Nur wenn der Orchestrator nicht mehr verfügbar ist, sicherst
   du den Task nach dem Git-Ablauf als Übergabe auf `review`.
3. Integriere ohne Konflikt nach dem Git-Ablauf, bei Integration über Pull Requests nach dessen Abschnitt
   „Integration über Pull Requests“ mit PR-Titel und PR-Body aus dem Bericht und `ci-wait`. Prüfe dabei lokal
   nur gezielt die betroffenen Bereiche über `slot` und überlasse der CI die volle Breite. Einen bekannten
   Flake behandelst du nach dessen Regel in [Arbeit ausführen](playbook-run.md). Ohne Pull Requests führst
   du die gemeinsamen Prüfungen selbst aus. Tasks über mehrere Repos integrierst du nach dem Git-Ablauf.
4. Schließe den Task danach im Planungssystem, setze ihn auf `done` und antworte mit `answer … --answer
   "integrated <sha>"`, wobei `<sha>` der Integrationscommit auf dem Steuerbranch ist.

## Beenden

- **`done`:** Ist das Paket vollständig integriert und ohne offene Punkte, sichere das Pane mit `capture
  --repo <repo-root> --package <Paket>` und schließe es mit `close` mit denselben Angaben. Ein Pane mit
  offenen Punkten wie `review`, Abbruch oder ungelöstem Konflikt bleibt stehen. Mit dem letzten Pane endet
  die Session.
- **`exited` ohne `done`:** Sichere die offenen Tasks des Pakets nach dem Git-Ablauf als Übergabe auf
  `review`, sichere das Pane mit `capture` und lass es stehen.
- Räume integrierte Worktrees und Branches nach dem
  [Worktree-Vertrag](../../qatlas-work/references/worktree-contract.md) auf, nach einem Squash-Merge über
  den Squash-Nachweis.

Der Lauf endet, wenn jedes Pane `FERTIG` zeigt oder beendet ist und alle übergebenen Tasks integriert oder
als Übergabe gesichert sind. Nenne im Bericht die Kennzahlen aus `report --repo <repo-root>` knapp und die
verbliebenen Remote-Branches gesammelt. Schließe mit genau einem Block „Für dich“ über alle Pakete nach
[Arbeit ausführen](playbook-run.md); nicht gepushte Commits stehen dort unter **Nicht gepusht**.
