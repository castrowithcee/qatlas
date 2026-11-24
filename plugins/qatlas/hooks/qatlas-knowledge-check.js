#!/usr/bin/env node
'use strict';

// PostToolUse after a file write: tells the agent when a changed file of the knowledge space is over its limit
// or a reserved file lacks its line in AGENTS.md. It only reports and always exits 0.
//
// Both hosts report the changed paths differently (Codex only as patch text), so the hook compares content
// hashes of the checked files with the ones stored after the previous call. The first call has no earlier
// state: it only stores the baseline and stays silent, so an unrelated first write never reports old files.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { BRAIN } = require('../scripts/runtime/brain-migration.js');
const { ensureState } = require('../scripts/runtime/project-store.js');
const { RESERVED, markdownFiles, sizeNote, unreferencedFiles, unreferencedNote } =
  require('../scripts/runtime/knowledge-checks.js');

const hasBrain = dir => { try { return fs.statSync(path.join(dir, BRAIN)).isDirectory(); } catch { return false; } };

// Nearest ancestor with .qatlas-brain/, up to the enclosing git root; null without one.
function projectRoot(start) {
  for (let dir = path.resolve(start), parent = null; dir !== parent; parent = dir, dir = path.dirname(dir)) {
    if (hasBrain(dir)) return dir;
    if (fs.existsSync(path.join(dir, '.git'))) return null;
  }
  return null;
}

function startDir() {
  try {
    const payload = JSON.parse(fs.readFileSync(0, 'utf8').replace(/^﻿/, ''));
    if (typeof payload.cwd === 'string' && payload.cwd) return payload.cwd;
  } catch { /* fall back to the working directory */ }
  return process.cwd();
}

// Map of checked file (relative to the project root, forward slashes) to its content hash and text.
function readChecked(root) {
  const files = markdownFiles(path.join(root, BRAIN), true).concat(
    ['AGENTS.md', 'CLAUDE.md'].map(name => path.join(root, name)));
  const found = new Map();
  for (const file of files) {
    try {
      const text = fs.readFileSync(file, 'utf8');
      found.set(path.relative(root, file).split(path.sep).join('/'),
        { hash: crypto.createHash('sha1').update(text).digest('hex'), text });
    } catch { /* missing or unreadable files are not checked */ }
  }
  return found;
}

function main() {
  const root = projectRoot(startDir());
  if (!root) return;
  const state = ensureState(root);
  if (!state) return;
  // Linked worktrees share the state folder but not their files, so each root keeps its own snapshot.
  const rootId = crypto.createHash('sha1').update(root).digest('hex').slice(0, 12);
  const stateFile = path.join(state, 'knowledge-snapshot-' + rootId + '.json');
  const current = readChecked(root);

  let previous = null;
  try { previous = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { /* no usable baseline yet */ }
  const hashes = Object.fromEntries([...current].map(([name, file]) => [name, file.hash]));
  const temp = stateFile + '.' + process.pid + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(hashes));
  fs.renameSync(temp, stateFile);
  if (!previous || typeof previous !== 'object') return;

  const changed = new Set([...Object.keys(hashes), ...Object.keys(previous)].filter(name => hashes[name] !== previous[name]));
  const notes = [];
  for (const name of changed) {
    if (current.has(name) && name.startsWith(BRAIN + '/')) {
      const note = sizeNote(name.slice(BRAIN.length + 1), current.get(name).text);
      if (note) notes.push(note);
    }
  }
  const touchesReferences = [...changed].some(name => name === 'AGENTS.md' || name === 'CLAUDE.md'
    || RESERVED.includes(name.slice(BRAIN.length + 1)) && name.startsWith(BRAIN + '/'));
  if (touchesReferences) for (const name of unreferencedFiles(root)) notes.push(unreferencedNote(name));
  if (!notes.length) return;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: notes.join('\n') },
  }));
}

try { main(); } catch { /* a failing check never disturbs the session */ }
process.exit(0);
