---
name: qatlas-core-filing
description: >
  Dateien regelkonform anlegen, benennen, ablegen, umbenennen, verschieben, zusammenführen, promoten,
  archivieren oder löschen, Markdown inhaltlich ändern und Verweise einfügen: bestimmt Ort, Namen, Kennung
  und Frontmatter und hält Navigation und Verweise konsistent, auch unter .qatlas-project/. Nicht für reines
  Lesen und nicht für Codeänderungen innerhalb bestehender Dateien.
license: MIT
type: skill
edit: locked
---

# qatlas-core-filing

Der Ort einer Datei folgt dem Gegenstand ihrer Aussage. Weder Markdown, Frontmatter-Typ, Präfix noch
Agentenleserschaft entscheiden allein darüber.

## Namen und Format

- Verwende für gewöhnliche Datei- und Ordnernamen kebab-case, reines ASCII und keine Leerzeichen. Aus
  Müller wird `mueller`.
- Reservierte Funktions- und Agentendateien behalten ihre festgelegte Großschreibung: `README.md`,
  `AGENTS.md`, `CLAUDE.md`, `MEMORY.md`, `BACKLOG.md`, `IDEAS.md`, `HISTORY.md`, `FRAMEWORK.md` und
  `INDEX.md`. Vorhandene Funktionsdateien behalten ihren Zweck und ihre lokale Geltung.
- Verwende Datumswerte als `YYYY-MM-DD`. Chronologische Dateien dürfen mit diesem Datum beginnen.
- Schreibe in deutschen Dateien ä, ö, ü und ß direkt. Verwende Em-Dashes und En-Dashes nicht als
  Satzzeichen.

## Verweise

Jeder Verweis erzeugt Wartungsaufwand. Erzeuge ihn nur, wenn das Ziel für die Aufgabe wirklich gebraucht
wird.

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
Pluginmaterial ersetzen Nutzerdateien nie pauschal. Lege keine leeren Ordner auf Vorrat an.

## Operation wählen

Lies vor jeder anstehenden Operation deren Referenz vollständig:

- Anlegen: [Ablegen](references/playbook-create.md)
- Umbenennen, Verschieben, Zusammenführen, Promoten, Archivieren, Löschen:
  [Umstrukturieren](references/playbook-restructure.md)
- Markdown anlegen oder inhaltlich ändern: [Frontmatter](references/frontmatter.md)
- Schreiben unter `.qatlas-project/`: [Projektwissensraum](references/structure.md)
