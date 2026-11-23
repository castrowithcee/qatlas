#!/usr/bin/env node
'use strict';

// The local backlog: issues as text files on the branch qatlas-backlog of the project repo, checked out once
// per host in the state folder of the project. The branch shares no history with the code, so every working
// tree of the repo sees one live state and the backlog travels with the remote of the repo.
// Usage: node qatlas-backlog.js <command> [--target <dir>]
//   fields                                    the selection of every field, also before the first issue
//   fields add <field> [<value>] [--means <qatlas status>] [--no-work]
//   fields remove <field> <value>
//   list [--status s] [--type t] [--label l] [--parent id] [--where key=value] [--all]
//   show <id>
//   add --title <text> [--type t] [--status s] [--parent id] [--depends id,id] [--labels a,b]
//       [--set key=value] [--body-file <file>] [--id <id>]
//   set <id> [--title] [--type] [--status] [--parent id | --no-parent] [--depends id,id] [--labels a,b]
//       [--set key=value] [--force]
//   move <id> --before <id> | --after <id> | --first | --last
//   save [--message <text>]                   commits edits made directly in issue files
//   check                                     lists invalid issues, exit 1 if there are any
//   sync [--resolved]                         fetches, merges and pushes the backlog branch
// Output is JSON on stdout. Exit 1 is a refused command, exit 2 a sync conflict.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { projectDir, readState, ensureState } = require('./runtime/project-store.js');

const BRANCH = 'qatlas-backlog';
const REF = 'refs/heads/' + BRANCH;
const QATLAS_STATUS = ['draft', 'ready', 'in-progress', 'review', 'waiting', 'deferred', 'done'];
const WAYS = {
  draft: ['ready', 'waiting', 'deferred'],
  ready: ['in-progress', 'draft', 'waiting', 'deferred'],
  'in-progress': ['ready', 'draft', 'review', 'waiting', 'done'],
  review: ['ready', 'draft', 'waiting', 'done'],
  waiting: ['draft', 'ready', 'deferred'],
  deferred: ['draft', 'ready'],
  done: [],
};
const CORE = ['title', 'type', 'status', 'rank', 'parent', 'depends', 'labels'];

class Refusal extends Error {}
// Ends the command with its own output and exit code, after locks are released.
class Outcome extends Error { constructor(code, output) { super('outcome'); this.code = code; this.output = output; } }
const refuse = message => { throw new Refusal(message); };
const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim() !== '';

// ---------- fields

function defaultFields() {
  return {
    format: 1,
    status: QATLAS_STATUS.map(name => ({ name, means: name })),
    type: [{ name: 'task' }, { name: 'feature' }, { name: 'bug' }, { name: 'idea', work: false }],
    labels: [],
    custom: {},
  };
}

function fieldProblems(fields) {
  const problems = [];
  const unique = (list, what) => {
    if (new Set(list).size !== list.length) problems.push(what + ' holds a value twice.');
  };
  if (!isObject(fields) || fields.format !== 1) return ['fields.json needs "format": 1.'];
  if (!Array.isArray(fields.status) || !fields.status.every(entry => isObject(entry) && isText(entry.name)
    && (entry.means === null || entry.means === undefined || QATLAS_STATUS.includes(entry.means)))) {
    problems.push('status needs entries with a name and means, one of ' + QATLAS_STATUS.join(', ') + ' or null.');
  } else {
    unique(fields.status.map(entry => entry.name), 'status');
    for (const status of QATLAS_STATUS) {
      if (!fields.status.some(entry => entry.means === status)) problems.push('No status means ' + status + '.');
    }
  }
  if (!Array.isArray(fields.type) || !fields.type.every(entry => isObject(entry) && isText(entry.name))) {
    problems.push('type needs entries with a name.');
  } else {
    unique(fields.type.map(entry => entry.name), 'type');
    if (!fields.type.some(entry => entry.work !== false)) problems.push('type needs at least one type that is work.');
  }
  if (!Array.isArray(fields.labels) || !fields.labels.every(isText)) problems.push('labels needs a list of texts.');
  else unique(fields.labels, 'labels');
  if (!isObject(fields.custom)) problems.push('custom needs an object.');
  else {
    for (const [name, choices] of Object.entries(fields.custom)) {
      if (CORE.includes(name) || !/^[a-z][a-z0-9-]*$/.test(name)) problems.push('custom.' + name + ' is no valid field name.');
      else if (choices !== null && !(Array.isArray(choices) && choices.every(isText))) {
        problems.push('custom.' + name + ' needs a list of texts or null.');
      }
    }
  }
  return problems;
}

// A new backlog starts from the shipped selection; the user's block backlog replaces whole fields of it.
function startFields(project) {
  const fields = defaultFields();
  let own = null;
  try { own = require('./runtime/config-loader.js').readConfig(project).backlog; } catch { /* shipped selection */ }
  if (!isObject(own)) return fields;
  const merged = { ...fields };
  for (const key of ['status', 'type', 'labels', 'custom']) if (key in own) merged[key] = own[key];
  const problems = fieldProblems(merged);
  if (problems.length) refuse('The block backlog of the user config is invalid: ' + problems.join(' '));
  return merged;
}

const meansOf = (fields, name) => (fields.status.find(entry => entry.name === name) || {}).means || null;
const isWork = (fields, type) => (fields.type.find(entry => entry.name === type) || {}).work !== false;

// Accepts the user's own status name or a Qatlas status, whose first entry is the one written.
function resolveStatus(fields, value) {
  if (fields.status.some(entry => entry.name === value)) return value;
  const target = fields.status.find(entry => entry.means === value);
  if (target) return target.name;
  return refuse('Unknown status ' + value + '. Known: ' + fields.status.map(entry => entry.name).join(', ') + '.');
}

// ---------- issue files

function parseIssue(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text.replace(/^﻿/, ''));
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
    if (!pair) continue;
    try { meta[pair[1]] = JSON.parse(pair[2]); } catch { meta[pair[1]] = pair[2].trim(); }
  }
  return { meta, body: match[2] };
}

function formatIssue(meta, body) {
  const keys = [...CORE.filter(key => key in meta), ...Object.keys(meta).filter(key => !CORE.includes(key)).sort()];
  const lines = keys.filter(key => meta[key] !== undefined && meta[key] !== null)
    .map(key => key + ': ' + JSON.stringify(meta[key]));
  return '---\n' + lines.join('\n') + '\n---\n' + (body && !body.startsWith('\n') ? '\n' : '') + (body || '');
}

function readIssues(dir) {
  let names = [];
  try { names = fs.readdirSync(path.join(dir, 'issues')); } catch { return []; }
  return names.filter(name => /^\d{4,}\.md$/.test(name)).sort().map(name => {
    const file = path.join(dir, 'issues', name);
    const parsed = parseIssue(fs.readFileSync(file, 'utf8'));
    return { id: name.slice(0, -3), file, meta: parsed ? parsed.meta : null, body: parsed ? parsed.body : '' };
  });
}

function issueProblems(issue, fields, ids) {
  const meta = issue.meta;
  if (!meta) return [issue.id + ': no frontmatter.'];
  const problems = [];
  const say = text => problems.push(issue.id + ': ' + text);
  if (!isText(meta.title)) say('title is missing.');
  if (!fields.type.some(entry => entry.name === meta.type)) say('unknown type ' + meta.type + '.');
  else if (isWork(fields, meta.type)) {
    if (!fields.status.some(entry => entry.name === meta.status)) say('unknown status ' + meta.status + '.');
  } else if ('status' in meta) say('the type ' + meta.type + ' carries no status.');
  if ('rank' in meta && typeof meta.rank !== 'number') say('rank must be a number.');
  if ('parent' in meta && (meta.parent === issue.id || !ids.has(meta.parent))) say('unknown parent ' + meta.parent + '.');
  for (const key of ['depends', 'labels']) {
    if (key in meta && !(Array.isArray(meta[key]) && meta[key].every(isText))) say(key + ' must be a list of texts.');
  }
  if (Array.isArray(meta.depends)) {
    for (const id of meta.depends) if (id === issue.id || !ids.has(id)) say('unknown dependency ' + id + '.');
  }
  if (Array.isArray(meta.labels)) {
    for (const label of meta.labels) if (!fields.labels.includes(label)) say('unknown label ' + label + '.');
  }
  for (const key of Object.keys(meta).filter(name => !CORE.includes(name))) {
    if (!(key in fields.custom)) say('unknown field ' + key + '.');
    else if (fields.custom[key] && !fields.custom[key].includes(meta[key])) say('unknown ' + key + ' ' + meta[key] + '.');
  }
  return problems;
}

function storeProblems(store) {
  const problems = fieldProblems(store.fields);
  if (problems.length) return problems;
  const ids = new Set(store.issues.map(issue => issue.id));
  return store.issues.flatMap(issue => issueProblems(issue, store.fields, ids));
}

// ---------- store on the backlog branch

function gitDir(project) {
  try {
    return execFileSync('git', ['-C', project, 'rev-parse', '--path-format=absolute', '--git-common-dir'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
}

function locate(start, write) {
  const project = projectDir(start);
  const common = project && gitDir(project);
  if (!common) refuse('The local backlog needs a git repo. qatlas-core init sets one up.');
  const state = write ? ensureState(project) : readState(project);
  const dir = state && path.join(state, 'backlog');
  if (dir && write) fs.mkdirSync(dir, { recursive: true });
  // Reading creates nothing, so the checkout may not exist yet.
  const git = (args, options = {}) => {
    const checkedOut = fs.existsSync(dir);
    const env = { ...process.env, GIT_DIR: common, GIT_INDEX_FILE: path.join(state, 'backlog.index') };
    if (checkedOut) env.GIT_WORK_TREE = dir;
    try {
      return execFileSync('git', args, { cwd: checkedOut ? dir : project, env, encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    } catch (error) {
      if (options.allowFail) return null;
      throw new Refusal('git ' + args[0] + ' failed: ' + String(error.stderr || error.message).trim());
    }
  };
  return { project, state, dir, git };
}

// Brings the checkout in line with the branch; a branch that only the remote has is taken over. With write
// a missing backlog is started. Returns null when there is no backlog and none was asked for.
function open(start, write = false) {
  const at = locate(start, write);
  if (!at.state) {
    if (!write && projectDir(start) && findRemoteTip(projectDir(start))) return open(start, true);
    return write ? null : { ...at, fields: startFields(at.project), issues: [], created: false };
  }
  let tip = at.git(['rev-parse', '-q', '--verify', REF], { allowFail: true });
  if (!tip) {
    const remote = at.git(['for-each-ref', '--format=%(objectname)', 'refs/remotes/*/' + BRANCH]).split('\n').filter(Boolean);
    if (remote.length === 1) { at.git(['update-ref', REF, remote[0]]); tip = remote[0]; }
  }
  if (tip && !fs.existsSync(path.join(at.dir, 'fields.json'))) {
    fs.mkdirSync(at.dir, { recursive: true });
    at.git(['read-tree', tip]);
    at.git(['checkout-index', '-a', '-f']);
  }
  if (!tip && !write) return { ...at, fields: startFields(at.project), issues: [], created: false };
  if (!tip) {
    fs.mkdirSync(path.join(at.dir, 'issues'), { recursive: true });
    fs.writeFileSync(path.join(at.dir, 'fields.json'), JSON.stringify(startFields(at.project), null, 2) + '\n');
  }
  let fields;
  try { fields = JSON.parse(fs.readFileSync(path.join(at.dir, 'fields.json'), 'utf8')); }
  catch (error) { refuse('fields.json of the backlog is not readable: ' + error.message); }
  const store = { ...at, fields, issues: readIssues(at.dir), created: true };
  if (!tip) commit(store, 'Start the backlog');
  return store;
}

function findRemoteTip(project) {
  try {
    return execFileSync('git', ['-C', project, 'for-each-ref', '--format=%(objectname)', 'refs/remotes/*/' + BRANCH,
      REF], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return ''; }
}

// Commits whatever the checkout holds. The ref moves only from the tip this commit was built on.
function commit(store, message, parents = null) {
  store.git(['add', '-A']);
  const tree = store.git(['write-tree']);
  const tip = store.git(['rev-parse', '-q', '--verify', REF], { allowFail: true });
  if (!parents && tip && store.git(['rev-parse', tip + '^{tree}']) === tree) return tip;
  const list = parents || (tip ? [tip] : []);
  const made = store.git(['commit-tree', tree, ...list.flatMap(parent => ['-p', parent]), '-m', message]);
  store.git(tip ? ['update-ref', REF, made, tip] : ['update-ref', REF, made]);
  return made;
}

// One writer at a time for all working trees and agents of the project on this host.
function locked(start, action) {
  const at = locate(start, true);
  const lock = path.join(at.state, 'backlog.lock');
  for (let attempt = 0; ; attempt++) {
    try { fs.mkdirSync(lock); break; } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let age = 0;
      try { age = Date.now() - fs.statSync(lock).mtimeMs; } catch { continue; }
      if (age > 60000) { fs.rmSync(lock, { recursive: true, force: true }); continue; }
      if (attempt > 600) refuse('The backlog stays locked: ' + lock);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  try { return action(open(start, true)); } finally { fs.rmSync(lock, { recursive: true, force: true }); }
}

function writeIssue(store, issue) {
  fs.mkdirSync(path.join(store.dir, 'issues'), { recursive: true });
  fs.writeFileSync(issue.file, formatIssue(issue.meta, issue.body));
}

function find(store, id) {
  const wanted = /^\d+$/.test(String(id)) ? String(id).padStart(4, '0') : String(id);
  return store.issues.find(issue => issue.id === wanted) || refuse('There is no issue ' + id + '.');
}

// Checks the whole store as it would be, then writes what the command changed and commits. A refused
// command leaves the files as they were.
function saved(store, message, changed = {}) {
  const problems = storeProblems(store);
  if (problems.length) refuse('Nothing is committed until this is fixed: ' + problems.join(' '));
  for (const issue of changed.issues || []) writeIssue(store, issue);
  if (changed.fields) fs.writeFileSync(path.join(store.dir, 'fields.json'), JSON.stringify(store.fields, null, 2) + '\n');
  commit(store, message);
}

// ---------- views

function view(store, issue) {
  const meta = issue.meta || {};
  const done = id => { const other = store.issues.find(entry => entry.id === id); return Boolean(other && other.meta && meansOf(store.fields, other.meta.status) === 'done'); };
  const means = meansOf(store.fields, meta.status);
  return { id: issue.id, ...meta, means, executable: means === 'ready' && (meta.depends || []).every(done) };
}

function ordered(store, issues) {
  const priority = Array.isArray(store.fields.custom.priority) ? store.fields.custom.priority : [];
  const level = issue => { const index = priority.indexOf((issue.meta || {}).priority); return index < 0 ? priority.length : index; };
  const rank = issue => (typeof (issue.meta || {}).rank === 'number' ? issue.meta.rank : Infinity);
  return [...issues].sort((a, b) => level(a) - level(b) || rank(a) - rank(b) || a.id.localeCompare(b.id));
}

function counts(store) {
  const out = { ideas: 0 };
  for (const issue of store.issues) {
    const meta = issue.meta || {};
    if (!isWork(store.fields, meta.type)) { out.ideas += 1; continue; }
    const key = meansOf(store.fields, meta.status) || 'no-status';
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

// One line for the session start; reads files only and creates nothing.
function summary(start) {
  try {
    const project = projectDir(start);
    const state = project && readState(project);
    if (!state) return null;
    const dir = path.join(state, 'backlog');
    const fields = JSON.parse(fs.readFileSync(path.join(dir, 'fields.json'), 'utf8'));
    const found = counts({ fields, issues: readIssues(dir) });
    const parts = [...QATLAS_STATUS, 'no-status'].filter(key => key !== 'done' && found[key]).map(key => found[key] + ' ' + key);
    if (found.ideas) parts.push(found.ideas + ' ideas');
    return parts.length ? parts.join(', ') : 'no open issues';
  } catch { return null; }
}

// For the doctor: reads an existing checkout only and creates nothing.
function check(start) {
  const project = projectDir(start);
  const state = project && gitDir(project) && readState(project);
  const dir = state && path.join(state, 'backlog');
  if (!dir || !fs.existsSync(path.join(dir, 'fields.json'))) return [];
  let fields;
  try { fields = JSON.parse(fs.readFileSync(path.join(dir, 'fields.json'), 'utf8')); }
  catch (error) { return ['fields.json is not readable: ' + error.message]; }
  return storeProblems({ fields, issues: readIssues(dir) });
}

// ---------- commands

function parse(argv) {
  const flags = new Set(['--all', '--force', '--first', '--last', '--no-parent', '--resolved', '--no-work']);
  const options = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) { rest.push(arg); continue; }
    if (flags.has(arg)) { options[arg.slice(2)] = true; continue; }
    if (i + 1 >= argv.length) refuse(arg + ' needs a value.');
    (options[arg.slice(2)] = options[arg.slice(2)] || []).push(argv[++i]);
  }
  const one = name => (options[name] ? options[name][options[name].length - 1] : undefined);
  const list = name => (options[name] ? options[name].flatMap(value => value.split(',')).map(v => v.trim()).filter(Boolean) : undefined);
  return { options, rest, one, list };
}

const padded = ids => ids.map(id => (/^\d+$/.test(id) ? id.padStart(4, '0') : id));

function applyOptions(store, issue, args, isNew) {
  const { options, one, list } = args;
  const meta = issue.meta;
  const before = meansOf(store.fields, meta.status);
  if (one('title') !== undefined) meta.title = one('title');
  if (one('type') !== undefined) meta.type = one('type');
  if (!store.fields.type.some(entry => entry.name === meta.type)) {
    refuse('Unknown type ' + meta.type + '. Known: ' + store.fields.type.map(entry => entry.name).join(', ') + '.');
  }
  if (isWork(store.fields, meta.type)) {
    if (one('status') !== undefined) meta.status = resolveStatus(store.fields, one('status'));
    else if (!('status' in meta)) meta.status = resolveStatus(store.fields, 'draft');
    if (typeof meta.rank !== 'number') {
      meta.rank = Math.max(0, ...store.issues.map(entry => (entry.meta && typeof entry.meta.rank === 'number' ? entry.meta.rank : 0))) + 1;
    }
    const after = meansOf(store.fields, meta.status);
    if (!isNew && before && after && before !== after && !WAYS[before].includes(after) && !options.force) {
      refuse('The backlog norm has no way from ' + before + ' to ' + after + '. From ' + before + ': '
        + (WAYS[before].join(', ') || 'none') + '. --force only on the user\'s explicit word.');
    }
  } else {
    if (one('status') !== undefined) refuse('The type ' + meta.type + ' carries no status.');
    delete meta.status;
    delete meta.rank;
  }
  if (options['no-parent']) delete meta.parent;
  if (one('parent') !== undefined) meta.parent = padded([one('parent')])[0];
  if (list('depends') !== undefined) meta.depends = padded(list('depends'));
  if (list('labels') !== undefined) meta.labels = list('labels');
  for (const pair of options.set || []) {
    const cut = pair.indexOf('=');
    if (cut < 1) refuse('--set needs key=value.');
    const key = pair.slice(0, cut);
    if (CORE.includes(key)) refuse('--set is for your own fields; ' + key + ' has its own option.');
    if (pair.slice(cut + 1) === '') delete meta[key]; else meta[key] = pair.slice(cut + 1);
  }
  for (const key of ['depends', 'labels']) if (Array.isArray(meta[key]) && !meta[key].length) delete meta[key];
}

function templateBody() {
  try {
    const text = fs.readFileSync(path.join(__dirname, '..', 'skills', 'qatlas-core-backlog', 'assets', 'task.md'), 'utf8');
    return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').replace(/^\s+/, '');
  } catch { return ''; }
}

const commands = {
  fields(start, args) {
    const [action, field, value] = args.rest;
    if (!action) { const store = open(start); return { created: store.created, ...store.fields }; }
    if (!['add', 'remove'].includes(action) || !field) refuse('fields takes add or remove with a field.');
    return locked(start, store => {
      const all = store.fields;
      const used = test => store.issues.some(issue => issue.meta && test(issue.meta));
      if (action === 'add' && field === 'status') {
        if (!value) refuse('fields add status needs a name.');
        const means = args.one('means');
        all.status.push({ name: value, means: means === undefined || means === 'none' ? null : means });
      } else if (action === 'add' && field === 'type') {
        if (!value) refuse('fields add type needs a name.');
        all.type.push(args.options['no-work'] ? { name: value, work: false } : { name: value });
      } else if (action === 'add' && field === 'labels') {
        if (!value) refuse('fields add labels needs a name.');
        all.labels.push(value);
      } else if (action === 'add') {
        if (!(field in all.custom)) all.custom[field] = value ? [value] : null;
        else if (value && Array.isArray(all.custom[field])) all.custom[field].push(value);
        else if (value) refuse(field + ' takes any text and has no selection.');
      } else if (!value) refuse('fields remove needs a field and a value.');
      else if (field === 'status') {
        if (used(meta => meta.status === value)) refuse('An issue still carries the status ' + value + '.');
        all.status = all.status.filter(entry => entry.name !== value);
      } else if (field === 'type') {
        if (used(meta => meta.type === value)) refuse('An issue still carries the type ' + value + '.');
        all.type = all.type.filter(entry => entry.name !== value);
      } else if (field === 'labels') {
        if (used(meta => (meta.labels || []).includes(value))) refuse('An issue still carries the label ' + value + '.');
        all.labels = all.labels.filter(entry => entry !== value);
      } else if (Array.isArray(all.custom[field])) {
        if (used(meta => meta[field] === value)) refuse('An issue still carries ' + field + ' ' + value + '.');
        all.custom[field] = all.custom[field].filter(entry => entry !== value);
        if (!all.custom[field].length) delete all.custom[field];
      } else refuse('There is no selection ' + field + '.');
      saved(store, 'Change the fields', { fields: true });
      return { created: true, ...all };
    });
  },

  list(start, args) {
    const store = open(start);
    const { options, one } = args;
    let issues = store.issues.filter(issue => issue.meta);
    const typed = one('type');
    if (!options.all) {
      issues = issues.filter(issue => (typed ? true : isWork(store.fields, issue.meta.type))
        && (one('status') ? true : meansOf(store.fields, issue.meta.status) !== 'done'));
    }
    if (typed) issues = issues.filter(issue => issue.meta.type === typed);
    if (one('status')) {
      const wanted = one('status');
      issues = issues.filter(issue => issue.meta.status === wanted || meansOf(store.fields, issue.meta.status) === wanted);
    }
    if (one('label')) issues = issues.filter(issue => (issue.meta.labels || []).includes(one('label')));
    if (one('parent')) issues = issues.filter(issue => issue.meta.parent === padded([one('parent')])[0]);
    for (const pair of options.where || []) {
      const [key, value] = [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)];
      issues = issues.filter(issue => String(issue.meta[key]) === value);
    }
    return { issues: ordered(store, issues).map(issue => view(store, issue)), counts: counts(store) };
  },

  show(start, args) {
    const store = open(start);
    const issue = find(store, args.rest[0]);
    return { ...view(store, issue), path: issue.file, body: issue.body };
  },

  add(start, args) {
    if (!isText(args.one('title'))) refuse('add needs --title.');
    return locked(start, store => {
      const given = args.one('id');
      const next = Math.max(0, ...store.issues.map(issue => Number(issue.id))) + 1;
      const id = given ? padded([given])[0] : String(next).padStart(4, '0');
      if (!/^\d{4,}$/.test(id)) refuse('An id is a number.');
      if (store.issues.some(issue => issue.id === id)) refuse('The issue ' + id + ' exists.');
      const meta = { title: '', type: args.one('type') || store.fields.type.find(entry => entry.work !== false).name };
      const issue = { id, file: path.join(store.dir, 'issues', id + '.md'), meta, body: '' };
      applyOptions(store, issue, args, true);
      const bodyFile = args.one('body-file');
      issue.body = bodyFile ? fs.readFileSync(path.resolve(bodyFile), 'utf8') : (isWork(store.fields, meta.type) ? templateBody() : '');
      store.issues.push(issue);
      saved(store, 'Add ' + id + ': ' + meta.title, { issues: [issue] });
      return { id, path: issue.file, ...meta };
    });
  },

  set(start, args) {
    return locked(start, store => {
      const issue = find(store, args.rest[0]);
      if (!issue.meta) refuse(issue.id + ' has no frontmatter. Repair the file first.');
      applyOptions(store, issue, args, false);
      const bodyFile = args.one('body-file');
      if (bodyFile) issue.body = fs.readFileSync(path.resolve(bodyFile), 'utf8');
      else if (isWork(store.fields, issue.meta.type) && !issue.body.trim()) issue.body = templateBody();
      saved(store, 'Change ' + issue.id + ': ' + issue.meta.title, { issues: [issue] });
      return view(store, issue);
    });
  },

  move(start, args) {
    return locked(start, store => {
      const issue = find(store, args.rest[0]);
      const ranked = ordered(store, store.issues.filter(entry => entry.meta && typeof entry.meta.rank === 'number' && entry.id !== issue.id))
        .sort((a, b) => a.meta.rank - b.meta.rank);
      if (!issue.meta || typeof issue.meta.rank !== 'number') refuse('Only an issue that is work has a place in the order.');
      const anchor = args.one('before') || args.one('after');
      let index;
      if (args.options.first) index = 0;
      else if (args.options.last) index = ranked.length;
      else if (anchor) {
        const at = ranked.findIndex(entry => entry.id === padded([anchor])[0]);
        if (at < 0) refuse('The issue ' + anchor + ' has no place in the order.');
        index = args.one('before') ? at : at + 1;
      } else refuse('move needs --before, --after, --first or --last.');
      const low = index > 0 ? ranked[index - 1].meta.rank : null;
      const high = index < ranked.length ? ranked[index].meta.rank : null;
      issue.meta.rank = low === null ? (high === null ? 1 : high - 1) : (high === null ? low + 1 : (low + high) / 2);
      saved(store, 'Move ' + issue.id, { issues: [issue] });
      return { id: issue.id, rank: issue.meta.rank };
    });
  },

  save(start, args) {
    return locked(start, store => {
      saved(store, args.one('message') || 'Save edited issues');
      return { saved: true };
    });
  },

  check(start) {
    const problems = check(start);
    if (problems.length) throw new Outcome(1, { problems });
    return { problems };
  },

  sync(start, args) {
    return locked(start, store => {
      saved(store, 'Save edited issues');
      const remotes = store.git(['remote']).split('\n').filter(Boolean);
      const remote = remotes.includes('origin') ? 'origin' : remotes[0];
      if (!remote) return { synced: false, reason: 'The repo has no remote.' };
      const tracking = 'refs/remotes/' + remote + '/' + BRANCH;
      const push = () => { store.git(['push', '-q', remote, REF + ':' + REF]); store.git(['update-ref', tracking, store.git(['rev-parse', REF])]); };
      const has = store.git(['ls-remote', '--heads', remote, BRANCH]);
      const mine = store.git(['rev-parse', REF]);
      if (!has) { push(); return { synced: true, pushed: true }; }
      store.git(['fetch', '-q', remote, '+' + REF + ':' + tracking]);
      const theirs = store.git(['rev-parse', tracking]);
      const within = (a, b) => store.git(['merge-base', '--is-ancestor', a, b], { allowFail: true }) !== null;
      if (mine === theirs) return { synced: true, pushed: false };
      if (within(theirs, mine)) { push(); return { synced: true, pushed: true }; }
      const refresh = () => store.git(['read-tree', '--reset', '-u', REF]);
      if (within(mine, theirs)) {
        store.git(['update-ref', REF, theirs, mine]);
        refresh();
        return { synced: true, pushed: false, updated: true };
      }
      if (args.options.resolved) {
        commit(store, 'Merge the backlog of ' + remote, [mine, theirs]);
        push();
        return { synced: true, pushed: true, merged: true };
      }
      const merged = store.git(['merge-tree', '--write-tree', '--name-only', mine, theirs], { allowFail: true });
      if (merged && /^[0-9a-f]{40,}$/.test(merged.split('\n')[0])) {
        const made = store.git(['commit-tree', merged.split('\n')[0], '-p', mine, '-p', theirs, '-m', 'Merge the backlog of ' + remote]);
        store.git(['update-ref', REF, made, mine]);
        refresh();
        push();
        return { synced: true, pushed: true, merged: true };
      }
      // Both sides changed the same file. The remote versions are laid beside the checkout for comparison.
      const copies = path.join(store.state, 'backlog-remote');
      fs.rmSync(copies, { recursive: true, force: true });
      const changed = store.git(['diff', '--name-only', mine, theirs]).split('\n').filter(Boolean);
      const base = store.git(['merge-base', mine, theirs], { allowFail: true });
      const files = changed.filter(name => !base || (store.git(['diff', '--name-only', base, mine, '--', name])
        && store.git(['diff', '--name-only', base, theirs, '--', name])));
      for (const name of files) {
        const text = store.git(['show', theirs + ':' + name], { allowFail: true });
        if (text === null) continue;
        fs.mkdirSync(path.dirname(path.join(copies, name)), { recursive: true });
        fs.writeFileSync(path.join(copies, name), text + '\n');
      }
      throw new Outcome(2, { synced: false, conflict: true, files, local: store.dir, remote: copies,
        next: 'Bring each file under local to the state that shall hold, then run sync --resolved.' });
    });
  },
};

function main() {
  const argv = process.argv.slice(2);
  const targetAt = argv.indexOf('--target');
  const start = targetAt >= 0 ? path.resolve(argv.splice(targetAt, 2)[1]) : process.cwd();
  const command = argv.shift();
  if (!commands[command]) {
    process.stderr.write('usage: qatlas-backlog.js fields|list|show|add|set|move|save|check|sync [--target <dir>]\n');
    process.exit(1);
  }
  try {
    process.stdout.write(JSON.stringify(commands[command](start, parse(argv)), null, 2) + '\n');
  } catch (error) {
    if (error instanceof Outcome) {
      process.stdout.write(JSON.stringify(error.output, null, 2) + '\n');
      process.exit(error.code);
    }
    if (!(error instanceof Refusal)) throw error;
    process.stderr.write(error.message + '\n');
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { check, summary, BRANCH };
