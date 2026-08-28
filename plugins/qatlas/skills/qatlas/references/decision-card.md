---
description: >
  Gemeinsames Gesprächsmuster für schnelle, einzeln geführte Nutzerentscheidungen zu Aufgaben in Shape,
  Backlog und Review, ohne vorausgesetzte Lektüre des Planungssystems.
type: playbook
edit: locked
license: MIT
---

# Entscheidungen knapp vorlegen

Dieser Vertrag gilt, wenn `shape`, `backlog` oder `review` eine echte Nutzerentscheidung zu einer oder
mehreren Aufgaben braucht. Der jeweilige Modus behält die Verantwortung für Auswahl, fachliche Prüfung,
Persistenz, Status und Abschluss. Diese Reference regelt nur die Übergabe im Gespräch.

Der Nutzer ist Entscheider, nicht Mitleser des Planungssystems. Jede Karte muss deshalb ohne vorherige
Lektüre des Tasks verständlich sein. Ein Link, eine Tasknummer oder ein Verweis auf vorhandenen Kontext
ersetzt die knappe Einordnung nie.

## Umfang einmal nennen

Bestimme zuerst die Aufgaben der Entscheidungsschlange. Nenne vor der ersten Karte genau einmal ihre
Anzahl:

```text
Es geht um 3 Aufgaben mit offenen Entscheidungen.
```

Passe Zahl und Singular an die tatsächliche Schlange an. Zeige an dieser Stelle keine parallele
Aufgabenübersicht. Führe danach immer nur durch die aktuelle Aufgabe. Sind in einer Aufgabe mehrere
voneinander abhängige Entscheidungen nötig, kläre sie nacheinander als `Entscheidung 1/2`,
`Entscheidung 2/2`, bevor du zur nächsten Aufgabe wechselst.

## Genau eine Karte zeigen

```text
Aufgabe 2/5 - #<Nummer> <Titel>

Darum geht es:
<Ein bis zwei Sätze zum belegten Stand und dazu, warum die Entscheidung nötig ist.>

Zu entscheiden:
<Die konkrete Entscheidungsfrage.>

Optionen:
1. <Option> - <wesentliche Folge sowie tragender Vorteil oder Nachteil>
2. <Option> - <wesentliche Folge sowie tragender Vorteil oder Nachteil>

Empfehlung:
1 - <Begründung aus Ziel, Risiko und Folgewirkung.>

Antwort: 1, 2 oder eine eigene Vorgabe.
```

- Verwende die exakte Kennung und den aktuellen Titel aus dem Planungssystem. Hat es keine numerische
  Kennung, verwende seine eindeutige Task-ID; erfinde keine Nummer.
- Biete eine bis vier konkrete, grundsätzlich einander ausschließende Optionen. Mehrere sind nur nötig,
  wenn eine echte Wahl besteht.
- Begründe jede Option knapp durch ihre entscheidungsrelevante Folge. Verstecke die Empfehlung weder in
  der Reihenfolge noch in einer wohlwollenderen Beschreibung einer Option; nenne sie danach ausdrücklich
  und begründet.
- Freitext ist keine fachliche Option. Führe `Freitext`, `Andere` oder `Type something` nie als nummerierte
  Option auf, sondern erlaube eine eigene Vorgabe nur in der Antwortzeile.
- Gib die Karte im normalen Gespräch aus. Nutze kein Auswahlwerkzeug, das Freitext als zusätzliche
  nummerierte Option einfügt oder die Einordnung von der Entscheidung trennt.
- Muss der Nutzer selbst handeln, ersetze die Optionen durch die konkrete Handlung, den exakten Ort oder
  Befehl und den erwarteten Nachweis. Begründe knapp, warum die Handlung nötig ist.
- Warte nur auf die Antwort zu dieser Karte. Kläre bei Mehrdeutigkeit nur diese Entscheidung und gehe nach
  ihrer Verarbeitung ohne Zwischenbericht zur nächsten Karte.

## Shape vor einem Task

Braucht `shape` eine Richtungsentscheidung, bevor daraus eine Aufgabe mit Kennung entstehen kann, erfinde
keine Taskidentität. Nenne einmal die Anzahl der offenen Richtungsentscheidungen und ersetze die erste Zeile
der Karte durch:

```text
Vorhaben - <knapper Arbeitstitel>
```

Freie Klärungsfragen, mit denen der Nutzer seine noch nicht ausformulierte Absicht erst beschreibt, sind
keine solche Entscheidungskarte. Sobald ein Task existiert, gilt das normale Aufgabenformat.
