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
Ebenen über dieser `playbook-setup.md`.

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

## Run-Konfiguration einrichten

Fehlt `~/.qatlas/plugins/orchestra.yaml`, lies die kommentierte Vorlage unter
`<plugin-root>/store/config/orchestra.example.yaml`. Ermittle die für den aktuellen Host verfügbaren
Modell-IDs beziehungsweise nativen Aliase und die vom jeweiligen Modell unterstützten Effort-Stufen.
Die Vorlage schlägt für Claude Code Haiku, Sonnet und Opus für `light`, `standard` und `demanding` vor;
prüfe diese Kombinationen gegen den tatsächlich verwendeten Anbieter und übernimm sie nicht ungeprüft.
Fülle nur die Sektion des aktuellen Hosts mit konkreten Werten aus und entferne ungenutzte Host-Sektionen.
Für ein Modell ohne Effort-Unterstützung, etwa Haiku 4.5, setze `effort: null`. Zeige dem Nutzer die fertige
Fassung und frage, ob du sie als nutzereigene Datei anlegen sollst. Schreibe keine Platzhalter und ersetze
eine vorhandene Datei nie pauschal. Ohne bestätigte Modellwerte bleibt `run` bis zur späteren Einrichtung
gesperrt; das übrige Setup ist abgeschlossen.

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
- `.qatlas-project/README.md` ist der Einstieg in den repo-eigenen Projektzustand. Der Wissensraum trägt
  außerdem den Wegweiser zum maßgeblichen Planungssystem, Memory und die beiden Zonen. Fachliche Inhalte
  bleiben an ihren vorhandenen maßgeblichen Orten; ein Scope erhält nur bei eigenen dauerhaften
  Besonderheiten eine optionale `FRAMEWORK.md` neben seiner README.
- `.qatlas/plugins/` trägt technische Projektkonfiguration und den versionierten Update-Prüfstand.
- `~/.qatlas/plugins/config.yaml` trägt die nutzerweite Plugin-Konfiguration;
  `~/.qatlas/rules/RULESET.md` bleibt die von Qatlas verwaltete Regelkopie.
- `~/.qatlas/plugins/orchestra.yaml` legt nur für `qatlas run` die Modelle und Effort-Stufen fest, wenn sie
  in diesem Setup mit dem Nutzer angelegt wurde.

Schließe immer mit `Mehr: qatlas-help`. War nichts zu tun, antworte nur:

```text
Qatlas ist eingerichtet. Mehr: qatlas-help
```
