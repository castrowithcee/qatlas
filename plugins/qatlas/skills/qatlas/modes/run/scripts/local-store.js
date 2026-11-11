'use strict';

// Local state of a run inside a repo: <primary working tree>/.qatlas/local, shared by all its worktrees.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const git = (repo, args) => execFileSync('git', ['-C', repo, ...args],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

// Null outside a git repo.
function localDir(repo) {
  try {
    return path.join(path.dirname(git(repo, ['rev-parse', '--path-format=absolute', '--git-common-dir'])), '.qatlas', 'local');
  } catch { return null; }
}

// A repo without the Qatlas scaffold has no ignore rule for the folder; .git/info/exclude keeps it out of
// git status without touching a versioned file. Errors are ignored.
function excludeLocal(repo) {
  const dir = localDir(repo);
  if (!dir) return;
  const root = path.resolve(dir, '..', '..');
  try {
    execFileSync('git', ['-C', root, 'check-ignore', '-q', '.qatlas/local/x'], { stdio: 'ignore' });
  } catch (error) {
    if (error.status !== 1) return;
    try {
      const file = git(root, ['rev-parse', '--path-format=absolute', '--git-path', 'info/exclude']);
      let text = '';
      try { text = fs.readFileSync(file, 'utf8'); } catch { /* no exclude file yet */ }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.appendFileSync(file, (text && !text.endsWith('\n') ? '\n' : '') + '/.qatlas/local/\n');
    } catch { /* ignored */ }
  }
}

module.exports = { localDir, excludeLocal };
