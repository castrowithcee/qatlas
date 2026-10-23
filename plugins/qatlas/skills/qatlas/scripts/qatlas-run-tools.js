#!/usr/bin/env node
'use strict';

// Mechanical helper commands for qatlas run and qatlas sentinel. All commands work
// in the git repo of --repo (default: current directory).
// Usage:
//   qatlas-run-tools.js probe --branch <branch> [--base <ref>] [--repo <path>]
//     Dry-run merge: does <branch> merge into <base> cleanly (default: origin/HEAD).
//     Output: {"result":"clean","base","branch","tree"} or {"result":"conflict",...,"files":[...]}.
//     Exit: 0 clean, 1 conflict, 2 usage error, 3 check not possible.
//   qatlas-run-tools.js ci-wait --pr <number> [--timeout <seconds>] [--interval <seconds>] [--repo <path>]
//     Waits via gh until no check of the pull request is running (default: timeout 3600, interval 20).
//     Transient gh errors are retried, at most 5 in a row.
//     Output: {"pr","result":"pass"|"fail"|"timeout","checks":[{name,bucket,link}],"retries"}.
//     Exit: 0 pass, 1 fail, 4 timeout, 2 usage error, 3 gh missing, not logged in or persistently failing.
//   qatlas-run-tools.js slot [--slots <count>] [--priority] [--repo <path>] -- <command> [args...]
//     Runs the command once a test slot is free and releases the slot afterwards. Slot count:
//     --slots, else test-slots in ~/.qatlas/plugins/orchestra.yaml, else 2. Waiting callers are
//     served in arrival order; --priority queues ahead of every caller without it.
//     Locks live in the primary working tree so worktrees see them. No JSON output;
//     the command exit code is passed through (signal: 128 plus signal number).
//   qatlas-run-tools.js slot [--slots <count>] [--repo <path>] status
//     Read-only view of the test slots; "status" without "--" (after "--" it is a command to run).
//     Output: {"slots","busy":[{slot,pid,started,cwd,command,orphaned}],
//     "waiting":[{priority,arrival,pid,cwd,command,orphaned}]}; unknown fields are null. Exit: 0, 3 no git repo.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn, spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const command = argv[0];
const sep = argv.indexOf('--');
const opts = sep >= 0 ? argv.slice(1, sep) : argv.slice(1);
const rest = sep >= 0 ? argv.slice(sep + 1) : [];
const flag = name => { const i = opts.indexOf(name); return i >= 0 ? opts[i + 1] : null; };

const out = value => process.stdout.write(JSON.stringify(value) + '\n');
const fail = (message, code = 1) => { process.stderr.write(message + '\n'); process.exit(code); };
const need = (...names) => names.map(name => flag(name) || fail('Missing: ' + name, 2));
const repo = path.resolve(flag('--repo') || process.cwd());
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const number = (name, fallback) => {
  const raw = flag(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  return /^\d+(\.\d+)?$/.test(raw) && value > 0 ? value : fail(`Invalid: ${name} needs a positive number`, 2);
};

const git = args => execFileSync('git', ['-C', repo, ...args],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).trim();

function probe() {
  const [branch] = need('--branch');
  let base = flag('--base');
  if (!base) {
    try { base = git(['rev-parse', '--abbrev-ref', 'origin/HEAD']); } catch { base = null; }
    if (!base || base === 'origin/HEAD') fail('origin/HEAD cannot be resolved; pass --base', 2);
  }
  const run = spawnSync('git', ['-C', repo, 'merge-tree', '--write-tree', '--name-only', '--no-messages', base, branch],
    { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (run.error || (run.status !== 0 && run.status !== 1)) {
    fail('Check not possible: ' + (run.error ? run.error.message : (run.stderr || '').trim() || 'Exit ' + run.status), 3);
  }
  const lines = run.stdout.split('\n');
  const tree = lines[0].trim();
  if (!/^[0-9a-f]{40,64}$/.test(tree)) fail('Check not possible: unexpected output from git merge-tree', 3);
  if (run.status === 0) { out({ result: 'clean', base, branch, tree }); return; }
  const files = [];
  for (const line of lines.slice(1)) {
    if (line === '') break;
    if (!files.includes(line)) files.push(line);
  }
  out({ result: 'conflict', base, branch, tree, files });
  process.exit(1);
}

function ciWait() {
  const [pr] = need('--pr');
  if (!/^\d+$/.test(pr)) fail('Invalid: --pr needs a number', 2);
  const timeout = number('--timeout', 3600) * 1000;
  const interval = number('--interval', 20) * 1000;
  const deadline = Date.now() + timeout;
  const result = (state, checks, retries) => out({ pr: Number(pr), result: state, checks, retries });
  const view = list => list.map(({ name, bucket, link }) => ({ name, bucket, link }));
  let retries = 0, streak = 0, first = true, checks = [], lastError = '';

  for (;;) {
    const run = spawnSync('gh', ['pr', 'checks', pr, '--json', 'name,state,bucket,link'],
      { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26 });
    if (run.error && run.error.code === 'ENOENT') fail('gh is missing; install the GitHub CLI', 3);
    const stderr = (run.stderr || '').trim();
    let parsed = null;
    try { parsed = JSON.parse(run.stdout); } catch { parsed = null; }
    if (Array.isArray(parsed)) {
      streak = 0;
      checks = parsed;
      if (checks.some(c => c.bucket === 'fail' || c.bucket === 'cancel')) { result('fail', view(checks), retries); process.exit(1); }
      if (checks.length && !checks.some(c => c.bucket === 'pending')) { result('pass', view(checks), retries); return; }
    } else if (/no checks reported/i.test(stderr)) {
      streak = 0;
      checks = [];
    } else {
      if (first && /gh auth login|not logged in|authentication|GH_TOKEN/i.test(stderr)) {
        fail('gh is not logged in: ' + stderr, 3);
      }
      lastError = stderr || (run.error ? run.error.message : 'no valid JSON output');
      streak += 1;
      retries += 1;
      if (streak >= 5) fail('gh pr checks failed 5 times in a row: ' + lastError, 3);
    }
    first = false;
    if (Date.now() + interval > deadline) { result('timeout', view(checks), retries); process.exit(4); }
    sleep(interval);
  }
}

function slotCount() {
  const given = flag('--slots');
  if (given !== null) return /^[1-9]\d*$/.test(given) ? Number(given) : fail('Invalid: --slots needs a positive integer', 2);
  const file = path.join(os.homedir(), '.qatlas', 'plugins', 'orchestra.yaml');
  if (!fs.existsSync(file)) return 2;
  try {
    const { parseYamlText } = require('../../../scripts/runtime/config-loader.js');
    const value = parseYamlText(fs.readFileSync(file, 'utf8'))['test-slots'];
    if (value === undefined) return 2;
    if (Number.isInteger(value) && value > 0) return value;
  } catch (error) {
    fail('orchestra.yaml not readable: ' + error.message, 3);
  }
  return fail('Invalid: test-slots in orchestra.yaml needs a positive integer', 3);
}

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; }
}

// Working directory and command of the caller, stored after the PID in owner files and tickets.
const detail = () => JSON.stringify({ cwd: process.cwd(), command: rest });
const readDetail = text => {
  try {
    const { cwd, command } = JSON.parse(text);
    return { cwd: typeof cwd === 'string' ? cwd : null, command: Array.isArray(command) ? command : null };
  } catch { return { cwd: null, command: null }; }
};
const slotDir = () => {
  let common;
  try { common = git(['rev-parse', '--path-format=absolute', '--git-common-dir']); } catch (error) {
    fail('Not a git repo: ' + repo, 3);
  }
  return path.join(path.dirname(common), '.qatlas', 'local', 'slots');
};
const ownerFile = lock => path.join(lock, 'owner');
const orphaned = lock => {
  let pid;
  try { pid = Number(fs.readFileSync(ownerFile(lock), 'utf8').split('\n')[0]); } catch {
    // Folder without owner file: orphaned only if older than a few seconds.
    try { return Date.now() - fs.statSync(lock).mtimeMs > 10000; } catch { return false; }
  }
  return !Number.isInteger(pid) || pid <= 0 || !alive(pid);
};

function slotStatus() {
  const slots = slotCount();
  const dir = slotDir();
  const list = folder => { try { return fs.readdirSync(folder); } catch { return []; } };
  const busy = list(dir).filter(entry => /^\d+$/.test(entry)).sort((a, b) => a - b).flatMap(entry => {
    const lock = path.join(dir, entry);
    let text = null;
    try { text = fs.readFileSync(ownerFile(lock), 'utf8'); } catch { /* no owner file yet */ }
    const lines = text === null ? [] : text.split('\n');
    const pid = Number(lines[0]);
    return [{
      slot: Number(entry),
      pid: Number.isInteger(pid) && pid > 0 ? pid : null,
      started: lines[1] || null,
      ...readDetail(lines[2]),
      orphaned: orphaned(lock),
    }];
  });
  const queue = path.join(dir, 'queue');
  const waiting = list(queue).sort().flatMap(entry => {
    const match = /^(\d+)-(\d+)-(\d+)$/.exec(entry);
    if (!match) return [];
    let text = '';
    try { text = fs.readFileSync(path.join(queue, entry), 'utf8'); } catch { /* ticket just removed */ }
    return [{
      priority: Number(match[1]) === 0,
      arrival: new Date(Number(match[2])).toISOString(),
      pid: Number(match[3]),
      ...readDetail(text),
      orphaned: !alive(Number(match[3])),
    }];
  });
  out({ slots, busy, waiting });
}

function slot() {
  const isStatus = sep < 0 && opts.some((arg, i) => arg === 'status' && !['--slots', '--repo'].includes(opts[i - 1]));
  if (isStatus) return slotStatus();
  if (!rest.length) fail('Missing: command after --', 2);
  const slots = slotCount();
  const dir = slotDir();
  fs.mkdirSync(dir, { recursive: true });

  const take = () => {
    for (let i = 1; i <= slots; i++) {
      const lock = path.join(dir, String(i));
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          fs.mkdirSync(lock);
          fs.writeFileSync(ownerFile(lock), `${process.pid}\n${new Date().toISOString()}\n${detail()}\n`);
          return lock;
        } catch (error) {
          if (error.code !== 'EEXIST') throw error;
          if (!orphaned(lock)) break;
          fs.rmSync(lock, { recursive: true, force: true });
        }
      }
    }
    return null;
  };

  // Ticket names sort by priority, then arrival; only the oldest live ticket may take a slot.
  const queue = path.join(dir, 'queue');
  fs.mkdirSync(queue, { recursive: true });
  const name = `${opts.includes('--priority') ? 0 : 1}-${String(Date.now()).padStart(15, '0')}-${process.pid}`;
  const ticket = path.join(queue, name);
  fs.writeFileSync(ticket, detail() + '\n', { flag: 'wx' });
  const first = () => fs.readdirSync(queue).sort().find(entry => {
    if (alive(Number(entry.split('-')[2]))) return true;
    fs.rmSync(path.join(queue, entry), { force: true });
    return false;
  }) === name;

  let lock = first() && take();
  if (!lock) {
    process.stderr.write(`Waiting for a free test slot (${slots} slots)\n`);
    while (!(lock = first() && take())) sleep(2000);
  }
  fs.rmSync(ticket, { force: true });

  let released = false;
  const release = () => { if (!released) { released = true; fs.rmSync(lock, { recursive: true, force: true }); } };
  const child = spawn(rest[0], rest.slice(1), { stdio: 'inherit' });
  let signalled = null;
  for (const name of ['SIGINT', 'SIGTERM']) {
    process.on(name, () => { signalled = name; child.kill(name); });
  }
  child.on('error', error => { release(); fail('Command could not be started: ' + error.message, 127); });
  child.on('exit', (code, signal) => {
    release();
    const name = signal || signalled;
    process.exit(code !== null ? code : 128 + (os.constants.signals[name] || 0));
  });
}

const commands = { probe, 'ci-wait': ciWait, slot };
if (!commands[command]) fail('Commands: ' + Object.keys(commands).join(', '), 2);
commands[command]();
