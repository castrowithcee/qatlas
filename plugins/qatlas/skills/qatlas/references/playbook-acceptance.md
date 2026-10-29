---
description: >
  Accept task results yourself, classify failures, allow at most two corrections, and integrate the result
  together with its documentation effect.
type: playbook
edit: locked
license: MIT
---

# Accept and integrate

This procedure applies to anyone who accepts and integrates a task result: the lead of a run and the
integrator of a team.

## Verify acceptance

A success message from the implementer is not proof of completion. Whoever accepts checks result, diff and
evidence themselves, and beyond the criteria also whether the result substantively fulfills the goal of the
task. Reconcile every acceptance and every cross-cutting security boundary with the actual behavior; green
standard tests replace neither explicitly agreed edge cases nor a reference comparison. Check cross-cutting
invariants again at the latest when all milestones are integrated. Classify every failure:

- **Execution error:** A wrong path, typo, quoting or an unsuitable flag has not yet tested the solution.
  Correct the call once, in a targeted way. If the same error recurs, treat it as a missing prerequisite or
  a solution error, not as an unlimited new round.
- **Missing prerequisite:** Runtime, tool, permission, resource or user input is missing. Start no
  substitute approach. Secure the task immediately for `review` or `waiting`.
- **Solution error:** The approach was executed but does not meet an acceptance criterion. Derive a concrete
  correction from the diagnosis or new evidence.
- **Known flake:** A CI failure counts as a known flake, not as a solution error, only if the failing test
  lies outside the diff and is recorded in the planning system as a known flake with a task ID. Then restart
  the failed job at most once per pull request and name the rerun with this task ID in the closing. Assign a
  new occurrence to the existing task instead of recording it anew.
- **New flake:** A CI failure not yet recorded counts as a new flake only if (a) the failing test lies
  outside the diff, (b) it fails only in some jobs or platforms, (c) the others are green and (d) a targeted
  local run via `slot` is green. Then record it as a draft in the planning system, restart the failed job at
  most once per pull request, log the rerun with the new task ID and name it in the closing under newly
  recorded items (`Neu erfasst` in [the closing block](playbook-closing-block.md)). If the rerun fails again,
  it is a solution error. Every other CI failure remains a solution error.

## At most two corrections

The initial implementation attempt does not count as a correction, nor does its planned continuation after a
checked and secured milestone. After that, at most two targeted correction attempts in total are permitted
per task, even if several acceptance criteria are affected. Each correction needs new evidence and a change
derived from it; mere rewording, a different subagent or a new session does not reset the counter.

If the criterion is still unmet after the second correction:

1. Stop any further implementation of this task.
2. Secure the current diff, the evidenced cause, the two checked corrections and the still-violated
   acceptance compactly in the task.
3. Set the task to `review` and formulate the concrete user decision on prerequisite, change of approach,
   scope or postponement.
4. Start no checker or substitute subagent as a hidden third correction round.

If remaining tasks depend on this result, stop the entire run and hand the decision over to the user. Only
demonstrably independent tasks may continue serially within the remaining task limit.

## Integrate and close

Integrate the work of the active task, run its shared checks and maintain task, final report and spine per
the authoritative contract. Set it to `done` only when all criteria are evidenced on the control branch.
In doing so, reconcile the actual diff and the resulting behavior against the execution basis. Whoever
integrates decides on the documentation effect and carries over necessary changes before the task closing:

- Document only statements that a future maintainer must know to satisfy a requirement or to avoid a wrong
  decision. Describe no details that code and tests already reveal without a relevant wrong decision, and
  repeat neither task history, final report nor existing rules. Without such a statement, update no project
  documentation.
- Correct directly affected documentation that the implementation has made wrong, at the existing
  authoritative location with the smallest necessary change, and check it again.
- If the implementation introduces a cross-cutting obligation for future work in the scope or exposes a
  hidden coupling that must bind such work, record it in the existing project documentation with the smallest
  necessary statement, preferably with the affected decisions, requirements or the domain knowledge in
  `.qatlas-project/`. It then counts as a changed authoritative basis; a final report alone is not enough for
  this.
- If authoritative substantive documentation contradicts the intended result and could express a user
  decision, set the task to `review` instead of silently overwriting a page.
- Do not opportunistically change substantively unrelated faulty documentation; it is a side finding.
- A declared documentation effect `Ändern` or `Prüfen` is an acceptance criterion. `Keine` remains valid only
  if the actual diff invalidates no related statement.

If the user has to decide, check or act, set the task to `review`. If an external prerequisite, resource or
environment prevents continuation, set it to `waiting` per the authoritative status model. An unmet internal
task dependency does not change the status; the order in the spine suffices.
