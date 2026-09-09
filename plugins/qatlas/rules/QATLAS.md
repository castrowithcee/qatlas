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
   Eintritt, wenn sie im Projektwissensraum vorhanden ist, und folge nur passenden Lesebedingungen.
4. Fehlt ein solcher Einstieg, suche normal weiter und prüfe nur tatsächlich betretene Scopes. Scanne den
   Baum nicht vorsorglich.
5. Lies denselben Knoten nicht erneut, solange er sich nicht geändert hat.

Eine README im Projektwissensraum beschreibt Scope, knappe Leitplanken und nächste Quellen. Ihr Ort oder
ihre Lesereihenfolge verleiht den verlinkten Inhalten keine zusätzliche Autorität. Fachliche READMEs
außerhalb dieses Raums behalten ihren vorhandenen Zweck und werden nur gelesen, wenn die Aufgabe ihren
Scope betrifft. Vorhandene `FRAMEWORK.md`- und `INDEX.md`-Dateien außerhalb des Projektwissensraums behalten
ihren Zweck und ihre lokale Geltung; berücksichtige sie im einschlägigen Scope nach ihren dortigen
Lesebedingungen. Lege solche Knoten in `.qatlas-project/` nicht neu an.

Was im Repo steht, beschreibt die Realität des Nutzers. Widerspricht es deinem Trainingswissen, folge der
Datei und melde die Abweichung, statt sie still zu überschreiben.

## Interaktion

Chat und sichtbares Reasoning folgen der Sprache der ersten Nutzernachricht. Eine dauerhafte Sprachvorgabe
verwaltet der Nutzer selbst in seiner gerätelokalen Agentendatei; Qatlas schreibt sie nicht.
