#!/usr/bin/env node
'use strict';

// Initialises Qatlas in a project: git repo, project instructions, README, scaffold, user library and
// .gitignore rules. Adds only what is missing and never overwrites. The doctor reports the same plan without writing.
// Usage: node qatlas-init.js [--target <dir>]

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { readConfig } = require('./runtime/config-loader.js');
const { BRAIN, migrateBrain } = require('./runtime/brain-migration.js');

const bundle = path.resolve(__dirname, '..', 'scaffold');

function walk(dir, base = dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return []; }
  return entries.flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full, base) : [path.relative(base, full).split(path.sep).join('/')];
  });
}

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

function git(args) {
  try { return execFileSync('git', args, { stdio: 'pipe' }).toString().trim(); }
  catch { return null; }
}

const hasGit = () => git(['--version']) !== null;
const isRepo = target => git(['-C', target, 'rev-parse', '--show-toplevel']) !== null;

// --target or the working dir; inside a git repo always its root, so a subfolder never gets its own scaffold.
function projectRoot(argv) {
  const index = argv.indexOf('--target');
  const start = index >= 0 ? path.resolve(argv[index + 1]) : process.cwd();
  const top = git(['-C', start, 'rev-parse', '--show-toplevel']);
  return top ? path.resolve(top) : start;
}

function missingIdentity(target) {
  return ['user.name', 'user.email'].filter(key => !git(['-C', target, 'config', key]));
}

// Every missing item of an initialised project: { to, shown } plus from (copy), text (new file) or append.
function plan(target) {
  const memory = readConfig(target).config.memory.enable;
  const copies = [
    ...walk(path.join(bundle, 'library')).map(rel => ({
      from: path.join(bundle, 'library', rel), to: path.join(os.homedir(), 'qatlas', rel), shown: '~/qatlas/' + rel,
    })),
    ...walk(path.join(bundle, BRAIN)).filter(rel => memory || !rel.startsWith('memory/')).map(rel => ({
      from: path.join(bundle, BRAIN, rel), to: path.join(target, BRAIN, rel),
      shown: BRAIN + '/' + rel,
    })),
  ];
  const missing = copies.filter(item => !fs.existsSync(item.to));

  // An existing AGENTS.md or CLAUDE.md belongs to the user and stays untouched. AGENTS.md is the entry on
  // every host, so it is added wherever it is missing; a missing CLAUDE.md binds it for Claude.
  if (!fs.existsSync(path.join(target, 'AGENTS.md'))) {
    missing.push({ from: path.join(bundle, 'agents-template.md'), to: path.join(target, 'AGENTS.md'), shown: 'AGENTS.md' });
  }
  if (!fs.existsSync(path.join(target, 'CLAUDE.md'))) {
    missing.push({ text: '@AGENTS.md\n', to: path.join(target, 'CLAUDE.md'), shown: 'CLAUDE.md' });
  }

  // Any existing README in whatever format stays the user's.
  let names = [];
  try { names = fs.readdirSync(target); } catch { /* target does not exist yet */ }
  if (!names.some(name => /^readme(\.|$)/i.test(name))) {
    missing.push({ text: '# ' + path.basename(target) + '\n', to: path.join(target, 'README.md'), shown: 'README.md' });
  }

  const gitignore = path.join(target, '.gitignore');
  const present = new Set(readText(gitignore).split(/\r?\n/).map(line => line.trim()));
  const blocks = readText(path.join(bundle, 'gitignore')).trim().split(/\r?\n\r?\n/).filter(block =>
    !present.has(block.split(/\r?\n/).find(line => line && !line.startsWith('#'))));
  if (blocks.length) {
    missing.push({ append: blocks.join('\n\n') + '\n', to: gitignore, shown: '.gitignore (Qatlas rules)' });
  }
  return missing;
}

// An existing CLAUDE.md that never names AGENTS.md keeps Claude from loading the entry. Only the user
// changes that file.
function claudeImportNote(target) {
  const claude = readText(path.join(target, 'CLAUDE.md'));
  if (!claude || claude.includes('AGENTS.md') || !fs.existsSync(path.join(target, 'AGENTS.md'))) return null;
  return 'CLAUDE.md does not import AGENTS.md, so Claude does not load it. Propose the line @AGENTS.md to the '
    + 'user and add it only with their consent.';
}

function apply(item) {
  fs.mkdirSync(path.dirname(item.to), { recursive: true });
  if (item.from) fs.copyFileSync(item.from, item.to, fs.constants.COPYFILE_EXCL);
  else if (item.text) fs.writeFileSync(item.to, item.text, { flag: 'wx' });
  else {
    const text = readText(item.to);
    fs.writeFileSync(item.to, text ? text.replace(/\s*$/, '\n\n') + item.append : item.append);
  }
}

function main() {
  const target = projectRoot(process.argv);
  const created = [];
  const problems = [];

  if (!hasGit()) problems.push('git: not on PATH. Install git and run init again.');
  else if (!isRepo(target)) {
    if (git(['init', '-q', target]) === null) problems.push('git: git init failed in ' + target + '.');
    else created.push('git repo');
  }

  // Where no session start hook ran, a folder of the old name is moved here, before the plan reads it.
  const migration = migrateBrain(target) || {};
  if (migration.note) created.push(BRAIN + '/ (renamed from the old folder name)');
  if (migration.problem) problems.push(migration.problem);

  for (const item of plan(target)) {
    try { apply(item); created.push(item.shown); }
    catch (error) { problems.push(item.shown + ': ' + error.message); }
  }

  if (hasGit() && isRepo(target)) {
    const identity = missingIdentity(target);
    if (identity.length) {
      problems.push('git identity: ' + identity.join(' and ') + ' not set; commits need them. Never invent an '
        + 'identity.');
    }
  }

  const note = claudeImportNote(target);
  const out = [];
  if (created.length) out.push('CREATED\n' + created.map(line => '- ' + line).join('\n'));
  if (problems.length) out.push('PROBLEMS\n' + problems.map(line => '- ' + line).join('\n'));
  if (note) out.push('NOTES\n- ' + note);
  process.stdout.write((out.length ? out.join('\n\n') : 'OK: nothing to do.') + '\n');
  process.exitCode = problems.length ? 1 : 0;
}

if (require.main === module) main();

module.exports = { claudeImportNote, hasGit, isRepo, missingIdentity, plan, projectRoot };
