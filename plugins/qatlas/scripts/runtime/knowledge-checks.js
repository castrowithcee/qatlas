'use strict';

// Checks of the knowledge space (.qatlas-brain/) shared by the doctor and the file-change hook.
// The numbers below are the only ones in the code; the reference named in SIZE_REFERENCE holds them for the agent.

const fs = require('fs');
const path = require('path');

const RESERVED = ['PROJECT.md', 'PLANNING.md', 'CONVENTIONS.md', 'ARCHITECTURE.md', 'TESTING.md',
  'CONTRIBUTING.md', 'OPERATIONS.md'];
// The user library holds only what can apply across projects.
const LIBRARY_RESERVED = RESERVED.filter(name => name !== 'PROJECT.md' && name !== 'ARCHITECTURE.md');
const PROJECT_LIMIT = 1000;
const RESERVED_LIMIT = 2500;
const FILE_LIMIT = 3500;
// Derived from this file's place, so it resolves to an absolute path on every host.
const SIZE_REFERENCE = path.resolve(__dirname, '..', '..', 'skills', 'qatlas-core-filing', 'references',
  'size-limits.md');

const countWords = text => text.split(/\s+/).filter(Boolean).length;

// name: path relative to the knowledge space, with forward slashes.
const wordLimit = name => (name === 'PROJECT.md' ? PROJECT_LIMIT : RESERVED.includes(name) ? RESERVED_LIMIT : FILE_LIMIT);

// Markdown files of the knowledge space. Zones and the user's own templates are not Qatlas content.
function markdownFiles(brain, top = true) {
  let entries = [];
  try { entries = fs.readdirSync(brain, { withFileTypes: true }); } catch { return []; }
  const found = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (top && ['zone-import', 'zone-export', 'templates'].includes(entry.name)) continue;
    const full = path.join(brain, entry.name);
    if (entry.isDirectory()) found.push(...markdownFiles(full, false));
    else if (entry.isFile() && entry.name.endsWith('.md')) found.push(full);
  }
  return found;
}

// The message for a file over its limit, or null. Frontmatter counts.
function sizeNote(name, text, shown = '.qatlas-brain/') {
  const words = countWords(text);
  const limit = wordLimit(name);
  if (words <= limit) return null;
  return shown + name + ' has ' + words + ' words, limit ' + limit + '. '
    + (RESERVED.includes(name)
      ? 'Move details into ' + name.replace('.md', '').toLowerCase() + '/ and keep the file as the entry.'
      : 'Split it by subject into several files of the same folder.')
    + ' Procedure: ' + SIZE_REFERENCE;
}

// Existing reserved files that neither AGENTS.md nor CLAUDE.md of the project names.
function unreferencedFiles(target) {
  const brain = path.join(target, '.qatlas-brain');
  const instructions = ['AGENTS.md', 'CLAUDE.md'].map(name => {
    try { return fs.readFileSync(path.join(target, name), 'utf8'); } catch { return ''; }
  }).join('\n');
  return RESERVED.filter(name => fs.existsSync(path.join(brain, name)) && !instructions.includes(name));
}

const unreferencedNote = (name, shown = '.qatlas-brain/', library = false) => shown + name
  + ' has no line with its reading condition in ' + (library ? 'AGENTS.qatlas.md.' : 'AGENTS.md.');

const PROJECT_REFERENCE = path.resolve(__dirname, '..', '..', 'skills', 'qatlas-core-filing', 'references',
  'playbook-reserved-files.md');

// The note for a set-up project without its foundation, or null.
function missingProjectNote(target) {
  if (fs.existsSync(path.join(target, '.qatlas-brain', 'PROJECT.md'))) return null;
  return '.qatlas-brain/PROJECT.md is missing. It is the foundation of the knowledge space. When work comes up '
    + 'that it would bind, such as clarifying, planning or shaping, tell the user once in this session that it '
    + 'is missing and that you can create it with them. Create it only on their request, following the section '
    + 'PROJECT.md of ' + PROJECT_REFERENCE.split(path.sep).join('/');
}

const folderOf = name => name.replace('.md', '').toLowerCase();
// Folders whose files still carry a type, with the types each one takes.
const TYPED_FOLDERS = { knowledge: ['knowledge', 'fact'], playbooks: ['playbook'] };
const FIXED_NAMES = ['BACKLOG.md', 'MEMORY.md'];
const prefixOf = folder => (folder === 'playbooks' ? 'playbook' : folder);
// Type prefixes of earlier layouts, dropped when a name takes the prefix of its folder.
const OLD_PREFIX = /^(?:meta|policy|fact|memory|knowledge|playbook|plan|decision)-/;

// Everything in a knowledge space that departs from the layout, as { kind, path, target, note }.
// space: the project's .qatlas-brain/ or the user library; shown: its name in messages, with a trailing slash;
// entry: text of the files that name the reserved files with their reading conditions.
// Kinds: rename (target set), frontmatter, sort (content needs a place), split (over its limit), entry.
function spaceFindings(space, shown, entry, library = false) {
  const reserved = library ? LIBRARY_RESERVED : RESERVED;
  const folders = [...reserved.map(folderOf), 'knowledge', 'playbooks', 'templates',
    ...(library ? [] : ['backlog', 'memory', 'zone-import', 'zone-export'])];
  const rootFiles = library ? [...reserved, 'AGENTS.qatlas.md'] : reserved;
  const found = [];
  const add = (kind, name, rest, target = null) => found.push({ kind, path: shown + name,
    target: target && shown + target, note: shown + name + rest });

  let entries = [];
  try { entries = fs.readdirSync(space, { withFileTypes: true }); } catch { return found; }
  for (const item of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (item.name.startsWith('.')) continue;
    if (item.isDirectory() && item.name === 'plans' && !library) {
      add('sort', 'plans/', ' is no folder of the knowledge space any more. Work lives in the planning '
        + 'system; what still binds belongs in a reserved file. Clear it up with the user.');
    } else if (item.isDirectory() && !folders.includes(item.name)) {
      add('sort', item.name + '/', ' is none of the fixed folders.');
    } else if (item.isFile() && !rootFiles.includes(item.name)) {
      add('sort', item.name, ' is none of the reserved files.');
    }
  }

  for (const file of markdownFiles(space)) {
    const name = path.relative(space, file).split(path.sep).join('/');
    const parts = name.split('/');
    const base = parts[parts.length - 1];
    const folder = parts.length > 1 ? parts[0] : null;
    // Content outside the layout is one finding above, not one per file.
    if (folder ? !folders.includes(folder) : !rootFiles.includes(name)) continue;
    // The folder backlog/ holds the binding alone; the agent file follows its own standard.
    if (folder === 'backlog' && name !== 'backlog/BACKLOG.md') continue;
    if (name === 'AGENTS.qatlas.md') continue;
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }

    const size = sizeNote(name, text, shown);
    if (size) found.push({ kind: 'split', path: shown + name, target: null, note: size });

    const head = /^﻿?---\r?\n([\s\S]*?)\r?\n---/.exec(text);
    const type = head && (/^type:[ \t]*(\S+)/m.exec(head[1]) || [])[1];
    if (!head) add('frontmatter', name, ' has no frontmatter.');
    else if (TYPED_FOLDERS[folder]) {
      if (!TYPED_FOLDERS[folder].includes(type)) add('frontmatter', name, ' has no known type.');
    } else if (type) {
      add('frontmatter', name, ' carries the type ' + type + ', which its place replaces. Remove the line.');
    }

    const prefix = folder && prefixOf(folder) + '-';
    if (folder && !FIXED_NAMES.includes(base) && !base.startsWith(prefix)) {
      const target = [...parts.slice(0, -1), prefix + base.replace(OLD_PREFIX, '')].join('/');
      add('rename', name, ' lies in ' + folder + '/, so its name starts with ' + prefix + '.'
        + (fs.existsSync(path.join(space, target)) ? ' ' + shown + target + ' exists already.' : ''), target);
    }
  }

  for (const name of reserved) {
    if (fs.existsSync(path.join(space, name)) && !entry.includes(name)) {
      found.push({ kind: 'entry', path: shown + name, target: null, note: unreferencedNote(name, shown, library) });
    }
  }
  return found;
}

const entryText = files => files.map(file => { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } })
  .join('\n');

// The findings of a project's knowledge space or, with library, of the user library at target.
function findings(target, library = false) {
  if (library) return spaceFindings(target, '~/qatlas/', entryText([path.join(target, 'AGENTS.qatlas.md')]), true);
  return spaceFindings(path.join(target, '.qatlas-brain'), '.qatlas-brain/',
    entryText(['AGENTS.md', 'CLAUDE.md'].map(name => path.join(target, name))));
}

module.exports = { RESERVED, SIZE_REFERENCE, countWords, wordLimit, markdownFiles, sizeNote, unreferencedFiles,
  unreferencedNote, missingProjectNote, findings };
