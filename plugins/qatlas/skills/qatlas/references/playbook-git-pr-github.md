---
description: >
  GitHub helpers for integration via pull requests when the target repo is on GitHub and gh is available:
  access, waiting for CI with ci-wait, landing with land, branch update and merge queue.
type: playbook
edit: locked
license: MIT
---

# Pull requests on GitHub

These helpers perform the platform steps of [integration via pull requests](playbook-git-pr.md) for a target
repo on GitHub; their contract stays the one defined there. `<tools>` is
`<plugin-root>/skills/qatlas/scripts/qatlas-run-tools.js`.

- **Access:** `gh auth status` shows a login with the right to push, open pull requests and merge in the
  target repo; in a team, the leads use the same login. Open the pull request with `gh pr create`.
- **Waiting for CI:** `node <tools> ci-wait --pr <n>`. Exit 8 means the project has no CI.
- **Landing:** `node <tools> land --pr <n> --report <file>`, with `--repo <code-repo>` for code outside the
  control root. `land` checks the head, waits for CI like `ci-wait`, squash-merges, proves the squash and
  deletes the remote branch; its `proof` result is the squash evidence for cleaning up local worktrees and
  branches. On exit 8 (`no-ci`), confirm the merged state as landing without CI requires and call `land …
  --no-ci`.
- **Up-to-date state:** If branch protection requires it, catch up with `gh pr update-branch <n>` and wait for
  CI again; `land` then accepts the remote head.
- **Merge queue:** With an active merge queue, `land` does not apply. Enqueue the pull request and, after the
  queue has merged, delete the remote branch with `git push origin --delete <branch>`.
