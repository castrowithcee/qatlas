---
description: >
  Read-only Diagnose eines Qatlas-Projekts: prüft Abhängigkeiten, Store, Scaffold, Ruleset und den
  repo-lokalen Update-Stand, ohne selbst zu reparieren oder zu bestätigen.
license: MIT
type: playbook
edit: locked
---

# Qatlas diagnostizieren

Diagnostiziere den aktuellen Ordner, ohne ihn zu verändern. Der Nutzer besitzt das Timing dieses Skills.

Verwende den vom Router aufgelösten `<plugin-root>` und keinen festen Installationspfad.

## Prüfen

Führe beide Befehle ohne `--apply` und ohne `ack` aus:

```sh
node <plugin-root>/scripts/qatlas-doctor.js
node <plugin-root>/scripts/qatlas-update.js status
```

Der erste Befehl prüft Node, Git, Git-Identität, optionale Git-LFS-Unterstützung, nutzerweiten Store,
Projektwissensraum samt Root-README und Größenbudget, `.gitignore` und Ruleset. Bei einer alten oder
parallelen Projektwurzel bleibt jeder schreibende Reparaturlauf gesperrt und nennt den Inventarbefehl. Der
zweite Befehl vergleicht den unter `.qatlas/plugins/updates/state.json` für dieses Repo gespeicherten
Qatlas-Prüfstand mit der installierten Qatlas-Version. Die optionalen Packs prüfen ihre eigene Version
jeweils über ihren SessionStart-Hook; leite aus dem Qatlas-Befehl keinen Gesamtstand aller Plugins ab.

Sind Update-Anweisungen offen, lies nur die ausgegebenen Dateien und prüfe ihre Punkte gegen das aktuelle
Repo. Vorhandene Repo-Dateien sind primär. Berichte, ob und was anwendbar ist, aber bestätige den Prüfstand
nicht im Diagnose-Lauf. Ist etwas anwendbar, nenne pro Punkt knapp den konkreten Befund, die vorgeschlagene
Änderung und ihre praktische Folge oder ihren Grund. Eine bloße Liste aus Dateinamen, Mengen oder
Schlagwörtern reicht nicht. Erst wenn der Nutzer danach ausdrücklich über vollständige, teilweise oder keine
Übernahme entscheidet, darfst du Änderungen und `ack` ausführen.

## Berichten

Fasse Befunde nach Priorität zusammen: Blocker, fehlende Projektbestandteile, Hinweise und Update-Stand.
Erfinde keine Reparatur und melde nicht pauschal Drift, nur weil Plugin-Vorlage und vorhandene Repo-Datei
inhaltlich verschieden sind.

Will der Nutzer Fehlendes ergänzen, verwende anschließend `qatlas setup` oder führe den Doctor nach
der Freigabe mit `--apply` aus. Beide Verfahren kopieren nur fehlende Dateien und ergänzen `.gitignore`.
Bestätige Update-Stände niemals als Reparatur eines ungeprüften Befunds.
