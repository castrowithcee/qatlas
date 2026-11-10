#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn, spawnSync } = require('child_process');

const skill = path.resolve(__dirname, '..', 'plugins', 'qatlas', 'skills', 'qatlas');
const tools = path.join(skill, 'modes', 'team', 'scripts', 'qatlas-team-tools.js');
const team = path.join(skill, 'modes', 'team', 'scripts', 'qatlas-team.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qatlas-team-tools-'));
const gitDir = path.dirname(execFileSync('which', ['git'], { encoding: 'utf8' }).trim());

// gh stub, steered by files in $STUB_DIR: view.json, checks.json, merge-mode (same|different),
// merge-fail-first, (no checks.json: gh reports "no checks reported") merge-fail-after (merges, then reports failure), merge-calls (log), merge-oid. `pr merge` writes the squash commit to the bare remote.
const stub = `#!${process.execPath}
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const dir = process.env.STUB_DIR;
const read = name => { try { return fs.readFileSync(path.join(dir, name), 'utf8'); } catch { return null; } };
const [group, action, , ...rest] = process.argv.slice(2);
if (group === 'pr' && action === 'view') {
  if (process.argv.includes('mergeCommit')) {
    const oid = read('merge-oid');
    process.stdout.write(JSON.stringify({ mergeCommit: oid ? { oid: oid.trim() } : null }));
  } else process.stdout.write(read('view.json'));
} else if (group === 'pr' && action === 'checks') {
  const checks = read('checks.json');
  if (checks === null) { process.stderr.write("no checks reported on the 'task' branch\\n"); process.exit(1); }
  process.stdout.write(checks);
} else if (group === 'pr' && action === 'merge') {
  fs.appendFileSync(path.join(dir, 'merge-calls'), JSON.stringify(process.argv.slice(2)) + '\\n');
  const calls = read('merge-calls').trim().split('\\n').length;
  if (read('merge-fail-first') !== null && calls === 1) { process.stderr.write('transient failure\\n'); process.exit(1); }
  const git = (args, input, env) => execFileSync('git', args,
    { encoding: 'utf8', input, env: { ...process.env, GIT_DIR: read('bare').trim(), ...env } }).trim();
  const sha = process.argv[process.argv.indexOf('--match-head-commit') + 1];
  const index = path.join(dir, 'stub-index');
  const env = { GIT_INDEX_FILE: index };
  const mainTip = git(['rev-parse', 'refs/heads/main']);
  git(['read-tree', mainTip], undefined, env);
  const diff = git(['diff', git(['merge-base', mainTip, sha]), sha]) + '\\n';
  git(['apply', '--cached'], diff, env);
  if (read('merge-mode') === 'different') {
    const blob = git(['hash-object', '-w', '--stdin'], 'unexpected\\n');
    git(['update-index', '--add', '--cacheinfo', '100644,' + blob + ',extra.txt'], undefined, env);
  }
  const tree = git(['write-tree'], undefined, env);
  const commit = git(['commit-tree', tree, '-p', mainTip, '-m', 'squash'], undefined);
  git(['update-ref', 'refs/heads/main', commit]);
  fs.writeFileSync(path.join(dir, 'merge-oid'), commit);
  const view = JSON.parse(read('view.json'));
  fs.writeFileSync(path.join(dir, 'view.json'), JSON.stringify({ ...view, state: 'MERGED' }));
  if (read('merge-fail-after') !== null) { process.stderr.write('connection reset\\n'); process.exit(1); }
} else process.exit(64);
`;

const write = (file, content) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
const identity = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...identity } }).trim();
const commit = (repo, file, text) => { write(path.join(repo, file), text); git(repo, 'add', file); git(repo, 'commit', '-q', '-m', file); };

const bin = path.join(root, 'bin');
write(path.join(bin, 'gh'), stub);
fs.chmodSync(path.join(bin, 'gh'), 0o755);

const green = [{ name: 'build', state: 'SUCCESS', bucket: 'pass', link: 'http://x/1' }];
const red = [{ name: 'build', state: 'FAILURE', bucket: 'fail', link: 'http://x/1' }];

// Own bare remote, clone with main and branch "task" (one commit) per case.
function setup(name, { checks = green, mode = 'same', failFirst = false, failAfter = false, moved = false, head = null,
  extra = [] } = {}) {
  const base = path.join(root, name);
  const bare = path.join(base, 'remote.git');
  const repo = path.join(base, 'repo');
  const stubDir = path.join(base, 'stub');
  git(root, 'init', '-q', '--bare', '-b', 'main', bare);
  git(root, 'clone', '-q', bare, repo, '--no-checkout');
  git(repo, 'checkout', '-q', '-b', 'main');
  commit(repo, 'a.txt', 'a\n');
  git(repo, 'push', '-q', 'origin', 'main');
  git(repo, 'checkout', '-q', '-b', 'task');
  commit(repo, 'b.txt', 'b\n');
  for (const file of extra) commit(repo, file, file + '\n');
  git(repo, 'push', '-q', 'origin', 'task');
  if (moved) {
    const other = path.join(base, 'other');
    git(root, 'clone', '-q', bare, other);
    commit(other, 'c.txt', 'c\n');
    git(other, 'push', '-q', 'origin', 'HEAD:main');
  }
  const sha = git(repo, 'rev-parse', 'task');
  write(path.join(stubDir, 'bare'), bare);
  if (checks !== null) write(path.join(stubDir, 'checks.json'), JSON.stringify(checks));
  write(path.join(stubDir, 'merge-mode'), mode);
  write(path.join(stubDir, 'view.json'), JSON.stringify(
    { headRefOid: head || sha, headRefName: 'task', baseRefName: 'main', state: 'OPEN' }));
  if (failFirst) write(path.join(stubDir, 'merge-fail-first'), '');
  if (failAfter) write(path.join(stubDir, 'merge-fail-after'), '');
  write(path.join(base, 'report.md'),
    '---\nbranch: task\nbase: main\npr-title: "feat: add b"\npr-body: |\n  Body line\nlast: true\n---\nReport text\n');
  return { bare, repo, stubDir, sha, report: path.join(base, 'report.md') };
}

// PATH holds only the stub as gh, git and node: no real GitHub call is possible.
const env = stubDir => ({ ...process.env, ...identity, STUB_DIR: stubDir,
  PATH: [bin, gitDir, path.dirname(process.execPath)].join(':') });
const land = c => spawnSync(process.execPath, [tools, 'land', '--pr', '16', '--report', c.report,
  '--interval', '0.1', '--timeout', '2', '--repo', c.repo], { encoding: 'utf8', env: env(c.stubDir) });
const json = r => JSON.parse(r.stdout.trim().split('\n').pop());
const mergeCalls = c => { try { return fs.readFileSync(path.join(c.stubDir, 'merge-calls'), 'utf8').trim().split('\n'); } catch { return []; } };
const landWith = (c, ...more) => spawnSync(process.execPath, [tools, 'land', '--pr', '16', '--report', c.report,
  '--interval', '0.1', '--timeout', '30', '--repo', c.repo, ...more], { encoding: 'utf8', env: env(c.stubDir) });
const ciWait = c => spawnSync(process.execPath, [tools, 'ci-wait', '--pr', '16', '--interval', '0.1', '--timeout', '30', '--repo', c.repo],
  { encoding: 'utf8', env: env(c.stubDir) });
// Remote branch update (as GitHub "Update branch" or a push): clone, run fn, push to task and pull/16/head.
const remoteUpdate = (c, fn) => {
  const other = path.join(path.dirname(c.repo), 'updater');
  git(root, 'clone', '-q', c.bare, other);
  git(other, 'checkout', '-q', 'task');
  fn(other);
  git(other, 'push', '-q', 'origin', 'task');
  const tip = git(other, 'rev-parse', 'HEAD');
  git(c.bare, 'update-ref', 'refs/pull/16/head', tip);
  write(path.join(c.stubDir, 'view.json'), JSON.stringify({ headRefOid: tip, headRefName: 'task', baseRefName: 'main', state: 'OPEN' }));
  return tip;
};
const hasBranch = c => git(c.bare, 'branch', '--list', 'task') !== '';

function testSlotCount() {
  const home = path.join(root, 'slot-home');
  const repo = path.join(root, 'slot-repo');
  fs.mkdirSync(path.join(home, '.qatlas', 'plugins'), { recursive: true });
  fs.mkdirSync(repo);
  execFileSync('git', ['init', '-q', repo]);
  const team = path.join(home, '.qatlas', 'plugins', 'config.json');
  const status = () => spawnSync(process.execPath, [tools, 'slot', '--repo', repo, 'status'],
    { encoding: 'utf8', env: { ...process.env, HOME: home } });
  const slots = () => { const r = status(); assert.strictEqual(r.status, 0, r.stderr); return JSON.parse(r.stdout).slots; };
  assert.strictEqual(slots(), 2);
  fs.writeFileSync(team, JSON.stringify({ format: 1, team: { 'test-slots': 5 } }));
  assert.strictEqual(slots(), 5);
  fs.writeFileSync(team, JSON.stringify({ format: 1 }));
  assert.strictEqual(slots(), 2);
  for (const bad of [{ format: 1, team: { 'test-slots': 0 } }, { format: 1, team: { 'test-slots': 'x' } },
    { format: 2, team: { 'test-slots': 5 } }]) {
    fs.writeFileSync(team, JSON.stringify(bad));
    const r = status();
    assert.strictEqual(r.status, 3, JSON.stringify(bad));
    assert.ok(r.stderr.includes('config.json'));
  }
}

function testSlotResults() {
  const home = path.join(root, 'results-home');
  const repo = path.join(root, 'results-repo');
  fs.mkdirSync(home);
  fs.mkdirSync(path.join(repo, 'sub'), { recursive: true });
  const env = { ...process.env, HOME: home };
  const git = (...args) => execFileSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { encoding: 'utf8' }).trim();
  git('init', '-q');
  fs.writeFileSync(path.join(repo, 'a.txt'), 'a\n');
  fs.writeFileSync(path.join(repo, 'sub', 'b.txt'), 'b\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'one');

  // The side-effect file lies outside the worktree, so running the command never dirties it.
  const effects = path.join(root, 'results-effects');
  const count = () => (fs.existsSync(effects) ? fs.readFileSync(effects, 'utf8').length : 0);
  const mark = code => ['node', '-e', `require('fs').appendFileSync(${JSON.stringify(effects)},'x');process.exit(${code})`];
  const slot = (flags, command, cwd = repo) => spawnSync(process.execPath, [tools, 'slot', '--repo', repo, ...flags, '--', ...command],
    { encoding: 'utf8', env, cwd, timeout: 30000 });
  const sub = (...args) => spawnSync(process.execPath, [tools, 'slot', '--repo', repo, ...args], { encoding: 'utf8', env, cwd: repo });
  const results = (...args) => { const r = sub('results', ...args); assert.strictEqual(r.status, 0, r.stderr); return JSON.parse(r.stdout).results; };

  // Green run writes a record; the same key is not run again and names its origin.
  let r = slot([], mark(0));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(count(), 1);
  const tree = git('rev-parse', 'HEAD^{tree}');
  let list = results();
  assert.strictEqual(list.length, 1);
  assert.deepStrictEqual(Object.keys(list[0]).sort(), ['command', 'cwd', 'duration', 'exit', 'inputs', 'resource', 'time', 'tree']);
  assert.strictEqual(list[0].tree, tree);
  assert.strictEqual(list[0].cwd, '.');
  assert.strictEqual(list[0].resource, null);
  assert.strictEqual(list[0].exit, 0);
  assert.deepStrictEqual(list[0].inputs, []);
  r = slot([], mark(0));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(count(), 1, 'second call ran again');
  assert.ok(r.stderr.includes(tree.slice(0, 7)) && r.stderr.includes(list[0].time), r.stderr);

  // --no-cache runs and still records.
  assert.strictEqual(slot(['--no-cache'], mark(0)).status, 0);
  assert.strictEqual(count(), 2);
  assert.strictEqual(results().length, 1);

  // Different cwd, argv and resource are different keys.
  assert.strictEqual(slot([], mark(0), path.join(repo, 'sub')).status, 0);
  assert.strictEqual(count(), 3);
  assert.strictEqual(results().find(x => x.cwd === 'sub').cwd, 'sub');
  const other = [...mark(0), 'extra'];
  assert.strictEqual(slot([], other).status, 0);
  assert.strictEqual(count(), 4);
  assert.strictEqual(slot(['--resource', 'res'], mark(0)).status, 0);
  assert.strictEqual(count(), 5);
  assert.strictEqual(slot(['--resource', 'res'], mark(0)).status, 0);
  assert.strictEqual(count(), 5);
  assert.strictEqual(results().length, 4);

  // The unignored slot store inside this primary tree does not make it dirty; an untracked file elsewhere does.
  assert.ok(git('status', '--short').includes('.qatlas/'), 'store is expected unignored');

  // Dirty worktree (untracked file) neither reads nor writes.
  fs.writeFileSync(path.join(repo, 'dirty.txt'), 'x\n');
  const before = results().length;
  assert.strictEqual(slot([], mark(0)).status, 0);
  assert.strictEqual(count(), 6, 'dirty worktree reused a record');
  assert.strictEqual(slot([], mark(0), path.join(repo, 'sub')).status, 0);
  assert.strictEqual(count(), 7);
  assert.strictEqual(results().length, before);
  const times = results().map(x => x.time).join();
  assert.strictEqual(slot(['--no-cache'], mark(0)).status, 0);
  assert.strictEqual(count(), 8);
  assert.strictEqual(results().map(x => x.time).join(), times, 'dirty worktree wrote a record');
  fs.rmSync(path.join(repo, 'dirty.txt'));

  // A changed tree runs again and is recorded under the new tree.
  fs.writeFileSync(path.join(repo, 'a.txt'), 'changed\n');
  git('commit', '-q', '-am', 'two');
  const tree2 = git('rev-parse', 'HEAD^{tree}');
  assert.notStrictEqual(tree2, tree);
  assert.strictEqual(slot([], mark(0)).status, 0);
  assert.strictEqual(count(), 9);
  assert.strictEqual(results('--tree', tree2).length, 1);

  // Red runs write nothing and are not reused.
  assert.strictEqual(slot([], mark(3)).status, 3);
  assert.strictEqual(count(), 10);
  assert.strictEqual(slot([], mark(3)).status, 3);
  assert.strictEqual(count(), 11);
  assert.strictEqual(results('--tree', tree2).length, 1);

  // --tree filters by full or abbreviated tree; a short or invalid value is a usage error.
  assert.strictEqual(results('--tree', tree).length, 4);
  assert.strictEqual(results('--tree', tree.slice(0, 7)).length, 4);
  assert.strictEqual(results('--tree', '0'.repeat(7)).length, 0);
  assert.strictEqual(sub('results', '--tree', tree.slice(0, 4)).status, 2);
  assert.strictEqual(results().length, 5);

  // A record older than 24 hours is ignored on read and does not stop the run.
  const dir = path.join(repo, '.qatlas', 'local', 'slots', 'results');
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const record = JSON.parse(fs.readFileSync(full, 'utf8'));
    record.time = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
    fs.writeFileSync(full, JSON.stringify(record));
  }
  assert.deepStrictEqual(results(), []);
  assert.strictEqual(slot([], mark(0)).status, 0);
  assert.strictEqual(count(), 12);
  assert.strictEqual(results().length, 1);

  // --clear removes all records, also when there are none.
  assert.strictEqual(sub('results', '--clear').status, 0);
  assert.deepStrictEqual(results(), []);
  assert.strictEqual(sub('results', '--clear').status, 0);
  assert.strictEqual(slot([], mark(0)).status, 0);
  assert.strictEqual(count(), 13);

  // Unversioned inputs: content enters the key; ignored or untracked inputs do not dirty the worktree.
  fs.writeFileSync(path.join(repo, '.gitignore'), '.env\nmods/\n');
  git('add', '.gitignore');
  git('commit', '-q', '-m', 'ignore');
  fs.writeFileSync(path.join(repo, '.env'), 'A=1\n');
  fs.mkdirSync(path.join(repo, 'mods', 'p'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'mods', 'p', 'x.js'), '1');
  fs.writeFileSync(path.join(repo, 'mods', 'y.js'), '1');
  fs.symlinkSync(os.tmpdir(), path.join(repo, 'mods', 'escape'));
  assert.strictEqual(sub('results', '--clear').status, 0);
  let base = count();
  const ran = (flags, expected, what) => {
    const res = slot(flags, mark(0));
    assert.strictEqual(res.status, 0, res.stderr);
    base += expected;
    assert.strictEqual(count(), base, what);
  };
  ran(['--input', '.env'], 1, 'first run');
  ran(['--input', '.env'], 0, 'unchanged input reused');
  assert.deepStrictEqual(results()[0].inputs, ['.env']);
  assert.ok(!JSON.stringify(results()).includes('A=1'), 'record holds content');
  fs.writeFileSync(path.join(repo, '.env'), 'A=2\n');
  ran(['--input', '.env'], 1, 'changed input reused');
  ran(['--input', path.join(repo, '.env')], 0, 'absolute path is another key');
  ran(['--input', 'mods'], 1, 'directory first run');
  ran(['--input', 'mods'], 0, 'directory unchanged reused');
  fs.writeFileSync(path.join(repo, 'mods', 'p', 'x.js'), '2');
  ran(['--input', 'mods'], 1, 'changed file in directory reused');
  ran(['--input', 'mods'], 0, 'directory reuse after change');

  // Order does not matter; a missing input is no error.
  ran(['--input', '.env', '--input', 'mods'], 1, 'two inputs first');
  ran(['--input', 'mods', '--input', '.env'], 0, 'swapped order is another key');
  assert.deepStrictEqual(results().find(x => x.inputs.length === 2).inputs, ['.env', 'mods']);
  ran(['--input', 'nothing.txt'], 1, 'missing input');
  ran(['--input', 'nothing.txt'], 0, 'missing input reuse');

  // Inputs outside the worktree are rejected.
  for (const bad of ['../outside', os.tmpdir(), 'mods/escape', 'mods/../../x', '.']) {
    assert.strictEqual(slot(['--input', bad], mark(0)).status, 2, bad);
  }
  assert.strictEqual(count(), base);

  // A non-named untracked file still makes the worktree dirty.
  fs.writeFileSync(path.join(repo, 'stray.txt'), 'x\n');
  ran(['--input', '.env'], 1, 'stray file did not dirty the worktree');
  fs.writeFileSync(path.join(repo, 'extra-input.txt'), 'x\n');
  ran(['--input', 'stray.txt', '--input', 'extra-input.txt'], 1, 'named untracked inputs ran');
  ran(['--input', 'stray.txt', '--input', 'extra-input.txt'], 0, 'named untracked inputs not reused');
  fs.rmSync(path.join(repo, 'stray.txt'));
  fs.rmSync(path.join(repo, 'extra-input.txt'));

  // Validity: --max-age shortens it, the default stays 24 hours; invalid values exit 2.
  const dir2 = path.join(repo, '.qatlas', 'local', 'slots', 'results');
  const age = hours => {
    for (const file of fs.readdirSync(dir2)) {
      const full = path.join(dir2, file);
      const record = JSON.parse(fs.readFileSync(full, 'utf8'));
      record.time = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      fs.writeFileSync(full, JSON.stringify(record));
    }
  };
  assert.strictEqual(sub('results', '--clear').status, 0);
  ran([], 1, 'age first');
  age(2);
  assert.strictEqual(results().length, 1, 'default validity');
  assert.deepStrictEqual(results('--max-age', '1'), []);
  assert.strictEqual(results('--max-age', '3').length, 1);
  ran([], 0, 'valid at 2 hours');
  ran(['--max-age', '1'], 1, 'expired by --max-age reused');
  ran(['--max-age', '1'], 0, 'fresh record reused');
  for (const bad of ['0', 'x', '-1']) {
    assert.strictEqual(slot(['--max-age', bad], mark(0)).status, 2, bad);
    assert.strictEqual(sub('results', '--max-age', bad).status, 2, bad);
  }
  assert.strictEqual(count(), base);

  // A writing run removes records older than the larger of 24 hours and --max-age.
  age(25);
  assert.ok(fs.readdirSync(dir2).length > 0);
  ran(['--input', 'nothing.txt'], 1, 'cleanup trigger');
  assert.strictEqual(fs.readdirSync(dir2).filter(f => f.endsWith('.json')).length, 1, 'old records not removed');
  age(30);
  ran(['--input', 'other-missing'], 1, 'cleanup trigger 2');
  age(30);
  ran(['--input', 'third-missing', '--max-age', '48'], 1, 'cleanup trigger 3');
  assert.strictEqual(fs.readdirSync(dir2).filter(f => f.endsWith('.json')).length, 2, 'cleanup ignored --max-age');
}

function testSlotQueues() {
  const home = path.join(root, 'queue-home');
  const repo = path.join(root, 'queue-repo');
  fs.mkdirSync(home);
  fs.mkdirSync(repo);
  execFileSync('git', ['init', '-q', repo]);
  const env = { ...process.env, HOME: home };
  const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  const until = (condition, what) => {
    for (let i = 0; i < 200; i++) { if (condition()) return; sleep(50); }
    assert.fail('Timeout waiting for ' + what);
  };
  const log = path.join(root, 'queue-log');
  // Holds for ms and logs "<tag> start|end <time>"; the slot tool runs it as the guarded command.
  const hold = (tag, ms) => ['node', '-e',
    `const fs=require('fs');const l=m=>fs.appendFileSync(process.argv[1],process.argv[2]+' '+m+' '+Date.now()+'\\n');` +
    `l('start');setTimeout(()=>{l('end')},${ms})`, log, tag];
  const events = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '').split('\n').filter(Boolean)
    .map(line => { const [tag, kind, time] = line.split(' '); return { tag, kind, time: Number(time) }; });
  const at = (tag, kind) => (events().find(e => e.tag === tag && e.kind === kind) || {}).time;
  const started = tag => at(tag, 'start') !== undefined;
  const ended = tag => at(tag, 'end') !== undefined;
  // Starts the slot tool in the background; the exit code lands in a file.
  const bg = (name, flags, command) => {
    const rc = path.join(root, 'queue-rc-' + name);
    const stderr = path.join(root, 'queue-err-' + name);
    const child = require('child_process').spawn('sh',
      ['-c', '"$@" 2>"$0"; echo $? >"$0.rc"', stderr, process.execPath, tools, 'slot', '--repo', repo, ...flags, '--', ...command],
      { env, stdio: 'ignore', detached: true });
    child.unref();
    return { pid: child.pid, stderr, done: () => fs.existsSync(stderr + '.rc'), code: () => Number(fs.readFileSync(stderr + '.rc', 'utf8')) };
  };
  const run = (flags, command) => spawnSync(process.execPath, [tools, 'slot', '--repo', repo, ...flags, '--', ...command],
    { encoding: 'utf8', env, timeout: 30000 });
  const status = () => { const r = spawnSync(process.execPath, [tools, 'slot', '--repo', repo, 'status'], { encoding: 'utf8', env }); assert.strictEqual(r.status, 0, r.stderr); return JSON.parse(r.stdout); };
  const resourceOf = (st, name) => (st.resources || []).find(x => x.resource === name);

  // Two callers of one resource never overlap; the resource is visible in status and uses no test slot.
  const a = bg('a', ['--resource', 'e2e'], hold('a', 1500));
  until(() => started('a'), 'holder a');
  const b = bg('b', ['--resource', 'e2e'], hold('b', 100));
  until(() => { const x = resourceOf(status(), 'e2e'); return x && x.waiting.length === 1; }, 'waiter b');
  let st = status();
  let x = resourceOf(st, 'e2e');
  assert.strictEqual(x.busy.length, 1);
  assert.strictEqual(x.busy[0].orphaned, false);
  assert.ok(Number.isInteger(x.busy[0].pid) && x.busy[0].started);
  assert.deepStrictEqual(x.busy[0].command.slice(0, 1), ['node']);
  assert.strictEqual(x.waiting[0].priority, false);
  assert.strictEqual(x.waiting[0].orphaned, false);
  assert.deepStrictEqual(st.busy, []);
  assert.deepStrictEqual(st.waiting, []);
  until(() => a.done() && b.done(), 'a and b');
  assert.strictEqual(a.code(), 0);
  assert.strictEqual(b.code(), 0);
  assert.ok(fs.readFileSync(b.stderr, 'utf8').includes('Waiting for resource e2e'));
  assert.ok(at('b', 'start') >= at('a', 'end'), 'resource holders overlapped');
  assert.strictEqual(resourceOf(status(), 'e2e'), undefined);

  // --priority goes ahead of earlier callers of the same resource; other resources are independent.
  fs.writeFileSync(log, '');
  const h = bg('h', ['--resource', 'prio'], hold('h', 1500));
  until(() => started('h'), 'holder h');
  const n = bg('n', ['--resource', 'prio'], hold('n', 100));
  until(() => resourceOf(status(), 'prio').waiting.length === 1, 'waiter n');
  sleep(20);
  const p = bg('p', ['--priority', '--resource', 'prio'], hold('p', 100));
  until(() => resourceOf(status(), 'prio').waiting.length === 2, 'waiter p');
  x = resourceOf(status(), 'prio');
  assert.deepStrictEqual(x.waiting.map(w => w.priority), [true, false]);
  const other = run(['--resource', 'other'], ['node', '-e', 'process.exit(0)']);
  assert.strictEqual(other.status, 0, other.stderr);
  until(() => h.done() && n.done() && p.done(), 'h, n and p');
  assert.ok(at('p', 'start') >= at('h', 'end'));
  assert.ok(at('n', 'start') >= at('p', 'end'), 'priority caller did not go first');

  // A holder killed without cleanup leaves an orphaned lock that the next caller takes over.
  const pidFile = path.join(root, 'queue-sleeper');
  bg('orphan', ['--resource', 'dead'],
    ['node', '-e', `require('fs').writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));setTimeout(()=>{},60000)`]);
  until(() => fs.existsSync(pidFile) && fs.readFileSync(pidFile, 'utf8') !== '', 'orphan holder');
  const sleeper = Number(fs.readFileSync(pidFile, 'utf8'));
  process.kill(resourceOf(status(), 'dead').busy[0].pid, 'SIGKILL');
  try {
    until(() => { const y = resourceOf(status(), 'dead'); return y && y.busy[0].orphaned; }, 'orphaned status');
    const r = run(['--resource', 'dead'], ['node', '-e', 'process.exit(0)']);
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(!r.stderr.includes('Waiting'));
  } finally { try { process.kill(sleeper, 'SIGKILL'); } catch { /* already gone */ } }

  // Exit code pass-through, signal release and name validation.
  assert.strictEqual(run(['--resource', 'rc'], ['node', '-e', 'process.exit(7)']).status, 7);
  assert.strictEqual(run(['--resource', 'rc'], ['node', '-e', 'process.exit(0)']).status, 0);
  for (const bad of ['Bad', '-a', 'a_b', 'a/b', '']) {
    const r = run(['--resource', bad], ['true']);
    assert.strictEqual(r.status, 2, 'name ' + JSON.stringify(bad));
  }
  assert.strictEqual(run(['--resource'], ['true']).status, 2);
  assert.strictEqual(run(['--resource', '1'], ['true']).status, 0);
  const term = bg('term', ['--resource', 'sig'], hold('term', 60000));
  until(() => started('term'), 'term holder');
  process.kill(resourceOf(status(), 'sig').busy[0].pid, 'SIGTERM');
  until(() => term.done(), 'term exit');
  assert.strictEqual(run(['--resource', 'sig'], ['true']).status, 0);

  // General slots still queue when all are busy, and ignore resources.
  fs.writeFileSync(log, '');
  const s1 = bg('s1', ['--slots', '1'], hold('s1', 1500));
  until(() => started('s1'), 'slot holder');
  const s2 = bg('s2', ['--slots', '1'], hold('s2', 100));
  until(() => status().waiting.length === 1, 'slot waiter');
  st = status();
  assert.strictEqual(st.busy.length, 1);
  assert.strictEqual(run(['--resource', 'free'], ['true']).status, 0);
  until(() => s1.done() && s2.done(), 's1 and s2');
  assert.ok(at('s2', 'start') >= at('s1', 'end'), 'slot holders overlapped');
  assert.ok(fs.readFileSync(s2.stderr, 'utf8').includes('Waiting for a free test slot (1 slots)'));
}

try {
  testSlotCount();
  testSlotQueues();
  testSlotResults();
  let c = setup('tree');
  let r = land(c);
  assert.strictEqual(r.status, 0, r.stderr);
  let o = json(r);
  assert.strictEqual(o.result, 'merged');
  assert.strictEqual(o.proof, 'tree');
  assert.strictEqual(o.branch_deleted, true);
  assert.strictEqual(o.pr, 16);
  assert.strictEqual(o.merge_sha, git(c.bare, 'rev-parse', 'main'));
  assert.ok(!hasBranch(c));
  // Title, body and the matched head reach gh as plain arguments.
  const args = JSON.parse(mergeCalls(c)[0]);
  assert.strictEqual(args[args.indexOf('--subject') + 1], 'feat: add b');
  assert.strictEqual(args[args.indexOf('--body') + 1], 'Body line');
  assert.strictEqual(args[args.indexOf('--match-head-commit') + 1], c.sha);

  c = setup('patch-id', { moved: true });
  r = land(c);
  assert.strictEqual(r.status, 0, r.stderr);
  o = json(r);
  assert.strictEqual(o.result, 'merged');
  assert.strictEqual(o.proof, 'patch-id');
  assert.strictEqual(o.branch_deleted, true);

  c = setup('head-mismatch', { head: '0'.repeat(40) });
  r = land(c);
  assert.strictEqual(r.status, 5);
  o = json(r);
  assert.strictEqual(o.result, 'head-mismatch');
  assert.strictEqual(o.merge_sha, null);
  assert.deepStrictEqual(mergeCalls(c), []);
  assert.ok(hasBranch(c));

  c = setup('ci-fail', { checks: red });
  r = land(c);
  assert.strictEqual(r.status, 1);
  assert.strictEqual(json(r).result, 'ci-fail');
  assert.deepStrictEqual(mergeCalls(c), []);

  c = setup('timeout', { checks: [{ name: 'build', state: 'PENDING', bucket: 'pending', link: 'http://x/1' }] });
  r = land(c);
  assert.strictEqual(r.status, 4);
  assert.strictEqual(json(r).result, 'timeout');
  assert.deepStrictEqual(mergeCalls(c), []);

  c = setup('retry', { failFirst: true });
  r = land(c);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(json(r).result, 'merged');
  assert.strictEqual(mergeCalls(c).length, 2);

  // gh reports a failure although GitHub merged: no second merge, proof still runs.
  c = setup('merged-despite-error', { failAfter: true });
  r = land(c);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(json(r).proof, 'tree');
  assert.strictEqual(mergeCalls(c).length, 1);

  c = setup('proof-failed', { mode: 'different' });
  r = land(c);
  assert.strictEqual(r.status, 7);
  o = json(r);
  assert.strictEqual(o.result, 'proof-failed');
  assert.strictEqual(o.branch_deleted, false);
  assert.ok(hasBranch(c));

  // Usage errors: no frontmatter, missing field.
  c = setup('usage');
  write(c.report, 'no frontmatter\n');
  assert.strictEqual(land(c).status, 2);
  write(c.report, '---\nbranch: task\npr-title: t\n---\n');
  assert.strictEqual(land(c).status, 2);
  write(c.report, '---\nbranch: -x\npr-title: t\npr-body: b\n---\n');
  assert.strictEqual(land(c).status, 2);
  assert.deepStrictEqual(mergeCalls(c), []);

  // ci-wait keeps its output shape and exit codes.
  c = setup('ci-wait-green');
  r = spawnSync(process.execPath, [tools, 'ci-wait', '--pr', '16', '--interval', '0.1', '--repo', c.repo],
    { encoding: 'utf8', env: env(c.stubDir) });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout,
    '{"pr":16,"result":"pass","checks":[{"name":"build","bucket":"pass","link":"http://x/1"}],"retries":0}\n');
  c = setup('ci-wait-red', { checks: red });
  r = spawnSync(process.execPath, [tools, 'ci-wait', '--pr', '16', '--interval', '0.1', '--repo', c.repo],
    { encoding: 'utf8', env: env(c.stubDir) });
  assert.strictEqual(r.status, 1);
  assert.strictEqual(r.stdout,
    '{"pr":16,"result":"fail","checks":[{"name":"build","bucket":"fail","link":"http://x/1"}],"retries":0}\n');

  // validateHandover (shared frontmatter parser): two commits without cut-exception are rejected.
  c = setup('handover', { extra: ['d.txt'] });
  r = spawnSync(process.execPath, [team, 'handover', '--repo', c.repo, '--package', 'p', '--task', 't',
    '--report', c.report], { encoding: 'utf8', env: env(c.stubDir) });
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /Handover rejected: branch task has 2 non-merge commits over main/);

  // No CI: ci-wait and land report it at once (debounce: 3 polls), land merges only with --no-ci.
  const quick = (fn, c) => { const t = Date.now(); const res = fn(c); assert.ok(Date.now() - t < 10000, 'no CI must not wait out the timeout'); return res; };
  c = setup('no-ci', { checks: null });
  r = quick(ciWait, c);
  assert.strictEqual(r.status, 8);
  assert.strictEqual(r.stdout, '{"pr":16,"result":"none","checks":[],"retries":0}\n');
  r = quick(landWith, c);
  assert.strictEqual(r.status, 8, r.stderr);
  assert.strictEqual(json(r).result, 'no-ci');
  assert.deepStrictEqual(mergeCalls(c), []);
  assert.ok(hasBranch(c));
  r = quick(c => landWith(c, '--no-ci'), c);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(json(r).result, 'merged');
  assert.ok(!hasBranch(c));
  // --no-ci does not skip checks that exist.
  c = setup('no-ci-red', { checks: red });
  r = landWith(c, '--no-ci');
  assert.strictEqual(r.status, 1);
  assert.strictEqual(json(r).result, 'ci-fail');

  // Remote head after a branch update: merge of the base into the PR branch is accepted, a new own commit is not.
  c = setup('remote-update', { moved: true });
  git(c.repo, 'fetch', '-q', 'origin');
  let updated = remoteUpdate(c, other => git(other, 'merge', '-q', '--no-edit', 'origin/main'));
  r = land(c);
  assert.strictEqual(r.status, 0, r.stderr);
  o = json(r);
  assert.strictEqual(o.result, 'merged');
  assert.strictEqual(o.proof, 'tree');
  assert.strictEqual(o.branch_deleted, true);
  let mergeArgs = JSON.parse(mergeCalls(c)[0]);
  assert.strictEqual(mergeArgs[mergeArgs.indexOf('--match-head-commit') + 1], updated);
  // Report head (vouched tip) with the local branch gone behind: accepted as well.
  c = setup('remote-update-head', { moved: true });
  updated = remoteUpdate(c, other => git(other, 'merge', '-q', '--no-edit', 'origin/main'));
  write(c.report, fs.readFileSync(c.report, 'utf8').replace('last: true', `last: true\nhead: ${c.sha}`));
  r = land(c);
  assert.strictEqual(r.status, 0, r.stderr);
  // Evil merge: the merge of the base carries an extra file.
  c = setup('remote-evil-merge', { moved: true });
  remoteUpdate(c, other => {
    git(other, 'merge', '-q', '--no-edit', 'origin/main');
    write(path.join(other, 'evil.txt'), 'x\n');
    git(other, 'add', 'evil.txt');
    git(other, 'commit', '-q', '--amend', '--no-edit');
  });
  r = land(c);
  assert.strictEqual(r.status, 5);
  o = json(r);
  assert.strictEqual(o.result, 'head-mismatch');
  assert.match(o.reason, /beyond the merge of its parents/);
  assert.deepStrictEqual(mergeCalls(c), []);
  c = setup('remote-own-commit', { moved: true });
  remoteUpdate(c, other => { git(other, 'merge', '-q', '--no-edit', 'origin/main'); commit(other, 'e.txt', 'e\n'); });
  r = land(c);
  assert.strictEqual(r.status, 5);
  assert.strictEqual(json(r).result, 'head-mismatch');
  assert.deepStrictEqual(mergeCalls(c), []);
  assert.ok(hasBranch(c));
  c = setup('remote-own-commit-only');
  remoteUpdate(c, other => commit(other, 'e.txt', 'e\n'));
  assert.strictEqual(land(c).status, 5);
  assert.deepStrictEqual(mergeCalls(c), []);

  // Handover of an open PR: pr/head/pushed. First push carries the cut check, a CI fix after it passes.
  const handover = (c, extra, ...more) => {
    const orig = c.report + '.orig';
    if (!fs.existsSync(orig)) fs.copyFileSync(c.report, orig);
    write(c.report, fs.readFileSync(orig, 'utf8').replace('last: true', 'last: true' + extra));
    return spawnSync(process.execPath, [team, 'handover', '--repo', c.repo, '--package', 'p', '--task', 't',
      '--report', c.report, '--timeout', '0.1', ...more], { encoding: 'utf8', env: env(c.stubDir) });
  };
  c = setup('pr-handover');
  const pushed = c.sha;
  commit(c.repo, 'fix.txt', 'fix\n');
  const fixed = git(c.repo, 'rev-parse', 'HEAD');
  r = handover(c, `\npr: 16\nhead: ${fixed}\npushed: ${pushed}`);
  assert.doesNotMatch(r.stderr, /Handover rejected/);
  assert.notStrictEqual(r.status, 2, r.stderr);
  // Same report without pr: the old check counts base..branch and rejects the CI fix commit.
  r = handover(c, '');
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /branch task has 2 non-merge commits over main/);
  // Missing head or pushed, bad pr, head different from the local branch, pushed not an ancestor of head.
  r = handover(c, `\npr: 16\nhead: ${fixed}`);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /"pushed" must be a non-empty string/);
  r = handover(c, `\npr: 16\npushed: ${pushed}`);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /"head" must be a non-empty string/);
  r = handover(c, `\npr: abc\nhead: ${fixed}\npushed: ${pushed}`);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /"pr" must be a positive integer/);
  r = handover(c, `\npr: 16\nhead: ${pushed}\npushed: ${pushed}`);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /is not the handed-over head/);
  r = handover(c, `\npr: 16\nhead: ${fixed}\npushed: "${'0'.repeat(40)}"`);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /"pushed" .* does not resolve/);
  r = handover(c, `\npr: 16\nhead: ${fixed}\npushed: -x`);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /must not start with "-"/);
  git(c.repo, 'checkout', '-q', '-b', 'side', 'main');
  commit(c.repo, 's.txt', 's\n');
  const side = git(c.repo, 'rev-parse', 'HEAD');
  r = handover(c, `\npr: 16\nhead: ${fixed}\npushed: ${side}`);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /is not an ancestor of "head"/);

  // checks evidence: tree bound to the handed-over state.
  c = setup('checks');
  const tree = git(c.repo, 'rev-parse', 'task^{tree}');
  const wrongTree = '1'.repeat(40);
  const entry = (t, exit = 0) => `  - command: node test\n    exit: ${exit}\n    tree: "${t}"\n`;
  const handChecks = fm => { write(c.report, `---\n${fm}---\nbody\n`); return spawnSync(process.execPath, [team, 'handover', '--repo', c.repo,
    '--package', 'p', '--task', 't', '--report', c.report, '--timeout', '0.1'], { encoding: 'utf8', env: env(c.stubDir) }); };
  r = handChecks(`branch: task\nchecks:\n${entry(tree, 1)}`);
  assert.notStrictEqual(r.status, 2, r.stderr);
  r = handChecks(`branch: task\nchecks:\n${entry(wrongTree)}`);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, new RegExp(`checks\\[0\\].*${wrongTree}.*${tree}`));
  r = handChecks(`checks:\n${entry(tree)}`);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /"branch" must be a non-empty string/);
  for (const bad of ['checks: []\n', `checks:\n  - command: x\n    tree: "${tree}"\n`, 'checks:\n  - command: x\n    exit: 0\n    tree: zz\n']) {
    r = handChecks(`branch: task\n${bad}`);
    assert.strictEqual(r.status, 2, bad);
    assert.match(r.stderr, /Handover rejected/);
  }
  r = handChecks('branch: task\n');
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /"checks" is required/);
  write(c.report, 'no frontmatter\n');
  r = spawnSync(process.execPath, [team, 'handover', '--repo', c.repo, '--package', 'p', '--task', 't',
    '--report', c.report, '--timeout', '0.1'], { encoding: 'utf8', env: env(c.stubDir) });
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /must begin with YAML frontmatter/);
  // PR mode: checks bind to head^{tree}.
  const prFm = t => `pr-title: t\npr-body: b\nbranch: task\nbase: main\nlast: true\npr: 16\nhead: ${c.sha}\npushed: ${c.sha}\nchecks:\n${entry(t)}`;
  r = handChecks(prFm(tree));
  assert.notStrictEqual(r.status, 2, r.stderr);
  r = handChecks(prFm(wrongTree));
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /has tree 1{40}/);

  // Two milestones at the first push: cut rejects before the push, a handover with pushed = second milestone too.
  c = setup('cut', { extra: ['d.txt'] });
  const cutRun = (cc, branch = 'task') => spawnSync(process.execPath, [team, 'cut', '--repo', cc.repo, '--branch', branch,
    '--base', 'main'], { encoding: 'utf8', env: env(cc.stubDir) });
  r = cutRun(c);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /Handover rejected: branch task has 2 non-merge commits over main/);
  assert.ok(!fs.existsSync(path.join(c.repo, '.qatlas')));
  r = handover(c, `\npr: 16\nhead: ${c.sha}\npushed: ${c.sha}`);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /at first push .* has 2 non-merge commits over main/);
  r = handover(c, `\ncut-exception: two milestones\npr: 16\nhead: ${c.sha}\npushed: ${c.sha}`);
  assert.notStrictEqual(r.status, 2, r.stderr);
  c = setup('cut-ok');
  r = cutRun(c);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(json(r).result, 'ok');
  assert.ok(!fs.existsSync(path.join(c.repo, '.qatlas')));
  r = cutRun(c, 'main');
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /0 non-merge commits/);
  assert.strictEqual(cutRun(c, '-x').status, 2);

  // --code-repo: code repo embedded in (and ignored by) the control repo; refs resolve there, not in --repo.
  const embedded = (name, extra) => {
    const code = setup(name, { extra });
    const ops = path.join(root, name, 'ops');
    git(root, 'init', '-q', '-b', 'main', ops);
    write(path.join(ops, '.gitignore'), 'x/\n');
    git(code.repo, 'clone', '-q', code.repo, path.join(ops, 'x'));
    git(path.join(ops, 'x'), 'branch', 'main', 'origin/main');
    return { ...code, ops, codeDir: path.join(ops, 'x') };
  };
  const hand = (e, ...more) => spawnSync(process.execPath, [team, 'handover', '--repo', e.ops, '--package', 'p',
    '--task', 't', '--report', e.report, ...more], { encoding: 'utf8', env: env(e.stubDir) });
  c = embedded('embed-bad', ['d.txt']);
  r = hand(c, '--code-repo', c.codeDir);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /Handover rejected: branch task has 2 non-merge commits over main/);
  r = hand(c);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /does not resolve to a commit/);
  r = hand(c, '--code-repo', 'relative');
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /--code-repo must be an existing absolute path/);
  c = embedded('embed-ok');
  r = hand(c);
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /does not resolve to a commit/);
  r = hand(c, '--code-repo', c.codeDir, '--timeout', '0.1');
  assert.doesNotMatch(r.stderr, /Handover rejected/);

  // Team mailbox: one open signal per sender, routing per role, run lifecycle. Plain files only, no host.
  {
    const repo = fs.realpathSync(fs.mkdtempSync(path.join(root, 'team-')));
    git(repo, 'init', '-q', '-b', 'main');
    commit(repo, 'a.txt', 'a\n');
    const fm = `---\nbranch: main\nchecks:\n  - command: node test\n    exit: 0\n    tree: "${git(repo, 'rev-parse', 'main^{tree}')}"\n---\n`;
    const run = (...args) => spawnSync(process.execPath, [team, args[0], '--repo', repo, ...args.slice(1)], { encoding: 'utf8' });
    const ok = (...args) => { const res = run(...args); assert.strictEqual(res.status, 0, res.stderr); return JSON.parse(res.stdout); };
    const refused = (pattern, ...args) => { const res = run(...args); assert.strictEqual(res.status, 2, res.stdout); assert.match(res.stderr, pattern); };
    const types = res => res.events.map(e => e.type);
    // The machine's real free space must not add disk events where a test does not ask for them.
    const supervise = since => ok('wait', '--since', String(since), '--timeout', '0.1', '--min-free', '0.000001');
    const integrate = since => ok('wait', '--role', 'integrator', '--since', String(since), '--timeout', '0.1');

    refused(/start one with begin/, 'plan', '--budget', '3', '--package', 'a', '--tasks', '1,2');
    assert.strictEqual(ok('begin').cursor, 1);
    ok('plan', '--budget', '3', '--package', 'a', '--tasks', '1,2');
    ok('plan', '--budget', '3', '--package', 'b', '--tasks', '3');
    refused(/already planned/, 'plan', '--budget', '3', '--package', 'a', '--tasks', '9');
    refused(/Reserved package name/, 'plan', '--budget', '3', '--package', 'integrator', '--tasks', '9');
    refused(/comma-separated ids/, 'plan', '--budget', '3', '--package', 'c', '--tasks', '1,,2');

    // Question: no answer within the timeout, the supervisor wakes, repeating the call collects the answer.
    assert.strictEqual(ok('ask', '--package', 'a', '--question', 'Q1?', '--timeout', '0.1').answer, null);
    refused(/a has an open question/, 'ask', '--package', 'a', '--question', 'Q2?', '--timeout', '0.1');
    refused(/a has an open question/, 'handover', '--package', 'a', '--task', '1', '--report', 'r', '--timeout', '0.1');
    let woke = supervise(0);
    assert.deepStrictEqual(woke.events.map(e => [e.type, e.sender, e.text]), [['question', 'a', 'Q1?']]);
    assert.deepStrictEqual(ok('report').open, [{ sender: 'a', type: 'question', question: 'Q1?', answered: false }]);
    ok('answer', '--package', 'a', '--answer', 'A1');
    refused(/already answered/, 'answer', '--package', 'a', '--answer', 'A2');
    assert.strictEqual(ok('ask', '--package', 'a', '--question', 'Q1?', '--timeout', '0.1').answer, 'A1');
    refused(/No open question or handover of a/, 'answer', '--package', 'a', '--answer', 'A3');
    assert.deepStrictEqual(supervise(woke.cursor), { events: [], cursor: woke.cursor + 2, timeout: true });

    // Handover: only the integrator wakes; a changed report before any answer replaces the open one.
    const report = path.join(root, 'team-report.md');
    write(report, fm + 'Report v1\n');
    assert.strictEqual(ok('handover', '--package', 'b', '--task', '3', '--report', report, '--timeout', '0.1').answer, null);
    write(report, fm + 'Report v2\n');
    ok('handover', '--package', 'b', '--task', '3', '--report', report, '--timeout', '0.1');
    refused(/open handover of task 3/, 'handover', '--package', 'b', '--task', '4', '--report', report, '--timeout', '0.1');
    let integ = integrate(0);
    assert.deepStrictEqual(types(integ), ['handover']);
    assert.strictEqual(fs.readFileSync(integ.events[0].report, 'utf8'), fm + 'Report v2\n');
    assert.deepStrictEqual(types(supervise(woke.cursor)), []);
    refused(/only "integrated <sha>" or "rework <reason>"/, 'answer', '--package', 'b', '--answer', 'fine');
    ok('answer', '--package', 'b', '--answer', 'rework fix the test');
    // Answered: offered no more, and even a changed report now only collects the answer.
    assert.deepStrictEqual(types(integrate(0)), []);
    write(report, fm + 'Report v3\n');
    assert.strictEqual(ok('handover', '--package', 'b', '--task', '3', '--report', report, '--timeout', '0.1').answer, 'rework fix the test');
    // A resubmission after a picked rework is a new open handover, offered exactly once.
    ok('handover', '--package', 'b', '--task', '3', '--report', report, '--timeout', '0.1');
    integ = integrate(0);
    assert.strictEqual(integ.events.length, 1);
    assert.strictEqual(fs.readFileSync(integ.events[0].report, 'utf8'), fm + 'Report v3\n');
    ok('answer', '--package', 'b', '--answer', 'integrated abc123');
    assert.strictEqual(ok('handover', '--package', 'b', '--task', '3', '--report', report, '--timeout', '0.1').answer, 'integrated abc123');
    refused(/Only a lead hands over/, 'handover', '--role', 'integrator', '--task', '3', '--report', report);

    // The integrator asks the supervisor like a lead.
    ok('ask', '--role', 'integrator', '--question', 'Push?', '--timeout', '0.1');
    woke = supervise(woke.cursor);
    assert.deepStrictEqual(woke.events.map(e => [e.type, e.sender]), [['question', 'integrator']]);
    refused(/not both/, 'answer', '--role', 'integrator', '--package', 'a', '--answer', 'x');
    ok('answer', '--role', 'integrator', '--answer', 'no');
    assert.strictEqual(ok('ask', '--role', 'integrator', '--question', 'Push?', '--timeout', '0.1').answer, 'no');

    // Package ends wake the supervisor, notes do not; done --rest belongs to leads.
    refused(/Reserved event type/, 'log', '--type', 'done');
    ok('log', '--type', 'erfasst', '--package', 'a', '--task', '7', '--text', 'Bug: x - y');
    ok('log', '--type', 'regel', '--text', 'Flaky test: rerun once');
    ok('done', '--package', 'a', '--rest', '2');
    refused(/only to a lead/, 'done', '--role', 'integrator', '--rest', '2');
    woke = supervise(woke.cursor);
    assert.deepStrictEqual(types(woke), ['done']);
    assert.deepStrictEqual(woke.events[0].rest, ['2']);
    // Conflicts count into the metrics and stay out of the notes.
    ok('log', '--type', 'conflict', '--package', 'b', '--task', '3', '--text', 'x.go');
    const rep = ok('report');
    assert.deepStrictEqual(rep.log, { rerun: 0, conflict: 1 });
    assert.deepStrictEqual([rep.ended, rep.budget, rep.open], [false, 3, []]);
    assert.deepStrictEqual(rep.packages, { a: { tasks: ['1', '2'], questions: 1, finished: 1, rest: ['2'] },
      b: { tasks: ['3'], questions: 0, finished: 0 } });
    assert.deepStrictEqual([rep.tasks['3'].integrated, rep.tasks['3'].rework, rep.tasks['3'].handovers], [true, 1, 3]);
    assert.ok(rep.tasks['3'].cycle >= 0 && rep.tasks['3'].wait >= 0);
    assert.deepStrictEqual(rep.integrator, { questions: 1, finished: 0 });
    assert.deepStrictEqual(rep.notes, { erfasst: [{ package: 'a', task: '7', text: 'Bug: x - y' }], regel: [{ text: 'Flaky test: rerun once' }] });

    // end wakes the integrator and closes the run; a new run archives the log and needs --since 0.
    refused(/has not ended/, 'begin');
    ok('end');
    assert.deepStrictEqual(types(integrate(integ.cursor)), ['end']);
    refused(/start one with begin/, 'plan', '--budget', '1', '--package', 'z', '--tasks', '1');
    const last = ok('report');
    assert.strictEqual(last.ended, true);
    ok('begin');
    refused(/past the end of the log/, 'wait', '--since', String(last.cursor), '--timeout', '0.1');
    assert.strictEqual(fs.readdirSync(path.join(repo, '.qatlas', 'local', 'team')).filter(n => /^events-.*\.jsonl$/.test(n)).length, 1);
    ok('plan', '--budget', '1', '--package', 'z', '--tasks', '1');
    refused(/has not ended/, 'begin');
    ok('begin', '--discard');
    assert.deepStrictEqual(ok('report').packages, {});

    // Low disk wakes the supervisor once per undershoot and re-arms after recovery.
    const low = () => ok('wait', '--since', '0', '--timeout', '0.1', '--min-free', '1e12').events.length;
    assert.strictEqual(low(), 1);
    assert.strictEqual(low(), 1);
    supervise(0);
    assert.strictEqual(low(), 2);
  }

  process.stdout.write('✓ Qatlas-Team-Tools: land, ci-wait, Team-Ablage und Handover-Prüfung erfolgreich.\n');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
