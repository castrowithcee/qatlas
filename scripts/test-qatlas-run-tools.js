#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn, spawnSync } = require('child_process');

const skill = path.resolve(__dirname, '..', 'plugins', 'qatlas', 'skills', 'qatlas');
const tools = path.join(skill, 'scripts', 'qatlas-run-tools.js');
const team = path.join(skill, 'modes', 'team', 'scripts', 'qatlas-team-tmux.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qatlas-run-tools-'));
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
  const team = path.join(home, '.qatlas', 'plugins', 'team.yaml');
  const status = () => spawnSync(process.execPath, [tools, 'slot', '--repo', repo, 'status'],
    { encoding: 'utf8', env: { ...process.env, HOME: home } });
  const slots = () => { const r = status(); assert.strictEqual(r.status, 0, r.stderr); return JSON.parse(r.stdout).slots; };
  assert.strictEqual(slots(), 2);
  fs.writeFileSync(team, 'format: 2\ntest-slots: 5\n');
  assert.strictEqual(slots(), 5);
  fs.writeFileSync(team, 'format: 2\n');
  assert.strictEqual(slots(), 2);
  for (const bad of ['format: 2\ntest-slots: 0\n', 'format: 2\ntest-slots: x\n', 'format: 1\ntest-slots: 5\n']) {
    fs.writeFileSync(team, bad);
    const r = status();
    assert.strictEqual(r.status, 3, bad);
    assert.ok(r.stderr.includes('team.yaml'));
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

  // validateHandover (shared frontmatter parser): two commits without cut-exception are rejected before tmux.
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

  // stale: a host "Waiting for N background agents" line in the hidden status rows stretches the limit to three
  // times --stale, an idle pane keeps the plain limit; so does a pane waiting on a `slot` resource held elsewhere.
  // Own tmux server; TMUX points the script at it.
  const sock = `qatlas-test-${process.pid}`;
  const tm = (...args) => execFileSync('tmux', ['-L', sock, ...args], { encoding: 'utf8' }).trim();
  let socketPath = null;
  let holder = null;
  try {
    const repo = fs.realpathSync(fs.mkdtempSync(path.join(root, 'stale-')));
    const slotRepo = fs.realpathSync(fs.mkdtempSync(path.join(root, 'stale-slot-')));
    const slotHome = fs.mkdtempSync(path.join(root, 'stale-home-'));
    execFileSync('git', ['init', '-q', slotRepo]);
    const slotEnv = { ...process.env, HOME: slotHome };
    holder = spawn(process.execPath, [tools, 'slot', '--repo', slotRepo, '--resource', 'e2e', '--', 'sleep', '300'], { stdio: 'ignore', env: slotEnv, detached: true });
    for (let i = 0; i < 100; i++) {
      const r = spawnSync(process.execPath, [tools, 'slot', '--repo', slotRepo, 'status'], { encoding: 'utf8', env: slotEnv });
      if (r.status === 0 && JSON.parse(r.stdout).resources.length) break;
      spawnSync('sleep', ['0.1']);
    }
    const body = (line) => `printf 'work\\n'; i=0; while [ $i -lt 19 ]; do echo; i=$((i+1)); done; ${line}; sleep 300`;
    const win = tm('new-session', '-d', '-x', '80', '-y', '24', '-P', '-F', '#{window_id}', 'sh', '-c', body('echo idle'));
    tm('set', '-w', '-t', win, '@qatlas-team', repo);
    const panes = { idle: tm('display', '-p', '-t', win, '#{pane_id}') };
    panes.waiting = tm('split-window', '-d', '-P', '-F', '#{pane_id}', '-t', win, 'sh', '-c', body("echo 'Waiting for 1 background agent to finish'"));
    const waiter = [process.execPath, tools, 'slot', '--repo', slotRepo, '--resource', 'e2e', '--', 'true'].map(a => JSON.stringify(a)).join(' ');
    panes.slot = tm('split-window', '-d', '-P', '-F', '#{pane_id}', '-t', win, 'env', `HOME=${slotHome}`, 'sh', '-c', body(`${waiter} 2>&1 & wait $!`).replace('; sleep 300', ''));
    for (const name of Object.keys(panes)) tm('set', '-p', '-t', panes[name], '@qatlas-package', name);
    socketPath = tm('display', '-p', '#{socket_path}');
    let cursor = 0;
    let events = [];
    const stale = () => {
      const res = spawnSync(process.execPath, [team, 'wait', '--repo', repo, '--since', String(cursor), '--timeout', '0.01', '--stale', '20'],
        { encoding: 'utf8', env: { ...process.env, TMUX: `${socketPath},1,0` } });
      assert.strictEqual(res.status, 0, res.stderr);
      const result = JSON.parse(res.stdout);
      cursor = result.cursor;
      events = result.events.filter(e => e.type === 'stale');
      return events.map(e => e.package);
    };
    const ago = (name, minutes) => tm('set', '-p', '-t', panes[name], '@qatlas-since', String(Date.now() - minutes * 60000));
    assert.deepStrictEqual(stale(), []);
    ago('idle', 25); ago('waiting', 25); ago('slot', 25);
    assert.deepStrictEqual(stale(), ['idle']);
    ago('waiting', 59); ago('slot', 59);
    assert.deepStrictEqual(stale(), []);
    ago('waiting', 61); ago('slot', 61);
    assert.deepStrictEqual(stale().sort(), ['slot', 'waiting']);
    assert.match(events.find(e => e.package === 'slot').text, /waiting for or running under resource e2e/);
  } finally {
    if (holder) try { process.kill(-holder.pid); } catch { /* already gone */ }
    try { tm('kill-server'); } catch { /* already gone */ }
    if (socketPath) fs.rmSync(socketPath, { force: true });
  }

  // health: fact-based check from synthetic host files in a temporary HOME. Own tmux server.
  const sockHealth = `qatlas-test-health-${process.pid}`;
  const tmHealth = (...args) => execFileSync('tmux', ['-L', sockHealth, ...args], { encoding: 'utf8' }).trim();
  let socketPathHealth = null;
  try {
    const repo = fs.realpathSync(fs.mkdtempSync(path.join(root, 'health-')));
    git(repo, 'init', '-q');
    const home = fs.mkdtempSync(path.join(root, 'home-'));
    const names = ['active', 'hung', 'dead', 'unknown', 'asking'];
    const win = tmHealth('new-session', '-d', '-x', '80', '-y', '24', '-P', '-F', '#{window_id}', 'sleep', '300');
    tmHealth('set', '-w', '-t', win, '@qatlas-team', repo);
    const panes = { active: tmHealth('display', '-p', '-t', win, '#{pane_id}') };
    for (const n of names.slice(1)) panes[n] = tmHealth('split-window', '-d', '-P', '-F', '#{pane_id}', '-t', win, 'sleep', '300');
    for (const n of names) tmHealth('set', '-p', '-t', panes[n], '@qatlas-package', n);
    tmHealth('set', '-p', '-t', panes.asking, '@qatlas-kind', 'question');
    socketPathHealth = tmHealth('display', '-p', '#{socket_path}');
    const gone = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' }).stdout.trim();
    const old = new Date(Date.now() - 10 * 60000);
    const id = n => `0000000${names.indexOf(n)}-aaaa-bbbb-cccc-dddddddddddd`;
    const session = (n, pid, status) => write(path.join(home, '.claude', 'sessions', `${pid}.json`),
      JSON.stringify({ pid: Number(pid), sessionId: id(n), tmux: `s:@1.${panes[n]}`, status, statusUpdatedAt: old.getTime() }));
    const transcript = (n, when, sub) => {
      const dir = path.join(home, '.claude', 'projects', 'slug');
      write(path.join(dir, id(n) + '.jsonl'), 'secret\n');
      fs.utimesSync(path.join(dir, id(n) + '.jsonl'), old, old);
      if (!sub) return;
      const file = path.join(dir, id(n), 'subagents', 'agent-abc123.jsonl');
      write(file, 'secret\n');
      write(file.replace(/\.jsonl$/, '.meta.json'), '{"finished":false}');
      fs.utimesSync(file, when, when);
    };
    const panePid = n => tmHealth('display', '-p', '-t', panes[n], '#{pane_pid}');
    session('active', panePid('active'), 'busy'); transcript('active', new Date(), true);
    session('hung', panePid('hung'), 'busy'); transcript('hung', old, true);
    session('dead', gone, 'idle');
    session('asking', panePid('asking'), 'busy'); transcript('asking', old, false);
    const env = { ...process.env, HOME: home, TMUX: `${socketPathHealth},1,0` };
    let cursor = 0;
    const health = (...extra) => {
      const res = spawnSync(process.execPath, [team, 'wait', '--repo', repo, '--since', String(cursor), '--timeout', '0.01', '--health', '1', ...extra, '--min-free', '1000000000', '--stale', '9999'],
        { encoding: 'utf8', env });
      assert.strictEqual(res.status, 0, res.stderr);
      const result = JSON.parse(res.stdout);
      cursor = result.cursor;
      return result.events.filter(e => e.type === 'health');
    };
    const listed = () => Object.fromEntries(JSON.parse(spawnSync(process.execPath, [team, 'list', '--repo', repo], { encoding: 'utf8', env }).stdout)
      .panes.map(p => [p.package, p.health]));
    const rearm = n => tmHealth('set', '-p', '-t', panes[n], '@qatlas-health-at', '1');
    const first = health();
    assert.deepStrictEqual(first.map(e => e.package).sort(), ['dead', 'hung']);
    assert.match(first.find(e => e.package === 'dead').text, /process is gone/);
    assert.match(first.find(e => e.package === 'hung').text, /without activity/);
    assert.doesNotMatch(JSON.stringify(first), /secret/);
    assert.deepStrictEqual(listed(), { active: 'ok', hung: 'anomaly', dead: 'anomaly', unknown: 'unknown', asking: 'ok' });
    // Within the interval nothing is checked; after it the anomaly is not reported again.
    assert.deepStrictEqual(health(), []);
    for (const n of names) rearm(n);
    assert.deepStrictEqual(health(), []);
    // A running test of the repo counts as activity and re-arms the phase once healthy.
    const holder = spawn(process.execPath, [tools, 'slot', '--repo', repo, '--', 'sleep', '30'], { stdio: 'ignore' });
    try {
      for (let i = 0; i < 100 && JSON.parse(execFileSync(process.execPath, [tools, 'slot', '--repo', repo, 'status'], { encoding: 'utf8' })).busy.length === 0; i++) {
        spawnSync('sleep', ['0.1']);
      }
      for (const n of names) rearm(n);
      assert.deepStrictEqual(health(), []);
      assert.strictEqual(listed().hung, 'ok');
    } finally { holder.kill(); }
    for (const n of names) rearm(n);
    assert.deepStrictEqual(health().map(e => e.package), ['hung']);
    // The slot lives in the code repo: only --code-repo makes the running test visible.
    const code = fs.realpathSync(fs.mkdtempSync(path.join(root, 'code-')));
    git(code, 'init', '-q');
    const codeHolder = spawn(process.execPath, [tools, 'slot', '--repo', code, '--', 'sleep', '30'], { stdio: 'ignore' });
    try {
      for (let i = 0; i < 100 && JSON.parse(execFileSync(process.execPath, [tools, 'slot', '--repo', code, 'status'], { encoding: 'utf8' })).busy.length === 0; i++) {
        spawnSync('sleep', ['0.1']);
      }
      for (const n of names) rearm(n);
      assert.deepStrictEqual(health('--code-repo', code), []);
      assert.strictEqual(listed().hung, 'ok');
      for (const n of names) rearm(n);
      assert.deepStrictEqual(health().map(e => e.package), ['hung']);
    } finally { codeHolder.kill(); }
    // An exclusive resource run appears only under resources[] and counts as test activity as well.
    const resHolder = spawn(process.execPath, [tools, 'slot', '--resource', 'e2e', '--repo', code, '--', 'sleep', '30'], { stdio: 'ignore' });
    try {
      for (let i = 0; i < 100 && !(JSON.parse(execFileSync(process.execPath, [tools, 'slot', '--repo', code, 'status'], { encoding: 'utf8' })).resources || []).some(r => r.busy.length); i++) {
        spawnSync('sleep', ['0.1']);
      }
      for (const n of names) rearm(n);
      assert.deepStrictEqual(health('--code-repo', code), []);
      assert.strictEqual(listed().hung, 'ok');
    } finally { resHolder.kill(); }
  } finally {
    try { tmHealth('kill-server'); } catch { /* already gone */ }
    if (socketPathHealth) fs.rmSync(socketPathHealth, { force: true });
  }

  // Input suggestion: faint or coloured text on the host input line is neither hashed, nor in stale text, nor in the
  // capture file; typed default-foreground text stays. Own tmux server.
  const sockS = `qatlas-test-sug-${process.pid}`;
  const tmS = (...args) => execFileSync('tmux', ['-L', sockS, ...args], { encoding: 'utf8' }).trim();
  let socketPathS = null;
  try {
    const repo = fs.realpathSync(fs.mkdtempSync(path.join(root, 'suggest-')));
    const rule = '\\033[38;2;136;136;136m────────────\\033[0m';
    const screen = input => `printf 'work\\n${rule}\\n${input}\\n${rule}\\n'; sleep 300`;
    const cases = {
      empty: '\\033[38;2;153;153;153m❯ \\033[39m',
      faint: '\\033[38;2;153;153;153m❯ \\033[39m\\033[2mrun the tests\\033[0m',
      grey: '\\033[38;2;153;153;153m❯ \\033[39m\\033[38;2;153;153;153mrun the tests\\033[0m',
      palette: '\\033[38;2;153;153;153m❯ \\033[39m\\033[90mrun the tests\\033[0m',
      typed: '\\033[38;2;153;153;153m❯ \\033[39mreal words',
    };
    const wins = {};
    for (const [name, input] of Object.entries(cases)) {
      const first = !socketPathS;
      wins[name] = first
        ? tmS('new-session', '-d', '-x', '80', '-y', '24', '-P', '-F', '#{window_id}', 'sh', '-c', screen(input))
        : tmS('new-window', '-d', '-P', '-F', '#{window_id}', 'sh', '-c', screen(input));
      if (first) socketPathS = tmS('display', '-p', '#{socket_path}');
      tmS('set', '-w', '-t', wins[name], '@qatlas-team', repo);
      tmS('set', '-p', '-t', wins[name], '@qatlas-package', name);
    }
    wins.codex = tmS('new-window', '-d', '-P', '-F', '#{window_id}', 'sh', '-c', `printf 'work\\n\\033[1m› \\033[0m\\033[2mfix the bug\\033[0m\\n'; sleep 300`);
    tmS('set', '-w', '-t', wins.codex, '@qatlas-team', repo);
    tmS('set', '-p', '-t', wins.codex, '@qatlas-package', 'codex');
    const envS = { ...process.env, TMUX: `${socketPathS},1,0` };
    const runS = (...args) => {
      const res = spawnSync(process.execPath, [team, args[0], '--repo', repo, ...args.slice(1)], { encoding: 'utf8', env: envS });
      assert.strictEqual(res.status, 0, res.stderr);
      return JSON.parse(res.stdout);
    };
    const waitS = () => runS('wait', '--timeout', '0.01', '--stale', '20');
    waitS();
    const hash = name => tmS('display', '-p', '-t', wins[name], '#{@qatlas-hash}');
    assert.ok(hash('empty'));
    for (const name of ['faint', 'grey', 'palette']) assert.strictEqual(hash(name), hash('empty'), name);
    assert.notStrictEqual(hash('typed'), hash('empty'));
    for (const name of Object.keys(wins)) tmS('set', '-p', '-t', wins[name], '@qatlas-since', String(Date.now() - 25 * 60000));
    const staleText = waitS().events.filter(e => e.type === 'stale').map(e => [e.package, e.text]);
    assert.strictEqual(staleText.length, 6);
    for (const [name, text] of staleText) {
      assert.ok(!/run the tests|fix the bug/.test(text), name);
      assert.ok(!text.includes('\x1b'), name);
      assert.strictEqual(text.includes('real words'), name === 'typed');
    }
    for (const name of ['faint', 'codex', 'typed']) {
      const file = runS('capture', '--package', name).file;
      const content = fs.readFileSync(file, 'utf8');
      assert.ok(!content.includes('\x1b'));
      assert.ok(content.includes('work'));
      assert.ok(!/run the tests|fix the bug/.test(content), name);
      assert.strictEqual(content.includes('real words'), name === 'typed');
    }
  } finally {
    try { tmS('kill-server'); } catch { /* already gone */ }
    if (socketPathS) fs.rmSync(socketPathS, { force: true });
  }

  // Integrator role: routing per role, one integrator, detection written once. Own tmux server.
  const sock2 = `qatlas-test-int-${process.pid}`;
  const tm2 = (...args) => execFileSync('tmux', ['-L', sock2, ...args], { encoding: 'utf8' }).trim();
  let socketPath2 = null;
  try {
    const repo = fs.realpathSync(fs.mkdtempSync(path.join(root, 'integrator-')));
    tm2('new-session', '-d', '-x', '80', '-y', '24', '-s', 'base', 'sleep 300');
    socketPath2 = tm2('display', '-p', '#{socket_path}');
    const tenv = { ...process.env, TMUX: `${socketPath2},1,0` };
    const run = (...args) => spawnSync(process.execPath, [team, args[0], '--repo', repo, ...args.slice(1)],
      { encoding: 'utf8', env: tenv });
    const ok = (...args) => { const res = run(...args); assert.strictEqual(res.status, 0, res.stderr); return JSON.parse(res.stdout); };
    const common = ['--label', 'w', '--title', 't', '--cwd', repo];
    ok('add', '--package', 'a', ...common, '--', 'sleep', '300');
    ok('add', '--package', 'b', ...common, '--', 'sleep', '300');
    ok('add', '--role', 'integrator', ...common, '--', 'sleep', '300');
    ok('add', '--package', 'c', ...common, '--', 'true');
    // Second integrator, reserved package name, and mixed addressing are rejected.
    assert.notStrictEqual(run('add', '--role', 'integrator', ...common, '--', 'sleep', '300').status, 0);
    assert.strictEqual(run('add', '--package', 'integrator', ...common, '--', 'sleep', '300').status, 2);
    assert.strictEqual(run('plan', '--budget', '1', '--package', 'integrator', '--tasks', '1').status, 2);
    assert.strictEqual(run('ask', '--role', 'integrator', '--package', 'a', '--question', 'q').status, 2);
    const listed = ok('list').panes;
    assert.deepStrictEqual(listed.map(x => `${x.package}:${x.role}`).sort(), [':integrator', 'a:lead', 'b:lead', 'c:lead']);
    // Signals: lead handover; question and done of the integrator pane; a lead cannot be addressed as integrator.
    ok('handover', '--package', 'a', '--task', 't1', '--report', 'report text', '--timeout', '0.01');
    assert.strictEqual(run('handover', '--role', 'integrator', '--task', 't2', '--report', 'x', '--timeout', '0.01').status, 2);
    ok('ask', '--role', 'integrator', '--question', 'iq', '--timeout', '0.01');
    ok('title', '--role', 'integrator', '--title', 'FERTIG integrator');
    const log = () => fs.readFileSync(path.join(repo, '.qatlas', 'local', 'team', 'events.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
    const count = type => log().filter(e => e.type === type).length;
    const sh = (n) => `${JSON.stringify(process.execPath)} ${JSON.stringify(team)} wait --repo ${JSON.stringify(repo)} --since 0 --timeout 0.01 --min-free 1000000000 --stale 20 ${n}`;
    // Two supervisor callers at once: one exited for c, one disk.
    spawnSync('sh', ['-c', `${sh('--role supervisor')} >/dev/null & ${sh('')} >/dev/null & wait`], { env: tenv });
    assert.strictEqual(count('exited'), 1);
    assert.strictEqual(count('disk'), 1);
    const before = log().length;
    const types = res => res.events.map(e => e.type).sort();
    let sup = ok('wait', '--since', '0', '--timeout', '0.01', '--min-free', '1000000000');
    assert.deepStrictEqual(types(sup), ['disk', 'done', 'exited', 'question']);
    assert.ok(sup.events.filter(e => e.type === 'question' || e.type === 'done').every(e => e.role === 'integrator'));
    const integ = ok('wait', '--role', 'integrator', '--since', '0', '--timeout', '0.01');
    assert.deepStrictEqual(integ.events.map(e => [e.type, e.package]), [['handover', 'a']]);
    // The consumers' cursors are independent: the integrator's cursor loses nothing for the supervisor.
    assert.strictEqual(integ.cursor, log().length);
    assert.strictEqual(log().length, before);
    // A cursor past the end of the log (from an earlier run) fails instead of waiting silently.
    const past = run('wait', '--since', String(log().length + 1), '--timeout', '0.01', '--min-free', '1000000000');
    assert.strictEqual(past.status, 2);
    assert.match(String(past.stderr), /past the end of the event log/);
    // Integrator wait writes no detection events: c is gone, b stale, disk low, none of it is written.
    const panes = Object.fromEntries(ok('list').panes.map(x => [x.package || x.role, x.pane]));
    assert.strictEqual(count('stale'), 0);
    ok('wait', '--since', String(integ.cursor), '--timeout', '0.01', '--min-free', '1000000000'); // arms stale tracking
    tm2('set', '-p', '-t', panes.b, '@qatlas-since', String(Date.now() - 25 * 60000));
    const integ2 = ok('wait', '--role', 'integrator', '--since', String(integ.cursor), '--timeout', '0.01', '--stale', '20');
    assert.deepStrictEqual(integ2.events, []);
    assert.strictEqual(count('stale'), 0);
    // Two concurrent supervisor callers (and one integrator caller): b is reported stale exactly once.
    spawnSync('sh', ['-c', `${sh('--role supervisor')} >/dev/null & ${sh('')} >/dev/null & ${sh('--role integrator')} >/dev/null & wait`], { env: tenv });
    assert.strictEqual(count('stale'), 1);
    assert.strictEqual(count('exited'), 1);
    assert.strictEqual(count('disk'), 1);
    sup = ok('wait', '--since', String(before), '--timeout', '0.01', '--min-free', '1000000000');
    assert.deepStrictEqual(types(sup), ['stale']);
    assert.strictEqual(sup.events[0].package, 'b');
    // A recorded draft wakes only the supervisor and stays a note; other log types wake nobody.
    const mark = log().length;
    ok('log', '--type', 'erfasst', '--package', 'a', '--task', 't9', '--text', 'draft');
    ok('log', '--type', 'annahme', '--package', 'a', '--text', 'note');
    sup = ok('wait', '--since', String(mark), '--timeout', '0.01', '--min-free', '1000000000');
    assert.deepStrictEqual(types(sup), ['erfasst']);
    assert.deepStrictEqual(ok('wait', '--role', 'integrator', '--since', String(mark), '--timeout', '0.01').events, []);
    assert.deepStrictEqual(ok('report').notes.erfasst, [{ package: 'a', task: 't9', text: 'draft' }]);
    // A stale lock (crashed holder) is taken over.
    const lock = path.join(repo, '.qatlas', 'local', 'team', 'detect.lock');
    fs.mkdirSync(lock);
    const old = new Date(Date.now() - 120000);
    fs.utimesSync(lock, old, old);
    ok('wait', '--since', '0', '--timeout', '0.01', '--min-free', '1000000000');
    assert.ok(!fs.existsSync(lock));
    // report: the integrator is a role, not a package.
    const rep = ok('report');
    assert.deepStrictEqual(Object.keys(rep.packages).sort(), ['a', 'b', 'c']);
    assert.deepStrictEqual(rep.integrator, { vorhanden: true, rueckfragen: 1 });
    // answer addresses the integrator by role; a handover answers the lead by package.
    assert.strictEqual(ok('answer', '--role', 'integrator', '--answer', 'ok').answered, true);
    assert.strictEqual(ok('answer', '--package', 'a', '--answer', 'integrated abc').answered, true);
  } finally {
    try { tm2('kill-server'); } catch { /* already gone */ }
    if (socketPath2) fs.rmSync(socketPath2, { force: true });
  }

  // A command that ends at once leaves a dead pane on every window-creating path. Own tmux servers only; the
  // fallback socket is redirected via TMUX_TMPDIR into a temp dir, so the real `qatlas-team` socket stays untouched.
  {
    const early = (env, repo) => {
      const run = (...args) => spawnSync(process.execPath, [team, args[0], '--repo', repo, ...args.slice(1)], { encoding: 'utf8', env });
      const ok = (...args) => { const res = run(...args); assert.strictEqual(res.status, 0, res.stderr); return JSON.parse(res.stdout); };
      const common = ['--label', 'w', '--title', 't', '--cwd', repo];
      // tmux sets pane_dead only once its event loop has processed the exit, so poll instead of asserting at once.
      const waitDead = pkg => {
        let panes;
        for (let i = 0; i < 40; i++) {
          panes = ok('list').panes;
          if (panes.some(x => x.package === pkg && x.dead === true)) break;
          sleep(50);
        }
        assert.ok(panes.some(x => x.package === pkg && x.dead === true), pkg);
        return panes;
      };
      const check = pkg => {
        waitDead(pkg);
        const evs = ok('wait', '--since', '0', '--timeout', '0.01', '--min-free', '1000000000').events;
        assert.strictEqual(evs.filter(e => e.type === 'exited' && e.package === pkg).length, 1, pkg);
        assert.ok(fs.readFileSync(path.join(repo, '.qatlas', 'local', 'team', 'events.jsonl'), 'utf8').split('\n').filter(Boolean)
          .some(l => { const e = JSON.parse(l); return e.type === 'start' && e.package === pkg; }), pkg);
      };
      return { ok, common, check, waitDead };
    };
    const mkrepo = () => fs.realpathSync(fs.mkdtempSync(path.join(root, 'early-')));
    // Inside tmux: first pane of a fresh session (new-session) and a pane in a new extra window (full window).
    const sockE = `qatlas-test-early-${process.pid}`;
    const tmE = (...args) => execFileSync('tmux', ['-L', sockE, ...args], { encoding: 'utf8' }).trim();
    let socketPathE = null;
    try {
      tmE('new-session', '-d', '-x', '80', '-y', '24', '-s', 'base', 'sleep 300');
      socketPathE = tmE('display', '-p', '#{socket_path}');
      const env = { ...process.env, TMUX: `${socketPathE},1,0` };
      const repo = mkrepo();
      const t = early(env, repo);
      t.ok('add', '--package', 'first', ...t.common, '--', 'true');
      t.check('first');
      const repo2 = mkrepo();
      const t2 = early(env, repo2);
      for (const n of ['a', 'b', 'c', 'd']) t2.ok('add', '--package', n, ...t2.common, '--', 'sleep', '300');
      t2.ok('add', '--package', 'e', ...t2.common, '--', 'true');
      t2.ok('add', '--package', 'f', ...t2.common, '--', 'sh', '-c', 'exit 3');
      t2.check('e');
      assert.ok(t2.waitDead('f').find(x => x.package === 'f').dead);
      // base, the fresh session, and two windows of the full run: no placeholder window is left over.
      assert.strictEqual(tmE('list-windows', '-a', '-F', '#{window_id}').split('\n').length, 4);
    } finally {
      try { tmE('kill-server'); } catch { /* already gone */ }
      if (socketPathE) fs.rmSync(socketPathE, { force: true });
    }
    // Without tmux environment: fallback socket `qatlas-team` below a private TMUX_TMPDIR (new-session, then new-window).
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'qte-'));
    const envN = { ...process.env, TMUX_TMPDIR: tmpdir };
    delete envN.TMUX;
    try {
      const repo = mkrepo();
      const t = early(envN, repo);
      t.ok('add', '--package', 'n1', ...t.common, '--', 'true');
      assert.ok(fs.existsSync(path.join(tmpdir, `tmux-${process.getuid()}`, 'qatlas-team')));
      t.check('n1');
      const repo2 = mkrepo();
      const t2 = early(envN, repo2);
      t2.ok('add', '--package', 'n2', ...t2.common, '--', 'true');
      t2.check('n2');
    } finally {
      try { execFileSync('tmux', ['-L', 'qatlas-team', 'kill-server'], { env: envN }); } catch { /* already gone */ }
      fs.rmSync(tmpdir, { recursive: true, force: true });
    }
  }

  // Context measurement: temp HOME with state and transcript files; own tmux server.
  const sock3 = `qatlas-test-ctx-${process.pid}`;
  const tm3 = (...args) => execFileSync('tmux', ['-L', sock3, ...args], { encoding: 'utf8' }).trim();
  let socketPath3 = null;
  try {
    const home = fs.realpathSync(fs.mkdtempSync(path.join(root, 'home-')));
    const repo = fs.realpathSync(fs.mkdtempSync(path.join(root, 'context-')));
    tm3('new-session', '-d', '-x', '80', '-y', '24', '-s', 'base', 'sleep 300');
    socketPath3 = tm3('display', '-p', '#{socket_path}');
    const cenv = { ...process.env, HOME: home, TMUX: `${socketPath3},1,0` };
    delete cenv.CLAUDE_CODE_SESSION_ID;
    const run = (extraEnv, ...args) => spawnSync(process.execPath, [team, args[0], ...(args[0] === 'context' && args.includes('--self') ? [] : ['--repo', repo]), ...args.slice(1)],
      { encoding: 'utf8', env: { ...cenv, ...extraEnv } });
    const ok = (extraEnv, ...args) => { const res = run(extraEnv, ...args); assert.strictEqual(res.status, 0, res.stderr); return JSON.parse(res.stdout); };
    const stateDir = path.join(home, '.qatlas', 'state', 'context');
    const idA = '11111111-1111-4111-8111-111111111111';
    const idB = '22222222-2222-4222-8222-222222222222';
    const idC = '33333333-3333-4333-8333-333333333333';
    const idX = '44444444-4444-4444-8444-444444444444';
    write(path.join(stateDir, idA + '.json'), JSON.stringify({ tokens: 50000, window: 200000, at: Date.now() - 5000 }));
    const usage = (i, c, w) => JSON.stringify({ type: 'assistant', message: { content: 'SECRET', usage: { input_tokens: i, cache_read_input_tokens: c, cache_creation_input_tokens: w } } });
    write(path.join(home, '.claude', 'projects', '-some-cwd', idB + '.jsonl'),
      [usage(1, 100, 10), '{"type":"system","subtype":"compact_boundary"}', usage(2, 3000, 40), 'not json', usage(0, 0, 0)].join('\n') + '\n');
    write(path.join(home, '.claude', 'projects', '-some-cwd', idC + '.jsonl'), [usage(5, 500, 5), '{"type":"system","subtype":"compact_boundary"}'].join('\n') + '\n');
    const fake = path.join(root, 'fakebin', 'claude');
    write(fake, '#!/bin/sh\nexec sleep 300\n');
    fs.chmodSync(fake, 0o755);
    const common = ['--label', 'w', '--title', 't', '--cwd', repo];
    ok({}, 'add', '--package', 'a', ...common, '--', fake, '--session-id', idA, '--prompt-suggestions', 'true');
    ok({}, 'add', '--package', 'b', ...common, '--', fake);
    ok({}, 'add', '--package', 'x', ...common, '--', 'sleep', '300');
    const pa = ok({}, 'list').panes;
    const idOfB = tm3('display', '-p', '-t', pa.find(x => x.package === 'b').pane, '#{@qatlas-session}');
    assert.ok(/^[0-9a-f-]{36}$/.test(idOfB));
    assert.strictEqual(tm3('display', '-p', '-t', pa.find(x => x.package === 'a').pane, '#{@qatlas-session}'), idA);
    assert.strictEqual(tm3('display', '-p', '-t', pa.find(x => x.package === 'x').pane, '#{@qatlas-session}'), '');
    // Command line: id added after the command exactly once; an existing one is reused.
    assert.ok(tm3('list-panes', '-a', '-F', '#{pane_start_command}').includes(`--session-id ${idA}`));
    assert.strictEqual(tm3('list-panes', '-a', '-F', '#{pane_start_command}').split('--session-id').length - 1, 2);
    // Claude commands get --prompt-suggestions false unless they set it; other commands stay unchanged.
    const startOf = name => tm3('display', '-p', '-t', pa.find(x => x.package === name).pane, '#{pane_start_command}');
    assert.ok(startOf('b').includes('--prompt-suggestions false'));
    assert.ok(startOf('a').includes('--prompt-suggestions true') && !startOf('a').includes('--prompt-suggestions false'));
    assert.ok(!startOf('x').includes('prompt-suggestions'));
    // State file: percent from tokens and window.
    const a = ok({}, 'context', '--package', 'a').panes[0].context;
    assert.deepStrictEqual([a.state, a.tokens, a.window, a.percent, a.source], ['measured', 50000, 200000, 25, 'statusline']);
    assert.ok(a.age >= 5 && a.age < 60);
    // Only a transcript: tokens of the last answer, percent unknown, no content echoed.
    write(path.join(home, '.claude', 'projects', '-some-cwd', idOfB + '.jsonl'), fs.readFileSync(path.join(home, '.claude', 'projects', '-some-cwd', idB + '.jsonl')));
    const rb = run({}, 'context', '--package', 'b');
    assert.ok(!rb.stdout.includes('SECRET'));
    const b = JSON.parse(rb.stdout).panes[0].context;
    assert.deepStrictEqual([b.state, b.tokens, b.window, b.percent, b.source, b.compacted], ['measured', 3042, null, null, 'transcript', undefined]);
    // No data, codex-like pane without session id: unknown.
    assert.strictEqual(ok({}, 'context', '--package', 'x').panes[0].context.state, 'unknown');
    // list carries the context per pane; context without selector lists all panes.
    const listed = ok({}, 'list').panes;
    assert.deepStrictEqual(listed.map(x => [x.package, x.context.state]).sort(), [['a', 'measured'], ['b', 'measured'], ['x', 'unknown']]);
    assert.strictEqual(ok({}, 'context').panes.length, 3);
    // --self uses the session id of the environment; compaction after the last answer is flagged.
    const self = ok({ CLAUDE_CODE_SESSION_ID: idC }, 'context', '--self');
    assert.deepStrictEqual([self.context.tokens, self.context.percent, self.context.compacted], [510, null, true]);
    assert.strictEqual(ok({ CLAUDE_CODE_SESSION_ID: idA }, 'context', '--self').context.percent, 25);
    assert.strictEqual(ok({}, 'context', '--self').context.state, 'unknown');
    assert.strictEqual(ok({ CLAUDE_CODE_SESSION_ID: '../../etc/passwd' }, 'context', '--self').context.state, 'unknown');
    assert.strictEqual(ok({ CLAUDE_CODE_SESSION_ID: idX }, 'context', '--self').context.state, 'unknown');
    // A malformed state file counts as no measurement.
    write(path.join(stateDir, idX + '.json'), '{broken');
    assert.strictEqual(ok({ CLAUDE_CODE_SESSION_ID: idX }, 'context', '--self').context.state, 'unknown');
    // Stop decision against the threshold (default 60): over, under, unknown after compaction, unknown without.
    const decision = res => [res.stop, res.reason];
    const idD = '66666666-6666-4666-8666-666666666666';
    write(path.join(stateDir, idD + '.json'), JSON.stringify({ tokens: 150000, window: 200000, at: Date.now() }));
    const over = ok({ CLAUDE_CODE_SESSION_ID: idD }, 'context', '--self');
    assert.deepStrictEqual([over.threshold, ...decision(over)], [60, true, 'threshold']);
    assert.deepStrictEqual(decision(ok({ CLAUDE_CODE_SESSION_ID: idD }, 'context', '--self', '--threshold', '80')), [false, 'below']);
    assert.deepStrictEqual(decision(ok({ CLAUDE_CODE_SESSION_ID: idA }, 'context', '--self')), [false, 'below']);
    assert.deepStrictEqual(decision(ok({ CLAUDE_CODE_SESSION_ID: idA }, 'context', '--self', '--threshold', '25')), [true, 'threshold']);
    assert.deepStrictEqual(decision(ok({ CLAUDE_CODE_SESSION_ID: idC }, 'context', '--self')), [true, 'compacted']);
    assert.deepStrictEqual(decision(ok({}, 'context', '--self')), [false, 'unknown']);
    assert.deepStrictEqual(decision(ok({}, 'context', '--package', 'b').panes[0]), [false, 'unknown']);
    for (const bad of ['0', '101', 'x']) assert.strictEqual(run({}, 'context', '--self', '--threshold', bad).status, 2);
    assert.strictEqual(run({}, 'context', '--self', '--threshold').status, 2);
    // The supervisor judges the integrator the same way.
    ok({}, 'add', '--role', 'integrator', ...common, '--', fake, '--session-id', idD);
    const integ = ok({}, 'context', '--role', 'integrator', '--threshold', '70');
    assert.deepStrictEqual([integ.threshold, integ.panes.length, integ.panes[0].role, ...decision(integ.panes[0])], [70, 1, 'integrator', true, 'threshold']);
    assert.deepStrictEqual(ok({}, 'context').panes.map(x => [x.package || x.role, x.stop]).sort(),
      [['a', false], ['b', false], ['integrator', true], ['x', false]]);
  } finally {
    try { tm3('kill-server'); } catch { /* already gone */ }
    if (socketPath3) fs.rmSync(socketPath3, { force: true });
  }

  // Replacement: done with rest, continuation package, open handovers exactly once across an integrator switch.
  const sockSwitch = `qatlas-test-switch-${process.pid}`;
  const tmSwitch = (...args) => execFileSync('tmux', ['-L', sockSwitch, ...args], { encoding: 'utf8' }).trim();
  let socketPathSwitch = null;
  try {
    const repo = fs.realpathSync(fs.mkdtempSync(path.join(root, 'switch-')));
    tmSwitch('new-session', '-d', '-x', '80', '-y', '24', '-s', 'base', 'sleep 300');
    socketPathSwitch = tmSwitch('display', '-p', '#{socket_path}');
    const senv = { ...process.env, TMUX: `${socketPathSwitch},1,0` };
    const run = (...args) => spawnSync(process.execPath, [team, args[0], '--repo', repo, ...args.slice(1)], { encoding: 'utf8', env: senv });
    const ok = (...args) => { const res = run(...args); assert.strictEqual(res.status, 0, res.stderr); return JSON.parse(res.stdout); };
    const refused = (...args) => assert.strictEqual(run(...args).status, 2, args.join(' '));
    const common = ['--label', 'w', '--title', 't', '--cwd', repo];
    const dir = path.join(repo, '.qatlas', 'local', 'team');
    const log = () => fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
    for (const name of ['a', 'b', 'c']) ok('add', '--package', name, ...common, '--', 'sleep', '300');
    ok('add', '--role', 'integrator', ...common, '--', 'sleep', '300');
    ok('plan', '--budget', '5', '--package', 'a', '--tasks', 't1,t2,t4');
    ok('plan', '--budget', '5', '--package', 'b', '--tasks', 't3');
    ok('plan', '--budget', '5', '--package', 'c', '--tasks', 't5');
    // done with rest: validated ids, only for a lead whose title turns FERTIG with this call.
    refused('title', '--package', 'b', '--title', 'work', '--rest', 't3');
    refused('title', '--package', 'a', '--title', 'FERTIG · a', '--rest', 't2;rm');
    refused('title', '--package', 'a', '--title', 'FERTIG · a', '--rest', '-x');
    refused('title', '--package', 'a', '--title', 'FERTIG · a', '--rest', '');
    refused('title', '--role', 'integrator', '--title', 'FERTIG · i', '--rest', 't2');
    assert.deepStrictEqual(ok('title', '--package', 'a', '--title', 'FERTIG · a', '--rest', 't2,t4,t2').rest, ['t2', 't4']);
    refused('title', '--package', 'a', '--title', 'FERTIG · a again', '--rest', 't2');
    const done = ok('wait', '--since', '0', '--timeout', '0.01', '--min-free', '0.001').events.filter(e => e.type === 'done');
    assert.deepStrictEqual(done.map(e => [e.package, e.rest]), [['a', ['t2', 't4']]]);
    assert.deepStrictEqual(ok('report').packages.a.rest, ['t2', 't4']);
    // Continuation: only of a closed package, same run budget, its tasks, once; not counted as a package.
    refused('plan', '--budget', '5', '--package', 'a2', '--tasks', 't2,t4', '--continues', 'a');
    ok('capture', '--package', 'a');
    ok('close', '--package', 'a');
    refused('plan', '--budget', '6', '--package', 'a2', '--tasks', 't2,t4', '--continues', 'a');
    refused('plan', '--budget', '5', '--package', 'a2', '--tasks', 't2,t9', '--continues', 'a');
    refused('plan', '--budget', '5', '--package', 'b', '--tasks', 't2', '--continues', 'a');
    refused('plan', '--budget', '5', '--package', 'a2', '--tasks', 't2', '--continues', 'zz');
    refused('plan', '--budget', '5', '--package', 'a2', '--tasks', 't2', '--continues');
    assert.deepStrictEqual(ok('plan', '--budget', '5', '--package', 'a2', '--tasks', 't2,t4', '--continues', 'a').continues, 'a');
    refused('plan', '--budget', '5', '--package', 'a3', '--tasks', 't2', '--continues', 'a');
    let rep = ok('report');
    assert.strictEqual(rep.plan.budget, 5);
    assert.deepStrictEqual(Object.keys(rep.plan.packages).sort(), ['a', 'b', 'c']);
    assert.deepStrictEqual(rep.plan.continuations, { a2: { continues: 'a', tasks: ['t2', 't4'] } });
    ok('add', '--package', 'a2', ...common, '--', 'sleep', '300');
    // Handovers before the switch: b answered and picked, a2 answered but not picked, c open with a changed report.
    const hand = (name, task, text, timeout = '0.01') => ok('handover', '--package', name, '--task', task, '--report', text, '--timeout', timeout);
    hand('b', 't3', 'report b');
    hand('a2', 't2', 'report a2');
    hand('c', 't5', 'report c v1');
    hand('c', 't5', 'report c v2');
    ok('answer', '--package', 'b', '--answer', 'integrated b1');
    assert.strictEqual(hand('b', 't3', 'report b', '5').answer, 'integrated b1');
    ok('answer', '--package', 'a2', '--answer', 'integrated a1');
    refused('answer', '--package', 'a2', '--answer', 'integrated a1');
    // Checks mode: a rejected resubmission raises nothing, so the open report stays the one offered; after a
    // rework the resubmitted report is offered again.
    const code = setup('switch-code');
    const codeTree = git(code.repo, 'rev-parse', 'task^{tree}');
    const checked = (tag, t = codeTree) => { const f = path.join(repo, `report-${tag}.md`);
      write(f, `---\nbranch: task\nchecks:\n  - command: node test\n    exit: 0\n    tree: "${t}"\n---\n${tag}\n`); return f; };
    const handD = (f, timeout = '0.01') => run('handover', '--code-repo', code.repo, '--package', 'd', '--task', 't6', '--report', f,
      '--timeout', timeout);
    const offeredNow = () => ok('wait', '--role', 'integrator', '--since', '0', '--timeout', '0.01').events;
    ok('add', '--package', 'd', ...common, '--', 'sleep', '300');
    assert.strictEqual(handD(checked('v1')).status, 0);
    assert.strictEqual(handD(checked('v2', '1'.repeat(40))).status, 2);
    let forD = offeredNow().filter(e => e.package === 'd');
    assert.deepStrictEqual(forD.map(e => e.task), ['t6']);
    assert.match(fs.readFileSync(forD[0].report, 'utf8'), /\nv1\n/);
    ok('answer', '--package', 'd', '--answer', 'rework fix it');
    assert.deepStrictEqual(offeredNow().filter(e => e.package === 'd'), []);
    assert.strictEqual(JSON.parse(handD(checked('v1'), '5').stdout).answer, 'rework fix it');
    assert.strictEqual(handD(checked('v3')).status, 0);
    const byPkg = () => Object.fromEntries(ok('list').panes.map(x => [x.package || x.role, x]));
    assert.deepStrictEqual([byPkg().a2.kind, byPkg().a2.answered, byPkg().c.kind, byPkg().c.answered], ['handover', true, 'handover', undefined]);
    // The old integrator is replaced only once it shows FERTIG; plain add stays refused.
    refused('add', '--role', 'integrator', '--replace', ...common, '--', 'sleep', '300');
    refused('add', '--package', 'd', '--replace', ...common, '--', 'sleep', '300');
    assert.notStrictEqual(run('add', '--role', 'integrator', ...common, '--', 'sleep', '300').status, 0);
    const oldPane = byPkg().integrator.pane;
    ok('nudge', '--role', 'integrator', '--text', 'finish the running integration, then FERTIG');
    ok('title', '--role', 'integrator', '--title', 'FERTIG · integrator');
    const swapped = ok('add', '--role', 'integrator', '--replace', ...common, '--', 'sleep', '300');
    assert.strictEqual(swapped.replaced.pane, oldPane);
    assert.ok(fs.existsSync(swapped.replaced.file));
    const integrators = ok('list').panes.filter(x => x.role === 'integrator');
    assert.deepStrictEqual(integrators.map(x => x.pane), [swapped.pane]);
    assert.notStrictEqual(swapped.pane, oldPane);
    // The new integrator gets exactly the open handovers, each with its latest report; after its answers, none.
    let offered = ok('wait', '--role', 'integrator', '--since', '0', '--timeout', '0.01').events;
    assert.deepStrictEqual(offered.map(e => [e.package, e.task]), [['c', 't5'], ['d', 't6']]);
    assert.strictEqual(fs.readFileSync(offered[0].report, 'utf8'), 'report c v2\n');
    assert.match(fs.readFileSync(offered[1].report, 'utf8'), /\nv3\n/);
    ok('answer', '--package', 'c', '--answer', 'integrated c1');
    refused('answer', '--package', 'c', '--answer', 'rework again');
    ok('answer', '--package', 'd', '--answer', 'integrated d1');
    refused('answer', '--package', 'd', '--answer', 'integrated d1');
    assert.deepStrictEqual(ok('wait', '--role', 'integrator', '--since', '0', '--timeout', '0.01').events, []);
    assert.strictEqual(log().filter(e => e.type === 'answer' && e.package === 'c').length, 1);
    // A later handover reaches the new integrator; a dead integrator is replaced as well, and replacing
    // the last pane keeps the run log.
    hand('b', 't3', 'report b again');
    offered = ok('wait', '--role', 'integrator', '--since', '0', '--timeout', '0.01').events;
    assert.deepStrictEqual(offered.map(e => [e.package, e.task]), [['b', 't3']]);
    ok('answer', '--package', 'b', '--answer', 'integrated b2');
    for (const name of ['a2', 'b', 'c', 'd']) ok('close', '--package', name);
    refused('add', '--role', 'integrator', '--replace', ...common, '--', 'sleep', '1');
    ok('title', '--role', 'integrator', '--title', 'FERTIG · integrator 2');
    ok('add', '--role', 'integrator', '--replace', ...common, '--', 'sleep', '1');
    const deadline = Date.now() + 5000;
    while (!ok('list').panes.every(x => x.dead) && Date.now() < deadline) spawnSync('sleep', ['0.1']);
    const last = ok('add', '--role', 'integrator', '--replace', ...common, '--', 'sleep', '300');
    assert.ok(last.replaced);
    assert.deepStrictEqual(ok('list').panes.map(x => x.role), ['integrator']);
    assert.deepStrictEqual(fs.readdirSync(dir).filter(f => /^events-/.test(f)), []);
    rep = ok('report');
    assert.deepStrictEqual(Object.keys(rep.plan.packages).sort(), ['a', 'b', 'c']);
    assert.strictEqual(log().filter(e => e.type === 'start' && e.role === 'integrator').length, 4);
  } finally {
    try { tmSwitch('kill-server'); } catch { /* already gone */ }
    if (socketPathSwitch) fs.rmSync(socketPathSwitch, { force: true });
  }

  // Handover validation timing: only a new or changed report is validated; a repeated call with the unchanged
  // report delivers the answer even after the branch is gone. Own tmux server.
  const sockVal = `qatlas-test-val-${process.pid}`;
  const tmVal = (...args) => execFileSync('tmux', ['-L', sockVal, ...args], { encoding: 'utf8' }).trim();
  let socketPathVal = null;
  try {
    const repo = fs.realpathSync(fs.mkdtempSync(path.join(root, 'val-')));
    tmVal('new-session', '-d', '-x', '80', '-y', '24', '-s', 'base', 'sleep 300');
    socketPathVal = tmVal('display', '-p', '#{socket_path}');
    const venv = { ...process.env, TMUX: `${socketPathVal},1,0` };
    const run = (...args) => spawnSync(process.execPath, [team, args[0], '--repo', repo, ...args.slice(1)], { encoding: 'utf8', env: venv });
    const ok = (...args) => { const res = run(...args); assert.strictEqual(res.status, 0, res.stderr); return JSON.parse(res.stdout); };
    const log = () => { try { return fs.readFileSync(path.join(repo, '.qatlas', 'local', 'team', 'events.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { return []; } };
    const common = ['--label', 'w', '--title', 't', '--cwd', repo];
    const hand = (code, pkg, file, timeout = '0.01') => run('handover', '--code-repo', code.repo, '--package', pkg, '--task', 'tv', '--report', file, '--timeout', timeout);
    const pane = pkg => ok('list').panes.find(x => x.package === pkg);
    const handovers = pkg => log().filter(e => e.type === 'handover' && e.package === pkg).length;
    const removeBranch = code => { git(code.repo, 'checkout', '-q', 'main'); git(code.repo, 'merge', '-q', '--ff-only', 'task'); git(code.repo, 'branch', '-q', '-D', 'task'); };
    const prReport = (code, tag) => { const f = path.join(repo, `val-${tag}.md`);
      write(f, `---\nbranch: task\nbase: main\npr-title: "feat: add b"\npr-body: x\nlast: true\npr: 16\nhead: ${code.sha}\npushed: ${code.sha}\n---\n${tag}\n`); return f; };
    for (const pkg of ['a', 'b', 'c', 'd', 'e']) ok('add', '--package', pkg, ...common, '--', 'sleep', '300');

    // Plain frontmatter and PR frontmatter: the answer arrives after fast-forward and branch deletion.
    for (const [pkg, mk] of [['a', code => code.report], ['b', code => prReport(code, 'pr')]]) {
      const code = setup(`val-${pkg}`);
      const file = mk(code);
      assert.strictEqual(hand(code, pkg, file).status, 0);
      removeBranch(code);
      assert.strictEqual(git(code.repo, "branch", "--list", "task"), "");
      ok('answer', '--package', pkg, '--answer', `integrated ${code.sha}`);
      const res = hand(code, pkg, file, '5');
      assert.strictEqual(res.status, 0, res.stderr);
      assert.strictEqual(JSON.parse(res.stdout).answer, `integrated ${code.sha}`);
      assert.strictEqual(pane(pkg).kind, undefined);
      if (pkg === 'a') {
        // After picked the next handover of the task is validated again.
        const again = hand(code, pkg, file);
        assert.strictEqual(again.status, 2);
        assert.match(again.stderr, /does not resolve to a commit/);
        assert.strictEqual(pane(pkg).kind, undefined);
        assert.strictEqual(handovers(pkg), 1);
      }
    }

    // A new report with two commits is rejected without signal and event.
    const bad = setup('val-c', { extra: ['d.txt'] });
    let res = hand(bad, 'c', bad.report);
    assert.strictEqual(res.status, 2);
    assert.match(res.stderr, /non-merge commits over main/);
    assert.strictEqual(pane('c').kind, undefined);
    assert.strictEqual(handovers('c'), 0);

    // A changed report without a pending answer is validated; the rejection leaves the open signal as it was.
    const good = setup('val-d');
    assert.strictEqual(hand(good, 'd', good.report).status, 0);
    const changed = path.join(repo, 'val-d-changed.md');
    write(changed, fs.readFileSync(good.report, 'utf8').replace('last: true', 'last: true\ncut-exception: ""'));
    res = hand(good, 'd', changed);
    assert.strictEqual(res.status, 2);
    assert.strictEqual(pane('d').kind, 'handover');
    assert.strictEqual(handovers('d'), 1);

    // A changed report with a pending answer delivers the answer, also with the branch gone.
    const kept = setup('val-e');
    assert.strictEqual(hand(kept, 'e', kept.report).status, 0);
    removeBranch(kept);
    ok('answer', '--package', 'e', '--answer', 'rework fix it');
    const other = path.join(repo, 'val-e-changed.md');
    write(other, fs.readFileSync(kept.report, 'utf8') + 'more\n');
    res = hand(kept, 'e', other, '5');
    assert.strictEqual(res.status, 0, res.stderr);
    assert.strictEqual(JSON.parse(res.stdout).answer, 'rework fix it');
    assert.strictEqual(handovers('e'), 1);
  } finally {
    try { tmVal('kill-server'); } catch { /* already gone */ }
    if (socketPathVal) fs.rmSync(socketPathVal, { force: true });
  }

  // Statusline renderer: stores the context state without changing its output.
  {
    const render = path.join(skill, '..', '..', 'scripts', 'qatlas-statusline-render-claude.js');
    const home = fs.realpathSync(fs.mkdtempSync(path.join(root, 'sl-home-')));
    const sid = '55555555-5555-4555-8555-555555555555';
    const input = JSON.stringify({ session_id: sid, model: { display_name: 'm' },
      context_window: { current_usage: { input_tokens: 10, cache_read_input_tokens: 20000, cache_creation_input_tokens: 5 }, context_window_size: 100000 } });
    const draw = (h, stdin) => spawnSync(process.execPath, [render], { encoding: 'utf8', input: stdin, env: { ...process.env, HOME: h, NO_COLOR: '1' } });
    const first = draw(home, input);
    assert.strictEqual(first.status, 0, first.stderr);
    const saved = JSON.parse(fs.readFileSync(path.join(home, '.qatlas', 'state', 'context', sid + '.json'), 'utf8'));
    assert.deepStrictEqual([saved.tokens, saved.window], [20015, 100000]);
    assert.ok(Math.abs(Date.now() - saved.at) < 60000);
    assert.deepStrictEqual(fs.readdirSync(path.join(home, '.qatlas', 'state', 'context')), [sid + '.json']);
    // Same output where the state directory cannot be created, and without a session id nothing is written.
    const blocked = fs.realpathSync(fs.mkdtempSync(path.join(root, 'sl-blocked-')));
    write(path.join(blocked, '.qatlas'), 'file instead of directory');
    const second = draw(blocked, input);
    assert.strictEqual(second.status, 0, second.stderr);
    assert.strictEqual(second.stdout, first.stdout);
    const home2 = fs.realpathSync(fs.mkdtempSync(path.join(root, 'sl-home2-')));
    const third = draw(home2, JSON.stringify({ ...JSON.parse(input), session_id: undefined }));
    assert.strictEqual(third.stdout, first.stdout);
    assert.ok(!fs.existsSync(path.join(home2, '.qatlas', 'state', 'context')));
    const evil = draw(home2, JSON.stringify({ ...JSON.parse(input), session_id: '../../x' }));
    assert.strictEqual(evil.stdout, first.stdout);
    assert.ok(!fs.existsSync(path.join(home2, '.qatlas', 'state', 'context')));
  }

  process.stdout.write('✓ Qatlas-Run-Tools: land, ci-wait und Handover-Prüfung erfolgreich.\n');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
