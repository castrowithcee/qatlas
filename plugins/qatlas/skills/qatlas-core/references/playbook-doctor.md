---
description: >
  Rein lesende Diagnose eines Qatlas-Projekts: prüft Git, Konfiguration, Projektanweisungen, Projektzustand
  und Nutzer-Library, ohne etwas zu ändern.
---

# Qatlas diagnostizieren

Diagnostiziere den aktuellen Ordner, ohne ihn zu ändern. Den Zeitpunkt dieses Skills bestimmt der Nutzer.

Verwende das vom Router aufgelöste `<plugin-root>` und keinen festen Installationspfad.

```sh
node <plugin-root>/scripts/qatlas-doctor.js
```

Den Block `run` der Konfiguration prüft das Skript nur auf Grundstruktur. Ob Modell und Effort im
aktuellen Host verfügbar sind, prüft erst `qatlas run`.

## Planungssystem

Prüfe `.qatlas-brain/backlog/BACKLOG.md` lesend gegen [die
Backlog-Norm](../../qatlas-core-backlog/SKILL.md), die Bindung an ein anderes System als den lokalen Backlog
zusätzlich gegen deren Bindungsvorlage. Melde als Hinweis:

- jede fehlende Antwort, jeden Status außerhalb der Norm und jeden nicht eindeutig erkennbaren Status,
- gewachsenen Inhalt: alles über eine Zeile je Antwort hinaus, etwa Begründung, Anleitung, Anbieterwissen,
  Verlauf oder einzelne Tasks.

## Bericht

Fasse die Befunde nach Priorität zusammen: Blocker, fehlende Projektbestandteile, Hinweise. Erfinde keine
Reparatur und melde nicht pauschal Drift, nur weil sich Plugin-Vorlage und vorhandene Repo-Datei inhaltlich
unterscheiden. Fehlende Bestandteile ergänzt `qatlas-core init`, ohne Vorhandenes zu ersetzen.
