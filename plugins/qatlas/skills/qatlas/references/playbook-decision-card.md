---
description: >
  Gemeinsames Muster für echte Nutzerentscheidungen in jedem Modus: eine Karte nach der anderen, ohne
  Lesen des Tasks verständlich, und die Antwort am Task festhalten.
---

# Entscheidungen vorlegen

Das gilt, wann immer ein Modus eine echte Nutzerentscheidung braucht. Der Modus behält Auswahl, inhaltliche
Prüfung und seinen Abschluss; diese Datei regelt die Karte und das Festhalten der Antwort.

## Queue

Nenne vor der ersten Karte einmal die Zahl der Tasks mit offenen Entscheidungen, etwa `3 Tasks haben offene
Entscheidungen.` Zeige keine Übersicht und führe dann nur durch den aktuellen Task. Voneinander abhängige
Entscheidungen eines Tasks laufen als `Entscheidung 1/2`, `Entscheidung 2/2` vor dem nächsten Task.

## Karte

```text
Task 2/5 - <Thema in einfachen Worten> (#<Nummer>)

Kontext:
<Ein oder zwei Sätze zum belegten Stand und dazu, warum die Entscheidung nötig ist.>

Zu entscheiden:
<Die konkrete Frage.>

Optionen:
1. <Option> - <entscheidende Folge>
2. <Option> - <entscheidende Folge>

Empfehlung:
1 - <Begründung aus Ziel, Risiko und Folgen.>

Antwort: 1, 2 oder eine eigene Richtung.
```

- Verwende den exakten Bezeichner aus dem Planungssystem oder die eindeutige Task-ID; erfinde keine Nummer.
- Prüfe eine im Task bereits vorbereitete Entscheidung gegen den aktuellen Stand und lege sie von dort aus
  vor.
- Biete eine bis vier wirklich einander ausschließende Optionen an. Verstecke die Empfehlung weder in ihrer
  Reihenfolge noch in günstigerer Formulierung.
- Erreichen die Optionen das Ziel unterschiedlich weit, nenne, was eine Teil-Option weglässt. Eine kleinere
  Task-Größe ist kein Vorteil; ist die bessere Option größer, empfiehl sie und nenne ihren Zuschnitt in
  Pakete.
- Nummeriere freien Text nie als Option; erlaube ihn nur in der Antwortzeile. Gib die Karte im normalen
  Gespräch aus, nicht über ein Auswahlwerkzeug, das eine solche Option ergänzt oder Kontext und Frage
  trennt.
- Muss der Nutzer handeln, ersetze die Optionen durch die Aktion, den genauen Ort oder Befehl, den
  erwarteten Nachweis und warum sie nötig ist.
- Warte nur auf diese Antwort und kläre nur diese Entscheidung; gehe dann ohne Zwischenbericht zur nächsten
  Karte.

Bevor in `shape` ein Task existiert, lautet die erste Zeile `Initiative - <Arbeitstitel>`. Eine Absicht, die
der Nutzer erst beschreibt, gehört zu `goal`, nicht auf eine Karte.

## Antwort festhalten

- Arbeite die Entscheidung oder das Prüfergebnis an ihrem inhaltlichen Platz in den aktuellen Vertrag des
  Tasks ein, nicht als separates Protokoll. Eine Abweichung wird zu einer konkreten Korrektur mit eigener
  Abnahme.
- Setze den nächsten Status nach dem maßgeblichen Vertrag: `ready`, wenn ein Entwurf Ausführungsreife
  erreicht, `next`, wenn ein neuer ausdrücklicher Lauf den Task fortsetzen oder integrieren muss, `review`,
  solange eine Nutzeraktion offen bleibt, `waiting` bei einer externen Voraussetzung, `draft`, solange eine
  Vertragsfrage offen bleibt oder die Antwort einen neuen Zuschnitt verlangt, `done`, wenn nach der Antwort
  nichts mehr zu tun ist und das Ergebnis integriert ist, im selben Schritt nach dem Planungssystem
  geschlossen. Einen Status, den der Modus nicht setzen darf, überlässt du `review`.
- Pflege nach jedem erledigten Task den Roster des maßgeblichen Planungssystems mit.
- Ändert die Entscheidung eine maßgebliche Grundlage, pflege sie an ihrem Platz.
- Eine Antwort autorisiert keine Ausführung.
