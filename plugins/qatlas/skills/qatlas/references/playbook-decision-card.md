---
description: >
  Shared conversation pattern for fast user decisions on tasks in shape and review, guided one at a time,
  without assuming that the user has read the planning system.
type: playbook
edit: locked
license: MIT
---

# Present decisions briefly

This contract applies when `shape` or `review` needs a real user decision on one or more tasks. The
respective mode keeps responsibility for selection, substantive checking, persistence, status and closing.
This reference governs only the handover in the conversation.

The user is the decider, not a co-reader of the planning system. Every card must therefore be understandable
without prior reading of the task. A link, a task number or a reference to existing context never replaces
the brief framing. Write the card in the interaction language; the templates below fix its structure.

## Name the scope once

First determine the tasks of the decision queue. Before the first card, state their number exactly once:

```text
3 tasks have open decisions.
```

Adjust number and singular to the actual queue. Show no parallel task overview at this point. Afterwards,
guide only through the current task. If one task needs several mutually dependent decisions, clarify them one
after another as `Decision 1/2`, `Decision 2/2` before you move to the next task.

## Show exactly one card

```text
Task 2/5 - #<number> <title>

Context:
<One or two sentences on the evidenced state and on why the decision is needed.>

To decide:
<The concrete decision question.>

Options:
1. <Option> - <essential consequence and the decisive advantage or disadvantage>
2. <Option> - <essential consequence and the decisive advantage or disadvantage>

Recommendation:
1 - <Reason from goal, risk and consequences.>

Answer: 1, 2 or your own direction.
```

- Use the exact identifier and the current title from the planning system. If it has no numeric identifier,
  use its unique task ID; invent no number.
- If the task already holds a prepared decision, check it against the current state and present it from
  there instead of deriving it anew.
- Offer one to four concrete, fundamentally mutually exclusive options. Several are needed only if a real
  choice exists.
- Justify each option briefly by its decision-relevant consequence. Hide the recommendation neither in the
  order nor in a more favourable description of an option; state it afterwards explicitly and with reasons.
- If the options meet the goal to different extents, the consequence of each partial option names what it
  drops as a reduction of scope. A smaller task size is no advantage of an option and no reason for the
  recommendation; if the better option is larger, recommend it and name its cut into packages.
- Free text is not a substantive option. Never list `Free text`, `Other` or `Type something` as a numbered
  option; allow your own direction only in the answer line.
- Output the card in the normal conversation. Use no selection tool that inserts free text as an additional
  numbered option or separates the framing from the decision.
- If the user has to act themselves, replace the options with the concrete action, the exact place or
  command and the expected evidence. Briefly justify why the action is needed.
- Wait only for the answer to this card. In case of ambiguity, clarify only this decision, and after
  processing it move to the next card without an interim report.

## Shape before a task

If `shape` needs a direction decision before a task with an identifier can arise from it, invent no task
identity. State the number of open direction decisions once and replace the first line of the card with:

```text
Initiative - <brief working title>
```

Free clarifying questions with which the user first describes an intent not yet formulated are no such
decision card. As soon as a task exists, the normal task format applies.
