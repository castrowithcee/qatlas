---
description: >
  Shared pattern for real user decisions in every mode: one card at a time, understandable without reading
  the task, and recording the answer at the task.
type: playbook
edit: locked
license: MIT
---

# Present decisions

This applies whenever a mode needs a real user decision. The mode keeps selection, substantive checking and
its closing; this file governs the card and the recording of the answer. Write the card in the interaction
language, its labels and answer line included; the template fixes only its structure.

## Queue

Before the first card, state the number of tasks with open decisions once, such as `3 tasks have open
decisions.` Show no overview, then guide through only the current task. Mutually dependent decisions of one
task run as `Decision 1/2`, `Decision 2/2` before the next task.

## Card

```text
Task 2/5 - <topic in plain words> (#<number>)

Context:
<One or two sentences on the evidenced state and on why the decision is needed.>

To decide:
<The concrete question.>

Options:
1. <Option> - <decisive consequence>
2. <Option> - <decisive consequence>

Recommendation:
1 - <Reason from goal, risk and consequences.>

Answer: 1, 2 or your own direction.
```

- Use the exact identifier from the planning system, or its unique task ID; invent no number.
- Check a decision already prepared in the task against the current state and present it from there.
- Offer one to four genuinely exclusive options. Hide the recommendation neither in their order nor in a
  more favourable wording.
- If the options meet the goal to different extents, name what a partial option drops. A smaller task size
  is no advantage; if the better option is larger, recommend it and name its cut into packages.
- Never number free text as an option; allow it only in the answer line. Output the card in the normal
  conversation, not through a selection tool that adds such an option or separates context from question.
- If the user has to act, replace the options with the action, the exact place or command, the expected
  evidence and why it is needed.
- Wait only for this answer and clarify only this decision; then move to the next card without an interim
  report.

Before a task exists in `shape`, the first line reads `Initiative - <working title>`. Free questions with
which the user first describes an intent are no card.

## Record the answer

- Work the decision or check result into the task's current contract at its substantive place, as concrete
  instructions and verifiable acceptance, not as a separate protocol or a bare source link. A deviation
  becomes a concrete correction with its own acceptance.
- Set the next status by the authoritative contract: `ready` when a draft reaches execution maturity,
  `next` when a new explicit run can continue the task, `review` while a user action stays open, `waiting`
  for an external prerequisite, `draft` while a contract question stays open, `done` when the human
  acceptance completes an already evidenced completion, closed in the same step per the planning system. A
  status the mode may not set stays for `review`.
- After each settled task, update spine and timestamps per the authoritative system.
- If the decision changes an authoritative basis, maintain it at its place and check the affected open tasks
  for stale directives; change no other goal or acceptance silently.
- An answer authorizes no execution.
