---
description: >
  Default of team without --ask: the user is unreachable during the run, and the supervisor answers the
  questions of the leads and the integrator itself.
type: playbook
edit: locked
license: MIT
---

# Team without a reachable user

The user is unreachable during the run; no step waits for their answer. Before the first lead, settle
everything that would stall the run later, by [deciding without the user](../../references/playbook-autonomy.md).
The leads and the integrator keep asking you and never decide in your place.

Answer a `question` that project knowledge does not settle by the same decision ladder:

- **Assumption:** Pass it on as the answer, record it with `log --type annahme`, and list it under
  `Assumed` in [the closing block](../../references/playbook-closing-block.md).
- **Human handoff:** Answer with the instruction to hand the task to `review` and to continue with the
  package's next task.
