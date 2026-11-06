---
name: qatlas-core-navigation
description: >
  Open up project knowledge selectively as soon as a task needs context from the repo: entry via AGENTS.md
  and its read conditions, the reserved files CONVENTIONS.md, ARCHITECTURE.md, TESTING.md and
  CONTRIBUTING.md, scope READMEs and FRAMEWORK.md, search via frontmatter, reading memory, the local
  backlog's roster and ideas. Not for creating, changing or moving files.
license: MIT
---

# qatlas-core-navigation

Derive the working context from the task instead of presupposing a target path, and read only what the task
needs.

## Cascade

1. Start with `AGENTS.md` at the repo root. Its `Project knowledge` section names the reserved files of
   `.qatlas-project/` with their read conditions; follow only those that fit the task. A reserved file that
   exists without a line there still applies under its default read condition.
2. Use the task and those files for the next relevant scope. Read a scope's `README.md` on first entry when
   it serves as the entry for this scope, and follow only fitting read conditions. If it points to a
   neighbouring `FRAMEWORK.md` for the current work, read that before working.
3. If no such entry exists, keep searching normally and check only scopes actually entered. Do not scan the
   tree as a precaution.
4. Do not read the same node again as long as it has not changed.

Within a chosen scope, search `description`, `tags`, `type` and `status` of the frontmatter first, then open
only the bodies of matching hits, and only then widen to full text.

## Validity of what you read

- A scope README describes scope, brief orientation and next sources. A `FRAMEWORK.md` next to it holds
  the confirmed working rules, particularities and exceptions of that domain scope only. Local routing wins
  over a shipped starting point.
- Place, reading order or automatic provision give content no extra authority. Rank every statement by
  native instruction hierarchy, explicit validity and subject scope.
- The reserved files of `.qatlas-project/` bind every initiative until the user changes them. Before
  planning, shaping or executing work, read those whose read condition the work meets.
- The current version of a file applies. Earlier versions in Git serve only for restoring; read them only to
  restore something or when the user asks for the history. A plan with `status: done` no longer guides
  current work.
- Domain READMEs, frameworks and `INDEX.md` files outside the knowledge space keep their local purpose.
  Domain content outside the knowledge space stays authoritative for its subject.

## Choose the operation

Read the operation's reference fully before the operation:

- Memory, roster, ideas: [Read project state](references/project-state.md)
