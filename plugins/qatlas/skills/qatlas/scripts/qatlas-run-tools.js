#!/usr/bin/env node
'use strict';

// Mechanische Hilfsbefehle für qatlas run und qatlas sentinel mit eindeutiger Ausgabe. Alle Befehle arbeiten
// im Git-Repo von --repo (Standard: aktuelles Verzeichnis).
// Aufruf:
//   qatlas-run-tools.js probe --branch <branch> [--base <ref>] [--repo <pfad>]
//     Prüft per Trockenmerge, ob <branch> konfliktfrei in <base> aufgeht (Standard: origin/HEAD).
//     Ausgabe: {"result":"clean","base","branch","tree"} oder {"result":"conflict",...,"files":[...]}.
//     Exit: 0 sauber, 1 Konflikt, 2 Aufruffehler, 3 Prüfung nicht möglich.
//   qatlas-run-tools.js ci-wait --pr <nummer> [--timeout <sekunden>] [--interval <sekunden>] [--repo <pfad>]
//     Wartet über gh, bis kein Check der Pull Request mehr läuft (Standard: Timeout 3600, Intervall 20).
//     Transiente gh-Fehler werden wiederholt, höchstens 5 aufeinanderfolgende.
//     Ausgabe: {"pr","result":"pass"|"fail"|"timeout","checks":[{name,bucket,link}],"retries"}.
//     Exit: 0 pass, 1 fail, 4 timeout, 2 Aufruffehler, 3 gh fehlt, nicht angemeldet oder dauerhaft fehlerhaft.
//   qatlas-run-tools.js slot [--slots <anzahl>] [--repo <pfad>] -- <befehl> [argumente...]
//     Führt den Befehl erst aus, wenn einer der Testslots frei ist, und gibt den Slot danach frei. Die
//     Slot-Anzahl kommt aus --slots, sonst aus test-slots in ~/.qatlas/plugins/orchestra.yaml, sonst 2.
//     Die Sperren liegen im primären Arbeitsbaum, sodass auch Worktrees sie sehen. Keine JSON-Ausgabe;
//     der Exit-Code des Befehls wird durchgereicht (Signal: 128 plus Signalnummer).

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
const need = (...names) => names.map(name => flag(name) || fail('Fehlt: ' + name, 2));
const repo = path.resolve(flag('--repo') || process.cwd());
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const number = (name, fallback) => {
  const raw = flag(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  return /^\d+(\.\d+)?$/.test(raw) && value > 0 ? value : fail(`Ungültig: ${name} braucht eine positive Zahl`, 2);
};

const git = args => execFileSync('git', ['-C', repo, ...args],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).trim();

function probe() {
  const [branch] = need('--branch');
  let base = flag('--base');
  if (!base) {
    try { base = git(['rev-parse', '--abbrev-ref', 'origin/HEAD']); } catch { base = null; }
    if (!base || base === 'origin/HEAD') fail('origin/HEAD ist nicht auflösbar; --base angeben', 2);
  }
  const run = spawnSync('git', ['-C', repo, 'merge-tree', '--write-tree', '--name-only', '--no-messages', base, branch],
    { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (run.error || (run.status !== 0 && run.status !== 1)) {
    fail('Prüfung nicht möglich: ' + (run.error ? run.error.message : (run.stderr || '').trim() || 'Exit ' + run.status), 3);
  }
  const lines = run.stdout.split('\n');
  const tree = lines[0].trim();
  if (!/^[0-9a-f]{40,64}$/.test(tree)) fail('Prüfung nicht möglich: unerwartete Ausgabe von git merge-tree', 3);
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
  if (!/^\d+$/.test(pr)) fail('Ungültig: --pr braucht eine Nummer', 2);
  const timeout = number('--timeout', 3600) * 1000;
  const interval = number('--interval', 20) * 1000;
  const deadline = Date.now() + timeout;
  const result = (state, checks, retries) => out({ pr: Number(pr), result: state, checks, retries });
  const view = list => list.map(({ name, bucket, link }) => ({ name, bucket, link }));
  let retries = 0, streak = 0, first = true, checks = [], lastError = '';

  for (;;) {
    const run = spawnSync('gh', ['pr', 'checks', pr, '--json', 'name,state,bucket,link'],
      { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26 });
    if (run.error && run.error.code === 'ENOENT') fail('gh fehlt; die GitHub CLI installieren', 3);
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
        fail('gh ist nicht angemeldet: ' + stderr, 3);
      }
      lastError = stderr || (run.error ? run.error.message : 'keine gültige JSON-Ausgabe');
      streak += 1;
      retries += 1;
      if (streak >= 5) fail('gh pr checks schlug 5-mal in Folge fehl: ' + lastError, 3);
    }
    first = false;
    if (Date.now() + interval > deadline) { result('timeout', view(checks), retries); process.exit(4); }
    sleep(interval);
  }
}

function slotCount() {
  const given = flag('--slots');
  if (given !== null) return /^[1-9]\d*$/.test(given) ? Number(given) : fail('Ungültig: --slots braucht eine positive Ganzzahl', 2);
  const file = path.join(os.homedir(), '.qatlas', 'plugins', 'orchestra.yaml');
  if (!fs.existsSync(file)) return 2;
  try {
    const { parseYamlText } = require('../../../scripts/runtime/config-loader.js');
    const value = parseYamlText(fs.readFileSync(file, 'utf8'))['test-slots'];
    if (value === undefined) return 2;
    if (Number.isInteger(value) && value > 0) return value;
  } catch (error) {
    fail('orchestra.yaml nicht lesbar: ' + error.message, 3);
  }
  return fail('Ungültig: test-slots in orchestra.yaml braucht eine positive Ganzzahl', 3);
}

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; }
}

function slot() {
  if (!rest.length) fail('Fehlt: Befehl nach --', 2);
  const slots = slotCount();
  let common;
  try { common = git(['rev-parse', '--path-format=absolute', '--git-common-dir']); } catch (error) {
    fail('Kein Git-Repo: ' + repo, 3);
  }
  const dir = path.join(path.dirname(common), '.qatlas', 'local', 'slots');
  fs.mkdirSync(dir, { recursive: true });

  const owner = lock => path.join(lock, 'owner');
  const orphaned = lock => {
    let pid;
    try { pid = Number(fs.readFileSync(owner(lock), 'utf8').split('\n')[0]); } catch {
      // Ordner ohne Eigentümerdatei: nur verwaist, wenn er älter als wenige Sekunden ist.
      try { return Date.now() - fs.statSync(lock).mtimeMs > 10000; } catch { return false; }
    }
    return !Number.isInteger(pid) || pid <= 0 || !alive(pid);
  };
  const take = () => {
    for (let i = 1; i <= slots; i++) {
      const lock = path.join(dir, String(i));
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          fs.mkdirSync(lock);
          fs.writeFileSync(owner(lock), `${process.pid}\n${new Date().toISOString()}\n`);
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

  let lock = take();
  if (!lock) {
    process.stderr.write(`Warte auf einen freien Testslot (${slots} Slots)\n`);
    while (!(lock = take())) sleep(2000);
  }

  let released = false;
  const release = () => { if (!released) { released = true; fs.rmSync(lock, { recursive: true, force: true }); } };
  const child = spawn(rest[0], rest.slice(1), { stdio: 'inherit' });
  let signalled = null;
  for (const name of ['SIGINT', 'SIGTERM']) {
    process.on(name, () => { signalled = name; child.kill(name); });
  }
  child.on('error', error => { release(); fail('Befehl nicht startbar: ' + error.message, 127); });
  child.on('exit', (code, signal) => {
    release();
    const name = signal || signalled;
    process.exit(code !== null ? code : 128 + (os.constants.signals[name] || 0));
  });
}

const commands = { probe, 'ci-wait': ciWait, slot };
if (!commands[command]) fail('Befehle: ' + Object.keys(commands).join(', '), 2);
commands[command]();
