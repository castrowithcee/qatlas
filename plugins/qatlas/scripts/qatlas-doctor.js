#!/usr/bin/env node
'use strict';

// Read-only diagnosis of Qatlas in a project; changes nothing.
// Usage: node qatlas-doctor.js [--target <dir>]

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { claudeImportNote, gitleaksNote, hasGit, isRepo, missingIdentity, plan, projectRoot } = require('./qatlas-init.js');
const { readConfig } = require('./runtime/config-loader.js');
const { readState, stateFolders, readId } = require('./runtime/project-store.js');
const { findings } = require('./runtime/knowledge-checks.js');

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
// The backlog script owns the content of the backlog block; a new local backlog would refuse it.
if (configState.backlog) {
  try {
    for (const problem of require('./qatlas-backlog.js').configProblems(configState.backlog)) {
      missing.push('config: ' + configState.configFile + ': backlog: ' + problem);
    }
  } catch (error) { notes.push('config: the backlog block could not be checked: ' + error.message); }
}

// The sync of the local backlog merges without a working tree, which git offers from 2.38.
try {
  const version = /(\d+)\.(\d+)/.exec(execFileSync('git', ['--version'], { encoding: 'utf8' }));
  if (version && (Number(version[1]) < 2 || (Number(version[1]) === 2 && Number(version[2]) < 38))) {
    notes.push('git ' + version[0] + ' is older than 2.38, which the sync of the local backlog needs.');
  }
} catch { /* no git: reported above */ }

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

const brain = path.join(target, '.qatlas-brain');
const text = file => { try { return fs.readFileSync(file, 'utf8'); } catch { return null; } };
// The layout the filing rules fix. Everything here is a note, as the user may have asked for an exception.
// qatlas-core migrate works through the same findings.
for (const finding of findings(target)) notes.push(finding.note);
// The folder backlog/ holds the binding alone; issues of the local backlog live on their own branch.
let backlogEntries = [];
try { backlogEntries = fs.readdirSync(path.join(brain, 'backlog')).filter(name => name !== 'BACKLOG.md'); } catch { /* none */ }
if (backlogEntries.length) {
  notes.push('.qatlas-brain/backlog/ holds more than BACKLOG.md. Tasks, projects and ideas of the local backlog '
    + 'live as issues on the branch qatlas-backlog; move them with the user by switching the planning system.');
}
try {
  for (const problem of require('./qatlas-backlog.js').check(target)) notes.push('local backlog: ' + problem);
} catch (error) { notes.push('local backlog: ' + error.message); }

const indexFile = text(path.join(brain, 'memory', 'MEMORY.md'));
if (indexFile !== null) {
  // The seed explains the line format in a comment.
  const index = indexFile.replace(/<!--[\s\S]*?-->/g, '');
  const present = fs.readdirSync(path.join(brain, 'memory')).filter(name => name.endsWith('.md') && name !== 'MEMORY.md');
  for (const name of present.sort()) {
    if (!index.includes('(' + name + ')')) notes.push('.qatlas-brain/memory/' + name + ' has no line in MEMORY.md.');
  }
  for (const link of index.match(/\]\(memory-[^)\s]+\.md\)/g) || []) {
    const name = link.slice(2, -1);
    if (!present.includes(name)) notes.push('.qatlas-brain/memory/MEMORY.md links ' + name + ', which does not exist.');
  }
}
const importNote = claudeImportNote(target);
if (importNote) notes.push(importNote);
const leaksNote = gitleaksNote();
if (leaksNote) notes.push(leaksNote);

// Leftovers of places older plugin versions wrote to. Nothing reads them any more.
const leftovers = [
  [path.join(os.homedir(), '.qatlas', 'state', 'worktrees'), 'worktrees from before the project state folders. '
    + 'Check each against git worktree list of its repo before the user removes it'],
  [path.join(target, '.qatlas', 'local', 'team'), 'run state of the mode once named team'],
  [path.join(target, '.qatlas', 'local', 'run', 'events.jsonl'), 'a run log from before the project state folder'],
  [path.join(target, '.qatlas', 'local', 'slots'), 'test results and their log from before the project state folder'],
];
for (const [place, what] of leftovers) {
  if (fs.existsSync(place)) notes.push('leftover ' + place + ': ' + what + '.');
}

const out = [];
if (missing.length) out.push('MISSING\n' + missing.map(line => '- ' + line).join('\n'));
if (notes.length) out.push('NOTES\n' + notes.map(line => '- ' + line).join('\n'));
process.stdout.write((out.length ? out.join('\n\n') : 'OK: nothing missing.') + '\n');
