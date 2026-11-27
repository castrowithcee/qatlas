#!/usr/bin/env node
'use strict';

// The local backlog: issues as text files on the branch qatlas-backlog of the project repo, checked out once
// under .qatlas/local/backlog/ of the primary working tree, where agents may edit files. The branch shares no
// history with the code, so every working tree of the repo sees one live state and the backlog travels with
// the remote of the repo. The script passes the text of an issue through and prescribes none.
// Usage: node qatlas-backlog.js <command> [--target <dir>]
//   fields                                    the selection of every field, also before the first issue
//   fields add <field> [<value>] [--means <qatlas status>] [--no-work]
//   fields remove <field> <value>
//   list [--status <s>] [--type <t>] [--label <l>] [--parent <id>] [--where <key>=<value>] [--all]
//   show <id>
//   add --title <text> [--body-file <file>] [--type <t>] [--status <s>] [--parent <id>] [--depends <id,id>]
//       [--labels <a,b>] [--set <key>=<value>] [--id <id>]
//   set <id> [--title <text>] [--body-file <file>] [--type <t>] [--status <s>] [--parent <id> | --no-parent]
//       [--depends <id,id>] [--labels <a,b>] [--set <key>=<value>] [--force]
//   move <id> --before <id> | --after <id> | --first | --last
//   save                                      commits edits made directly in issue files
//   sync [--resolved]                         fetches, merges and pushes the backlog branch
// Output is JSON on stdout. Exit 1 is a refused command, exit 2 a sync conflict.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { projectDir, excludeLocal } = require('./runtime/project-store.js');

const BRANCH = 'qatlas-backlog';
const REF = 'refs/heads/' + BRANCH;
const QATLAS_STATUS = ['draft', 'ready', 'in-progress', 'review', 'waiting', 'deferred', 'done'];
const WAYS = {
  draft: ['ready', 'waiting', 'deferred', 'done'],
  ready: ['in-progress', 'draft', 'waiting', 'deferred', 'done'],
  'in-progress': ['ready', 'draft', 'review', 'waiting', 'done'],
  review: ['ready', 'draft', 'waiting', 'deferred', 'done'],
  waiting: ['draft', 'ready', 'deferred', 'done'],
  deferred: ['draft', 'ready', 'done'],
  done: [],
};
const CORE = ['title', 'type', 'status', 'rank', 'parent', 'depends', 'labels'];
const SELECTIONS = ['status', 'type', 'labels', 'custom'];
const OPTIONS = {
  fields: ['means', 'no-work'],
  list: ['status', 'type', 'label', 'parent', 'where', 'all'],
  show: [],
  add: ['title', 'body-file', 'type', 'status', 'parent', 'depends', 'labels', 'set', 'id'],
  set: ['title', 'body-file', 'type', 'status', 'parent', 'no-parent', 'depends', 'labels', 'set', 'force'],
  move: ['before', 'after', 'first', 'last'],
  save: [],
  sync: ['resolved'],
};

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
    type: [{ name: 'task' }, { name: 'feature' }, { name: 'bug' }, { name: 'idea', work: false }, { name: 'epic', work: false }],
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
function fieldsFrom(block) {
  const fields = defaultFields();
  for (const key of SELECTIONS) if (isObject(block) && key in block) fields[key] = block[key];
  return fields;
}

// What is wrong with the block backlog of the user config, also for the doctor.
function configProblems(block) {
  if (block === null || block === undefined) return [];
  if (!isObject(block)) return ['The block must be an object.'];
  return [...Object.keys(block).filter(key => !SELECTIONS.includes(key)).map(key => key + ' is no known key.'),
    ...fieldProblems(fieldsFrom(block))];
}

// The block is read once and never again, so a mistake in it stops the start instead of being skipped.
function startFields(project) {
  const state = require('./runtime/config-loader.js').readConfig(project);
  const problems = state.userError ? [state.userError]
    : [...state.problems.filter(problem => problem.startsWith(state.configFile + ': backlog')),
      ...configProblems(state.backlog)];
  if (problems.length) refuse('No backlog starts until ' + state.configFile + ' is repaired: ' + problems.join(' '));
  return fieldsFrom(state.backlog);
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
  } else if ('status' in meta && meansOf(fields, meta.status) !== 'done') say('the type ' + meta.type + ' carries no status but done.');
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

// Where the backlog of a project lives and how git reaches it. Creates nothing.
function locate(start) {
  const project = projectDir(start);
  const common = project && gitDir(project);
  if (!common) refuse('The local backlog needs a git repo. qatlas-core init sets one up.');
  const state = path.join(project, '.qatlas', 'local');
  const dir = path.join(state, 'backlog');
  const git = (args, options = {}) => {
    // A relative path of a remote counts from the project, so network commands run there, without the checkout.
    const checkedOut = !options.network && fs.existsSync(dir);
    const env = { ...process.env, GIT_DIR: common, GIT_INDEX_FILE: path.join(state, 'backlog.index') };
    if (checkedOut) env.GIT_WORK_TREE = dir;
    try {
      return execFileSync('git', args, { cwd: checkedOut ? dir : project, env, encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).trim();
    } catch (error) {
      if (options.allowFail) return null;
      // git merge-tree exits 1 on a conflict and still names the merged tree.
      if (options.conflict && error.status === 1) return String(error.stdout).trim();
      throw new Refusal('git ' + args[0] + ' failed: ' + String(error.stderr || error.message).trim());
    }
  };
  return { project, state, dir, git };
}

const tipOf = (at, ref) => at.git(['rev-parse', '-q', '--verify', ref], { allowFail: true });
const tracking = remote => 'refs/remotes/' + remote + '/' + BRANCH;

// The one remote the backlog travels with: origin, else the first. Other remotes never count.
function remoteOf(at) {
  const remotes = at.git(['remote']).split('\n').filter(Boolean);
  return remotes.includes('origin') ? 'origin' : remotes[0] || null;
}

function remoteTip(at) {
  const remote = remoteOf(at);
  return remote ? tipOf(at, tracking(remote)) : null;
}

// The store as the checkout holds it. Without a backlog it shows the fields a new one starts with and
// creates nothing. A checkout that is missing, as after a clone or git clean, is built again from the
// branch, and a branch that only the remote has is taken over, both under the lock.
function open(start, held = false) {
  const at = locate(start);
  let tip = tipOf(at, REF);
  const taken = tip ? null : remoteTip(at);
  if (!tip && !taken) return { ...at, fields: startFields(at.project), issues: [], created: false };
  const file = path.join(at.dir, 'fields.json');
  if (taken || !fs.existsSync(file)) {
    if (!held) return locked(start, store => store);
    if (taken) at.git(['update-ref', REF, tip = taken, '']);
    fs.mkdirSync(at.dir, { recursive: true });
    at.git(['read-tree', tip]);
    at.git(['checkout-index', '-a', '-f']);
  }
  let fields;
  try { fields = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { refuse('fields.json of the backlog is not readable: ' + error.message); }
  return { ...at, fields, issues: readIssues(at.dir), created: true };
}

// Commits whatever the checkout holds. The ref moves only from the tip this commit was built on, and only
// if the commit adds no secret: checked like staged code, so that none ever enters the history and travels.
function commit(store, message) {
  store.git(['add', '-A']);
  const tree = store.git(['write-tree']);
  const tip = tipOf(store, REF);
  if (tip && store.git(['rev-parse', tip + '^{tree}']) === tree) return;
  const made = store.git(['commit-tree', tree, ...(tip ? ['-p', tip] : []), '-m', message]);
  // The project value counts only as committed in the project, so an uncommitted edit cannot switch the check off.
  const projectText = store.git(['show', 'HEAD:.qatlas/plugins/config.json'], { allowFail: true });
  if (require('./runtime/config-loader.js').readConfig(store.project, { projectText }).config.protection.secrets !== 'allow') {
    const patch = store.git(['show', '--format=', '-p', '--unified=0', '--no-color', '--no-ext-diff', made]);
    const secrets = require('./qatlas-protection-check.js').scanSecrets(patch).map(hit => hit.item);
    if (secrets.length) {
      refuse('Nothing is committed: possible secrets in ' + secrets.join(', ')
        + '. Remove them from the text and repeat the command.');
    }
  }
  store.git(['update-ref', REF, made, tip || '']);
}

// The lock names its holder, so only a dead process loses it, however long a sync takes. A lock without
// a readable holder counts as left behind after a minute.
function abandoned(lock) {
  let holder = 0;
  try { holder = Number(fs.readFileSync(lock, 'utf8')); } catch { /* no holder to ask */ }
  if (holder > 0) {
    try { process.kill(holder, 0); return false; } catch (error) { return error.code === 'ESRCH'; }
  }
  try { return Date.now() - fs.statSync(lock).mtimeMs > 60000; } catch { return false; }
}

// One writer at a time for all working trees and agents of the project on this host. Only a command that
// starts may meet a project without a backlog; every other one is refused before anything is created.
function locked(start, action, starts = false) {
  const at = locate(start);
  if (!starts && !tipOf(at, REF) && !remoteTip(at)) refuse('This project has no local backlog yet. add, fields add or sync starts one.');
  excludeLocal(at.project);
  fs.mkdirSync(at.state, { recursive: true });
  const lock = path.join(at.state, 'backlog.lock');
  for (let attempt = 0; ; attempt++) {
    try { fs.writeFileSync(lock, String(process.pid), { flag: 'wx' }); break; } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (abandoned(lock)) { fs.rmSync(lock, { recursive: true, force: true }); continue; }
      if (attempt > 600) refuse('The backlog stays locked: ' + lock);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  try { return action(open(start, true)); } finally { fs.rmSync(lock, { force: true }); }
}

function find(store, id) {
  const wanted = /^\d+$/.test(String(id)) ? String(id).padStart(4, '0') : String(id);
  return store.issues.find(issue => issue.id === wanted) || refuse('There is no issue ' + id + '.');
}

function readBody(file) {
  try { return fs.readFileSync(path.resolve(file), 'utf8'); }
  catch (error) { return refuse('The file for --body-file is not readable: ' + error.message); }
}

// The status ways hold against the committed state, so an edit in a file cannot go around them.
function wayProblems(store, changed) {
  if (!store.created) return [];
  const edited = store.git(['diff', '--name-only', REF, '--', 'issues']).split('\n').filter(Boolean)
    .map(name => path.basename(name, '.md'));
  const problems = [];
  for (const id of new Set([...edited, ...(changed.issues || []).map(issue => issue.id)])) {
    const issue = store.issues.find(entry => entry.id === id);
    const old = parseIssue(store.git(['show', REF + ':issues/' + id + '.md'], { allowFail: true }) || '');
    const before = old && meansOf(store.fields, old.meta.status);
    const after = issue && issue.meta && meansOf(store.fields, issue.meta.status);
    if (id !== changed.force && before && after && before !== after && !WAYS[before].includes(after)) {
      problems.push(id + ': the backlog norm has no way from ' + before + ' to ' + after + '. From ' + before + ': '
        + (WAYS[before].join(', ') || 'none') + '. set --force only on the user\'s explicit word.');
    }
  }
  return problems;
}

// Checks the whole store as it would be, then writes what the command changed and commits; the first
// commit starts the backlog. A refused command leaves the checkout as it was, also when the commit is
// refused after the files are written. A text edited in a file stays, so that it can be corrected.
function saved(store, message, changed = {}) {
  const problems = storeProblems(store);
  if (!problems.length) problems.push(...wayProblems(store, changed));
  if (problems.length) refuse('Nothing is committed until this is fixed: ' + problems.join(' '));
  const files = (changed.issues || []).map(issue => [issue.file, formatIssue(issue.meta, issue.body)]);
  if (changed.fields || !store.created) {
    files.push([path.join(store.dir, 'fields.json'), JSON.stringify(store.fields, null, 2) + '\n']);
  }
  const fresh = !fs.existsSync(store.dir);
  const before = files.map(([file]) => { try { return fs.readFileSync(file); } catch { return null; } });
  try {
    fs.mkdirSync(path.join(store.dir, 'issues'), { recursive: true });
    for (const [file, text] of files) fs.writeFileSync(file, text);
    commit(store, message);
  } catch (error) {
    if (fresh) {
      for (const name of ['backlog', 'backlog.index']) fs.rmSync(path.join(store.state, name), { recursive: true, force: true });
    } else {
      files.forEach(([file], at) => (before[at] === null ? fs.rmSync(file, { force: true }) : fs.writeFileSync(file, before[at])));
    }
    throw error;
  }
  store.created = true;
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
  const out = { types: {} };
  for (const issue of store.issues) {
    const meta = issue.meta || {};
    const key = meansOf(store.fields, meta.status) || 'no-status';
    if (!isWork(store.fields, meta.type)) {
      if (key !== 'done') out.types[meta.type] = (out.types[meta.type] || 0) + 1;
      continue;
    }
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

// One line for the session start. Reads the checkout as it lies, asks git only where the primary working
// tree is, and creates nothing.
function summary(start) {
  try {
    const project = projectDir(start);
    if (!project) return null;
    const dir = path.join(project, '.qatlas', 'local', 'backlog');
    const fields = JSON.parse(fs.readFileSync(path.join(dir, 'fields.json'), 'utf8'));
    const found = counts({ fields, issues: readIssues(dir) });
    const parts = [...QATLAS_STATUS, 'no-status'].filter(key => key !== 'done' && found[key]).map(key => found[key] + ' ' + key);
    for (const type of Object.keys(found.types)) parts.push(found.types[type] + ' ' + type);
    return parts.length ? parts.join(', ') : 'no open issues';
  } catch { return null; }
}

// For the doctor: reads an existing checkout only and creates nothing.
function check(start) {
  const project = projectDir(start);
  const dir = project && path.join(project, '.qatlas', 'local', 'backlog');
  if (!dir || !fs.existsSync(path.join(dir, 'fields.json'))) return [];
  let fields;
  try { fields = JSON.parse(fs.readFileSync(path.join(dir, 'fields.json'), 'utf8')); }
  catch (error) { return ['fields.json is not readable: ' + error.message]; }
  return storeProblems({ fields, issues: readIssues(dir) });
}

// ---------- commands

function parse(command, argv) {
  const flags = new Set(['--all', '--force', '--first', '--last', '--no-parent', '--resolved', '--no-work']);
  const options = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) { rest.push(arg); continue; }
    // An option the command does not know would otherwise pass as done without any effect.
    if (!OPTIONS[command].includes(arg.slice(2))) {
      refuse(command + ' has no option ' + arg + '. It takes: ' + (OPTIONS[command].map(name => '--' + name).join(', ') || 'none') + '.');
    }
    if (flags.has(arg)) { options[arg.slice(2)] = true; continue; }
    if (i + 1 >= argv.length) refuse(arg + ' needs a value.');
    (options[arg.slice(2)] = options[arg.slice(2)] || []).push(argv[++i]);
  }
  const one = name => (options[name] ? options[name][options[name].length - 1] : undefined);
  const list = name => (options[name] ? options[name].flatMap(value => value.split(',')).map(v => v.trim()).filter(Boolean) : undefined);
  return { options, rest, one, list };
}

const padded = ids => ids.map(id => (/^\d+$/.test(id) ? id.padStart(4, '0') : id));
const known = (what, value, values) => values.includes(value)
  || refuse('Unknown ' + what + ' ' + value + '. Known: ' + (values.join(', ') || 'none') + '.');

function applyOptions(store, issue, args) {
  const { options, one, list } = args;
  const meta = issue.meta;
  if (one('title') !== undefined) meta.title = one('title');
  if (one('type') !== undefined) meta.type = one('type');
  known('type', meta.type, store.fields.type.map(entry => entry.name));
  if (isWork(store.fields, meta.type)) {
    if (one('status') !== undefined) meta.status = resolveStatus(store.fields, one('status'));
    else if (!('status' in meta)) meta.status = resolveStatus(store.fields, 'draft');
    if (typeof meta.rank !== 'number') {
      meta.rank = Math.max(0, ...store.issues.map(entry => (entry.meta && typeof entry.meta.rank === 'number' ? entry.meta.rank : 0))) + 1;
    }
  } else {
    // An issue that is no work only closes: done is the one status it may carry.
    const closing = one('status') === undefined ? meta.status : resolveStatus(store.fields, one('status'));
    if (meansOf(store.fields, closing) === 'done') meta.status = closing;
    else if (one('status') !== undefined) refuse('The type ' + meta.type + ' carries no status but done.');
    else delete meta.status;
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
  if (one('body-file') !== undefined) issue.body = readBody(one('body-file'));
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
        all.status.push({ name: value, means: args.one('means') === undefined ? null : args.one('means') });
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
    }, action === 'add');
  },

  list(start, args) {
    const store = open(start);
    const { options, one } = args;
    let issues = store.issues.filter(issue => issue.meta);
    const typed = one('type');
    const wanted = one('status');
    if (!options.all) {
      issues = issues.filter(issue => (typed ? true : isWork(store.fields, issue.meta.type))
        && (wanted ? true : meansOf(store.fields, issue.meta.status) !== 'done'));
    }
    if (typed) {
      known('type', typed, store.fields.type.map(entry => entry.name));
      issues = issues.filter(issue => issue.meta.type === typed);
    }
    if (wanted) {
      known('status', wanted, [...store.fields.status.map(entry => entry.name), ...QATLAS_STATUS]);
      issues = issues.filter(issue => issue.meta.status === wanted || meansOf(store.fields, issue.meta.status) === wanted);
    }
    if (one('label')) {
      known('label', one('label'), store.fields.labels);
      issues = issues.filter(issue => (issue.meta.labels || []).includes(one('label')));
    }
    if (one('parent')) issues = issues.filter(issue => issue.meta.parent === padded([one('parent')])[0]);
    for (const pair of options.where || []) {
      const cut = pair.indexOf('=');
      if (cut < 1) refuse('--where needs key=value.');
      known('field', pair.slice(0, cut), [...CORE, ...Object.keys(store.fields.custom)]);
      issues = issues.filter(issue => String(issue.meta[pair.slice(0, cut)]) === pair.slice(cut + 1));
    }
    return { issues: ordered(store, issues).map(issue => view(store, issue)), counts: counts(store) };
  },

  show(start, args) {
    if (!args.rest[0]) refuse('show needs an id.');
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
      applyOptions(store, issue, args);
      store.issues.push(issue);
      saved(store, 'Add ' + id + ': ' + meta.title, { issues: [issue] });
      return { id, path: issue.file, ...meta };
    }, true);
  },

  set(start, args) {
    return locked(start, store => {
      const issue = find(store, args.rest[0]);
      if (!issue.meta) refuse(issue.id + ' has no frontmatter. Repair the file first.');
      applyOptions(store, issue, args);
      saved(store, 'Change ' + issue.id + ': ' + issue.meta.title, { issues: [issue], force: args.options.force && issue.id });
      return view(store, issue);
    });
  },

  move(start, args) {
    return locked(start, store => {
      const issue = find(store, args.rest[0]);
      if (!issue.meta || typeof issue.meta.rank !== 'number') refuse('Only an issue that is work has a place in the order.');
      const ranked = store.issues.filter(entry => entry.meta && typeof entry.meta.rank === 'number' && entry.id !== issue.id)
        .sort((a, b) => a.meta.rank - b.meta.rank || a.id.localeCompare(b.id));
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

  save(start) {
    return locked(start, store => {
      saved(store, 'Save edited issues');
      return { saved: true };
    });
  },

  sync(start, args) {
    const at = locate(start);
    // The merge runs without a working tree through git merge-tree --write-tree, which git has from 2.38.
    const version = at.git(['version']);
    const [major, minor] = (/(\d+)\.(\d+)/.exec(version) || []).slice(1).map(Number);
    if (!(major > 2 || (major === 2 && minor >= 38))) refuse('sync needs git 2.38 or newer. This is ' + version + '.');
    const remote = remoteOf(at);
    // Fetching moves only the tracking ref, so the network stays out of the lock until the push.
    let theirs = null;
    if (remote && at.git(['ls-remote', '--heads', remote, BRANCH], { network: true })) {
      at.git(['fetch', '-q', remote, '+' + REF + ':' + tracking(remote)], { network: true });
      theirs = tipOf(at, tracking(remote));
    }
    return locked(start, store => {
      const copies = path.join(store.state, 'backlog-remote');
      let reported = {};
      try { reported = JSON.parse(fs.readFileSync(path.join(copies, 'conflict.json'), 'utf8')); } catch { /* none */ }
      saved(store, store.created ? 'Save edited issues' : 'Start the backlog');
      fs.rmSync(copies, { recursive: true, force: true });
      if (!remote) return { synced: false, reason: 'The repo has no remote.' };
      const mine = tipOf(store, REF);
      const push = () => {
        store.git(['push', '-q', remote, REF + ':' + REF], { network: true });
        store.git(['update-ref', tracking(remote), tipOf(store, REF)]);
        return { synced: true, pushed: true };
      };
      if (!theirs) return push();
      if (mine === theirs) return { synced: true, pushed: false };
      const within = (a, b) => store.git(['merge-base', '--is-ancestor', a, b], { allowFail: true }) !== null;
      if (within(theirs, mine)) return push();
      const refresh = () => store.git(['read-tree', '--reset', '-u', REF]);
      if (within(mine, theirs)) {
        store.git(['update-ref', REF, theirs, mine]);
        refresh();
        return { synced: true, pushed: false, updated: true };
      }
      const [tree, ...rows] = store.git(['merge-tree', '--write-tree', '--no-messages', '--allow-unrelated-histories',
        mine, theirs], { conflict: true }).split('\n');
      // Each conflicted file is listed once per side that holds it: 1 the common base, 2 mine, 3 theirs.
      const sides = {};
      for (const row of rows) {
        const [, side, name] = /^\d+ [0-9a-f]+ ([123])\t(.+)$/.exec(row) || [];
        if (name) sides[name] = (sides[name] || '') + side;
      }
      const files = Object.keys(sides);
      // --resolved settles the conflict that was reported and nothing the user has not seen: the same
      // state of the remote and no further file.
      const settled = args.options.resolved && reported.theirs === theirs
        && files.every(name => (reported.files || []).includes(name));
      if (files.length && !settled) {
        // The remote versions are laid beside the checkout for comparison.
        fs.mkdirSync(copies, { recursive: true });
        fs.writeFileSync(path.join(copies, 'conflict.json'), JSON.stringify({ theirs, files }) + '\n');
        for (const name of files) {
          const text = store.git(['show', theirs + ':' + name], { allowFail: true });
          if (text === null) continue;
          fs.mkdirSync(path.dirname(path.join(copies, name)), { recursive: true });
          fs.writeFileSync(path.join(copies, name), text + '\n');
        }
        const numbers = [...store.issues.map(issue => issue.id), ...store.git(['ls-tree', '--name-only', theirs, 'issues/'])
          .split('\n').map(name => path.basename(name, '.md'))].map(Number).filter(Number.isInteger);
        throw new Outcome(2, { synced: false, conflict: true, files, collisions: files.filter(name => sides[name] === '23'),
          free: String(Math.max(0, ...numbers) + 1).padStart(4, '0'), local: store.dir, remote: copies,
          next: 'Bring each file under local to the state that shall hold, then run sync --resolved. A file under '
            + 'collisions holds two different issues with one number: first add the local one again with --id, from '
            + 'the number under free on.' });
      }
      let merged = tree;
      if (files.length) {
        // The checkout decides the conflicted files; everything else comes from the merge, so that no
        // change of the remote is lost. The index then returns to the checkout for the refresh below.
        store.git(['read-tree', tree]);
        store.git(['update-index', '--add', '--remove', '--', ...files]);
        merged = store.git(['write-tree']);
        store.git(['read-tree', mine]);
      }
      const made = store.git(['commit-tree', merged, '-p', mine, '-p', theirs, '-m', 'Merge the backlog of ' + remote]);
      store.git(['update-ref', REF, made, mine]);
      refresh();
      return { ...push(), merged: true };
    }, true);
  },
};

function main() {
  const argv = process.argv.slice(2);
  const targetAt = argv.indexOf('--target');
  const start = targetAt >= 0 ? path.resolve(argv.splice(targetAt, 2)[1]) : process.cwd();
  const command = argv.shift();
  if (!commands[command]) {
    process.stderr.write('usage: qatlas-backlog.js ' + Object.keys(commands).join('|') + ' [--target <dir>]\n');
    process.exit(1);
  }
  try {
    process.stdout.write(JSON.stringify(commands[command](start, parse(command, argv)), null, 2) + '\n');
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

module.exports = { check, summary, configProblems };
