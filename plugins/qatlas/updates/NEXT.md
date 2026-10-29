---
description: >
  Check instruction for existing projects after decisions and rules were merged into the single type policy
  with the fixed folder policies/.
license: MIT
type: policy
edit: locked
---

# Decisions and rules are now policies

Everything that binds whoever works in its scope until the user changes it now has the single type
`policy`, whether it records one settled choice or a set of working norms. The fixed folder is
`policies/`, with `policies/conventions/` for how work in the project is done; files are named
`policy-<slug>.md`.

- Check whether the knowledge space still has a `decisions/` folder, files named `decision-*` or `rule-*`,
  or files with `type: decision` or `type: rule`. If not, nothing needs to change in the project.
- Otherwise tell the user what differs, with a few examples, and offer `qatlas-core migrate`. It runs only
  on the user's call and presents its full mapping for approval before it changes anything; it also points
  every reference in the repo, such as project instructions, to the new paths.
- Content, `edit` and version fields of the affected files stay as they are; only `type`, folder and name
  change.
