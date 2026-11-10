---
name: qatlas-core-navigation
description: >
  Projektwissen gezielt erschließen, sobald eine Aufgabe Kontext aus dem Repo braucht: Einstieg über
  AGENTS.md und deren Lesebedingungen, die reservierten Dateien CONVENTIONS.md, ARCHITECTURE.md, TESTING.md
  und CONTRIBUTING.md, Scope-READMEs und FRAMEWORK.md, Suche über Frontmatter, Memory lesen, Roster und
  Ideen des lokalen Backlogs. Nicht zum Anlegen, Ändern oder Verschieben von Dateien.
---

# qatlas-core-navigation

Leite den Arbeitskontext aus der Aufgabe ab, statt einen Zielpfad vorauszusetzen, und lies nur, was die
Aufgabe braucht.

## Kaskade

1. Beginne mit dem Abschnitt `Projektwissen` der bereits geladenen Projektanweisungen. Er nennt die
   reservierten Dateien von `.qatlas-project/` mit ihren Lesebedingungen; folge nur denen, die zur Aufgabe
   passen. Eine reservierte Datei, die ohne Zeile dort existiert, gilt trotzdem unter ihrer
   Standard-Lesebedingung.
2. Nimm Aufgabe und diese Dateien für den nächsten relevanten Scope. Lies die `README.md` eines Scopes beim
   ersten Betreten, wenn sie als Einstieg für diesen Scope dient, und folge nur passenden Lesebedingungen.
   Verweist sie für die aktuelle Arbeit auf eine danebenliegende `FRAMEWORK.md`, lies diese vor der Arbeit.
3. Gibt es keinen solchen Einstieg, suche normal weiter und prüfe nur Scopes, die du tatsächlich betreten
   hast. Durchsuche den Baum nicht vorsorglich.
4. Lies denselben Knoten nicht erneut, solange er sich nicht geändert hat.

Suche innerhalb eines gewählten Scopes zuerst in `description`, `tags`, `type` und `status` des Frontmatters,
öffne dann nur die Rümpfe passender Treffer und weite erst danach auf die Volltextsuche aus.

## Geltung des Gelesenen

- Eine Scope-README beschreibt Scope, kurze Orientierung und nächste Quellen. Eine danebenliegende
  `FRAMEWORK.md` enthält nur die bestätigten Arbeitsregeln, Besonderheiten und Ausnahmen dieses
  Fachbereichs. Lokale Weiterleitung schlägt einen mitgelieferten Ausgangspunkt.
- Ort, Lesereihenfolge oder automatische Bereitstellung geben Inhalt keine zusätzliche Autorität. Ordne jede
  Aussage nach nativer Anweisungshierarchie, ausdrücklicher Geltung und Gegenstandsbereich ein.
- Die reservierten Dateien von `.qatlas-project/` binden jedes Vorhaben, bis der Nutzer sie ändert. Lies vor
  dem Planen, Zuschneiden oder Ausführen von Arbeit diejenigen, deren Lesebedingung die Arbeit erfüllt.
- Die aktuelle Version einer Datei gilt. Frühere Versionen in Git dienen nur der Wiederherstellung; lies sie
  nur, um etwas wiederherzustellen oder wenn der Nutzer die Historie verlangt. Ein Plan mit `status: done`
  leitet keine laufende Arbeit mehr.
- Fach-READMEs, Frameworks und `INDEX.md`-Dateien außerhalb des Wissensraums behalten ihren lokalen Zweck.
  Fachinhalt außerhalb des Wissensraums bleibt für seinen Gegenstand maßgeblich.

## Vorgang wählen

Lies die Referenz des Vorgangs vollständig vor dem Vorgang:

- Memory, Roster, Ideen: [Projektzustand lesen](references/project-state.md)
