---
description: >
  Die Statusline des aktuellen Hosts einrichten und konfigurieren: den Qatlas-Renderer unter Claude Code, die
  native TUI-Fußzeile unter Codex CLI.
---

# Statusline konfigurieren

Konfiguriere die Statusline des Hosts, auf dem dieser Skill läuft. Bestimme den Host aus der aktuellen
Session, nie aus installierten Konfigurationsordnern. Claude Code und Codex können beide auf einem Gerät
installiert sein.

## Wann

- Nur auf direkte Bitte des Nutzers. Das erste Setup ändert die globale Nutzerkonfiguration und darf nie
  automatisch starten.
- Unter Codex ist das Ziel die CLI-TUI. Wird der Skill aus der Desktop-App oder einer IDE aufgerufen,
  konfiguriere künftige CLI-Sessions und sage deutlich, dass die Fußzeile in der aktuellen Oberfläche nicht
  erscheint.

## Plugin-Root

Verwende das vom Router aufgelöste `<plugin-root>`. Setze vor einem Skriptaufruf den echten absoluten Pfad
ein. Schreibe ihn nie fest ein, denn der Installationspfad trägt die Version.

## Claude Code

Claude Code führt einen externen Renderer aus und übergibt Session-JSON über stdin. Der Renderer wendet die
ausgelieferten Standardwerte an und liest nur die Abweichungen aus dem optionalen Block `statusline` in
`~/.qatlas/plugins/config.json`; seine stabile Kopie ist ausgelieferte Payload, die der Nutzer nie
bearbeitet.

### Einrichten

1. Führe aus: `node "<plugin-root>/scripts/qatlas-statusline-claude.js" setup`
2. Sage, dass die Zeile mit der nächsten Interaktion erscheint und eine frühere Claude-Statusline ersetzt.
3. Frage, ob das Layout passt. Schneidet der dynamische Umbruch Widgets ab oder verhält er sich im Terminal
   schlecht, setze `"layout": "fixed"` im Block `statusline`.

Das Setup kopiert Renderer und Config-Loader nach `~/.qatlas/plugins/`, legt einen früheren
`statusLine`-Eintrag der `~/.claude/settings.json` für `remove` beiseite und lässt die Einstellungen auf die
stabile Kopie mit einem Aktualisierungsintervall von 60 Sekunden zeigen. Es schreibt keine `config.json`; eine
vorhandene bleibt unverändert. Der Sessionstart erneuert die Kopie, sobald
eine neuere Plugin-Version läuft.

### Entfernen

Führe aus: `node "<plugin-root>/scripts/qatlas-statusline-claude.js" remove`

Das Skript stellt den früheren `statusLine`-Eintrag wieder her oder entfernt den Qatlas-Eintrag, löscht
Renderer- und Loader-Kopie und überlässt den Block `statusline` dem Nutzer. Ein Eintrag, der
nicht der Qatlas-Renderer ist, bleibt unverändert. Sage, dass die Änderung mit der nächsten Interaktion
sichtbar wird.

### Widgets

Ohne `widgets` im Block `statusline` erscheint jedes ausgelieferte Widget in der ausgelieferten Reihenfolge,
auch neu ausgelieferte. Ein Objekt `widgets` ist die Auswahl: Ein aufgeführtes Widget erscheint, außer es
trägt `"on": false`; fehlende Widgets bleiben aus, neu ausgelieferte ebenso. Bei `layout: wrap` bestimmt die
Reihenfolge der Einträge auch die Renderreihenfolge. Jeder Eintrag ist ein Objekt, übernimmt die
Standardwerte seines Widgets und überschreibt nur, was er selbst setzt; `"dir": {}` zeigt das Widget im
Standardaussehen.

`model` | `thinking` | `dir` | `branch` | `diff` | `out` | `context` | `cost` | `session` |
`session-reset` | `weekly` | `weekly-reset` | `method`

- Git-Widgets verschwinden außerhalb eines Repos.
- Nutzungslimits brauchen ein Abonnement und verschwinden bei API-Nutzung. `method` macht den Grund sichtbar.
- Unbekannte Widget-Namen und Einträge, die kein Objekt sind, werden ignoriert; Doctor meldet sie.

### Teile und Farben

Gestalte ein Widget über seine Teile, je ein Objekt mit `fg`, `bg` und `bold` im Widget-Eintrag, etwa
`"cost": { "value": { "fg": "green" } }`:

- `label`: jedes Widget
- `value`: jedes Widget außer `diff`; bei `context`, `session` und `weekly` der Prozentwert
- `add`, `del`, `sync`: `diff`
- `bar`: `context`, `session`, `weekly`; `suffix`: `context`

Was ein Teil nicht setzt, nimmt er für `label` aus `defaults.label`, für jeden anderen Teil aus
`defaults.value`; ist auch das leer, bleibt die Terminalfarbe. Ein leerer String setzt keine eigene Farbe,
`"bold": true` am Teil oder im Standard macht fett. `"label": { "on": false }` blendet das Label eines Widgets
aus, `"defaults": { "label": { "on": false } }` jedes Label, das sein Widget nicht wieder einschaltet. Der
Separator trägt dieselben Felder unter `separator`; Standard ist `"fg": "#aee414"` mit `"bold": true`.

`fg` und `bg` akzeptieren `#rgb`, `#rrggbb`, `rgb(r,g,b)` sowie `dim`, `cyan`, `green`, `yellow`, `blue`,
`magenta`, `orange`, `red`, `diffgreen` und `diffred`; `dim` wirkt nur als `fg`. `NO_COLOR` erzwingt reinen
Text.

Die Standardwerte stehen in `<plugin-root>/scripts/runtime/config-loader.js`; schreibe nur Abweichungen davon
in den Block. Die ausgelieferte Palette passt zu dunklen Terminals. Für einen hellen Hintergrund setze
dunklere Farben unter `defaults` und je Widget; ein neues Setup ist unnötig. Ersetze eine vorhandene
Widget-Auswahl nur mit Zustimmung des Nutzers.

### Balken

`bar`, `value` und `suffix` von `context`, `session` und `weekly` nehmen die Schwellenfarbe, sofern der Teil
kein eigenes `fg` setzt. Die Schwellen stehen unter `widgets.<widget>.bar.thresholds` als Liste von
`{ "from": <Prozent>, "fg": <Farbe> }`; die höchste erreichte gewinnt. Eigene `thresholds` ersetzen die
Standardliste des Widgets vollständig. Der Kontextbalken misst das aktive Modellfenster, die Nutzungsbalken
ihre Limits.

### Argumente und Layout

Bei Wünschen wie `disable out, weekly-reset`, `enable method`, `put cost first`, `make cost green`,
`dim all labels` oder `hide all labels` schreibe nur die Abweichung in den Block `statusline` von
`~/.qatlas/plugins/config.json` und lege die Datei mit `"format": 1` an, falls sie fehlt. Schalte `on` um,
verschiebe einen Widget-Eintrag oder ändere den Stil seiner Teile. Führe das Setup nicht erneut aus.

- `wrap` ist der Standard. Widgets fließen in der Reihenfolge von `widgets` von links nach rechts und
  umbrechen bei Bedarf.
- `fixed` nutzt vier feste Zeilen: model/thinking/dir; branch/diff; out/context/cost; Limits und method. Die
  Reihenfolge in `widgets` gilt dort nicht.
- `separator.text` setzt den Text zwischen den Widgets.

## Codex CLI

Codex besitzt den Renderer und feste native Felder. Die Quelle ist die Tabelle `[tui]` in
`$CODEX_HOME/config.toml`, ersatzweise `~/.codex/config.toml`. Lege keinen Codex-Renderer an und spiegle
diese Wahl nicht in den Block `statusline`.

### Einrichten

Führe aus: `node "<plugin-root>/scripts/qatlas-statusline-codex.js" setup`

Das Skript ersetzt nur `tui.status_line` und `tui.status_line_use_colors`, behält alle anderen Werte und
Kommentare und weist doppelte oder gemischte TOML-Definitionen zurück. Das Qatlas-Preset ist:

`model-with-reasoning` | `project-name` | `git-branch` | `branch-changes` | `context-used` | `used-tokens` |
`five-hour-limit` | `weekly-limit` | `permissions` | `approval-mode` | `context-window-size`

Bitte den Nutzer nach dem Setup um eine neue Codex-CLI-Session. Der native Picker `/statusline` ist die
maßgebliche Oberfläche, um die Felder interaktiv anzuzeigen, umzuschalten und zu ordnen.

### Entfernen

Führe aus: `node "<plugin-root>/scripts/qatlas-statusline-codex.js" remove`

Das Skript stellt die native Liste wieder her, die das Setup vorgefunden hat, oder entfernt das Preset samt
einer leer gewordenen `[tui]`-Tabelle. Bitte danach um eine neue Codex-CLI-Session.

### Native Unterschiede

- `branch-changes` zählt committete Änderungen gegenüber dem Standard-Branch. Es ist nicht Claudes
  nicht committeter Diff plus ein Zustand wie `dirty`, `push` oder `synced`.
- Token-Zähler sind für die Session kumulativ, nicht nur Claudes letzter `out`-Wert.
- Codex zeigt Kontext und primäre/sekundäre Nutzungslimits, aber nicht Kosten, Reset-Countdown, method oder
  die passenden Qatlas-Widgets.
- Codex setzt Layout und Separator. Farben kommen als eine native Einstellung aus dem aktiven Theme; es gibt
  keine Qatlas-Palette je Widget.

### Argumente

Übersetze Änderungen in die nativen Optionen des Setup-Skripts:

- `--enable item[,item]`
- `--disable item[,item]`
- `--colors on|off`
- `--defaults` stellt das Qatlas-Preset wieder her

Ohne `--defaults` geht das Skript beim Ein- oder Ausschalten von der vorhandenen nativen Liste aus. Erkennt
es ein natives Feld nicht, verweise auf `/statusline`, statt einen Bezeichner zu raten. Verlangt ein
Argument Kosten, Reset-Timer, method, Farben je Widget, Separator oder Umbruch, melde genau diese
Claude-Funktion unter Codex als nicht unterstützt.
