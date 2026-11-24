'use strict';

// Checks of the knowledge space (.qatlas-brain/) shared by the doctor and the file-change hook.
// The numbers below are the only ones in the code; the reference named in SIZE_REFERENCE holds them for the agent.

const fs = require('fs');
const path = require('path');

const RESERVED = ['PROJECT.md', 'CONVENTIONS.md', 'ARCHITECTURE.md', 'TESTING.md', 'CONTRIBUTING.md'];
const PROJECT_LIMIT = 1000;
const FILE_LIMIT = 3500;
// Derived from this file's place, so it resolves to an absolute path on every host.
const SIZE_REFERENCE = path.resolve(__dirname, '..', '..', 'skills', 'qatlas-core-filing', 'references',
  'size-limits.md');

const countWords = text => text.split(/\s+/).filter(Boolean).length;

// name: path relative to .qatlas-brain/, with forward slashes.
const wordLimit = name => (name === 'PROJECT.md' ? PROJECT_LIMIT : FILE_LIMIT);

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
function sizeNote(name, text) {
  const words = countWords(text);
  const limit = wordLimit(name);
  if (words <= limit) return null;
  return '.qatlas-brain/' + name + ' has ' + words + ' words, limit ' + limit + '. '
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

const unreferencedNote = name => '.qatlas-brain/' + name + ' has no line with its reading condition in AGENTS.md.';

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

module.exports = { RESERVED, SIZE_REFERENCE, countWords, wordLimit, markdownFiles, sizeNote, unreferencedFiles,
  unreferencedNote, missingProjectNote };
