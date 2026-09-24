---
description: >
  Statusline des aktuellen Hosts einrichten und konfigurieren: unter Claude Code den Qatlas-Renderer,
  unter Codex CLI den nativen TUI-Footer.
license: MIT
type: playbook
edit: locked
---

# Statusline konfigurieren

Konfiguriere die Statusline des Hosts, auf dem dieser Skill läuft. Ermittle den Host aus der aktuellen
Session, niemals aus installierten Konfigurationsordnern. Claude Code und Codex können zugleich auf einem
Gerät installiert sein.

## Wann

- Nur auf direkte Anfrage des Nutzers. Die erstmalige Einrichtung verändert globale Nutzerkonfiguration
  und darf nie automatisch starten.
- Unter Codex ist das Ziel die CLI-TUI. Wird der Skill aus Desktop-App oder IDE aufgerufen, konfiguriere
  künftige CLI-Sessions und sage klar, dass der Footer in der aktuellen Oberfläche nicht erscheint.

## Plugin-Root

Verwende den vom Router aufgelösten `<plugin-root>`. Setze vor einem Script-Aufruf den echten absoluten
Pfad ein. Nie fest codieren, denn der Installationspfad trägt die Version.

## Claude Code

Claude Code führt einen externen Renderer aus und übergibt Session-JSON über stdin. Der Renderer liest die
Nutzerwahl aus `~/.qatlas/plugins/statusline.yaml`; seine stabile Kopie ist ausgelieferte Payload, die der Nutzer
nie bearbeitet.

### Einrichten

1. Führe aus: `node "<plugin-root>/scripts/qatlas-statusline-setup-claude.js"`
2. Sage, dass die Zeile bei der nächsten Interaktion erscheint und eine frühere Claude-Statusline ersetzt.
3. Frage, ob das Layout passt. Schneidet dynamischer Umbruch Widgets ab oder verhält sich im Terminal
   schlecht, setze `layout: fixed` in `~/.qatlas/plugins/statusline.yaml`.

Das Setup kopiert Renderer und YAML-Runtime nach `~/.qatlas/plugins/`, legt eine fehlende `config.yaml`
sowie `statusline.yaml` einmalig an und verweist aus `~/.claude/settings.json` mit 60 Sekunden
Aktualisierungsintervall auf die stabile Kopie. Vorhandene Nutzerkonfigurationen bleiben unverändert.

### Widgets

Die Map `widgets` in `~/.qatlas/plugins/statusline.yaml` ist zugleich Menü und Render-Reihenfolge.
Ein Widget erscheint bei `on: true`. Neu ausgelieferte, dort fehlende Widgets bleiben ausgeschaltet, bis
der Nutzer sie ergänzt; bestehende Wahl und Reihenfolge bleiben unverändert.

`model` | `thinking` | `dir` | `branch` | `diff` | `out` | `context` | `cost` | `session` |
`session-reset` | `weekly` | `weekly-reset` | `method`

- Git-Widgets verschwinden außerhalb eines Repos.
- Nutzungslimits brauchen ein Abonnement und verschwinden bei API-Nutzung. `method` macht den Grund sichtbar.
- Array- und Boolean-Map-Formen werden akzeptiert und normalisiert. Unbekannte Widget-Namen entfallen.

### Farben

Jeder Widget-Teil besitzt `fg` und `bold`. Ein leerer String behält die eingebaute Farbe. Die Standards
kennen nur zwei Rollen: Labels sind gedimmt, Werte nutzen die Terminal-Vordergrundfarbe. Bedeutungsvolle
Farben bleiben bei Diff-Zahlen und Balkenschwellen.

Die Erstinstallation schreibt eine Palette für dunkle Terminals als normale Konfiguration. Für hellen
Hintergrund verwende `<plugin-root>/store/statusline/dual-theme.yaml` als Ausgangspunkt für
`~/.qatlas/plugins/statusline.yaml`; ein erneutes Setup ist unnötig. Ersetze eine vorhandene Widget-Auswahl
nur mit Zustimmung des Nutzers.

Farben werden in dieser Reihenfolge aufgelöst:

1. Teil des Widgets,
2. `defaults.label` oder `defaults.value`,
3. eingebaute Farbe.

`fg` akzeptiert `#rgb`, `#rrggbb`, `rgb(r,g,b)` sowie `dim`, `cyan`, `green`, `yellow`, `blue`, `magenta`,
`orange`, `red`, `diffgreen` und `diffred`. `bold` wirkt zusätzlich. `NO_COLOR` erzwingt reine Textausgabe.

Balkenschwellen sind aufsteigende Einträge `{ from, fg }`; der zuletzt erreichte gewinnt. Balken, Prozentwert
und Suffix bilden eine Anzeige und behalten dieselbe Schwellenfarbe, sofern das Widget keinen Teil ausdrücklich
gestaltet. Der Kontextbalken bezieht sich auf das aktive Modellfenster, Nutzungsbalken auf ihre Limits.

### Argumente und Layout

Bei Wünschen wie `disable out, weekly-reset`, `enable method`, `put cost first`, `make cost green` oder
`dim all labels` bearbeite ausschließlich `~/.qatlas/plugins/statusline.yaml`. Schalte `on`, verschiebe
einen Widget-Block oder ändere den Stil seiner Teile. Führe das Setup nicht erneut aus.

- `wrap` ist Standard. Widgets fließen von links nach rechts und brechen bei Bedarf um.
- `fixed` nutzt vier Zeilen: model/thinking/dir; branch/diff; out/context/cost; Limits und method.
- `separator.text` bestimmt den Text zwischen Widgets.

## Codex CLI

Codex besitzt Renderer und feste native Felder. Quelle ist die Tabelle `[tui]` in
`$CODEX_HOME/config.toml`, mit Fallback auf `~/.codex/config.toml`. Erzeuge keinen Codex-Renderer und spiegle
diese Wahl nicht nach `~/.qatlas/plugins/statusline.yaml`.

### Einrichten

Führe aus: `node "<plugin-root>/scripts/qatlas-statusline-setup-codex.js"`

Das Script ersetzt nur `tui.status_line` und `tui.status_line_use_colors`, bewahrt alle anderen Werte und
Kommentare und lehnt doppelte oder gemischte TOML-Definitionen ab. Das Qatlas-Preset lautet:

`model-with-reasoning` | `project-name` | `git-branch` | `branch-changes` | `context-used` | `used-tokens` |
`five-hour-limit` | `weekly-limit` | `permissions` | `approval-mode` | `context-window-size`

Bitte den Nutzer nach dem Setup um eine neue Codex-CLI-Session. Der native Picker `/statusline` ist die
maßgebliche Oberfläche zum interaktiven Anzeigen, Umschalten und Sortieren der Felder.

### Native Unterschiede

- `branch-changes` zählt committete Änderungen gegen den Standardbranch. Es ist nicht Claudes uncommitteter
  Diff plus Zustand wie `Änderungen vorhanden`, `Push nötig` oder `aktuell`.
- Tokenzähler gelten kumulativ für die Session, nicht nur für Claudes letzten `out`-Wert.
- Codex zeigt Kontext und primäre/sekundäre Nutzungslimits, aber nicht Kosten, Reset-Countdown, Methode oder
  die entsprechenden Qatlas-Widgets.
- Codex bestimmt Layout und Trenner. Farben kommen als eine native Einstellung aus dem aktiven Theme; es
  gibt keine Qatlas-Palette pro Widget.

### Argumente

Übersetze Änderungen in die nativen Optionen des Setup-Scripts:

- `--enable item[,item]`
- `--disable item[,item]`
- `--colors on|off`
- `--defaults` stellt das Qatlas-Preset wieder her

Ohne `--defaults` beginnt das Script beim Aktivieren oder Deaktivieren mit der vorhandenen nativen Liste.
Erkennt es ein natives Feld nicht, verweise auf `/statusline`, statt eine Kennung zu raten. Fordert ein
Argument Kosten, Reset-Timer, Methode, Farben pro Widget, Trenner oder Umbruch, melde genau diese unter Codex
nicht unterstützte Claude-Funktion.
