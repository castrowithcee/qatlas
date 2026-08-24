---
description: >
  Immer geltende Minimalregeln zum Auffinden und sicheren Laden des vollständigen Frontmatter-Schemas vor
  einer tatsächlichen Markdown-Änderung.
license: MIT
type: rule
edit: locked
---

# Frontmatter

Inhaltliche Markdown-Dateien tragen Frontmatter; Rohzonen und ausdrücklich strukturelle READMEs sind die
festen Ausnahmen. Suche zuerst in `description`, `tags`, `type` und `status` und öffne danach nur passende
Bodies.

Bevor du eine Markdown-Datei erstellst, inhaltlich änderst, umbenennst oder verschiebst, lies vollständig
`<plugin-root>/rules/references/frontmatter.md`. Wende dort Typ, Bearbeitungsrecht, Pflichtfelder und Ausnahmen
an. Reines Lesen, Suchen und Chat brauchen das vollständige Schema nicht.

Ändere einen vorhandenen `type` nur nach Rückfrage. `edit: locked` braucht eine ausdrückliche Freigabe.
Offizielle Agentenstandards für Skills, Rules und Commands haben Vorrang.
