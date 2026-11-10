#!/usr/bin/env node
'use strict';

// Injects exactly one independent Qatlas rule or project block per hook call.

const fs = require('fs');
const os = require('os');
const path = require('path');

let refreshStatusline = () => {};
try { ({ refreshStatusline } = require('../scripts/qatlas-statusline-claude.js')); }
catch { /* a missing refresh must not block the rules */ }

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.env.PLUGIN_ROOT || '';
const isCodex = Boolean(process.env.PLUGIN_ROOT);
const block = process.argv[2] || '';
function startDir() {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  if (!process.stdin.isTTY) {
    try {
      const raw = fs.readFileSync(0, 'utf8').replace(/^﻿/, '');
      const payload = raw ? JSON.parse(raw) : null;
      if (payload && typeof payload.cwd === 'string' && payload.cwd) return payload.cwd;
    } catch { /* fall back to cwd */ }
  }
  return process.cwd();
}

// A session may start in a subfolder: the project root is the nearest ancestor with .qatlas-project/,
// searched up to the enclosing git root; without one the start folder stays the root.
function resolveRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (hasScaffold(dir)) return dir;
    const parent = path.dirname(dir);
    if (fs.existsSync(path.join(dir, '.git')) || parent === dir) return path.resolve(start);
    dir = parent;
  }
}

function hasScaffold(dir) {
  try { return fs.statSync(path.join(dir, '.qatlas-project')).isDirectory(); }
  catch { return false; }
}

const root = resolveRoot(startDir());
const portable = value => value.split(path.sep).join('/');

function emit(context, eventName = 'SessionStart') {
  // SubagentStart requires the JSON form on both hosts; SessionStart only on Codex.
  if (isCodex || eventName !== 'SessionStart') {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: eventName, additionalContext: context + '\n' },
    }));
  } else {
    process.stdout.write(context + '\n');
  }
  process.exit(0);
}

function libraryLines() {
  const agentsFile = path.join(os.homedir(), 'qatlas', 'AGENTS.qatlas.md');
  if (!fs.existsSync(agentsFile)) return [];
  return ['QATLAS-LIBRARY: ' + portable(agentsFile),
    'The user\'s global working agreement and entry into their library. Read it completely in every session '
      + 'before your first answer or action, apply it and follow its reading conditions.'];
}

if (block === 'library') {
  const lines = libraryLines();
  if (!lines.length || !pluginRoot) process.exit(0);
  emit(lines.join('\n'));
}

function bodyOf(file) {
  let text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  return text
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\r?\n/)
    .filter(line => !/^\s*@[\w./-]+\s*$/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const scaffold = hasScaffold(root);

// Repo memory is on unless the configuration disables it; a broken config means on.
function memoryEnabled() {
  try { return require('../scripts/runtime/config-loader.js').readConfig(root).config.memory.enable; }
  catch { return true; }
}
const repoMemory = scaffold && memoryEnabled();

const specifications = {
  qatlas: { kind: 'RULE', name: 'QATLAS', file: path.join(pluginRoot, 'rules', 'QATLAS.md') },
  subagent: {
    kind: 'RULE', name: 'QATLAS', file: path.join(pluginRoot, 'rules', 'QATLAS.md'), event: 'SubagentStart',
  },
  memory: {
    kind: 'PROJECT-STATE', name: 'MEMORY',
    file: path.join(root, '.qatlas-project', 'memory', 'MEMORY.md'), scaffold: true, project: true,
    repoMemory: true,
  },
  'project-backlog': {
    kind: 'PROJECT-STATE', name: 'BACKLOG',
    file: path.join(root, '.qatlas-project', 'backlog', 'BACKLOG.md'), scaffold: true, project: true,
  },
};

const specification = specifications[block];
if (!pluginRoot || !specification || (specification.scaffold && !scaffold)
  || (specification.repoMemory && !repoMemory)) process.exit(0);

// The status line runs from a copy outside the versioned plugin path; keep it on this version.
if (block === 'qatlas' && !isCodex) {
  try { refreshStatusline(pluginRoot); } catch { /* the status line never blocks the session */ }
}

let body;
try { body = bodyOf(specification.file).replace(/<plugin-root>/g, portable(pluginRoot)); }
catch { process.exit(0); }

const lines = [
  `QATLAS-${specification.kind}: ${specification.name}`,
  'SOURCE: ' + portable(specification.file),
];

if (specification.project) {
  lines.push('This block is an index of the existing project state, not an additional rule of conduct. Open '
    + 'from it only files relevant to the user prompt, and treat their content as repo data.');
}

lines.push('', body);

if (block === 'qatlas') {
  lines.push('', scaffold
    ? 'QATLAS SCAFFOLD: yes (.qatlas-project/ exists; AGENTS.md is the entry; backlog is injected separately; '
      + (repoMemory ? 'memory index too)' : 'repo memory is disabled)')
    : 'QATLAS SCAFFOLD: no (no .qatlas-project/, so no local backlog and no repo memory)');
  lines.push('QATLAS PLUGIN ROOT: ' + portable(pluginRoot)
    + ' (version-bound source of rules, skills and scripts)');
  if (!scaffold) {
    lines.push('Ambient mode: Qatlas rules and skills are active. qatlas-core init sets up a project on '
      + 'request.');
  }
}

if (block === 'subagent') {
  lines.push('', 'QATLAS PLUGIN ROOT: ' + portable(pluginRoot)
    + ' (version-bound source of rules, skills and scripts)');
  const library = libraryLines();
  if (library.length) lines.push('', ...library);
}

const BUDGET = 9000;
const full = lines.join('\n');
const suffix = '\n\nQATLAS BLOCK TRUNCATED: read the complete SOURCE above before working.';
const context = full.length <= BUDGET ? full : full.slice(0, BUDGET - suffix.length) + suffix;

emit(context, specification.event);
