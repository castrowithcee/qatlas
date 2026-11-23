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
`AGENTS.md` folgt der Sprache der vorhandenen Dokumentation des Repos, sonst der Gesprächssprache.
`~/qatlas/AGENTS.qatlas.md` und `~/qatlas/README.md` folgen der Gesprächssprache. Übersetze eine solche Datei
bei Bedarf vollständig und behalte ihre Struktur. Die Seeds unter `.qatlas-brain/` bleiben, wie sie sind.

Ergänze darüber hinaus nichts und stelle dazu keine Fragen. `AGENTS.md` wächst mit dem Projekt: Eine
reservierte Datei des Wissensraums bekommt ihre Zeile unter `Projektwissen`, sobald sie mit ihrem ersten
Eintrag entsteht.

## Planungssystem

Hat das Skript `BACKLOG.md` neu angelegt und nennen die globale Arbeitsvereinbarung, eine ihrer
Lesebedingungen oder die Projektanweisungen eine Vorgabe zum Planungssystem, binde das Projekt nach
[der Backlog-Norm](../../qatlas-core-backlog/SKILL.md) daran. Nur dieser Schritt braucht die Zustimmung des
Nutzers. Ohne Vorgabe bleibt der lokale Backlog, den `BACKLOG.md` schon bindet.

## Übergabe

Nenne nur, was angelegt wurde, und jeden Punkt unter `PROBLEMS`. Nach der ersten Einrichtung genügen diese
Orientierungspunkte:

- `AGENTS.md` trägt die Projektanweisungen und ist der Einstieg in `.qatlas-brain/`. `CLAUDE.md` bindet sie
  für Claude ein. `README.md` gehört den Lesern des Repos. Qatlas pflegt sie nicht.
- `.qatlas-brain/` trägt den Wegweiser zum maßgeblichen Planungssystem, die unversionierte Zone
  `zone-import/` für Rohmaterial und, sofern die Konfiguration Repo-Memory nicht abschaltet, den
  Memory-Index. Seine reservierten Dateien `PROJECT.md`,
  `CONVENTIONS.md`, `ARCHITECTURE.md`, `TESTING.md` und `CONTRIBUTING.md` sowie seine Ordner entstehen mit
  ihrem ersten Eintrag. Fachinhalte bleiben an ihren vorhandenen maßgeblichen Orten. Ein Scope bekommt neben seiner
  README nur für eigene dauerhafte Besonderheiten eine optionale `FRAMEWORK.md`.
- `.qatlas/plugins/config.json` ist die optionale versionierte Projektkonfiguration.
- `~/.qatlas/plugins/config.json` ist optional und enthält nur nutzerweite Abweichungen von den
  ausgelieferten Standardwerten.
- `~/qatlas/` ist die eigene Bibliothek des Nutzers. `AGENTS.qatlas.md` darin enthält die globale
  Arbeitsvereinbarung und gehört dem Nutzer ab dem Moment, in dem sie angelegt wird.

Schließe immer mit dem Hinweis auf `qatlas-help`. Gab es nichts zu tun, antworte nur mit einer Zeile in der
Gesprächssprache, dass Qatlas eingerichtet ist, samt diesem Hinweis.
