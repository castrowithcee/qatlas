---
description: >
  Create the team file for Qatlas Run, add a host section to it, or check and update its models and effort
  levels.
type: playbook
edit: locked
license: MIT
---

# Set up the team

The commented template is [the team template](../../../store/config/team.example.yaml); `null` as a model
value marks a placeholder there, whereas `effort: null` marks a model without effort support. The Claude Code
template proposes Haiku, Sonnet and Opus for `light`, `standard` and `demanding`. If the user file is
missing, read the template and determine the model IDs or native aliases and effort levels available for the
current host. Show a concretely filled-in version with only this host, including `supervisor`, `integrator`
and `lead`, and ask whether to create it there. Write no placeholders; if values cannot be verified, ask for
them. Create the file only after consent. Without the file and without consent, start no task; the model
limits would not be established.

For an existing file, check format, host, the three described profiles, the `lead` entry and all chosen
`worker` profiles. Also check that `supervisor` and `integrator` hold valid models; `team` starts the
integrator with its model, whereas the supervisor is the user's own session and is not started. Accept as
model values only IDs or native aliases supported by the host; do not interpret bare family names as aliases
yourself. If the section of the current host is missing, propose its concretely filled-in addition and change
the user file only after consent; start no task until then. Check the entered models and effort levels against
the selection currently available in the host; verify doubtful or new models against current official host
information. If an entry is outdated or a new model is plausibly better for a profile, propose the concrete
change with the reason. Change the user's own file only after consent. A new model does not silently replace a
valid entry. An invalid `lead` model or a profile that is not usable for the required task stops before the
task is claimed; other valid profiles remain usable. Claim no check of model availability that the host does
not allow.
