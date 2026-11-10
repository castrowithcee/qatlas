#!/usr/bin/env node
'use strict';

// Read-only diagnosis of Qatlas in a project; changes nothing.
// Usage: node qatlas-doctor.js [--target <dir>]

const fs = require('fs');
const path = require('path');
const { hasGit, isRepo, missingIdentity, plan, projectRoot } = require('./qatlas-init.js');
const { readConfig } = require('./runtime/config-loader.js');

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

// Reserved root files stay lean; beyond the limit their details move into the folder of the same name.
for (const name of ['CONVENTIONS.md', 'ARCHITECTURE.md', 'TESTING.md', 'CONTRIBUTING.md']) {
  const file = path.join(target, '.qatlas-project', name);
  if (!fs.existsSync(file)) continue;
  let lines;
  try { lines = fs.readFileSync(file, 'utf8').split(/\r?\n/); }
  catch (error) { missing.push('.qatlas-project/' + name + ' is not readable: ' + error.message); continue; }
  if (lines.at(-1) === '') lines.pop();
  if (lines.length > 300) {
    notes.push('.qatlas-project/' + name + ' has ' + lines.length + ' lines, limit 300. Move details into '
      + name.replace('.md', '').toLowerCase() + '/ and keep the file as the entry.');
  }
}

const out = [];
if (missing.length) out.push('MISSING\n' + missing.map(line => '- ' + line).join('\n'));
if (notes.length) out.push('NOTES\n' + notes.map(line => '- ' + line).join('\n'));
process.stdout.write((out.length ? out.join('\n\n') : 'OK: nothing missing.') + '\n');
