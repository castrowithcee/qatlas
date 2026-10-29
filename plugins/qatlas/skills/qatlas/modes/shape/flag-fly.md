---
description: >
  Meaning of --fly in shape: the user is unreachable, so shaping does all work that needs no user and leaves
  every user decision as a prepared card in its draft.
type: playbook
edit: locked
license: MIT
---

# `--fly` in shape

The user is unreachable during the run; no step waits for their answer. Do all work that needs no user:
examine the current state, evidence the execution basis, choose the solution, cut and split. Decide every
question that would otherwise need the user by [deciding without the user](../../references/playbook-autonomy.md),
with one difference: what it would hand over to the user stays in the draft as a prepared decision instead of
going to `review`.

Record each prepared decision as a card per [presenting decisions
briefly](../../references/playbook-decision-card.md), in the language of the task and in its substantively
fitting section: evidenced state, decision question, options and recommendation. A later `shape` presents it
from there. The task stays `draft`. Set `ready` only when execution maturity needs no user decision. Record
every assumption in the task.

In the closing, name instead of the dialogue the tasks with prepared decisions, each with its decision
question in one line, and the assumptions made.
