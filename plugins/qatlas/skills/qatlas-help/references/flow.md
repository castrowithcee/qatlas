---
description: >
  Working flow with Qatlas from setup through goal, shape, run, and review to maintenance.
type: meta
edit: locked
license: MIT
---

# Working flow

1. **Set up:** `qatlas-core setup` creates project state, project instructions, the user library, and
   global settings without replacing anything that exists. `qatlas-core doctor` later checks the state.
2. **Clarify the plan:** `qatlas goal <idea>` turns an idea into a plan with answered questions in
   conversation, which `shape` breaks into tasks. Nothing durable is created.
3. **Shape:** `qatlas shape <idea or file>` records confirmed knowledge and cuts small, execution-ready
   tasks. `qatlas shape backlog` reorders existing work.
4. **Run:** `qatlas run` works through at most five tasks in sequence by default; `--limit` changes the
   number, and `--fly` lets the run work without a reachable user. A lead hands out assignments to
   subagents, checks their results, and commits locally. A run never authorizes push, publish, deployment,
   or irreversible steps. `qatlas team` cuts up to four independent packages, with `--leads <n>` up to
   `n`, and has each worked through by its own lead in parallel in tmux.
5. **Accept:** `qatlas review` walks you step by step, with location and expected result, through concrete
   checks and settles one by one the decisions and actions only the user can take.

Every step needs its own invocation; none starts the next on its own. `goal` is optional, and entering
directly with `shape` is valid.

## Without the loop

Even without this loop the agent works with Qatlas: it finds knowledge through navigation, files documents
according to the rules, works in the authoritative planning system, and checks Git before interventions. For
advice, `qatlas-council` starts independent perspectives without implementing anything.

## Maintenance

The user places raw material in `.qatlas-project/zone-import/` and announces it. Plugin updates can bring
project-specific notices, which session start reports and `qatlas-core doctor` shows.
