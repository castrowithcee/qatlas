---
name: qatlas-core
description: >
  Bundles explicitly called Qatlas core administration: set up a project, diagnose project state, check the
  project after plugin updates, configure the status line, switch the authoritative planning system or
  migrate an existing project knowledge space.
  Without an argument, show a compact card of the available modes and run nothing.
disable-model-invocation: true
argument-hint: "[setup|doctor|update|statusline|backlog-system|migrate] [arguments]"
license: MIT
---

# Qatlas-Core

This router bundles explicitly started administration tools of the `qatlas` plugin. It is no passive
infrastructure and starts no change without an unambiguous mode.

## Without an argument

Reply only with the following card as rendered Markdown. Read no mode reference and change no state.

### Qatlas Core

| Argument | Task |
|---|---|
| `setup` | Sets up Qatlas and its project state. |
| `doctor` | Checks Qatlas, scaffold, dependencies and the project update state without repairing. |
| `update` | Merges what installed plugin updates require in this project. |
| `statusline` | Sets up or adjusts the status line of the current host. |
| `backlog-system` | Switches or migrates the authoritative planning system of a project. |
| `migrate` | Brings an existing project knowledge space onto the fixed folders, types and names. |

Call: `qatlas-core <argument>`

## Choose the mode

`<plugin-root>` is the `QATLAS PLUGIN ROOT` named in the session context; without a hook it lies two levels
above this `SKILL.md`. Always insert this resolved root in the chosen reference.

- **`setup`:** Read [Set up Qatlas](references/playbook-setup.md) fully and run only this procedure.
- **`doctor`:** Read [Diagnose Qatlas](references/playbook-doctor.md) fully and run only this procedure.
- **`update`:** Read [Check the project after plugin updates](references/playbook-update.md) fully and run
  only this procedure.
- **`statusline [arguments]`:** Read [Configure the status line](references/playbook-statusline.md) fully
  and run only this procedure with the remaining arguments.
- **`backlog-system [source] [target]`:** Read [Switch the planning
  system](references/playbook-backlog-system.md) fully and run only this procedure with the remaining
  arguments.
- **`migrate`:** Read [Migrate](references/playbook-migrate.md) fully and run only this procedure.

If a given argument is ambiguous, name the fitting options in one short sentence each and ask for exactly
one. If it is unknown, show the compact card and name the unknown argument in one sentence. Never take a
general conversation about diagnosis or the status line as a call of this skill.
