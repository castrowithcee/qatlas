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
| `<repo>/.qatlas/plugins/config.json` | `protection`, `memory` | Versionierte Projektwerte: Ein gesetzter Wert überschreibt den nutzerweiten, ein fehlender erbt. Ein geänderter Projektwert gilt für die Schutzprüfung vor dem Commit erst, wenn die Datei mit ihm gestagt ist, für den lokalen Backlog erst, wenn sie mit ihm committet ist |

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
| `protection.secrets` | beide | `block` oder `allow` für Secrets vor dem Commit, auch im lokalen Backlog, Standard `block` |
| `protection.personal-data` | beide | `block`, `ask`, `warn` oder `allow` für personenbezogene Daten, Standard `ask` |
| `protection.allow` | beide | Freigaben bestätigter Fehlalarme |
| `memory.enable` | beide | `false` schaltet das Repo-Memory unter `.qatlas-brain/memory/` ab, Standard `true` |

`block` verhindert den Schritt, `ask` fragt vorher, `warn` meldet nur, `allow` prüft nicht. Eine bestandene
Prüfung bleibt stumm. Ob ein Repo öffentlich oder privat ist, leitet Qatlas nicht ab. Die Projektkonfiguration
drückt diese Absicht aus.

Ein vom Nutzer bestätigter Fehlalarm für `personal-data` kann dauerhaft freigegeben werden, damit spätere
Commits ihn nicht erneut melden. Die Freigabe gilt nur für `personal-data` mit `ask` oder `warn`. Secrets und
`block` lassen sich nie freigeben, und geänderter Inhalt wird erneut gemeldet. Ein Eintrag enthält nur
Kennungen, keinen Klartext. In der Projektdatei ist er im Commit sichtbar, in der Nutzerdatei gilt er sofort
und nur auf diesem Rechner. Trage ihn im Ablauf
[Commit und Push](../../qatlas-core-git/references/playbook-commit.md) ein.

## `backlog`

Der Block gilt nur nutzerweit und ist die eigene Vorgabe für jeden neuen lokalen Backlog. Jeder der vier
Schlüssel `status`, `type`, `labels` und `custom` ersetzt die ausgelieferte Auswahl dieses Felds, ein
fehlender behält sie. Ein begonnener Backlog trägt seine Auswahl selbst und liest den Block nicht mehr.
Solange die Nutzerdatei ungültig ist oder der Block einen Fehler oder einen unbekannten Schlüssel enthält,
beginnt deshalb kein lokaler Backlog. Doctor meldet beides.

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
