---
description: >
  Read-only diagnosis of a Qatlas project: checks dependencies, configuration, scaffold, project
  instructions, user library and the repo-local update state without repairing or confirming anything.
license: MIT
type: playbook
edit: locked
---

# Diagnose Qatlas

Diagnose the current folder without changing it. The user owns the timing of this skill.

Use the `<plugin-root>` resolved by the router and no fixed installation path.

## Check

Run both commands without `--apply` and without `ack`:

```sh
node <plugin-root>/scripts/qatlas-doctor.js
node <plugin-root>/scripts/qatlas-update.js status
```

The first command checks Node, git, git identity, the user-wide and the project configuration including
keys Qatlas no longer reads, syntax and basic structure of an existing `team.yaml` (per host `supervisor`,
`integrator`, `lead` and `worker` with the three profiles), the project knowledge space including root
README and size budget, `.gitignore`, project instructions and the scaffold of the user library under
`~/qatlas/`. It names missing library parts as a suggestion for `qatlas-core setup`. `team.yaml` is optional
and never created by Doctor; model and effort availability is checked only by `run` in the current host.
With an earlier project root, every writing repair stays blocked and points to `qatlas-core update`. The
second command compares, for every
installed plugin of the Qatlas marketplace, the review state stored for this repo under
`.qatlas/plugins/updates/state.json` with the installed version and lists the pending update instructions.

Read no update instruction in the diagnosis run and confirm nothing. If instructions are pending, report
which plugins they concern and name `qatlas-core update` as the procedure that checks and merges them.

## Report

Summarize findings by priority: blockers, missing project components, hints and update state. Invent no
repair and do not report drift across the board just because plugin template and existing repo file differ in
content.

If the user wants to add what is missing, afterwards use `qatlas-core setup` or run Doctor with `--apply`
after approval. Both procedures copy only missing files and extend `.gitignore`. Never confirm update states
as the repair of an unchecked finding.
