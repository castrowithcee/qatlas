---
name: qatlas-core-backlog
description: >
  Taskarbeit im maßgeblichen Planungssystem: Aufgaben anlegen, auswählen, disponieren, beanspruchen, Status
  setzen, übergeben oder abschließen sowie Roster, Projekte und Ideen des lokalen Qatlas-Backlogs pflegen.
  Verwenden, sobald Planungs- oder Taskarbeit über das bloße Anzeigen des geladenen Backlogs hinausgeht.
---

# qatlas-core-backlog

`.qatlas-project/backlog/BACKLOG.md` nennt immer das einzige maßgebliche Planungssystem. Nutzer- oder
Projektvorgaben haben Vorrang.

- Bei lokaler Autorität ist `BACKLOG.md` der Roster des Qatlas-Backlogs.
- Bei externer Autorität enthält `BACKLOG.md` den prominenten Link und die knappe dauerhafte Bindung, die
  Planungs-, Orchestrierungs- und Taskarbeit zum richtigen Objekt, Statusmodell und Schreibweg führt. Folge
  ausschließlich dieser Bindung; der lokale Backlog wird dann nicht als Spiegel gepflegt.
- Widersprechen sich native Projektanweisungen und `BACKLOG.md`, ändere nichts und kläre, welche Aussage
  aktualisiert werden muss.
- Ein Wechsel oder eine Migration des maßgeblichen Systems erfolgt nur auf ausdrücklichen Aufruf von
  `qatlas-core backlog-system`. Normale Taskarbeit migriert oder spiegelt nicht nebenbei.

## Ausführungsreife

`ready` und `next` bezeichnen in jedem Planungssystem belegte Ausführungsreife. Der Task beschreibt Ziel,
Scope-in, Scope-out, Vorgehen und Abnahme ohne bekannte Vertragsfrage. Bei Arbeit an einem vorhandenen
System beruht er zusätzlich auf einer Ausführungsgrundlage, die so weit geklärt ist, dass die Ausführung den
Scope nicht erst entdecken muss: belegter Ausgangszustand, bestehende Einstiegspunkte, erwartete
Änderungsflächen, konkrete Prüfpfade und die Dokumentationswirkung. Benötigte Laufzeiten, Werkzeuge, Zugänge
und besondere Bearbeitungsrechte sind ohne Secrets benannt und entweder verfügbar oder im Taskvertrag
beschaffbar.

- Erwartete Änderungsflächen sind eine Arbeitskarte, keine starre oder vollständige Dateiliste. Scope-in und
  Scope-out bleiben die Autorität.
- Die Dokumentationswirkung lautet `Ändern`, `Prüfen` oder `Keine` mit Begründung. `Ungeklärt` mit der
  fehlenden Information hält den Task in `draft`.
- Eine fehlende externe Voraussetzung führt zu `waiting`, eine ungeklärte Berechtigung oder Vertragsfrage zu
  `draft`. Reversible technische Details im ausdrücklichen Entscheidungsspielraum verhindern die Reife nicht.
- Beurteile Reife nach dem tatsächlichen Inhalt, nie nach einer bestimmten Überschrift oder Vorlage.

## Übergabe an den Nutzer

`review` heißt in jedem Planungssystem: Der Task ist vollständig beschrieben, und nur eine Entscheidung,
Prüfung oder Handlung des Nutzers steht aus. Ist offen, was entstehen soll (Ergebnis, Scope, Vorgehen oder
Abnahme), ist der Task `draft`. Der Task bleibt dabei eine Einheit; lege für einen offenen Rest keinen neuen
Task an.

Schreibe im selben Schritt, in dem du einen Task auf `review` setzt, die Übergabe in seinen aktuellen
Eintrag, so vollständig, dass der Nutzer ohne Task, Diff und Verlauf antworten kann:

- **Offener Punkt:** die eine Entscheidung, Prüfung oder Handlung; bei einer Prüfung Ort, Aktion und
  erwartetes Ergebnis je Schritt, bei einer Handlung Ort oder Befehl und der erwartete Nachweis.
- **Belegter Stand:** was erledigt und geprüft ist und ob es integriert ist, sonst Branch, Worktree und Stand
  der nicht integrierten Arbeit.
- **Empfehlung:** bei einer Entscheidung die Optionen mit ihrer Folge und die begründete Empfehlung.
- **Danach:** was auf die Antwort folgt: der Abschluss oder die Arbeit, die ein neuer Lauf fortsetzt.

## Lokaler Backlog

Lies vor jeder Arbeit im lokalen Backlog vollständig den
[lokalen Backlog-Vertrag](references/local-backlog.md).
