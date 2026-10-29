---
description: >
  Set up Qatlas in a project without replacing existing project files or starting further administration
  and work modes.
type: playbook
edit: locked
license: MIT
---

# Set up Qatlas

Set up Qatlas and keep the visible handover short. Describe neither the hook flows nor the internal checks of
the script.

## Check Node

Run `node --version`. If the call fails, name Node as the only blocker, point to
[nodejs.org](https://nodejs.org) and stop. On Windows, a newly installed Node may need a new terminal.
Close with `More: qatlas-help` in this case too.

## Set up the project

`<plugin-root>` is the `QATLAS PLUGIN ROOT` named in the session context, otherwise the folder three levels
above this `playbook-setup.md`.

```text
node <plugin-root>/scripts/qatlas-doctor.js --apply
```

Use the output as the finding. Do not repeat what was checked and do not name anything that already existed.
The script must not replace existing project files.

If Doctor newly created `AGENTS.md` from `scaffold/agents-template.md`, make it concrete before the handover:

1. Determine repo name and purpose from the directory, README, manifests and existing content.
2. Replace the two placeholders with concrete statements.
3. Add only project-specific rules that are actually known. Ask about scope or agent role only if the answer
   materially changes a pending action.
4. Leave no placeholders or setup comments behind.

## Set up the run configuration

If `~/.qatlas/plugins/team.yaml` is missing, read the commented template at
`<plugin-root>/store/config/team.example.yaml`. Determine the model IDs or native aliases available for the
current host and the effort levels supported by the respective model. For Claude Code, the template proposes
Haiku, Sonnet and Opus for `light`, `standard` and `demanding`; check these combinations against the provider
actually used and do not adopt them unchecked. Fill in only the section of the current host with concrete
values and remove unused host sections. For a model without effort support, such as Haiku 4.5, set
`effort: null`. Fill `supervisor`, `integrator` and `lead` with a concrete model. Show the user the finished
version and ask whether to create it as the user's own file. Write no placeholders and never replace an
existing file wholesale. Without confirmed model values, `run` stays blocked until a later setup; the rest of
the setup is complete.

## Clarify git

If Doctor reports a missing git repo, briefly ask whether to run `git init`. Act only after the answer.

If the user agrees:

1. Run `git init`.
2. Read `user.name`, `user.email` and `init.defaultBranch` with `git config --global --get <key>`.
3. Name the existing global values that git uses for the repo and for future commits. Do not additionally
   write them into the local config.
4. If name or email address is missing, invent nothing and do not change the global config without separate
   consent. Report the missing value briefly.

## Handover

Summarize only what was actually created and open blockers. For the first setup, these orientation points
suffice:

- `AGENTS.md` carries the project instructions; `CLAUDE.md` includes them for Claude.
- `.qatlas-project/README.md` is the entry into the repo's own project state. The knowledge space also
  carries the signpost to the authoritative planning system, memory and the two zones. Subject content stays
  in its existing authoritative places; a scope gets an optional `FRAMEWORK.md` next to its README only for
  its own lasting particularities.
- `.qatlas/plugins/` carries technical project configuration and the versioned update review state.
- `~/.qatlas/plugins/config.yaml` carries the user-wide plugin configuration.
- `~/qatlas/` is the user's own library. `AGENTS.qatlas.md` in it contains the global working agreement and
  belongs to the user from the moment it is created.
- `~/.qatlas/plugins/team.yaml` sets the roles, models and effort levels for `qatlas run` only, if it was
  created with the user in this setup.

Always close with `More: qatlas-help`. If there was nothing to do, answer only:

```text
Qatlas is set up. More: qatlas-help
```
