---
description: >
  Qatlas in einem Projekt einrichten: Git-Repo, Projektanweisungen, README, Projektzustand, Nutzerbibliothek
  und Ignore-Regeln ohne Rückfrage anlegen, ohne Vorhandenes zu ersetzen.
---

# Qatlas einrichten

Richte Qatlas ohne Rückfrage ein und halte die Übergabe kurz. Beschreibe weder Hook-Abläufe noch die internen
Prüfungen des Skripts.

## Ausführen

`<plugin-root>` ist die im Sessionkontext genannte `QATLAS PLUGIN ROOT`, sonst der Ordner drei Ebenen über
dieser `playbook-init.md`.

```text
node <plugin-root>/scripts/qatlas-init.js
```

Fehlt Node, nenne es als einzigen Blocker, verweise auf [nodejs.org](https://nodejs.org) und stoppe. Unter
Windows kann ein frisch installiertes Node ein neues Terminal brauchen.

## Neue Dateien anpassen

Dateien, die das Skript neu angelegt hat, sind der eigene Text des Nutzers und bekommen seine Sprache:
`AGENTS.md` folgt der Sprache der vorhandenen Dokumentation des Repos, sonst der Gesprächssprache;
`~/qatlas/AGENTS.qatlas.md` und `~/qatlas/README.md` folgen der Gesprächssprache. Übersetze eine solche Datei
bei Bedarf vollständig und behalte ihre Struktur. Die Seeds unter `.qatlas-project/` bleiben, wie sie sind.

Ergänze darüber hinaus nichts und stelle dazu keine Fragen. `AGENTS.md` wächst mit dem Projekt: Eine
reservierte Datei des Wissensraums bekommt ihre Zeile unter `Projektwissen`, sobald sie mit ihrem ersten
Eintrag entsteht.

## Übergabe

Nenne nur, was angelegt wurde, und jeden Punkt unter `PROBLEMS`. Nach der ersten Einrichtung genügen diese
Orientierungspunkte:

- `AGENTS.md` trägt die Projektanweisungen und ist der Einstieg in `.qatlas-project/`; `CLAUDE.md` bindet sie
  für Claude ein. `README.md` ist der kompakte Projektkopf und wächst mit dem Projekt.
- `.qatlas-project/` trägt den Wegweiser zum maßgeblichen Planungssystem, die beiden unversionierten Zonen
  `zone-import/` für Rohmaterial und `zone-export/` für verlangte Lieferergebnisse und, sofern die
  Konfiguration Repo-Memory nicht abschaltet, den Memory-Index. Seine reservierten Dateien `CONVENTIONS.md`,
  `ARCHITECTURE.md`, `TESTING.md` und `CONTRIBUTING.md` sowie seine Ordner entstehen mit ihrem ersten
  Eintrag. Fachinhalte bleiben an ihren vorhandenen maßgeblichen Orten; ein Scope bekommt neben seiner
  README nur für eigene dauerhafte Besonderheiten eine optionale `FRAMEWORK.md`.
- `.qatlas/plugins/config.json` ist die optionale versionierte Projektkonfiguration.
- `~/.qatlas/plugins/config.json` ist optional und enthält nur nutzerweite Abweichungen von den
  ausgelieferten Standardwerten.
- `~/qatlas/` ist die eigene Bibliothek des Nutzers. `AGENTS.qatlas.md` darin enthält die globale
  Arbeitsvereinbarung und gehört dem Nutzer ab dem Moment, in dem sie angelegt wird.

Schließe immer mit dem Hinweis auf `qatlas-help`. Gab es nichts zu tun, antworte nur mit einer Zeile in der
Gesprächssprache, dass Qatlas eingerichtet ist, samt diesem Hinweis.
