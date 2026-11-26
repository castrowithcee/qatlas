#!/usr/bin/env node
'use strict';

// Collects, per watched project, the state of its Qatlas run and its tasks on review or waiting, and prints
// only what is new since the last tick. A hint is new while its key was absent in the previous tick, so it is
// reported once and again only after it disappeared in between.
// Text from a planning system reaches the script on stdin only, never as an argument: a shell would expand it.
// Usage:
//   qatlas-sentinel.js tick --workspace <dir> --qatlas-root <dir> [--stall <minutes>]
//     Reads <workspace>/qatlas-sentinel.json: {"format": 1, "projects": ["<path>", ...]}.
//     Output: {"signals":[{"project","repo","kind","text"}],"external":[{"project","repo","backlog"}]}
//   qatlas-sentinel.js seen --workspace <dir> --qatlas-root <dir> --project <dir> [--unreachable]
//     Issues of an external planning system as a JSON array of {"id","title","status"[,"url"]} on stdin,
//     only those on review or waiting; with --unreachable the reason as plain text instead.
//     Output: {"signals":[...]}
//   qatlas-sentinel.js notify --workspace <dir>
//     The message as plain text on stdin. Runs ~/.qatlas/plugins/hooks/sentinel.js once with {"event":"sentinel","workspace","text"} on stdin.
//     Output: {"hook":"none"|"ok"|"failed"[,"detail"]}; a failing or slow module never fails the call.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const LIST = 'qatlas-sentinel.json';
const STATUSES = ['review', 'waiting'];

const [command, ...argv] = process.argv.slice(2);
const flag = name => { const at = argv.indexOf(name); return at >= 0 && at + 1 < argv.length ? argv[at + 1] : null; };
const out = value => process.stdout.write(JSON.stringify(value) + '\n');
const fail = message => { process.stderr.write(message + '\n'); process.exit(2); };
const stdin = () => fs.readFileSync(0, 'utf8');
const need = name => flag(name) ?? fail(`${command} needs ${name}`);
const expand = p => path.resolve(p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : p);
const brief = error => String((error.stderr && error.stderr.toString().trim()) || error.message).split('\n').pop().slice(0, 200);

const workspace = () => {
  const dir = expand(need('--workspace'));
  if (!fs.existsSync(dir)) fail(`workspace not found: ${dir}`);
  return dir;
};
const root = () => expand(need('--qatlas-root'));
const store = () => require(path.join(root(), 'scripts', 'runtime', 'project-store.js'));

function stateFile(ws) {
  const dir = store().ensureState(ws);
  if (!dir) fail(`no project state for ${ws}`);
  fs.mkdirSync(path.join(dir, 'sentinel'), { recursive: true });
  return path.join(dir, 'sentinel', 'state.json');
}
const load = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { format: 1, projects: {} }; } };
const save = (file, state) => { fs.writeFileSync(file + '.tmp', JSON.stringify(state, null, 2) + '\n'); fs.renameSync(file + '.tmp', file); };

// Replaces one group of hints of a project and returns the hints that were absent before.
function update(entry, group, now) {
  const before = entry[group] || {};
  entry[group] = now;
  return Object.entries(now).filter(([key]) => !(key in before)).map(([key, value]) => ({ key, ...value }));
}
const signal = (repo, hints) => hints.map(h => ({ project: path.basename(repo), repo, kind: h.kind, text: h.text }));

function runHints(repo, entry, stallMinutes) {
  const script = path.join(root(), 'skills', 'qatlas', 'modes', 'run', 'scripts', 'qatlas-run.js');
  let report;
  try {
    report = JSON.parse(execFileSync(process.execPath, [script, 'report', '--repo', repo], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  } catch (error) {
    return { problem: { kind: 'problem', text: `Laufstand nicht lesbar: ${brief(error)}` } };
  }
  const hints = {};
  const now = Date.now();
  if (report.cursor !== entry.cursor) { entry.cursor = report.cursor; entry.cursorAt = now; }
  const decisions = (report.notes && report.notes.entscheiden || []).length;
  if (report.cursor > 0 && report.ended && decisions > 0) {
    hints['run-decisions'] = { kind: 'run-decisions', text: `Lauf beendet, ${decisions} Entscheidung${decisions === 1 ? '' : 'en'} offen` };
  }
  const idle = Math.floor((now - (entry.cursorAt || now)) / 60000);
  if (report.cursor > 0 && !report.ended && idle >= stallMinutes) {
    hints['run-stalled'] = { kind: 'run-stalled', text: `Lauf ohne neues Ereignis seit mindestens ${stallMinutes} Minuten` };
  }
  return hints;
}

const issueHint = issue => ({ kind: issue.status, text: `Issue auf ${issue.status}: ${issue.title} (${issue.url || issue.id})` });
const issueKey = issue => `issue:${issue.id}:${issue.status}`;

function localIssues(repo) {
  const script = path.join(root(), 'scripts', 'qatlas-backlog.js');
  const hints = {};
  for (const status of STATUSES) {
    const result = JSON.parse(execFileSync(process.execPath, [script, 'list', '--status', status, '--target', repo], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
    for (const issue of result.issues) hints[issueKey({ ...issue, status })] = issueHint({ ...issue, status });
  }
  return hints;
}

function tick() {
  const ws = workspace();
  const stall = Number(flag('--stall') ?? 90);
  if (!(stall > 0)) fail('--stall must be a positive number of minutes');
  let list;
  try { list = JSON.parse(fs.readFileSync(path.join(ws, LIST), 'utf8')); } catch (error) { fail(`${LIST} not readable: ${error.message}`); }
  if (list.format !== 1 || !Array.isArray(list.projects)) fail(`${LIST} needs {"format": 1, "projects": [...]}`);
  const file = stateFile(ws);
  const state = load(file);
  const signals = [];
  const external = [];
  for (const repo of [...new Set(list.projects.map(expand))]) {
    const entry = state.projects[repo] ||= {};
    if (!fs.existsSync(repo)) {
      signals.push(...signal(repo, update(entry, 'run', { missing: { kind: 'problem', text: 'Projektordner nicht gefunden' } })));
      continue;
    }
    const run = runHints(repo, entry, stall);
    signals.push(...signal(repo, update(entry, 'run', run.problem ? { problem: run.problem } : run)));
    const backlog = path.join(repo, '.qatlas-brain', 'backlog', 'BACKLOG.md');
    let binding = null;
    try { binding = fs.readFileSync(backlog, 'utf8'); } catch { /* no planning system bound */ }
    if (binding === null) continue;
    if (!binding.includes('qatlas-backlog.js')) { external.push({ project: path.basename(repo), repo, backlog }); continue; }
    let hints;
    try { hints = localIssues(repo); } catch (error) {
      hints = { ...entry.backlog, unreachable: { kind: 'problem', text: `Lokaler Backlog nicht lesbar: ${brief(error)}` } };
    }
    signals.push(...signal(repo, update(entry, 'backlog', hints)));
  }
  for (const repo of Object.keys(state.projects)) if (!list.projects.map(expand).includes(repo)) delete state.projects[repo];
  save(file, state);
  out({ signals, external });
}

function seen() {
  const ws = workspace();
  const repo = expand(need('--project'));
  const file = stateFile(ws);
  const state = load(file);
  const entry = state.projects[repo] ||= {};
  let hints;
  if (argv.includes('--unreachable')) {
    const reason = stdin().trim().slice(0, 200);
    // Keep the issues seen so far, so they are not reported again once the system is back.
    hints = { ...entry.backlog, unreachable: { kind: 'problem', text: 'Planungssystem nicht erreichbar' + (reason ? `: ${reason}` : '') } };
  } else {
    let issues;
    try { issues = JSON.parse(stdin()); } catch (error) { fail(`stdin needs a JSON array of issues: ${error.message}`); }
    if (!Array.isArray(issues)) fail('stdin needs a JSON array of issues');
    hints = {};
    for (const issue of issues) {
      if (!issue || issue.id === undefined || !STATUSES.includes(issue.status)) continue;
      hints[issueKey(issue)] = issueHint({ ...issue, title: String(issue.title || '').slice(0, 200) });
    }
  }
  const signals = signal(repo, update(entry, 'backlog', hints));
  save(file, state);
  out({ signals });
}

// The user's module is foreign code: it gets data on stdin only, and nothing it does fails the tick.
function notify() {
  const ws = workspace();
  const text = stdin().trim();
  if (!text) fail('notify needs the message on stdin');
  const hook = path.join(os.homedir(), '.qatlas', 'plugins', 'hooks', 'sentinel.js');
  if (!fs.existsSync(hook)) return out({ hook: 'none' });
  const res = spawnSync(process.execPath, [hook], { input: JSON.stringify({ event: 'sentinel', workspace: ws, text }) + '\n', encoding: 'utf8', timeout: 60000 });
  if (!res.error && res.status === 0) return out({ hook: 'ok' });
  const detail = res.error ? res.error.message : (res.stderr || '').trim().split('\n').pop() || 'exit ' + res.status;
  out({ hook: 'failed', detail: detail.slice(0, 300) });
}

const commands = { tick, seen, notify };
if (!commands[command]) fail('usage: qatlas-sentinel.js tick|seen|notify --workspace <dir> --qatlas-root <dir>');
commands[command]();
