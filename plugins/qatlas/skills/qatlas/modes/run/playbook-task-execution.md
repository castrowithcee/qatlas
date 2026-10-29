---
description: >
  Implement the active task of a run with bounded subagent assignments, monitor the subagents and record
  side findings.
type: playbook
edit: locked
license: MIT
---

# Execute a task

Per run, at most one task is `in-progress` at any time; the selected tasks run one after another. Claim it in
the spine immediately before the first writing execution. No subagent changes the spine or branch
management, creates commits or starts its own subagents.

## Commission subagents

The lead gives each subagent exactly one bounded assignment with task ID and title, working location,
permitted targets, scope-out, acceptance criteria, checks and return format. It does not implement the
substantive solution itself. Small status, integration and verification steps stay with it. Exception: if
the entire result of a task is a small, low-risk change to a few files that it has to check completely
anyway, it implements it itself; the card then says `Subagents: none`.

For an implementation task, the subagent does not update lasting project documentation itself. It reports
existing statements that its change invalidates, as well as evidenced new obligations or couplings for
future work, with location and evidence; without a finding it justifies `Keine`. If documentation is itself
an explicit task result, it may edit it. The lead is responsible for the follow-up after
integration.

Before every spawn, assess the actual assignment and its verification effort: which results can be accepted
independently, which steps depend on each other, which security and target boundaries apply, and which
acceptances can the lead itself evidence after the return? Several independent tool or endpoint
groups, different risk and permission boundaries, or a scope that ties a worker up across many implementation
and checking steps call for a smaller cut.

If the whole acceptance already lies in a viable task contract, split it if needed into ordered worker
assignments A, B and further ones, each with its own verifiable milestone. No new backlog tasks arise from
this. Check and secure each milestone before the next assignment; later assignments take over the confirmed
state. An independent milestone or a preparatory mechanical refactoring yields at least one commit of its own
under the commit boundary of the git norm, and with integration via pull requests with squash merge a pull
request of its own as described in [integration via pull requests](../../references/playbook-git-pr.md). If,
on the other hand, the task contains self-contained results whose boundaries, order or acceptance the
contract does not yet clarify, after the maturity check set it to `draft` and hand the cut over to `shape
<unambiguous task>` for clarification at the existing location. Do not invent the missing planning in the
run.

For each bounded assignment, choose `light` first. Use `standard` when its described technical trade-offs
are needed, and `demanding` for an evidenced difficult diagnosis or tightly coupled implementation that
cannot sensibly be split further. Scope alone does not justify `demanding`. A small worker does not first
have to fail for this. Briefly justify `standard` and `demanding` before the spawn; a model change does not
reset the correction budget.

Derive the assignment from the current task contract and the confirmed preflight. It contains, in this
order:

- **Goal:** observable result of the task.
- **Working basis:** starting state, existing entry points, expected change surfaces, authoritative sources
  and needed execution prerequisites. Label expected surfaces as a work card, not as a rigid file permission,
  and pass on no secrets.
- **Scope:** permitted substantive goals as well as an explicit scope-out.
- **Guardrails:** binding architecture, security, compatibility and documentation boundaries as well as the
  room for decision, each as a concrete working instruction instead of a mere source link. In particular,
  check the binding of foreign object IDs to the chosen target and the handling of untrusted content, as far
  as the task touches such boundaries. Instruct the subagent: if the contract leaves a target or permission
  boundary open, it chooses the narrower reading and names it in its return; it never widens access or
  effect from its own interpretation.
- **Budget:** number of subagents used for this task and remaining correction attempts.
- **Worker profile:** chosen profile with model, effort or its lack of support, and, for `standard` or
  `demanding`, the reason.
- **Stop condition:** all acceptance criteria assigned to the subagent and agreed checks are met, for a
  larger implementation the agreed milestone is reached, or a contract, permission, risk or external-effect
  boundary is reached.
- **Return:** changed files, checks run with result, documentation findings with location and evidence or a
  justified `Keine`, deviations from the expected change surfaces, unresolved risks and side findings with
  location and evidence.

A small task is normally implemented by one subagent. If the same task legitimately needs several separate
roles or target areas, the lead may use two or more subagents. Their assignments must demonstrably
complement each other, must not build competing solutions and remain together within the error budget of
this one task. The git workflow isolates simultaneously writing subagents. Full tests of simultaneous
writers run via `node <plugin-root>/skills/qatlas/scripts/qatlas-run-tools.js slot -- <test command>`, which
limits them repo-wide. `slot` blocks until the command ends and passes its exit code through: run a full
test through `slot` in the foreground or through the host's background execution with its completion notice,
and never wait by polling processes (`pgrep`, `ps`) or lock folders. `slot status` (without `--`) prints busy
and waiting slots as one read-only JSON line. A further task begins only when the active task is completed or
securely handed over.

The subagent may include an unpredicted file on its own if it demonstrably lies within the substantive
scope, and names the deviation in its return. If an effect outside the scope would be necessary, or the
current state contradicts a binding substantive source, it stops before that effect and returns the finding
to the lead. It does not extend the contract itself. A defect, a security risk or demonstrably wrong
documentation outside the scope it does not fix, but reports as a side finding.

After a successful start, send exactly one brief card:

> **Task:** #84 - Switch file access to SQL
>
> **Subagents:** light: sonnet (low)

Use ID and title from the spine. For each started subagent, name the chosen profile and the model-effort
combination in short form. If the host does not report the actual combination back, name the requested one
and mark it "requested"; stop only on an evidenced deviation. If the needed subagents are missing, stop
before implementation and report this prerequisite. The lead does not replace them as a silent
subagent.

## Monitor subagents

Observe work state and returns against task contract, actual diff and agreed evidence. Intervene if a
subagent leaves the scope, omits a prescribed check or reference comparison, hangs without progress or
prepares an excluded effect. Limit or stop its assignment instead of burning tokens with further unspecific
prompts.

## Record side findings

What the run notices outside the active task contract it does not fix. Record each of the following findings
as `draft` in the spine before the next task, even if the run scope does not include creating further work:

- an evidenced defect in existing behavior,
- a possible or confirmed security risk,
- demonstrably wrong documentation.

The draft names the finding, location, evidence and the task during which it was found; if the planning
system supports labels, it carries `run-fund`. Elaboration, cut and maturity stay with `shape`. If an
existing task already covers the finding, create nothing and name that task. The same pattern in several
places yields one draft. Improvement ideas, refactoring, style questions and possible extensions are not side
findings and are not recorded.

An unfixed security risk never reaches a publicly viewable place, neither spine, task, final report, commit
message, branch name, pull request nor comment. What matters is the visibility of the place where the entry
actually lies: an issue in a public repo is public even if the board that manages it is private, and a local
backlog shares the visibility of its repo and its remotes. Record it as a draft only if that place is
evidenced to be non-public, for example via the verified visibility of the repo. If it is public or its
visibility cannot be evidenced, record nothing and report the risk exclusively in the closing under the
security category (`Sicherheit`) of [the closing block](../../references/playbook-closing-block.md). Even in
a non-public place, the entry contains no secrets.
