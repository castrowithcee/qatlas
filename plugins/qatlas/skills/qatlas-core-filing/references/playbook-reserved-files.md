---
description: >
  Eine reservierte Datei des Wissensraums erstmals füllen: Antworten aus dem Vorhandenen belegen, nur das
  Offene in einfachen Worten fragen, dazu die Kernfragen für CONTRIBUTING.md, TESTING.md, CONVENTIONS.md und
  ARCHITECTURE.md.
---

# Reservierte Datei füllen

Aufgabe, Lesebedingung und Typ jeder reservierten Datei stehen im [Projekt-Wissensraum](structure.md).

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
