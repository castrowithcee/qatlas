---
description: >
  Select executable tasks of a run, check them for execution readiness and ownership, and re-evaluate the
  selection after each task.
type: playbook
edit: locked
license: MIT
---

# Selecting tasks

A run processes at most as many tasks as the task limit of its mode allows. The limit bounds the run
horizon; it is not a commit count, not a subagent count, and not a statement about parallel tasks. The
number of `next` tasks does not change it. A larger `next` set keeps its existing order for later runs.

1. First read only the roster or external metadata of the chosen scope. Determine status, short state,
   order, dependencies, and ownership signals. For an explicitly chosen single task, read its current
   record directly.
2. First take executable `next` tasks in spine order. If fewer exist than the task limit allows, fill the
   run on your own with professionally fitting `ready` tasks of the same scope. Choose by satisfiable
   dependencies, professional value, early risk clarification, and sensible integration.
3. A selected `ready` task moves through `next` before it is claimed. `ready` and `next` are exclusive
   statuses; `next` presupposes full execution readiness.
4. Read only the selected tasks and their real blockers in full. Open comments or history only in case of a
   contradiction, missing decision-relevant rationale, or an explicit reference in the current record.
5. Re-check every task for the backlog norm's execution readiness immediately before claiming it. If it is
   not met, set it to `draft` or `waiting` under the norm's rules, inform the user concretely, and do not
   execute it. A technical difficulty or an additional file within the professional scope is not an open
   contract question.
6. Do not change an `in-progress` task with a running or unknown subagent or lead. First clarify its owner
   and work state. If another lead works in the same repo or planning system, claim only according to
   "Parallel work in a run".
7. For git, check root, branch, upstream, worktrees, and full status. Writing work begins only on a clean
   control branch unchanged since the preflight. Apply the git workflow before the first writing git step.

Do not plan the selection as an immutable batch. After each completed or securely handed-over task, the lead
re-evaluates selection, order, dependencies, and remaining run capacity.
