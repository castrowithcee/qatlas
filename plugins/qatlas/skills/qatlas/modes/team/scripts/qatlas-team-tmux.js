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
// handover, done, exited, stale, disk, health; start, plan, answer, picked, nudge and all types written via log
// except erfasst do not wake.
// `wait --role supervisor|integrator` (default supervisor) routes them: the integrator receives only
// handover; the supervisor receives all other waking types, also those of the integrator pane (its question,
// its done), and erfasst, a newly recorded draft it has shaped. erfasst stays a log type, so it is not
// reserved and still appears in the report notes. `wait --since <seq>` returns the waking events of the role
// from seq on and the new `cursor` (count of all events); every consumer keeps its own cursor and passes it
// as --since on the next call, so the events of the other role cost nothing. Handover reports are stored as
// files under reports/ and events carry only their path. A handover report with YAML frontmatter
// is validated before it sets a new or changed signal; a repeated call with the unchanged report only waits
// for or picks up the answer and does not validate again, so the answer survives removal of branch and
// worktree. Checks mode (none of pr-title, pr-body, last, base, pr, head, pushed, cut-exception):
// requires branch and checks, no cut rule. PR mode (any of those): pr-title, pr-body, branch,
// base, last, optional cut-exception and checks. checks is a non-empty list of {command, exit, tree}; every
// tree must equal the tree of the handed-over state (head with pr, else branch); a red exit is allowed.
// In PR mode the branch must carry exactly one non-merge commit over the base, unless cut-exception names a reason.
// For a handed-over pull request the frontmatter adds pr (positive integer), head (SHA of the handed-over
// tip) and pushed (SHA at the first push); pr requires both. Then pushed must be an ancestor of head (or
// equal), a local branch must point at head, and the cut rule applies to base..pushed, so later CI-fix
// commits between pushed and head pass. `cut` runs the cut rule alone before the first push (exit 0 ok,
// 2 rejected with the handover message), without tmux and without run files.
// Refs resolve in --code-repo (default --repo), so code may live in a repo embedded in the control repo;
// run files always stay in --repo.
// The supervisor's `wait` also watches itself, so the supervisor needs no monitor of its own; only it detects
// and writes exited, stale, disk and health, under an exclusive lock directory (detect.lock, stale after
// LOCK_STALE_MS) so concurrent supervisor calls never write one event twice. stale: a live pane without
// open signal whose conversation part has not changed for --stale minutes (once per standstill phase;
// the state lives in pane options and so survives across wait calls). While the host shows that the
// lead waits for its own background agent (Claude Code: "Waiting for N background agent(s)"), the
// limit is WAITING_FACTOR times --stale, so a hung worker is still reported; the same holds while a `slot`
// command of qatlas-run-tools.js (waiting for a test slot or resource, or running under one) is a descendant of
// the pane process, since it prints once and then stays silent. disk: free space of the repo
// filesystem fell below --min-free GB (once per undershoot). health: fact-based look at every live pane,
// at most once per --health minutes (default 30; fractions allowed) per pane; unlike stale it reads
// host facts, not the screen. Anomaly: the pane process is gone while the pane lives (pane pid or the pid
// of its Claude Code session file), or the host status is busy/working/waiting without any activity for a
// full interval: no write to the main transcript, none to a not finished subagent transcript, no busy or
// queued test slot or resource of the code repo (--code-repo, default --repo; `slot status`; any of that
// repo counts, not only the pane's worktree).
// A pane with an open signal never counts as waiting. Written once per anomaly phase; a healthy check
// re-arms it. Host data is read through ~/.claude/sessions/<pid>.json (field tmux names the pane) and
// ~/.claude/projects/*/<sessionId>.jsonl plus <sessionId>/subagents/ (only mtimes and the finished flag
// of agent-<id>.meta.json); if it is missing or unreadable (Codex panes always) the result is unknown
// and no event is written. State lives in pane options @qatlas-health (ok|anomaly|unknown, shown by list as
// health) and @qatlas-health-at (ms of the last check). nudge is the only way to write into a pane.
// If add finds no marked window, an existing log is renamed to events-<timestamp>.jsonl.
// Context fill of Claude Code sessions is measured, not estimated: add starts a Claude command with a fixed
// --session-id (an existing one in the command is reused) and stores it as pane option @qatlas-session; other
// CLIs get none. `context` returns tokens, window, percent, source and age per pane or, with --self, for the
// own session (CLAUDE_CODE_SESSION_ID). The statusline state file ~/.qatlas/state/context/<id>.json comes
// first (tokens and window); otherwise the host transcript ~/.claude/projects/*/<id>.jsonl gives tokens of
// the last answer without a window (percent null). Without a measurement the state is "unknown". `compacted`
// marks a compaction after the last measured answer. list carries the same object per pane as `context`.
// The host's greyed input suggestion is never read as typed input: panes are captured with escape sequences
// and faint or explicitly coloured text on the input line is dropped (plainPane), so a suggestion neither
// moves the stale hash nor reaches stale text or capture files; add also starts a Claude command with
// --prompt-suggestions false unless the command sets it.
// `context` also decides per pane or for --self whether the session stops at the next task boundary (`stop`,
// `reason`) against `threshold` (--threshold, default 60): threshold when percent >= threshold, compacted when
// percent is unknown after a compaction; otherwise no stop with below, or unknown (the caller then estimates).
// A FERTIG title writes one done event; a lead adds the tasks it leaves unstarted with --rest, carried as list
// `rest` in done and in report.packages. plan --continues <package> logs a continuation of a closed package
// with the same run budget and tasks of that package; report lists it under plan.continuations, not in
// plan.packages, so it counts neither as a package nor against the budget.
// A handover is open while it is the last signal event of its lead pane. wait --role integrator returns only
// open handovers, so one already answered or picked, or superseded by a changed report, is never offered
// again (a rejected report raises nothing and leaves the open one in place; a resubmission after a picked
// rework is a new open handover), and answer refuses a second answer to it; list marks an open signal with a
// pending answer as `answered`. add --role integrator --replace saves and closes the old integrator pane only
// if it shows FERTIG or is dead and waits for no answer, then starts the new one in the same log; the new
// integrator takes over every open handover exactly once with wait --role integrator --since 0.
// Usage:
//   qatlas-team-tmux.js add --repo <root> (--package <package> | --role integrator [--replace]) --label <window-name> --title <title> --cwd <dir> -- <command> [args...]
//   qatlas-team-tmux.js list --repo <root>
//   qatlas-team-tmux.js context (--repo <root> [--package <package> | --role integrator] | --self) [--threshold <percent, default 60>]   (without selector: all panes)
//   qatlas-team-tmux.js wait --repo <root> [--role supervisor|integrator] [--since <seq>] [--timeout <seconds>] [--stale <minutes, default 20>] [--min-free <GB, default 5>] [--health <minutes, default 30>] [--code-repo <path>]
//   qatlas-team-tmux.js nudge --repo <root> (--package <package> | --role integrator) --text <text>   (refused while the pane has an open signal)
//   qatlas-team-tmux.js title --repo <root> (--package <package> | --role integrator) --title <title> [--rest <id,id,...>]   (--rest: lead, title turning FERTIG)
//   qatlas-team-tmux.js ask --repo <root> (--package <package> | --role integrator) --question <question> [--timeout <seconds>]
//   qatlas-team-tmux.js handover --repo <root> [--code-repo <path>] --package <package> --task <id> --report <text|file> [--timeout <seconds>]
//   qatlas-team-tmux.js cut --repo <root> [--code-repo <path>] --branch <branch> --base <ref>
//   qatlas-team-tmux.js answer --repo <root> (--package <package> | --role integrator) --answer <answer>   (handover: "integrated <sha>" or "rework <reason>", once)
//   qatlas-team-tmux.js log --repo <root> --type <type> [--package <package>] [--task <id>] [--text <text>]
//   qatlas-team-tmux.js plan --repo <root> --budget <n> --package <package> --tasks <id,id,...> [--continues <closed package>]   (run budget and package tasks; repeatable)
//   qatlas-team-tmux.js report --repo <root>
//   qatlas-team-tmux.js capture --repo <root> (--package <package> | --role integrator)   (scrollback to <root>/.qatlas/local/team/<package>.log)
//   qatlas-team-tmux.js close --repo <root> (--package <package> | --role integrator)

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { parseFrontmatter } = require('../../../scripts/handover-frontmatter.js');

const MAX_PANES = 4;
const NARROW = 80;
const MARK = '@qatlas-team';
const SOCKET = 'qatlas-team';
const WAKING = new Set(['question', 'handover', 'done', 'exited', 'stale', 'disk', 'health']);
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
  for (const key of ['package', 'role', 'task', 'pane', 'text', 'report', 'rest']) if (fields[key]) entry[key] = fields[key];
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

// Last signal event per pane: a handover is open for the integrator only while it is that event.
const lastSignals = all => all.reduce((map, e) => (SIGNAL.has(e.type) && e.pane ? map.set(e.pane, e) : map), new Map());

const TASK_ID = /^[A-Za-z0-9#_][A-Za-z0-9#_-]*$/;
function idList(name) {
  const ids = (flag(name) ?? '').split(',').map(s => s.trim());
  if (ids.some(id => !TASK_ID.test(id))) fail(name + ' takes comma-separated ids of [A-Za-z0-9#_-]', 2);
  return [...new Set(ids)];
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
      const health = option(pane, '@qatlas-health');
      const detail = kind === 'handover' ? { report: option(pane, '@qatlas-report') } : kind && text ? { question: text } : {};
      return { pane, package: option(pane, '@qatlas-package'), role: option(pane, '@qatlas-role') || 'lead', title, dead: dead === '1',
        ...(health ? { health } : {}), ...(kind ? { kind } : {}), ...(kind && task ? { task } : {}), ...detail };
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
    line = tmux(['new-session', '-d', '-s', session, '-n', label, '-c', cwd, '-P', '-F', '#{window_id}\t#{pane_id}\t#{session_id}', '--', ...PLACEHOLDER]);
    try { tmux(['set', '-t', line.split('\t')[2], 'mouse', 'off']); } catch (error) { discard(line.split('\t')[0]); throw error; }
  } else {
    const spawn = ['-d', '-P', '-F', '#{window_id}\t#{pane_id}', '-n', label, '-c', cwd, ...PLACEHOLDER];
    let has = true;
    try { tmux(['has-session', '-t', SOCKET]); } catch { has = false; }
    line = has ? tmux(['new-window', '-t', SOCKET + ':', ...spawn]) : tmux(['new-session', '-s', SOCKET, ...spawn]);
  }
  const [win, pane] = line.split('\t');
  launch(win, pane, repo, cwd);
  return [win, pane, session];
}

// A command that ends at once would close its window before remain-on-exit is set. The window starts with a
// placeholder, is marked, and only then does the real command take over the same pane.
const PLACEHOLDER = ['sleep', '3600'];
const discard = win => { try { tmux(['kill-window', '-t', win]); } catch { /* already gone */ } };

function launch(win, pane, repo, cwd) {
  try {
    markWindow(win, repo);
    tmux(['respawn-pane', '-k', '-t', pane, '-c', cwd, '--', ...rest]);
  } catch (error) { discard(win); throw error; }
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
  const line = tmux(['new-window', '-d', '-t', '=' + session + ':', '-n', label, '-c', cwd, '-P', '-F', '#{window_id}\t#{pane_id}', '--', ...PLACEHOLDER]);
  const [win, pane] = line.split('\t');
  launch(win, pane, repo, cwd);
  return [win, pane, session];
}

// Context measurement. Ids become file names or glob parts, so only plain ids pass. Transcripts are
// untrusted: only type, subtype and usage numbers are read, never message content.
const SESSION_ID = /^[A-Za-z0-9-]{8,64}$/;
const TAIL_BYTES = 1 << 20;
const unknown = reason => ({ state: 'unknown', tokens: null, window: null, percent: null, source: null, age: null, reason });
const measured = (tokens, window, source, ageMs, extra = {}) => ({ state: 'measured', tokens, window: window || null,
  percent: window ? Math.round(100 * tokens / window) : null, source, age: Math.max(0, Math.round(ageMs / 1000)), ...extra });

function stateFile(id) {
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.qatlas', 'state', 'context', id + '.json'), 'utf8')); } catch { return null; }
  if (!data || !Number.isFinite(data.tokens) || !Number.isFinite(data.at)) return null;
  return measured(data.tokens, Number(data.window) > 0 ? Number(data.window) : null, 'statusline', Date.now() - data.at);
}

function transcript(id) {
  const base = path.join(os.homedir(), '.claude', 'projects');
  let file = null;
  try {
    for (const dir of fs.readdirSync(base)) {
      const candidate = path.join(base, dir, id + '.jsonl');
      if (fs.existsSync(candidate)) { file = candidate; break; }
    }
    if (!file) return null;
    const { size, mtimeMs } = fs.statSync(file);
    const fd = fs.openSync(file, 'r');
    let text;
    try {
      const length = Math.min(size, TAIL_BYTES);
      const buf = Buffer.alloc(length);
      fs.readSync(fd, buf, 0, length, size - length);
      text = buf.toString('utf8');
    } finally { fs.closeSync(fd); }
    const lines = text.split('\n');
    if (size > TAIL_BYTES) lines.shift();
    let tokens = null;
    let compacted = false;
    for (const line of lines) {
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      if (!entry || entry.isSidechain) continue;
      if (entry.type === 'system' && entry.subtype === 'compact_boundary') compacted = true;
      const u = entry.type === 'assistant' && entry.message && entry.message.usage;
      if (!u) continue;
      const total = (Number(u.input_tokens) || 0) + (Number(u.cache_read_input_tokens) || 0) + (Number(u.cache_creation_input_tokens) || 0);
      if (total > 0) { tokens = total; compacted = false; }
    }
    return tokens === null ? null : measured(tokens, null, 'transcript', Date.now() - mtimeMs, compacted ? { compacted } : {});
  } catch { return null; }
}

function contextOf(id) {
  if (!id) return unknown('no session id');
  if (!SESSION_ID.test(id)) return unknown('invalid session id');
  return stateFile(id) || transcript(id) || unknown('no measurement');
}

const withContext = p => ({ ...p, context: contextOf(option(p.pane, '@qatlas-session')) });

// Without a percent only a compaction proves a full context; otherwise the caller falls back to its estimate.
function decide(context, threshold) {
  if (context.percent !== null) return context.percent >= threshold ? { stop: true, reason: 'threshold' } : { stop: false, reason: 'below' };
  return context.compacted ? { stop: true, reason: 'compacted' } : { stop: false, reason: 'unknown' };
}

function contextCommand() {
  const threshold = opts.includes('--threshold') ? Number(flag('--threshold')) : 60;
  if (!(threshold > 0 && threshold <= 100)) fail('--threshold must be a percent above 0 and at most 100', 2);
  if (opts.includes('--self')) {
    if (flag('--package') !== null || flag('--role') !== null) fail('--self excludes --package and --role', 2);
    const context = contextOf(process.env.CLAUDE_CODE_SESSION_ID);
    return out({ self: true, context, threshold, ...decide(context, threshold) });
  }
  const repo = repoKey();
  let list = allPanes(repo);
  if (flag('--package') !== null || flag('--role') !== null) { const pane = target(); list = list.filter(p => p.pane === pane); }
  out({ threshold, panes: list.map(withContext).map(({ pane, package: name, role, context }) => ({ pane, package: name, role, context, ...decide(context, threshold) })) });
}

const CLAUDE_ID = 'claude';
// A Claude command gets a fixed session id so the pane maps to its transcript; returns the id or null.
function sessionIdFor(command) {
  if (!command.length || path.basename(command[0]) !== CLAUDE_ID) return null;
  const at = command.findIndex(a => a === '--session-id' || a.startsWith('--session-id='));
  if (at >= 0) {
    const value = command[at].includes('=') ? command[at].slice(command[at].indexOf('=') + 1) : command[at + 1];
    return SESSION_ID.test(value || '') ? value : fail('Invalid --session-id in the command', 2);
  }
  const id = crypto.randomUUID();
  command.splice(1, 0, '--session-id', id);
  return id;
}

function disablePromptSuggestions(command) {
  if (!command.length || path.basename(command[0]) !== CLAUDE_ID) return;
  if (command.some(a => a === '--prompt-suggestions' || a.startsWith('--prompt-suggestions='))) return;
  command.splice(1, 0, '--prompt-suggestions', 'false');
}

function add() {
  const repo = repoKey();
  const [label, title, cwd] = need('--label', '--title', '--cwd');
  const role = flag('--role') ?? 'lead';
  if (role !== 'lead' && role !== 'integrator') fail('--role must be lead or integrator', 2);
  const integrator = role === 'integrator';
  const replace = opts.includes('--replace');
  if (replace && !integrator) fail('--replace applies only to --role integrator', 2);
  if (integrator && flag('--package') !== null) fail('The integrator takes no --package', 2);
  const name = integrator ? null : need('--package')[0];
  if (name === 'integrator') fail('Reserved package name: integrator', 2);
  if (!rest.length) fail('Missing: command after --', 2);
  const sessionId = sessionIdFor(rest);
  disablePromptSuggestions(rest);
  if (!fs.statSync(cwd, { throwIfNoEntry: false })?.isDirectory()) fail('Not a directory: ' + cwd);
  const replaced = replace ? retire(repo) : null;
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
    // A replacement continues the run even if the old integrator was the last pane.
    if (!replaced && fs.existsSync(eventsFile(repo))) {
      fs.rmSync(path.join(eventsDir(repo), 'disk-low'), { force: true });
      fs.renameSync(eventsFile(repo), path.join(eventsDir(repo), `events-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`));
    }
  }
  if (integrator) setOption(pane, '@qatlas-role', role); else setOption(pane, '@qatlas-package', name);
  if (sessionId) setOption(pane, '@qatlas-session', sessionId);
  setOption(pane, '@qatlas-title', title);
  setTitle(pane, title);
  layout(win);
  record(repo, 'start', { package: name, role: integrator ? role : null, pane });
  out({ window: win, pane, session, ...(replaced ? { replaced } : {}),
    ...(inTmux ? { switch: 'Ctrl+B s (session list) or Ctrl+B ( / Ctrl+B )' } : { attach: `tmux -L ${SOCKET} attach` }) });
}

// Only an integrator that ended its work (FERTIG or dead) and waits for no answer is replaced, so no integration
// runs in two sessions; the new one starts only after the old pane is closed.
function retire(repo) {
  const old = allPanes(repo).find(p => p.role === 'integrator');
  if (!old) fail('No integrator pane to replace', 2);
  if (!old.dead && !old.title.startsWith('FERTIG')) fail(`Integrator pane ${old.pane} is live without FERTIG; no replacement.`, 2);
  if (!old.dead && old.kind) fail(`Integrator pane ${old.pane} has an open signal (${old.kind}); no replacement.`, 2);
  const file = captureTo(repo, old.pane);
  closePane(repo, old.pane);
  return { pane: old.pane, file };
}

// The cursor is read before the panes: a signal raised in between is then both listed and returned by wait,
// never neither.
function list() {
  const repo = repoKey();
  const cursor = events(repo).length;
  const found = allPanes(repo).map(withContext);
  const last = lastSignals(events(repo));
  const panes = found.map(p => (p.kind && last.get(p.pane)?.type === 'answer' ? { ...p, answered: true } : p));
  out({ windows: markedWindows(repo), panes, cursor });
}

// Writes exactly one exited per newly detected dead pane.
function recordExits(repo) {
  const seen = new Set(events(repo).filter(e => e.type === 'exited').map(e => e.pane));
  for (const p of allPanes(repo)) {
    if (p.dead && !seen.has(p.pane)) record(repo, 'exited', { package: p.package, role: p.role === 'integrator' ? p.role : null, pane: p.pane });
  }
}

const ESCAPE = /\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\)|[ -/]*[0-~])/y;
const RULE = /^─{3,}\s*$/;
// Plain text of a `capture-pane -e` dump. On a host input line (Claude: ❯ between two rule lines; Codex: ›)
// only the glyph and text in the default foreground without SGR 2 are kept, which drops a greyed suggestion.
function plainPane(text) {
  let faint = false;
  let coloured = false;
  const sgr = params => {
    const codes = params.split(';');
    for (let i = 0; i < codes.length; i++) {
      const code = Number(codes[i].split(':')[0]);
      if (!codes[i]) { faint = false; coloured = false; }
      else if (code === 0) { faint = false; coloured = false; }
      else if (code === 2) faint = true;
      else if (code === 22) faint = false;
      else if (code === 39) coloured = false;
      else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) coloured = true;
      else if (code === 38 || code === 48 || code === 58) {
        if (code === 38) coloured = true;
        if (!codes[i].includes(':')) i += codes[i + 1] === '5' ? 2 : codes[i + 1] === '2' ? 4 : 0;
      }
    }
  };
  const rows = text.split('\n').map(raw => {
    const chars = [];
    for (let i = 0; i < raw.length;) {
      if (raw[i] === '\x1b') {
        ESCAPE.lastIndex = i;
        const m = ESCAPE.exec(raw);
        if (m) {
          const csi = /^\x1b\[([0-9;:]*)m$/.exec(m[0]);
          if (csi) sgr(csi[1]);
          i += m[0].length;
          continue;
        }
      }
      const ch = String.fromCodePoint(raw.codePointAt(i));
      chars.push({ ch, quiet: faint || coloured });
      i += ch.length;
    }
    return chars;
  });
  const plain = rows.map(chars => chars.map(c => c.ch).join(''));
  return rows.map((chars, i) => {
    const glyph = plain[i][0];
    const claude = glyph === '❯' && RULE.test(plain[i - 1] ?? '') && RULE.test(plain[i + 1] ?? '');
    if (!claude && glyph !== '›') return plain[i];
    return chars.filter((c, at) => at === 0 || (at === 1 && c.ch === ' ') || !c.quiet).map(c => c.ch).join('');
  }).join('\n');
}

// Conversation part of the visible pane: without the status rows at the bottom, trailing blanks trimmed.
function conversation(pane) {
  const height = Number(option(pane, 'pane_height')) || 0;
  const keep = Math.max(1, height - Math.min(STATUS_ROWS, Math.floor(height / 2)));
  const lines = plainPane(tmux(['capture-pane', '-e', '-p', '-t', pane])).split('\n').slice(0, keep).map(l => l.trimEnd());
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  return lines;
}

// One process table per call; a failing ps counts as no slot command anywhere.
function processTable() {
  try {
    const children = new Map();
    for (const line of execFileSync('ps', ['-axww', '-o', 'pid=,ppid=,args='], { encoding: 'utf8' }).split('\n')) {
      const m = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line);
      if (m) children.set(m[2], [...(children.get(m[2]) || []), { pid: m[1], args: m[3] }]);
    }
    return children;
  } catch { return new Map(); }
}

// The `slot` command of qatlas-run-tools.js below the pane process, as { resource } (null: test slot), or null.
function slotCommand(table, panePid) {
  const queue = [...(table.get(String(panePid)) || [])];
  for (let proc; (proc = queue.shift());) {
    const argv = proc.args.split(/\s+/);
    const i = argv.findIndex(a => path.basename(a) === 'qatlas-run-tools.js');
    const end = argv.indexOf('--');
    if (i >= 0 && argv[i + 1] === 'slot' && end > i) {
      const r = argv.indexOf('--resource', i);
      return { resource: r >= 0 && r < end ? argv[r + 1] || null : null };
    }
    queue.push(...(table.get(proc.pid) || []));
  }
  return null;
}

// Standstill tracking per pane in pane options: @qatlas-hash, @qatlas-since (ms), @qatlas-stale (reported).
const TRACK = ['@qatlas-hash', '@qatlas-since', '@qatlas-stale'];
function recordStale(repo, minutes) {
  const table = processTable();
  for (const p of allPanes(repo)) {
    if (p.dead) continue;
    if (p.kind) { for (const name of TRACK) tmux(['set', '-p', '-u', '-t', p.pane, name]); continue; }
    const lines = conversation(p.pane);
    const agent = WAITING.test(tmux(['capture-pane', '-p', '-t', p.pane]));
    const slot = slotCommand(table, option(p.pane, 'pane_pid'));
    const waiting = agent || !!slot;
    const reason = slot ? (slot.resource ? ` while waiting for or running under resource ${slot.resource}` : ' while waiting for or running under a test slot')
      : agent ? ' while waiting for a background agent' : '';
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
        text: `No change for ${((now - since) / 6e4).toFixed(1)} min${reason}. Last lines:\n${lines.slice(-5).join('\n')}` });
    }
  }
}

const SAFE_ID = /^[A-Za-z0-9-]{8,64}$/;
const BUSY = new Set(['busy', 'working', 'waiting']);
const MAX_HOST_FILE = 65536;

const aliveProcess = pid => {
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; }
};
const mtime = file => { try { return fs.statSync(file).mtimeMs; } catch { return null; } };

// Session files of the host that name a tmux pane: pane id -> numeric/status fields only.
function hostSessions() {
  const dir = path.join(os.homedir(), '.claude', 'sessions');
  const found = new Map();
  let names;
  try { names = fs.readdirSync(dir).filter(n => /^\d+\.json$/.test(n)); } catch { return found; }
  for (const name of names) {
    try {
      const file = path.join(dir, name);
      if (fs.statSync(file).size > MAX_HOST_FILE) continue;
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Number.isInteger(data.pid) || data.pid <= 0 || typeof data.tmux !== 'string' || typeof data.status !== 'string'
        || !SAFE_ID.test(data.sessionId) || !Number.isFinite(data.statusUpdatedAt)) continue;
      const pane = data.tmux.slice(data.tmux.lastIndexOf('.') + 1);
      const entry = { pid: data.pid, sessionId: data.sessionId, status: data.status, statusAt: data.statusUpdatedAt };
      const known = found.get(pane);
      // A dead leftover file must not hide the live session of the same pane.
      if (!known || (aliveProcess(entry.pid) && !aliveProcess(known.pid)) || (aliveProcess(entry.pid) === aliveProcess(known.pid) && entry.statusAt > known.statusAt)) found.set(pane, entry);
    } catch { /* unreadable: unknown */ }
  }
  return found;
}

// Newest write to the main transcript and to not finished subagent transcripts of a session; null if the
// main transcript is not found.
function transcriptActivity(sessionId) {
  const root = path.join(os.homedir(), '.claude', 'projects');
  let slugs;
  try { slugs = fs.readdirSync(root); } catch { return null; }
  let main = null;
  let sub = null;
  for (const slug of slugs) {
    const m = mtime(path.join(root, slug, sessionId + '.jsonl'));
    if (m !== null) main = Math.max(main ?? 0, m);
    const dir = path.join(root, slug, sessionId, 'subagents');
    let names = [];
    try { names = fs.readdirSync(dir).filter(n => /^agent-[A-Za-z0-9-]+\.jsonl$/.test(n)); } catch { /* none */ }
    for (const name of names) {
      let finished = false;
      try { finished = JSON.parse(fs.readFileSync(path.join(dir, name.replace(/\.jsonl$/, '.meta.json')), 'utf8')).finished === true; } catch { /* running */ }
      const t = mtime(path.join(dir, name));
      if (!finished && t !== null) sub = Math.max(sub ?? 0, t);
    }
  }
  return main === null ? null : { main, sub };
}

// True if the code repo has a busy or queued test slot or resource; null if slot status is not available.
function testActive(repo) {
  try {
    const status = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, '..', '..', '..', 'scripts', 'qatlas-run-tools.js'), 'slot', '--repo', repo, 'status'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000 }));
    const lists = [status.busy, status.waiting, ...(Array.isArray(status.resources) ? status.resources.flatMap(r => [r?.busy, r?.waiting]) : [])];
    return lists.some(list => Array.isArray(list) && list.length > 0);
  } catch { return null; }
}

// Facts for one live pane: { state: ok|anomaly|unknown, finding?, text? }. Never reads transcript content.
function paneHealth(p, session, test, now, minutes) {
  const panePid = Number(option(p.pane, 'pane_pid'));
  if (Number.isInteger(panePid) && panePid > 0 && !aliveProcess(panePid)) return { state: 'anomaly', finding: 'pane process is gone while the pane is alive' };
  if (!session) return { state: 'unknown' };
  if (!aliveProcess(session.pid)) return { state: 'anomaly', finding: 'host session process is gone while the pane is alive' };
  if (p.kind || !BUSY.has(session.status)) return { state: 'ok' };
  const activity = transcriptActivity(session.sessionId);
  if (!activity) return { state: 'unknown' };
  const newest = Math.max(activity.main, activity.sub ?? 0);
  const minutesAgo = t => ((now - t) / 6e4).toFixed(1);
  if (now - newest < minutes * 60000) return { state: 'ok' };
  const running = test();
  if (running === null) return { state: 'unknown' };
  if (running) return { state: 'ok' };
  return { state: 'anomaly', finding: `host status ${session.status} without activity`,
    text: `status ${session.status} since ${minutesAgo(session.statusAt)} min; main transcript idle ${minutesAgo(activity.main)} min; ` +
      `${activity.sub === null ? 'no running subagent' : `subagent transcript idle ${minutesAgo(activity.sub)} min`}; no running test` };
}

// Phase state in pane options: @qatlas-health (last result) and @qatlas-health-at (ms). An event is written
// when a pane turns anomalous; any other result re-arms it.
function recordHealth(repo, minutes, code) {
  const now = Date.now();
  const due = allPanes(repo).filter(p => {
    if (p.dead) { for (const name of ['@qatlas-health', '@qatlas-health-at']) tmux(['set', '-p', '-u', '-t', p.pane, name]); return false; }
    const at = Number(option(p.pane, '@qatlas-health-at'));
    return !at || now - at >= minutes * 60000;
  });
  if (!due.length) return;
  const sessions = hostSessions();
  let active;
  const test = () => (active === undefined ? (active = testActive(code)) : active);
  for (const p of due) {
    const result = paneHealth(p, sessions.get(p.pane), test, now, minutes);
    const before = option(p.pane, '@qatlas-health');
    setOption(p.pane, '@qatlas-health-at', String(now));
    setOption(p.pane, '@qatlas-health', result.state);
    if (result.state === 'anomaly' && before !== 'anomaly') {
      record(repo, 'health', { package: p.package, role: p.role === 'integrator' ? p.role : null, pane: p.pane,
        text: `Health check: ${result.finding}${result.text ? '; ' + result.text : ''}.` });
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

// Exclusive section for the detection of exited, stale, disk and health: mkdir is atomic. A lock older than
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
  const health = positive('--health') ?? 30;
  const code = codeRepo(repo);
  for (;;) {
    if (role === 'supervisor') {
      detectLocked(repo, () => { recordExits(repo); recordStale(repo, stale); recordDisk(repo, minFree); recordHealth(repo, health, code); });
    }
    const all = events(repo);
    // A new run starts a new log, so an old cursor would match nothing and wait would hang silently.
    if (since > all.length) fail(`--since ${since} is past the end of the event log (${all.length} events); a new run started a new log, pass --since 0`, 2);
    const last = role === 'integrator' ? lastSignals(all) : null;
    const hits = all.filter(e => e.seq >= since && wakes.has(e.type) && (!last || last.get(e.pane) === e));
    if (hits.length) return out({ events: hits, cursor: all.length, timeout: false });
    if (Date.now() >= end) return out({ events: [], cursor: all.length, timeout: true });
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// True if the call would set a new or changed signal. Same signal: a question with the same text, a handover
// of the same task; a changed report replaces the open one only while no answer exists.
function setsSignal(repo, pane, kind, text, task) {
  const same = option(pane, '@qatlas-kind') === kind && (kind === 'handover' ? option(pane, '@qatlas-task') === task : option(pane, '@qatlas-text') === text);
  return !same || (option(pane, '@qatlas-text') !== text && pendingAnswer(repo, pane) === null);
}

// Without a reachable pane the handover is validated, so the rejection stays independent of tmux.
function handoverNeedsValidation(text, task) {
  if (flag('--role') !== null) return true;
  const repo = repoKey();
  try {
    const hit = allPanes(repo).find(p => p.package === flag('--package') && p.role !== 'integrator');
    return !hit || setsSignal(repo, hit.pane, 'handover', text, task);
  } catch { return true; }
}

// A repeated call with the same signal keeps waiting and never discards an answer that has arrived
// meanwhile. At most one open signal per pane; an open signal of the other kind is an error.
async function raise(kind, text, task) {
  const repo = repoKey();
  if (kind === 'handover' && flag('--role') !== null) fail('Only a lead hands over; the integrator integrates.', 2);
  const pane = target();
  const timeout = Number(flag('--timeout') || 100) * 1000;
  const title = option(pane, '@qatlas-title') || option(pane, 'pane_title');
  const open = option(pane, '@qatlas-kind');
  if (open && open !== kind) fail(`Pane ${pane} already has an open signal (${open}).`);
  const changed = setsSignal(repo, pane, kind, text, task);
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
    checkTrees(branch, `branch ${branch}`);
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
  checkTrees(head, `head ${head}`);
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
  if (kind === 'handover' && pendingAnswer(repo, pane) !== null) fail(`Handover in ${pane} is already answered; the lead has not picked it up yet.`, 2);
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
  const continues = opts.includes('--continues') ? flag('--continues') || fail('Missing: --continues', 2) : null;
  if (continues !== null) {
    const all = events(repo);
    const plans = all.filter(e => e.type === 'plan').flatMap(e => { try { return [{ package: e.package, ...JSON.parse(e.text) }]; } catch { return []; } });
    const from = plans.filter(p => p.package === continues).pop();
    if (!from) fail('--continues: package was never planned: ' + continues, 2);
    if (!all.some(e => e.type === 'closed' && e.package === continues)) fail('--continues: package is not closed: ' + continues, 2);
    if (plans.some(p => p.package === name)) fail('Package already planned: ' + name, 2);
    if (plans.some(p => p.continues === continues)) fail('--continues: package already has a continuation: ' + continues, 2);
    const runBudget = plans[plans.length - 1].budget;
    if (budget !== runBudget) fail(`A continuation keeps the run budget ${runBudget}`, 2);
    const foreign = ids.filter(id => !from.tasks.includes(id));
    if (foreign.length) fail(`--continues: tasks not in package ${continues}: ${foreign.join(',')}`, 2);
  }
  const entry = { budget, tasks: ids, ...(continues !== null ? { continues } : {}) };
  record(repo, 'plan', { package: name, text: JSON.stringify(entry) });
  out({ planned: name, ...entry, cursor: events(repo).length });
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
  const plan = { budget: null, packages: {}, continuations: {} };
  const integrator = { vorhanden: false, rueckfragen: 0 };
  const lastIntegrated = {};
  for (const e of list) {
    if (!RESERVED.has(e.type) && !INTEGRATION.has(e.type) && e.type !== 'unlesbar') {
      (notes[e.type] ||= []).push(Object.fromEntries(['package', 'task', 'text'].filter(k => e[k]).map(k => [k, e[k]])));
    }
    if (e.type === 'plan') {
      try {
        const p = JSON.parse(e.text);
        plan.budget = p.budget;
        if (p.continues) plan.continuations[e.package] = { continues: p.continues, tasks: p.tasks }; else plan.packages[e.package] = p.tasks;
      } catch { /* skip */ }
    }
    const pkg = e.package && (packages[e.package] ||= { rueckfragen: 0, start: null });
    if (e.type === 'start' && pkg) pkg.start = time(e);
    if (e.type === 'question' && pkg) pkg.rueckfragen++;
    if (e.type === 'done' && pkg && Array.isArray(e.rest)) pkg.rest = e.rest;
    if (e.role === 'integrator') {
      integrator.vorhanden = true;
      if (e.type === 'question') integrator.rueckfragen++;
    }
    if (Object.hasOwn(log, e.type)) log[e.type]++;
    if (!e.task) continue;
    const t = tasks[e.task] ||= { package: e.package || null, durchlaufzeit: null, wartezeit: null, rework: 0, baseRework: 0, handovers: 0 };
    if (e.type === 'handover') {
      if (!t.handovers++) {
        const from = Math.max(pkg?.start ?? -Infinity, lastIntegrated[e.package] ?? -Infinity);
        if (Number.isFinite(from)) t.durchlaufzeit = secs(time(e) - from);
      }
      t.lastHandover = time(e);
    } else if (e.type === 'answer' && /^integrated\b/.test(e.text || '')) {
      if (t.lastHandover !== undefined) t.wartezeit = secs(time(e) - t.lastHandover);
      lastIntegrated[e.package] = time(e);
    } else if (e.type === 'answer' && /^rework base moved\b/.test(e.text || '')) {
      t.baseRework++;
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

function captureTo(repo, pane) {
  const content = plainPane(tmux(['capture-pane', '-e', '-p', '-J', '-S', '-', '-t', pane])) + '\n';
  const file = writeUnique(eventsDir(repo), safe(flag('--package') ?? flag('--role')), '.log', content);
  record(repo, 'captured', { ...who(), pane, text: file });
  return file;
}

function capture() {
  const repo = repoKey();
  const pane = target();
  out({ pane, file: captureTo(repo, pane) });
}

function closePane(repo, pane) {
  const win = tmux(['display', '-p', '-t', pane, '#{window_id}']);
  const session = tmux(['display', '-p', '-t', pane, '#{session_id}']);
  const last = panes(win).length === 1;
  tmux(['kill-pane', '-t', pane]);
  if (!last) layout(win);
  let sessionClosed = false;
  try { tmux(['has-session', '-t', session]); } catch { sessionClosed = true; }
  record(repo, 'closed', { ...who(), pane });
  return { closed: pane, windowClosed: last, sessionClosed };
}

const close = () => { const repo = repoKey(); out(closePane(repo, target())); };

function title() {
  const repo = repoKey();
  const pane = target();
  const [text] = need('--title');
  const done = text.startsWith('FERTIG') && !option(pane, 'pane_title').startsWith('FERTIG');
  const rest = opts.includes('--rest') ? idList('--rest') : null;
  if (rest && (flag('--role') !== null || !done)) fail('--rest needs a lead pane whose title turns FERTIG with this call', 2);
  setTitle(pane, text);
  if (done) record(repo, 'done', { ...who(), pane, text, rest });
  out({ pane, title: text, ...(rest ? { rest } : {}) });
}

try {
  if (command === 'add') add();
  else if (command === 'list') list();
  else if (command === 'context') contextCommand();
  else if (command === 'title') title();
  else if (command === 'wait') wait().catch(error => fail(error.message));
  else if (command === 'ask') raise('question', need('--question')[0]).catch(error => fail(error.message));
  else if (command === 'handover') { const [task] = need('--task'); const text = reportText(); if (handoverNeedsValidation(text, task)) validateHandover(text, codeRepo(repoKey())); raise('handover', text, task).catch(error => fail(error.message)); }
  else if (command === 'cut') cut(codeRepo(repoKey()));
  else if (command === 'answer') answer();
  else if (command === 'log') logEvent();
  else if (command === 'nudge') nudge();
  else if (command === 'plan') plan();
  else if (command === 'report') report();
  else if (command === 'capture') capture();
  else if (command === 'close') close();
  else fail('Commands: add, list, context, title, wait, ask, handover, cut, answer, log, nudge, plan, report, capture, close', 2);
} catch (error) {
  fail((error.stderr ? String(error.stderr).trim() : '') || error.message);
}
