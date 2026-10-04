---
description: >
  Prüfanweisung zum Nachrüsten von Version, Änderungsdatum und Entscheidungsstatus im Frontmatter
  bestehender Dokumente des Projektwissensraums.
license: MIT
type: rule
edit: locked
---

# Versionierung im Projektwissensraum nachrüsten

Dieser Punkt ist rein ergänzend und wird ohne Rückfrage ausgeführt.

- Prüfe die Markdown-Dateien unter `.qatlas-project/` außer `zone-import/`, `zone-export/` und
  `templates/`. Dateien außerhalb des Wissensraums erhalten die Felder erst, wenn sie ohnehin geschrieben
  werden.
- Ergänze nach dem Frontmatter-Schema von `qatlas-core-filing` nur fehlende Felder: `version` und
  `updated` bei `knowledge`, `fact`, `rule`, `playbook` und `FRAMEWORK.md`, `status` bei `decision`.
- Setze `version: 1`. Übernimm ein vorhandenes `updated`, sonst das Datum aus
  `git log -1 --format=%cs -- <datei>`, ohne Git-Historie das heutige Datum. Eine Entscheidung mit
  `edit: locked` erhält `status: accepted`, sonst `status: draft`.
- Ändere keine Aussage, keinen vorhandenen Frontmatter-Wert und keine Datei ohne Frontmatter. Bereits
  angenommene Entscheidungen bleiben, wie sie sind; die Ablösung durch ein neues Dokument gilt für künftige
  inhaltliche Änderungen.
- Halte die Nachrüstung getrennt von anderer Arbeit und biete dafür einen eigenen Commit an. Nenne danach
  die Zahl der ergänzten Dateien und ein Beispiel. Fehlt nichts, ist im Projekt nichts anzupassen.
