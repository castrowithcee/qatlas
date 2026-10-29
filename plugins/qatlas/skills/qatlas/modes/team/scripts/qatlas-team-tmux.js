#!/usr/bin/env node
'use strict';

// Controls the lead windows of a Qatlas team in tmux. Windows belong to exactly one repo and
// are marked via its root; the script touches only windows so marked. Each window holds at most four
// panes; further packages open another window in the same session. If the supervisor runs in tmux,
// add creates its own session `team--<repo>` on the user server (mouse off there, no
// server-wide options); otherwise the fallback server `-L qatlas-team` is used. A pane
// is addressed via repo and package because hosts like Codex do not reliably run commands with the pane
// environment.
// Roles: `add` opens a lead pane per package (default) or, with `--role integrator`, at most one integrator
// pane per repo that integrates all handovers of the leads. The integrator is not a package: it takes no
// --package, is stored as pane option @qatlas-role and addressed with `--role integrator` instead of
// --package (ask, title, nudge, answer, capture, close); `integrator` is a reserved package name. The
// supervisor starts it after the leads. list shows the role of every pane; report counts no package for it.
// Events are JSON lines in <repo>/.qatlas/local/team/events.jsonl and the single source of truth for
// answers. `seq` is the 0-based line index, derived on read, not stored. Waking types: question,
// handover, done, exited, stale, disk; start, plan, answer, picked, nudge and all types written via log
// except erfasst do not wake.
// `wait --role supervisor|integrator` (default supervisor) routes them: the integrator receives only
// handover; the supervisor receives all other waking types, also those of the integrator pane (its question,
// its done), and erfasst, a newly recorded draft it has shaped. erfasst stays a log type, so it is not
// reserved and still appears in the report notes. `wait --since <seq>` returns the waking events of the role
// from seq on and the new `cursor` (count of all events); every consumer keeps its own cursor and passes it
// as --since on the next call, so the events of the other role cost nothing. Handover reports are stored as
// files under reports/ and events carry only their path. A handover report with YAML frontmatter
// (pr-title, pr-body, branch, base, last, optional cut-exception) is validated before any tmux access:
// the branch must carry exactly one non-merge commit over the base, unless cut-exception names a reason.
// For a handed-over pull request the frontmatter adds pr (positive integer), head (SHA of the handed-over
// tip) and pushed (SHA at the first push); pr requires both. Then pushed must be an ancestor of head (or
// equal), a local branch must point at head, and the cut rule applies to base..pushed, so later CI-fix
// commits between pushed and head pass. `cut` runs the cut rule alone before the first push (exit 0 ok,
// 2 rejected with the handover message), without tmux and without run files.
// Refs resolve in --code-repo (default --repo), so code may live in a repo embedded in the control repo;
// run files always stay in --repo.
// The supervisor's `wait` also watches itself, so the supervisor needs no monitor of its own; only it detects
// and writes exited, stale and disk, under an exclusive lock directory (detect.lock, stale after
// LOCK_STALE_MS) so concurrent supervisor calls never write one event twice. stale: a live pane without
// open signal whose conversation part has not changed for --stale minutes (once per standstill phase;
// the state lives in pane options and so survives across wait calls). While the host shows that the
// lead waits for its own background agent (Claude Code: "Waiting for N background agent(s)"), the
// limit is WAITING_FACTOR times --stale, so a hung worker is still reported. disk: free space of the repo
// filesystem fell below --min-free GB (once per undershoot). nudge is the only way to write into a pane.
// If add finds no marked window, an existing log is renamed to events-<timestamp>.jsonl.
// Usage:
//   qatlas-team-tmux.js add --repo <root> (--package <package> | --role integrator) --label <window-name> --title <title> --cwd <dir> -- <command> [args...]
//   qatlas-team-tmux.js list --repo <root>
//   qatlas-team-tmux.js wait --repo <root> [--role supervisor|integrator] [--since <seq>] [--timeout <seconds>] [--stale <minutes, default 20>] [--min-free <GB, default 5>]
//   qatlas-team-tmux.js nudge --repo <root> (--package <package> | --role integrator) --text <text>   (refused while the pane has an open signal)
//   qatlas-team-tmux.js title --repo <root> (--package <package> | --role integrator) --title <title>
//   qatlas-team-tmux.js ask --repo <root> (--package <package> | --role integrator) --question <question> [--timeout <seconds>]
//   qatlas-team-tmux.js handover --repo <root> [--code-repo <path>] --package <package> --task <id> --report <text|file> [--timeout <seconds>]
//   qatlas-team-tmux.js cut --repo <root> [--code-repo <path>] --branch <branch> --base <ref>
//   qatlas-team-tmux.js answer --repo <root> (--package <package> | --role integrator) --answer <answer>   (handover: "integrated <sha>" or "rework <reason>")
//   qatlas-team-tmux.js log --repo <root> --type <type> [--package <package>] [--task <id>] [--text <text>]
//   qatlas-team-tmux.js plan --repo <root> --budget <n> --package <package> --tasks <id,id,...>   (run budget and package tasks; repeatable)
//   qatlas-team-tmux.js report --repo <root>
//   qatlas-team-tmux.js capture --repo <root> (--package <package> | --role integrator)   (scrollback to <root>/.qatlas/local/team/<package>.log)
//   qatlas-team-tmux.js close --repo <root> (--package <package> | --role integrator)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { parseFrontmatter } = require('../../../scripts/handover-frontmatter.js');

const MAX_PANES = 4;
const NARROW = 80;
const MARK = '@qatlas-team';
const SOCKET = 'qatlas-team';
const WAKING = new Set(['question', 'handover', 'done', 'exited', 'stale', 'disk']);
const SUPERVISOR_WAKING = new Set([...[...WAKING].filter(type => type !== 'handover'), 'erfasst']);
const LOCK_STALE_MS = 30000;
const SIGNAL = new Set(['question', 'handover', 'answer', 'picked']);
const RESERVED = new Set([...WAKING, 'start', 'answer', 'picked', 'captured', 'closed', 'plan', 'nudge']);
const INTEGRATION = new Set(['push', 'pr', 'merge', 'rerun', 'conflict', 'close']);
// Lowest rows of a pane are not conversation: Claude Code shows notice, rule, input, rule, about four status
// lines and the mode line (9 rows, seen live); Codex shows blank, input, blank, status, hint (5 rows).
// 10 covers both; small panes keep at least half their rows.
const STATUS_ROWS = 10;
// The host line can sit in the hidden status rows, so it is searched in the whole visible pane.
const WAITING = /Waiting for \d+ background agents?\b/i;
const WAITING_FACTOR = 3;
// Digits and spinner/progress glyphs (braille, block, geometric, dingbats) change without progress.
const VOLATILE = /[0-9\u2800-\u28FF\u2580-\u25FF\u2700-\u27BF\u00B7\u2022\u2026]/g;
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
const need = (...names) => names.map(name => flag(name) || fail('Missing: ' + name, 2));
const repoKey = () => fs.realpathSync(path.resolve(need('--repo')[0]));

const eventsDir = repo => path.join(repo, '.qatlas', 'local', 'team');
const eventsFile = repo => path.join(eventsDir(repo), 'events.jsonl');

// O_APPEND keeps single-line appends atomic even with several writers.
function record(repo, type, fields = {}) {
  fs.mkdirSync(eventsDir(repo), { recursive: true });
  const entry = { at: new Date().toISOString(), type };
  for (const key of ['package', 'role', 'task', 'pane', 'text', 'report']) if (fields[key]) entry[key] = fields[key];
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
      return { pane, package: option(pane, '@qatlas-package'), role: option(pane, '@qatlas-role') || 'lead', title, dead: dead === '1',
        ...(kind ? { kind } : {}), ...(kind && task ? { task } : {}), ...detail };
    });
}

const option = (pane, name) => tmux(['display', '-p', '-t', pane, `#{${name}}`]);
const setOption = (pane, name, value) => tmux(['set', '-p', '-t', pane, name, value]);

// The integrator is addressed by --role integrator; a package pane by --package. Events of the integrator
// pane carry role instead of package.
const who = () => ({ package: flag('--package'), role: flag('--role') });

function target() {
  const repo = repoKey();
  if (flag('--role') !== null) {
    if (flag('--role') !== 'integrator' || flag('--package') !== null) fail('Address a pane with --package <package> or --role integrator, not both', 2);
    const hit = allPanes(repo).find(p => p.role === 'integrator');
    if (!hit) fail(`No integrator pane in the team windows of ${repo}`);
    return hit.pane;
  }
  const [name] = need('--package');
  const hit = allPanes(repo).find(p => p.package === name && p.role !== 'integrator');
  if (!hit) fail(`No pane for package ${name} in the team windows of ${repo}`);
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
const sessionName = repo => 'team--' + path.basename(repo).replace(/[.:]/g, '_');

function newWindow(repo, label, cwd) {
  let line;
  let session = SOCKET;
  if (inTmux) {
    session = sessionName(repo);
    let exists = true;
    try { tmux(['has-session', '-t', '=' + session]); } catch { exists = false; }
    if (exists) fail(`Session ${session} already exists but does not belong to ${repo}. Nothing changed.`);
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
  const [label, title, cwd] = need('--label', '--title', '--cwd');
  const role = flag('--role') ?? 'lead';
  if (role !== 'lead' && role !== 'integrator') fail('--role must be lead or integrator', 2);
  const integrator = role === 'integrator';
  if (integrator && flag('--package') !== null) fail('The integrator takes no --package', 2);
  const name = integrator ? null : need('--package')[0];
  if (name === 'integrator') fail('Reserved package name: integrator', 2);
  if (!rest.length) fail('Missing: command after --', 2);
  if (!fs.statSync(cwd, { throwIfNoEntry: false })?.isDirectory()) fail('Not a directory: ' + cwd);
  const wins = markedWindows(repo);
  let win = wins.find(w => panes(w).length < MAX_PANES);
  let pane;
  let session;
  if (integrator ? allPanes(repo).some(p => p.role === 'integrator') : allPanes(repo).some(p => p.package === name)) {
    fail(integrator ? 'Repo already has an integrator pane' : 'Package already has a pane: ' + name);
  }
  if (win) {
    session = tmux(['display', '-p', '-t', win, '#{session_name}']);
    pane = tmux(['split-window', '-d', '-P', '-F', '#{pane_id}', '-t', win, '-c', cwd, ...rest]);
  } else if (wins.length) {
    [win, pane, session] = extraWindow(repo, wins[0], label, cwd);
  } else {
    [win, pane, session] = newWindow(repo, label, cwd);
    if (fs.existsSync(eventsFile(repo))) {
      fs.rmSync(path.join(eventsDir(repo), 'disk-low'), { force: true });
      fs.renameSync(eventsFile(repo), path.join(eventsDir(repo), `events-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`));
    }
  }
  if (integrator) setOption(pane, '@qatlas-role', role); else setOption(pane, '@qatlas-package', name);
  setOption(pane, '@qatlas-title', title);
  setTitle(pane, title);
  layout(win);
  record(repo, 'start', { package: name, role: integrator ? role : null, pane });
  out({ window: win, pane, session,
    ...(inTmux ? { switch: 'Ctrl+B s (session list) or Ctrl+B ( / Ctrl+B )' } : { attach: `tmux -L ${SOCKET} attach` }) });
}

function list() {
  const repo = repoKey();
  out({ windows: markedWindows(repo), panes: allPanes(repo), cursor: events(repo).length });
}

// Writes exactly one exited per newly detected dead pane.
function recordExits(repo) {
  const seen = new Set(events(repo).filter(e => e.type === 'exited').map(e => e.pane));
  for (const p of allPanes(repo)) {
    if (p.dead && !seen.has(p.pane)) record(repo, 'exited', { package: p.package, role: p.role === 'integrator' ? p.role : null, pane: p.pane });
  }
}

// Conversation part of the visible pane: without the status rows at the bottom, trailing blanks trimmed.
function conversation(pane) {
  const height = Number(option(pane, 'pane_height')) || 0;
  const keep = Math.max(1, height - Math.min(STATUS_ROWS, Math.floor(height / 2)));
  const lines = tmux(['capture-pane', '-p', '-t', pane]).split('\n').slice(0, keep).map(l => l.trimEnd());
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  return lines;
}

// Standstill tracking per pane in pane options: @qatlas-hash, @qatlas-since (ms), @qatlas-stale (reported).
const TRACK = ['@qatlas-hash', '@qatlas-since', '@qatlas-stale'];
function recordStale(repo, minutes) {
  for (const p of allPanes(repo)) {
    if (p.dead) continue;
    if (p.kind) { for (const name of TRACK) tmux(['set', '-p', '-u', '-t', p.pane, name]); continue; }
    const lines = conversation(p.pane);
    const waiting = WAITING.test(tmux(['capture-pane', '-p', '-t', p.pane]));
    const masked = lines.join('\n').replace(VOLATILE, '').replace(/\s+/g, ' ');
    const hash = crypto.createHash('sha1').update(masked).digest('hex');
    const now = Date.now();
    const since = Number(option(p.pane, '@qatlas-since'));
    if (option(p.pane, '@qatlas-hash') !== hash || !since) {
      setOption(p.pane, '@qatlas-hash', hash);
      setOption(p.pane, '@qatlas-since', String(now));
      tmux(['set', '-p', '-u', '-t', p.pane, '@qatlas-stale']);
    } else if (!option(p.pane, '@qatlas-stale') && now - since >= minutes * (waiting ? WAITING_FACTOR : 1) * 60000) {
      setOption(p.pane, '@qatlas-stale', '1');
      record(repo, 'stale', { package: p.package, role: p.role === 'integrator' ? p.role : null, pane: p.pane,
        text: `No change for ${((now - since) / 6e4).toFixed(1)} min${waiting ? ' while waiting for a background agent' : ''}. Last lines:\n${lines.slice(-5).join('\n')}` });
    }
  }
}

// The marker file re-arms disk after recovery; add clears it together with the old log.
function recordDisk(repo, minFree) {
  const stat = fs.statfsSync(repo);
  const free = stat.bavail * stat.bsize / 1e9;
  const marker = path.join(eventsDir(repo), 'disk-low');
  if (free >= minFree) return fs.rmSync(marker, { force: true });
  if (fs.existsSync(marker)) return;
  fs.mkdirSync(eventsDir(repo), { recursive: true });
  fs.writeFileSync(marker, '');
  record(repo, 'disk', { text: `Free space ${free.toFixed(1)} GB, below ${minFree} GB.` });
}

function nudge() {
  const repo = repoKey();
  const pane = target();
  const [text] = need('--text');
  if (option(pane, '@qatlas-kind')) fail(`Pane ${pane} has an open signal; no nudge.`, 2);
  if (option(pane, 'pane_dead') === '1') fail(`Pane ${pane} is dead; no nudge.`, 2);
  tmux(['send-keys', '-t', pane, '-l', '--', text]);
  tmux(['send-keys', '-t', pane, 'Enter']);
  record(repo, 'nudge', { ...who(), pane, text });
  out({ pane, nudged: true });
}

// Exclusive section for the detection of exited, stale and disk: mkdir is atomic. A lock older than
// LOCK_STALE_MS (crashed holder) is taken over. A caller that loses the race skips detection for this
// round; the holder writes the events, the next round reads them.
function detectLocked(repo, fn) {
  const lock = path.join(eventsDir(repo), 'detect.lock');
  fs.mkdirSync(eventsDir(repo), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try { fs.mkdirSync(lock); } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const age = Date.now() - (fs.statSync(lock, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
      if (age < LOCK_STALE_MS) return;
      fs.rmSync(lock, { recursive: true, force: true });
      continue;
    }
    try { fn(); } finally { fs.rmSync(lock, { recursive: true, force: true }); }
    return;
  }
}

async function wait() {
  const repo = repoKey();
  const role = flag('--role') ?? 'supervisor';
  if (role !== 'supervisor' && role !== 'integrator') fail('--role must be supervisor or integrator', 2);
  const wakes = role === 'integrator' ? new Set(['handover']) : SUPERVISOR_WAKING;
  const since = Number(flag('--since') || 0);
  if (!Number.isInteger(since) || since < 0) fail('--since must be an integer from 0', 2);
  const end = Date.now() + Number(flag('--timeout') || 600) * 1000;
  const positive = name => {
    const value = flag(name) === null ? null : Number(flag(name));
    if (value !== null && !(value > 0 && Number.isFinite(value))) fail(name + ' must be positive', 2);
    return value;
  };
  const stale = positive('--stale') ?? 20;
  const minFree = positive('--min-free') ?? 5;
  for (;;) {
    if (role === 'supervisor') {
      detectLocked(repo, () => { recordExits(repo); recordStale(repo, stale); recordDisk(repo, minFree); });
    }
    const all = events(repo);
    const hits = all.filter(e => e.seq >= since && wakes.has(e.type));
    if (hits.length) return out({ events: hits, cursor: all.length, timeout: false });
    if (Date.now() >= end) return out({ events: [], cursor: all.length, timeout: true });
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// A repeated call with the same signal keeps waiting and never discards an answer that has arrived
// meanwhile. Same signal: a question with the same text, a handover of the same task. A changed report
// replaces the open one only while no answer exists. At most one open signal per pane; an open signal of
// the other kind is an error.
async function raise(kind, text, task) {
  const repo = repoKey();
  if (kind === 'handover' && flag('--role') !== null) fail('Only a lead hands over; the integrator integrates.', 2);
  const pane = target();
  const timeout = Number(flag('--timeout') || 100) * 1000;
  const title = option(pane, '@qatlas-title') || option(pane, 'pane_title');
  const open = option(pane, '@qatlas-kind');
  if (open && open !== kind) fail(`Pane ${pane} already has an open signal (${open}).`);
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
    record(repo, kind, { ...who(), pane, task, ...(report ? { report } : { text }) });
  }
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const answer = pendingAnswer(repo, pane);
    if (answer !== null) {
      for (const name of ['@qatlas-kind', '@qatlas-text', '@qatlas-task', '@qatlas-report']) tmux(['set', '-p', '-u', '-t', pane, name]);
      setTitle(pane, title);
      record(repo, 'picked', { ...who(), pane, task });
      return out({ answer });
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  out({ answer: null, hint: `No answer yet. Call ${kind === 'handover' ? 'handover' : 'ask'} again with the same signal.` });
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
  const limit = `A pull request is one unit of the commit boundary: exactly one non-merge commit`;
  if (count === 0) bad(`${label} has 0 non-merge commits over ${base}. ${limit}.`);
  if (count > 1 && exception === undefined) {
    bad(`${label} has ${count} non-merge commits over ${base}. ${limit}; independent milestones become separate pull requests. For a justified exception, set "cut-exception: <reason>".`);
  }
}

// cut --branch <branch> --base <ref>: the cut check alone, run before the first push. --repo is required
// like for handover (it only locates the default code repo); no tmux access, no run files.
function cut(repo) {
  const bad = message => fail('Handover rejected: ' + message, 2);
  const [branch, base] = need('--branch', '--base');
  resolveCommit(repo, branch, 'branch', bad);
  resolveCommit(repo, base, 'base', bad);
  checkCut(repo, base, branch, `branch ${branch}`, undefined, bad);
  out({ result: 'ok', branch, base });
}

// Frontmatter is optional; without it the report passes unchecked. With "pr", the report hands over an open
// pull request: "pushed" (state at the first push) carries the cut check, "head" is the handed-over tip and
// may lie behind later CI-fix commits; without "pr", the branch itself is cut-checked.
function validateHandover(text, repo) {
  const bad = message => fail('Handover rejected: ' + message, 2);
  let parsed;
  try { parsed = parseFrontmatter(text); } catch (error) {
    if (error.kind === 'load') return fail('Check not possible: YAML parser not loadable (' + error.message + ').', 3);
    return bad(error.kind === 'yaml' ? 'frontmatter is not valid YAML (' + error.message + ').' : error.message);
  }
  if (!parsed) return;
  const { data } = parsed;
  const str = key => typeof data[key] === 'string' && data[key].trim() ? data[key].trim() : bad(`"${key}" must be a non-empty string.`);
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
    return;
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
}

function answer() {
  const repo = repoKey();
  const pane = target();
  const [text] = need('--answer');
  const kind = option(pane, '@qatlas-kind');
  if (!kind) fail('No open question or handover in ' + pane);
  if (kind === 'handover' && !/^(integrated \S+|rework \S[\s\S]*)$/.test(text)) {
    fail('A handover accepts only "integrated <sha>" or "rework <reason>".', 2);
  }
  const task = kind === 'handover' ? option(pane, '@qatlas-task') : '';
  record(repo, 'answer', { ...who(), pane, task, text });
  out({ pane, answered: true });
}

function plan() {
  const repo = repoKey();
  const budget = Number(need('--budget')[0]);
  const [name, tasks] = need('--package', '--tasks');
  if (!Number.isInteger(budget) || budget < 1) fail('--budget must be a positive integer', 2);
  const ids = tasks.split(',').map(s => s.trim());
  if (!name.trim() || ids.some(id => !id)) fail('--package and --tasks must not be empty', 2);
  if (name === 'integrator') fail('Reserved package name: integrator', 2);
  record(repo, 'plan', { package: name, text: JSON.stringify({ budget, tasks: ids }) });
  out({ planned: name, budget, tasks: ids, cursor: events(repo).length });
}

function logEvent() {
  const repo = repoKey();
  const [type] = need('--type');
  if (!/^[a-z][a-z0-9-]*$/.test(type)) fail('--type must match [a-z][a-z0-9-]*', 2);
  if (RESERVED.has(type)) fail('Reserved event type: ' + type, 2);
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
  const log = { rerun: 0, conflict: 0, nudge: 0 };
  const notes = {};
  const plan = { budget: null, packages: {} };
  const integrator = { vorhanden: false, rueckfragen: 0 };
  const lastIntegrated = {};
  for (const e of list) {
    if (!RESERVED.has(e.type) && !INTEGRATION.has(e.type) && e.type !== 'unlesbar') {
      (notes[e.type] ||= []).push(Object.fromEntries(['package', 'task', 'text'].filter(k => e[k]).map(k => [k, e[k]])));
    }
    if (e.type === 'plan') {
      try { const p = JSON.parse(e.text); plan.budget = p.budget; plan.packages[e.package] = p.tasks; } catch { /* skip */ }
    }
    const pkg = e.package && (packages[e.package] ||= { rueckfragen: 0, start: null });
    if (e.type === 'start' && pkg) pkg.start = time(e);
    if (e.type === 'question' && pkg) pkg.rueckfragen++;
    if (e.role === 'integrator') {
      integrator.vorhanden = true;
      if (e.type === 'question') integrator.rueckfragen++;
    }
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
    tasks, packages, integrator, plan, log, notes, events: list.length,
  });
}

function capture() {
  const repo = repoKey();
  const pane = target();
  const content = tmux(['capture-pane', '-p', '-J', '-S', '-', '-t', pane]) + '\n';
  const file = writeUnique(eventsDir(repo), safe(flag('--package') ?? flag('--role')), '.log', content);
  record(repo, 'captured', { ...who(), pane, text: file });
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
  record(repo, 'closed', { ...who(), pane });
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
    if (title.startsWith('FERTIG') && !was.startsWith('FERTIG')) record(repo, 'done', { ...who(), pane, text: title });
    out({ pane, title });
  }
  else if (command === 'wait') wait().catch(error => fail(error.message));
  else if (command === 'ask') raise('question', need('--question')[0]).catch(error => fail(error.message));
  else if (command === 'handover') { const [task] = need('--task'); const text = reportText(); validateHandover(text, codeRepo(repoKey())); raise('handover', text, task).catch(error => fail(error.message)); }
  else if (command === 'cut') cut(codeRepo(repoKey()));
  else if (command === 'answer') answer();
  else if (command === 'log') logEvent();
  else if (command === 'nudge') nudge();
  else if (command === 'plan') plan();
  else if (command === 'report') report();
  else if (command === 'capture') capture();
  else if (command === 'close') close();
  else fail('Commands: add, list, title, wait, ask, handover, cut, answer, log, nudge, plan, report, capture, close', 2);
} catch (error) {
  fail((error.stderr ? String(error.stderr).trim() : '') || error.message);
}
