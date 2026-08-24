---
description: >
  Automatische Migrationen und verbleibende Prüfpunkte für bestehende Qatlas- und Callbell-Zustände.
license: MIT
type: rule
edit: locked
---

# Pluginzustand migrieren

## Automatisch migriert

- Beim ersten Sessionstart übernimmt Qatlas eindeutige `settings.json`, `statusline.json` und
  `telegram.json` aus `~/.callbell/` und den bisherigen flachen Orten unter `~/.qatlas/` in die getrennten
  Dateien `config.yaml`, `statusline.yaml` und `credentials.yaml` unter `~/.qatlas/plugins/`.
- Ein bereits in `config.yaml` liegender Abschnitt `statusline` wird in die eigene `statusline.yaml`
  ausgelagert. Widersprechen sich beide Orte, bleibt alles unverändert und der Befund wird gemeldet.
- Vor jeder Änderung entsteht für nicht sensible Quelldateien ein Backup unter
  `~/.qatlas/state/migrations/backups/`. Credentialquellen werden nicht in das Backup kopiert; sie bleiben
  nach erfolgreicher Übernahme bestehen und werden für eine ausdrückliche Bereinigung genannt.
- Eine bereits auf den alten Qatlas- oder Callbell-Renderer verweisende Claude-Statusline wird auf Renderer
  und Runtime unter `~/.qatlas/plugins/` umgestellt. Andere Statusline-Befehle bleiben unangetastet.
- Der nicht mehr verwendete Konfigurationsabschnitt `diagnostics.mute` wird bei der Migration entfernt.

## Zu beachten

- Existiert im aktuellen Repo `__callbell__/` oder `__qatlas__/`, migriere den vorhandenen Inhalt nach
  `.qatlas/project/`. Prüfe vorher den Git-Zustand. Bei mehreren vorhandenen Scaffolds vergleiche die
  Inhalte und hole die Entscheidung des Nutzers ein; überschreibe oder vereinige nichts pauschal.
- Ergänze die aktuellen Regeln für `.qatlas/project/zone-import/`, `.qatlas/project/zone-export/` und
  `.qatlas/local/` in `.gitignore` und entferne ersetzte Legacy-Regeln erst nach der Inhaltsmigration.
- Enthält `~/.callbell/worktrees/` oder `~/.qatlas/worktrees/` registrierte Worktrees, prüfe zuerst
  `git worktree list` in den betroffenen Repos. Verschiebe jeden bestehenden Worktree mit
  `git worktree move` nach `~/.qatlas/state/worktrees/`; verschiebe die Ordner nie direkt.
- Prüfe den vollständigen Projekt-Diff. Commit und Push bleiben getrennte, ausdrückliche Nutzeraufträge.
