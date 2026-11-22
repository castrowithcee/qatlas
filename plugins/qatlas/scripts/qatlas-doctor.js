#!/usr/bin/env node
'use strict';

// Read-only diagnosis of Qatlas in a project; changes nothing.
// Usage: node qatlas-doctor.js [--target <dir>]

const fs = require('fs');
const path = require('path');
const { hasGit, isRepo, missingIdentity, plan, projectRoot } = require('./qatlas-init.js');
const { readConfig } = require('./runtime/config-loader.js');
const { readState, stateFolders, readId } = require('./runtime/project-store.js');

const target = projectRoot(process.argv);

const missing = [];   // blocks or impairs work
const notes = [];     // worth mentioning once, not blocking

if (!hasGit()) {
  missing.push('git: not on PATH. Without Git there is neither version control nor qatlas-core-git.');
} else if (!isRepo(target)) {
  missing.push('git repo: this folder is none. qatlas-core init runs git init.');
} else {
  const identity = missingIdentity(target);
  if (identity.length) {
    missing.push('git identity: ' + identity.join(' and ') + ' not set. Never invent an identity or take it '
      + 'from the session. Ask the user what their commits should carry.');
  }
}

// Both config files are optional overrides of shipped defaults; a missing file is the normal case.
const configState = readConfig(target);
for (const problem of configState.problems) missing.push('config: ' + problem);
for (const unknown of configState.unknown) notes.push('config: ' + unknown + ' Qatlas does not read it.');

for (const item of plan(target)) missing.push(item.shown + ' is missing; qatlas-core init adds it.');

// readState throws if the project id belongs to several state folders; the message names all of them.
try { readState(target); } catch (error) { missing.push('project state: ' + error.message); }

// A state folder that no project owns any more. A project without an id file is no finding: the next write
// access takes the id over again.
for (const folder of stateFolders()) {
  let recorded = null;
  try { recorded = fs.readFileSync(path.join(folder.dir, 'path'), 'utf8').trim(); } catch { /* no path file */ }
  const seen = ' (last seen project path: ' + recorded + ').';
  const exists = Boolean(recorded && fs.statSync(recorded, { throwIfNoEntry: false })?.isDirectory());
  const id = exists ? readId(recorded) : null;
  if (!recorded) {
    notes.push('state folder ' + folder.dir + ' has no path file.');
  } else if (!exists) {
    notes.push('state folder ' + folder.dir + ' points to a missing folder' + seen);
  } else if (id !== null && id !== folder.id) {
    notes.push('state folder ' + folder.dir + ' belongs to a project with another id' + seen);
  }
}

// Files of the knowledge space stay lean. A reserved root file moves details into the folder of the same
// name, any other file is split by subject. Zones and the user's own templates are not Qatlas content.
const reserved = ['CONVENTIONS.md', 'ARCHITECTURE.md', 'TESTING.md', 'CONTRIBUTING.md'];
const brain = path.join(target, '.qatlas-brain');
function markdownFiles(dir, top) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  const found = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (top && ['zone-import', 'zone-export', 'templates'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...markdownFiles(full, false));
    else if (entry.isFile() && entry.name.endsWith('.md')) found.push(full);
  }
  return found;
}
for (const file of markdownFiles(brain, true)) {
  const name = path.relative(brain, file).split(path.sep).join('/');
  let words;
  try { words = fs.readFileSync(file, 'utf8').split(/\s+/).filter(Boolean).length; }
  catch (error) { missing.push('.qatlas-brain/' + name + ' is not readable: ' + error.message); continue; }
  if (words > 3500) {
    notes.push('.qatlas-brain/' + name + ' has ' + words + ' words, limit 3500. '
      + (reserved.includes(name)
        ? 'Move details into ' + name.replace('.md', '').toLowerCase() + '/ and keep the file as the entry.'
        : 'Split it by subject into several files of the same folder.'));
  }
}

const out = [];
if (missing.length) out.push('MISSING\n' + missing.map(line => '- ' + line).join('\n'));
if (notes.length) out.push('NOTES\n' + notes.map(line => '- ' + line).join('\n'));
process.stdout.write((out.length ? out.join('\n\n') : 'OK: nothing missing.') + '\n');
