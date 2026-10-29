---
description: >
  Layout of the project knowledge space .qatlas-project/: fixed folders with their types, the ban on further
  folders, the root README, zones, FRAMEWORK.md outside the space, file names and task IDs.
license: MIT
type: policy
edit: locked
---

# Project knowledge space

`.qatlas-project/` is the versioned, repo-owned state of knowledge and work. It holds purpose, layout,
architecture, policies and plans about the project and its maintenance. The domain content of the repo
stays at its authoritative place: in a personal OS, policies on further training or finances live outside,
policies on structure and maintenance of the collection inside. Existing specifications and
documentation trees are not duplicated. Outside the knowledge space the existing local structures apply and
are not reordered to this layout. Only the two zones stay unversioned; a user decision may gitignore the
whole knowledge space locally.

## Fixed folders

Setup creates every folder below. Each folder holds exactly the listed types:

| Folder | Content | `type` |
|---|---|---|
| `backlog/` | routing to the authoritative planning system and, if local, its work packages | `meta`, `task` |
| `memory/` | lasting hints that cannot be derived elsewhere, with their index `MEMORY.md` | `memory`, `meta` |
| `plans/` | initiatives cut into tasks, kept as reference | `plan` |
| `policies/` | binding settings of the user, one file per context | `policy` |
| `policies/conventions/` | policies on how work in this project is done | `policy` |
| `architecture/` | description of the current architecture | `knowledge` |
| `knowledge/` | domain knowledge, synthesis and snapshots of external sources | `knowledge`, `fact` |
| `playbooks/` | repeatable procedures | `playbook` |
| `templates/` | the user's own templates; Qatlas places and updates nothing there | as the template's target |
| `zone-import/` | gitignored buffer for untrusted raw material | none |
| `zone-export/` | gitignored buffer for explicitly requested deliverables only | none |

Never create another folder or subfolder in the knowledge space unless the user explicitly asks for it.
Exceptions are the structure the backlog contract defines inside `backlog/` and
`zone-import/processed/<yyyy-mm>/`. Content that fits no folder is a question to the user, not a reason for
a new folder.

- Update existing memories instead of duplicating them. New memories also arise on the user's explicit
  request and get exactly one index line.
- Only successfully processed originals move from `zone-import/` to `processed/<yyyy-mm>/`. Archiving an
  original is routine, emptying a zone is a deletion. Never place anything in `zone-export/` on your own.
- Large or changing binaries belong in a file store or Git LFS, not permanently in a zone.
- Technical project configuration and the check state of project-related plugin updates live under
  `.qatlas/plugins/`, checkout-local runtime state under `.qatlas/local/`; neither belongs to the knowledge
  space.

## Root README

`.qatlas-project/README.md` is the only README in the knowledge space apart from project heads under the
backlog contract. It explains the project state, names
the folders, delimits the domain content of the repo and names its actual entry points with unambiguous
read conditions. Including frontmatter it stays at most 80 lines and 500 whitespace-separated words. Move
details out without cutting binding statements. Read an existing longer README fully and report it as a
finding instead of truncating it. Create no `INDEX.md` in the knowledge space. Authority to maintain
navigation creates no new rule authority and does not permit changing the project's intent.

## FRAMEWORK.md

A `FRAMEWORK.md` exists only outside the knowledge space, next to the README of a domain scope, mostly in
text repos such as Obsidian vaults, Markdown collections or a personal OS. Propose it to the user and create
it only after their agreement, once the scope has confirmed working rules, particularities or exceptions of
its own. The README of that scope names the work for which it must be read beforehand. It contains no
general domain knowledge and repeats neither native project instructions nor single policies. Working rules
for the project as a whole are policies in `policies/conventions/`.

## File names

Content files are named `<type>-<slug>.md`; the prefix is always the frontmatter `type`. Only tasks carry an
ID: `task-<id>-<slug>.md`. `meta` files keep their reserved names without a prefix. The slug is kebab-case
and unique per type across the knowledge space. Renaming it is a restructuring with all references.

The task ID is a sequential decimal number across the whole knowledge space, including backlog projects.
Find all existing task IDs:

```sh
find .qatlas-project -type f -name 'task-*.md' | grep -E '/task-[0-9]{4,}-[^/]*$'
```

Choose one more than the highest value and pad to at least four digits; without a match it starts at
`0001`. Check again for collisions before writing and before integrating. With parallel new entries, the
entry not yet integrated takes the next free ID together with adjusted references. IDs are never reused and
never renumbered for cosmetics. Task IDs of another form count for nothing and stay unchanged.

Files with an older name or folder stay valid and unchanged until `qatlas-core migrate` converts
them. Function files, technical formats and raw zone artefacts follow their fixed names or own formats.
Name the scope when a function name is ambiguous.
