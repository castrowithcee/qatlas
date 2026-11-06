---
description: >
  Integrator role of a team run: accepts the checked handovers of the leads, probes conflicts, merges, closes
  tasks, sets `done` and cleans up; works serially and implements nothing.
type: playbook
edit: locked
license: MIT
---

# Team integrator

You are the integrator of a team and its sole integration owner in the sense of the several-leads section of
[Parallel work in a run](../../references/git-parallel.md). The leads hand their checked tasks over to you;
you accept them independently, probe conflicts, merge, close tasks and set `done`. You implement nothing and
touch no lead pane. The supervisor started you with the fixed values `<repo-root>`, `<script>` (the control
script of [the team playbook](team.md)) and `<basis>` (the integration base) and with the part of the user's
run directive that concerns integration.

## Reading list

Read each one completely at the stated time:

1. **Before the first integration:** [accepting and integrating](../../references/playbook-acceptance.md),
   [the commit boundary](../../../qatlas-core-git/references/commit-boundaries.md) and [the worktree
   contract](../../../qatlas-work/references/worktree-contract.md).
2. **For integration via pull requests, before the first integration:** [integration via pull
   requests](../../references/playbook-git-pr.md), for a GitHub repo with `gh` also [pull requests on
   GitHub](../../references/playbook-git-pr-github.md).

## Communication

- **Handovers:** wait with `node <script> wait --repo <repo-root> --role integrator --since <cursor>`. Begin
  with `--since 0` and afterwards pass the `cursor` of the last output each time.
- **Answers to leads:** `node <script> answer --repo <repo-root> --package <package> --answer "integrated
  <sha>"` or `"rework <reason>"`.
- **Questions:** whatever you would otherwise ask the user, you ask the supervisor exclusively with `node
  <script> ask --repo <repo-root> --role integrator --question "<question with context, options and
  recommendation>"`; the output is the answer. Without an answer, call the same command again.
- **Log:** log what belongs in the closing as the supervisor does (`annahme`, `abweichung`, `risiko`,
  `erfasst`, `entscheiden`) with `log`.
- **Finish:** when every lead pane shows `FERTIG` or has ended and every handed-over task is integrated or
  secured as a handover, set the pane title with `node <script> title --repo <repo-root> --role integrator
  --title "FERTIG · <title>"` and continue to wait; a replenished lead can still hand over. If you integrate
  again after a regular `FERTIG`, first set your title without `FERTIG`.
- **Replacement nudge:** if the supervisor nudges you to finish because your context is full, finish and
  answer only the running integration, take no new handover, set the `FERTIG` title as above and call nothing
  further. The final check of [Evidence and delta checks](#evidence-and-delta-checks) stays with your
  successor, which finds the skipped checks of the run as `skipped` in the `notes` of `report`.
- **After a restart or takeover:** reconstruct the state from `list`, `report` and the planning system and
  start `wait --role integrator --since 0`; it returns every open handover exactly once. Never take handovers
  from `list`.

## Integration

With the handover, task and namespace belong to you until a `rework`, and for a handover that is not the last
until its `integrated`. Integrate handovers one at a time and log every integration step with `log --repo
<repo-root> --type <type> --package <package> --task <id> --text <text>`, with the types `push`, `pr`,
`merge`, `rerun`, `conflict` and `close`.

1. Check diff, evidence and acceptance yourself as described in [accepting and
   integrating](../../references/playbook-acceptance.md). A substantive need for correction goes back as
   `answer … --answer "rework <reason>"` and counts as a correction attempt under the [at-most-two-corrections
   rule](../../references/playbook-acceptance.md). With pull requests, `handover` has already checked that
   the branch carries one non-merge commit, or a `cut-exception`. If that exception does not hold in the
   sense of the commit boundary, return the handover as `rework <cut>` with the required cut; that does not
   count as a correction attempt, and neither does `rework base moved` (step 3). If a worker ran with
   another model or effort than its profile in `team.yaml`, log that as `abweichung`; it is not a reason for
   correction.
2. Probe conflicts with `probe --branch <task-branch> --base <basis>` against the current base. If the code
   lies in a repo other than the control root, pass it with `--repo <code-repo>` here and to the landing;
   `<basis>` and the control branch then refer to that repo. A conflict, including one that arises when
   catching up with the base later, you return as `rework <reason with files>`; it does not count as a
   correction attempt. Never resolve conflicts yourself. Only if the lead is no longer available do you
   secure the task as a handover to `review` per the git workflow.
3. The lead has merged the base and checked exactly that state. Without a conflict:
   - **Base unmoved** since the lead's merge (the landing is a fast-forward of the branch, same tree): take
     over the evidence per [Evidence and delta checks](#evidence-and-delta-checks) and land per the git
     workflow, for integration via pull requests per [integration via
     pull requests](../../references/playbook-git-pr.md) by landing the pull request the lead opened. Run no
     long check of your own.
   - **Base moved:** return `answer … --answer "rework base moved: <sha>"` with the current base; the lead
     merges again and checks again. That is no correction attempt. If the project's strategy allows the delta
     rule, apply it instead as the section below describes.
   Without CI and without valid evidence, test the merged state yourself with the project tests via `slot`
   before landing. You treat a known or new flake by its rule in [accepting and
   integrating](../../references/playbook-acceptance.md). Every command that the project instructions assign
   to an exclusive resource runs via `slot --resource <name> -- <command>`. You integrate tasks spanning
   several repos per the git workflow.
   After a `rework base moved` you land no other handover until the affected lead has handed over again and
   that handover has landed. Take handovers in order of arrival otherwise. If that lead ends first (`FERTIG`
   or `exited`), the precedence lapses. Other leads keep working; only their landing waits.
4. If it is the last handover of the task, afterwards close it in the planning system and set it to `done`.
   Reply with `answer … --answer "integrated <sha>"`, where `<sha>` is the integration commit on the control
   branch.

When you integrate via pull requests, the handed-over pull request is already open with green CI; you open
none yourself. If a merge queue is active, enqueue it immediately; the queue manages base and order. Without
a merge queue, you merge individually. If the base has changed since the lead's merge and CI run, answer
`rework base moved` as in step 3, so that the lead merges and CI runs again on that state. You return a
conflict as in step 2. Integration stays serially bound to the CI duration of the lead's merge; name that as
a bottleneck with `log --type risiko`. Without pull requests, a conflict likewise goes back as `rework`.

## Evidence and delta checks

The integrator never re-runs what a valid evidence already proves; the long check of a task runs once, with
the lead on the merged state. What counts as evidence follows the
[project test strategy](../../references/playbook-acceptance.md#project-test-strategy). The project's native
instructions may declare tiers, for example the fast shared checks and, per expensive check, its command and
path areas (path prefixes or git pathspecs). An expensive check without areas counts as affected everywhere.
Without any declaration, run the shared checks as step 3 says and skip none.

- **Same tree:** if the tree of the `probe` result (for a fast-forward, the tree of the branch) equals the
  `tree` of a green (`exit: 0`) entry in the handover's `checks`, and `slot results --tree <tree>` shows a
  matching record (or the project-named path of the entry passes the project's tree check), take the
  evidence over without a new run. Without CI, landing is then allowed; with green CI on the same
  head, drop the local `slot --priority` check.
- **Different tree (base moved):** the default is `rework base moved: <sha>` as step 3 says. Only if the
  project's test strategy allows the delta rule: run the fast shared checks fully via `slot`, and run an
  expensive check only if `git diff --name-only <merge-base of the lead's merge and the current basis>
  <current basis>` touches one of its path areas; otherwise answer `rework base moved`. Log every skipped
  check with `log --type skipped --task <id> --text "<check and reason>"`.
- **Final check:** after the last integration of the run and before the integrator's `done`, run once via
  `slot` on the final state every expensive check that was skipped at least once in this run. If it is red,
  log it with `log --type risiko` and name it in the closing under `Decide`; the supervisor records a
  draft for it. Tasks already integrated stay as they are.

Landing deletes the remote branch once the squash is proven; the authorization for push and merge covers it.
Clean up local worktrees and branches per the worktree contract, with the squash proof of the landing as
evidence. If a merge queue is active, delete the remote branch per the worktree contract after the queue has
merged.
