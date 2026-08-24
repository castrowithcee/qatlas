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
2. Prüfe beim ersten Eintritt in jeden relevanten Scope auf `FRAMEWORK.md` und `framework.md`, danach auf
   `INDEX.md` und `index.md`. Lies jeweils die eine vorhandene Form, das Framework vor dem Index.
3. Sind Groß- und Kleinschreibung derselben Funktionsdatei gleichzeitig vorhanden, kläre, welche gilt.
4. Nutze Nutzeranfrage und Index für den nächsten Scope. Fehlt ein Index, suche normal weiter und prüfe nur
   tatsächlich betretene Scopes. Scanne den Baum nicht vorsorglich.
5. Lies denselben Knoten nicht erneut, solange er sich nicht geändert hat.

Beim Anlegen sind ausschließlich `FRAMEWORK.md` und `INDEX.md` kanonisch. Erzeuge keine zweite Form neben
einer vorhandenen kleingeschriebenen Datei. `FRAMEWORK.md` beschreibt lokale Leitplanken, `INDEX.md` den
wichtigen Bestand und nächste Einstiegspunkte. `README.md` bleibt für menschliche Leser und ist kein
Navigationsknoten. Der reservierte Dateiname bleibt das Lesesignal, auch wenn sein Frontmatter abweicht;
melde den Befund und ändere den `type` nur nach der Frontmatter-Regel.

Was im Repo steht, beschreibt die Realität des Nutzers. Widerspricht es deinem Trainingswissen, folge der
Datei und melde die Abweichung, statt sie still zu überschreiben.

## Interaktion

Chat und sichtbares Reasoning folgen der Sprache der ersten Nutzernachricht. Eine dauerhafte Sprachvorgabe
verwaltet der Nutzer selbst in seiner gerätelokalen Agentendatei; Qatlas schreibt sie nicht.
