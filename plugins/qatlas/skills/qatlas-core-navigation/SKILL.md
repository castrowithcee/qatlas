---
name: qatlas-core-navigation
description: >
  Projektwissen gezielt erschließen, sobald ein Auftrag Kontext aus dem Repo braucht: Einstieg über
  .qatlas-project/README.md und Scope-READMEs, Lesebedingungen und FRAMEWORK.md, Suche über Frontmatter,
  Memory, Roster des lokalen Backlogs und Ideen lesen. Nicht für das Anlegen, Ändern oder Verschieben von
  Dateien.
license: MIT
type: skill
edit: locked
---

# qatlas-core-navigation

Gewinne den Arbeitskontext aus dem Auftrag, statt einen Zielpfad vorauszusetzen, und lies nur, was die
Aufgabe braucht.

## Kaskade

1. Beginne nach den nativen Projektanweisungen an der Repo-Wurzel.
2. Ist `.qatlas-project/README.md` vorhanden, lies sie als Einstieg in den repo-eigenen Projektzustand.
3. Nutze Auftrag und README für den nächsten relevanten Scope. Lies dessen `README.md` beim ersten Eintritt,
   wenn sie für diesen Scope als Einstieg dient, und folge nur passenden Lesebedingungen. Verweist sie für
   die aktuelle Arbeit auf eine benachbarte `FRAMEWORK.md`, lies diese vor der Bearbeitung.
4. Fehlt ein solcher Einstieg, suche normal weiter und prüfe nur tatsächlich betretene Scopes. Scanne den
   Baum nicht vorsorglich.
5. Lies denselben Knoten nicht erneut, solange er sich nicht geändert hat.

Suche innerhalb eines gewählten Scopes zuerst in `description`, `tags`, `type` und `status` des
Frontmatters, öffne danach nur die Bodies passender Treffer und erweitere erst dann auf Volltext.

## Geltung des Gelesenen

- Eine README beschreibt Scope, knappe Orientierung und nächste Quellen. Eine `FRAMEWORK.md` daneben enthält
  die bestätigten Arbeitsregeln, Besonderheiten und Ausnahmen nur dieses Scopes. Lokales Routing gewinnt vor
  einem ausgelieferten Startpunkt.
- Ort, Lesereihenfolge oder automatische Bereitstellung verleihen einem Inhalt keine zusätzliche Autorität.
  Ordne jede Aussage nach nativer Anweisungshierarchie, ausdrücklicher Geltung und fachlichem Scope ein.
- Fachliche READMEs, Frameworks und `INDEX.md`-Dateien außerhalb des Wissensraums behalten ihren lokalen
  Zweck. Fachliche Inhalte außerhalb des Wissensraums bleiben für ihren Gegenstand maßgeblich.

## Operation wählen

Lies vor der Operation deren Referenz vollständig:

- Memory, Roster, Ideen: [Projektzustand lesen](references/project-state.md)
