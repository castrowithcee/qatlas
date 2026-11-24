---
name: qatlas-core-filing
description: >
  Dateien nach den Regeln anlegen, benennen, ablegen, umbenennen, verschieben, zusammenführen, aufwerten,
  archivieren oder löschen, Markdown-Inhalte ändern, Verweise einfügen und Rohmaterial aus
  .qatlas-brain/zone-import/ verarbeiten, sobald der Nutzer es ankündigt oder den Pfad nennt: legt Ort,
  Namen, Typ und Frontmatter fest und hält Navigation und Verweise konsistent, einschließlich der
  reservierten Dateien PROJECT.md, CONVENTIONS.md, ARCHITECTURE.md, TESTING.md und CONTRIBUTING.md des
  Wissensraums.
  Nicht für reines Lesen, für Codeänderungen in bestehenden Dateien oder für Konvertierungen außerhalb der
  Importzone.
---

# qatlas-core-filing

Der Ort einer Datei folgt dem Gegenstand ihrer Aussage. Weder Markdown noch Agentenleserschaft noch
Gewohnheit entscheiden ihn allein. Innerhalb von `.qatlas-brain/` entscheiden die reservierten Dateien und
festen Ordner, und jede nimmt nur ihre Aufgabe oder ihre Typen auf.

## Namen und Format

- Für gewöhnliche Datei- und Ordnernamen gelten Kebab-Case, reines ASCII und keine Leerzeichen. Müller wird
  zu `mueller`.
- Reservierte Funktions- und Agentendateien behalten ihre feste Schreibweise: `README.md`, `AGENTS.md`,
  `CLAUDE.md`, `MEMORY.md`, `BACKLOG.md`, `PROJECT.md`, `CONVENTIONS.md`, `ARCHITECTURE.md`,
  `TESTING.md`, `CONTRIBUTING.md`, `FRAMEWORK.md` und `INDEX.md`. Bestehende Funktionsdateien behalten ihren Zweck und
  ihren lokalen Geltungsbereich.
- Inhaltsdateien im Wissensraum beginnen mit dem Frontmatter-`type`.
- Daten werden als `YYYY-MM-DD` geschrieben. Chronologische Dateien dürfen mit diesem Datum beginnen.
- ä, ö, ü und ß werden in deutschen Dateien direkt geschrieben.

## Verweise

Jeder Verweis verursacht Pflegeaufwand. Setze ihn nur, wenn die Aufgabe das Ziel wirklich braucht.

- Verweise auf ganze Dateien, nicht auf Zeilen oder Abschnitte, und höchstens einmal pro Datei auf dasselbe
  Ziel.
- Verlinke nichts, was ohnehin immer im Kontext ist.
- Dupliziere keine Norm. Führe Material mit gleichem Zweck zusammen.
- Inhalt und Dokumentation verweisen nicht auf die Metaebene wie Agentendateien, Regeln oder Skills.
  Abhängigkeiten laufen von Meta zu Inhalt.
- Formuliere Leseverpflichtungen eindeutig: „Bevor du X tust, lies …“, „Details bei Bedarf in …“ oder
  „Öffne nur, wenn du tatsächlich Y tust“.

## Bestehendes schützen

Lies eine bestehende Datei, bevor du sie änderst. Achte ihr Frontmatter und ihre lokale Struktur. Ändere am
maßgeblichen Ort, statt eine nahezu gleiche Kopie anzulegen. Vorlagen, Seeds und Plugin-Material ersetzen
Nutzerdateien nie pauschal. Lege einen fehlenden festen Ordner des Wissensraums erst mit seinem ersten
Eintrag an und nie einen Ordner über die festen hinaus, außer der Nutzer verlangt es ausdrücklich.

## Vorgang wählen

Folgt das Anlegen, Ändern oder Verschieben einer Datei einer kanonischen Vorlage oder einem Fachvertrag,
etwa die Bindung eines Planungssystems nach der Backlog-Norm, genügen Vorlage und Vertrag. Issues des lokalen
Backlogs sind keine Dateien des Wissensraums und folgen allein der Backlog-Norm. Lies die folgenden
Referenzen nur für das, was beide offenlassen. Andernfalls lies die Referenz des Vorgangs vollständig vor dem
Vorgang:

- Anlegen ohne passende Vorlage: [Datei](references/playbook-create.md)
- Reservierte Datei erstmals füllen: [Reservierte Datei füllen](references/playbook-reserved-files.md)
- Umbenennen, verschieben, zusammenführen, aufwerten, archivieren, löschen:
  [Umstrukturieren](references/playbook-restructure.md)
- Import: [Import](references/playbook-import.md)
- Frontmatter setzen oder ändern: [Frontmatter](references/frontmatter.md)
- Ordner oder Namen im Wissensraum bestimmen: [Projekt-Wissensraum](references/structure.md)
- Inhalt im Wissensraum schreiben oder erweitern: [Umfangsgrenzen](references/size-limits.md)
- Inhalt einer reservierten Datei ändern: [Projekt-Wissensraum](references/structure.md)
