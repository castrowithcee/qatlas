---
description: >
  Shape variant for an existing task or a backlog section: build the inventory, mature drafts one by one,
  check dormant work and schedule the next horizon.
type: playbook
edit: locked
license: MIT
---

# Shape existing work

Existing tasks become an understandable, executable and deliberately ordered work supply again. The variant
changes planning and task contracts but does no substantive work; after an idea has been shaped, it is no
mandatory step before `run`.

`shape <unambiguous task>` selects exactly this task. `shape backlog [scope]` selects a task, a project or
another subset the planning system determines unambiguously, without scope the entire open backlog; do not
ask for a scope only because none was given. The main goal is to settle the open contract questions of its
drafts one by one and to set every clarified task to `ready`. This variant also checks dormant work,
prioritises scopes against each other and deliberately changes an existing `next` set. A draft that needs a
new examination and cut is worked on here at its existing place.

## Build the inventory

1. Resolve the scope in the authoritative planning system. From `AGENTS.md`, follow only the read
   conditions relevant to the scope and its open contract questions.
2. Read only roster or external metadata first: status, short state, order, dependencies, ownership and
   existing follow-ups.
3. Form separate candidate sets for `review`, `draft`, `waiting`, `ready` and `next`, and from the drafts, in
   substantively sensible order, the conversation queue. Read a task fully only when it is its turn; with a
   large inventory hold only a sensible section and the current task in context. Its size is no reason to
   stop after the overview or to skip drafts unchecked.
4. Change no `in-progress` task with a running or unknown worker.

## Schedule

Work in this order, as far as the scope contains the group:

1. **Mature drafts one by one.** Name the current task's concrete open contract question about result,
   scope-in, scope-out, approach, acceptance or execution basis, and answer it yourself from the current
   project state where it can be evidenced. Work the decisions, conventions and requirements that apply to
   the task concretely into goal, approach and verifiable acceptance; a source list alone is not enough. A
   question that needs the user goes to them as the next card; remove superseded variants when you work the
   answer in. Split a task that is not viable as a bounded assignment or holds independently acceptable
   results per the cutting block.
2. **Evidence maturity.** Set a task to `ready` once it reaches the backlog norm's execution maturity. If a
   question can only be answered by a work result that does not exist yet, leave it `draft` with the exact
   missing information; order or dependency alone does not evidence that immaturity.
3. **Human gates.** Settle real `review` handoffs here only if the user includes them explicitly in the same
   invocation.
4. **Dormant work.** Lift `waiting` only once its resumption signal has evidently occurred.
5. **Next horizon.** Preserve, form or consolidate the `next` queue per the horizon block.

## Close

Finish only when every initially selected draft is `ready`, stays `draft` with its concrete currently
unanswerable question, or was explicitly deferred by the user. The result of the closing block names how
many tasks are now `ready`, `next`, `draft`, `waiting` and `review`; its last line names the first executable
scope.
