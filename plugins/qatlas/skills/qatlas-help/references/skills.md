---
description: >
  Überblick über die expliziten Einstiegspunkte, die automatischen Core-Skills und die optionalen Packs von Qatlas.
---

# Skills

Qatlas trennt Skills, die nur der Nutzer startet, von Skills, die der Agent selbst lädt, wenn der Anlass
passt.

## Explizite Einstiegspunkte

- **`qatlas`:** die Arbeitsschleife mit `goal`, `shape`, `run` und `review`.
- **`qatlas-core`:** seltene Administration wie Einrichtung, Diagnose und Statusline.
- **`qatlas-mode`:** Zusammenarbeitsmodi für den Rest der Session, etwa für Leser mit ADHS.
- **`qatlas-help`:** dieses Handbuch.

## Automatische Core-Skills

| Skill | Gilt, wenn | Zweck |
|---|---|---|
| `qatlas-core-navigation` | eine Anfrage Kontext aus dem Repo braucht | Findet Wissen über Einstiegspunkte, Lesebedingungen und Frontmatter |
| `qatlas-core-filing` | Dateien angelegt, geändert, verschoben oder importiert werden | Setzt Ort, Name, Kennung und Frontmatter und hält Verweise konsistent |
| `qatlas-core-backlog` | Planungs- oder Taskarbeit ansteht | Arbeitet im einzigen maßgeblichen Planungssystem nach dessen Regeln und bindet oder wechselt es auf Auftrag |
| `qatlas-core-git` | in einem Repo gearbeitet wird oder Commits und Pushes anstehen | Prüft den Zustand, schützt parallele Arbeit und hält Commits sauber |
| `qatlas-core-config` | eine Einstellung oder ein Nutzermodul angesehen, geändert oder eingerichtet wird | Kennt die Konfigurationsdateien, ihre Blöcke und die Module unter `~/.qatlas/plugins/hooks/` |

Jeder Core-Skill lädt zuerst nur seinen kurzen Kern und liest Details für die konkrete Operation.

## Optionale Packs

- **`qatlas-dev`:** Methode für Codearbeit, die kleinste Änderung, die den Task vollständig löst.
  `qatlas-dev-review` prüft eine Änderung und `qatlas-dev-audit` ein ganzes Repo.
- **`qatlas-design`:** Art Direction und ein strikter Hausstil für Webseiten und App-Screens, geprüft in einem
  echten Browser.
- **`qatlas-council`:** unabhängige Subagents beraten zu Ideen und Plänen, mit `arch` auch zur technischen
  Architektur.

Packs ergänzen Methode, besitzen aber weder das Gespräch noch das Planungssystem.
