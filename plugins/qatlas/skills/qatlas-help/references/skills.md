---
description: >
  Überblick über ausdrückliche Einstiege, automatische Kern-Skills und optionale Packs von Qatlas.
type: meta
edit: locked
license: MIT
---

# Skills

Qatlas unterscheidet Skills, die nur der Nutzer startet, von solchen, die der Agent bei passendem Anlass
selbst lädt.

## Ausdrückliche Einstiege

- **`qatlas`:** der Arbeitsloop mit `goal`, `shape`, `run` und `review`.
- **`qatlas-core`:** seltene Verwaltung wie Einrichtung, Diagnose, Statusline und Wechsel des
  Planungssystems.
- **`qatlas-work`:** Einzelverfahren außerhalb des Loops, etwa Git-Worktrees verwalten.
- **`qatlas-mode`:** Zusammenarbeitsmodi für den Rest der Session, etwa für Leser mit ADHD.
- **`qatlas-help`:** dieses Handbuch.

## Automatische Kern-Skills

| Skill | Greift, wenn | Wozu |
|---|---|---|
| `qatlas-core-navigation` | ein Auftrag Kontext aus dem Repo braucht | Findet Wissen gezielt über Einstiege, Lesebedingungen und Frontmatter |
| `qatlas-core-filing` | Dateien entstehen, sich ändern, wandern oder importiert werden | Bestimmt Ort, Namen, Kennung und Frontmatter und hält Verweise konsistent |
| `qatlas-core-backlog` | Planungs- oder Taskarbeit ansteht | Arbeitet im einzigen maßgeblichen Planungssystem nach dessen Regeln |
| `qatlas-core-git` | in einem Repo gearbeitet, committet oder gepusht wird | Prüft Zustand, schützt parallele Arbeit und hält Commits sauber |

Jeder Kern-Skill lädt zuerst nur seinen kurzen Kern und liest Details erst für die konkrete Operation.

## Optionale Packs

- **`qatlas-dev`:** Methode für Codearbeit nach dem Prinzip „die einfachste Lösung, die vollständig
  funktioniert“; `qatlas-dev-review` prüft auf Over-Engineering.
- **`qatlas-council`:** unabhängige Subagents beraten zu Ideen, Vorhaben und mit `arch` zu technischer
  Architektur.

Packs ergänzen Methode, besitzen aber weder Gespräch noch Planungssystem.
