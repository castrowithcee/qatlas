---
description: >
  Read-only diagnosis of a Qatlas project: checks dependencies, store, scaffold, project instructions, user
  library and the repo-local update state without repairing or confirming anything itself.
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

The first command checks Node, git, git identity, optional git LFS support, the user-wide store, syntax and
basic structure of the optional `team.yaml` (per host `supervisor`, `integrator`, `lead` and `worker` with
the three profiles, and a leftover configuration file that the startup migration has already taken over,
which it names for explicit cleanup), the project knowledge space including root README and size budget,
`.gitignore`, project instructions and the scaffold of the user library under `~/qatlas/`. It names missing
library parts as a suggestion for `qatlas-core setup`. A missing `team.yaml` is a hint for `run`, not a setup
blocker; Doctor does not create it even with `--apply` without confirmed model values. Model and effort
availability is checked only by `run` in the current host. With an old or parallel project root, every
writing repair run stays blocked and names the inventory command. The second command compares the Qatlas
review state stored for this repo under `.qatlas/plugins/updates/state.json` with the installed Qatlas
version. The optional packs check their own version through their SessionStart hook; derive no overall state
of all plugins from the Qatlas command.

If update instructions are open, read only the files printed and check their points against the current repo.
Existing repo files take precedence. Report whether and what is applicable, but do not confirm the review
state in the diagnosis run. If something is applicable, state per point briefly the concrete finding, the
proposed change and its practical consequence or reason. A mere list of file names, counts or keywords is not
enough. Only after the user then explicitly decides on full, partial or no adoption may you make changes and
run `ack`.

## Report

Summarize findings by priority: blockers, missing project components, hints and update state. Invent no
repair and do not report drift across the board just because plugin template and existing repo file differ in
content.

If the user wants to add what is missing, afterwards use `qatlas-core setup` or run Doctor with `--apply`
after approval. Both procedures copy only missing files and extend `.gitignore`. Never confirm update states
as the repair of an unchecked finding.
