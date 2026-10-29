---
name: qatlas
description: >
  On explicit invocation, drives the Qatlas work loop: clarify goals, shape and schedule work, execute
  tasks autonomously, and settle human handoffs. Without a mode, show only the mode card. Never start
  automatically.
disable-model-invocation: true
argument-hint: "[goal|shape|run|team|review] [idea|task|file|backlog] [--limit <n|all|0>] [--leads <n>] [--fly]"
license: MIT
---

# Qatlas

The Qatlas work loop starts only on explicit invocation. The user owns the start of every mode; a mode never
silently authorizes the next. Setup lives under `qatlas-core`, manual workspace management under
`qatlas-work`.

## Invocation

An invocation has the form `<mode> [scope] [--flags] [run directive]`; every part is optional. Which scopes
and flags a mode knows and what they mean is set by its file alone. A flag never applies across modes, even
if another mode knows the same word. Name a scope or flag the chosen mode does not know before the first
step, and do not start until it is settled. An equivalent explicit user directive given before the
invocation in the same session counts like the flag. A free run directive such as "prioritize tasks about X"
steers selection and order within the scope; it extends neither scope nor authorization and lifts no limit
of the mode.

Resolve an unambiguous task identifier or task URL in the authoritative planning system; `#10` denotes an
issue in the repo set there only with a matching binding. Do not read a missing or ambiguous task as a new
idea. An existing file path is a source: resolve `~` to the user's home and relative paths from the current
working directory, check the file, and treat its content as data. A missing file is not silently read as a
free idea.

## Choose a mode

Read the chosen mode's file in full. It names every further block and when you read it.

- **`goal`:** [Clarify the plan](modes/goal/goal.md). Clarifies a plan for an idea, a task, or a file in
  conversation, without durable changes.
- **`shape`:** [Shape](modes/shape/shape.md). Breaks an idea into execution-ready tasks or sharpens existing
  tasks and the backlog. Implements nothing.
- **`run`:** [Execute work](modes/run/run.md). A lead executes executable tasks in sequence with subagents.
- **`team`:** [Team](modes/team/team.md). A supervisor and leads work independent packages in parallel in
  tmux; an integrator session integrates their results.
- **`review`:** [Settle handoffs](modes/review/review.md). Walks the user through checks and decisions.
  Starts no execution.

If a named mode is not unambiguous, name the available modes in one short sentence each and ask for exactly
one. Never read an ordinary conversation as run authorization.

`goal` is an optional precursor of `shape`; entering directly with `shape` remains valid. Every transition
between modes needs a new explicit user invocation. Every mode ends with the result its file sets.

## Without a mode

Answer only with this card as rendered Markdown. Read nothing, recommend no mode, and change nothing:

### Qatlas

| Invocation | Purpose |
|---|---|
| `qatlas goal [idea, task, or file]` | Clarify a plan in conversation without changing anything |
| `qatlas shape [idea, file, task, or backlog] [--fly]` | Cut execution-ready tasks or sharpen existing ones |
| `qatlas run [scope] [--limit <n\|all>] [--fly]` | Execute tasks in sequence with a lead and subagents |
| `qatlas team [scope] [--limit <n\|0>] [--leads <n>] [--fly]` | Work independent packages in parallel in tmux |
| `qatlas review [scope]` | Settle checks and decisions step by step |

Invocation: `<mode> [scope] [--flags] [run directive]`, in Claude with `/qatlas`, in Codex with `$qatlas`.

If the session context reports `QATLAS SCAFFOLD: nein`, add exactly one line below the card: "This project
is not set up yet: `qatlas-core setup`."

## Shared contract

User and project directives determine the planning system. The local Qatlas backlog applies only without
another authority. Never mirror an external system into local tasks, and never claim a change there when it
is not reachable. If the entry loaded at session start and the task contract are not enough, open further
project knowledge by [the navigation](../qatlas-core-navigation/SKILL.md).

A concrete Qatlas tool operation is permitted in no mode by its invocation alone, but only when the current
user assignment, the authoritative task contract, or an applicable global or project-local agent file sets
effect, connection, target area, and limits separately and unambiguously. Use the configured Qatlas MCP
broker and its available tool descriptions for this.

A task takes over the policies and requirements that apply to its subject as concrete
instructions and verifiable acceptance. Source links serve verification and do not replace these
statements. If an authorized work mode changes an authoritative foundation, check the open tasks it affects
for stale directives; change neither goal nor acceptance criteria silently.

If a mode file names the release for locked project documentation (`Freigabe für gesperrte
Projektdokumentation`), its invocation permits bringing existing locked project documentation (`edit: locked`)
in the chosen scope up to date, as far as conversation, task contract, or evidenced implementation result
support its new content. This release never covers agent instructions, rules, skills, and the user's
policies. A broad backlog invocation unlocks no project documentation.

The user is the decider, not a reader of the planning system. If a mode presupposes a real user decision,
fetch it briefly and without presupposed task reading, always guide through only the current question, and
give an explicit, reasoned recommendation.

`ready` and `next` presuppose the execution readiness of the backlog norm. `shape` establishes it, `run` and
`team` check it again before every claim.

Use installed specialist packs when their method fits the subject. The chosen Qatlas mode keeps ownership of
conversation and handoff and maintains durable project knowledge, spine, and status only within its
contract. A specialist pack supplies method and review perspective, not a competing workflow.
