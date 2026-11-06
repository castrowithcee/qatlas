---
description: >
  Introduction to Qatlas: purpose, problems solved, principles and storage locations.
type: meta
edit: locked
license: MIT
---

# Introduction

Qatlas is a working foundation for coding agents such as Claude Code and Codex. It gives agent, user and
project a shared structure, so that work stays traceable, economical and safe across sessions, agents and
devices.

## Which problems Qatlas solves

- **Context is lost between sessions.** Project knowledge, decisions and memory live versioned in the repo
  and are loaded at session start as a lean entry.
- **Agents search blindly and burn context.** A cascading navigation leads from `AGENTS.md` to the needed
  knowledge instead of reading whole trees.
- **Filing goes wild.** Files get place, name, ID and frontmatter by fixed rules, and the project's own
  state lives in reserved files with one mission each instead of invented folders.
- **Planning frays.** There is exactly one authoritative planning system, local or external, without a
  mirror.
- **Parallel agents get in each other's way.** Git work runs with a checked state, own worktrees and clean
  commits.
- **Sensitive data lands in the repo.** A configurable protection check detects secrets and personal data
  before the commit.

## Principles

- What the repo says describes the user's reality. User and project instructions take precedence.
- Rules and session context act passively; tools and work loops start only on invocation.
- Qatlas explains and orders, but does not decide for the user.

## Where Qatlas keeps things

| Place | Content |
|---|---|
| `.qatlas-project/` in the repo | project state: the reserved files `CONVENTIONS.md`, `ARCHITECTURE.md`, `TESTING.md` and `CONTRIBUTING.md`, knowledge, memory, the backlog signpost and `zone-import/` and `zone-export/` as transient buffers |
| `.qatlas/plugins/` in the repo | project configuration and the check state of plugin updates |
| `~/qatlas/` | the user's own library with the global working agreement in `AGENTS.qatlas.md` |
| `~/.qatlas/` | technical state such as global configuration, status line and worktrees |

`AGENTS.md` in the repo stays the native project instruction: purpose, project rules and the read
conditions that point into `.qatlas-project/`.
