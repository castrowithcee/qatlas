#!/usr/bin/env node
'use strict';

// Prints the central worktree path for a branch of the repo in the current or given dir. The path lies in the
// state folder of the project, so the call creates project id and state folder when they are missing.
// Usage: node qatlas-worktree-path.js <branch> [--target <dir>]

const path = require('path');
const { execFileSync } = require('child_process');
const { ensureState } = require('./runtime/project-store.js');

const argv = process.argv.slice(2);
const flag = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const branch = argv.find((arg, index) => !arg.startsWith('--') && argv[index - 1] !== '--target');
const target = path.resolve(flag('--target') || process.cwd());
const fail = message => { process.stderr.write(message + '\n'); process.exit(1); };

if (!branch) {
  process.stderr.write('usage: qatlas-worktree-path.js <branch> [--target <dir>]\n');
  process.exit(2);
}

try {
  execFileSync('git', ['-C', target, 'rev-parse', '--git-common-dir'], { stdio: 'ignore' });
} catch {
  fail('not a git repo: ' + target);
}
let state;
try { state = ensureState(target); } catch (error) { fail(error.message); }
if (!state) fail('no project folder: ' + target);

process.stdout.write(path.join(state, 'worktrees', ...branch.split('/')) + '\n');
