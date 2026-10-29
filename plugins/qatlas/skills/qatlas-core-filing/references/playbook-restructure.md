---
description: >
  Procedure for renaming, moving, merging, promoting, archiving and deleting existing files with inventory,
  references, names and navigation.
license: MIT
type: playbook
edit: locked
---

# Restructure

1. **Inventory:** Determine target, edit rights, affected references and possible name collisions before you
   change anything. `edit: locked` needs explicit approval.
2. **Rename and move:** Type prefix and task ID stay stable. Search for references to the old path and
   change only those actually broken.
3. **Merge:** Take all binding statements into the target file at the authoritative place and raise its
   `version`. Then remove the source and point its references to the target.
4. **Promote:** If content becomes more binding, such as a memory becoming a policy, that
   requires a decision by the user. The content moves into a file of the new type in its folder; the old file
   and its index line are removed.
5. **Archive and delete:** Delete a user file only on explicit request. The knowledge space keeps no archive
   folder; Git keeps what was removed. Outside it, keep content in an archive only if the local convention
   provides for it.
6. **Navigation:** Bring read conditions in affected READMEs and index lines in `MEMORY.md` up to date.
