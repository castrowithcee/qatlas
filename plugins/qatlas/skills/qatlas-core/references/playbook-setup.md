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

Files Doctor newly created from the English seeds are the user's own text and get their language: `AGENTS.md`
follows the language of the repo's existing documentation, otherwise the language of the conversation;
`~/qatlas/AGENTS.qatlas.md` follows the language of the conversation. Translate such a file completely and
keep its structure. The seeds with frontmatter under `.qatlas-project/` stay English.

If Doctor newly created `AGENTS.md`, make it concrete before the handover:

1. Determine repo name and purpose from the directory, README, manifests and existing content.
2. Replace the two placeholders with concrete statements.
3. Add no rules and ask no questions about them; the file fills as the work goes on. The reserved files of
   the knowledge space arise later with their first entry and get their line under `Project knowledge`
   then. Remove the memory line if the configuration disables repo memory.
4. Leave no placeholders behind.

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

- `AGENTS.md` carries the project instructions and is the entry into `.qatlas-project/`; `CLAUDE.md`
  includes it for Claude.
- `.qatlas-project/` carries the signpost to the authoritative planning system and, unless the configuration
  disables repo memory, the memory index. Its reserved files `CONVENTIONS.md`, `ARCHITECTURE.md`,
  `TESTING.md` and `CONTRIBUTING.md` and its folders arise with their first entry. Subject content stays in
  its existing authoritative places; a scope gets an optional `FRAMEWORK.md` next to its README only for its
  own lasting particularities.
- `.qatlas/plugins/` carries technical project configuration and the versioned update review state.
- `~/.qatlas/plugins/config.yaml` is optional and holds only user-wide deviations from the shipped defaults.
- `~/qatlas/` is the user's own library. `AGENTS.qatlas.md` in it contains the global working agreement and
  belongs to the user from the moment it is created.

Always close with `More: qatlas-help`. If there was nothing to do, answer only:

```text
Qatlas is set up. More: qatlas-help
```
