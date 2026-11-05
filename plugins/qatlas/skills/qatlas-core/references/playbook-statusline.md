---
description: >
  Set up and configure the status line of the current host: the Qatlas renderer under Claude Code, the
  native TUI footer under Codex CLI.
license: MIT
type: playbook
edit: locked
---

# Configure the status line

Configure the status line of the host this skill runs on. Determine the host from the current session,
never from installed configuration folders. Claude Code and Codex can both be installed on one device.

## When

- Only on the user's direct request. The first setup changes global user configuration and must never start
  automatically.
- Under Codex the target is the CLI TUI. If the skill is called from the desktop app or an IDE, configure
  future CLI sessions and say clearly that the footer does not appear in the current interface.

## Plugin root

Use the `<plugin-root>` resolved by the router. Insert the real absolute path before a script call. Never
hard-code it, because the installation path carries the version.

## Claude Code

Claude Code runs an external renderer and passes session JSON on stdin. The renderer applies the shipped
defaults and reads only the deviations from an optional `~/.qatlas/plugins/statusline.yaml`; its stable copy
is shipped payload that the user never edits.

### Set up

1. Run: `node "<plugin-root>/scripts/qatlas-statusline-claude.js" setup`
2. Say that the line appears with the next interaction and replaces an earlier Claude status line.
3. Ask whether the layout fits. If dynamic wrapping cuts off widgets or behaves badly in the terminal, set
   `layout: fixed` in `~/.qatlas/plugins/statusline.yaml`.

The setup copies renderer and YAML runtime to `~/.qatlas/plugins/`, keeps a previous `statusLine` entry of
`~/.claude/settings.json` aside for `remove` and points the settings to the stable copy with a refresh
interval of 60 seconds. It writes neither `statusline.yaml` nor `config.yaml`; an existing file stays
unchanged. The session start renews the copy whenever a newer plugin version runs.

### Remove

Run: `node "<plugin-root>/scripts/qatlas-statusline-claude.js" remove`

The script puts the previous `statusLine` entry back or removes the Qatlas entry, deletes renderer and
runtime copy and leaves `~/.qatlas/plugins/statusline.yaml` to the user. An entry that is not the Qatlas
renderer stays unchanged. Say that the change shows with the next interaction.

### Widgets

Without `widgets` in `~/.qatlas/plugins/statusline.yaml` every shipped widget appears in the shipped order,
newly shipped ones included. A map `widgets` is menu and render order at once: a widget appears with
`on: true`, widgets missing from the map stay off, newly shipped ones too, and the user's choice and order
stay unchanged.

`model` | `thinking` | `dir` | `branch` | `diff` | `out` | `context` | `cost` | `session` |
`session-reset` | `weekly` | `weekly-reset` | `method`

- Git widgets disappear outside a repo.
- Usage limits need a subscription and disappear with API usage. `method` makes the reason visible.
- Array and boolean map forms are accepted and normalized. Unknown widget names are dropped.

### Colors

Every widget part has `fg` and `bold`. An empty string keeps the built-in color. `label.on: false` hides a
widget's label, `defaults.label.on: false` hides every label that its widget does not switch on again. The
defaults know only two roles: labels are dimmed, values use the terminal foreground color. Meaningful colors
remain for diff numbers and bar thresholds.

The shipped palette suits dark terminals. For a light background copy
`<plugin-root>/skills/qatlas-core/assets/statusline-dual-theme.yaml` to `~/.qatlas/plugins/statusline.yaml`
as the starting point; a new setup is unnecessary. Replace an existing widget choice only with
the user's consent. The commented field reference is
`<plugin-root>/skills/qatlas-core/assets/statusline.example.yaml`.

Colors resolve in this order:

1. part of the widget,
2. `defaults.label` or `defaults.value`,
3. built-in color.

`fg` accepts `#rgb`, `#rrggbb`, `rgb(r,g,b)` and `dim`, `cyan`, `green`, `yellow`, `blue`, `magenta`,
`orange`, `red`, `diffgreen` and `diffred`. `bold` applies in addition. `NO_COLOR` forces plain text.

Bar thresholds are ascending entries `{ from, fg }`; the last one reached wins. Bar, percentage and suffix
form one display and keep the same threshold color unless the widget styles a part explicitly. The context
bar refers to the active model window, usage bars to their limits.

### Arguments and layout

For wishes such as `disable out, weekly-reset`, `enable method`, `put cost first`, `make cost green`,
`dim all labels` or `hide all labels`, write only the deviation into `~/.qatlas/plugins/statusline.yaml` and
create the file with `format: 1` if it is missing. Switch `on`, move a widget block or change the style of
its parts. Do not run the setup again.

- `wrap` is the default. Widgets flow from left to right and wrap when needed.
- `fixed` uses four lines: model/thinking/dir; branch/diff; out/context/cost; limits and method.
- `separator.text` sets the text between widgets.

## Codex CLI

Codex owns the renderer and fixed native fields. The source is the table `[tui]` in
`$CODEX_HOME/config.toml`, falling back to `~/.codex/config.toml`. Create no Codex renderer and do not mirror
this choice into `~/.qatlas/plugins/statusline.yaml`.

### Set up

Run: `node "<plugin-root>/scripts/qatlas-statusline-codex.js" setup`

The script replaces only `tui.status_line` and `tui.status_line_use_colors`, keeps all other values and
comments and rejects duplicate or mixed TOML definitions. The Qatlas preset is:

`model-with-reasoning` | `project-name` | `git-branch` | `branch-changes` | `context-used` | `used-tokens` |
`five-hour-limit` | `weekly-limit` | `permissions` | `approval-mode` | `context-window-size`

Ask the user for a new Codex CLI session after the setup. The native picker `/statusline` is the
authoritative interface for showing, switching and ordering the fields interactively.

### Remove

Run: `node "<plugin-root>/scripts/qatlas-statusline-codex.js" remove`

The script puts the native list the setup found back or removes the preset together with a `[tui]` table
left empty. Ask for a new Codex CLI session afterwards.

### Native differences

- `branch-changes` counts committed changes against the default branch. It is not Claude's uncommitted diff
  plus a state such as `dirty`, `push` or `synced`.
- Token counters are cumulative for the session, not only Claude's last `out` value.
- Codex shows context and primary/secondary usage limits, but not cost, reset countdown, method or the
  matching Qatlas widgets.
- Codex sets layout and separator. Colors come as one native setting from the active theme; there is no
  Qatlas palette per widget.

### Arguments

Translate changes into the native options of the setup script:

- `--enable item[,item]`
- `--disable item[,item]`
- `--colors on|off`
- `--defaults` restores the Qatlas preset

Without `--defaults`, the script starts from the existing native list when enabling or disabling. If it does
not recognize a native field, point to `/statusline` instead of guessing an identifier. If an argument asks
for cost, reset timers, method, colors per widget, separator or wrapping, report exactly this Claude function
as unsupported under Codex.
