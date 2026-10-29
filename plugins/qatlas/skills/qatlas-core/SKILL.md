---
name: qatlas-core
description: >
  Bundles explicitly called Qatlas core administration: set up a project, diagnose project state, update and
  migrate the project after plugin updates, configure the status line or switch the authoritative planning
  system.
  Without an argument, show a compact card of the available modes and run nothing.
disable-model-invocation: true
argument-hint: "[setup|doctor|update|statusline|backlog-system] [arguments]"
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
| `update` | Migrates this project to what installed plugin updates require. |
| `statusline` | Sets up or adjusts the status line of the current host. |
| `backlog-system` | Switches or migrates the authoritative planning system of a project. |

Call: `qatlas-core <argument>`

## Choose the mode

`<plugin-root>` is the `QATLAS PLUGIN ROOT` named in the session context; without a hook it lies two levels
above this `SKILL.md`. Always insert this resolved root in the chosen reference.

- **`setup`:** Read [Set up Qatlas](references/playbook-setup.md) fully and run only this procedure.
- **`doctor`:** Read [Diagnose Qatlas](references/playbook-doctor.md) fully and run only this procedure.
- **`update`:** Read [Update the project](references/playbook-update.md) fully and run only this procedure.
- **`statusline [arguments]`:** Read [Configure the status line](references/playbook-statusline.md) fully
  and run only this procedure with the remaining arguments.
- **`backlog-system [source] [target]`:** Read [Switch the planning
  system](references/playbook-backlog-system.md) fully and run only this procedure with the remaining
  arguments.

If a given argument is ambiguous, name the fitting options in one short sentence each and ask for exactly
one. If it is unknown, show the compact card and name the unknown argument in one sentence. Never take a
general conversation about diagnosis or the status line as a call of this skill.
