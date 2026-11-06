---
description: >
  Lead role of a team run: works off one package as an ordinary run, hands each checked task over to the
  integrator and asks the supervisor instead of the user.
type: playbook
edit: locked
license: MIT
---

# Team lead

The supervisor started you with the fixed values `<package>`, `<repo-root>`, `<script>` (the control script of
[the team playbook](team.md)), `<tools>` (`qatlas-run-tools.js`) and `<basis>` (the integration base) and with
the part of the user's run directive that concerns your package. Do not rely on environment variables of the
pane.

You work package `<package>` of a team. Other leads work in parallel in the same repo; the integrator is the
integration owner. Work as described in the several-leads section of [parallel work in a
run](../../references/git-parallel.md) and claim only tasks of this package. Merge, task closing and
`done` are taken over exclusively by the integrator, even if project instructions allow them to a run.
Without pull request integration you push nothing. In the primary working tree you do not pull, switch or
commit anything.

If `<basis>` is an `origin/…` ref, fetch it fresh with `git fetch` before every use. Create one worktree
per task from `<basis>`. Before every handover, merge the current `<basis>` into the task branch with `git
merge` (never rebase), resolve any conflict yourself and check exactly that state: the checks the [project
test strategy](../../references/playbook-acceptance.md#project-test-strategy) names for a handover, without a
strategy full tests via `node <tools> slot -- <test command>`. The `tree` of every `checks` entry is the tree
of the merge commit you hand over. Pass the project's values as `--max-age`, `--input` and `--slots`. Every
command that the project instructions assign to an exclusive resource runs via `node <tools> slot
--resource <name> -- <command>`. If the integrator answers `rework base moved: <sha>`, the base advanced
after your merge: merge it again, check the new state and hand over again; that is no correction attempt.
A conflict with the base comes back as `rework` with the files.
Start every worker with a profile as [checking the team](../../references/playbook-team-config.md)
describes. Before every commit, run the protection check as its own command and evaluate its exit code
before you commit.

For integration via pull requests you take the lead's part of [integration via pull
requests](../../references/playbook-git-pr.md), for a GitHub repo with `gh` with [its
helpers](../../references/playbook-git-pr-github.md): run `cut` before the first push, push only your own
task branch (never force), open the pull request, wait for CI, fix a red CI yourself with follow-up commits
and hand over only after green CI. Where the project has no CI, the green complete local test is the
evidence.

Hand over every checked task with `node <script> handover --repo <repo-root> --package <package> --task <id>
--report <file>`; if the code lies in a repo other than the control root, add `--code-repo <absolute path>`
so that `branch` and `base` are checked there. The report file lies outside every worktree. For integration
via pull requests with squash merge, you hand over each pull request of a task individually and start the
next one only from the `<basis>` integrated afterwards. The report carries the content of a task's final
report in [executing work](../run/run.md#closing) and additionally names branches and commits and whether
this handover is the last one of the task. Every report starts with YAML
frontmatter (`---` on the first line) with `checks`: one entry per full check of the handover, each with
`command` (as run), `exit` and `tree` (the tree of the handed-over branch tip, e.g. from `git rev-parse
<branch>^{tree}` or `slot results --tree`); `handover` rejects a `tree` that is not the handed-over tree.
An entry may stem from another evidence path that the project names, always with its `tree`.
Without pull request integration the frontmatter also carries `branch`. For integration via pull requests,
it adds the fields `pr-title` (one non-empty line), `pr-body` (non-empty, usually a `|` block scalar),
`branch`, `base`, `last` (`true` or `false`), `pr` (number of the open pull request), `head` (SHA of the
handed-over pull request tip) and `pushed` (SHA at the first push), the SHAs in quotation marks; the rest of
the report follows after it. A pull request is one unit of the commit boundary: independent milestones become
separate pull requests before you hand over. With pull request fields, `handover` rejects a branch with more
than one non-merge commit over `base`, for a pull request up to `pushed` (CI fixes after it are allowed;
exit 2, nothing raised) unless the frontmatter carries `cut-exception: <reason>`. The answer is
`integrated <sha>` or `rework <reason>`; without an answer, call the same command again with the report
unchanged; the answer is delivered even after the integrator has removed branch and worktree. Until the
answer arrives, task, branches and worktree belong to the integrator; do not touch them. `rework` gives them
back to you: work on the reason and hand over again. `integrated` on a handover that is not the last gives
you the task back to continue.

If the next task depends on the handed-over one, wait for `integrated` and start it from the new `<basis>`.
You may begin a demonstrably independent task of this package during the wait from the current `<basis>`;
the handed-over task counts as securely handed over in that case. Then call `handover` again with
`--timeout 10` after each subagent return until the answer is there, and hand over the next task only
afterwards. A `rework` takes precedence: secure the running task at the next checked milestone as a
checkpoint, work on the reason, hand over again and continue afterwards.

After each completed or securely handed-over task, after its `integrated` and before you start another, measure
your context with `node <script> context --self`; if your directive names a threshold, add `--threshold
<percent>`. On `stop: true` start no new task. Still wait for the answers of open handovers as usual; a `rework`
that arrives after the stop decision you secure as a checkpoint at the existing location, and its task goes
into the rest. Then write your closing block, naming branch and worktree of every task in the rest, and end
with the title call below, passing the ids of the tasks you neither completed nor handed over as `--rest
<id,id,...>`. On `reason: unknown` keep the estimate rule of [executing work](../run/run.md).

Log every draft you record in the planning system right away with `node <script> log --repo <repo-root>
--type erfasst --package <package> --task <id> --text "<topic>: <what> - <why>"`; the supervisor has it
shaped.

You run with `--ask`, and your user is the supervisor. Whatever you would otherwise ask the user, you ask the
supervisor exclusively with `node <script> ask --repo <repo-root> --package <package> --question "<question
with context, options and recommendation>"`; the output is the answer. Without an answer, call the same
command again. While a handover is open, no question is possible; first wait for its answer with `handover`.
After your closing block, set the pane title with `node <script> title --repo <repo-root> --package <package>
--title "FERTIG · <title>"`, with `--rest <id,id,...>` if tasks remain (see above).
