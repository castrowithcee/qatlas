---
description: >
  Contract for central git worktrees: branch names, path, collisions, creation, ownership, and safe
  cleanup, shared by Qatlas Work Tree and Qatlas Run.
type: policy
edit: locked
license: MIT
---

# Worktree contract

Git registers all worktrees of a repo together; this register is the authoritative source. The folder under
`~/.qatlas/state/worktrees/` is only the shared storage location for all agents of the same user.

## Creating

1. Determine git root, primary working tree, branches, worktrees, and full status. Commit and stash
   nothing. Local changes stay in their working tree and do not reach the new one.
2. If the repo demonstrably follows a branch convention of its own from project requirements or
   consistently named branches, it applies. Otherwise a task branch is called `task/<id>-<slug>`; `<id>` is
   the identifier from the spine as an ASCII slug, `<slug>` comes from the task file name or title. Work
   without a task gets a unique `work/<purpose>` branch. A sub-branch appends `--<role>` to the name of its
   task branch, for example `task/0042-export--tests`. If a branch `task` or `work` already exists, `-`
   replaces the slash after that prefix. What the agent names itself never names Qatlas, an agent, host, or
   model, because branch names can end up in the repo's history.
3. Determine the path with `node <plugin-root>/scripts/qatlas-worktree-path.js <branch> --target <repo-root>`;
   `<plugin-root>` is the `QATLAS PLUGIN ROOT` named in the session context. Worktrees already registered
   at a different path stay there.
4. Check name, branch, and path collisions against the git register and the file system. Overwrite nothing.
   If a collision does not unambiguously belong to the same work, form a distinguishable purpose or stop.
   Reuse an existing branch or worktree only if it demonstrably belongs to the same open work.
5. An existing local branch starts at its own tip and is never reset. For an unambiguous remote branch of
   the same name, a local tracking branch may be created. For a new branch, the start point following from
   the assignment or spine applies, otherwise the current `HEAD`.
6. Create the worktree exclusively with `git worktree add`, without `-B` and `--force`, and check the entry
   afterwards via `git worktree list --porcelain`.

A worktree contains only versioned files. Ignored files, embedded repos, and local state such as `.env` are
missing there and are not copied in. Checks that need such content run in the primary working tree as long
as no other writer works there.

## Ownership

A task's namespace comprises its task branches, their sub-branches, and the worktrees derived from them. It
belongs to the lead that claimed the task; only that lead creates branches and worktrees in it, integrates,
and removes them. A name does not establish ownership; the claim and the git register remain authoritative.
Worktrees belong to a piece of work, never to an agent identity. If a lead hands a task over to another
integration owner, the namespace passes along: only the latter integrates and cleans up afterwards; the
handing-over lead no longer touches the handed-over branches and worktrees.

## Cleaning up

1. Re-read the register and resolve the target unambiguously. Never remove the primary or the current
   working tree.
2. In the target, check status, untracked files, branch, upstream, and non-integrated commits. The
   integration target of a sub-branch is its task branch, that of a task branch the control branch. Check
   with `git merge-base --is-ancestor <branch> <target>` whether the branch tip is contained in it. After a
   squash merge this check always fails; integration then means the squash evidence: the branch's pull
   request is merged, its merge commit is on the control branch, and `git rev-parse <merge-commit>^{tree}`
   equals `git rev-parse <branch>^{tree}` of the last checked, unchanged branch tip. If the working tree is
   not clean, the target is not unambiguously established, or neither evidence is provided, remove nothing
   and show the concrete state. Claimed work of a running or unknown worker stays.
3. Remove a clean, fully integrated working tree with `git worktree remove <path>` without `--force`.
   Afterwards remove with `rmdir` the intermediate folders that have become empty, including the repo
   folder; `~/.qatlas/state/worktrees/` itself stays.
4. Delete the local branch after the target check only with `git branch -d`. If the command fails, do not
   force the deletion; the only exception is a branch with provided squash evidence, which `git branch -D`
   may remove. Remote branches are deleted only on explicit request or under a rule of the running
   procedure; name remaining ones collectively in the closing.

Discarding a dirty or non-integrated strand is a destructive action of its own: show the exact state and
obtain explicit confirmation for exactly that worktree. Never delete a worktree folder by hand.
