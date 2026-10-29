---
description: >
  Procedure for qatlas-core update: after plugin updates, migrate an old project root, apply the pending
  update instructions of every installed Qatlas marketplace plugin with one approval and confirm the review
  state.
license: MIT
type: playbook
edit: locked
---

# Update the project

The host has already installed the new plugin versions. This procedure carries out what those releases
require in the current repo and, where an instruction says so, in the user's library under `~/qatlas/`. It
covers every installed plugin of the Qatlas marketplace in one pass. Repeating it on an updated project finds
nothing to do.

Use the `<plugin-root>` resolved by the router and no fixed installation path. `<project-root>` is the root
of the current repo.

## Preconditions

Check the repo state by `qatlas-core-git`. Uncommitted changes under `.qatlas-project/` stop the run; report
them and continue only after they are resolved.

## 1. Project root

```sh
node <plugin-root>/scripts/qatlas-migrations.js project --target <project-root>
```

If it reports a source other than none, present its inventory of source, target, references, review states
and conflicts. Conflicts stay unchanged and are questions to the user. After the user's approval run the same
command with `project --apply` and continue only once it reports no open project migration.

## 2. Pending instructions

```sh
node <plugin-root>/scripts/qatlas-update.js status --target <project-root>
```

The command lists per plugin the version last checked for this repo, the installed version and the absolute
paths of the pending update instructions. Read every listed instruction completely, in the listed order, and
check its points against the current state. Existing files take precedence; never overwrite them wholesale
with plugin templates.

When an instruction requires bringing the knowledge space onto the current layout, read
[Migrate the knowledge space](playbook-migration.md), the
[layout](../../qatlas-core-filing/references/structure.md) and the
[frontmatter schema](../../qatlas-core-filing/references/frontmatter.md), and build its mapping. Without
pending instructions, confirm the review state without asking and report it in one sentence.

## 3. Approve

If no point applies, confirm the review state without asking. Otherwise present everything in one approval:

- per applicable point, grouped by plugin, the concrete finding, the proposed change and its practical
  consequence or reason; for collective findings name one representative example, since a mere list of file
  names, counts or keywords is not enough;
- the mapping table of a knowledge space migration with its deletions, merges and locked files.

Ask what to adopt fully, partially or not at all. A point the instruction explicitly marks as purely
additive without asking is carried out without asking; name the result and one example afterwards. Do not
record rejected changes unless the user explicitly asks for it.

## 4. Apply and confirm

Carry out the approved changes, a knowledge space migration by its procedure including its verification.
Then confirm the review state in every case:

```sh
node <plugin-root>/scripts/qatlas-update.js ack --target <project-root>
```

Without `--plugin` this confirms every installed plugin; `--plugin <name>` confirms only that one, for
example when the user wants to postpone the decision for another plugin. A rejection is not raised again
with the next version. Report counts per change kind and open questions, and offer a separate commit.
