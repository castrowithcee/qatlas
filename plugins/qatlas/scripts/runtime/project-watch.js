'use strict';

// Notices a change of .qatlas-brain/PROJECT.md that no file tool call of an agent made. The file-change hook
// knows whether its call named the file; the session start sees what happened between two sessions.
// A write through the shell runs past both hooks and therefore counts as a change from outside.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FILE = '.qatlas-brain/PROJECT.md';
const REFERENCE = path.resolve(__dirname, '..', '..', 'skills', 'qatlas-core-filing', 'references',
  'playbook-keep-current.md');
// A call that writes the file names it. The test reads no host's patch format, and a call that fails it only
// causes one note too many, never a silent change.
const NAMED = /\.qatlas-brain[\\/]+PROJECT\.md/;
const REFLOG_ENTRIES = 30;

const sha1 = value => crypto.createHash('sha1').update(value).digest('hex');
const git = (root, args) => {
  try {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
};

const namesProject = toolInput => NAMED.test(JSON.stringify(toolInput === undefined ? '' : toolInput));

function currentHash(root) {
  try { return sha1(fs.readFileSync(path.join(root, FILE))); } catch { return null; }
}

// Where the current content came from, as far as git can tell. Only a reflog entry makes a pull certain.
function origin(root) {
  const status = git(root, ['status', '--porcelain', '--', FILE]);
  if (status === null) return 'unknown, as git cannot tell here';
  if (status) return 'uncommitted in the working tree, so probably edited by hand in this checkout';
  const entries = (git(root, ['log', '-g', '-n', String(REFLOG_ENTRIES), '--format=%H%x09%gs', 'HEAD']) || '')
    .split('\n').filter(Boolean).map(line => line.split('\t'));
  const blob = index => git(root, ['rev-parse', '-q', '--verify', entries[index][0] + ':' + FILE]);
  let after = entries.length ? blob(0) : null;
  for (let index = 0; index + 1 < entries.length; index += 1) {
    const before = blob(index + 1);
    if (before !== after) {
      const action = entries[index][1] || '';
      if (/^(pull|merge|rebase)/.test(action)) {
        return 'certain: it arrived in this checkout with "' + action + '", so with commits made elsewhere. '
          + 'What depends on it may already be updated there';
      }
      if (/^commit/.test(action)) return 'committed in this checkout ("' + action + '"), not through a file tool';
      return 'it came with "' + action + '" in this checkout';
    }
    after = before;
  }
  return 'committed, and probably older than the last ' + REFLOG_ENTRIES + ' steps of this checkout or from a '
    + 'fresh clone';
}

const note = root => 'QATLAS PROJECT CHANGED: ' + FILE + ' changed since Qatlas last saw it, and no file tool '
  + 'call of an agent in this checkout made the change. Origin: ' + origin(root) + '. Tell the user in your next '
  + 'message that you noticed it, and follow the section "Geänderte Grundlage" of '
  + REFERENCE.split(path.sep).join('/') + ' before any work the file binds. This note appears once.';

// Returns the note for a change from outside, or null. own: the call named the file. consume false leaves a
// change from outside unseen, so that a subagent does not use up the note of its parent.
function projectChange(root, state, { own = false, consume = true } = {}) {
  // Both hooks find the root on their own way; the real path gives them one key.
  let real = root;
  try { real = fs.realpathSync(root); } catch { /* keep the given path */ }
  const store = path.join(state, 'project-seen-' + sha1(real).slice(0, 12) + '.json');
  let seen;
  try { seen = JSON.parse(fs.readFileSync(store, 'utf8')).hash; } catch { /* no baseline yet */ }
  const current = currentHash(root);
  if (seen === current) return null;
  // A first sight and a file that appears or disappears are no change of its content.
  const outside = typeof seen === 'string' && current !== null && !own;
  if (outside && !consume) return null;
  const temp = store + '.' + process.pid + '.tmp';
  fs.writeFileSync(temp, JSON.stringify({ hash: current }));
  fs.renameSync(temp, store);
  return outside ? note(root) : null;
}

module.exports = { namesProject, projectChange };
