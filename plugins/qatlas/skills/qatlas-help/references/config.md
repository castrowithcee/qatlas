---
description: >
  Qatlas settings: locations of the configuration, inheritance, keys and their effect.
type: meta
edit: locked
license: MIT
---

# Configuration

| File | Purpose |
|---|---|
| `~/.qatlas/plugins/config.yaml` | Global settings for all projects |
| `<repo>/.qatlas/plugins/config.yaml` | Project values; a set value overrides the global one, a missing one inherits |
| `~/.qatlas/plugins/statusline.yaml` | Appearance of the Claude statusline |
| `~/.qatlas/plugins/team.yaml` | Team roles, models and effort levels for `qatlas run` |

## Keys in `config.yaml`

| Key | Level | Effect |
|---|---|---|
| `session-start.enabled` | global | Switches the passive Qatlas context at session start |
| `brains.qatlas.enabled` | global, project | Switches the signpost to the library `~/qatlas/` |
| `brains.project` | project | Names additional project-related sources with `paths` and `description` |
| `protection.enabled` | global, project | Switches the protection check fully off or on |
| `protection.secrets` | global, project | `block`, `ask`, `warn` or `allow` for secrets before the commit |
| `protection.personal-data` | global, project | The same values for personal data |

The default is `secrets: block` and `personal-data: ask`. `block` prevents the step, `ask` asks beforehand,
`warn` only reports, `allow` does not check. A passed check stays silent. Whether a repo is public or private
is not derived by Qatlas; the project configuration expresses that intent.

## Approvals of the protection check

A false alarm for `personal-data` confirmed by the user can be approved permanently so that later commits do
not report it again. The approvals are versioned and live only project-locally in
`<repo>/.qatlas/plugins/protection-allow.yaml`; they are not a key of `config.yaml`. They apply only to
`personal-data` with `ask` or `warn`; secrets and `block` can never be approved, and changed content is
reported again. The file contains only identifiers, no plain text. An entry is created by
`node <plugin-root>/scripts/qatlas-protection-check.js --target <repo-root> --allow <identifier>`; the
identifier is named by the finding in square brackets. The format is described in the head of the script.

Credentials never belong in a `config.yaml`. A commented template lives in the plugin at
`store/config/config.example.yaml`.

An already existing `AGENTS.md` belongs to the user and is not rewritten by this procedure.
