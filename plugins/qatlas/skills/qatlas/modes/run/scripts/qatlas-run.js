#!/usr/bin/env node
'use strict';

// File mailbox of a Qatlas run whose supervisor, leads and integrator run as subagents of one host session.
// They talk only through the JSON-lines log <repo>/.qatlas/local/run/events.jsonl; `seq` is the line index,
// derived on read. A sender is a lead (--package) or the integrator (--role integrator) and has at most one
// open signal (question or handover) until it picks up the answer by repeating the same call.
// wait wakes the supervisor on question, done and disk, the integrator on open handovers and end.
// Usage:
//   qatlas-run.js begin --repo <root> [--discard]
//     Resumes an unfinished run; --discard archives it and starts anew.
//   qatlas-run.js plan --repo <root> --budget <n> --package <package> --tasks <id,id,...>
//   qatlas-run.js ask --repo <root> (--package <package> | --role integrator) --question <text> [--timeout <s>]
//   qatlas-run.js handover --repo <root> [--code-repo <path>] --package <package> --task <id> --report <file|text> [--timeout <s>]
//   qatlas-run.js answer --repo <root> (--package <package> | --role integrator) --answer <text>
//   qatlas-run.js wait --repo <root> [--role supervisor|integrator] [--since <seq>] [--timeout <s>] [--min-free <GB>]
//   qatlas-run.js done --repo <root> (--package <package> [--rest <id,id,...>] | --role integrator) [--text <text>]
//   qatlas-run.js log --repo <root> --type <type> [--package <package>] [--task <id>] [--text <text>]
//   qatlas-run.js report --repo <root> [--notes <type>]
//   qatlas-run.js end --repo <root>
//   qatlas-run.js cut --repo <root> [--code-repo <path>] --branch <branch> --base <ref>

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseFrontmatter } = require('./handover-frontmatter.js');

const INTEGRATOR = 'integrator';
const SIGNAL = new Set(['question', 'handover', 'answer', 'picked']);
const SUPERVISOR_WAKES = new Set(['question', 'done', 'disk']);
// Rework for a conflict or a cut is no correction attempt and stays out of the per-task rework count.
const CORRECTION = /^rework (?!(?:conflict|cut):)/;
const RESERVED = new Set([...SIGNAL, 'begin', 'resume', 'plan', 'done', 'disk', 'end']);
const TASK_ID = /^[A-Za-z0-9#_][A-Za-z0-9#_-]*$/;

const opts = process.argv.slice(3);
const command = process.argv[2];
const flag = name => { const i = opts.indexOf(name); return i >= 0 ? opts[i + 1] : null; };
const out = value => process.stdout.write(JSON.stringify(value) + '\n');
const fail = (message, code = 1) => { process.stderr.write(message + '\n'); process.exit(code); };
const need = (...names) => names.map(name => flag(name) || fail('Missing: ' + name, 2));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const positive = (name, fallback) => {
  if (flag(name) === null) return fallback;
  const value = Number(flag(name));
  return value > 0 && Number.isFinite(value) ? value : fail(name + ' must be positive', 2);
};
const repoKey = () => fs.realpathSync(path.resolve(need('--repo')[0]));
const runDir = repo => path.join(repo, '.qatlas', 'local', 'run');
const eventsFile = repo => path.join(runDir(repo), 'events.jsonl');

// O_APPEND keeps single-line appends atomic with several writers.
function record(repo, type, fields = {}) {
  fs.mkdirSync(runDir(repo), { recursive: true });
  const entry = { at: new Date().toISOString(), type };
  for (const key of ['sender', 'package', 'task', 'budget', 'tasks', 'rest', 'text', 'report']) if (fields[key]) entry[key] = fields[key];
  fs.appendFileSync(eventsFile(repo), JSON.stringify(entry) + '\n');
}

function events(repo) {
  let raw;
  try { raw = fs.readFileSync(eventsFile(repo), 'utf8'); } catch { return []; }
  return raw.split('\n').filter(Boolean).map((line, seq) => {
    try { return { ...JSON.parse(line), seq }; } catch { return { seq, type: 'unreadable' }; }
  });
}

// Last signal per sender: its latest question or handover, with the answer once one arrived and whether it
// was picked up. A signal stays open until it is picked.
function lastSignals(all) {
  const last = new Map();
  for (const e of all) {
    if (!e.sender || !SIGNAL.has(e.type)) continue;
    if (e.type === 'question' || e.type === 'handover') last.set(e.sender, { ...e, answer: null, picked: false });
    else if (e.type === 'answer' && last.has(e.sender)) last.get(e.sender).answer = e.text;
    else if (e.type === 'picked' && last.has(e.sender)) last.get(e.sender).picked = true;
  }
  return last;
}

const openSignals = all => new Map([...lastSignals(all)].filter(([, signal]) => !signal.picked));

function sender() {
  const role = flag('--role');
  if (role !== null) {
    if (role !== INTEGRATOR || flag('--package') !== null) fail('Address a sender with --package <package> or --role integrator, not both', 2);
    return INTEGRATOR;
  }
  const [name] = need('--package');
  return name === INTEGRATOR ? fail('Reserved package name: integrator', 2) : name;
}

function idList(name) {
  const ids = need(name)[0].split(',').map(s => s.trim());
  if (ids.some(id => !TASK_ID.test(id))) fail(name + ' takes comma-separated ids of [A-Za-z0-9#_-]', 2);
  return [...new Set(ids)];
}

const ended = all => all.some(e => e.type === 'end');

function begin() {
  const repo = repoKey();
  const all = events(repo);
  if (all.length) {
    if (!ended(all) && !opts.includes('--discard')) {
      record(repo, 'resume');
      return out({ resumed: true, cursor: all.length + 1 });
    }
    fs.renameSync(eventsFile(repo), path.join(runDir(repo), `events-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`));
  }
  fs.rmSync(path.join(runDir(repo), 'disk-low'), { force: true });
  record(repo, 'begin');
  out({ begun: true, cursor: 1 });
}

function plan() {
  const repo = repoKey();
  const budget = Number(need('--budget')[0]);
  const [name] = need('--package');
  if (!Number.isInteger(budget) || budget < 1) fail('--budget must be a positive integer', 2);
  if (name === INTEGRATOR) fail('Reserved package name: integrator', 2);
  const tasks = idList('--tasks');
  const all = events(repo);
  if (!all.some(e => e.type === 'begin') || ended(all)) fail('No running run: start one with begin', 2);
  if (all.some(e => e.type === 'plan' && e.package === name)) fail('Package already planned: ' + name, 2);
  record(repo, 'plan', { package: name, budget, tasks });
  out({ planned: name, budget, tasks });
}

function reportText() {
  const [value] = need('--report');
  try {
    if (fs.statSync(value, { throwIfNoEntry: false })?.isFile()) return fs.readFileSync(value, 'utf8').trim();
  } catch { /* not a readable path: treat as text */ }
  return value;
}

const readFile = file => { try { return fs.readFileSync(file, 'utf8'); } catch { return null; } };

// Never overwrites an existing report.
function storeReport(repo, name, task, text) {
  const dir = path.join(runDir(repo), 'reports');
  const base = [name, task].map(v => String(v).replace(/[^A-Za-z0-9._-]/g, '_')).join('-');
  fs.mkdirSync(dir, { recursive: true });
  for (let n = 1; ; n++) {
    const file = path.join(dir, n === 1 ? `${base}.md` : `${base}-${n}.md`);
    try { fs.writeFileSync(file, text + '\n', { flag: 'wx' }); return file; } catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
}

// Answer "integrated ..." this sender already got for the same report of the task, else null.
function integratedBefore(all, who, task, text) {
  let report = null;
  let found = null;
  for (const e of all) {
    if (e.sender !== who || e.task !== task) continue;
    if (e.type === 'handover') report = e.report;
    else if (e.type === 'answer' && /^integrated\b/.test(e.text || '') && readFile(report) === text + '\n') found = e.text;
  }
  return found;
}

// A repeated call with the same signal only waits, so an answer survives removal of branch and worktree. A
// handover report changed before any answer replaces the open one and is validated again. An integrated
// report never opens a second handover, and calls waiting in parallel all get the one answer.
async function raise(kind, text, task) {
  const repo = repoKey();
  const who = sender();
  if (kind === 'handover' && who === INTEGRATOR) fail('Only a lead hands over; the integrator integrates.', 2);
  const timeout = positive('--timeout', 100);
  const all = events(repo);
  const open = openSignals(all).get(who);
  const same = open && open.type === kind && (kind === 'handover' ? open.task === task : open.text === text);
  if (open && !same) fail(`${who} has an open ${open.type}${open.task ? ' of task ' + open.task : ''}; repeat that call to collect its answer.`, 2);
  if (!open && kind === 'handover') {
    const integrated = integratedBefore(all, who, task, text);
    if (integrated) return out({ answer: integrated });
  }
  if (!open || (kind === 'handover' && open.answer === null && readFile(open.report) !== text + '\n')) {
    if (kind === 'handover') validateHandover(text, codeRepo(repo));
    record(repo, kind, { sender: who, task, ...(kind === 'handover' ? { report: storeReport(repo, who, task, text) } : { text }) });
  }
  const end = Date.now() + timeout * 1000;
  for (;;) {
    const current = lastSignals(events(repo)).get(who);
    if (current && current.answer !== null) {
      if (!current.picked) record(repo, 'picked', { sender: who, task: current.task });
      return out({ answer: current.answer });
    }
    if (Date.now() >= end) return out({ answer: null, hint: `No answer yet. Repeat the same ${kind}.` });
    await sleep(1000);
  }
}

function answer() {
  const repo = repoKey();
  const who = sender();
  const [text] = need('--answer');
  const open = openSignals(events(repo)).get(who);
  if (!open) fail(`No open question or handover of ${who}`, 2);
  if (open.answer !== null) fail(`The ${open.type} of ${who} is already answered and not yet picked up.`, 2);
  if (open.type === 'handover' && !/^(integrated \S+|rework \S[\s\S]*)$/.test(text)) fail('A handover accepts only "integrated <sha>" or "rework <reason>".', 2);
  record(repo, 'answer', { sender: who, task: open.task, text });
  out({ sender: who, answered: true });
}

// The marker re-arms the event once space recovers; begin clears it.
function checkDisk(repo, minFree) {
  const { bavail, bsize } = fs.statfsSync(repo);
  const free = bavail * bsize / 1e9;
  const marker = path.join(runDir(repo), 'disk-low');
  if (free >= minFree) return fs.rmSync(marker, { force: true });
  try {
    fs.mkdirSync(runDir(repo), { recursive: true });
    fs.writeFileSync(marker, '', { flag: 'wx' });
  } catch { return; }
  record(repo, 'disk', { text: `Free space ${free.toFixed(1)} GB, below ${minFree} GB.` });
}

async function wait() {
  const repo = repoKey();
  const role = flag('--role') ?? 'supervisor';
  if (role !== 'supervisor' && role !== INTEGRATOR) fail('--role must be supervisor or integrator', 2);
  const since = Number(flag('--since') ?? 0);
  if (!Number.isInteger(since) || since < 0) fail('--since must be an integer from 0', 2);
  const end = Date.now() + positive('--timeout', 600) * 1000;
  const minFree = positive('--min-free', 5);
  for (;;) {
    if (role === 'supervisor') checkDisk(repo, minFree);
    const all = events(repo);
    // A new run starts a new log, so an old cursor would match nothing and wait would hang silently.
    if (since > all.length) fail(`--since ${since} is past the end of the log (${all.length} events); a new run started, pass --since 0`, 2);
    const open = role === INTEGRATOR ? openSignals(all) : null;
    const wakes = e => (open
      ? e.type === 'end' || (e.type === 'handover' && open.get(e.sender)?.seq === e.seq && open.get(e.sender).answer === null)
      : SUPERVISOR_WAKES.has(e.type));
    const hits = all.filter(e => e.seq >= since && wakes(e));
    if (hits.length || Date.now() >= end) return out({ events: hits, cursor: all.length, timeout: !hits.length });
    await sleep(2000);
  }
}

function done() {
  const repo = repoKey();
  const who = sender();
  const rest = opts.includes('--rest') ? idList('--rest') : null;
  if (rest && who === INTEGRATOR) fail('--rest applies only to a lead', 2);
  record(repo, 'done', { sender: who, rest, text: flag('--text') });
  out({ done: who, ...(rest ? { rest } : {}) });
}

function logEvent() {
  const repo = repoKey();
  const [type] = need('--type');
  if (!/^[a-z][a-z0-9-]*$/.test(type)) fail('--type must match [a-z][a-z0-9-]*', 2);
  if (RESERVED.has(type)) fail('Reserved event type: ' + type, 2);
  record(repo, type, { package: flag('--package'), task: flag('--task'), text: flag('--text') });
  out({ logged: type, cursor: events(repo).length });
}

function end() {
  const repo = repoKey();
  if (!ended(events(repo))) record(repo, 'end');
  out({ ended: true });
}

// Times in seconds. Cycle time per task: from the plan of its package or the last integration in it to the
// first handover. Wait time: last handover to the answer integrated.
function report() {
  const all = events(repoKey());
  const time = e => Date.parse(e.at);
  const secs = ms => Math.round(ms) / 1000;
  const packages = {};
  const tasks = {};
  const integrator = { questions: 0, finished: 0 };
  const counts = { rerun: 0, conflict: 0 };
  const notes = {};
  const since = {};
  let budget = null;
  for (const e of all) {
    if (Object.hasOwn(counts, e.type)) counts[e.type]++;
    else if (!RESERVED.has(e.type) && e.type !== 'unreadable') {
      (notes[e.type] ||= []).push(Object.fromEntries(['package', 'task', 'text'].filter(k => e[k]).map(k => [k, e[k]])));
    }
    if (e.type === 'plan') {
      budget = e.budget;
      packages[e.package] = { tasks: e.tasks, questions: 0, finished: 0 };
      since[e.package] = time(e);
    }
    const lead = e.sender && e.sender !== INTEGRATOR ? (packages[e.sender] ||= { tasks: [], questions: 0, finished: 0 }) : null;
    const own = lead || (e.sender === INTEGRATOR ? integrator : null);
    if (e.type === 'question' && own) own.questions++;
    if (e.type === 'done' && own) { own.finished++; if (lead) lead.rest = e.rest || []; }
    if (!e.task || !SIGNAL.has(e.type)) continue;
    const t = tasks[e.task] ||= { package: e.sender, integrated: false, cycle: null, wait: null, rework: 0, handovers: 0 };
    if (e.type === 'handover') {
      if (!t.handovers++ && since[e.sender] !== undefined) t.cycle = secs(time(e) - since[e.sender]);
      t.lastHandover = time(e);
    } else if (e.type === 'answer' && /^integrated\b/.test(e.text || '')) {
      if (t.lastHandover !== undefined) t.wait = secs(time(e) - t.lastHandover);
      t.integrated = true;
      since[e.sender] = time(e);
    } else if (e.type === 'answer' && CORRECTION.test(e.text || '')) t.rework++;
  }
  for (const t of Object.values(tasks)) delete t.lastHandover;
  const open = [...openSignals(all).values()].map(o => ({ sender: o.sender, type: o.type, ...(o.task ? { task: o.task } : {}),
    ...(o.type === 'handover' ? { report: o.report } : { question: o.text }), answered: o.answer !== null }));
  if (opts.includes('--notes')) {
    const [type] = need('--notes');
    return out({ notes: { [type]: notes[type] || [] } });
  }
  out({ ended: ended(all), cursor: all.length, duration: all.length ? secs(time(all[all.length - 1]) - time(all[0])) : null,
    budget, packages, open, tasks, integrator, log: counts, notes });
}

function codeRepo(repo) {
  const value = flag('--code-repo');
  if (value === null) return repo;
  if (!path.isAbsolute(value) || !fs.existsSync(value)) fail(`--code-repo must be an existing absolute path: ${value}`, 2);
  return fs.realpathSync(value);
}

// Refs come from an untrusted report: they reach git only as arguments, never via a shell, and may not start
// with "-". Returns the full commit SHA; an optional ref that does not resolve yields null.
function resolveCommit(repo, ref, key, bad, optional = false) {
  if (ref.startsWith('-')) bad(`"${key}" must not start with "-".`);
  try {
    return execFileSync('git', ['-C', repo, 'rev-parse', '--verify', '--quiet', `${ref}^{commit}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return optional ? null : bad(`"${key}" ${JSON.stringify(ref)} does not resolve to a commit in ${repo}.`); }
}

// A pull request is one unit of the commit boundary: exactly one non-merge commit over the base.
function checkCut(repo, base, tip, label, exception, bad) {
  const count = Number(execFileSync('git', ['-C', repo, 'rev-list', '--no-merges', '--count', `${base}..${tip}`], { encoding: 'utf8' }).trim());
  const limit = 'A pull request is one unit of the commit boundary: exactly one non-merge commit';
  if (count === 0) bad(`${label} has 0 non-merge commits over ${base}. ${limit}.`);
  if (count > 1 && exception === undefined) {
    bad(`${label} has ${count} non-merge commits over ${base}. ${limit}; independent milestones become separate pull requests. For a justified exception, set "cut-exception: <reason>".`);
  }
}

// The cut check alone, before the first push; writes no run files.
function cut(repo) {
  const bad = message => fail('Handover rejected: ' + message, 2);
  const [branch, base] = need('--branch', '--base');
  resolveCommit(repo, branch, 'branch', bad);
  resolveCommit(repo, base, 'base', bad);
  checkCut(repo, base, branch, `branch ${branch}`, undefined, bad);
  out({ result: 'ok', branch, base });
}

// Frontmatter is required. Checks mode (no pull request field) needs branch and checks. PR mode needs pr-title,
// pr-body, branch, base, last and checks; with "pr" the report hands over an open pull request: "pushed" (state
// at the first push) carries the cut check, "head" is the handed-over tip and may lie behind later CI-fix
// commits. Every checks tree must be the handed-over tree.
function validateHandover(text, repo) {
  const bad = message => fail('Handover rejected: ' + message, 2);
  let parsed;
  try { parsed = parseFrontmatter(text); } catch (error) {
    if (error.kind === 'load') return fail('Check not possible: YAML parser not loadable (' + error.message + ').', 3);
    return bad(error.kind === 'yaml' ? 'frontmatter is not valid YAML (' + error.message + ').' : error.message);
  }
  if (!parsed) return bad('the report must begin with YAML frontmatter ("---" in the first line).');
  const { data } = parsed;
  const str = key => (typeof data[key] === 'string' && data[key].trim() ? data[key].trim() : bad(`"${key}" must be a non-empty string.`));
  const prMode = ['pr-title', 'pr-body', 'last', 'base', 'pr', 'head', 'pushed', 'cut-exception'].some(key => data[key] !== undefined);
  const checkTrees = (ref, label) => {
    if (data.checks === undefined) return;
    if (!Array.isArray(data.checks) || !data.checks.length) bad('"checks" must be a non-empty list.');
    data.checks.forEach((entry, i) => {
      const name = `checks[${i}]`;
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) bad(`${name} must be a mapping.`);
      if (typeof entry.command !== 'string' || !entry.command.trim()) bad(`${name}: "command" must be a non-empty string.`);
      if (!Number.isInteger(entry.exit)) bad(`${name}: "exit" must be an integer.`);
      if (typeof entry.tree !== 'string' || !/^([0-9a-f]{40}|[0-9a-f]{64})$/.test(entry.tree)) bad(`${name}: "tree" must be 40 or 64 hex characters.`);
    });
    let actual;
    try {
      actual = execFileSync('git', ['-C', repo, 'rev-parse', '--verify', '--quiet', `${ref}^{tree}`],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch { return bad(`cannot resolve the tree of ${label}.`); }
    data.checks.forEach((entry, i) => {
      if (entry.tree !== actual) bad(`checks[${i}] (${JSON.stringify(entry.command)}) has tree ${entry.tree}, but ${label} has tree ${actual}.`);
    });
  };
  if (!prMode) {
    const branch = str('branch');
    resolveCommit(repo, branch, 'branch', bad);
    if (data.checks === undefined) bad('"checks" is required without pull request fields.');
    return checkTrees(branch, `branch ${branch}`);
  }
  const title = str('pr-title');
  if (/[\r\n]/.test(title)) bad('"pr-title" must be a single line.');
  str('pr-body');
  if (typeof data.last !== 'boolean') bad('"last" must be true or false.');
  const exception = data['cut-exception'];
  if (exception !== undefined && (typeof exception !== 'string' || !exception.trim())) bad('"cut-exception" must be a non-empty string.');
  const base = str('base');
  resolveCommit(repo, base, 'base', bad);
  const branch = str('branch');
  if (data.pr === undefined) {
    resolveCommit(repo, branch, 'branch', bad);
    checkCut(repo, base, branch, `branch ${branch}`, exception, bad);
    return checkTrees(branch, `branch ${branch}`);
  }
  if (!Number.isInteger(data.pr) || data.pr <= 0) bad('"pr" must be a positive integer.');
  const head = resolveCommit(repo, str('head'), 'head', bad);
  const pushed = resolveCommit(repo, str('pushed'), 'pushed', bad);
  const local = resolveCommit(repo, branch, 'branch', bad, true);
  if (local && local !== head) bad(`branch ${branch} (${local}) is not the handed-over head ${head}.`);
  try {
    execFileSync('git', ['-C', repo, 'merge-base', '--is-ancestor', pushed, head], { stdio: 'ignore' });
  } catch { bad(`"pushed" ${pushed} is not an ancestor of "head" ${head}.`); }
  checkCut(repo, base, pushed, `branch ${branch} at first push (${pushed.slice(0, 12)})`, exception, bad);
  checkTrees(head, `head ${head}`);
}

const commands = {
  begin, plan, answer, done, log: logEvent, report, end, wait,
  ask: () => raise('question', need('--question')[0]),
  handover: () => raise('handover', reportText(), need('--task')[0]),
  cut: () => cut(codeRepo(repoKey())),
};

if (!commands[command]) fail('Commands: ' + Object.keys(commands).join(', '), 2);
Promise.resolve().then(commands[command]).catch(error => fail((error.stderr ? String(error.stderr).trim() : '') || error.message));
