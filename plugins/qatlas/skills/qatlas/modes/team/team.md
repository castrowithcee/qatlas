---
description: >
  Parallel work run: a supervisor cuts the backlog into independent packages, has each one worked off by its
  own lead as a run in its own tmux session, and has an integrator session integrate the results.
type: playbook
edit: locked
license: MIT
---

# Team

The session in which the user invokes `team` is the supervisor. It cuts independent packages, starts one
lead per package and one integrator that integrates their results, and stays available to the user. Each lead
is its own interactive session that works off its package as an ordinary `run` with its own subagents. The
integrator is one further interactive session. The supervisor never does the substantive implementation or
any integration itself.

Within the chosen scope, the invocation authorizes starting leads and the integrator through the control
script, claiming and status upkeep in the planning system, checks, local integration and local commits. Push,
pull request and merge are permitted only when user or project instructions require and authorize them. No
publish, no deployment, no message to third parties and no other external or irreversible effect. `team`
receives the permission to edit locked project documentation (`Freigabe für gesperrte Projektdokumentation`)
under the shared contract in [the Qatlas skill](../../SKILL.md).

The integrator ([the integrator playbook](integrator.md)) is the sole integration owner in the sense of the
several-leads section of [Parallel work in a run](../../references/git-parallel.md). Merge, task closing and
the status `done` belong exclusively to it; project instructions that allow a `run` to merge apply in the team
only to the integrator. The supervisor is the dispatcher: it cuts packages, writes `plan`, replenishes,
monitors, answers questions (also those of the integrator) and never integrates. For integration via pull
requests, a lead may push its own task branch and open its pull request, through `gh` or the broker connection
the project requires; without such a requirement a lead pushes nothing. Leads claim their tasks in the
planning system as that several-leads section prescribes, but never set `done`.

The control script is `node <plugin-root>/skills/qatlas/modes/team/scripts/qatlas-team-tmux.js`;
`<plugin-root>` is the `QATLAS PLUGIN ROOT` named in the session context. The helper commands `probe`,
`ci-wait` and `slot` are provided by `node <plugin-root>/skills/qatlas/scripts/qatlas-run-tools.js`. Touch
lead panes only through the control script; writing into a pane is allowed only via `nudge`, never
send keystrokes by other means.
`wait`, `ask` and `handover` block until their `--timeout`; set the host's command timeout above it.

## Invocation

`team [tasks or scope] [--limit <n|0>] [--leads <n>] [--fly] [run directive]`

- **`--limit` and `--leads`:** determine package size and package count as described in "Cutting packages".
- **`--fly`:** The user is unreachable during the run; [`--fly` in the team](flag-fly.md) applies.

## Reading list

The blocks repeat nothing from this file or from each other; what you do not read is missing in this run.
Read each one completely at the stated time:

1. **Before the first step:** [the backlog norm](../../../qatlas-core-backlog/SKILL.md), [checking the
   team](../../references/playbook-team-config.md), [selecting
   tasks](../../references/playbook-task-selection.md), [the
   git workflow](../../references/playbook-git-workflow.md), [parallel work in a
   run](../../references/git-parallel.md), [the git norm](../../../qatlas-core-git/SKILL.md) and its
   [commit reference](../../../qatlas-core-git/references/playbook-commit.md). With `--fly`, additionally the
   flag file from "Invocation" and [deciding without the user](../../references/playbook-autonomy.md).
2. **When `team.yaml` is missing, invalid or a model looks doubtful:** [setting up the
   team](../../references/playbook-team.md).
3. **If user or project instructions require pull requests, before the first lead:** [integration via
   pull requests](../../references/playbook-git-pr.md).
4. **When the integrator has to be restarted or taken over (the supervisor does not read it otherwise):**
   [the integrator playbook](integrator.md).
5. **Before the final report:** [the closing block](../../references/playbook-closing-block.md).

## Prepare

1. `tmux` is required; Windows is not supported. Check `tmux`, the git root, a clean control branch per the
   git workflow and the reachability of the authoritative planning system; if it is unreachable, do not start.
   If the supervisor runs inside tmux, the script creates its own session `team--<repo>` in the user's server;
   tell the user the printed way to switch to it. Outside tmux it creates its own server; then tell the user
   the printed attach command. One window holds four leads; the script opens more in additional windows of the
   same session. Before the first lead, check the free space of the file system holding the repo against the
   threshold named in the project instructions, else 5 GB. Below it, run the cleanup step for low space named
   there; if that does not suffice or none is named, do not start and name the concrete obstacle.
2. If `list --repo <repo-root>` already shows panes, check each one. If its title carries `FERTIG` or it has
   ended (`dead`), it is a leftover of an earlier run: save it with `capture` and close it with `close`. A
   live pane without `FERTIG` belongs to a running supervisor or to the user; do not start then, and clarify
   it with the user. Exception: if `list` shows live panes without `FERTIG` and `report` shows a run of this
   repo, a new session takes it over only on the user's explicit order to continue it. The successor cuts no
   packages beyond the remaining run budget, adopts the running leads and a live integrator pane (without
   one, it starts an integrator as described in "Starting the integrator"), reconstructs the state from
   `list`, `report` (including `plan`) and the planning system and continues `wait` from the `cursor` of
   `list`. Without such an order, the rule above applies.
3. For each intended host, check its section in `team.yaml` with valid `lead` and `integrator` entries and its
   CLI on the `PATH`: `claude` for Claude Code, `codex` for Codex. The default is your own host; a run
   directive may assign packages to another host.
4. Recognize from user and project instructions whether they require integration via pull requests; if so,
   [integration via pull requests](../../references/playbook-git-pr.md) applies. In that case, check whether
   a merge queue is active in the target repo, whether branch protection requires an up-to-date state before
   the merge, whether `gh` is available and logged in, and whether the leads can push their task branches
   and open pull requests with that login. If `gh`, its login or the authorization for push, pull request
   and merge is missing, do not start and clarify it with the user. If project instructions
   require pull request operations through a Qatlas broker connection, check with `qatlas.search` and
   `qatlas.describe` before the first lead that the connection exists and offers creating and merging
   pull requests; otherwise do not start. In that case the leads open their pull requests through it, and
   the integrator performs the steps of `land` through the broker instead of calling `land`.

The integration base `<basis>` is `origin/<control-branch>` for integration via pull requests, otherwise the
local `<control-branch>`.

## Cutting packages

From the stated scope, or from the backlog if there is none, select the executable tasks as described in
[selecting tasks](../../references/playbook-task-selection.md) and cut as many packages from them as there
are independent areas, at most four, with `--leads <n>` at most `n`. A package bundles related tasks;
dependencies lie only within a package. Real coupling through shared invariants, migrations or runtime
resources stays within one package; if it cannot be ruled out, merge the tasks. Mechanically shared files may
be shared by packages as described in [parallel work in a run](../../references/git-parallel.md).

Before the cut, estimate for each task from the task contract and the code which files it touches. If
several tasks change the same central file, such as a registry, a shared test file or the same
documentation, put them in one package instead of spreading them over packages: every integration at that
spot forces every other package that touches it to catch up with the base.

The integrator integrates serially. Supplement a package that consists only of a dependency chain with
independent tasks, so that its lead can keep working while it waits for an integration. A
cross-cutting task that touches many areas forms its own package and starts first.

A package holds at most five tasks, with `--limit <n>` at most `n`. With `--limit 0` you decide the size of
each package yourself by what a lead can carry in one run: scope and coupling of the tasks and
their foreseeable context needs. Fill each package up to its size as far as executable tasks are available.
You choose fewer packages or tasks only on an explicit quantity directive via `--leads`, `--limit` or an
equivalent user directive, never from interpreting words like "pilot" or "test". What fits in no package
stays in its order for replenishment and later runs.

The run budget is the sum of the sizes of the packages cut at the start. Each task that is completed or
handed over to `review` in a secured state consumes one slot of it.

After the cut, log each package with the run budget fixed at the start: `plan --repo <repo-root> --budget <n>
--package <package> --tasks <id,id,...>`, so that a successor can reconstruct them.

Tell the user the packages with their tasks, the reason for the cut and the run budget in a few lines, and
start directly.

## Starting leads

Start each package in the repo root; the script distributes the panes over windows, four each:

```text
add --repo <repo-root> --package <package> --label "<project>·lead" --title "<project>·<package> · <host>" --cwd <repo-root> -- <cli>
```

- Claude Code: `claude --model <lead> '/qatlas run <tasks> [--limit <n>] <run directive>'`
- Codex: `codex -m <lead> '$qatlas run <tasks> [--limit <n>] <run directive>'`

Quote the prompt simply in the shell so that `$qatlas` is not expanded. Set `--limit` to the package size if
it exceeds five. Never pass on `--fly`: a lead always asks you, and whether you ask the user is
decided by your own `--fly`. The run directive reads in essence:

> You are the lead of package <package> of a team. Read `<plugin-root>/skills/qatlas/modes/team/lead.md`
> completely and work by it. `<script>` is the control script, `<tools>` is `qatlas-run-tools.js`,
> `<repo-root>` is the repo root and `<basis>` the integration base.

Insert `<plugin-root>`, `<script>`, `<tools>`, `<repo-root>`, `<package>` and `<basis>` as fixed values (paths
absolute; `--code-repo` where the code lies in another repo). Add the part of the user's run directive that
concerns this package. Add no option that loosens permissions, sandbox or approvals of the host.

## Starting the integrator

After the leads, start exactly one integrator in the repo root. It takes no package:

```text
add --repo <repo-root> --role integrator --label "<project>·integrator" --title "<project>·integrator · <host>" --cwd <repo-root> -- <cli>
```

- Claude Code: `claude --model <integrator> '<integrator directive>'`
- Codex: `codex -m <integrator> '<integrator directive>'`

`<integrator>` is the `integrator` model of `team.yaml`. Quote as for the leads. The integrator directive
reads in essence:

> You are the integrator of a team. Read `<plugin-root>/skills/qatlas/modes/team/integrator.md` completely
> and work by it. `<repo-root>` is the repo root, `<script>` the control script and `<basis>` the integration
> base.

Insert `<plugin-root>`, `<script>`, `<repo-root>` and `<basis>` as fixed values (paths absolute), because the
integrator loads no skill of its own. Add the part of the user's run directive that concerns integration.

## Monitoring

Wait with `wait --repo <repo-root> --since <cursor>`. Begin with `--since 0` and afterwards pass the `cursor`
of the last output each time, so that no event is lost. It returns on one of the events `question`, `done`,
`exited`, `stale` or `disk`, or after a timeout; handovers go to the integrator and wake you never. `wait` is
the only monitoring: build no monitors, crons or wait loops of your own. If the host can run commands in the
background, do so, so that you stay available to the user.

Keep your context lean: read diffs first as `--stat` and then only the affected spots. What you carry into
the closing you log immediately with `log` instead of holding it in memory: assumptions as `annahme`,
deviations from the procedure as `abweichung`, risks not recorded publicly as `risiko`, newly recorded tasks
as `erfasst` and open user decisions as `entscheiden`, each with package and task. After a compaction of your
context or a restart, reconstruct the state as described in "Prepare" step 2, not from memory.

Handle each event:

- **`question`:** If project knowledge supports the answer, reply with `answer --repo <repo-root> --package
  <package> --answer "<answer with source>"`, for a question of the integrator with `answer --repo <repo-root>
  --role integrator --answer "<answer with source>"`. Otherwise ask the user briefly with package (or
  integrator), question and recommendation and pass on their answer; with `--fly` you instead answer as the
  flag file prescribes.
- **`done` and `exited`:** Proceed as described in "Finish".
- **`stale`:** A pane without open signal made no progress for `--stale` minutes (default 20), or for three
  times that while the host shows that it waits for its own background agent (Claude Code: "Waiting for N
  background agents"; no equivalent is detected for Codex). The event shows the last lines, so a usage limit
  is recognizable. An integrator waiting idly for handovers can appear as `stale`; that is no standstill as
  long as `list` shows no open handover. Nudge with `nudge --repo <repo-root> --package <package> --text
  "<text>"` (for the integrator `--role integrator` instead of `--package`) only after `stale`, with no open
  signal, no running test of the package worktree per `slot status`, and at most once per standstill phase.
  A second `stale` after a nudge you report to the user; with `--fly` you secure the package's open tasks as
  for `exited`.
- **`disk`:** Free space fell below `--min-free` GB (default 5). Run the cleanup step the project names for
  low space, otherwise report it to the user.
- If the user writes into a pane themselves, that session belongs to them; do not touch it.

## Finish

- **`done`:** If every task of the package is integrated or secured in the planning system, for example as a
  handover to `review`, save the pane with `capture --repo <repo-root> --package <package>` and close it with
  `close` with the same arguments. It stays open only if an open point such as an abort or an unresolved
  conflict cannot be secured, or if the user has written into the pane. With the last pane, the session ends.
  A `done` of the integrator closes it the same way with `--role integrator`, once every package is
  integrated or secured and no replenishment is possible.
- **`exited` without `done`:** Secure the package's open tasks per the git workflow as a handover to
  `review`, save the pane with `capture` and close it with `close`. If the integrator exited, save and close
  its pane and start a new one as described in "Starting the integrator", adding to its directive that this is
  a restart. Integration rests until it runs.
- At the end of the team run, run the cleanup steps that native project instructions or project memory name
  for the end of a run, and name them in the final report.

**Replenishment:** If a pane is closed and the run budget is not used up, cut a new package from the
remaining executable tasks as described in "Cutting packages" that is independent of all running packages. It
comprises at most the package size and the rest of the run budget, carries a new package name and starts as
described in "Starting leads". Never more leads run at the same time than "Cutting packages"
permits. Log it with `plan` and the unchanged run budget, as at the cut. Tell the user the package with its
tasks in one line.

The run ends when no more replenishment is possible, every remaining pane shows `FERTIG` or has ended, and all
handed-over tasks are integrated or secured as a handover. The notes of the integrator reach you like those of
the leads through `log`, `report` and the closing block. In the report, state the metrics from `report --repo
<repo-root>` briefly and the remaining remote branches of this run collected together. Close with exactly one
closing block (`Für dich`, see [the closing block](../../references/playbook-closing-block.md)) across all
packages; you take its entries from the `notes` in `report`, and unpushed commits appear there under `Nicht
gepusht`.
