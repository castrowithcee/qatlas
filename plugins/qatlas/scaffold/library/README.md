---
description: >
  Entry and search path for the user's own Qatlas library with conventions, policies, playbooks and knowledge.
type: meta
edit: shared
---

# Qatlas library

This is the user's own library of reusable conventions, policies, playbooks and knowledge. It is a deliberate
selection, not a complete wiki. Project-specific policies and run reports stay with their project.

An entry applies to a task when its subject fits and no explicit user instruction or project policy
contradicts it. Its location alone does not make it binding for every project. If a project is to follow a
convention permanently, its agent file refers to the entry explicitly.

## Folders

- `conventions/` holds transferable conventions on how work is shaped.
- `playbooks/` holds procedures for recurring activities.
- `policies/` holds binding behaviour and safety policies that apply independently of a single procedure.
- `knowledge/` holds background knowledge and references for fitting tasks.

Before recording something globally, check whether an existing file or folder fits its content and extend
the authoritative entry instead of creating a duplicate. If the place is unclear, propose a concrete one and
ask. A clearly separate subject gets a subfolder in the fitting area with its first entry.

## Search

1. Check the statements and policies of the current project first. Open this library when a recurring user
   convention, a policy, a playbook or general knowledge fits the task.
2. Narrow the area by folder and file names; a complete directory tree is not a default step.
3. Search the candidates first by `description`, then by `tags`, `type` and `status` in the frontmatter.
   Read the bodies of the fitting files only afterwards.
4. Name the authoritative entry when you use it.

## Maintenance

The library belongs to the user; Qatlas updates do not replace existing files. Content changes happen on the
user's request.
