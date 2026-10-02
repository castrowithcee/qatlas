---
description: >
  Vorstellung von Qatlas: Zweck, gelöste Probleme, Grundsätze und Ablageorte.
type: meta
edit: locked
license: MIT
---

# Vorstellung

Qatlas ist eine Arbeitsgrundlage für Coding-Agents wie Claude Code und Codex. Es gibt Agent, Nutzer und
Projekt eine gemeinsame Struktur, damit Arbeit über Sessions, Agents und Geräte hinweg nachvollziehbar,
sparsam und sicher bleibt.

## Welche Probleme Qatlas löst

- **Kontext geht zwischen Sessions verloren.** Projektwissen, Entscheidungen und Memory liegen versioniert
  im Repo und werden beim Sessionstart als knapper Einstieg geladen.
- **Agents suchen blind und verbrauchen Kontext.** Eine kaskadische Navigation führt von der Projekt-README
  gezielt zum nötigen Wissen, statt ganze Bäume zu lesen.
- **Ablage verwildert.** Dateien erhalten nach festen Regeln Ort, Namen, Kennung und Frontmatter.
- **Planung zerfasert.** Es gibt genau ein maßgebliches Planungssystem, lokal oder extern, ohne Spiegel.
- **Parallele Agents kommen sich in die Quere.** Git-Arbeit läuft mit geprüftem Zustand, eigenen Worktrees
  und sauberen Commits.
- **Sensibles landet im Repo.** Eine konfigurierbare Schutzprüfung erkennt Secrets und personenbezogene
  Daten vor dem Commit.

## Grundsätze

- Was im Repo steht, beschreibt die Realität des Nutzers. Nutzer- und Projektvorgaben haben Vorrang.
- Regeln und Sessionkontext wirken passiv; Werkzeuge und Arbeitsschleifen starten nur auf Aufruf.
- Qatlas erklärt und ordnet, entscheidet aber nicht für den Nutzer.

## Wo Qatlas Dinge ablegt

| Ort | Inhalt |
|---|---|
| `.qatlas-project/` im Repo | Projektzustand: README als Einstieg, Entscheidungen, Konventionen, Wissen, Memory, Backlog-Wegweiser sowie `zone-import/` und `zone-export/` als flüchtige Puffer |
| `.qatlas/plugins/` im Repo | Projektkonfiguration und Prüfstand der Plugin-Updates |
| `~/qatlas/` | Nutzereigene Bibliothek mit globaler Arbeitsvereinbarung in `AGENTS.qatlas.md` |
| `~/.qatlas/` | Technischer Zustand wie globale Konfiguration, Statusline und Worktrees |

`AGENTS.md` im Repo bleibt die native Projektanweisung und enthält nur Zweck und projektspezifische Regeln.
