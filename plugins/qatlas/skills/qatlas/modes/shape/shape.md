---
description: >
  Entry to shape: variants by scope, the --fly flag, reading list and the shared contract of all shape runs
  from the planning system to the collective commit.
type: playbook
edit: locked
license: MIT
---

# Shape

`shape` turns an idea, a file, a task or a backlog section into execution-ready work with a reasoned order.
Examining what exists, asking questions and necessary documentation serve this cut; the planned work is not
implemented.

## Invocation

- `shape [idea or file path]` works per [shaping an idea](option-idea.md).
- `shape <unambiguous task> [--fly]` and `shape backlog [scope] [--fly]` work per [shaping existing
  work](option-backlog.md). After `shape`, the word `backlog` is a reserved scope, not an idea. `shape
  backlog` without further scope covers the entire open work supply.
- **`--fly`:** The user is unreachable during the run; [`--fly` in shape](flag-fly.md) applies. It exists only
  for existing work, because an idea needs the user's intent.

For an idea, a file or a single task, `shape` receives the permission to edit locked project documentation
(`Freigabe für gesperrte Projektdokumentation`) under the shared contract; `shape backlog [scope]` does not.
If a task there requires a change to `edit: locked`, obtain the explicit permission needed for it.

## Reading list

The blocks repeat nothing from this file or from each other; what you do not read is missing in this run.
Read each one completely at the stated time:

1. **Before the first step:** the file of your variant from "Invocation" and [the backlog
   norm](../../../qatlas-core-backlog/SKILL.md). With `--fly`, additionally the flag file from "Invocation"
   and [deciding without the user](../../references/playbook-autonomy.md).
2. **Before the first cut, split or working-in of a task:** [cutting tasks](playbook-task-cut.md).
3. **Before maintaining the `next` queue:** [scheduling the next horizon](playbook-horizon.md).
4. **Before the first presentation of a real user decision, with `--fly` before recording the first one:**
   [presenting decisions briefly](../../references/playbook-decision-card.md).
5. **Before the collective commit:** [the git norm](../../../qatlas-core-git/SKILL.md) and its [commit
   reference](../../../qatlas-core-git/references/playbook-commit.md).

## Planning system

First clarify where the user manages work. Use the backlog binding loaded at session start and the native
project instructions. An external system takes precedence with its fields, IDs, statuses and write paths.
Create neither a local substitute nor a mirror backlog. If the authoritative system is unreachable, the
shaping may continue in conversation; do not report work packages as created there, though.

Only without another directive does the local Qatlas backlog apply. If its scaffold is missing, point to
`qatlas-core setup` before you write under `.qatlas-project/`.

## Decisions and analysis

If a real user decision on an existing or emerging task remains open after your own examination, guide the
user through the shared decision dialogue without assuming that they read the tasks in parallel. Free
questions with which the user first describes an intent not yet formulated are not affected by this.

The explicit invocation authorizes subagents for separate analysis of the existing state, gathering of
evidence, risk checks and an independent completeness check. Delegate only independent questions with real
added value. Subagents write no tasks, make no product decision and build no competing plan; the main agent
brings findings, conversation, documentation and package cut together. A commissioned subagent for the
existing state works read-only and returns at least the initial state, entry points, expected change
surfaces, check paths, documentation effect, open contract questions and a reasoned recommendation for
`draft` or `ready`. Small packages that are already clearly evidenced need no subagent; the execution basis
stays mandatory nonetheless.

## Limits and closing

In this mode, never set `in-progress` or `done`, begin no implementation and execute no task. `next`
prepares the coming horizon but authorizes no execution.

In every variant, `shape` ends with exactly one local collective commit per affected repo over the files
changed in this run, so that a following `run` starts from a clean state. The explicit invocation replaces
the individual approval of the message for this; show message and ID afterwards and push nothing. You do not
start the run yourself.
