---
description: >
  Einstellungen von Qatlas: Orte der Konfiguration, Vererbung, Schlüssel und ihre Wirkung.
type: meta
edit: locked
license: MIT
---

# Konfiguration

| Datei | Zweck |
|---|---|
| `~/.qatlas/plugins/config.yaml` | Globale Einstellungen für alle Projekte |
| `<repo>/.qatlas/plugins/config.yaml` | Projektwerte; ein gesetzter Wert überschreibt den globalen, ein fehlender erbt |
| `~/.qatlas/plugins/statusline.yaml` | Darstellung der Claude-Statusline |
| `~/.qatlas/plugins/orchestra.yaml` | Modelle und Effort-Stufen für `qatlas run` |

## Schlüssel in `config.yaml`

| Schlüssel | Ebene | Wirkung |
|---|---|---|
| `session-start.enabled` | global | Schaltet den passiven Qatlas-Kontext beim Sessionstart |
| `brains.qatlas.enabled` | global, Projekt | Schaltet den Wegweiser auf die Bibliothek `~/qatlas/` |
| `brains.project` | Projekt | Nennt zusätzliche projektbezogene Quellen mit `paths` und `description` |
| `protection.enabled` | global, Projekt | Schaltet die Schutzprüfung ganz ab oder an |
| `protection.secrets` | global, Projekt | `block`, `ask`, `warn` oder `allow` für Secrets vor dem Commit |
| `protection.personal-data` | global, Projekt | Dieselben Werte für personenbezogene Daten |

Standard ist `secrets: block` und `personal-data: ask`. `block` verhindert den Schritt, `ask` fragt vorher
nach, `warn` meldet nur, `allow` prüft nicht. Ein bestandener Check bleibt still. Ob ein Repo öffentlich
oder privat ist, leitet Qatlas nicht ab; diese Absicht drückt die Projektkonfiguration aus.

## Freigaben der Schutzprüfung

Ein vom Nutzer bestätigter Fehlalarm bei `personal-data` lässt sich dauerhaft freigeben, damit ihn spätere
Commits nicht erneut melden. Die Freigaben liegen versioniert und nur projektlokal in
`<repo>/.qatlas/plugins/protection-allow.yaml`; sie sind kein Schlüssel der `config.yaml`. Sie wirken nur
bei `personal-data` mit `ask` oder `warn`; Secrets und `block` lassen sich nie freigeben, geänderter Inhalt
wird wieder gemeldet. Die Datei enthält nur Kennungen, keinen Klartext. Einen Eintrag legt
`node <plugin-root>/scripts/qatlas-protection-check.js --target <repo-root> --allow <kennung>` an, die
Kennung nennt der Befund in eckigen Klammern. Das Format steht im Kopf des Skripts.

Zugangsdaten gehören nie in eine `config.yaml`. Eine kommentierte Vorlage liegt im Plugin unter
`store/config/config.example.yaml`.
