#!/usr/bin/env node
'use strict';

// Controls the orchestrator windows of a Qatlas sentinel in tmux. Windows belong to exactly one repo and
// are marked via its root; the script touches only windows so marked. Each window holds at most four
// panes; further packages open another window in the same session. If the sentinel runs in tmux,
// add creates its own session `sentinel--<repo>` on the user server (mouse off there, no
// server-wide options); otherwise the fallback server `-L qatlas-sentinel` is used. A pane
// is addressed via repo and package because hosts like Codex do not reliably run commands with the pane
// environment.
// Events are JSON lines in <repo>/.qatlas/local/sentinel/events.jsonl and the single source of truth for
// answers. `seq` is the 0-based line index, derived on read, not stored. Waking types: question,
// handover, done, exited; start, answer, picked and all types written via log do not wake.
// `wait --since <seq>` returns all waking events from seq on and the new `cursor` (count of all
// events); pass it as --since on the next call and nothing is lost. Handover reports are stored as
// files under reports/ and events carry only their path. If add finds no marked window, an existing
// log is renamed to events-<timestamp>.jsonl.
// Usage:
//   qatlas-sentinel-tmux.js add --repo <root> --package <package> --label <window-name> --title <title> --cwd <dir> -- <command> [args...]
//   qatlas-sentinel-tmux.js list --repo <root>
//   qatlas-sentinel-tmux.js wait --repo <root> [--since <seq>] [--timeout <seconds>]
//   qatlas-sentinel-tmux.js title --repo <root> --package <package> --title <title>
//   qatlas-sentinel-tmux.js ask --repo <root> --package <package> --question <question> [--timeout <seconds>]
//   qatlas-sentinel-tmux.js handover --repo <root> --package <package> --task <id> --report <text|file> [--timeout <seconds>]
//   qatlas-sentinel-tmux.js answer --repo <root> --package <package> --answer <answer>   (handover: "integrated <sha>" or "rework <reason>")
//   qatlas-sentinel-tmux.js log --repo <root> --type <type> [--package <package>] [--task <id>] [--text <text>]
//   qatlas-sentinel-tmux.js report --repo <root>
//   qatlas-sentinel-tmux.js capture --repo <root> --package <package>   (scrollback to <root>/.qatlas/local/sentinel/<package>.log)
//   qatlas-sentinel-tmux.js close --repo <root> --package <package>

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const MAX_PANES = 4;
const NARROW = 80;
const MARK = '@qatlas-sentinel';
const SOCKET = 'qatlas-sentinel';
const WAKING = new Set(['question', 'handover', 'done', 'exited']);
const SIGNAL = new Set(['question', 'handover', 'answer', 'picked']);
const RESERVED = new Set([...WAKING, 'start', 'answer', 'picked', 'captured', 'closed']);
const INTEGRATION = new Set(['push', 'pr', 'merge', 'rerun', 'conflict', 'close']);
const PREFIX = { question: 'FRAGE · ', handover: 'ÜBERGABE · ' };

const argv = process.argv.slice(2);
const command = argv[0];
const sep = argv.indexOf('--');
const opts = sep >= 0 ? argv.slice(1, sep) : argv.slice(1);
const rest = sep >= 0 ? argv.slice(sep + 1) : [];
const flag = name => { const i = opts.indexOf(name); return i >= 0 ? opts[i + 1] : null; };

const inTmux = Boolean(process.env.TMUX);
const tmux = args => execFileSync('tmux', inTmux ? args : ['-L', SOCKET, ...args],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const out = value => process.stdout.write(JSON.stringify(value) + '\n');
const fail = (message, code = 1) => { process.stderr.write(message + '\n'); process.exit(code); };
const need = (...names) => names.map(name => flag(name) || fail('Fehlt: ' + name, 2));
const repoKey = () => fs.realpathSync(path.resolve(need('--repo')[0]));

const eventsDir = repo => path.join(repo, '.qatlas', 'local', 'sentinel');
const eventsFile = repo => path.join(eventsDir(repo), 'events.jsonl');

// O_APPEND keeps single-line appends atomic even with several writers.
function record(repo, type, fields = {}) {
  fs.mkdirSync(eventsDir(repo), { recursive: true });
  const entry = { at: new Date().toISOString(), type };
  for (const key of ['package', 'task', 'pane', 'text', 'report']) if (fields[key]) entry[key] = fields[key];
  fs.appendFileSync(eventsFile(repo), JSON.stringify(entry) + '\n');
}

function events(repo) {
  let raw;
  try { raw = fs.readFileSync(eventsFile(repo), 'utf8'); } catch { return []; }
  return raw.split('\n').filter(Boolean).map((line, seq) => {
    try { return Object.assign({ seq }, JSON.parse(line), { seq }); } catch { return { seq, type: 'unlesbar' }; }
  });
}

// Answer of the open signal of a pane: an answer event after its last signal and before picked.
function pendingAnswer(repo, pane) {
  const last = events(repo).filter(e => e.pane === pane && SIGNAL.has(e.type)).pop();
  return last && last.type === 'answer' ? last.text : null;
}

function markedWindows(repo) {
  let lines;
  try { lines = tmux(['list-windows', '-a', '-F', `#{window_id}\t#{${MARK}}`]).split('\n'); } catch { return []; }
  return lines.map(line => line.split('\t')).filter(([, mark]) => mark === repo).map(([win]) => win);
}

const allPanes = repo => markedWindows(repo).flatMap(win => panes(win));

function panes(win) {
  return tmux(['list-panes', '-t', win, '-F', '#{pane_id}\t#{pane_title}\t#{pane_dead}'])
    .split('\n').filter(Boolean).map(line => {
      const [pane, title, dead] = line.split('\t');
      const kind = option(pane, '@qatlas-kind');
      const text = option(pane, '@qatlas-text');
      const task = option(pane, '@qatlas-task');
      const detail = kind === 'handover' ? { report: option(pane, '@qatlas-report') } : kind && text ? { question: text } : {};
      return { pane, package: option(pane, '@qatlas-package'), title, dead: dead === '1',
        ...(kind ? { kind } : {}), ...(kind && task ? { task } : {}), ...detail };
    });
}

const option = (pane, name) => tmux(['display', '-p', '-t', pane, `#{${name}}`]);
const setOption = (pane, name, value) => tmux(['set', '-p', '-t', pane, name, value]);

function target() {
  const repo = repoKey();
  const [name] = need('--package');
  const hit = allPanes(repo).find(p => p.package === name);
  if (!hit) fail(`Kein Pane für Paket ${name} in den Sentinel-Fenstern von ${repo}`);
  return hit.pane;
}

function layout(win) {
  tmux(['if-shell', '-F', '-t', win, `#{e|<:#{window_width},${NARROW}}`,
    `select-layout -t ${win} even-vertical`, `select-layout -t ${win} tiled`]);
}

function setTitle(pane, title) {
  setOption(pane, 'allow-set-title', 'off');
  tmux(['select-pane', '-t', pane, '-T', title]);
}

// tmux does not allow `.` and `:` in session names.
const sessionName = repo => 'sentinel--' + path.basename(repo).replace(/[.:]/g, '_');

function newWindow(repo, label, cwd) {
  let line;
  let session = SOCKET;
  if (inTmux) {
    session = sessionName(repo);
    let exists = true;
    try { tmux(['has-session', '-t', '=' + session]); } catch { exists = false; }
    if (exists) fail(`Session ${session} existiert bereits, gehört aber nicht zu ${repo}. Nichts geändert.`);
    line = tmux(['new-session', '-d', '-s', session, '-n', label, '-c', cwd, '-P', '-F', '#{window_id}\t#{pane_id}\t#{session_id}', '--', ...rest]);
    tmux(['set', '-t', line.split('\t')[2], 'mouse', 'off']);
  } else {
    const spawn = ['-d', '-P', '-F', '#{window_id}\t#{pane_id}', '-n', label, '-c', cwd, ...rest];
    let has = true;
    try { tmux(['has-session', '-t', SOCKET]); } catch { has = false; }
    line = has ? tmux(['new-window', '-t', SOCKET + ':', ...spawn]) : tmux(['new-session', '-s', SOCKET, ...spawn]);
  }
  const [win, pane] = line.split('\t');
  markWindow(win, repo);
  return [win, pane, session];
}

function markWindow(win, repo) {
  for (const [name, value] of [[MARK, repo], ['pane-border-status', 'top'], ['pane-border-format', ' #{pane_title} '],
    ['remain-on-exit', 'on'], ['automatic-rename', 'off'], ['allow-rename', 'off']]) {
    tmux(['set', '-w', '-t', win, name, value]);
  }
  tmux(['set-hook', '-w', '-t', win, 'window-resized',
    `if-shell -F "#{e|<:#{window_width},${NARROW}}" "select-layout -t ${win} even-vertical" "select-layout -t ${win} tiled"`]);
}

function extraWindow(repo, first, label, cwd) {
  const session = tmux(['display', '-p', '-t', first, '#{session_name}']);
  const line = tmux(['new-window', '-d', '-t', '=' + session + ':', '-n', label, '-c', cwd, '-P', '-F', '#{window_id}\t#{pane_id}', '--', ...rest]);
  const [win, pane] = line.split('\t');
  markWindow(win, repo);
  return [win, pane, session];
}

function add() {
  const repo = repoKey();
  const [name, label, title, cwd] = need('--package', '--label', '--title', '--cwd');
  if (!rest.length) fail('Fehlt: Befehl nach --', 2);
  if (!fs.statSync(cwd, { throwIfNoEntry: false })?.isDirectory()) fail('Kein Ordner: ' + cwd);
  const wins = markedWindows(repo);
  let win = wins.find(w => panes(w).length < MAX_PANES);
  let pane;
  let session;
  if (allPanes(repo).some(p => p.package === name)) fail('Paket hat bereits ein Pane: ' + name);
  if (win) {
    session = tmux(['display', '-p', '-t', win, '#{session_name}']);
    pane = tmux(['split-window', '-d', '-P', '-F', '#{pane_id}', '-t', win, '-c', cwd, ...rest]);
  } else if (wins.length) {
    [win, pane, session] = extraWindow(repo, wins[0], label, cwd);
  } else {
    [win, pane, session] = newWindow(repo, label, cwd);
    if (fs.existsSync(eventsFile(repo))) {
      fs.renameSync(eventsFile(repo), path.join(eventsDir(repo), `events-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`));
    }
  }
  setOption(pane, '@qatlas-package', name);
  setOption(pane, '@qatlas-title', title);
  setTitle(pane, title);
  layout(win);
  record(repo, 'start', { package: name, pane });
  out({ window: win, pane, session,
    ...(inTmux ? { switch: 'Ctrl+B s (Session-Liste) oder Ctrl+B ( / Ctrl+B )' } : { attach: `tmux -L ${SOCKET} attach` }) });
}

function list() {
  const repo = repoKey();
  out({ windows: markedWindows(repo), panes: allPanes(repo), cursor: events(repo).length });
}

// Writes exactly one exited per newly detected dead pane.
function recordExits(repo) {
  const seen = new Set(events(repo).filter(e => e.type === 'exited').map(e => e.pane));
  for (const p of allPanes(repo)) {
    if (p.dead && !seen.has(p.pane)) record(repo, 'exited', { package: p.package, pane: p.pane });
  }
}

async function wait() {
  const repo = repoKey();
  const since = Number(flag('--since') || 0);
  if (!Number.isInteger(since) || since < 0) fail('--since muss eine ganze Zahl ab 0 sein', 2);
  const end = Date.now() + Number(flag('--timeout') || 600) * 1000;
  const waking = () => events(repo).filter(e => e.seq >= since && WAKING.has(e.type));
  for (;;) {
    recordExits(repo);
    const hits = waking();
    if (hits.length) return out({ events: hits, cursor: events(repo).length, timeout: false });
    if (Date.now() >= end) break;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  out({ events: [], cursor: events(repo).length, timeout: true });
}

// A repeated call with the same signal keeps waiting and never discards an answer that has arrived
// meanwhile. Same signal: a question with the same text, a handover of the same task. A changed report
// replaces the open one only while no answer exists. At most one open signal per pane; an open signal of
// the other kind is an error.
async function raise(kind, text, task) {
  const repo = repoKey();
  const pane = target();
  const timeout = Number(flag('--timeout') || 100) * 1000;
  const title = option(pane, '@qatlas-title') || option(pane, 'pane_title');
  const open = option(pane, '@qatlas-kind');
  if (open && open !== kind) fail(`Pane ${pane} hat bereits ein offenes Signal (${open}).`);
  const same = open === kind && (kind === 'handover' ? option(pane, '@qatlas-task') === task : option(pane, '@qatlas-text') === text);
  const changed = !same || (option(pane, '@qatlas-text') !== text && pendingAnswer(repo, pane) === null);
  if (changed) {
    setOption(pane, '@qatlas-kind', kind);
    setOption(pane, '@qatlas-text', text);
    let report;
    if (kind === 'handover') {
      report = storeReport(repo, flag('--package'), task, text);
      setOption(pane, '@qatlas-report', report);
      setOption(pane, '@qatlas-task', task);
    } else {
      for (const name of ['@qatlas-task', '@qatlas-report']) tmux(['set', '-p', '-u', '-t', pane, name]);
    }
    setTitle(pane, PREFIX[kind] + title);
    record(repo, kind, { package: flag('--package'), pane, task, ...(report ? { report } : { text }) });
  }
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const answer = pendingAnswer(repo, pane);
    if (answer !== null) {
      for (const name of ['@qatlas-kind', '@qatlas-text', '@qatlas-task', '@qatlas-report']) tmux(['set', '-p', '-u', '-t', pane, name]);
      setTitle(pane, title);
      record(repo, 'picked', { package: flag('--package'), pane, task });
      return out({ answer });
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  out({ answer: null, hint: `Noch keine Antwort. Rufe ${kind === 'handover' ? 'handover' : 'ask'} mit demselben Signal erneut auf.` });
}

// Never overwrites an existing file.
function writeUnique(dir, base, ext, content) {
  fs.mkdirSync(dir, { recursive: true });
  for (let n = 1; ; n++) {
    const candidate = path.join(dir, n === 1 ? `${base}${ext}` : `${base}-${n}${ext}`);
    try { fs.writeFileSync(candidate, content, { flag: 'wx' }); return candidate; } catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
}

const safe = value => String(value).replace(/[^A-Za-z0-9._-]/g, '_');
const storeReport = (repo, name, task, text) => writeUnique(path.join(eventsDir(repo), 'reports'), `${safe(name)}-${safe(task)}`, '.md', text + '\n');

function reportText() {
  const [value] = need('--report');
  try {
    if (fs.statSync(value, { throwIfNoEntry: false })?.isFile()) return fs.readFileSync(value, 'utf8').trim();
  } catch { /* not a readable path: treat as text */ }
  return value;
}

function answer() {
  const repo = repoKey();
  const pane = target();
  const [text] = need('--answer');
  const kind = option(pane, '@qatlas-kind');
  if (!kind) fail('Keine offene Frage oder Übergabe in ' + pane);
  if (kind === 'handover' && !/^(integrated \S+|rework \S[\s\S]*)$/.test(text)) {
    fail('Auf eine Übergabe ist nur "integrated <sha>" oder "rework <grund>" zulässig.', 2);
  }
  const task = kind === 'handover' ? option(pane, '@qatlas-task') : '';
  record(repo, 'answer', { package: flag('--package'), pane, task, text });
  out({ pane, answered: true });
}

function logEvent() {
  const repo = repoKey();
  const [type] = need('--type');
  if (!/^[a-z][a-z0-9-]*$/.test(type)) fail('--type muss [a-z][a-z0-9-]* entsprechen', 2);
  if (RESERVED.has(type)) fail('Reservierter Ereignistyp: ' + type, 2);
  record(repo, type, { package: flag('--package'), task: flag('--task'), text: flag('--text') });
  out({ logged: type, cursor: events(repo).length });
}

// Times in seconds. Cycle time per task: from package start or last integration in the package
// to the first handover of the task. Wait time: last handover before the integration
// to answer integrated. Notes: all logged types outside INTEGRATION, grouped by type.
function report() {
  const list = events(repoKey());
  const time = e => Date.parse(e.at);
  const secs = ms => Math.round(ms) / 1000;
  const packages = {};
  const tasks = {};
  const log = { rerun: 0, conflict: 0 };
  const notes = {};
  const lastIntegrated = {};
  for (const e of list) {
    if (!RESERVED.has(e.type) && !INTEGRATION.has(e.type) && e.type !== 'unlesbar') {
      (notes[e.type] ||= []).push(Object.fromEntries(['package', 'task', 'text'].filter(k => e[k]).map(k => [k, e[k]])));
    }
    const pkg = e.package && (packages[e.package] ||= { rueckfragen: 0, start: null });
    if (e.type === 'start' && pkg) pkg.start = time(e);
    if (e.type === 'question' && pkg) pkg.rueckfragen++;
    if (Object.hasOwn(log, e.type)) log[e.type]++;
    if (!e.task) continue;
    const t = tasks[e.task] ||= { package: e.package || null, durchlaufzeit: null, wartezeit: null, rework: 0, handovers: 0 };
    if (e.type === 'handover') {
      if (!t.handovers++) {
        const from = Math.max(pkg?.start ?? -Infinity, lastIntegrated[e.package] ?? -Infinity);
        if (Number.isFinite(from)) t.durchlaufzeit = secs(time(e) - from);
      }
      t.lastHandover = time(e);
    } else if (e.type === 'answer' && /^integrated\b/.test(e.text || '')) {
      if (t.lastHandover !== undefined) t.wartezeit = secs(time(e) - t.lastHandover);
      lastIntegrated[e.package] = time(e);
    } else if (e.type === 'answer' && /^rework\b/.test(e.text || '')) {
      t.rework++;
    }
  }
  for (const t of Object.values(tasks)) delete t.lastHandover;
  for (const p of Object.values(packages)) delete p.start;
  out({
    laufdauer: list.length ? secs(time(list[list.length - 1]) - time(list[0])) : null,
    tasks, packages, log, notes, events: list.length,
  });
}

function capture() {
  const repo = repoKey();
  const pane = target();
  const content = tmux(['capture-pane', '-p', '-J', '-S', '-', '-t', pane]) + '\n';
  const file = writeUnique(eventsDir(repo), safe(flag('--package')), '.log', content);
  record(repo, 'captured', { package: flag('--package'), pane, text: file });
  out({ pane, file });
}

function close() {
  const repo = repoKey();
  const pane = target();
  const win = tmux(['display', '-p', '-t', pane, '#{window_id}']);
  const session = tmux(['display', '-p', '-t', pane, '#{session_id}']);
  const last = panes(win).length === 1;
  tmux(['kill-pane', '-t', pane]);
  if (!last) layout(win);
  let sessionClosed = false;
  try { tmux(['has-session', '-t', session]); } catch { sessionClosed = true; }
  record(repo, 'closed', { package: flag('--package'), pane });
  out({ closed: pane, windowClosed: last, sessionClosed });
}

try {
  if (command === 'add') add();
  else if (command === 'list') list();
  else if (command === 'title') {
    const repo = repoKey();
    const pane = target();
    const [title] = need('--title');
    const was = option(pane, 'pane_title');
    setTitle(pane, title);
    if (title.startsWith('FERTIG') && !was.startsWith('FERTIG')) record(repo, 'done', { package: flag('--package'), pane, text: title });
    out({ pane, title });
  }
  else if (command === 'wait') wait().catch(error => fail(error.message));
  else if (command === 'ask') raise('question', need('--question')[0]).catch(error => fail(error.message));
  else if (command === 'handover') { const [task] = need('--task'); raise('handover', reportText(), task).catch(error => fail(error.message)); }
  else if (command === 'answer') answer();
  else if (command === 'log') logEvent();
  else if (command === 'report') report();
  else if (command === 'capture') capture();
  else if (command === 'close') close();
  else fail('Befehle: add, list, title, wait, ask, handover, answer, log, report, capture, close', 2);
} catch (error) {
  fail((error.stderr ? String(error.stderr).trim() : '') || error.message);
}
