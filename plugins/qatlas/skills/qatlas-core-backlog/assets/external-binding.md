---
description: >
  Verweist auf das externe maßgebliche Planungssystem und bindet Zugang, Statusmerkmale, Reihenfolge und
  Lesepolitik ohne lokalen Spiegel.
type: meta
edit: shared
---

# Backlog

- [<projekttitel>](<kanonische-url>) - <anbieter, owner oder workspace und objekt> ist das einzige
  maßgebliche Planungssystem.

## Bindung

- **Zugang:** <werkzeug oder verbindung für lesen und schreiben, nötige laufzeitvoraussetzung, keine secrets>
- **Arbeitspakete:** <objekttyp und container, ein objekt pro task>
- **Entwürfe:** <wo unausgereifte arbeit und ideen leben>
- **Status:** `draft` = <merkmal>, `ready` = <merkmal>, `in-progress` = <merkmal>, `review` = <merkmal>,
  `waiting` = <merkmal>, `deferred` = <merkmal>. <wie ein wechsel das bisherige merkmal ersetzt>
- **Abschluss:** `done` = <merkmal und schreibschritt>, verworfen = <merkmal>, Duplikat = <merkmal>
- **Reihenfolge:** <woran erkennbar ist, welcher `ready`-task zuerst drankommt, und wo abhängigkeiten stehen>
- **Anspruch:** <woran erkennbar ist, wer einen task bearbeitet>
- **Aktueller Datensatz:** <objekt oder felder mit dem vollständigen aktuellen taskvertrag>
- **Historie:** <kanal für kommentare oder verlauf, nicht maßgeblich>
- **Lesepolitik:** <was eine übersicht liest und wann der vollständige datensatz oder die historie>
- **Lokaler Spiegel:** keiner

<!-- Nach .qatlas-brain/backlog/BACKLOG.md kopieren, alle Platzhalter ersetzen und diesen Kommentar
     entfernen. Die Datei wird in jeder Session geladen: eine Zeile je Antwort, ohne Begründung, Anleitung
     oder Anbieterwissen.
     - Ein Merkmal ist, was das System am Arbeitspaket selbst zeigt: Feld, Label, Typ, offen oder geschlossen.
     - Jeder Status ist eindeutig erkennbar. Tragen zwei dasselbe Merkmal, nenne das ausdrücklich und welcher
       von beiden beim Lesen gilt.
     - Hat das System unter ausführbaren Tasks keine Reihenfolge, schreibe „keine“.
     - Der aktuelle Datensatz bleibt ohne Historie ausführbar.
     - Nachschlagedaten, die nur beim Schreiben nötig sind, etwa Feld- oder Options-IDs, Raten- und
       Batchgrenzen, stehen in einer eigenen Datei am Ort der Wahl des Nutzers. Die betroffene Zeile verweist
       darauf mit Lesebedingung. -->
