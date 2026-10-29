---
description: >
  Command card of every explicit Qatlas call, including the optional packs.
type: meta
edit: locked
license: MIT
---

# Command card

| Call | Purpose |
|---|---|
| **qatlas goal [idea, task or file]** | Works out a plan with answered questions in conversation, as the basis for Shape. |
| **qatlas shape [idea or file]** | Records confirmed knowledge and cuts small tasks ready to run. |
| **qatlas shape <task> [--fly]** | Sharpens one clearly named existing task. |
| **qatlas shape backlog [scope] [--fly]** | Sharpens drafts, settles prerequisites and repairs the queue; `--fly` prepares every user decision in its draft instead of asking. |
| **qatlas run [--limit <n\|all>] [--fly]** | Runs at most five tasks in series by default, with a lead and subagents; `--fly` works without questions. |
| **qatlas team [--limit <n\|0>] [--leads <n>] [--fly]** | Works through up to four independent batches of five tasks each in parallel in tmux; `--leads` changes the number of batches, `--limit 0` leaves the batch size to the supervisor. |
| **qatlas review** | Walks through concrete checks step by step and settles decisions one at a time. |
| **qatlas-work tree** | Shows Git worktrees, creates one with `new` or cleans up safely. |
| **qatlas-core setup** | Sets up project state, project instructions, library and settings. |
| **qatlas-core doctor** | Checks dependencies, scaffold, library and update state without repairing anything. |
| **qatlas-core update** | Migrates this project to what installed plugin updates require. |
| **qatlas-core statusline** | Configures the status line of the current host. |
| **qatlas-core backlog-system** | Switches or migrates the authoritative planning system. |
| **qatlas-mode adhd** | Shapes the collaboration for the rest of the session so a reader with ADHD can act on it. |
| **qatlas-help [topic]** | Guides through Qatlas like a handbook. |
| **qatlas-dev [lite\|full\|ultra\|off]** | Sets the level of the code method for the session or turns it off. |
| **qatlas-dev-review** | Reviews a change for bugs, risk, scale, missing tests, speed and bloat, without changing code. |
| **qatlas-dev-audit** | Audits a whole repo the same way, ranked, without changing code. |
| **qatlas-design** | Gives a web page or app screen a researched art direction and checks it in a real browser. |
| **qatlas-council [arch]** | Advises on plans or architecture with independent subagents. |

Claude uses `/<call>`, Codex `$<call>` or the `/skills` menu. `qatlas-dev`, `qatlas-design` and
`qatlas-council` are only available when their pack is installed.
