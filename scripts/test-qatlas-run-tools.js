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
  } finally {
    try { tm3('kill-server'); } catch { /* already gone */ }
    if (socketPath3) fs.rmSync(socketPath3, { force: true });
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
