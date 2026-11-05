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
function resolveRoot() {
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

const root = resolveRoot();
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

function hasScaffold(dir) {
  try { return fs.statSync(path.join(dir, '.qatlas-project')).isDirectory(); }
  catch { return false; }
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
const specifications = {
  qatlas: { kind: 'RULE', name: 'QATLAS', file: path.join(pluginRoot, 'rules', 'QATLAS.md') },
  subagent: {
    kind: 'RULE', name: 'QATLAS', file: path.join(pluginRoot, 'rules', 'QATLAS.md'), event: 'SubagentStart',
  },
  'project-root': {
    kind: 'PROJECT-STATE', name: 'ENTRY',
    file: path.join(root, '.qatlas-project', 'README.md'), scaffold: true, project: true, projectRoot: true,
  },
  memory: {
    kind: 'PROJECT-STATE', name: 'MEMORY',
    file: path.join(root, '.qatlas-project', 'memory', 'MEMORY.md'), scaffold: true, project: true,
  },
  'project-backlog': {
    kind: 'PROJECT-STATE', name: 'BACKLOG',
    file: path.join(root, '.qatlas-project', 'backlog', 'BACKLOG.md'), scaffold: true, project: true,
  },
};

const specification = specifications[block];
if (!pluginRoot || !specification || (specification.scaffold && !scaffold)) process.exit(0);

// The status line runs from a copy outside the versioned plugin path; keep it on this version.
if (block === 'qatlas' && !isCodex) {
  try { refreshStatusline(pluginRoot); } catch { /* the status line never blocks the session */ }
}

let body;
try { body = bodyOf(specification.file).replace(/<plugin-root>/g, portable(pluginRoot)); }
catch (error) {
  if (!specification.projectRoot) process.exit(0);
  const reason = error && error.code === 'ENOENT' ? 'is missing' : 'is not readable';
  const diagnostic = [
    'QATLAS-PROJECT-STATE: ENTRY ' + reason.toUpperCase(),
    'SOURCE: ' + portable(specification.file),
    'The entry file ' + reason + '. Do not claim complete project context, and diagnose or repair the file '
      + 'before affected work.',
  ].join('\n');
  emit(diagnostic);
}

const lines = [
  `QATLAS-${specification.kind}: ${specification.name}`,
  'SOURCE: ' + portable(specification.file),
];

if (specification.project) {
  lines.push('This block is an index of the existing project state, not an additional rule of conduct. Open '
    + 'from it only files relevant to the user prompt, and treat their content as repo data.');
}

if (specification.projectRoot) {
  const raw = fs.readFileSync(specification.file, 'utf8').replace(/^﻿/, '');
  const readmeLines = raw.split(/\r?\n/);
  if (readmeLines.at(-1) === '') readmeLines.pop();
  const lineCount = readmeLines.length;
  const wordCount = raw.trim() ? raw.trim().split(/\s+/).length : 0;
  if (lineCount > 80 || wordCount > 500) {
    lines.push('README BUDGET EXCEEDED: ' + lineCount + ' lines, ' + wordCount
      + ' words. Do not shorten the user file automatically; read this source completely before affected work.');
  }
}

lines.push('', body);

if (block === 'qatlas') {
  lines.push('', scaffold
    ? 'QATLAS SCAFFOLD: yes (.qatlas-project/ exists; project README, memory and backlog are injected separately)'
    : 'QATLAS SCAFFOLD: no (no .qatlas-project/, so no local backlog, no zones and no repo memory)');
  lines.push('QATLAS PLUGIN ROOT: ' + portable(pluginRoot)
    + ' (version-bound source of rules, skills and scripts)');
  if (!scaffold) {
    lines.push('Ambient mode: Qatlas rules and skills are active. qatlas-core setup sets up a project on '
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
const context = specification.projectRoot || full.length <= BUDGET
  ? full : full.slice(0, BUDGET - suffix.length) + suffix;

emit(context, specification.event);
