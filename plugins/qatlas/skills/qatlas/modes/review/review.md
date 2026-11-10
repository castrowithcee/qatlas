---
description: >
  Human-in-the-loop-Verfahren für einen Qatlas-Lauf: führt den Nutzer zügig durch konkrete Prüfungen und
  schließt abgesicherte Entscheidungen, Abnahmen und Nutzeraktionen ab, ohne die inhaltliche Ausführung
  fortzusetzen.
---

# Übergaben abschließen

Offene menschliche Übergaben gehen hinein; abgeschlossene, wieder ausführbare oder bewusst beendete Tasks
kommen heraus. Der Agent bereitet vor, was der Nutzer sonst selbst zusammentragen müsste, und führt ihn auf
dem kürzesten Weg durch das, was nur er beurteilen kann.

## Aufruf

`review [Scope]` nimmt einen Task, ein Projekt oder ohne Scope alle offenen Übergaben des maßgeblichen
Planungssystems. `review` kennt keine Flags und erhält keine Freigabe für gesperrte Projektdokumentation. Es
umfasst das Lesen des aktuellen Stands, Änderungen an Status, Roster und Entscheidungen im maßgeblichen
Planungssystem und einen lokalen Sammelcommit am vollständigen Ende. Umsetzung, Worker, technische Tests,
Integration, externe Wirkungen und Pushes bleiben außen vor.

## Leseliste

Die Blöcke wiederholen nichts aus dieser Datei und nichts voneinander; was du nicht liest, fehlt in diesem
Lauf. Lies jeden vollständig zum genannten Zeitpunkt:

1. **Vor dem ersten Schritt:** [die Backlog-Norm](../../../qatlas-core-backlog/SKILL.md).
2. **Vor der ersten Übergabe:** [Entscheidungen vorlegen](../../references/playbook-decision-card.md).
3. **Vor dem Sammelcommit:** [die Git-Norm](../../../qatlas-core-git/SKILL.md) und ihre
   [Commit-Referenz](../../../qatlas-core-git/references/playbook-commit.md).

## Queue aufbauen

1. Bestimme das Planungssystem und den gewählten Scope.
2. Baue die Queue aus `review` und ausdrücklich offenen Nutzerentscheidungen, -prüfungen oder -aktionen. Lass
   keine Entwürfe reifen und ändere keinen Task mit laufendem Worker.
3. Sammle aus dem aktuellen Eintrag jedes Tasks der Queue Stand, Nachweise, offene Frage, Empfehlung und
   Folgen, und frage nichts, was der aktuelle Stand schon klärt.
4. Prüfe bei Git Root, Branch, Upstream, Worktrees und Status. Ein neues Review startet sauber; eine
   Fortsetzung führt nur den eindeutig zugewiesenen Entscheidungs-Diff fort.
5. Ordne jede Übergabe ein. Eine **Prüfung** gibt es nur, wenn es ein konkretes Ergebnis gibt, das der
   Nutzer ansehen, ausführen oder ausprobieren muss. Tasks, deren Fertigstellung vollständig belegt ist und
   nur die förmliche Abnahme braucht, bilden eine **Sammelabnahme**: eine Zeile pro Task mit Thema und
   Ergebnis und eine Frage, ob alle geschlossen werden sollen; der Nutzer kann einzelne ausnehmen. Alles
   andere ist eine Entscheidung oder Nutzeraktion.
6. Nenne nur die Anzahl der Tasks in der Queue, beginne dann mit der Sammelabnahme und lege danach jeweils
   eine Karte vor.

## Prüfung durchführen

Bereite die Prüfung vollständig vor, bevor du den Nutzer ansprichst: arbeite aus Abnahmekriterien,
Abschlussbericht und Diff heraus, was sich geändert hat, wo es sich zeigt und woran sich Erfolg zeigt. Lege
nur vor, was der Nutzer sehen oder beurteilen muss; er wiederholt nicht, was Maschinen belegt haben.

Lege die Prüfung zuerst als Karte vor, deren Entscheidung ist, ob sie jetzt läuft: `Jetzt prüfen` mit Anzahl
und Ort der Schritte oder `Überspringen`, wonach der Task unverändert in `review` bleibt. Zeige nach `Jetzt
prüfen` jeweils einen Schritt:

```text
Prüfung 1/2: <was geprüft wird, in einem Satz>

Wo: <genauer Pfad, URL, Befehl oder Ansicht, direkt nutzbar>
Tun: <die eine Aktion>
Erwartet: <das beobachtbare Ergebnis>

Antwort: ok, die Abweichung beschreiben oder überspringen.
```

- Ein Schritt ist eine Aktion mit einem beobachtbaren Ergebnis; fasse zusammen, was der Nutzer in einem
  Zug prüfen kann. Er trägt keinen Hintergrund und keine Auswertung des Laufs.
- Nach `ok` folgt der nächste Schritt ohne Zwischenbericht.
- Nach einem Überspringen bleibt der Task unverändert in `review` und du gehst zum nächsten Task. Behandle
  jede andere Nachricht zuerst und setze die Prüfung dann fort oder beende sie, wie es nötig ist.
- Halte eine Abweichung kurz mit erwartetem und beobachtetem Ergebnis fest und frage nur, wenn sie sonst
  nicht nachvollziehbar wäre. Führe weitere Schritte des Tasks nur aus, wenn sie trotz der Abweichung
  sinnvoll bleiben.

## Abschluss

Halte jede Antwort und jedes Prüfergebnis so fest, wie es das Vorlegen von Entscheidungen beschreibt. Lege
keinen Zwischencommit an und prüfe nach jeder Antwort, dass der Steuerungs-Branch nicht von jemand anderem
geändert wurde. Erst wenn jede Übergabe der Ausgangs-Queue abgeschlossen oder übersprungen ist, lies den
vollständigen Diff und lege nach der Git-Norm genau einen lokalen Sammelcommit pro betroffenem Repo an; der
ausdrückliche Aufruf ersetzt die vorherige Freigabe seiner Nachricht. Zeige danach Nachricht und ID. Bei
offenem Rest oder vorzeitigem Ende wird nichts committet. Pushe nichts.
