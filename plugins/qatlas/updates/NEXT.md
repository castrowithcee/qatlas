---
description: >
  Check instruction for existing projects: declaring fast and expensive checks lets the team integrator skip
  redundant runs.
license: MIT
type: policy
edit: locked
---

# Declare fast and expensive checks for the team integrator

The team integrator takes over a lead's valid evidence for an identical tree and, for a different tree, runs
an expensive check only if the base touched one of its path areas. It needs a declaration for this.

- In the project's native instructions, check whether the shared checks are split. If wanted, name the fast
  shared checks and, per expensive check, its command and path areas (path prefixes or git pathspecs). An
  expensive check without areas counts as affected everywhere.
- Without such a declaration nothing changes: the integrator runs the shared checks as before.
- Propose the declaration to the user before writing it into the project instructions.
