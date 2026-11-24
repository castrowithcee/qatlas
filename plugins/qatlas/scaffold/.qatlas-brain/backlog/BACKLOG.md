---
description: >
  Dauerhaft geladener Wegweiser zum einzigen maßgeblichen Planungssystem und seine Bindung, damit jeder
  Agent dieselbe operative Autorität findet.
edit: shared
---

# Backlog

- Der lokale Backlog auf dem Branch `qatlas-backlog` im Git-Repo dieses Projekts ist das einzige
  maßgebliche Planungssystem.

## Bindung

- **Zugang:** `node <plugin-root>/scripts/qatlas-backlog.js`, nach dem Abschnitt „Lokaler Backlog“ der
  Backlog-Norm.
- **Arbeitspakete:** ein Issue pro Task.
- **Entwürfe:** Issues mit dem Status `draft`, Ideen als Issues eines Typs ohne Status.
- **Status:** das Feld `status`. Der Befehl `fields` zeigt jeden Wert und wofür er steht.
- **Abschluss:** der Status für `done`. Verworfen und Duplikat nennt der Abschlussbericht.
- **Reihenfolge:** die Reihenfolge von `list`, Abhängigkeiten im Feld `depends`.
- **Anspruch:** der Status für `in-progress`.
- **Aktueller Datensatz:** das Issue, wie `show` es zeigt.
- **Historie:** die Git-Historie des Branches, nicht maßgeblich.
- **Lesepolitik:** zur Auswahl `list`, vollständig nur gewählte Issues mit `show`.
