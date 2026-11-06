---
description: >
  Block of qatlas-core update for migrating a project knowledge space: inventory, map every file to its fixed
  folder, type and name, convert in place with references and verify the result.
license: MIT
type: playbook
edit: locked
---

# Migrate the knowledge space

Brings an existing `.qatlas-project/` onto the current layout and frontmatter schema of `qatlas-core-filing`.
Out of scope are both zones, the content of `templates/`, embedded Git repos and worktrees and every file
outside the knowledge space; outside it you only adjust references to moved files.

## 1. Inventory

List every folder and file of the knowledge space with type, `edit` and status from its
frontmatter, and find its inbound references across the repo. Report files without frontmatter and folders
outside the fixed set.

## 2. Map

Assign every file its target folder, name and type, plus the frontmatter delta:

| Found | Target |
|---|---|
| a type in its fixed folder with `<type>-<slug>.md` | unchanged apart from missing fields |
| an ID or another prefix in the name, such as `decision-0003-…`, `adr-`, `convention-`, `memory-0001-…` | `<type>-<slug>.md` in the type's folder |
| a decision, rule or policy, whatever its type or folder (`decisions/`, `policies/`, `adr-…`) | worked into the reserved file it concerns: `CONVENTIONS.md`, `ARCHITECTURE.md`, `TESTING.md` or `CONTRIBUTING.md`; a rule that must hold in every session into `AGENTS.md`; then removed |
| a plan stored as `decision`, `rule` or `policy` | `plans/plan-<slug>.md` with `type: plan`, `edit: shared`, `status` `active` or `done` |
| a convention, whatever its type or folder (`policies/conventions/`, `conventions/`) | `CONVENTIONS.md`, beyond the line limit `conventions/policy-<slug>.md` |
| a test strategy or acceptance profile, also inside `AGENTS.md` | `TESTING.md` |
| a workflow rule on branches, commits or pull requests, also inside `AGENTS.md` | `CONTRIBUTING.md` |
| a current architecture description | `ARCHITECTURE.md`, beyond the line limit `architecture/knowledge-<slug>.md` |
| an operating procedure | `playbooks/playbook-<slug>.md` |
| an overview of the project | the `Purpose` section of `AGENTS.md` |
| the root README of the knowledge space | its read conditions into the `Project knowledge` section of `AGENTS.md`, then removed |
| a requirement | a plan or a task, chosen by the user |
| quality reports, findings, other knowledge | `knowledge/knowledge-<slug>.md` |
| a `FRAMEWORK.md` inside the knowledge space | `CONVENTIONS.md` |
| a scope README or `INDEX.md` below the root | merged into the reserved file or folder of its subject, then removed |
| an empty folder or a `.gitkeep` placeholder | removed; folders arise with their first entry |
| `type: history`, `HISTORY.md`, a superseded decision or policy, an `archive/` folder | proposed for deletion; Git keeps them |
| a task | keeps its name and folder under the backlog contract |
| the memory index | `memory/MEMORY.md` with `type: meta` |

Existing check statements of a test strategy move into `TESTING.md` verbatim. Add only what the project
evidences (scripts and their header documentation, help texts, CI configuration, task contracts) or the user
answers; invent no command. Check every moved command chain against the header documentation of its scripts
for executability. A statement that cannot be evidenced or executed goes to the user as a question in the
approval of the update and is not written.

Derive the slug from the old name without prefix and ID. Frontmatter delta: set the target `type` and its
default `edit` unless the found `edit` is stricter; remove `version`, `created` and `updated`;
remove `status` outside tasks, plans and project heads as well as `supersedes` and `superseded_by`. A file
whose type stays unclear or whose slug collides is a question to the user, never a new folder.

## 3. Approve

The mapping goes into the single approval of the update as one table: old path, new path, type, frontmatter
delta. List separately every deletion, every merge and every file with `edit: locked`. The user's approval
of this table covers moving and renaming locked files; it does not cover content changes to them.

## 4. Convert

1. Move with `git mv` so Git keeps each file's history.
2. Adjust frontmatter and carry out the merges.
3. Point every reference in the repo to the new paths. Leave historical records that name an old path as
   such unchanged, for example closed tasks.
4. Update the read conditions in `AGENTS.md`: one line per reserved file that exists.
5. Delete only what was approved for deletion.

## 5. Verify

Check that no folder exists outside the fixed set, no folder is empty, every reserved file stays within the
line limit, every file name starts with its type, every frontmatter matches the schema and no reference
points to an old path. Report counts per change kind, open questions and
remaining findings.
