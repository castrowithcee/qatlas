#!/usr/bin/env node
'use strict';

// Gibt den zentralen Worktree-Pfad für einen Branch des Repos im aktuellen oder angegebenen Ordner aus.
// Aufruf: node qatlas-worktree-path.js <branch> [--target <ordner>]

const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const argv = process.argv.slice(2);
const flag = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const branch = argv.find((arg, index) => !arg.startsWith('--') && argv[index - 1] !== '--target');
const target = path.resolve(flag('--target') || process.cwd());

if (!branch) {
  process.stderr.write('Aufruf: qatlas-worktree-path.js <branch> [--target <ordner>]\n');
  process.exit(2);
}

const git = args => execFileSync('git', ['-C', target, ...args], { encoding: 'utf8' }).trim();
let common;
let primary;
try {
  common = fs.realpathSync(path.resolve(target, git(['rev-parse', '--git-common-dir'])));
  primary = git(['worktree', 'list', '--porcelain']).split('\n')[0].replace(/^worktree /, '');
} catch {
  process.stderr.write('Kein Git-Repo: ' + target + '\n');
  process.exit(1);
}

const key = crypto.createHash('sha256').update(common).digest('hex').slice(0, 8);
const slug = path.basename(primary).toLowerCase().normalize('NFKD').replace(/[^\x00-\x7f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'repo';
process.stdout.write(path.join(os.homedir(), '.qatlas', 'state', 'worktrees', slug + '-' + key,
  ...branch.split('/')) + '\n');
