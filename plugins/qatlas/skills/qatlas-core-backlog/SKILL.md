---
name: qatlas-core-backlog
description: >
  Taskarbeit im maßgeblichen Planungssystem: Aufgaben anlegen, auswählen, beanspruchen, Status setzen,
  übergeben oder abschließen, Roster, Projekte und Ideen des lokalen Qatlas-Backlogs pflegen sowie das
  Planungssystem eines Projekts anbinden, prüfen oder wechseln. Verwenden, sobald Planungs- oder Taskarbeit
  über das bloße Anzeigen des geladenen Backlogs hinausgeht.
---

# qatlas-core-backlog

`.qatlas-brain/backlog/BACKLOG.md` nennt immer das einzige maßgebliche Planungssystem. Nutzer- oder
Projektvorgaben haben Vorrang.

- Bei lokaler Autorität ist `BACKLOG.md` der Roster des Qatlas-Backlogs.
- Bei externer Autorität enthält `BACKLOG.md` den prominenten Link und die Bindung, die Planungs-,
  Orchestrierungs- und Taskarbeit zum richtigen Objekt, Zugang und Statusmerkmal führt. Folge ausschließlich
  dieser Bindung. Der lokale Backlog wird dann nicht als Spiegel gepflegt, und Ideen gehen an das
  Entwurfsobjekt, das die Bindung nennt.
- Widersprechen sich native Projektanweisungen und `BACKLOG.md`, ändere nichts und kläre, welche Aussage
  aktualisiert werden muss.

## Status

Jeder Task trägt in jedem Planungssystem genau einen dieser Status. Woran ein externes System ihn zeigt, sagt
die Bindung.

- `draft`: Das Arbeitspaket selbst hat eine offene Frage zu Ergebnis, Scope-in, Scope-out, Ansatz, Abnahme
  oder einen ungeprüften Ist-Stand, der diese Punkte wesentlich ändern könnte.
- `ready`: Ausführungsreif nach „Ausführungsreife“.
- `in-progress`: Eine Ausführung hat den Task beansprucht. Das Signal bleibt auch nach einem Abbruch
  stehen. Kläre ohne sichtbaren Bearbeiter zuerst Zuständigkeit und Arbeitsstand und versetze den Task dann
  nach seinem tatsächlichen nächsten Schritt in einen anderen Status.
- `review`: Der nächste Schritt ist eine konkrete Entscheidung, Prüfung oder Handlung des Nutzers.
- `waiting`: Eine externe Voraussetzung, Ressource oder ein externes Ereignis verhindert das Weiterarbeiten.
  Grund und Wiederaufnahmesignal sind konkret benannt. Eine unfertige interne Task-Abhängigkeit allein genügt
  nicht.
- `deferred`: Der Nutzer hat die Arbeit bewusst auf später verschoben. Weder ein Blocker noch eine offene
  Frage ist Voraussetzung. Anders als bei `waiting` blockiert nichts Externes, der Nutzer hat entschieden,
  dass die Arbeit jetzt nicht dran ist.
- `done`: Abnahmekriterien erfüllt, vereinbarte Prüfungen verifiziert, Dokumentationswirkung erledigt und
  keine offene Frage. Verworfen und Duplikat sind Abschlussarten.

Zulässige Wege:

- `draft -> ready | waiting`
- `ready -> in-progress | draft | waiting`
- `in-progress -> ready | draft | review | waiting | done`
- `review -> ready | draft | waiting | done`
- `waiting -> draft | ready`
- `draft | ready | waiting -> deferred`
- `deferred -> draft | ready`

- Setze einen Task unmittelbar vor der ersten schreibenden Ausführung auf `in-progress`. Eine bloße Sichtung
  beansprucht ihn nicht.
- `ready` autorisiert keine Ausführung und sagt nichts über die Reihenfolge. Welcher Task zuerst drankommt,
  bestimmt die Reihenfolge des Planungssystems. Ordne sie nicht stillschweigend um. Ausführbare Arbeit, die
  nur nach hinten rückt, bleibt `ready`.
- Du darfst das Zurückstellen oder Zurückholen eines Tasks vorschlagen. Setze oder entferne `deferred` erst,
  wenn der Nutzer es im Gespräch ausdrücklich genehmigt hat, nie aus eigener Einschätzung und nie im
  autonomen Teil von `run`, weil dort kein Nutzer erreichbar ist. Nennt der Nutzer einen `deferred`-Task im
  Aufruf eines Modus ausdrücklich, gilt das als Genehmigung zum Zurückholen.
- Wähle einen `deferred`-Task nie aus, auch nicht im Scope des ganzen Backlogs, außer der Aufruf nennt ihn
  ausdrücklich. Wo du Status zählst oder aufzählst, nenne die Zahl der `deferred`-Tasks einmal getrennt.
- Technische Schwierigkeit allein macht einen Task weder zu `draft`, `review` noch `waiting`.
- Ein Arbeitspaket ohne erkennbaren Status hat keinen. Behandle es nicht als `draft`, wähle es nicht aus und
  setze ihm ohne Auftrag keinen Status. Nenne die Anzahl, wo sie für Auswahl oder Übersicht zählt.

## Abhängigkeiten

- Task B hängt nur dann von Task A ab, wenn B ohne ein Ergebnis von A nicht ausgeführt oder nicht abgenommen
  werden kann, etwa weil B ein Modul, eine Schnittstelle, eine Migration oder eine Entscheidung nutzt, die erst
  A herstellt. Nenne dieses Ergebnis in der Abhängigkeit konkret.
- Fachliche Priorität, sinnvolle Reihenfolge, frühe Risikoklärung, gemeinsame Dateien oder der Wunsch,
  Konflikte zu vermeiden, sind nie eine Abhängigkeit. Reihenfolge steht allein in der Reihenfolge des
  Planungssystems.

## Ausführungsreife

`ready` bezeichnet belegte Ausführungsreife. Der Task beschreibt Ziel, Scope-in, Scope-out, Vorgehen und
Abnahme ohne bekannte Vertragsfrage. Bei Arbeit an einem vorhandenen System beruht er zusätzlich auf einer
Ausführungsgrundlage, die so weit geklärt ist, dass die Ausführung den Scope nicht erst entdecken muss:
belegter Ausgangszustand, bestehende Einstiegspunkte, erwartete Änderungsflächen, konkrete Prüfpfade und die
Dokumentationswirkung. Benötigte Laufzeiten, Werkzeuge, Zugänge und besondere Bearbeitungsrechte sind ohne
Secrets benannt und entweder verfügbar oder im Taskvertrag beschaffbar.

- Erwartete Änderungsflächen sind eine Arbeitskarte, keine starre oder vollständige Dateiliste. Scope-in und
  Scope-out bleiben die Autorität.
- Die Dokumentationswirkung lautet `Ändern`, `Prüfen` oder `Keine` mit Begründung. `Ungeklärt` mit der
  fehlenden Information hält den Task in `draft`.
- Eine fehlende externe Voraussetzung führt zu `waiting`, eine ungeklärte Berechtigung oder Vertragsfrage zu
  `draft`. Reversible technische Details im ausdrücklichen Entscheidungsspielraum verhindern die Reife nicht.
- Beurteile Reife nach dem tatsächlichen Inhalt, nie nach einer bestimmten Überschrift oder Vorlage.

## Umfang und Verweise

Ein Task ist so lang, wie seine Ausführung es verlangt, und nicht länger.

- **Wissen gehört nicht ins Planungssystem:** Das Ergebnis einer Analyse oder Recherche, das spätere Arbeit
  braucht, steht als Datei im Wissensraum des Projekts, nie im Eintrag oder in der Historie eines Tasks. Ein
  Task, dessen Ergebnis eine solche Analyse ist, nennt diese Datei als Ergebnis und trägt am Ende nur das
  Ergebnis in wenigen Sätzen und den Verweis.
- **Jeder Task trägt seinen Ausschnitt:** Was die Ausführung aus einer gemeinsamen Quelle braucht, steht im
  Task selbst. Ein Verweis nennt Datei und Abschnitt und sagt, ob er Pflichtlektüre oder Hintergrund ist. Muss
  die Ausführung eine Quelle ganz lesen, um ihren Teil zu finden, ist der Task nicht `ready`.
- **Prüfwert:** Umfassen der Task und die Abschnitte, die er als Pflichtlektüre nennt, zusammen mehr als etwa
  2.000 Wörter, prüfe, ob der Task zu teilen oder der Ausschnitt enger zu fassen ist. Der Wert ist ein Signal
  für Ausreißer, kein Zielwert: Kürze keinen Task, der seine Länge braucht, und fülle keinen auf. Bleibt
  ein Task notwendig darüber, nenne dort die Wortzahl und den Grund.
- **URLs:** Eine URL steht nur im Task, wenn die Ausführung sie öffnen soll. Belege und Quellen bleiben in
  der Datei im Wissensraum.
- **Prüfung gegen externe Quellen:** Verlangt ein Task, etwas gegen eine externe Quelle zu prüfen, nennt er
  den Umfang, etwa welche Seiten oder Objekte, statt ihn offen zu lassen.

## Übergabe an den Nutzer

Bei `review` ist der Task vollständig beschrieben, und nur eine Entscheidung, Prüfung oder Handlung des
Nutzers steht aus. Ist offen, was entstehen soll (Ergebnis, Scope, Vorgehen oder Abnahme), ist der Task
`draft`. Der Task bleibt dabei eine Einheit. Lege für einen offenen Rest keinen neuen Task an.

Schreibe im selben Schritt, in dem du einen Task auf `review` setzt, die Übergabe in seinen aktuellen
Eintrag, so vollständig, dass der Nutzer ohne Task, Diff und Verlauf antworten kann:

- **Offener Punkt:** die eine Entscheidung, Prüfung oder Handlung. Bei einer Prüfung gehören Ort, Aktion
  und erwartetes Ergebnis je Schritt dazu, bei einer Handlung Ort oder Befehl und der erwartete Nachweis.
- **Belegter Stand:** was erledigt und geprüft ist und ob es integriert ist, sonst Branch, Worktree und Stand
  der nicht integrierten Arbeit.
- **Empfehlung:** bei einer Entscheidung die Optionen mit ihrer Folge und die begründete Empfehlung.
- **Danach:** was auf die Antwort folgt: der Abschluss oder die Arbeit, die ein neuer Lauf fortsetzt.

## Externe Bindung

- Lies vor dem Anlegen, Ändern oder Prüfen einer Bindung vollständig [die
  Bindungsvorlage](assets/external-binding.md). Bei normaler Taskarbeit liest du nur `BACKLOG.md`.
- Beantworte die Zeilen der Vorlage in dieser Reihenfolge: aus Vorgaben des Nutzers oder des Projekts zum
  Planungssystem, aus einer lesenden Probe des Systems, zuletzt durch eine gebündelte Rückfrage. Unterstelle
  keinen Anbieter aus einem vorhandenen Git-Remote. Lege die fertige Bindung vor und schreibe sie nach
  Zustimmung.
- Wählt der Nutzer GitHub-Issues ohne eigene Vorgabe, lege [die Startvorlage für
  GitHub-Issues](assets/external-binding-github.md) als Ausgangspunkt vor, nicht als Standard.
- Prüfe `BACKLOG.md` bei Taskarbeit nicht auf Vollständigkeit. Fehlt die Antwort für den anstehenden
  Schritt, rate nicht und nenne den fehlenden Punkt. Die Zeile ergänzt nur, wer mit dem Nutzer spricht, nach
  dessen Zustimmung.

## Planungssystem wechseln

Wechsle oder migriere das maßgebliche Planungssystem nur auf ausdrücklichen Auftrag des Nutzers, nie nebenbei
während Taskarbeit.

- Zeige vor dem ersten Schreiben im Ziel Quelle, Ziel, Umfang, Statusabbildung, nicht abbildbare Daten und
  Rückweg und hole die Zustimmung ein.
- Übernimm je Task einen aktuellen Eintrag, der allein ausführbar ist. Arbeite bindende Entscheidungen aus
  Kommentaren und Verlauf ein, statt sie als Pflichtkontext mitzuführen.
- Schalte `BACKLOG.md` erst um, wenn das Ziel nach Anzahl und Stichprobe verifiziert ist.
- Danach gilt genau ein System. Die bisherige Quelle bleibt nicht als zweiter aktiver Backlog liegen.
  Archiviere oder entferne sie nur nach ausdrücklicher Freigabe.

## Lokaler Backlog

Lies vor jeder Arbeit im lokalen Backlog vollständig den
[lokalen Backlog-Vertrag](references/local-backlog.md).
