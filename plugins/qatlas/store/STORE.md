---
description: >
  Index of the versioned Qatlas assets and templates: what the store holds and when it may be used on
  purpose.
type: meta
edit: locked
---

# Store: assets and templates only when needed

The store holds only assets and templates that are updated with the plugin and copied for a concrete goal or
used as a starting point. It is not a place for rules, schemas or other behavior references. Load it neither
at session start nor in advance. Open this index only for a concrete need, pick a matching entry and
afterwards use only the files named there.

## Library

| Need | Read only | Use |
|---|---|---|
| Task in the local Qatlas backlog | `backlog/task.md` | Create it as `.qatlas-project/backlog/task-<id>-<slug>.md` or in the project concerned and fill it in following the backlog reference. |
| Project in the local Qatlas backlog | `backlog/project-readme.md` | Create it as `.qatlas-project/backlog/<project>/README.md` and fill it in following the backlog reference. |
| Recurring filing per customer or case | `customers/customers-framework.md` and `customers/customer-index.md` | Copy and adapt as `<area>-customers/FRAMEWORK.md` and, per customer, as `<area>-customers/<id>/INDEX.md`. |
| Look up plugin settings | `config/config.example.yaml` | Read as a version-bound field reference. Never replace the effective `~/.qatlas/plugins/config.yaml` wholesale with it. |
| Configure the team for `qatlas run` | `config/team.example.yaml` | Use as the commented template for `~/.qatlas/plugins/team.yaml`. Fill in every model value concretely before creating it; never replace an existing user file wholesale. |
| Look up the Claude statusline | `statusline/statusline.example.yaml` | Read as a version-bound field reference. Never replace the effective `~/.qatlas/plugins/statusline.yaml` wholesale with it. |
| Statusline on light and dark terminal backgrounds | `statusline/dual-theme.yaml` | Adopt as a complete starting configuration into `~/.qatlas/plugins/statusline.yaml` when the existing widget selection may be replaced. |

The installed store is read-only because its version-bound path is replaced on update. Copy needed material
to its destination and change it there. `.qatlas-project/templates/` is solely the user's versioned template
library. Qatlas stores nothing there. Custom templates belong there, never in the store.
