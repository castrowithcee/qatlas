---
description: >
  Einführung in Qatlas: Zweck, gelöste Probleme, Prinzipien und Speicherorte.
---

# Einführung

Qatlas ist ein Arbeitsfundament für Coding-Agents wie Claude Code und Codex. Es gibt Agent, Nutzer und
Projekt eine gemeinsame Struktur, damit Arbeit über Sessions, Agents und Geräte hinweg nachvollziehbar,
sparsam und sicher bleibt.

## Welche Probleme Qatlas löst

- **Kontext geht zwischen Sessions verloren.** Projektwissen, Entscheidungen und Memory liegen versioniert im
  Repo und werden beim Sessionstart als schlanker Einstieg geladen.
- **Agents suchen blind und verbrennen Kontext.** Eine abgestufte Navigation führt von `AGENTS.md` zum
  benötigten Wissen, statt ganze Bäume zu lesen.
- **Die Ablage wuchert.** Dateien erhalten Ort, Name, ID und Frontmatter nach festen Regeln, und der eigene
  Zustand des Projekts liegt in reservierten Dateien mit je einer Aufgabe statt in erfundenen Ordnern.
- **Planung franst aus.** Es gibt genau ein maßgebliches Planungssystem, lokal oder extern, ohne Spiegel.
- **Parallele Agents kommen sich in die Quere.** Git-Arbeit läuft mit geprüftem Zustand, eigenen Worktrees und
  sauberen Commits.
- **Sensible Daten landen im Repo.** Eine konfigurierbare Schutzprüfung erkennt Secrets und personenbezogene
  Daten vor dem Commit.

## Prinzipien

- Was das Repo sagt, beschreibt die Wirklichkeit des Nutzers. Anweisungen von Nutzer und Projekt haben
  Vorrang.
- Regeln und Sessionkontext wirken passiv; Werkzeuge und Arbeitsschleifen starten nur auf Aufruf.
- Qatlas erklärt und ordnet, entscheidet aber nicht für den Nutzer.

## Wo Qatlas etwas ablegt

| Ort | Inhalt |
|---|---|
| `.qatlas-project/` im Repo | Projektzustand: die reservierten Dateien `CONVENTIONS.md`, `ARCHITECTURE.md`, `TESTING.md` und `CONTRIBUTING.md`, Wissen, Memory, der Backlog-Wegweiser sowie `zone-import/` und `zone-export/` als flüchtige Puffer |
| `.qatlas/plugins/config.json` im Repo | Projektkonfiguration einschließlich der Freigaben der Schutzprüfung |
| `~/qatlas/` | die eigene Library des Nutzers mit der globalen Arbeitsvereinbarung in `AGENTS.qatlas.md` |
| `~/.qatlas/` | technischer Zustand wie globale Konfiguration, Statusline und Worktrees |

`AGENTS.md` im Repo bleibt die native Projektanweisung: Zweck, Projektregeln und die Lesebedingungen, die in
`.qatlas-project/` verweisen.
