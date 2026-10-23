---
description: >
  Parallel work run: a sentinel cuts the backlog into independent packages, has each one worked off by its
  own orchestrator as a run in its own tmux session, and integrates the results.
type: playbook
edit: locked
license: MIT
---

# Sentinel

The session in which the user invokes `sentinel` is the sentinel. It cuts independent packages, starts one
orchestrator per package, integrates its results and stays available to the user. Each orchestrator is its
own interactive session that works off its package as an ordinary `run` with its own subagents. The sentinel
never does the substantive implementation itself.

Within the chosen scope, the invocation authorizes starting orchestrators through the control script,
claiming and status upkeep in the planning system, checks, local integration and local commits. Push, pull
request and merge are permitted only when user or project instructions require and authorize them. No
publish, no deployment, no message to third parties and no other external or irreversible effect.
`sentinel` receives the permission to edit locked project documentation (`Freigabe für gesperrte
Projektdokumentation`) under the shared contract in [the Qatlas skill](../../SKILL.md).

The sentinel is the dispatcher and the sole integration owner in the sense of the multiple-orchestrators
section of [Parallel work in a run](../../references/git-parallel.md) (`Mehrere Orchestratoren`). Push, pull
request, merge, task closing and the status `done` belong exclusively to it; project instructions that allow
a `run` to push, open a pull request or merge apply in the sentinel only to the sentinel. Orchestrators claim
their tasks in the planning system as that multiple-orchestrators section prescribes, but never set `done`.

The control script is `node <plugin-root>/skills/qatlas/modes/sentinel/scripts/qatlas-sentinel-tmux.js`;
`<plugin-root>` is the `QATLAS PLUGIN ROOT` named in the session context. The helper commands `probe`,
`ci-wait` and `slot` are provided by `node <plugin-root>/skills/qatlas/scripts/qatlas-run-tools.js`. Touch
orchestrator panes only through the control script and never send keystrokes into an orchestrator session.
`wait`, `ask` and `handover` block until their `--timeout`; set the host's command timeout above it.

## Invocation

`sentinel [tasks or scope] [--limit <n|0>] [--orchestras <n>] [--fly] [run directive]`

- **`--limit` and `--orchestras`:** determine package size and package count as described in "Cutting packages".
- **`--fly`:** The user is unreachable during the run; [`--fly` in the sentinel](flag-fly.md) applies.

## Reading list

The blocks repeat nothing from this file or from each other; what you do not read is missing in this run.
Read each one completely at the stated time:

1. **Before the first step:** [the backlog norm](../../../qatlas-core-backlog/SKILL.md), [checking the
   orchestration](../../references/playbook-orchestra-config.md), [selecting
   tasks](../../references/playbook-task-selection.md), [the
   git workflow](../../references/playbook-git-workflow.md), [parallel work in a
   run](../../references/git-parallel.md), [the git norm](../../../qatlas-core-git/SKILL.md) and its
   [commit reference](../../../qatlas-core-git/references/playbook-commit.md). With `--fly`, additionally the
   flag file from "Invocation" and [deciding without the user](../../references/playbook-autonomy.md).
2. **When `orchestra.yaml` is missing, invalid or a model looks doubtful:** [setting up the
   orchestration](../../references/playbook-orchestra.md).
3. **If user or project instructions require pull requests, before the first orchestrator:** [integration via
   pull requests](../../references/playbook-git-pr.md).
4. **Before the first integration:** [accepting and integrating](../../references/playbook-acceptance.md),
   [the commit boundary](../../../qatlas-core-git/references/commit-boundaries.md) and [the
   worktree contract](../../../qatlas-work/references/worktree-contract.md).
5. **Before the final report:** [the closing block](../../references/playbook-closing-block.md).

## Prepare

1. Check `tmux`, the git root, a clean control branch per the git workflow and the reachability of the
   authoritative planning system; if it is unreachable, do not start. If the sentinel runs inside tmux, the
   script creates its own session `sentinel--<repo>` in the user's server; tell the user the printed way to
   switch to it. Outside tmux it creates its own server; then tell the user the printed attach command. One
   window holds four orchestrators; the script opens more in additional windows of the same session. Before
   the first orchestrator, check the free space of the file system holding the repo against the threshold
   named in the project instructions, else 5 GB. Below it, run the cleanup step for low space named there; if
   that does not suffice or none is named, do not start and name the concrete obstacle.
2. If `list --repo <repo-root>` already shows panes, check each one. If its title carries `FERTIG` or it has
   ended (`dead`), it is a leftover of an earlier run: save it with `capture` and close it with `close`. A
   live pane without `FERTIG` belongs to a running sentinel or to the user; do not start then, and clarify
   it with the user. Exception: if `list` shows live panes without `FERTIG` and `report` shows a run of this
   repo, a new session takes it over only on the user's explicit order to continue it. The successor cuts no
   packages beyond the remaining run budget, adopts the running orchestrators, reconstructs the state from
   `list`, `report` (including `plan`) and the planning system and continues `wait` from the `cursor` of
   `list`. Without such an order, the rule above applies.
3. For each intended host, check its section in `orchestra.yaml` with a valid orchestrator model and its CLI
   on the `PATH`: `claude` for Claude Code, `codex` for Codex. The default is your own host; a run directive
   may assign packages to another host.
4. Recognize from user and project instructions whether they require integration via pull requests; if so,
   [integration via pull requests](../../references/playbook-git-pr.md) applies. In that case, check whether
   a merge queue is active in the target repo, whether branch protection requires an up-to-date state before
   the merge, and whether `gh` is available and logged in. If `gh`, its login or the authorization for push,
   pull request and merge is missing, do not start and clarify it with the user. If project instructions
   require pull request operations through a Qatlas broker connection, check with `qatlas.search` and
   `qatlas.describe` before the first orchestrator that the connection exists and offers creating and merging
   pull requests; otherwise do not start. In that case perform the steps of `land` through the broker instead
   of calling `land`.

The integration base `<basis>` is `origin/<control-branch>` for integration via pull requests, otherwise the
local `<control-branch>`.

## Cutting packages

From the stated scope, or from the backlog if there is none, select the executable tasks as described in
[selecting tasks](../../references/playbook-task-selection.md) and cut as many packages from them as there
are independent areas, at most four, with `--orchestras <n>` at most `n`. A package bundles related tasks;
dependencies lie only within a package. Real coupling through shared invariants, migrations or runtime
resources stays within one package; if it cannot be ruled out, merge the tasks. Mechanically shared files may
be shared by packages as described in [parallel work in a run](../../references/git-parallel.md).

Before the cut, estimate for each task from the task contract and the code which files it touches. If
several tasks change the same central file, such as a registry, a shared test file or the same
documentation, put them in one package instead of spreading them over packages: every integration at that
spot forces every other package that touches it to catch up with the base.

The sentinel integrates serially. Supplement a package that consists only of a dependency chain with
independent tasks, so that its orchestrator can keep working while it waits for an integration. A
cross-cutting task that touches many areas forms its own package and starts first.

A package holds at most five tasks, with `--limit <n>` at most `n`. With `--limit 0` you decide the size of
each package yourself by what an orchestrator can carry in one run: scope and coupling of the tasks and
their foreseeable context needs. Fill each package up to its size as far as executable tasks are available.
You choose fewer packages or tasks only on an explicit quantity directive via `--orchestras`, `--limit` or an
equivalent user directive, never from interpreting words like "pilot" or "test". What fits in no package
stays in its order for replenishment and later runs.

The run budget is the sum of the sizes of the packages cut at the start. Each task that is completed or
handed over to `review` in a secured state consumes one slot of it.

After the cut, log each package with the run budget fixed at the start: `plan --repo <repo-root> --budget <n>
--package <package> --tasks <id,id,...>`, so that a successor can reconstruct them.

Tell the user the packages with their tasks, the reason for the cut and the run budget in a few lines, and
start directly.

## Starting orchestrators

Start each package in the repo root; the script distributes the panes over windows, four each:

```text
add --repo <repo-root> --package <package> --label "<project>·orchestrator" --title "<project>·<package> · <host>" --cwd <repo-root> -- <cli>
```

- Claude Code: `claude --model <orchestrator> '/qatlas run <tasks> [--limit <n>] <run directive>'`
- Codex: `codex -m <orchestrator> '$qatlas run <tasks> [--limit <n>] <run directive>'`

Quote the prompt simply in the shell so that `$qatlas` is not expanded. Set `--limit` to the package size if
it exceeds five. Never pass on `--fly`: an orchestrator always asks you, and whether you ask the user is
decided by your own `--fly`. The run directive reads in essence:

> Package <package> of a sentinel. Other orchestrators work in parallel in the same repo; the sentinel is the
> integration owner. Work as described in the multiple-orchestrators section of [parallel work in a
> run](../../references/git-parallel.md) and claim only tasks of this package. Push, pull request, merge,
> task closing and `done` are taken over exclusively by the sentinel, even if project instructions allow them
> to a run. In the primary working tree you do not pull, switch or commit anything.
>
> If `<basis>` is an `origin/…` ref, fetch it fresh with `git fetch` before every use. Create one worktree
> per task from `<basis>`. Before every handover, merge the current `<basis>` into the task branch, resolve
> conflicts yourself and then check completely; full tests run via `node <tools> slot -- <test command>`.
> Start every worker with a profile from `orchestra.yaml` and with model and effort set explicitly. Before
> every commit, run the protection check as its own command and evaluate its exit code before you commit.
>
> Hand over every checked task with `node <script> handover --repo <repo-root> --package <package> --task
> <id> --report <file>`; the report file lies outside every worktree. For integration via pull requests with
> squash merge, you hand over each pull request of a task individually as described in [integration via pull
> requests](../../references/playbook-git-pr.md) and start the next one only from the `<basis>` integrated
> afterwards. The report follows the return format of [executing work](../run/run.md), including the worker
> profiles with model and effort, and additionally names branches and commits and whether this handover is
> the last one of the task. For integration via pull requests, the report starts with YAML frontmatter
> (`---` on the first line) with the fields `pr-title` (one non-empty line), `pr-body` (non-empty, usually a
> `|` block scalar), `branch`, `base` and `last` (`true` or `false`); the rest of the report follows after
> it. A pull request is one unit of the commit boundary: independent milestones become separate pull
> requests before you hand over. `handover` rejects a branch with more than one non-merge commit over
> `base` (exit 2, nothing raised) unless the frontmatter carries `cut-exception: <reason>`. The answer is
> `integrated <sha>` or `rework <reason>`; without an answer, call the same command again with the report
> unchanged. Until the answer arrives, task, branches and worktree belong to the sentinel; do not touch
> them. `rework` gives them back to you: work on the reason and hand over again. `integrated` on a handover
> that is not the last gives you the task back to continue.
>
> If the next task depends on the handed-over one, wait for `integrated` and start it from the new `<basis>`.
> You may begin a demonstrably independent task of this package during the wait from the current `<basis>`;
> the handed-over task counts as securely handed over in that case. Then call `handover` again with
> `--timeout 10` after each subagent return until the answer is there, and hand over the next task only
> afterwards. A `rework` takes precedence: secure the running task at the next checked milestone as a
> checkpoint, work on the reason, hand over again and continue afterwards.
>
> Whatever you would otherwise ask the user, you ask exclusively with `node <script> ask --repo <repo-root>
> --package <package> --question "<question with context, options and recommendation>"`; the output is the
> answer. Without an answer, call the same command again. While a handover is open, no question is possible;
> first wait for its answer with `handover`. After your closing block, set the pane title with `node <script>
> title --repo <repo-root> --package <package> --title "FERTIG · <title>"`.

Insert `<script>`, `<tools>`, `<repo-root>`, `<package>` and `<basis>` as fixed values: `<script>` is the
control script, `<tools>` is `qatlas-run-tools.js`, each with an absolute path. Do not rely on environment
variables of the pane, because not every host runs commands with them.

Add the part of the user's run directive that concerns this package. Add no option that loosens permissions,
sandbox or approvals of the host.

## Monitoring

Wait with `wait --repo <repo-root> --since <cursor>`. Begin with `--since 0` and afterwards pass the `cursor`
of the last output each time, so that no event is lost. It returns on one of the events `question`,
`handover`, `done` or `exited`, or after a timeout. If the host can run commands in the background, do so, so
that you stay available to the user. A `handover` names only the path of its report; read it only at
integration.

Keep your context lean: read diffs first as `--stat` and then only the affected spots. What you carry into
the closing you log immediately with `log` instead of holding it in memory: assumptions as `annahme`,
deviations from the procedure as `abweichung`, risks not recorded publicly as `risiko`, newly recorded tasks
as `erfasst` and open user decisions as `entscheiden`, each with package and task. After a compaction of your
context or a restart, reconstruct the state from `list`, `report` (including `plan`) and the planning system,
not from memory; a new session continues as described in "Prepare" step 2.

Handle each event:

- **`question`:** If project knowledge supports the answer, reply with `answer --repo <repo-root> --package
  <package> --answer "<answer with source>"`. Otherwise ask the user briefly with package, question and
  recommendation and pass on their answer; with `--fly` you instead answer as the flag file prescribes.
- **`handover`:** Integrate as described in the following section.
- **`done` and `exited`:** Proceed as described in "Finish".
- If the user writes into a pane themselves, that session belongs to them; do not touch it. If an
  orchestrator visibly hangs without progress, report it to the user instead of intervening.

## Integrate

With the handover, task and namespace belong to you until a `rework`, and for a handover that is not the last
until your `integrated`. Integrate handovers one at a time and log every integration step with `log --repo
<repo-root> --type <type> --package <package> --task <id> --text <text>`, with the types `push`, `pr`,
`merge`, `rerun`, `conflict` and `close`.

1. Check diff, evidence and acceptance yourself as described in [accepting and
   integrating](../../references/playbook-acceptance.md). A substantive need for correction goes back as
   `answer … --answer "rework <reason>"` and counts as a correction attempt under the [at-most-two-corrections
   rule](../../references/playbook-acceptance.md). With pull requests, `handover` has already checked that
   the branch carries one non-merge commit, or a `cut-exception`. If that exception does not hold in the
   sense of the commit boundary, return the handover as `rework <cut>` with the required cut; that does not
   count as a correction attempt. If a worker ran without a profile from `orchestra.yaml` or with inherited
   instead of explicitly set effort, log that as `abweichung`; it is not a reason for correction.
2. Probe conflicts with `probe --branch <task-branch> --base <basis>`. A conflict, including one that arises
   when catching up with the base later, you return as `rework <reason with files>`; it does not count as a
   correction attempt. Never resolve conflicts yourself. Only if the orchestrator is no longer available do
   you secure the task as a handover to `review` per the git workflow.
3. Without a conflict, integrate per the git workflow, and for integration via pull requests per
   [integration via pull requests](../../references/playbook-git-pr.md) with `land --pr <n> --report <file>`
   of `qatlas-run-tools.js`; PR title and PR body come from the frontmatter of the report (`pr-title`,
   `pr-body`). `land` checks the head, waits for CI like `ci-wait`, squash-merges, proves the squash and
   deletes the remote branch. In doing so, check locally only the affected areas via `slot --priority` and
   leave the full breadth to CI. You treat a known or new flake by its rule in [accepting and
   integrating](../../references/playbook-acceptance.md). Without pull requests, you run the shared checks
   yourself. You integrate tasks spanning several repos per the git workflow.
4. If it is the last handover of the task, afterwards close it in the planning system and set it to `done`.
   Reply with `answer … --answer "integrated <sha>"`, where `<sha>` is the integration commit on the control
   branch.

When you integrate via pull requests, do not wait for CI handover by handover. Open every checked,
conflict-free pull request immediately so that its CI runs alongside the others, and handle further events
in the meantime. If a merge queue is active, enqueue it immediately; the queue manages base and order.
Without a merge queue, you merge individually as soon as its CI is green. If the base has changed since the
CI run and branch protection requires an up-to-date state, catch up with the base yourself without conflict,
for example via GitHub's branch update, and wait for CI again; you return a conflict as in step 2. In this
case integration stays serially bound to the CI duration; name that as a bottleneck in the report.

`land` deletes the remote branch itself once it has proven the squash; the authorization for push and merge
covers it. Clean up local worktrees and branches per the worktree contract, with the `proof` result of `land`
as squash evidence. If a merge queue is active, `land` does not apply; delete the remote branch there per the
worktree contract after the queue has merged, with the Qatlas MCP broker if it offers a suitable operation,
otherwise `gh api -X DELETE repos/<owner>/<repo>/git/refs/heads/<branch>` or `git push origin --delete
<branch>`.

## Finish

- **`done`:** If every task of the package is integrated or secured in the planning system, for example as a
  handover to `review`, save the pane with `capture --repo <repo-root> --package <package>` and close it with
  `close` with the same arguments. It stays open only if an open point such as an abort or an unresolved
  conflict cannot be secured, or if the user has written into the pane. With the last pane, the session ends.
- **`exited` without `done`:** Secure the package's open tasks per the git workflow as a handover to
  `review`, save the pane with `capture` and close it with `close`.
- Clean up integrated worktrees and branches per the worktree contract, after a squash merge via the squash
  evidence.
- At the end of the sentinel, run the cleanup steps that native project instructions or project memory name
  for the end of a run, and name them in the final report.

**Replenishment:** If a pane is closed and the run budget is not used up, cut a new package from the
remaining executable tasks as described in "Cutting packages" that is independent of all running packages. It
comprises at most the package size and the rest of the run budget, carries a new package name and starts as
described in "Starting orchestrators". Never more orchestrators run at the same time than "Cutting packages"
permits. Log it with `plan` and the unchanged run budget, as at the cut. Tell the user the package with its
tasks in one line.

The run ends when no more replenishment is possible, every remaining pane shows `FERTIG` or has ended, and
all handed-over tasks are integrated or secured as a handover. In the report, state the metrics from `report
--repo <repo-root>` briefly and the remaining remote branches of this run collected together. Close with
exactly one closing block (`Für dich`, see [the closing block](../../references/playbook-closing-block.md))
across all packages; you take its entries from the `notes` in `report`, and unpushed commits appear there
under `Nicht gepusht`.
