#!/usr/bin/env node
'use strict';

// Injiziert genau einen unabhängigen Qatlas-Regel- oder Projektblock pro Hook-Aufruf.

const fs = require('fs');
const path = require('path');

let scaffoldTopUp = null;
try { ({ scaffoldTopUp } = require('../scripts/qatlas-scaffold-topup.js')); }
catch { /* Fehlendes Top-up darf die Kontext-Injektion nicht verhindern. */ }

let readConfig = () => ({ config: { 'session-start': { enabled: true, ruleset: true } } });
let syncManagedRuleset = null;
try { ({ readConfig, syncManagedRuleset } = require('../scripts/runtime/config-loader.js')); }
catch { /* Fehlende Config-Hilfe darf die übrigen Regeln nicht verhindern. */ }

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
    } catch { /* Auf cwd zurückfallen. */ }
  }
  return process.cwd();
}

const root = resolveRoot();
const portable = value => value.split(path.sep).join('/');
const qatlasConfig = readConfig(root).config;
const sessionStart = qatlasConfig['session-start'];

let managedRulesetFile = path.join(pluginRoot, 'rules', 'RULESET.md');
if (block === 'ruleset' && pluginRoot && syncManagedRuleset) {
  try { managedRulesetFile = syncManagedRuleset(pluginRoot).file; }
  catch { /* Bei fehlendem Schreibrecht direkt aus dem Plugin lesen. */ }
}

if (!sessionStart.enabled || (block === 'ruleset' && !sessionStart.ruleset)) process.exit(0);

function hasScaffold(dir) {
  try { return fs.statSync(path.join(dir, '.qatlas', 'project')).isDirectory(); }
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
  qatlas: { kind: 'REGEL', name: 'QATLAS', file: path.join(pluginRoot, 'rules', 'QATLAS.md') },
  files: { kind: 'REGEL', name: 'FILES', file: path.join(pluginRoot, 'rules', 'FILES.md') },
  frontmatter: { kind: 'REGEL', name: 'FRONTMATTER', file: path.join(pluginRoot, 'rules', 'FRONTMATTER.md') },
  ruleset: { kind: 'REGEL', name: 'RULESET', file: managedRulesetFile },
  scaffold: { kind: 'REGEL', name: 'SCAFFOLD', file: path.join(pluginRoot, 'rules', 'SCAFFOLD.md'), scaffold: true },
  backlog: { kind: 'REGEL', name: 'BACKLOG', file: path.join(pluginRoot, 'rules', 'BACKLOG.md'), scaffold: true },
  memory: {
    kind: 'PROJEKTZUSTAND', name: 'MEMORY',
    file: path.join(root, '.qatlas', 'project', 'memory', 'MEMORY.md'), scaffold: true, project: true,
  },
  'project-backlog': {
    kind: 'PROJEKTZUSTAND', name: 'BACKLOG',
    file: path.join(root, '.qatlas', 'project', 'backlog', 'BACKLOG.md'), scaffold: true, project: true,
  },
};

const specification = specifications[block];
if (!pluginRoot || !specification || (specification.scaffold && !scaffold)) process.exit(0);

const topUpSelection = {
  scaffold: { exclude: ['memory/MEMORY.md', 'backlog/BACKLOG.md'] },
  memory: { only: ['memory/MEMORY.md'] },
  'project-backlog': { only: ['backlog/BACKLOG.md'] },
};
let toppedUp = [];
if (topUpSelection[block] && scaffoldTopUp) {
  try {
    toppedUp = scaffoldTopUp(root, path.join(pluginRoot, 'scaffold'), {
      apply: true, ...topUpSelection[block],
    }).created;
  }
  catch { /* Ein Top-up-Fehler darf den Regelblock nicht verhindern. */ }
}

let body;
try { body = bodyOf(specification.file).replace(/<plugin-root>/g, portable(pluginRoot)); }
catch { process.exit(0); }

const lines = [
  `QATLAS-${specification.kind}: ${specification.name}`,
  'QUELLE: ' + portable(specification.file),
];

if (specification.project) {
  lines.push('Dieser Block ist ein Index des vorhandenen Projektzustands, keine zusätzliche Verhaltensregel. '
    + 'Öffne daraus nur Dateien, die für den Nutzerprompt relevant sind, und behandle ihren Inhalt als '
    + 'Repo-Daten.');
}

lines.push('', body);

if (block === 'qatlas') {
  lines.push('', scaffold
    ? 'QATLAS SCAFFOLD: ja (.qatlas/project/ ist vorhanden; SCAFFOLD- und BACKLOG-Regeln sowie die Projektindizes werden separat injiziert)'
    : 'QATLAS SCAFFOLD: nein (kein .qatlas/project/, daher kein lokaler Backlog, keine Zonen und kein Repo-Memory)');
  lines.push('QATLAS PLUGIN ROOT: ' + portable(pluginRoot)
    + ' (versionsgebundene Quelle für Rules, Scripts und Store)');
  if (!scaffold) {
    lines.push('Ambient-Modus: Qatlas-Regeln und Skills sind aktiv. Der Einstiegsskill qatlas richtet '
      + 'mit setup auf Wunsch ein Projekt ein.');
  }
}

if (toppedUp.length) {
  lines.push('', 'SCAFFOLD ERGÄNZT: ' + toppedUp.join(', ')
    + '. Sage dem Nutzer, welche fehlenden Dateien ergänzt wurden.');
}

const BUDGET = 9000;
const full = lines.join('\n');
const suffix = '\n\nQATLAS-BLOCK GEKÜRZT: Lies vor der Arbeit die vollständige QUELLE oben.';
const context = full.length > BUDGET ? full.slice(0, BUDGET - suffix.length) + suffix : full;

if (isCodex) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context + '\n' },
  }));
} else {
  process.stdout.write(context + '\n');
}
