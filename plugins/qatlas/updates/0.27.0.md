---
description: >
  Check instruction for existing projects: declaring fast and expensive checks lets the team integrator skip
  redundant runs, and declaring exclusive test resources serializes their commands.
license: MIT
type: policy
edit: locked
---

# Declare checks and exclusive test resources

Run and team read two optional declarations from the project's native instructions. Without them nothing
changes: the integrator runs the shared checks as before, and commands run without resource serialization.

- **Fast and expensive checks:** The team integrator takes over a lead's valid evidence for an identical tree
  and, for a different tree, runs an expensive check only if the base touched one of its path areas. Check
  whether the shared checks are split. If wanted, name the fast shared checks and, per expensive check, its
  command and path areas (path prefixes or git pathspecs). An expensive check without areas counts as
  affected everywhere.
- **Exclusive test resources:** Commands assigned to a named resource run via `slot --resource <name>`, one
  at a time. Check whether checks share an environment that cannot run twice at once, such as an e2e setup
  with fixed names, or whether the project serializes them with its own lock. If so, name the resource and
  the commands that use it; an own lock then becomes unnecessary.

Propose each declaration to the user before writing it into the project instructions.
