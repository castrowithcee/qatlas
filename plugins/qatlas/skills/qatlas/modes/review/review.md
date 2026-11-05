---
description: >
  Human-in-the-loop procedure for a Qatlas run: guides the user quickly through concrete checks and settles
  secured decisions, acceptances and user actions without continuing the substantive execution.
type: playbook
edit: locked
license: MIT
---

# Settle handoffs

Open human handoffs go in; settled, executable-again or deliberately ended tasks come out. The agent prepares
what the user would otherwise gather and leads them by the shortest path through what only they can judge.

## Invocation

`review [scope]` takes a task, a project or, without scope, all open handoffs of the authoritative planning
system. `review` knows no flags and receives no permission for locked project documentation. It covers
reading the current state, changes to spine and decisions, and one local collective commit at the complete
end. Implementation, workers, technical tests, integration, external effects and pushes stay out.

## Reading list

The blocks repeat nothing from this file or from each other; what you do not read is missing in this run.
Read each one completely at the stated time:

1. **Before the first step:** [the backlog norm](../../../qatlas-core-backlog/SKILL.md).
2. **Before the first handoff:** [presenting decisions](../../references/playbook-decision-card.md).
3. **Before the collective commit:** [the git norm](../../../qatlas-core-git/SKILL.md) and its
   [commit reference](../../../qatlas-core-git/references/playbook-commit.md).

## Build the queue

1. Determine the planning system and the chosen scope. If `.qatlas-project/README.md` exists, follow only
   the read conditions relevant to the chosen handoffs.
2. Read only roster or external metadata first and build the queue from `review` and explicitly open user
   decisions, checks or actions. Mature no drafts and change no task with a running worker.
3. Read only the queue's tasks fully and gather current state, evidence, open question, recommendation and
   consequences from their current record. Open history only on a contradiction, missing decision-relevant
   reasoning or an explicit reference, and ask nothing that the current state already settles.
4. For git, check root, branch, upstream, worktrees and status. A new review starts clean; a continuation
   carries on only its unambiguously assigned decision diff.
5. Classify each handoff. A **check** exists only if there is a concrete result the user must look at, run
   or try. Tasks whose completion is fully evidenced and need only the formal acceptance form one **bulk
   acceptance**: one line per task with topic and result, and one question whether to close all of them;
   the user may exclude single ones. Everything else is a decision or user action.
6. State only the number of tasks in the queue, then begin with the bulk acceptance, followed by one card at
   a time.

## Run a check

Prepare the check fully before addressing the user: from acceptance criteria, final report and diff, work
out what changed, where it shows and how success shows. Present only what the user must see or judge; they
do not repeat what machines evidenced.

Present the check first as a card whose decision is whether it runs now: `Check now` with number and place
of the steps, or `Skip`, after which the task stays unchanged in `review`. After `Check now`, show one step
at a time:

```text
Check 1/2: <what is checked, in one sentence>

Where: <exact path, URL, command or view, directly usable>
Do: <the one action>
Expected: <the observable result>

Answer: ok, describe the deviation, or skip.
```

- A step is one action with one observable result; combine what the user can check in one go. It carries
  no background and no review of the run.
- After `ok`, the next step follows without an interim report.
- After a skip, the task stays unchanged in `review` and you go to the next task. Handle any other message
  first, then continue or end the check as it requires.
- Record a deviation briefly with expected and observed result and ask only if it would otherwise not be
  traceable. Run further steps of the task only if they stay meaningful despite it.

## Finish

Record every answer and check result as presenting decisions describes. Create no intermediate commit, and
check after each answer that the control branch was not changed by someone else. Only when every handoff of
the initial queue is settled or skipped, read the full diff and create exactly one local collective commit
per affected repo per the git norm; the explicit invocation replaces the prior approval of its message.
Show message and ID afterwards. With an open rest or an early end, commit nothing. Push nothing.
