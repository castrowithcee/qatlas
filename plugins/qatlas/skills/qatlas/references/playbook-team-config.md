---
description: >
  Check the user's own team.yaml for run and team and map worker profiles with explicitly set model and
  effort to the host's subagents.
type: playbook
edit: locked
license: MIT
---

# Check the team

Before task selection, read `~/.qatlas/plugins/team.yaml`. This user-owned file applies only to `run` and
`team` and is the only source for the chosen models and effort levels. The leads of `run` and
`team` start with the model from `lead`; worker profiles come from `worker`. `supervisor` and
`integrator` are assigned roles that `run` and `team` currently do not start. Check that the format, the
section of the current host, the `lead` model and the required worker profiles are present and valid. If
the file or its host section is missing, an entry is invalid or a model looks outdated or doubtful, set it up
following "Set up the team" and start no task until it is clarified.

The profiles are an allowlist: use neither a model that is not entered nor a different effort setting. Set
`effort: null` only for a model that supports no effort; for all other workers, effort is set explicitly and
not inherited from the lead.

Codex sets model and reasoning effort explicitly on spawn. For the effort levels `low`, `medium`, `high`,
`xhigh` and `max`, Claude Code uses the plugin subagent `qatlas:run-low`, `qatlas:run-medium`,
`qatlas:run-high`, `qatlas:run-xhigh` or `qatlas:run-max` respectively and passes the model explicitly on the
call. Any other subagent type inherits effort and possibly model from the lead and is not allowed
for workers. Choose only a level supported by the respective host and model; `ultra` is not a Claude Code
effort level. For `effort: null`, use `qatlas:run-no-effort` without effort frontmatter, and only for a model
without effort support. Its extended thinking follows the Claude Code session and is not controlled by
`team.yaml`. If the matching subagent is not available or the host replaces the model or a chosen effort
level with other values, do not start with this profile. Do not fall back to a different effort level.
