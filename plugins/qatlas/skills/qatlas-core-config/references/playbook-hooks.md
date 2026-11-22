---
description: >
  Module des Nutzers unter ~/.qatlas/hooks/: Vertrag des Moduls run-end.js, das Qatlas am Ende eines Laufs
  startet, und der Weg, es mit dem Nutzer einzurichten, zu prüfen und abzuschalten.
---

# Nutzermodule

Ein Nutzermodul ist eine Node-Datei des Nutzers unter `~/.qatlas/hooks/`. Qatlas startet sie zu einem festen
Ereignis und liefert keine mit. Die Datei ist der Schalter: Vorhanden heißt eingeschaltet, fehlt sie,
geschieht nichts. Einen Schlüssel in einer `config.json` gibt es dafür nicht.

## `run-end.js`

`qatlas run` startet `~/.qatlas/hooks/run-end.js` einmal, wenn der Supervisor einen Lauf abschließt. Das Modul
erhält auf der Standardeingabe eine Zeile JSON:

| Feld | Inhalt |
|---|---|
| `event` | immer `run-end` |
| `project`, `repo` | Name und absoluter Pfad des Projekts |
| `text` | die Ankerzeile des Abschlussblocks, etwa Projekt, Modus und Stand |
| `duration` | Dauer des Laufs in Sekunden |
| `tasks`, `integrated` | Zahl der eingeplanten und der integrierten Tasks |
| `decisions`, `risks`, `drafts` | Zahl der offenen Entscheidungen, Risiken und neuen Entwürfe |

Was das Modul damit tut, bestimmt der Nutzer: eine Nachricht senden, eine Datei schreiben, nichts. Es hat 60
Sekunden. Endet es mit einem Fehler oder zu spät, läuft der Abschluss trotzdem weiter und nennt den Fehler.

## Einrichten

1. Kläre mit dem Nutzer, wohin die Meldung geht, mit welchem Werkzeug dieses Rechners, und was sie enthält.
   Nimm ein Werkzeug, das er schon eingerichtet hat, und frage nicht nach Zugangsdaten.
2. Schreibe das Modul so, dass es die Eingabe als Daten liest und Werte nur als Argumente weitergibt, nie über
   eine Shell. Zugangsdaten stehen nicht im Modul, sondern dort, wo das gewählte Werkzeug sie verwaltet. Soll
   ein Projekt nichts melden, prüft das Modul `project` selbst.
3. Prüfe es mit einer Beispielzeile, ohne einen Lauf zu starten:
   `echo '{"event":"run-end","project":"test","repo":"/tmp/test","text":"Test","duration":1,"tasks":1,"integrated":1,"decisions":0,"risks":0,"drafts":0}' | node ~/.qatlas/hooks/run-end.js`
   und lass den Nutzer bestätigen, dass die Meldung ankam.

Zum Abschalten benenne die Datei um oder lösche sie nach Zustimmung des Nutzers.
