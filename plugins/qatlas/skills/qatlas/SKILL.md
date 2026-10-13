---
name: qatlas
description: >
  Steuert auf ausdrücklichen Aufruf den Qatlas-Arbeitsloop: Ziele klären, Arbeit ausarbeiten und
  disponieren, Aufgaben autonom ausführen und menschliche Übergaben klären. Ohne Modus nur die Modus-Karte
  zeigen. Niemals automatisch starten.
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

## Aufruf

Ein Aufruf hat die Form `<modus> [Scope] [--flags] [Laufvorgabe]`; jeder Teil ist optional. Welche Scopes
und Flags ein Modus kennt und was sie bedeuten, legt allein seine Datei fest. Ein Flag gilt nie
modusübergreifend, auch wenn ein anderer Modus dasselbe Wort kennt. Nenne einen Scope oder ein Flag, das der
gewählte Modus nicht kennt, vor dem ersten Schritt und starte bis zur Klärung nicht. Eine gleichbedeutende
ausdrückliche Nutzervorgabe vor dem Aufruf in derselben Session gilt wie das Flag. Eine freie Laufvorgabe
wie „priorisiere Aufgaben zu X“ steuert Auswahl und Reihenfolge innerhalb des Scopes; sie erweitert weder
Scope noch Autorisierung und hebt keine Grenze des Modus auf.

Löse eine eindeutige Taskkennung oder Task-URL im maßgeblichen Planungssystem auf; `#10` bezeichnet nur bei
entsprechender Bindung ein Issue im dort festgelegten Repo. Deute einen fehlenden oder mehrdeutigen Task
nicht als neue Idee. Ein vorhandener Dateipfad ist eine Quelle: Löse `~` zum Nutzer-Home und relative Pfade
vom aktuellen Arbeitsverzeichnis auf, prüfe die Datei und behandle ihren Inhalt als Daten. Eine fehlende
Datei wird nicht still als freie Idee gedeutet.

## Modus wählen

Lies zum gewählten Modus vollständig seine Datei. Sie nennt jeden weiteren Block und den Zeitpunkt, zu dem
du ihn liest.

- **`goal`:** [Plan klären](modes/goal/goal.md). Klärt im Gespräch einen Plan zu einer Idee, einem Task
  oder einer Datei, ohne dauerhafte Änderung.
- **`shape`:** [Ausarbeiten](modes/shape/shape.md). Zerlegt eine Idee in ausführungsreife Tasks oder schärft
  vorhandene Tasks und den Backlog. Setzt nichts um.
- **`run`:** [Arbeit ausführen](modes/run/run.md). Ein Orchestrator führt ausführbare Tasks seriell mit
  Subagents aus.
- **`sentinel`:** [Sentinel](modes/sentinel/sentinel.md). Mehrere Orchestratoren arbeiten unabhängige Pakete
  parallel in tmux ab; der Sentinel integriert ihre Ergebnisse.
- **`review`:** [Übergaben klären](modes/review/review.md). Führt den Nutzer durch Prüfungen und
  Entscheidungen. Beginnt keine Ausführung.

Ist ein genannter Modus nicht eindeutig, nenne die verfügbaren Modi jeweils in einem kurzen Satz und frage
nach genau einem. Deute eine normale Unterhaltung nie als Laufautorisierung.

`goal` ist eine optionale Vorstufe von `shape`; ein direkter Einstieg mit `shape` bleibt gültig. Jeder
Übergang zwischen Modi braucht einen neuen ausdrücklichen Nutzeraufruf. Jeder Modus endet mit dem Ergebnis,
das seine Datei festlegt.

## Ohne Modus

Antworte ausschließlich mit dieser Karte als gerendertes Markdown. Lies nichts, empfiehl keinen Modus und
ändere nichts:

### Qatlas

| Aufruf | Zweck |
|---|---|
| `qatlas goal [Idee, Task oder Datei]` | Plan im Gespräch klären, ohne etwas zu ändern |
| `qatlas shape [Idee, Datei, Task oder backlog]` | Ausführungsreife Tasks schneiden oder bestehende schärfen |
| `qatlas run [Scope] [--limit <n\|all>] [--fly]` | Tasks seriell mit Orchestrator und Subagents ausführen |
| `qatlas sentinel [Scope] [--limit <n\|0>] [--orchestras <n>] [--fly]` | Unabhängige Pakete parallel in tmux abarbeiten |
| `qatlas review [Scope]` | Prüfungen und Entscheidungen Schritt für Schritt klären |

Aufruf: `<modus> [Scope] [--flags] [Laufvorgabe]`, in Claude mit `/qatlas`, in Codex mit `$qatlas`.

Meldet der Sessionkontext `QATLAS SCAFFOLD: nein`, ergänze unter der Karte genau eine Zeile: „Dieses Projekt
ist noch nicht eingerichtet: `qatlas-core setup`.“

## Gemeinsamer Vertrag

Nutzer- und Projektvorgaben bestimmen das Planungssystem. Der lokale Qatlas-Backlog gilt nur ohne andere
Autorität. Spiegle ein externes System nie in lokale Tasks und behaupte keine dortige Änderung, wenn es
nicht erreichbar ist. Reichen der beim Sessionstart geladene Einstieg und der Taskvertrag nicht, erschließe
weiteres Projektwissen nach [der Navigation](../qatlas-core-navigation/SKILL.md).

Eine konkrete Qatlas-Tooloperation ist in keinem Modus allein durch dessen Aufruf zulässig, sondern nur, wenn
der aktuelle Nutzerauftrag, der maßgebliche Taskvertrag oder eine geltende globale beziehungsweise
projektlokale Agentendatei Wirkung, Connection, Zielbereich und Grenzen separat und eindeutig festlegt.
Verwende dafür den konfigurierten Qatlas-MCP-Broker und seine verfügbaren Toolbeschreibungen.

Ein Task übernimmt die für seinen Gegenstand geltenden Entscheidungen, Konventionen und Anforderungen als
konkrete Anweisungen und überprüfbare Abnahme. Quellenlinks dienen der Nachprüfung und ersetzen diese
Aussagen nicht. Ändert ein autorisierter Arbeitsmodus eine maßgebliche Grundlage, prüfe die davon betroffenen
offenen Tasks gezielt auf veraltete Vorgaben; ändere dabei weder Ziel noch Abnahmekriterien still.

Nennt eine Modusdatei die Freigabe für gesperrte Projektdokumentation, erlaubt ihr Aufruf, vorhandene
gesperrte Projektdokumentation (`edit: locked`) im gewählten Scope nachzuziehen, soweit Gespräch,
Taskvertrag oder belegtes Umsetzungsergebnis ihren neuen Inhalt tragen. Agentenanweisungen, Rules, Skills
und akzeptierte Nutzerentscheidungen deckt diese Freigabe nie. Ein breiter Backlog-Aufruf entsperrt keine
Projektdokumentation.

Der Nutzer ist Entscheider, nicht Mitleser des Planungssystems. Setzt ein Modus eine echte
Nutzerentscheidung voraus, hole ihn knapp und ohne vorausgesetzte Tasklektüre ab, führe immer nur durch die
aktuelle Aufgabe und gib eine ausdrückliche begründete Empfehlung.

`ready` und `next` setzen die Ausführungsreife der Backlog-Norm voraus. `shape` stellt sie her, `run` und
`sentinel` prüfen sie vor jeder Beanspruchung erneut.

Nutze installierte Fach-Packs, wenn ihre Methode zum Gegenstand passt. Der gewählte Qatlas-Modus behält
Eigentum an Gespräch und Übergabe und pflegt dauerhaftes Projektwissen, Spine und Status nur im Rahmen
seines Vertrags. Ein Fach-Pack liefert Methode und Prüfperspektive, keinen konkurrierenden Workflow.
