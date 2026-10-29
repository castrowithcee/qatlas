---
description: >
  Choose the solution before the cut, then cut and split tasks for one session and work them up to execution
  maturity with execution basis, applicable requirements and acceptance.
type: playbook
edit: locked
license: MIT
---

# Cut tasks

A task is cut for one session, understandable on its own and observably acceptable. Cut every task so that a
smaller worker model can usually handle one task as a bounded assignment. For the local backlog, the contract
of the backlog norm and its canonical templates determine fields, naming and lifecycle; use no user template
as a substitute for these system files. For an external system, its binding applies.

Choose the solution before the cut, by goal, correctness and follow-up costs; the expected size plays no part
in that choice. Size is a signal to split, never a reason for a weaker solution. A simpler solution is
preferable only if it fully meets the goal, for instance because the additional scope serves no evidenced
requirement or a later change stays cheap and reversible. A solution that meets the goal only in part is a
reduction of scope and therefore a user decision. A circumstance such as few affected users or test
environments only can justify order and a short-lived intermediate state, never the target itself.

Separate results that can be accepted on their own into tasks of their own already here. Several
independent tool or endpoint groups, different risk and permission boundaries or an expected scope that binds
a worker over many implementation and check steps are signals to split. More than about three to four new
operations or an expected 500 to 800 new lines serve as a check value; the numbers are no rigid limit. Keep
tightly coupled steps together if separate acceptance would be artificial. Every package needs its own
observable completion and a concrete check path, and leaves a consistent state. Plan the integration and the
substantive order between dependent packages. The package that reaches the target belongs to the same cut:
create it with the others, as `draft` if a question remains open. When you split an existing task, preserve
the confirmed goal and acceptance of the original work completely, carry the applicable decisions and
security boundaries concretely into every new contract and leave no empty remainder task.

First form a provisional package cut, then evidence the execution basis under the backlog norm for every
package that works on an existing system. Follow the actual existing flow far enough for that. Name the
change surfaces in implementation, configuration, tests and documentation with path or system and reason,
missing check options explicitly, and a necessary permission for `edit: locked` that the run invocation does
not cover as a special editing right. The execution may include further files within the substantive scope
on its own; a necessary effect outside it is a contract question. For a package without existing state, mark
non-applicable points with a reason instead of inventing an artificial analysis of the existing state.

- If an open question already prevents a sensible cut, clarify it before creating the task.
- If the cut stands but result, scope, approach or acceptance remain concretely open, create a `draft` and
  record the question in the substantively fitting section. Create no general collection of open questions.
- Work clarified answers in at their substantive place, remove outdated alternatives and set `ready` only
  once execution maturity is reached. A task whose unexamined current state could substantially change
  result, scope, approach or acceptance stays `draft`.
- Leave reversible technical details in the explicit decision latitude; they are no reason to ask.
- Work the decisions, conventions and requirements that apply to this subject into the task as concrete
  instructions and acceptance criteria. Name stable sources briefly for verification. A link alone replaces
  no binding statement; a complete repetition of the project documentation is just as wrong.
- Name cross-cutting security and target boundaries explicitly where they apply: for instance binding an
  object ID to the chosen target, treating foreign content as data and required permissions. Anchor
  prescribed reference comparisons and edge-case checks in the acceptance so that a green standard test does
  not silently replace them.
- Keep the task as a current snapshot. A new task starts without a planning log and without earlier
  handovers.

Clarify goal, cut, acceptance and execution basis of the packages in the next horizon through your own
examination and targeted user decisions, up to `ready` where possible. Do not end the shaping with avoidable
drafts. A genuinely open contract question, a missing permission or a basis not yet available stays visible
under the status model; invent no certainty. Survey later horizons in project documentation and milestones,
but materialize only sufficiently understood packages. No hard task count applies, only executable maturity.

Group only related or dependent packages in one project. Maintain the authoritative roster and the
substantively executable order along with them.
