---
description: >
  Gemeinsames Muster für echte Nutzerentscheidungen in jedem Modus: eine Karte nach der anderen, ohne
  Lesen des Tasks verständlich, und die Antwort am Task festhalten.
---

# Entscheidungen vorlegen

Lege jede echte Nutzerentscheidung eines Modus als Karte vor und halte die Antwort fest, wie es hier steht.
Auswahl, inhaltliche Prüfung und Abschluss bleiben beim Modus.

## Queue

Nenne vor der ersten Karte einmal die Zahl der Tasks mit offenen Entscheidungen, etwa `3 Tasks haben offene
Entscheidungen.` Zeige keine Übersicht und führe dann nur durch den aktuellen Task. Voneinander abhängige
Entscheidungen eines Tasks laufen als `Entscheidung 1/2`, `Entscheidung 2/2` vor dem nächsten Task.

## Karte

```text
Task 2/5: <Thema in einfachen Worten> (#<Nummer>)

Kontext:
<Der belegte Stand und warum die Entscheidung nötig ist, mit dem Inhalt jedes beteiligten Tasks, den die
Antwort braucht.>

Zu entscheiden:
<Die konkrete Frage.>

Optionen:
1. <Option>: <entscheidende Folge>
2. <Option>: <entscheidende Folge>

Empfehlung:
1, weil <Begründung aus Ziel, Risiko und Folgen.>

Antwort: 1, 2, eine eigene Richtung oder eine Rückfrage.
```

- Die ID steht nur in der Kopfzeile, als exakter Bezeichner aus dem Planungssystem. Erfinde keine Nummer.
- Halte den Kontext so kurz, wie es geht, und so lang, dass der Nutzer die Frage beantworten kann, ohne einen
  Task zu öffnen. Sind mehrere Tasks beteiligt, sage zu jedem, was er verlangt, und unterscheide sie danach
  über ihr Thema oder als erste und zweite Aufgabe.
- Fragt der Nutzer zurück, erkläre genau diese Karte ausführlicher im Klartext und lege dieselbe Frage erneut
  vor.
- Prüfe eine im Task bereits vorbereitete Entscheidung gegen den aktuellen Stand und lege sie von dort aus
  vor.
- Biete eine bis vier wirklich einander ausschließende Optionen an. Verstecke die Empfehlung weder in ihrer
  Reihenfolge noch in günstigerer Formulierung.
- Erreichen die Optionen das Ziel unterschiedlich weit, nenne, was eine Teil-Option weglässt. Eine kleinere
  Task-Größe ist kein Vorteil. Ist die bessere Option größer, empfiehl sie und nenne ihren Zuschnitt in
  Tasks.
- Nummeriere freien Text nie als Option. Erlaube ihn nur in der Antwortzeile. Gib die Karte im normalen
  Gespräch aus, nicht über ein Auswahlwerkzeug, das eine solche Option ergänzt oder Kontext und Frage
  trennt.
- Muss der Nutzer handeln, ersetze die Optionen durch die Aktion, den genauen Ort oder Befehl, den
  erwarteten Nachweis und warum sie nötig ist.
- Warte nur auf diese Antwort und kläre nur diese Entscheidung. Gehe dann ohne Zwischenbericht zur nächsten
  Karte.

Bevor in `shape` ein Task existiert, lautet die erste Zeile `Initiative: <Arbeitstitel>`. Eine Absicht, die
der Nutzer erst beschreibt, gehört zu `goal`, nicht auf eine Karte.

## Antwort festhalten

- Arbeite die Entscheidung oder das Prüfergebnis an ihrem inhaltlichen Platz in den aktuellen Vertrag des
  Tasks ein, nicht als separates Protokoll. Eine Abweichung wird zu einer konkreten Korrektur mit eigener
  Abnahme.
- Setze den nächsten Status nach dem maßgeblichen Vertrag: `ready`, wenn ein Entwurf Ausführungsreife
  erreicht oder ein neuer ausdrücklicher Lauf den Task fortsetzen oder integrieren muss, `review`,
  solange eine Nutzeraktion offen bleibt, `waiting` bei einer externen Voraussetzung, `deferred` nach der
  Backlog-Norm, `draft`, solange eine Vertragsfrage offen bleibt oder die Antwort einen neuen Zuschnitt
  verlangt, `done`, wenn nach der Antwort nichts mehr zu tun ist und das Ergebnis integriert ist oder der
  Nutzer den Task als verworfen oder Duplikat schließt, im selben Schritt nach dem Planungssystem geschlossen.
  Einen Status, den der Modus nicht setzen darf, überlässt du `review`.
- Ändert die Entscheidung eine maßgebliche Grundlage, pflege sie an ihrem Platz.
- Eine Antwort autorisiert keine Ausführung.
