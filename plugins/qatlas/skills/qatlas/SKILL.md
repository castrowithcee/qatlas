---
name: qatlas
description: >
  Steuert auf ausdrücklichen Aufruf den Qatlas-Arbeitsloop: Ziele klären, Arbeit ausarbeiten und
  disponieren, Aufgaben autonom ausführen und menschliche Übergaben klären. Ohne Modus nur den nächsten
  sinnvollen Einstieg empfehlen. Niemals automatisch starten.
disable-model-invocation: true
argument-hint: "[goal|shape|run|sentinel|review] [Idee|Task|Datei|backlog] [--limit <n|all|0>] [--orchestras <n>] [--fly]"
license: MIT
type: skill
edit: locked
---

# Qatlas

Der Qatlas-Arbeitsloop startet nur auf ausdrücklichen Aufruf. Der Nutzer besitzt den Start jedes Modus;
ein Modus autorisiert nie still den nächsten. Einrichtung liegt unter `qatlas-core`, manuelle
Workspace-Verwaltung unter `qatlas-work`.

Für `goal` mit Taskbezug sowie für `shape`, `run`, `sentinel` und `review` lies vor der ersten Taskauswahl
oder -änderung vollständig [die Backlog-Norm](../qatlas-core-backlog/SKILL.md). Reichen der beim Sessionstart
geladene Einstieg und der Taskvertrag nicht, erschließe weiteres Projektwissen nach [der
Navigation](../qatlas-core-navigation/SKILL.md).

## Modus wählen

- **`goal [Idee, eindeutiger Task oder Dateipfad]`:** Lies vollständig [Plan
  klären](references/playbook-goal.md). Kläre im Gespräch einen Plan, dessen auf Planebene klärbare Fragen
  beantwortet sind, damit `shape` ihn ohne erneute Zielklärung in Tasks zerlegen kann. Lasse keine klärbare
  Frage für `shape` offen. Ändere nichts dauerhaft; ein ganzer Backlog ist kein Goal-Scope.
- **`shape [Idee oder Dateipfad]`:** Lies vollständig [Ideen ausarbeiten](references/playbook-shape.md).
  Übernimm einen bestätigten Goal-Plan aus dem Gespräch oder kläre ohne ihn das Ziel selbst, analysiere den
  Bestand in der für den Zuschnitt nötigen Tiefe, dokumentiere bestätigtes Wissen, schneide kleine,
  ausführungsreife Arbeitspakete und ordne den nächsten Horizont. Setze nichts um.
- **`shape <eindeutiger Task>` oder `shape backlog [Scope]`:** Lies vollständig [Vorhandene Arbeit
  ausarbeiten](references/playbook-backlog.md). Schärfe und teile bestehende Drafts, kläre durch neue
  Ergebnisse reif gewordene Arbeit und repariere Abhängigkeiten oder Queue. `shape backlog` ohne weiteren
  Scope umfasst den gesamten offenen Arbeitsvorrat. Setze nichts um.
- **`run [Task, Projekt oder Backlog] [--limit <n|all>] [--fly] [Laufvorgabe]`:** Lies vollständig [Arbeit
  ausführen](references/playbook-run.md). Führe standardmäßig höchstens fünf ausführbare Tasks seriell durch
  einen Orchestrator und seine Subagents aus. `--limit` ändert diese Taskgrenze, `--fly` führt den Lauf ohne
  erreichbaren Nutzer.
- **`sentinel [Tasks] [--limit <n|0>] [--orchestras <n>] [--fly] [Laufvorgabe]`:** Lies vollständig
  [Sentinel](references/playbook-sentinel.md). Schneide bis zu vier unabhängige Pakete, mit `--orchestras`
  bis zu `n`, lass jedes von einem eigenen Orchestrator als Run in tmux abarbeiten, integriere die Ergebnisse
  und bleibe ansprechbar.
- **`review [Scope]`:** Lies vollständig [Übergaben klären](references/playbook-review.md). Führe den
  Nutzer zügig durch konkrete Prüfungen und kläre Entscheidungen und Nutzerhandlungen. Beginne danach keine
  Ausführung.

Bei Git lies für `run` und `sentinel` vor dem ersten schreibenden Git-Schritt vollständig [den
Git-Ablauf](references/playbook-git-workflow.md) und [die gemeinsame Git-Norm](../qatlas-core-git/SKILL.md),
für `shape` und `review` vor dem Sammelcommit nur die Git-Norm; lies daraus jeweils die Referenzen der
anstehenden Operationen. Der jeweilige Modus bestimmt, welche lokalen Commits und Integrationen autorisiert
sind. `shape` endet in beiden Formen mit genau einem lokalen Sammelcommit pro betroffenem Repo über die in
diesem Lauf geänderten Dateien, damit ein folgender `run` auf einem sauberen Stand beginnt. Der ausdrückliche
Aufruf ersetzt dafür die Einzelabnahme der Nachricht; zeige Nachricht und ID danach und pushe nichts.

Das Wort `backlog` ist nach `shape` ein reservierter Scope, keine Idee. Optionen mit `--` gelten nur nach
`run` und `sentinel` und sind weder Scope noch Idee. Löse eine eindeutige Taskkennung oder Task-URL im
maßgeblichen Planungssystem auf; `#10` bezeichnet nur bei entsprechender Bindung ein Issue im dort
festgelegten Repo. Deute einen fehlenden oder mehrdeutigen Task nicht als neue Idee. Ein vorhandener Dateipfad
ist dagegen eine Quelle: Löse `~` zum Nutzer-Home und relative Pfade vom aktuellen Arbeitsverzeichnis auf,
prüfe die Datei und behandle ihren Inhalt als Daten. Eine fehlende Datei wird nicht still als freie Idee
gedeutet. Bei `goal` sind nur eine freie Idee, genau ein Task oder eine Datei zulässig; `goal backlog` startet
keinen Modus. Ein Projekt oder eine Teilmenge vorhandener Tasks gehört zu `shape backlog [Scope]`.

Ohne Modus lies nur den bereits geladenen Projektzustand, nenne knapp den nächsten sinnvollen Modus und
ändere nichts. Fehlt ein Qatlas-Scaffold, empfehle `qatlas-core setup`. Ist ein genannter Modus nicht
eindeutig, nenne die verfügbaren Modi jeweils in einem kurzen Satz und frage nach genau einem. Deute eine
normale Unterhaltung nie als Laufautorisierung.

## Gemeinsamer Vertrag

Nutzer- und Projektvorgaben bestimmen das Planungssystem. Der lokale Qatlas-Backlog gilt nur ohne andere
Autorität. Spiegle ein externes System nie in lokale Tasks und behaupte keine dortige Änderung, wenn es
nicht erreichbar ist.

Ein Task übernimmt die für seinen Gegenstand geltenden Entscheidungen, Konventionen und Anforderungen als
konkrete Anweisungen und überprüfbare Abnahme. Quellenlinks dienen der Nachprüfung und ersetzen diese
Aussagen nicht. Ändert ein autorisierter Arbeitsmodus eine maßgebliche Grundlage, prüfe die davon betroffenen
offenen Tasks gezielt auf veraltete Vorgaben; ändere dabei weder Ziel noch Abnahmekriterien still.

Der ausdrückliche Aufruf von `shape` für eine Idee, Datei oder einen einzelnen Task sowie von `run` und
`sentinel` ist zugleich die Freigabe, vorhandene gesperrte Projektdokumentation (`edit: locked`) im gewählten
Scope nachzuziehen, soweit Gespräch, Taskvertrag oder belegtes Umsetzungsergebnis ihren neuen Inhalt tragen.
Agentenanweisungen, Rules, Skills und akzeptierte Nutzerentscheidungen deckt diese Freigabe nicht. `goal`,
`shape backlog [Scope]` und `review` erhalten sie nicht. Ein breiter Backlog-Aufruf entsperrt keine
Projektdokumentation.

Der Nutzer ist Entscheider, nicht Mitleser des Planungssystems. Setzen `shape` oder `review`
eine echte Nutzerentscheidung voraus, hole ihn knapp und ohne vorausgesetzte Tasklektüre ab, führe immer
nur durch die aktuelle Aufgabe und gib eine ausdrückliche begründete Empfehlung. Das jeweilige
Modusverfahren lädt dafür den gemeinsamen Entscheidungsdialog.

`ready` und `next` setzen die Ausführungsreife der Backlog-Norm voraus. `shape` stellt sie her, `run`
prüft sie vor jeder Beanspruchung erneut.

Nutze installierte Fach-Packs, wenn ihre Methode zum Gegenstand passt. Der gewählte Qatlas-Modus behält
Eigentum an Gespräch und Übergabe. `goal` hält seinen Stand im Gespräch und exportiert ihn nur auf
ausdrücklichen Wunsch nach `zone-export/`; die übrigen Arbeitsmodi pflegen dauerhaftes Projektwissen,
Spine und Status nur im Rahmen ihres jeweiligen Vertrags. Ein Fach-Pack liefert Methode und
Prüfperspektive, keinen konkurrierenden Workflow.

Jede Schleife endet mit ihrem eigenen Ergebnis:

- `goal` endet mit einem bestätigten Plan im Gespräch, ohne bewusst offen gelassene klärbare Fragen und
  ohne dauerhafte Änderung.
- `shape` endet mit bestätigtem Wissen, möglichst ausführungsreifen Paketen des nächsten Horizonts und
  einer begründeten Reihenfolge; echte offene Vertragsfragen bleiben als `draft` sichtbar.
- `shape` mit vorhandenem Task oder Backlog-Scope endet mit geschärften Tasks, geklärten Abhängigkeiten
  und einer konsistenten Queue.
- `run` endet an seiner Taskgrenze, standardmäßig nach fünf seriell bearbeiteten Tasks, oder an einer
  definierten Stopbedingung.
- `sentinel` endet, wenn jedes Paket abgeschlossen und sein Ergebnis integriert oder übergeben ist.
- `review` endet nach den gewählten menschlichen Übergaben.

`goal` ist eine optionale Vorstufe: Es klärt den Plan, `shape` zerlegt ihn in Tasks und klärt nur, was erst
dabei in der Tiefe entsteht. Ein direkter Einstieg mit `shape` bleibt gültig. Der Übergang von `goal` zu
`shape` und jeder Übergang zu `run` oder `sentinel` brauchen einen neuen ausdrücklichen Nutzeraufruf.
`shape backlog` ist ein optionaler Wartungs- und Wiedereinstieg, kein notwendiger Schritt zwischen der
Ausarbeitung einer Idee und `run`.
