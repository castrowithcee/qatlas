---
description: >
  Procedure for a new file: subject, type, folder, template, name, frontmatter and navigation.
license: MIT
type: playbook
edit: locked
---

# File

1. **Subject:** Determine what the file makes a statement about. Project state and maintenance belong in
   `.qatlas-project/` under the [Project knowledge space](structure.md), domain content at its
   authoritative place.
2. **Type:** Determine the `type` with the questions of the [Frontmatter schema](frontmatter.md). An open
   question of the user is no decision yet; it stays in its plan or task.
3. **Place:** In the knowledge space the type selects the fixed folder. Before creating a file, check
   whether an existing file of the same type and context should grow instead; a policy file per context
   collects further policies of that context.
4. **Template:** Before a recurring user-owned structure, check `.qatlas-project/templates/`. If the task
   requires existing assets or templates of Qatlas, read the [Store index](../../../store/STORE.md), choose
   the fitting entry and open only its files.
5. **Name:** Name it `<type>-<slug>.md`, a task `task-<id>-<slug>.md`.
6. **Frontmatter:** Set it for Markdown by the frontmatter schema.
7. **Navigation:** If the new content must be read for specific work, add an unambiguous read condition to
   the README of the scope.
