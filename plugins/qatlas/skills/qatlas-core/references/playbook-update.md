---
description: >
  Project check after plugin updates: reads the pending update instructions of every installed Qatlas
  marketplace plugin, checks them against the current repo, lets the user decide and confirms the review state.
license: MIT
type: playbook
edit: locked
---

# Check the project after plugin updates

The host has already installed the new plugin versions. This procedure merges what those releases require in
the current repo. It covers every installed plugin of the Qatlas marketplace in one pass; packs have no
channel of their own.

Use the `<plugin-root>` resolved by the router and no fixed installation path. `<project-root>` is the root
of the current repo.

## Determine what is pending

```sh
node <plugin-root>/scripts/qatlas-update.js status --target <project-root>
```

The command lists per plugin the version last checked for this repo, the installed version and the absolute
paths of the relevant update instructions. If it reports a pending project migration, handle that first with
`qatlas-core migrate` and confirm nothing here. If no plugin has an instruction, confirm the review state
without asking and report it in one sentence.

## Check

Read every listed instruction completely and check only the current repo. Existing repo files take
precedence; never overwrite them wholesale with plugin templates.

- If no point applies, confirm the review state without asking.
- Otherwise state per applicable point, grouped by plugin, the concrete finding in the repo, the proposed
  change and its practical consequence or reason. A mere list of file names, counts or keywords is not
  enough; for collective findings name one representative example. Only then ask what to adopt fully,
  partially or not at all.
- A point the instruction explicitly marks as purely additive without asking is carried out without asking;
  name the result and one example afterwards.

Do not record rejected changes in the repo unless the user explicitly asks for it.

## Confirm

After the check or the user's decision, confirm the review state in every case:

```sh
node <plugin-root>/scripts/qatlas-update.js ack --target <project-root>
```

Without `--plugin` this confirms every installed plugin; `--plugin <name>` confirms only that one, for
example when the user wants to postpone the decision for another plugin. A rejection is not raised again
with the next version.
