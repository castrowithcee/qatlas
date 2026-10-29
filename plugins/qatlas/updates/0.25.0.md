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
- Otherwise migrate the knowledge space as part of this update; its mapping goes into the update's approval
  before anything changes, and it points every reference in the repo, such as project instructions, to the
  new paths.
- Content, `edit` and version fields of the affected files stay as they are; only `type`, folder and name
  change.
- In the user's library under `~/qatlas/`, check whether a `rules/` folder or files with `type: rule` remain.
  If so, propose moving `rules/` to `policies/` with `git mv` where the library is a Git repo, setting
  `type: policy` and pointing references inside the library, such as `AGENTS.qatlas.md`, to the new paths.
  The library belongs to the user; change it only after approval, and once it is done the point no longer
  applies in any other repo.
