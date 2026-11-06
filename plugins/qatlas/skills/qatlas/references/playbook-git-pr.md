---
description: >
  Integration of a run or team task via pull requests when user or project instructions require it:
  platform steps, working base, conflict probe, merge queue, cut for squash merge, and closing.
type: playbook
edit: locked
license: MIT
---

# Integration via pull requests

This procedure applies only when `.qatlas-project/CONTRIBUTING.md` or user or project instructions require
integration via pull requests, for example with a protected control branch; recognize that from these
instructions, not by guessing. It changes
no authorization: invoking a mode authorizes neither push nor pull request nor merge; only user or project
instructions do. If they are missing, the task ends with an integration-ready, locally secured task branch as
a handover, as described in the handover section (`Übergeben`) of [the git workflow](playbook-git-workflow.md),
without a push.

A pull request stands for the review request of the project's code platform, for example a merge request on
GitLab. In a simple `run`, the run itself pushes, opens the pull request, waits for CI and lands it. In
`team`, the lead pushes its own task branch, opens the pull request and fixes a red CI; the integrator lands
it. The bullets below apply to the `run` unless "In a team" names the difference.

## Platform steps

The project instructions name the platform and the means for push, opening a pull request, waiting for CI,
merging and deleting the remote branch; for a GitHub repo with an available `gh`, the GitHub helpers suffice
without such a statement. Before the first push of a `run` or the first lead of a `team`, check that these
means are available and authorized for push, pull request and merge, in a team also for the leads, and
determine in the target repo whether a merge queue is active and whether branch protection requires an
up-to-date state before the merge. If a means or its authorization is missing, do not start and clarify it
with the user. Whatever the means, both platform steps keep this contract:

- **Waiting for CI:** Wait until every check of the pull request has finished. Without any check the project
  has no CI; then the green complete local test is the evidence.
- **Landing:** Confirm that the head of the pull request is the handed-over state or its conflict-free
  catch-up with the base, wait for CI, squash-merge exactly that head, prove that the squash commit carries
  the checked change and only then delete the remote branch. Without CI, land only after the merged state is
  confirmed by the green complete local test, in a team as [the integrator's evidence and delta
  checks](../modes/team/integrator.md#evidence-and-delta-checks) describe.

## Procedure

- **Working base:** Work in the task worktree from a freshly fetched `origin/<control-branch>`. The primary
  working tree stays untouched: no pull, switch or commit there by the run.
- **Before opening or updating a pull request (`run`):** Run `git fetch`, probe conflicts with
  `node <plugin-root>/skills/qatlas/scripts/qatlas-run-tools.js probe`, merge the current
  `origin/<control-branch>` into the task branch, resolve conflicts per the conflict rules of [the git
  workflow](playbook-git-workflow.md), check again and only then push. Never rebase a branch that has
  already been pushed. This merge commit rewrites no history and is not a foreign change. Wait for CI.
- **Merge queue:** If a merge queue is active in the target repo, integrate the pull request through
  it instead of catching up with the base yourself.
- **In a team:** The lead merges no current `origin/<control-branch>` into the task branch; the handover
  carries the state on which the complete check was green. Before the first push it runs `cut` (`node
  <plugin-root>/skills/qatlas/modes/team/scripts/qatlas-team-tmux.js cut --repo <repo-root> --branch
  <task-branch> --base <basis>`, with `--code-repo` for code outside the control root), which applies the
  cut rule below. It pushes only its own task branch, never forcibly, opens the pull request, waits for CI
  and fixes a red CI itself with follow-up commits; it never rewrites pushed history. Such fixes after the
  first push do not count against the cut rule. It hands over the open pull request only with green CI, or
  without CI with the green complete local test. A conflict with the base comes back from the integrator as
  `rework`. The integrator opens no pull request; it lands it. If branch protection requires an up-to-date
  state, it catches up with the base without conflict and waits for CI again.
- **Cut for squash merge:** A task yields as many pull requests as the commit boundary of the git norm
  ([commit boundaries](../../qatlas-core-git/references/commit-boundaries.md)) requires for a squashed
  review; a pull request never bundles independent milestones. Each pull request gets its own task branch of
  the same task with its own slug. A preparatory pull request, for example a mechanical refactoring, is
  integrated before the change that builds on it. Before opening, check the entire diff of the pull request
  against the commit boundary and split it before you push. A team handover enforces this
  mechanically: `handover` rejects a branch with more than one non-merge commit unless the report frontmatter
  carries a `cut-exception`.
- **Closing:** Landing the pull request replaces local integration. The task is `done` only when all its pull
  requests are merged and the acceptance is evidenced on the new `origin/<control-branch>`.
- **Dependent work:** A squash merge rules out stacked branches. A dependent task or pull request then
  starts only from the integrated `origin/<control-branch>`, never on a predecessor branch that is not
  integrated.
