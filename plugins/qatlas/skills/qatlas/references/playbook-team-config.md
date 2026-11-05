---
description: >
  Read the optional team.yaml for run and team, fall back to the host defaults without it and start workers
  with the model and effort of their profile.
type: playbook
edit: locked
license: MIT
---

# Check the team

`~/.qatlas/plugins/team.yaml` is optional and belongs to the user; it applies only to `run` and `team`.
Without the file, or without a section for the current host, every role runs on the host default: leads and
the integrator start without an explicit model, and every worker inherits model and effort of its lead. The
profiles keep their meaning for cutting the work:

- `light`: narrow task with a clear approach and a direct check.
- `standard`: several dependent steps or technical trade-offs within the task.
- `demanding`: hard diagnosis or tightly coupled implementation that cannot sensibly be cut smaller.

If the file exists, read it before task selection; its `profiles` replace these descriptions. The leads of
`run` and `team` start with the model from `lead`, the integrator of `team` with the model from
`integrator`, and workers with their profile from `worker`. `supervisor` is the user's own session, which
`run` and `team` do not start. A `null` model inherits. If the file is invalid, an entered model looks
outdated or doubtful, or the user asks for it, set it up following "Set up the team" and start no task until
it is clarified.

Entered profiles are an allowlist: use neither another model nor another effort setting than the one
entered. `effort: null` marks a model without effort support.

Start every worker like this:

- **Claude Code:** subagent type `qatlas:worker`, with the profile's `model` and `effort` as parameters of
  the call; leave out a parameter the profile does not set or sets to `null`. The call accepts model aliases
  such as `haiku`, `sonnet` or `opus`, not full model IDs. The effort parameter needs Claude Code 2.1.292 or
  later; on an older version, start no profile that sets effort and name the update as the prerequisite.
- **Codex:** set model and reasoning effort explicitly on spawn.

Choose only a level the host and model support; `ultra` is not a Claude Code effort level. If the host
replaces the model or the chosen effort with other values, do not start with this profile, and do not fall
back to another effort level.
