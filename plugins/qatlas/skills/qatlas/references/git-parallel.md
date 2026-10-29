---
description: >
  Supplementary git rules for Qatlas Run when subagents write concurrently, when a task is taken over or
  resumed, and when several leads are active.
type: rule
edit: locked
license: MIT
---

# Parallel work in a run

## Concurrent writers of a task

- **Sub-branch:** the private branch of exactly one writing subagent within exactly one task. The lead
  creates it from the current tip of the task branch with its own worktree, assigns it, and integrates it
  into the task branch individually. Afterwards the lead runs the task's shared checks on the task branch.
  Never branch a sub-branch from an uncleaned checkpoint.
- Read-only analysis and reviews may share a working tree as long as they demonstrably change nothing.
- A worktree separates only working files, index, and `HEAD`. Refs, objects, stash, hooks, and repo
  configuration are shared by all worktrees of a repo; ports, databases, build outputs, caches, and ignored
  files are further collision surfaces. Give each concurrent writer its own instance of every such surface
  it uses, or serialize their use. If a tool needs real repo or security isolation, name a separate clone or
  a sandbox as a prerequisite.
- If work on the same files, invariants, or migrations overlaps so that it cannot be integrated separately
  and safely, it runs serially or as explicitly dependent, stacked branches. A stacked branch starts at the
  tip of its predecessor. More available agents are no reason for artificial parallelism.
- As an exception, parallel strands may share mechanically common files such as count, index, or registry
  lists, as long as their integration stays serial: the owner of the strand integrated later resolves the
  conflict against the current state and re-checks. A conflict returned this way does not count as a
  correction attempt. Shared invariants, migrations, and runtime resources, by contrast, are real coupling
  and stay under the rule above.

## Taking over and resuming

- Whoever claims a task again takes over its namespace of task branch, sub-branches, and worktrees only once
  no running or unknown worker uses it and the branches carry the state named in the task. A deviation is
  clarified before any change.
- After clarification, check whether the task branch needs changes from the current control branch to
  continue. Integrate it only then; likewise check for each sub-branch to be continued whether it needs the
  new state of the task branch. Check every integration diff and do not rewrite history.
- Taken-over entries that have since been integrated are named in the run report for cleanup via
  `qatlas-work tree`.

## Several leads

- If several leads, for example from different hosts, work in the same repo or planning system, each edits
  only its own, visibly claimed tasks and writes only in their namespaces. The authoritative planning system
  remains the source for status and ownership. Exactly one integration owner serializes changes to the
  control branch.
- Only a signal that all participants can see and that can succeed for only one lead suffices as a claim. A
  status set locally, not integrated, or visible only in a lead's own worktree is not a claim. If no such
  signal exists, the user or a dispatcher designated by the user assigns each lead disjoint tasks and
  exactly one integration owner before the start. No lead then selects further tasks outside its
  assignment.
- If the spine lives in the repo, only the integration owner writes claim, status, and spine to the control
  branch. Every other lead then works only on assigned tasks and hands over, per task, its checked task
  branch with a report in the return format. With pull request integration, the handed-over state is the
  open pull request with green CI, or without CI one with a green complete test. With the handover, ownership
  of the task passes to the integration owner; the owner sets `done` only after integration and evidence on
  the control branch. The integration owner serializes the merges; a lead pushes only its own task branches.
- For the other leads, a change to the control branch by the designated integration owner is not a foreign
  modification. Any other change there stops every participant before its next claim or integration.
- If a claim is unclear, a task is claimed by an unknown lead, or integration ownership is not established,
  no lead changes the affected task, its branches, or the control branch; it stops with the finding.
