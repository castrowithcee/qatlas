---
description: >
  Reading policy for the managed project state: memory, the roster of the local backlog and ideas.
license: MIT
type: policy
edit: locked
---

# Read project state

- **Memory:** `MEMORY.md` is the index. Open from it only task-relevant files and check their statements
  against the current state before building on them. With `memory.enable: false` in the plugin
  configuration there is no index and no repo memory.
- **Roster:** With a local backlog, use `BACKLOG.md` and project indexes first to select by status, brief
  state, order, dependencies and ownership. Then read only the chosen tasks and their real blockers fully.
  An explicitly chosen single task may be read fully right away. Never load all open task files as a
  precaution.
- **Ideas:** Open `IDEAS.md` only to record, review or work out ideas.
