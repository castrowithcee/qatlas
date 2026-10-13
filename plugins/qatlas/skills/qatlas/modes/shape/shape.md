---
description: >
  Einstieg in Shape: Varianten nach Scope, Leseliste und der gemeinsame Vertrag aller Shape-Läufe vom
  Planungssystem bis zum Sammelcommit.
type: playbook
edit: locked
license: MIT
---

# Ausarbeiten

`shape` macht aus einer Idee, einer Datei, einem Task oder einem Backlog-Ausschnitt ausführungsreife Arbeit
mit begründeter Reihenfolge. Bestandsarbeit, Rückfragen und nötige Dokumentation dienen diesem Zuschnitt;
die geplante Arbeit wird nicht umgesetzt.

## Aufruf

- `shape [Idee oder Dateipfad]` arbeitet nach [Idee ausarbeiten](option-idea.md).
- `shape <eindeutiger Task>` und `shape backlog [Scope]` arbeiten nach [Vorhandene Arbeit
  ausarbeiten](option-backlog.md). Das Wort `backlog` ist nach `shape` ein reservierter Scope, keine Idee.
  `shape backlog` ohne weiteren Scope umfasst den gesamten offenen Arbeitsvorrat.

`shape` kennt keine Flags. Für eine Idee, eine Datei oder einen einzelnen Task erhält es die Freigabe für
gesperrte Projektdokumentation nach dem gemeinsamen Vertrag; `shape backlog [Scope]` erhält sie nicht.
Erfordert dort eine Aufgabe eine Änderung an `edit: locked`, hole die dafür nötige ausdrückliche Freigabe ein.

## Leseliste

Die Blöcke wiederholen nichts aus dieser Datei und einander; was du nicht liest, fehlt dir in diesem Lauf.
Lies jeden vollständig zum genannten Zeitpunkt:

1. **Vor dem ersten Schritt:** die Datei deiner Variante aus „Aufruf“ und [die
   Backlog-Norm](../../../qatlas-core-backlog/SKILL.md).
2. **Vor dem ersten Zuschnitt, Teilen oder Einarbeiten eines Tasks:** [Tasks
   zuschneiden](playbook-task-cut.md).
3. **Vor der Pflege der `next`-Queue:** [Nächsten Horizont disponieren](playbook-horizon.md).
4. **Vor der ersten Präsentation einer echten Nutzerentscheidung:** [Entscheidungen knapp
   vorlegen](../../references/playbook-decision-card.md).
5. **Vor dem Sammelcommit:** [die Git-Norm](../../../qatlas-core-git/SKILL.md) und ihre
   [Commit-Referenz](../../../qatlas-core-git/references/playbook-commit.md).

## Planungssystem

Kläre zuerst, wo der Nutzer Arbeit verwaltet. Nutze das beim Sessionstart geladene Backlog-Binding und die
nativen Projektanweisungen. Ein externes System hat mit seinen Feldern, IDs, Status und Schreibwegen
Vorrang. Erzeuge weder ein lokales Ersatz- noch ein Spiegel-Backlog. Ist das maßgebliche System nicht
erreichbar, darf die Ausarbeitung im Gespräch fortfahren; melde Arbeitspakete aber nicht als dort angelegt.

Nur ohne andere Vorgabe gilt der lokale Qatlas-Backlog. Fehlt dafür das Scaffold, verweise auf
`qatlas-core setup`, bevor du unter `.qatlas-project/` schreibst.

## Entscheidungen und Analyse

Bleibt nach der eigenen Untersuchung eine echte Nutzerentscheidung zu einer vorhandenen oder werdenden
Aufgabe offen, führe den Nutzer nach dem gemeinsamen Entscheidungsdialog, ohne vorauszusetzen, dass er die
Tasks parallel liest. Freie Fragen, mit denen der Nutzer eine noch nicht ausformulierte Absicht erst
beschreibt, bleiben davon unberührt.

Der ausdrückliche Aufruf autorisiert Subagents für getrennte Bestandsanalyse, Evidenzgewinnung,
Risikoprüfung und einen unabhängigen Vollständigkeitscheck. Delegiere nur unabhängige Fragen mit echtem
Mehrwert. Subagents schreiben keine Tasks, treffen keine Produktentscheidung und bauen keinen konkurrierenden
Plan; der Hauptagent führt Befunde, Gespräch, Dokumentation und Paketschnitt zusammen. Ein beauftragter
Bestands-Subagent arbeitet lesend und gibt mindestens Ausgangszustand, Einstiegspunkte, erwartete
Änderungsflächen, Prüfpfade, Dokumentationswirkung, offene Vertragsfragen und eine begründete Empfehlung
für `draft` oder `ready` zurück. Kleine, bereits klar belegbare Pakete brauchen keinen Subagent; die
Ausführungsgrundlage bleibt trotzdem Pflicht.

## Grenzen und Abschluss

Setze in diesem Modus nie `in-progress` oder `done`, beginne keine Implementierung und führe keinen Task aus.
`next` bereitet den kommenden Horizont vor, autorisiert aber keine Ausführung.

`shape` endet in jeder Variante mit genau einem lokalen Sammelcommit pro betroffenem Repo über die in diesem
Lauf geänderten Dateien, damit ein folgender `run` auf einem sauberen Stand beginnt. Der ausdrückliche
Aufruf ersetzt dafür die Einzelabnahme der Nachricht; zeige Nachricht und ID danach und pushe nichts. Den
Lauf startest du nicht selbst.
