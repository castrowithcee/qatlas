---
description: >
  Eine reservierte Datei des Wissensraums erstmals füllen: Antworten aus dem Vorhandenen belegen, nur das
  Offene in einfachen Worten fragen, dazu die Kernfragen für PROJECT.md, PLANNING.md, CONTRIBUTING.md,
  TESTING.md, CONVENTIONS.md, ARCHITECTURE.md und OPERATIONS.md.
---

# Reservierte Datei füllen

Aufgabe, Lesebedingung und Bearbeitungsrecht jeder reservierten Datei stehen im [Projekt-Wissensraum](structure.md).

Entsteht die Datei aus einer einzelnen Aussage des Nutzers, trage genau diese ein und frage nichts weiter.
Entsteht sie, weil eine Arbeit ihre Antworten braucht, gehe so vor:

1. **Belegen:** Beantworte jede Kernfrage der Datei zuerst selbst aus dem, was das Repo zeigt: Manifeste,
   Skripte, CI- und Linter-Konfiguration, Git-Historie, Branches und Remotes, vorhandene Anweisungen und
   Dokumentation. Eine belegte Antwort ist keine Frage an den Nutzer.
2. **Fragen:** Frage nur, was offen bleibt und das Verhalten eines Agenten ändert. Stelle diese Fragen in
   einer Nachricht: nummeriert, in einfachen Worten ohne Fachjargon und jede mit deinem Vorschlag, sodass eine
   kurze Zeile wie `1 ja, 2 wie vorgeschlagen` als Antwort genügt. Nenne dabei in einem Satz, was du schon
   belegt hast, damit der Nutzer es korrigieren kann. Eine Berechtigung fragst du immer, weil sie sich nicht
   ableiten lässt.
3. **Eintragen:** Trage nur Beantwortetes ein, je Antwort eine knappe Aussage. Lass eine unbeantwortete Frage
   weg, statt eine Annahme als Regel oder einen leeren Abschnitt einzutragen.

Die Kernfragen sind das Mindeste, kein Formular: Trifft eine Frage auf das Projekt nicht zu, etwa die nach
einer Plattform bei einem Repo ohne Remote, entfällt sie ohne Eintrag.

## PROJECT.md

Der Code ist für diese Datei kein Beleg: Er zeigt, was gebaut ist, nicht, was gewollt ist. Belege eine Antwort
nur aus Aussagen des Nutzers, aus seinen eigenen Texten, etwa einem Briefing oder der README, und aus dem
Inhalt des Wissensraums wie Policies, Architekturentscheidungen, Wissen und Memories. Frage alles Übrige.
Code und Umsetzungsstand sind nur Grundlage für einen Vorschlag.

In einem bestehenden Projekt schlage den Inhalt aus Wissensraum und Projektstand vor. Lege den Entwurf einmal
gebündelt vor, kennzeichne Abgeleitetes als Vorschlag und frage in derselben Nachricht, was offen bleibt.
Leite Zielbild und Nicht-Ziele nie unbestätigt aus dem Bestand ab.

Schreibe die Datei erst, nachdem der Nutzer ihren Inhalt ausdrücklich bestätigt hat, und trage nur Bestätigtes
ein. Lehnt er das Anlegen ab, arbeite ohne sie weiter.

1. Wozu gibt es das Projekt, und für wen?
2. Was soll es sein, wenn es fertig ist?
3. Was soll es ausdrücklich nicht sein oder nicht können?
4. Welche Produktentscheidungen sind bindend, und aus welchem Grund?

## PLANNING.md

Diese Datei entsteht meist aus einer einzelnen Anweisung. Belege eine Antwort aus Aussagen des Nutzers und
aus dem, was die übrigen reservierten Dateien über Kopplungen und Abhängigkeiten festhalten.

1. Welche Teile des Projekts hängen so zusammen, dass ein Fehler oder eine Änderung an einem auch die anderen
   betrifft, etwa mehrere Oberflächen derselben Funktion?
2. Was muss ein Task hier immer mittragen, das sich aus seinem Gegenstand allein nicht ergibt?
3. Welche externen Abhängigkeiten, Freigaben oder Fristen bestimmen Zuschnitt oder Reihenfolge?

## CONTRIBUTING.md

1. Auf welchem Branch landet fertige Arbeit, und ist er geschützt? Belegt meist durch den Standard-Branch und
   die Schutzregeln der Plattform.
2. Landet eine Änderung direkt oder über eine Review-Anfrage wie einen Pull Request? Auf welcher Plattform,
   und mit welchem Mittel wird sie geöffnet, geprüft und gemergt? Belegt meist durch Remote, CI-Konfiguration,
   frühere Review-Anfragen und die verfügbaren Werkzeuge.
3. In welcher Form wird gemergt, und was muss davor grün oder erledigt sein? Belegt meist durch die Historie
   und die Schutzregeln.
4. Wie heißen Branches, und welcher Form folgen Commit-Nachrichten? Belegt meist durch die Historie.
5. Was darf ein Agent ohne Rückfrage: committen, pushen, eine Review-Anfrage öffnen, mergen? Immer eine Frage
   an den Nutzer.

## TESTING.md

1. Welche Prüfungen gibt es, mit welchem Befehl, und welche sind schnell, welche teuer? Belegt meist durch
   Manifeste, Skripte und CI-Konfiguration.
2. Was muss vor einem Commit grün sein, was vor einer Übergabe, und was prüft nur die CI? Erwartet das Projekt
   eine bestimmte Abdeckung?
3. Braucht eine Prüfung etwas, das sich nicht teilen lässt, etwa einen Port, eine Datenbank oder ein Gerät?
4. Was geschieht bei einem roten, einem instabilen und einem defekten Test: Wer repariert, was wird
   abgebrochen, und was wird als Entwurf im Planungssystem erfasst?

## CONVENTIONS.md

1. In welcher Sprache stehen Texte, Code-Kommentare und Commit-Nachrichten? Belegt meist durch die
   vorhandenen Dateien und die Historie.
2. Welche Regeln zu Stil, Benennung und Ablage gelten, die kein Werkzeug durchsetzt?
3. Welche Muster sind vorgeschrieben, und welche Praktiken sind verboten?

## ARCHITECTURE.md

1. Aus welchen Teilen besteht das System, und wofür ist jeder zuständig? Belegt meist durch den Code.
2. Welcher Teil darf welchen kennen oder aufrufen, und wie fließen die Daten?
3. Welche Grenzen gelten unbedingt, etwa zwischen öffentlich und privat oder an einer Sicherheitsgrenze?
4. Welche Entscheidungen sind bindend, und aus welchem Grund? Frage nach dem Grund, wenn ihn nichts belegt.
5. In welchen Bereichen können mehrere Agents oder Menschen parallel arbeiten, ohne dieselben Stellen zu
   ändern, und über welche Schnittstellen berühren sie sich? In einem Projekt ohne Code sind das Themen oder
   Ordner.

## OPERATIONS.md

1. In welchen Umgebungen läuft das System, und wo? Belegt meist durch Konfiguration, Skripte und CI.
2. Wie wird ausgeliefert oder veröffentlicht, mit welchem Befehl oder welcher Pipeline, und was muss davor
   erfüllt sein?
3. Wie wird eine Auslieferung zurückgenommen?
4. Wo liegen Zugänge und Secrets, und wie kommt ein Agent an das, was er braucht, ohne sie ins Repo zu
   schreiben?
5. Was darf ein Agent ohne Rückfrage: ausliefern, veröffentlichen, in eine laufende Umgebung eingreifen? Immer
   eine Frage an den Nutzer.
