---
description: >
  Vollständige, vor schreibender Arbeit unter __qatlas__/ geladene Rule-Referenz für Funktionsdateien,
  Funktionsordner, Zonen, Versionierung und den Schutz vorhandener Nutzerdateien.
license: MIT
type: rule
edit: locked
---

# Vollständiger Scaffold-Vertrag

`__qatlas__/` ist Qatlas' versionierte, projekttypneutrale Zustands- und Arbeitsschicht. Der Agent
pflegt diese Ebene. Sie reist grundsätzlich mit dem Repo; nur die beiden Zonen bleiben unversioniert. Eine
Nutzerentscheidung darf das gesamte Scaffold lokal gitignorieren. Seine README erklärt den Aufbau,
konkrete Verfahren leben in den zuständigen Skills. Vorhandene Nutzerdateien werden nie pauschal ersetzt.

## Funktionsdateien

- `FRAMEWORK.md`: normativer Rahmen eines Scopes, `type: meta`, `edit: locked`.
- `INDEX.md`: lebender Index oder Roster, `type: meta`, `edit: shared`.
- `README.md`: struktureller Kopf für Menschen, ohne Enum-`type`.
- `MEMORY.md`: Index des Repo-Memorys.
- `BACKLOG.md`: beim Sessionstart geladener Wegweiser zum maßgeblichen lokalen oder externen
  Planungssystem.
- `HISTORY.md`: fortlaufender Verlauf eines Scopes, `type: meta`, `edit: shared`.

Diese Namen sind exklusiv und tragen kein Präfix. Lies vorhandene `framework.md` und `index.md`, erzeuge
aber nur die kanonische Großschreibung. Sind beide Formen vorhanden, kläre ihre Zuständigkeit.

## Funktionsordner

- `backlog/`: Routing zum maßgeblichen Planungssystem und, wenn lokal gewählt, Tasks, optionale Projekte
  und `done/`. Seine eigene Rule und sein vollständiger Vertrag bestimmen Binding, Aufbau und Lebenszyklus.
- `memory/`: dauerhafte, nicht anderweitig ableitbare Hinweise. `MEMORY.md` wird beim Sessionstart direkt
  injiziert; öffne daraus nur aufgabenrelevante Dateien, prüfe ihre Aussagen gegen den aktuellen Stand und
  aktualisiere vorhandene Memories statt sie zu duplizieren. Neue Memories entstehen auch auf ausdrückliche
  Bitte des Nutzers, tragen `type: memory` und `edit: shared` und erhalten genau eine Indexzeile.
- `docs/`: Projektwissen für den Agenten, etwa Bauweise, Gründe und Hintergrund vor dem Handeln. Der Ordner
  entsteht mit seiner ersten Datei. Ein `docs/` am Repo-Root richtet sich dagegen an Menschen.
- `templates/`: optionale, versionierte Vorlagenbibliothek des Nutzers. Qatlas legt dort nichts ab und
  aktualisiert nichts. Vorlagen tragen beschreibende Namen, nie reservierte Funktionsnamen.
- `updates/`: lokaler Stand der projektbezogenen Plugin-Prüfung. Das zuständige Update-Verfahren verwaltet
  ihn; dieser Vertrag definiert keine Migrationslogik.
- `zone-import/`: gitignorierter Puffer für nicht vertrauenswürdiges Rohmaterial. Lege dauerhaften Inhalt
  richtig ab und verschiebe nur erfolgreich verarbeitete Originale nach `processed/<yyyy-mm>/`.
- `zone-export/`: gitignorierter Puffer ausschließlich für ausdrücklich angeforderte Lieferobjekte. Lege
  dort nie von selbst etwas ab.

Die beiden Zonen sind stets vorhanden. Ein Original zu archivieren ist Routine, eine Zone zu leeren ist
eine Löschung. Große oder veränderliche Binärdateien gehören in einen Dateispeicher oder Git LFS, nicht
dauerhaft in eine Zone. Qatlas' aktuelle Vorlagen liegen im versionsgebundenen Plugin-Store.
