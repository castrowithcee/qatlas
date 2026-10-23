---
description: >
  Serial autonomous work run for, by default, at most five executable tasks: an orchestrator dispatches,
  monitors and integrates exactly one active task at a time, which subagents implement with one bounded
  assignment each, and hands it over to the user in a secured state after at most two unsuccessful
  corrections.
type: playbook
edit: locked
license: MIT
---

# Execute work

From an explicitly chosen task, project or backlog scope come integrated, evidenced results or concrete
human handovers. The initial agent is the orchestrator. It holds scope, spine, task selection, subagents,
evidence, integration and stop conditions; the subagents carry out the substantive work.

Within the chosen scope, the invocation alone authorizes subagents, local changes, checks, isolated
worktrees and local commits. It authorizes no push, no publish, no deployment, no message to third parties
and no other external or irreversible effect. It receives the permission to edit locked project documentation
(`Freigabe für gesperrte Projektdokumentation`) under the shared contract in [the Qatlas skill](../../SKILL.md).
Only the primary orchestrator sends closing messages; subagents send no message when
they report completion.

## Invocation

`run [task, project or backlog] [--limit <n|all>] [--fly] [run directive]`

- **Without `--limit`:** The task limit is five.
- **`--limit <n|all>`:** Sets the task limit to `n` or, with `all`, to all executable tasks of the scope. If
  it is above five, after each completed or securely handed-over task check whether your context can still
  safely carry another complete task including integration and the final report. If it has already been
  compacted or foreseeably will not suffice, end the run regularly at this task boundary.
- **`--fly`:** The user is unreachable during the run; [`--fly` in the run](flag-fly.md) applies.

## Reading list

The blocks repeat nothing from this file or from each other; what you do not read is missing in this run.
Read each one completely at the stated time:

1. **Before the first step:** [the backlog norm](../../../qatlas-core-backlog/SKILL.md), [checking the
   orchestration](../../references/playbook-orchestra-config.md) and [selecting
   tasks](../../references/playbook-task-selection.md). With `--fly`, additionally the flag file from
   "Invocation" and [deciding without the user](../../references/playbook-autonomy.md).
2. **When `orchestra.yaml` is missing, invalid or a model looks doubtful:** [setting up the
   orchestration](../../references/playbook-orchestra.md).
3. **Before the first writing git step:** [the git workflow](../../references/playbook-git-workflow.md),
   [the git norm](../../../qatlas-core-git/SKILL.md) and its
   [commit reference](../../../qatlas-core-git/references/playbook-commit.md).
4. **Before a task branch or worktree is created:** [the
   worktree contract](../../../qatlas-work/references/worktree-contract.md).
5. **When several subagents write at the same time, a task is taken over or resumed, or further
   orchestrators work in the same repo or planning system:** [parallel work in a
   run](../../references/git-parallel.md).
6. **Before the first subagent assignment:** [executing a task](playbook-task-execution.md).
7. **Before the first acceptance:** [accepting and integrating](../../references/playbook-acceptance.md).
8. **When in doubt about commit cutting and before a checkpoint:**
   [the commit boundary](../../../qatlas-core-git/references/commit-boundaries.md).
9. **If user or project instructions require pull requests, before the first push:** [integration via pull
   requests](../../references/playbook-git-pr.md).
10. **Before the final report:** [the closing block](../../references/playbook-closing-block.md).

## Define the run contract

Determine before the first change:

1. **Goal:** Which observable state ends the run successfully?
2. **Scope-in:** Which tasks, repos, paths and systems belong to the invocation?
3. **Scope-out:** Which neighboring goals, paths and effects stay excluded?
4. **Spine:** Which planning system durably holds status, dependencies, findings and handovers?
5. **Evidence:** Which tests, states or artifacts prove completion?
6. **Limits:** Which action necessarily requires the user?

If a prescribed external planning system is unreachable, stop before writing work and name the concrete
obstacle.

The run contract makes the chosen scope concrete but does not replace its elaboration. `run` checks the
execution basis for currency and for environment and git prerequisites; it is not meant to discover the
substantive scope only through a new initial analysis. A state that has changed since `shape` is
nevertheless a normal finding and is handled under the maturity rules of task selection. A merely large task
does not automatically become an assignment for a stronger model.

## Procedure

1. Check the orchestration and select the tasks. Before the first task, check the free space of the file
   system holding the repo against the threshold named in the project instructions, else 5 GB. Below it, run
   the cleanup step for low space named there; if that does not suffice or none is named, do not start and
   name the concrete obstacle.
2. Claim exactly one task, have it implemented, accept it and integrate it.
3. Record side findings before you begin the next selected task.
4. Repeat selection, implementation and integration until the task limit is reached or a stop condition
   occurs.

## Stop conditions

End the run as soon as one of these conditions holds:

- The task limit is reached: that many tasks were completed or securely handed over.
- With a raised task limit, the orchestrator's context cannot carry another complete task.
- The chosen scope is completely and demonstrably finished.
- The scope contains neither an executable `next` nor an executable `ready`.
- A failed task blocks the remaining work.
- Only work with unmet dependencies, `waiting`, `draft` or human handover remains.
- A scope, risk, external-effect or permission boundary is reached.
- Claim, ownership or integration ownership of a needed task is not unambiguously evidenced.
- The control branch has been changed by someone else since the preflight.

## Closing

Before the end, secure the spine, final reports, side findings and permitted local commits. The user usually
continues a run in a new session. Every handover therefore appears in the spine with its task ID, and the
closing is understandable without the course of the run. Report the result and the decisive evidence
briefly. For each processed task, name changed files, checks run, documentation effect, deviations from the
expected work card and unresolved risks, as well as the worker profiles used with model and effort; raw logs
stay out. Run the cleanup steps that native project instructions or project memory name for the end of a
run, and name them in the report.
