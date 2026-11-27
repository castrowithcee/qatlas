---
description: >
  Verweist auf die GitHub-Issues des Repos als maßgebliches Planungssystem und bindet Zugang, Statusmerkmale
  über Labels, Reihenfolge und Lesepolitik ohne lokalen Spiegel.
edit: shared
---

# Backlog

- [<owner>/<repo> Issues](https://github.com/<owner>/<repo>/issues) - GitHub-Issues im Repo `<owner>/<repo>`
  sind das einzige maßgebliche Planungssystem.

## Bindung

- **Zugang:** <`gh`, GitHub-API, Qatlas Connect (`qconnect`, github.com/castrowithcee/qatlas-connect) oder ein
  anderer MCP-Server, mit der nötigen Anmeldung, keine secrets>
- **Arbeitspakete:** ein Issue pro Task
- **Entwürfe:** offenes Issue mit Label `draft`
- **Epics:** offenes Issue mit Label `epic` und ohne Status-Label, geschlossen mit Grund `completed`
- **Status:** offenes Issue mit genau einem der Labels `draft`, `ready`, `in-progress`, `review`, `waiting`,
  `deferred`. Ein Wechsel ersetzt das bisherige Status-Label. Offen ohne Status-Label hat keinen Status.
- **Abschluss:** `done` = geschlossen mit Grund `completed`, verworfen = `not planned`, Duplikat =
  `duplicate`. Geschlossen gilt vor jedem Label. Ein wieder geöffnetes Issue bekommt `draft`.
- **Reihenfolge:** niedrigere Issue-Nummer zuerst, Abhängigkeiten als Beziehung „blocked by“ am Issue
- **Anspruch:** Label `in-progress`
- **Aktueller Datensatz:** Titel und Body des Issues
- **Historie:** Kommentare, nicht maßgeblich
- **Lesepolitik:** für Übersichten nur offene Issues mit Titel und Labels, nach Label gefiltert. Body nur für
  ausgewählte Issues, Kommentare nur bei Widerspruch oder ausdrücklichem Verweis.
- **Lokaler Spiegel:** keiner

<!-- Ein Start, kein Standard. Nach .qatlas-brain/backlog/BACKLOG.md kopieren, Platzhalter ersetzen, an die
     Arbeitsweise des Nutzers anpassen und diesen Kommentar entfernen. -->
