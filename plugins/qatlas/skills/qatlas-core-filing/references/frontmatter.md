---
description: >
  Frontmatter schema for content Markdown files: description, the nine content types and how to tell them
  apart, edit rights, required fields and in-place versioning.
license: MIT
type: rule
edit: locked
---

# Frontmatter schema

Every content Markdown file starts with frontmatter. The two zones stay free of it. Files that follow an
official agent standard, such as `SKILL.md`, agent-native commands and agent instruction files like
`AGENTS.md`, follow that standard and carry neither `type` nor `edit`.

## Search fields

`description` is one short, self-contained sentence on subject and purpose with the distinguishing search
terms. Area and topic are in the path. Write it as a folded block scalar:

```yaml
description: >
  Subject and purpose of the file as one sentence with the decisive search terms.
```

Optional `tags` are a list of lowercase kebab-case values, not a second search text.

## Types

`type` tells how to handle a file without reading its content. Check the questions in this order; the first
match decides:

| Order | `type` | Question | Default `edit` |
|---|---|---|---|
| 1 | `task` | Is it a work package to be done? | `shared` |
| 2 | `meta` | Is it a file that exists because Qatlas brings it into the project: navigation, index, planning entry or scope framework? | `shared`; `FRAMEWORK.md` `locked` |
| 3 | `plan` | Is it an initiative that can be completed? | `shared` |
| 4 | `decision` | Did the user settle it, and does it hold until the user changes it? | `locked` |
| 5 | `rule` | Does it always bind the agent's behaviour? | `locked` |
| 6 | `playbook` | Does it describe steps for how to do something, for a human or an agent? | `shared` |
| 7 | `fact` | Does it reproduce an external source? | `shared` |
| 8 | `memory` | Is it a short hint for later sessions? | `shared` |
| 9 | `knowledge` | Anything else: domain knowledge, synthesis, description of the current architecture. | `shared` |

- **Plan or decision:** A plan has an end. It records an initiative ("buy a mountain bike") as a reference;
  the tasks cut from it decide the concrete work. A decision has no end. It holds ("the bike is red") and
  binds every later initiative until the user changes it. Whatever a plan settles for good becomes a
  decision, and the plan links to it instead of repeating it.
- **Decision or rule:** A decision belongs to its project or scope and carries its reason. A rule is a
  standing norm for agent behaviour across work, as shipped by Qatlas or kept in the user's library.
- **Playbook or skill:** A playbook is content anyone can follow. A skill is an agent-standard `SKILL.md` and
  outside this schema.

Repo knowledge takes precedence over training knowledge. `fact` stays bound to its external source,
`decision` to a decision by the user. The agent never records its own decision as `decision`; an open
question stays in its plan or task until the user settles it.

## Edit rights

`edit` states the permitted maintenance independently of `type`. `edit: locked` protects decisions and
genuinely normative or instructing content; change it only with approval and in place. `edit: shared` lets
agent and user maintain the file in the authorised workflow, but never changes the project's intent without
a matching user decision. Follow the default from the table and deviate only for a stated reason. Never
remove an existing `locked` wholesale; classify content by content and obtain the required approval.
Neither renaming, moving, `type`, folder nor merely reading changes edit rights, scope or rank of a
statement.

## Fields

`description`, `type` and `edit` are always present. The additional fields are exhaustive:

| `type` | Additional fields |
|---|---|
| `meta` | none; a project head in the local backlog adds `status` |
| `task` | `status`, `created`, `updated` |
| `plan` | `status` (`active` or `done`), `version`, `created`, `updated` |
| `decision`, `playbook`, `knowledge`, `memory` | `version`, `created`, `updated` |
| `rule` | `version`, `created`, `updated`, optional `paths` |
| `fact` | `version`, `created`, `updated`, optional `source` |

Dates are `YYYY-MM-DD`. Task status values belong to the local backlog contract. A plan is `done` once it is
fulfilled or dropped; it then no longer guides current work, and what holds from it stands in its decisions.
Fixed `meta` targets are the root README of the knowledge space, `BACKLOG.md`, `IDEAS.md`, `MEMORY.md`, a
project head in the local backlog and a `FRAMEWORK.md` outside the knowledge space.

A shipped copy-ready template under `store/` or `skills/*/assets/` may already carry the frontmatter of its
target when its body names the concrete target file and requires all placeholders to be replaced before
writing. Judge its frontmatter against that target. The exception applies neither to ordinary content files
nor to user-owned templates.

## Versioning

There is exactly one valid file per subject, never a copy with a version in its name.

- Every file with `version` is changed in place. `version` is a whole number from `1`. Every change of
  content raises it by one and sets `updated` to the date of the change. Pure corrections of form, typos or
  references change neither field.
- A decision changes only on a decision by the user, in place and with a new `version`. A file per context
  may grow by further decisions of the same context.
- A plan raises `version` whenever it sharpens.
- The current version applies until the user decides otherwise. Earlier versions live in Git only for
  restoring; read them only to restore something or when the user asks for the history.
- Shipped plugin text is versioned by the plugin version and carries no `version` or `created`; a shipped
  `fact` keeps only `updated` as the date of its last check against the source.

When an existing file lacks these fields, add them silently as soon as you write the file, even under
`edit: locked`; they change no statement. The state found becomes `version: 1`, `created` from the date of
the file's first commit and `updated` from its last commit, without Git history both from today. If the
same write changes content, `version: 2` with today's date follows.

## Invariants

1. Change `type` afterwards only after asking. Set `edit` by actual bindingness and maintenance authority,
   not by `type`, path or file name alone.
2. Do not mix framework (`meta`, `rule`) and content types in the same file.
3. A file has one `edit`, set by its strictest material. Do not mark sections individually.
4. Do not split a file artificially just for its frontmatter.
5. Change a `fact` only together with its source.

Minimal form for `knowledge`:

```yaml
---
description: >
  Subject and purpose of the file as one sentence with the decisive search terms.
type: knowledge
edit: shared
version: 1
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Shipped Qatlas text may carry `license`; project content does not.
