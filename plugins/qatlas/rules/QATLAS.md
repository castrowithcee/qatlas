---
description: >
  Immer geltender Qatlas-Kern für Vorrang, kaskadische Navigation und Interaktion.
license: MIT
type: rule
edit: locked
---

# Qatlas-Kern

Diese Regeln gelten in jeder Session vollständig und vor der ersten Antwort. Filtere sie nicht nach der
vermuteten Relevanz des Nutzerprompts. Nutzeranweisungen und native Projektanweisungen haben Vorrang; ein
zweckgebundener Skill darf sie für seinen Ablauf präzisieren. Ist dieser Block unvollständig oder nur als
Vorschau vorhanden, lies die im Block genannte Quelldatei vollständig, bevor du arbeitest.

## Kaskadische Navigation

Gewinne den Arbeitskontext aus der Nutzeranfrage, statt einen Zielpfad vorauszusetzen:

1. Beginne nach den nativen Projektanweisungen an der Repo-Wurzel.
2. Ist `.qatlas-project/README.md` vorhanden, lies sie als Einstieg in den repo-eigenen Projektzustand.
3. Nutze Nutzeranfrage und README für den nächsten relevanten Scope. Lies dessen `README.md` beim ersten
   Eintritt, wenn sie für diesen Scope als Einstieg dient, und folge nur passenden Lesebedingungen. Verweist
   sie für die aktuelle Arbeit auf eine benachbarte `FRAMEWORK.md`, lies diese vor der Bearbeitung.
4. Fehlt ein solcher Einstieg, suche normal weiter und prüfe nur tatsächlich betretene Scopes. Scanne den
   Baum nicht vorsorglich.
5. Lies denselben Knoten nicht erneut, solange er sich nicht geändert hat.

Eine README beschreibt Scope, knappe Orientierung und nächste Quellen. Eine optionale `FRAMEWORK.md`
daneben enthält die für diesen Scope bestätigten Arbeitsregeln, Besonderheiten und Ausnahmen, die nicht
global gelten. Ihr Ort oder ihre Lesereihenfolge verleiht verlinkten Inhalten keine zusätzliche Autorität.
Fachliche READMEs und Frameworks außerhalb des Projektwissensraums behalten ihren lokalen Zweck. Bestehende
`INDEX.md`-Dateien außerhalb des Projektwissensraums behalten ebenfalls ihren Zweck; lege im
Projektwissensraum keine neuen an.

Was im Repo steht, beschreibt die Realität des Nutzers. Widerspricht es deinem Trainingswissen, folge der
Datei und melde die Abweichung, statt sie still zu überschreiben.

## Interaktion

Chat und sichtbares Reasoning folgen der Sprache der ersten Nutzernachricht. Eine dauerhafte Sprachvorgabe
verwaltet der Nutzer selbst in seiner gerätelokalen Agentendatei; Qatlas schreibt sie nicht.
