#!/usr/bin/env node
'use strict';

// Read-only plan for taking a project or the user library over into the current layout; changes nothing.
// Usage: node qatlas-migrate.js [--target <dir>] [--library] [--list]

const fs = require('fs');
const os = require('os');
const path = require('path');
const { projectRoot } = require('./qatlas-init.js');
const { findings } = require('./runtime/knowledge-checks.js');

const KINDS = {
  rename: 'file(s) to rename after their folder',
  frontmatter: 'file(s) with frontmatter to correct',
  sort: 'folder(s) or file(s) outside the layout whose content needs a place',
  split: 'file(s) over their size limit',
  entry: 'reserved file(s) without a reading condition in the entry file',
};

const library = process.argv.includes('--library');
const target = library ? path.join(os.homedir(), 'qatlas') : projectRoot(process.argv);
const space = library ? target : path.join(target, '.qatlas-brain');

if (!fs.existsSync(space)) {
  process.stdout.write('NO SPACE: ' + space + ' does not exist. qatlas-core init sets it up.\n');
  process.exit(0);
}

const found = findings(target, library);
if (!found.length) {
  process.stdout.write('OK: nothing to migrate.\n');
} else if (process.argv.includes('--list')) {
  process.stdout.write(found.map(item => item.kind + ': '
    + (item.target ? item.path + ' -> ' + item.target : item.note)).join('\n') + '\n');
} else {
  const lines = Object.keys(KINDS).map(kind => [kind, found.filter(item => item.kind === kind).length])
    .filter(([, count]) => count).map(([kind, count]) => '- ' + kind + ': ' + count + ' ' + KINDS[kind]);
  process.stdout.write('MIGRATION ' + space + '\n' + lines.join('\n') + '\n');
}
