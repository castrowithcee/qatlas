---
name: qatlas-core-filing
description: >
  Create, name, file, rename, move, merge, promote, archive or delete files according to the rules, change
  Markdown content, insert references and process raw material from .qatlas-project/zone-import/ once the
  user announces it or names the path: sets place, name, type and frontmatter and keeps navigation and
  references consistent. Also tidies an existing project structure with qatlas-core-filing migrate. Not for
  pure reading, for code changes inside existing files or for conversions outside the import zone.
license: MIT
---

# qatlas-core-filing

The place of a file follows the subject of its statement. Neither Markdown, agent readership nor habit decide
it alone. Inside `.qatlas-project/` the fixed folders decide, and each folder holds only its types.

## Names and format

- Use kebab-case, plain ASCII and no spaces for ordinary file and folder names. Müller becomes `mueller`.
- Reserved function and agent files keep their fixed capitalisation: `README.md`, `AGENTS.md`, `CLAUDE.md`,
  `MEMORY.md`, `BACKLOG.md`, `IDEAS.md`, `FRAMEWORK.md` and `INDEX.md`. Existing function files keep their
  purpose and local scope.
- Content files in the knowledge space start with their frontmatter `type`; only tasks add an ID.
- Write dates as `YYYY-MM-DD`. Chronological files may start with this date.
- Write ä, ö, ü and ß directly in German files. Do not use em dashes or en dashes as punctuation.

## References

Every reference creates maintenance. Create one only when the task really needs the target.

- Refer to whole files, not to lines or sections, and at most once per file to the same target.
- Do not link anything that is always in context anyway.
- Do not duplicate a norm. Merge material with the same purpose.
- Content and documentation do not refer to the meta level such as agent files, rules or skills.
  Dependencies run from meta to content.
- Phrase reading obligations unambiguously: "Before you do X, read …", "Details on demand in …" or "Open
  only when you actually do Y".

## Protect what exists

Read an existing file before changing it. Respect its frontmatter and local structure. Make a change at the
authoritative place instead of creating a near-identical copy. Templates, seeds and plugin material never
replace user files wholesale. Never create a folder in the knowledge space beyond its fixed folders unless
the user explicitly asks for it.

## Choose the operation

If creating, changing or moving a file follows a canonical template or a domain contract, such as a task
including its completion into `done/` under the local backlog contract, template and contract suffice. Read
the references below only for what both leave open. Otherwise read the operation's reference fully before
the operation:

- Create without a fitting template: [File](references/playbook-create.md)
- Rename, move, merge, promote, archive, delete: [Restructure](references/playbook-restructure.md)
- Import: [Import](references/playbook-import.md)
- Set or change frontmatter, including by any content change to a file with `version`:
  [Frontmatter](references/frontmatter.md)
- Determine folder, name or task ID in the knowledge space: [Project knowledge space](references/structure.md)
- `qatlas-core-filing migrate`, or the user asks to tidy the project structure:
  [Migrate](references/playbook-migrate.md)
