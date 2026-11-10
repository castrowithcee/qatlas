---
description: >
  Rein lesende Diagnose eines Qatlas-Projekts: prüft Git, Konfiguration, Projektanweisungen, Projektzustand
  und Nutzerbibliothek, ohne etwas zu ändern.
---

# Qatlas diagnostizieren

Diagnostiziere den aktuellen Ordner, ohne ihn zu ändern. Den Zeitpunkt dieses Skills bestimmt der Nutzer.

Verwende das vom Router aufgelöste `<plugin-root>` und keinen festen Installationspfad.

```sh
node <plugin-root>/scripts/qatlas-doctor.js
```

Den Block `team` der Konfiguration prüft das Skript nur auf Grundstruktur; ob Modell und Effort im
aktuellen Host verfügbar sind, prüft erst `qatlas team`.

## Bericht

Fasse die Befunde nach Priorität zusammen: Blocker, fehlende Projektbestandteile, Hinweise. Erfinde keine
Reparatur und melde nicht pauschal Drift, nur weil sich Plugin-Vorlage und vorhandene Repo-Datei inhaltlich
unterscheiden. Fehlende Bestandteile ergänzt `qatlas-core init`, ohne Vorhandenes zu ersetzen.
