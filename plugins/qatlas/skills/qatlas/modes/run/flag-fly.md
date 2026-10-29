---
description: >
  Meaning of --fly in run: the user is unreachable during the run, and the lead decides, assumes, or hands
  off without waiting.
type: playbook
edit: locked
license: MIT
---

# `--fly` in run

The user is unreachable during the run; no step waits for their answer. Before the first task, settle
everything that would stall the run later, and decide every question that would otherwise need the user by
[deciding without the user](../../references/playbook-autonomy.md). You set a human handoff to `review`
after the acceptance block and continue with the next independent task. You record every assumption in the
task and list it under the assumption category (`Angenommen`) of [the closing
block](../../references/playbook-closing-block.md).
