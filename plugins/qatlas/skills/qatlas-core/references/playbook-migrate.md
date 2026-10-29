---
description: >
  Procedure for qatlas-core migrate: inventory a project knowledge space, map every file to its fixed
  folder, type and name, get approval, convert in place with references and verify the result.
license: MIT
type: playbook
edit: locked
---

# Migrate

Brings an existing `.qatlas-project/` onto the current
[layout](../../qatlas-core-filing/references/structure.md) and
[frontmatter schema](../../qatlas-core-filing/references/frontmatter.md). Repeating it on a converted project
finds nothing to do.

Out of scope are both zones, the content of `templates/`, embedded Git repos and worktrees, the user library
and every file outside the knowledge space; outside it you only adjust references to moved files.

## Preconditions

Check the repo state by `qatlas-core-git`. Uncommitted changes under `.qatlas-project/` or an open project
migration finding stop the run; report them and continue only after they are resolved.

## 1. Inventory

List every folder and file of the knowledge space with type, `edit`, version fields and status from its
frontmatter, and find its inbound references across the repo. Report files without frontmatter and folders
outside the fixed set.

## 2. Map

Assign every file its target folder, name and type, plus the frontmatter delta:

| Found | Target |
|---|---|
| a type in its fixed folder with `<type>-<slug>.md` | unchanged apart from missing fields |
| an ID or another prefix in the name, such as `decision-0003-…`, `adr-`, `convention-`, `memory-0001-…` | `<type>-<slug>.md` in the type's folder |
| `type: decision` or `type: rule`, or a `decisions/` folder | `policy` in `policies/`, a former `decisions/conventions/` in `policies/conventions/` |
| a plan stored as `decision`, `rule` or `policy` | `plans/plan-<slug>.md` with `type: plan`, `edit: shared`, `status` `active` or `done` |
| a convention, whatever its type | `policies/conventions/policy-<slug>.md` |
| an architecture decision or accepted risk | `policies/policy-<slug>.md` |
| a current architecture description | `architecture/knowledge-<slug>.md` |
| an operating procedure | `playbooks/playbook-<slug>.md` |
| an overview of the project | merged into the root README |
| a requirement | a plan or a task, chosen by the user |
| quality reports, findings, other knowledge | `knowledge/knowledge-<slug>.md` |
| a `FRAMEWORK.md` inside the knowledge space | `policies/conventions/policy-<slug>.md` |
| a scope README or `INDEX.md` below the root | merged into the root README, then removed |
| `type: history`, `HISTORY.md`, a superseded decision or policy, an `archive/` folder | proposed for deletion; Git keeps them |
| a task | keeps its name and folder under the backlog contract |
| the memory index | `memory/MEMORY.md` with `type: meta` |

Derive the slug from the old name without prefix and ID. Frontmatter delta: set the target `type` and its
default `edit` unless the found `edit` is stricter; add `version`, `created` and `updated` by the schema;
remove `status` outside tasks, plans and project heads as well as `supersedes` and `superseded_by`. A file
whose type stays unclear or whose slug collides is a question to the user, never a new folder.

## 3. Approve

Present the mapping as one table: old path, new path, type, frontmatter delta. List separately every
deletion, every merge and every file with `edit: locked`. The user's approval of this table covers moving
and renaming locked files; it does not cover content changes to them.

## 4. Convert

1. Move with `git mv` so Git keeps each file's history.
2. Adjust frontmatter and carry out the merges.
3. Create missing fixed folders, empty ones with `.gitkeep`.
4. Point every reference in the repo to the new paths. Leave historical records that name an old path as
   such unchanged, for example closed tasks.
5. Update the folder overview and read conditions of the root README.
6. Delete only what was approved for deletion.

## 5. Verify

Check that no folder exists outside the fixed set, every file name starts with its type, every frontmatter
matches the schema and no reference points to an old path. Report counts per change kind, open questions and
remaining findings, and offer a separate commit for the migration.
