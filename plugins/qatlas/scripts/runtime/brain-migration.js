'use strict';

// One-time move of a project's knowledge folder from .qatlas-project/, its name up to 2.x, to .qatlas-brain/.
// Runs at session start and before init; everything else knows only the new name. Delete this file and its
// callers once the old name no longer needs support.

const fs = require('fs');
const path = require('path');

const BRAIN = '.qatlas-brain';
const LEGACY = '.qatlas-project';
const LEGACY_PATH = /\.qatlas-project(?![\w-])/g;
// The zones hold raw user material, not knowledge; their content stays as it is.
const ZONES = new Set(['zone-import', 'zone-export']);
const MAX_BYTES = 1024 * 1024;

function isDirectory(file) {
  try { return fs.statSync(file).isDirectory(); } catch { return false; }
}

function textFiles(dir, top = true) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  return entries.flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return top && ZONES.has(entry.name) ? [] : textFiles(full, false);
    return entry.isFile() ? [full] : [];
  });
}

// Returns whether the file named the old path. Session start hooks run in parallel, so the write is atomic:
// a hook reading the file sees the whole old or the whole new text.
function rewrite(file) {
  let buffer;
  try {
    if (fs.statSync(file).size > MAX_BYTES) return false;
    buffer = fs.readFileSync(file);
  } catch { return false; }
  if (buffer.includes(0)) return false;
  const source = buffer.toString('utf8');
  const text = source.replace(LEGACY_PATH, BRAIN);
  if (text === source) return false;
  const temporary = path.join(path.dirname(file), '.' + path.basename(file) + '.' + process.pid + '.tmp');
  fs.writeFileSync(temporary, text, { mode: fs.statSync(file).mode & 0o777 });
  fs.renameSync(temporary, file);
  return true;
}

// Returns null when there is nothing to do, else { note } after the move or { problem } when it cannot happen.
// The git index stays untouched: staging the rename belongs to the next commit.
function migrateBrain(root) {
  const legacy = path.join(root, LEGACY);
  const brain = path.join(root, BRAIN);
  // The new folder is checked first: a parallel hook may finish the rename between the two checks.
  if (fs.existsSync(brain)) {
    if (!isDirectory(legacy)) return null;
    return { problem: 'QATLAS MIGRATION BLOCKED: ' + LEGACY + '/ and ' + BRAIN + '/ both exist. Qatlas reads '
      + 'only ' + BRAIN + '/. Tell the user and merge the old folder into it only on their decision.' };
  }
  if (!isDirectory(legacy)) return null;

  try { fs.renameSync(legacy, brain); }
  catch (error) {
    // A parallel hook of the same session start won the rename and replaces the references.
    if (error.code === 'ENOENT' || isDirectory(brain)) return null;
    return { problem: 'QATLAS MIGRATION FAILED: ' + LEGACY + '/ could not be renamed to ' + BRAIN + '/ ('
      + error.code + '). Qatlas reads only ' + BRAIN + '/. Tell the user and rename the folder with them.' };
  }

  const candidates = [...textFiles(brain), ...['AGENTS.md', 'CLAUDE.md', '.gitignore'].map(name => path.join(root, name))];
  let changed = 0;
  for (const file of candidates) {
    try { if (rewrite(file)) changed += 1; } catch { /* a file that cannot be written keeps the old path */ }
  }
  return { note: 'QATLAS MIGRATION: this session start renamed the project folder ' + LEGACY + '/ to ' + BRAIN
    + '/ and replaced the old path in ' + changed + ' file(s) inside it and in AGENTS.md, CLAUDE.md and '
    + '.gitignore. These uncommitted changes are expected, not foreign edits; nothing is staged. Other files '
    + 'may still name the old path: search for "' + LEGACY + '" before relying on one.' };
}

module.exports = { BRAIN, LEGACY, migrateBrain };
