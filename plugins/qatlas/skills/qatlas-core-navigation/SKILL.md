---
name: qatlas-core-navigation
description: >
  Open up project knowledge selectively as soon as a task needs context from the repo: entry via
  .qatlas-project/README.md and scope READMEs, read conditions, policies and FRAMEWORK.md, search via
  frontmatter, reading memory, the local backlog's roster and ideas. Not for creating, changing or moving
  files.
license: MIT
---

# qatlas-core-navigation

Derive the working context from the task instead of presupposing a target path, and read only what the task
needs.

## Cascade

1. Start at the repo root after the native project instructions.
2. If `.qatlas-project/README.md` exists, read it as the entry into the repo-owned project state.
3. Use task and README for the next relevant scope. Read its `README.md` on first entry when it serves as the
   entry for this scope, and follow only fitting read conditions. If it points to a neighbouring
   `FRAMEWORK.md` for the current work, read that before working.
4. If no such entry exists, keep searching normally and check only scopes actually entered. Do not scan the
   tree as a precaution.
5. Do not read the same node again as long as it has not changed.

Within a chosen scope, search `description`, `tags`, `type` and `status` of the frontmatter first, then open
only the bodies of matching hits, and only then widen to full text.

## Validity of what you read

- A README describes scope, brief orientation and next sources. A `FRAMEWORK.md` next to it holds the
  confirmed working rules, particularities and exceptions of that domain scope only. Local routing wins over
  a shipped starting point.
- Place, reading order or automatic provision give content no extra authority. Rank every statement by
  native instruction hierarchy, explicit validity and subject scope.
- The policies in `.qatlas-project/policies/` bind every initiative until the user changes them. Before
  planning, shaping or executing work, read those that touch it.
- The current version of a file applies. Earlier versions in Git serve only for restoring; read them only to
  restore something or when the user asks for the history. A plan with `status: done` no longer guides
  current work.
- Domain READMEs, frameworks and `INDEX.md` files outside the knowledge space keep their local purpose.
  Domain content outside the knowledge space stays authoritative for its subject.

## Choose the operation

Read the operation's reference fully before the operation:

- Memory, roster, ideas: [Read project state](references/project-state.md)
