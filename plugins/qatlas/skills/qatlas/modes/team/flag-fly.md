---
description: >
  Meaning of --fly in team: the user is unreachable during the run, and the supervisor answers the leads'
  questions itself.
type: playbook
edit: locked
license: MIT
---

# `--fly` in team

The user is unreachable during the run; no step waits for their answer. Before the first lead, settle
everything that would stall the run later, by [deciding without the user](../../references/playbook-autonomy.md).
The flag applies to you alone: the leads keep asking you and never receive it.

Answer a `question` that project knowledge does not settle by the same decision ladder:

- **Assumption:** Pass it on as the answer, record it with `log --type annahme`, and list it under the
  assumption category (`Angenommen`) of [the closing block](../../references/playbook-closing-block.md).
- **Human handoff:** Answer with the instruction to hand the task to `review` and to continue with the
  package's next task.
