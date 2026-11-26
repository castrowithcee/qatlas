#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const qatlasRoot = path.resolve(__dirname, '..', 'plugins', 'qatlas');
const sentinel = path.resolve(__dirname, '..', 'plugins', 'qatlas-sentinel', 'skills', 'qatlas-sentinel', 'scripts', 'qatlas-sentinel.js');
const runner = path.join(qatlasRoot, 'skills', 'qatlas', 'modes', 'run', 'scripts', 'qatlas-run.js');
const backlog = path.join(qatlasRoot, 'scripts', 'qatlas-backlog.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qatlas-sentinel-'));
// Every spawned script works in a temporary home, never in the real one.
process.env.HOME = path.join(root, 'home');
fs.mkdirSync(process.env.HOME);

const node = (script, args, input) => {
  const res = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', input });
  assert.strictEqual(res.status, 0, `${path.basename(script)} ${args.join(' ')}: ${res.stderr}`);
  return JSON.parse(res.stdout);
};
const repo = name => {
  const dir = path.join(root, name);
  fs.mkdirSync(dir);
  execFileSync('git', ['init', '-q', dir]);
  execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'init']);
  return dir;
};
const binding = (dir, text) => {
  fs.mkdirSync(path.join(dir, '.qatlas-brain', 'backlog'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.qatlas-brain', 'backlog', 'BACKLOG.md'), text);
};

try {
  const ws = repo('workspace');
  const local = repo('local');
  const external = repo('external');
  const plain = repo('plain');
  binding(local, '- **Zugang:** `node <plugin-root>/scripts/qatlas-backlog.js`\n');
  binding(external, '- **Zugang:** ein externes System\n');
  const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid' };
  execFileSync(process.execPath, [backlog, 'add', '--title', 'Prüfen', '--status', 'review', '--target', local], { env, stdio: 'ignore' });
  fs.writeFileSync(path.join(ws, 'qatlas-sentinel.json'), JSON.stringify({ format: 1, projects: [local, external, plain, path.join(root, 'gone')] }));

  const base = ['--workspace', ws, '--qatlas-root', qatlasRoot];
  const tick = (...extra) => node(sentinel, ['tick', ...base, ...extra]);
  const kinds = out => out.signals.map(s => `${s.project}:${s.kind}`).sort();

  // First tick: the review issue and the missing folder are new, the external system is left to the agent.
  const first = tick();
  assert.deepStrictEqual(kinds(first), ['gone:problem', 'local:review']);
  assert.deepStrictEqual(first.external.map(e => e.project), ['external']);
  // A hint is reported once.
  assert.deepStrictEqual(tick().signals, []);

  // An ended run with an open decision is reported once.
  const run = (...args) => node(runner, [...args, '--repo', plain]);
  run('begin');
  run('plan', '--package', 'p1', '--tasks', '1');
  assert.deepStrictEqual(tick().signals, []);
  // An active run without a new event for the stall time is reported once.
  const stateDir = require(path.join(qatlasRoot, 'scripts', 'runtime', 'project-store.js')).readState(ws);
  const stateFile = path.join(stateDir, 'sentinel', 'state.json');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  state.projects[plain].cursorAt -= 91 * 60000;
  fs.writeFileSync(stateFile, JSON.stringify(state));
  assert.deepStrictEqual(kinds(tick()), ['plain:run-stalled']);
  assert.deepStrictEqual(tick().signals, []);
  run('log', '--type', 'entscheiden', '--text', 'Frage an den Nutzer');
  run('end');
  const ended = tick();
  assert.deepStrictEqual(kinds(ended), ['plain:run-decisions']);
  assert.match(ended.signals[0].text, /1 Entscheidung offen/);
  assert.deepStrictEqual(tick().signals, []);

  // External issues: new ones once, an outage once, and no repeat of known issues after it.
  const seen = (input, ...extra) => node(sentinel, ['seen', ...base, '--project', external, ...extra], input);
  const issues = JSON.stringify([{ id: 7, title: 'Freigabe', status: 'review', url: 'https://example.invalid/7' }, { id: 8, title: 'Offen', status: 'ready' }]);
  assert.deepStrictEqual(kinds(seen(issues)), ['external:review']);
  assert.deepStrictEqual(seen(issues).signals, []);
  const outage = seen('Zugang gesperrt $(touch pwned)\n', '--unreachable');
  assert.deepStrictEqual(kinds(outage), ['external:problem']);
  assert.strictEqual(outage.signals[0].text, 'Planungssystem nicht erreichbar: Zugang gesperrt $(touch pwned)');
  assert.deepStrictEqual(seen(issues).signals, []);
  const waiting = JSON.stringify([{ id: 7, title: 'Freigabe', status: 'waiting' }]);
  assert.deepStrictEqual(kinds(seen(waiting)), ['external:waiting']);

  // notify: no module, a working module and a failing one.
  const hooks = path.join(process.env.HOME, '.qatlas', 'plugins', 'hooks');
  // The message arrives on stdin and stays literal, whatever a foreign issue title holds.
  const message = 'Zwei Hinweise: $(touch pwned) `id` "x"';
  const notify = () => node(sentinel, ['notify', '--workspace', ws], message + '\n');
  assert.strictEqual(spawnSync(process.execPath, [sentinel, 'notify', '--workspace', ws, '--text', 'x'], { input: '' }).status, 2,
    'A message on the command line is not accepted.');
  assert.deepStrictEqual(notify(), { hook: 'none' });
  fs.mkdirSync(hooks, { recursive: true });
  const received = path.join(root, 'received.json');
  fs.writeFileSync(path.join(hooks, 'sentinel.js'), `require('fs').writeFileSync(${JSON.stringify(received)}, require('fs').readFileSync(0, 'utf8'));`);
  assert.deepStrictEqual(notify(), { hook: 'ok' });
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(received, 'utf8')), { event: 'sentinel', workspace: ws, text: message });
  fs.writeFileSync(path.join(hooks, 'sentinel.js'), `process.stderr.write('kaputt\\n'); process.exit(1);`);
  assert.deepStrictEqual(notify(), { hook: 'failed', detail: 'kaputt' });

  process.stdout.write('✓ Qatlas-Sentinel: Takt, einmalige Hinweise und Meldemodul erfolgreich.\n');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
