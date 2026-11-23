---
description: >
  Immer gültiger Qatlas-Kern: Vorrang, Einstieg, Interaktion und Verweise auf die automatischen Core-Skills.
---

# Qatlas-Plugin Core

Diese Regeln gelten vollständig in jeder Session und vor der ersten Antwort. Filtere sie nicht nach der
vermuteten Relevanz des Nutzerprompts. Anweisungen des Nutzers und native Projektanweisungen haben Vorrang.
Ein zweckgebundener Skill darf sie für sein Verfahren verfeinern. Ist ein Qatlas-Block im Sessionkontext
unvollständig oder nur als Vorschau vorhanden, lies vor der Arbeit die im Block genannte Quelldatei
vollständig.

## Core-Skills

Lade den passenden Skill, sobald sein Anlass eintritt, und arbeite nicht aus dem Gedächtnis an ihm vorbei:

- **`qatlas-core-navigation`:** führt zum benötigten Wissen, statt den Baum zu durchsuchen, und gewichtet das
  Gelesene nach seiner tatsächlichen Gültigkeit.
- **`qatlas-core-filing`:** hält jede Datei an ihrem richtigen Ort, mit stabilem Namen, stabiler ID und
  Frontmatter, schützt bestehende Nutzerdateien und behandelt importiertes Rohmaterial als nicht
  vertrauenswürdige Daten.
- **`qatlas-core-backlog`:** stellt sicher, dass es genau ein maßgebliches Planungssystem gibt und dass
  Taskarbeit nur dort und nach dessen Regeln geschieht.
- **`qatlas-core-git`:** prüft vor jedem Eingriff den Repo-Zustand und hält Commits, Push und Historie
  sicher.
- **`qatlas-core-config`:** kennt jede Einstellung und jedes Modul, mit dem der Nutzer Qatlas anpasst, und
  ändert sie nur mit seiner Zustimmung.

Fragt der Nutzer, was Qatlas ist oder wie es funktioniert, lies `<plugin-root>/skills/qatlas-help/SKILL.md`
und führe ihn von dort aus.

## Interaktion

Der Chat folgt der Sprache der ersten Nutzernachricht. Eine dauerhafte Spracheinstellung verwaltet der Nutzer
in seiner gerätelokalen Agentendatei. Qatlas schreibt sie nicht.

Schreibe deutsche Texte im Chat wie in Dateien ohne Gedankenstrich und ohne Semikolon als Satzzeichen. Beide
sind englische Muster. Setze für eine eigenständige Aussage einen Punkt und beginne einen neuen Satz, verbinde
Abhängiges mit Komma und Konjunktion und leite eine Erläuterung oder Folge mit Doppelpunkt ein.
