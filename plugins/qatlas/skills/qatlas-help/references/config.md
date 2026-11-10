---
description: >
  Qatlas-Einstellungen: Orte der Konfiguration, Vererbung, Blöcke, Schlüssel und ihre Wirkung.
---

# Konfiguration

Qatlas liefert jeden Standardwert mit. Es gibt zwei optionale JSON-Dateien; jede enthält nur, was von den
Standardwerten abweicht, und Init legt keine an. Eine fehlende Datei ist der Normalfall.

| Datei | Blöcke | Zweck |
|---|---|---|
| `~/.qatlas/plugins/config.json` | `protection`, `memory`, `statusline`, `team` | Nutzerweite Einstellungen für alle Projekte |
| `<repo>/.qatlas/plugins/config.json` | `protection`, `memory` | Versionierte Projektwerte; ein gesetzter Wert überschreibt den nutzerweiten, ein fehlender erbt |

Jede Datei trägt `"format": 1`; ohne diese Angabe ist sie ungültig. Ein Block in der falschen Datei und ein
unbekannter Schlüssel werden ignoriert; Doctor meldet beide. Eine ungültige Datei oder ein ungültiger Wert in
`protection` oder `memory` macht die Schutzprüfung vor dem Commit unmöglich (Exit 3), bis die Datei repariert
ist. Ist die Nutzerdatei kein gültiges JSON oder fehlt ihr `"format": 1`, stoppt zudem das Statusline-Setup.

```json
{
  "format": 1,
  "protection": { "personal-data": "warn" },
  "memory": { "enable": false }
}
```

## `protection` und `memory`

| Schlüssel | Datei | Wirkung |
|---|---|---|
| `protection.secrets` | beide | `block` oder `allow` für Secrets vor dem Commit; Standard `block` |
| `protection.personal-data` | beide | `block`, `ask`, `warn` oder `allow` für personenbezogene Daten; Standard `ask` |
| `protection.allow` | Projekt | Freigaben bestätigter Fehlalarme |
| `memory.enable` | beide | `false` schaltet das Repo-Memory unter `.qatlas-project/memory/` ab; Standard `true` |

`block` verhindert den Schritt, `ask` fragt vorher, `warn` meldet nur, `allow` prüft nicht. Eine bestandene
Prüfung bleibt stumm. Ob ein Repo öffentlich oder privat ist, leitet Qatlas nicht ab; die Projektkonfiguration
drückt diese Absicht aus.

Ein vom Nutzer bestätigter Fehlalarm für `personal-data` kann dauerhaft freigegeben werden, damit spätere
Commits ihn nicht erneut melden. Die Freigabe gilt erst, wenn die Projektdatei mit ihr gestagt ist, und nur
für `personal-data` mit `ask` oder `warn`; Secrets und `block` lassen sich nie freigeben, und geänderter Inhalt
wird erneut gemeldet. Ein Eintrag enthält nur Kennungen, keinen Klartext. Ihn legt
`node <plugin-root>/scripts/qatlas-protection-check.js --target <repo-root> --allow <kennung>` an; die
Kennung nennt der Befund in eckigen Klammern.

## `statusline` und `team`

Den Block `statusline` beschreibt [Statusline konfigurieren](../../qatlas-core/references/playbook-statusline.md),
den Block `team` die [Team-Konfiguration](../../qatlas/modes/team/playbook-team-config.md).

Zugangsdaten gehören nie in eine `config.json`.
