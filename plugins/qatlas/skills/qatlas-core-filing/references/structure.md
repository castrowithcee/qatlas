---
description: >
  Layout of the project knowledge space .qatlas-project/: AGENTS.md as entry, the reserved root files with
  their mission and read condition, the fixed folders with their types, the ban on further folders, the line
  limit, zones, FRAMEWORK.md outside the space, file names and task IDs.
license: MIT
type: policy
edit: locked
---

# Project knowledge space

`.qatlas-project/` is the versioned, repo-owned state of knowledge and work. It holds how the project is
built, checked, worked on and maintained. The domain content of the repo stays at its authoritative place:
in a personal OS, policies on further training or finances live outside, policies on structure and
maintenance of the collection inside. Existing specifications and documentation trees are not duplicated.
Outside the knowledge space the existing local structures apply and are not reordered to this layout. Only
the two zones stay unversioned; a user decision may gitignore the whole knowledge space locally.

## Entry

The repo's `AGENTS.md` is the entry. Its section `Project knowledge` names every reserved file that exists,
each with the read condition that says before which work it is read. There is no README in the knowledge
space. When a reserved file is created, add its line to `AGENTS.md`; when it is removed, remove the line.

## Reserved root files

Every reserved file has one mission and a fixed name. Nothing is invented beside them: content that fits a
mission goes into that file, content that fits none is a question to the user. Setup creates none of them;
each arises with its first entry and stays lean. A reserved file holds only what code, tests, linters and
hooks do not already enforce.

| File | Mission | Default read condition | `type` |
|---|---|---|---|
| `CONVENTIONS.md` | how work is done: code style, naming, patterns, filing, forbidden practices | before writing code or files | `policy` |
| `ARCHITECTURE.md` | how the system is built: modules, data flows, dependencies, boundaries, with the reason of each binding decision | before changing structure, modules or interfaces | `knowledge` |
| `TESTING.md` | how the project is checked: the project test strategy with commands, tiers, evidence, resources, coverage expectations and what must be green before a commit or handover | before running checks or changing tests or CI | `policy` |
| `CONTRIBUTING.md` | how changes land: branch pattern, control branch and its protection, pull request integration and platform, merge form, definition of done | before branching, committing or opening a pull request | `policy` |

What must hold in every session, such as purpose, boundaries, visibility and the read conditions, stays in
`AGENTS.md`; what holds across all projects stays in the user's library. A decision is worked into the
reserved file it concerns, with its reason; there is no register of decisions, and superseded content is
replaced, not archived.

## Line limit

A reserved file stays at most 300 lines including frontmatter. Beyond that, move details into the folder
of the same name in lower case, for example `conventions/`, and keep the file as the entry that points
into it; cut by subject, not by date. Doctor reports a file over the limit and changes nothing.

## Fixed folders

Setup creates only `backlog/BACKLOG.md` and, unless the plugin configuration disables repo memory
(`memory.enable: false`), `memory/MEMORY.md`. Every other folder is created together with its first entry.
Without `.qatlas-project/` the project is deliberately not set up: create none of its files, whatever the
configuration says; setup is the user's explicit step. Each folder holds exactly the listed types:

| Folder | Content | `type` |
|---|---|---|
| `backlog/` | routing to the authoritative planning system and, if local, its work packages | `meta`, `task` |
| `memory/` | lasting hints that cannot be derived elsewhere, with their index `MEMORY.md` | `memory`, `meta` |
| `plans/` | initiatives cut into tasks, kept as reference | `plan` |
| `knowledge/` | domain knowledge, synthesis and snapshots of external sources | `knowledge`, `fact` |
| `playbooks/` | repeatable procedures | `playbook` |
| `templates/` | the user's own templates; Qatlas places and updates nothing there | as the template's target |
| `conventions/`, `architecture/`, `testing/`, `contributing/` | details moved out of the reserved file of the same name, which stays the entry | as that file |
| `zone-import/` | gitignored buffer for untrusted raw material | none |
| `zone-export/` | gitignored buffer for explicitly requested deliverables only | none |

Never create another folder or subfolder in the knowledge space unless the user explicitly asks for it.
Exceptions are the structure the backlog contract defines inside `backlog/` and
`zone-import/processed/<yyyy-mm>/`. Content that fits no folder and no reserved file is a question to the
user, not a reason for a new folder.

- Update existing memories instead of duplicating them. New memories also arise on the user's explicit
  request and get exactly one index line. With `memory.enable: false` create no memory files.
- Only successfully processed originals move from `zone-import/` to `processed/<yyyy-mm>/`. Archiving an
  original is routine, emptying a zone is a deletion. Never place anything in `zone-export/` on your own.
- Large or changing binaries belong in a file store or Git LFS, not permanently in a zone.
- Technical project configuration and the check state of project-related plugin updates live under
  `.qatlas/plugins/`, checkout-local runtime state under `.qatlas/local/`; neither belongs to the knowledge
  space.

## FRAMEWORK.md

A `FRAMEWORK.md` exists only outside the knowledge space, next to the README of a domain scope, mostly in
text repos such as Obsidian vaults, Markdown collections or a personal OS. Propose it to the user and create
it only after their agreement, once the scope has confirmed working rules, particularities or exceptions of
its own. The README of that scope names the work for which it must be read beforehand. It contains no
general domain knowledge and repeats neither native project instructions nor single policies. Working rules
for the project as a whole belong in `CONVENTIONS.md`.

## File names

Content files are named `<type>-<slug>.md`; the prefix is always the frontmatter `type`. Only tasks carry an
ID: `task-<id>-<slug>.md`. Reserved files and `meta` files keep their reserved names without a prefix. The
slug is kebab-case and unique per type across the knowledge space. Renaming it is a restructuring with all
references.

The task ID is a sequential decimal number across the whole knowledge space, including backlog projects.
Find all existing task IDs:

```sh
find .qatlas-project -type f -name 'task-*.md' | grep -E '/task-[0-9]{4,}-[^/]*$'
```

Choose one more than the highest value and pad to at least four digits; without a match it starts at
`0001`. Check again for collisions before writing and before integrating. With parallel new entries, the
entry not yet integrated takes the next free ID together with adjusted references. IDs are never reused and
never renumbered for cosmetics. Task IDs of another form count for nothing and stay unchanged.

Files with an older name or folder stay valid and unchanged until `qatlas-core update` migrates
them. Function files, technical formats and raw zone artefacts follow their fixed names or own formats.
Name the scope when a function name is ambiguous.
