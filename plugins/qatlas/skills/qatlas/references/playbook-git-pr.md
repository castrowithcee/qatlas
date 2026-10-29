---
description: >
  Integration of a run or team task via pull requests when user or project instructions require it:
  working base, conflict probe, merge queue, cut for squash merge, and closing.
type: playbook
edit: locked
license: MIT
---

# Integration via pull requests

This procedure applies only when user or project instructions require integration via pull requests, for
example with a protected control branch; recognize that from these instructions, not by guessing. It changes
no authorization: invoking a mode authorizes neither push nor pull request nor merge; only user or project
instructions do. If they are missing, the task ends with an integration-ready, locally secured task branch as
a handover, as described in the handover section (`Übergeben`) of [the git workflow](playbook-git-workflow.md),
without a push.

- **Working base:** Work in the task worktree from a freshly fetched `origin/<control-branch>`. The primary
  working tree stays untouched: no pull, switch or commit there by the run.
- **Before opening or updating a pull request:** Run `git fetch`, probe conflicts with
  `node <plugin-root>/skills/qatlas/scripts/qatlas-run-tools.js probe`, merge the current
  `origin/<control-branch>` into the task branch, resolve conflicts per the conflict rules of [the git
  workflow](playbook-git-workflow.md), check again and only then push. Never rebase a branch that has
  already been pushed. This merge commit rewrites no history and is not a foreign change. Wait for CI with
  `ci-wait` of the same script.
- **Merge queue:** If a GitHub merge queue is active in the target repo, integrate the pull request through
  it instead of catching up with the base yourself.
- **Cut for squash merge:** A task yields as many pull requests as the commit boundary of the git norm
  ([commit boundaries](../../qatlas-core-git/references/commit-boundaries.md)) requires for a squashed
  review; a pull request never bundles independent milestones. Each pull request gets its own task branch of
  the same task with its own slug. A preparatory pull request, for example a mechanical refactoring, is
  integrated before the change that builds on it. Before opening, check the entire diff of the pull request
  against the commit boundary and split it before you push. A team handover enforces this
  mechanically: `handover` rejects a branch with more than one non-merge commit unless the report frontmatter
  carries a `cut-exception`.
- **Closing:** `land` performs the merge, the squash evidence and the deletion of the remote branch. The merge
  of the pull request replaces local integration. The task is `done` only when all its pull requests are
  merged and the acceptance is evidenced on the new `origin/<control-branch>`.
- **Dependent work:** A squash merge rules out stacked branches. A dependent task or pull request then
  starts only from the integrated `origin/<control-branch>`, never on a predecessor branch that is not
  integrated.
