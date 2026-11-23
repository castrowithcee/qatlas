---
description: >
  Qatlas-Einstellungen: Orte der Konfiguration, Vererbung, Blöcke, Schlüssel und ihre Wirkung.
---

# Konfiguration

Qatlas liefert jeden Standardwert mit. Es gibt zwei optionale JSON-Dateien. Jede enthält nur, was von den
Standardwerten abweicht, und Init legt keine an. Eine fehlende Datei ist der Normalfall.

| Datei | Blöcke | Zweck |
|---|---|---|
| `~/.qatlas/plugins/config.json` | `protection`, `memory`, `statusline`, `run`, `backlog` | Nutzerweite Einstellungen für alle Projekte |
| `<repo>/.qatlas/plugins/config.json` | `protection`, `memory` | Versionierte Projektwerte: Ein gesetzter Wert überschreibt den nutzerweiten, ein fehlender erbt |

Jede Datei trägt `"format": 1`. Ohne diese Angabe ist sie ungültig. Ein Block in der falschen Datei und ein
unbekannter Schlüssel werden ignoriert. Doctor meldet beide. Eine ungültige Datei oder ein ungültiger Wert in
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
| `protection.secrets` | beide | `block` oder `allow` für Secrets vor dem Commit, Standard `block` |
| `protection.personal-data` | beide | `block`, `ask`, `warn` oder `allow` für personenbezogene Daten, Standard `ask` |
| `protection.allow` | beide | Freigaben bestätigter Fehlalarme |
| `memory.enable` | beide | `false` schaltet das Repo-Memory unter `.qatlas-brain/memory/` ab, Standard `true` |

`block` verhindert den Schritt, `ask` fragt vorher, `warn` meldet nur, `allow` prüft nicht. Eine bestandene
Prüfung bleibt stumm. Ob ein Repo öffentlich oder privat ist, leitet Qatlas nicht ab. Die Projektkonfiguration
drückt diese Absicht aus.

Ein vom Nutzer bestätigter Fehlalarm für `personal-data` kann dauerhaft freigegeben werden, damit spätere
Commits ihn nicht erneut melden. Sie gilt nur für `personal-data` mit `ask` oder `warn`. Secrets und `block`
lassen sich nie freigeben, und geänderter Inhalt wird erneut gemeldet. Ein Eintrag enthält nur Kennungen,
keinen Klartext. Ihn legt
`node <plugin-root>/scripts/qatlas-protection-check.js --target <repo-root> --allow <kennung>` in der
Projektdatei an. Dort gilt er erst, wenn die Datei mit ihm gestagt ist, und ist so im Commit sichtbar. Mit
zusätzlich `--local` landet er in der Nutzerdatei, gilt sofort und nur auf diesem Rechner. Das ist der Weg für
Repos, die keine Qatlas-Dateien aufnehmen. Die Kennung nennt der Befund in eckigen Klammern.

## `backlog`

Der Block gilt nur nutzerweit und ist die eigene Vorgabe für jeden neuen lokalen Backlog. Jeder der vier
Schlüssel `status`, `type`, `labels` und `custom` ersetzt die ausgelieferte Auswahl dieses Felds, ein
fehlender behält sie. Ein begonnener Backlog trägt seine Auswahl selbst und liest den Block nicht mehr.

```json
{
  "format": 1,
  "backlog": {
    "type": [{ "name": "task" }, { "name": "bug" }, { "name": "idea", "work": false }],
    "labels": ["frontend", "backend"],
    "custom": { "priority": ["high", "normal", "low"], "kunde": null }
  }
}
```

- `status` ist eine Liste aus `name` und `means`, einem Status der Backlog-Norm oder `null`. Jeder Status der
  Norm braucht mindestens einen Wert. Stehen mehrere dafür, schreibt Qatlas den ersten.
- `type` ist eine Liste aus `name` und optional `"work": false` für einen Typ ohne Status, etwa eine Idee.
- `custom` nennt eigene Felder: mit einer Liste als Auswahl, mit `null` für freien Text.

Zugangsdaten gehören nie in eine `config.json`.
