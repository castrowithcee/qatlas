---
description: >
  Contract of the local Qatlas backlog for tasks, projects, status, roster, handovers and ideas.
license: MIT
type: policy
edit: locked
---

# Local backlog

## Tasks and projects

- A task is a unit of work that can be done on its own in one session, in
  `.qatlas-project/backlog/task-<id>-<slug>.md`. The ID follows the task IDs of the
  [project knowledge space](../../qatlas-core-filing/references/structure.md).
- A project is an optional folder `backlog/<project>/` with its own tasks and `README.md`. Its slug is
  kebab-case, does not start with `task-` and is not `done`. If the project implements a plan, its head
  links to `.qatlas-project/plans/plan-<slug>.md` instead of repeating goal and scope.
- Folder membership determines project membership; there is no `project:` field.
- Real dependencies and order are in the roster. A link replaces no context the task needs to be executed on
  its own.

## Current task state

An open task is the compact, materialised current state of its work, not a running journal. It stays
executable on its own in one complete reading:

- Why, result, scope, applicable guardrails, dependencies, current approach and acceptance criteria contain
  only statements that still hold. Work a settled decision in at its proper place and thereby remove
  outdated alternatives. A decision that binds beyond the task belongs as a policy in `.qatlas-project/policies/`.
- For work on an existing system, the task records the execution basis according to the execution maturity
  of the backlog norm.
- The section `Abschlussbericht` is the only status-dependent handover point. At `review` it holds only the
  current human handover, at `waiting` reason, resumption signal, verified state and next step, and at
  `done` the compact final report. Replace and consolidate its previous content at a transition instead of
  appending run reports or finished review cards.
- Raw logs, complete command output, general communication, discarded attempts and a chronology not needed
  for the next step do not belong in the task. Git history is the record of the past.
- References to stable repo sources may summarise their content briefly instead of duplicating it fully. All
  boundaries and decisions needed for the concrete execution still stay in the task.

Never cut by a hard token, line or character limit. If even the still valid task contract can no longer be
executed in one session, cut the remaining work anew deliberately; remove no binding decision or necessary
reason just for a smaller file.

Before a new task read [the canonical task template](../../../store/backlog/task.md) fully, before a new
project head also [the canonical project template](../../../store/backlog/project-readme.md). These
templates apply even without the planning skill; user templates under `.qatlas-project/templates/` do not
replace them.

## Status and ownership

Normal path: `draft -> ready -> next -> in-progress -> done`.

Permitted back and handover paths:

- `draft -> waiting`
- `ready -> draft | next | waiting`
- `next -> ready | draft | in-progress | waiting`
- `in-progress -> next | draft | review | waiting | done`
- `review -> next | draft | waiting | done`
- `waiting -> draft | ready | next`

- `draft`: The work package itself has an open question on result, scope-in, scope-out, approach,
  acceptance or an unexamined current state that could materially change these points.
- `ready`: Ready for execution by the backlog norm, but not part of the next execution horizon.
- `next`: Also ready for execution and additionally scheduled for the coming execution horizon. The roster
  determines order and dependencies.
- `in-progress`: A running execution has claimed it. Without a visible worker, first clarify ownership and
  move the task to another status by its actual next step.
- `review`: The next step is a concrete decision, check or acceptance by the user.
- `waiting`: An external precondition, resource or event prevents continuation. Reason and resumption signal
  must be concrete; an unfinished internal task dependency alone is not enough.
- `done`: Acceptance criteria met, agreed checks verified, documentation impact handled and no open
  question.

Deliberately deferred but still executable work stays `ready` and is not scheduled into `next`. It needs no
status of its own.

An existing `next` order is a deliberate work disposition and is not silently displaced or reordered. Tasks
selected automatically later follow behind it. `next` authorises no execution. The size of the horizon
determines neither parallelism nor the scope of a single run.

Every task carries exactly one status. In the local backlog `next` is no additional queue field next to
`ready`; it replaces `ready` while the task belongs to the next horizon. In content, `next` still implies the
full execution maturity of `ready`.

Set a claimed task to `in-progress` immediately before the first writing execution and maintain its roster
in the same step. A mere survey does not claim it yet.

Technical difficulty alone makes a task neither `draft`, `review` nor `waiting`. A historically archived task
may keep `final` until its file is edited for another reason; it is then brought fully to the current norms
and `done`.

Completion is one step: `status: done`, final `Abschlussbericht` and moving to `done/`. A `done` task lies
only there. If status and roster contradict each other, the status wins.

Project heads use `active -> final -> archived` independently of this. Their `active` means that the project
is alive, not that a worker is on it.

## Roster

`BACKLOG.md` is the only overview. It holds one line per unfinished root task and project: link, status and
brief state. Project lines point to their `README.md`. Within an order that is admissible for the subject,
tasks stand as `review`, `in-progress`, `next`, `waiting`, `ready`, `draft`; project lines follow their
subject order. Finished root tasks drop out; projects may keep their build record.

## Ideas

`IDEAS.md` is the separate inventory of non-binding ideas. It carries no task IDs, date fields or status.
When an idea deliberately becomes work, first create the complete task or project and then remove the adopted
idea entry.
