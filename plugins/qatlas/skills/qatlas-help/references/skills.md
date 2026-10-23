---
description: >
  Overview of the explicit entry points, the automatic core skills and the optional packs of Qatlas.
type: meta
edit: locked
license: MIT
---

# Skills

Qatlas separates skills that only the user starts from skills the agent loads by itself when the occasion
fits.

## Explicit entry points

- **`qatlas`:** the work loop with `goal`, `shape`, `run` and `review`.
- **`qatlas-core`:** rare administration such as setup, diagnosis, status line and switching the planning
  system.
- **`qatlas-work`:** single procedures outside the loop, such as managing Git worktrees.
- **`qatlas-mode`:** collaboration modes for the rest of the session, such as for readers with ADHD.
- **`qatlas-help`:** this handbook.

## Automatic core skills

| Skill | Applies when | Purpose |
|---|---|---|
| `qatlas-core-navigation` | a request needs context from the repo | Finds knowledge through entry points, reading conditions and frontmatter |
| `qatlas-core-filing` | files are created, changed, moved or imported | Sets place, name, identifier and frontmatter and keeps references consistent |
| `qatlas-core-backlog` | planning or task work is due | Works in the single authoritative planning system by its rules |
| `qatlas-core-git` | work happens in a repo, or commits and pushes | Checks state, protects parallel work and keeps commits clean |

Each core skill first loads only its short core and reads details for the concrete operation.

## Optional packs

- **`qatlas-dev`:** method for code work, the smallest change that fully solves the task;
  `qatlas-dev-review` reviews a change and `qatlas-dev-audit` a whole repo.
- **`qatlas-design`:** art direction and a strict house style for web pages and app screens, checked in a
  real browser.
- **`qatlas-council`:** independent subagents advise on ideas and plans, and with `arch` on technical
  architecture.

Packs add method, but own neither the conversation nor the planning system.
