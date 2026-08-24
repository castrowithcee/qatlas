---
description: >
  Immer geltende Regeln für das Erstellen, Ändern, Benennen, Verschieben und Referenzieren von Dateien.
license: MIT
type: rule
edit: locked
---

# Dateien

Diese Regeln gelten vor jeder Erstellung, inhaltlichen Änderung, Umbenennung oder Verschiebung einer Datei
und vor dem Einfügen einer Referenz. Reines Lesen, Suchen und Chat lösen sie nicht aus. Ist dieser Block
unvollständig oder nur als Vorschau vorhanden, lies die im Block genannte Quelldatei vollständig, bevor du
eine Datei veränderst.

## Namen und Format

- Verwende für gewöhnliche Datei- und Ordnernamen kebab-case, reines ASCII und keine Leerzeichen. Aus
  Müller wird `mueller`.
- Reservierte Funktions- und Agentendateien behalten ihre festgelegte Großschreibung: `README.md`,
  `AGENTS.md`, `CLAUDE.md`, `MEMORY.md`, `BACKLOG.md`, `HISTORY.md`, `FRAMEWORK.md` und `INDEX.md`.
- Erzeuge `framework.md` und `index.md` nicht neu. Lies vorhandene Formen, bis eine Umbenennung freigegeben
  ist.
- Verwende Datumswerte als `YYYY-MM-DD`. Chronologische Dateien dürfen mit diesem Datum beginnen.
- Schreibe in deutschen Dateien ä, ö, ü und ß direkt. Verwende Em-Dashes und En-Dashes nicht als
  Satzzeichen.

## Referenzen

Jede Referenz erzeugt Wartungsaufwand. Erzeuge sie nur, wenn das Ziel für die Aufgabe wirklich gebraucht
wird.

- Suche bei Umbenennungen nach betroffenen Referenzen und ändere nur tatsächlich gebrochene Verweise.
- Verweise auf ganze Dateien, nicht auf Zeilen oder Abschnitte, und pro Datei höchstens einmal auf dasselbe
  Ziel.
- Verlinke nichts, was ohnehin immer im Kontext liegt.
- Dupliziere keine Norm. Führe Material mit demselben Zweck zusammen.
- Inhalt und Dokumentation verweisen nicht auf die Metaebene wie Agentendateien, Rules oder Skills.
  Abhängigkeiten laufen von Meta zu Inhalt.
- Formuliere Leseverpflichtungen eindeutig: „Bevor du X tust, lies …“, „Details bei Bedarf in …“ oder „Nur
  öffnen, wenn du tatsächlich Y tust“.

## Vorhandenes schützen

Lies eine vorhandene Datei vor ihrer Änderung. Respektiere ihr Frontmatter und ihre lokale Struktur. Führe
eine Änderung am maßgeblichen Ort aus, statt eine beinahe identische Kopie anzulegen. Vorlagen, Seeds und
Pluginmaterial ersetzen Nutzerdateien nie pauschal.

Nur wenn eine konkrete Aufgabe nach vorhandenen Assets oder Vorlagen verlangt, lies
`<plugin-root>/store/STORE.md`. Wähle dort den passenden Eintrag und öffne ausschließlich dessen Dateien.
