---
name: qatlas-core-filing
description: >
  Dateien regelkonform anlegen, benennen, ablegen, umbenennen, verschieben, zusammenführen, promoten,
  archivieren oder löschen, Markdown inhaltlich ändern, Verweise einfügen und Rohmaterial aus
  .qatlas-project/zone-import/ verarbeiten, sobald der Nutzer es ankündigt oder den Pfad nennt: bestimmt Ort,
  Namen, Kennung und Frontmatter und hält Navigation und Verweise konsistent. Nicht für reines Lesen, für
  Codeänderungen innerhalb bestehender Dateien oder für Konvertierungen außerhalb der Importzone.
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

Folgt das Anlegen, Ändern oder Verschieben einer Datei einer kanonischen Vorlage oder einem Fachvertrag,
etwa ein Task samt Abschluss nach `done/` dem lokalen Backlog-Vertrag, genügen Vorlage und Vertrag. Lies die
Referenzen unten dann nur für das, was beide offen lassen. Sonst lies vor der Operation deren Referenz
vollständig:

- Anlegen ohne passende Vorlage: [Ablegen](references/playbook-create.md)
- Umbenennen, Verschieben, Zusammenführen, Promoten, Archivieren, Löschen:
  [Umstrukturieren](references/playbook-restructure.md)
- Importieren: [Importieren](references/playbook-import.md)
- Frontmatter setzen oder ändern: [Frontmatter](references/frontmatter.md)
- Ort, Präfix oder Kennung im Wissensraum bestimmen: [Projektwissensraum](references/structure.md)
