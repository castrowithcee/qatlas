---
description: >
  Qatlas in einem Projekt einrichten, ohne vorhandene Projektdateien zu ersetzen oder weitere
  Verwaltungs- und Arbeitsmodi zu starten.
type: playbook
edit: locked
license: MIT
---

# Qatlas einrichten

Richte Qatlas ein und halte die sichtbare Übergabe kurz. Beschreibe weder die Hook-Abläufe noch die
internen Prüfungen des Scripts.

## Node prüfen

Führe `node --version` aus. Scheitert der Aufruf, nenne Node als einzigen Blocker, verweise auf
[nodejs.org](https://nodejs.org) und stoppe. Unter Windows braucht ein neu installiertes Node gegebenenfalls
ein neues Terminal. Schließe auch dann mit `Mehr: qatlas-help`.

## Projekt einrichten

`<plugin-root>` ist der im Session-Kontext genannte `QATLAS PLUGIN ROOT`, andernfalls der Ordner drei
Ebenen über dieser `setup.md`.

```text
node <plugin-root>/scripts/qatlas-doctor.js --apply
```

Nutze den Output als Befund. Wiederhole nicht, was geprüft wurde, und nenne nichts, das bereits vorhanden
war. Das Script darf vorhandene Projektdateien nicht ersetzen.

Hat Doctor `AGENTS.md` neu aus `scaffold/agents-template.md` angelegt, konkretisiere sie vor der Übergabe:

1. Ermittle Repo-Name und Zweck aus Verzeichnis, README, Manifesten und vorhandenem Inhalt.
2. Ersetze die beiden Platzhalter durch konkrete Aussagen. Entferne keinen sicheren Standard.
3. Ergänze nur tatsächlich bekannte projektspezifische Grenzen. Frage nach Sichtbarkeit, Scope oder
   Agentenrolle ausschließlich dann, wenn die Antwort eine anstehende Handlung wesentlich verändert.
4. Lass keine Platzhalter oder Einrichtungs-Kommentare zurück.

Eine bereits vorhandene `AGENTS.md` gehört dem Nutzer und wird von diesem Verfahren nicht umgeschrieben.

## Git klären

Meldet Doctor ein fehlendes Git-Repo, frage kurz, ob du `git init` ausführen sollst. Handle erst nach der
Antwort.

Bei Zustimmung:

1. Führe `git init` aus.
2. Lies `user.name`, `user.email` und `init.defaultBranch` mit `git config --global --get <schlüssel>`.
3. Nenne die vorhandenen globalen Werte, die Git für das Repo beziehungsweise künftige Commits verwendet.
   Schreibe sie nicht zusätzlich in die lokale Config.
4. Fehlen Name oder E-Mail-Adresse, erfinde nichts und ändere die globale Config nicht ohne gesonderte
   Zustimmung. Melde den fehlenden Wert knapp.

## Übergabe

Fasse nur tatsächlich Angelegtes und offene Blocker zusammen. Bei der ersten Einrichtung genügen diese
Orientierungspunkte:

- `AGENTS.md` trägt die Projektanweisungen; `CLAUDE.md` bindet sie für Claude ein.
- `__qatlas__/` trägt den Wegweiser zum maßgeblichen Planungssystem, Memory und die beiden Zonen.
- `~/.qatlas/` trägt nutzerweite Einstellungen und die von Qatlas verwaltete `rules/RULESET.md`.

Schließe immer mit `Mehr: qatlas-help`. War nichts zu tun, antworte nur:

```text
Qatlas ist eingerichtet. Mehr: qatlas-help
```
