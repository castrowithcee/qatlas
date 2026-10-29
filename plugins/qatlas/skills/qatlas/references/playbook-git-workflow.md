---
description: >
  Git workflow for Qatlas Run with one lead and serial writers: ownership, isolation, claiming, commits and
  checkpoints, integration, and handover.
type: playbook
edit: locked
license: MIT
---

# Git workflow of Qatlas Run

Read this reference only for writing work in a git repo. Qatlas' git norm applies in addition; this workflow
applies its commit boundary and its rules on checkpoints, cleanup, and history only to the run. If several
subagents write concurrently, a task is taken over or resumed, or further leads work in the same repo or
planning system, "Parallel work in a run" applies in addition.

## Ownership

- **Control branch:** the branch checked in the preflight, on which claim, spine, and integrated results
  land. Its working tree, normally the primary one, serves claiming, status upkeep, integration, and shared
  checks, never as a parallel implementation workplace.
- **Task branch:** the integration line of exactly one task. It belongs to the lead that claimed the task.
- A working tree never has two concurrent writers, and a branch is never checked out in two worktrees. A
  test, build, or formatting run that produces files, caches, or outputs is writing.
- Only the lead changes status, completion report, spine, and refs. No subagent creates or switches
  branches or worktrees or changes repo configuration and hooks. Only the lead also performs staging and
  commits.

## Deciding isolation

If exactly one writer works at a time and the working tree is clean, the **light path** applies: the
subagent, or for a tiny task the lead, works directly in the working tree of the control branch, and the
lead commits there after the check. The claim gets no commit of its own; the result or checkpoint commit
carries the status. If further leads work in the same repo or planning system, or a task branch comes into
being, commit the claim first on the clean control branch. A task branch of its own with a worktree is
needed when

- several writers work concurrently,
- the working tree contains foreign or unattributable changes, or
- user or project requirements demand it.

If a task in the light path ends unfinished in `review` or `waiting`, move its state onto a branch of its
own with `git switch -c <task-branch>` and secure only the working files there as a checkpoint. Status,
completion report, and spine stay unstaged, return with `git switch <control-branch>`, and are committed
there after "Handing over". This keeps the control branch free of unfinished work and the task branch free
of spine changes that would collide on its later integration.

For task branches and worktrees, the worktree contract applies; the run authorization covers creating them.
Without safe isolation, at most one writing subagent runs. If you cannot safely separate foreign changes,
hand the task over to the user with the finding.

## Commits and checkpoints

- A task gets as many commits as the commit boundary requires. The run's task limit counts tasks, not
  commits.
- The subagent creates no commits. The lead commits in a worktree only while no subagent works there, that
  is, after its return or stop. Have a larger implementation return at coherent milestones so that every
  checked milestone is secured as a commit before work continues.
- Before a pause, `review`, or the end of the run, the lead secures unfinished work as a marked checkpoint
  on the private branch where it arose. A checkpoint is not ready for integration.
- Every commit, including a checkpoint, follows the git norm's commit procedure including its protection
  check.
- Before any integration into the control branch, the git norm's cleanup applies to every checkpoint.

## Integrating

- Whoever integrates checks every delivery personally: the complete commit and diff range against the
  integration target, the agreed evidence, and the attribution of every change to the assignment. A success
  message does not replace this check. Unattributable work is not integrated. In the light path, committing
  after this check is the integration.
- The lead is the integration owner of the control branch; in a `team` the integrator is, and the leads
  integrate nothing. The owner integrates task branches individually and, before each integration, re-checks
  that the tip of the control branch matches its last checked state. A control branch changed by someone else
  stops automatic integration; updating and conflict handling are a separate, deliberate step.
- Do not rewrite shared history and do not resolve conflicts automatically. Delegate a conflict as an
  integration assignment of its own and check the resolution before accepting it.

## Handing over

- Before `review`, `waiting`, or the end of the run, the lead secures every not yet integrated state of the
  task according to the checkpoint rules above. It then commits status, completion report, and spine on the
  control branch. The task names task branch and worktree path including state: ready for integration or
  checkpoint.
- Task branch and worktree are kept until integration is confirmed or the user deliberately abandons them.
- Following the worktree contract, remove only worktrees and branches created by the current run that are
  clean and fully integrated.

## Tasks across several repos

Integrate the repo with the pull request requirement first, then the same task's share in the other repo, by
fast-forward, otherwise by merge commit; do not rebase foreign branches. Unpushed commits appear bundled
under "Not pushed" in the closing block.

## Scope-out

Create local commits only from fully read diffs and report messages and IDs after the run. No push without
authorization; with it only according to "Integration via pull requests", for a lead of a team also its
push of its own task branch there; never force-push. No automatic
stash or foreign staging. A claim without a host signal does not prove that an earlier subagent has ended.
