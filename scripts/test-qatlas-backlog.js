#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const script = path.resolve(__dirname, '..', 'plugins', 'qatlas', 'scripts', 'qatlas-backlog.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qatlas-backlog-'));
process.on('exit', () => fs.rmSync(root, { recursive: true, force: true }));

const gitEnv = home => ({ ...process.env, HOME: home, GIT_CONFIG_GLOBAL: path.join(home, '.gitconfig'),
  GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'Qatlas Test', GIT_AUTHOR_EMAIL: 'qatlas@example.invalid',
  GIT_COMMITTER_NAME: 'Qatlas Test', GIT_COMMITTER_EMAIL: 'qatlas@example.invalid' });

function git(home, cwd, ...args) {
  const result = spawnSync('git', args, { cwd, env: gitEnv(home), encoding: 'utf8' });
  assert.strictEqual(result.status, 0, 'git ' + args.join(' ') + ': ' + result.stderr);
  return result.stdout.trim();
}

// One device: a home folder and a checkout of the project.
function device(name, from = null) {
  const home = path.join(root, name, 'home');
  const project = path.join(root, name, 'project');
  fs.mkdirSync(home, { recursive: true });
  if (from) git(home, root, 'clone', '-q', from, project);
  else { fs.mkdirSync(project, { recursive: true }); git(home, project, 'init', '-q', '-b', 'main'); }
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: project, env: gitEnv(home), encoding: 'utf8' });
  const ok = (...args) => {
    const result = run(...args);
    assert.strictEqual(result.status, 0, args.join(' ') + ': ' + result.stderr + result.stdout);
    return JSON.parse(result.stdout);
  };
  const refused = (...args) => {
    const result = run(...args);
    assert.strictEqual(result.status, 1, args.join(' ') + ' should be refused: ' + result.stdout);
    return result.stderr;
  };
  return { home, project, run, ok, refused, git: (...args) => git(home, project, ...args) };
}

const hasBranch = d => spawnSync('git', ['rev-parse', '-q', '--verify', 'refs/heads/qatlas-backlog'],
  { cwd: d.project, env: gitEnv(d.home) }).status === 0;
const local = (d, ...names) => path.join(d.project, '.qatlas', 'local', ...names);
// Nothing of a backlog exists: no branch, no checkout, no index and no lock.
const untouched = d => !hasBranch(d) && ['backlog', 'backlog.index', 'backlog.lock'].every(name => !fs.existsSync(local(d, name)));

function testFieldsAndIssues() {
  const d = device('one');
  fs.writeFileSync(path.join(d.project, 'code.txt'), 'code\n');
  d.git('add', 'code.txt');
  d.git('commit', '-q', '-m', 'Code');

  const preview = d.ok('fields');
  assert.strictEqual(preview.created, false, 'Reading starts no backlog.');
  assert.deepStrictEqual(preview.type.map(entry => entry.name), ['task', 'feature', 'bug', 'idea']);
  assert.strictEqual(preview.status.length, 7);
  assert.strictEqual(fs.existsSync(path.join(d.project, '.qatlas')), false, 'Reading writes nothing.');
  assert.deepStrictEqual(d.ok('list').issues, []);

  assert.ok(d.refused('set', '1', '--status', 'ready').includes('no local backlog yet. add, fields add or sync starts one.'));
  assert.ok(d.refused('add', '--title', 'Wrong type', '--type', 'nonsense').includes('Unknown type nonsense'));
  assert.ok(d.refused('add', '--title', 'No text', '--body-file', path.join(root, 'missing.md')).includes('not readable'));
  assert.ok(untouched(d), 'A refused command starts no backlog.');

  const text = path.join(root, 'one', 'text.md');
  fs.writeFileSync(text, '## Ergebnis\n\nA prepared text.\n');
  const first = d.ok('add', '--title', 'First task', '--body-file', text);
  assert.strictEqual(first.id, '0001');
  assert.strictEqual(first.status, 'draft');
  assert.ok(fs.readFileSync(first.path, 'utf8').endsWith('---\n\n## Ergebnis\n\nA prepared text.\n'), 'The text passes through as prepared.');
  assert.strictEqual(d.git('rev-list', '--count', 'qatlas-backlog'), '1', 'The first write starts the backlog in its commit.');
  assert.strictEqual(first.path, path.join(fs.realpathSync(d.project), '.qatlas', 'local', 'backlog', 'issues', '0001.md'),
    'Issues are checked out where agents may edit files.');
  assert.strictEqual(d.git('status', '--porcelain'), '', 'The project tree stays clean.');
  assert.strictEqual(d.git('worktree', 'list').split('\n').length, 1, 'The backlog is no registered worktree.');
  assert.strictEqual(d.git('rev-parse', '--abbrev-ref', 'HEAD'), 'main');
  assert.strictEqual(d.git('log', '--format=%s', 'qatlas-backlog').split('\n')[0], 'Add 0001: First task');
  assert.strictEqual(spawnSync('git', ['merge-base', 'main', 'qatlas-backlog'], { cwd: d.project, env: gitEnv(d.home) }).status, 1,
    'The branch shares no history with the code.');

  const idea = d.ok('add', '--title', 'Some idea', '--type', 'idea');
  assert.ok(!('status' in idea) && !('rank' in idea), 'An idea carries no status.');
  assert.strictEqual(d.ok('show', '2').body, '', 'Without a text an issue starts empty.');
  d.ok('add', '--title', 'Second', '--type', 'feature', '--status', 'ready', '--depends', '1');
  assert.deepStrictEqual(d.ok('list').issues.map(issue => issue.id), ['0001', '0003'], 'Ideas are no work.');
  assert.deepStrictEqual(d.ok('list', '--type', 'idea').issues.map(issue => issue.id), ['0002']);
  assert.strictEqual(d.ok('show', '3').executable, false, 'An open dependency holds a ready task back.');

  assert.ok(d.refused('set', '1', '--status', 'in-progress').includes('no way from draft to in-progress'));
  d.ok('set', '1', '--status', 'ready');
  d.ok('set', '1', '--status', 'in-progress');
  d.ok('set', '1', '--status', 'done');
  assert.strictEqual(d.ok('show', '3').executable, true);
  assert.deepStrictEqual(d.ok('list').issues.map(issue => issue.id), ['0003'], 'Done issues leave the list.');
  assert.strictEqual(d.ok('list', '--all').issues.length, 3);
  assert.ok(d.refused('set', '1', '--status', 'draft').includes('--force'));
  assert.strictEqual(d.ok('set', '1', '--status', 'draft', '--force').status, 'draft');

  assert.strictEqual(d.ok('set', '2', '--type', 'task').status, 'draft', 'An idea turned into work becomes a draft.');
  d.ok('move', '2', '--first');
  assert.deepStrictEqual(d.ok('list').issues.map(issue => issue.id), ['0002', '0001', '0003']);
  d.ok('move', '2', '--after', '1');
  assert.deepStrictEqual(d.ok('list').issues.map(issue => issue.id), ['0001', '0002', '0003']);

  assert.ok(d.refused('set', '1', '--labels', 'urgent').includes('unknown label urgent'));
  assert.ok(d.refused('set', '1', '--label', 'urgent').includes('set has no option --label'), 'An unknown option is no silent success.');
  d.ok('fields', 'add', 'labels', 'urgent');
  assert.deepStrictEqual(d.ok('set', '1', '--labels', 'urgent').labels, ['urgent']);
  assert.ok(d.refused('fields', 'remove', 'labels', 'urgent').includes('still carries'));

  d.ok('fields', 'add', 'status', 'blocked', '--means', 'waiting');
  d.ok('fields', 'add', 'status', 'parked');
  assert.strictEqual(d.ok('set', '3', '--status', 'blocked').means, 'waiting', 'An own status stands for a Qatlas status.');
  assert.strictEqual(d.ok('set', '2', '--status', 'waiting').status, 'waiting', 'A Qatlas status writes its first entry.');
  assert.strictEqual(d.ok('set', '2', '--status', 'parked').means, null, 'An own status may stand for none.');
  assert.ok(d.refused('fields', 'remove', 'status', 'review').includes('No status means review'));

  d.ok('fields', 'add', 'priority', 'high');
  d.ok('fields', 'add', 'priority', 'low');
  d.ok('set', '3', '--set', 'priority=high');
  d.ok('set', '1', '--set', 'priority=low');
  assert.deepStrictEqual(d.ok('list').issues.map(issue => issue.id), ['0003', '0001', '0002'], 'Priority sorts before rank.');
  assert.ok(d.refused('set', '1', '--set', 'priority=medium').includes('unknown priority medium'));
  assert.ok(d.refused('set', '1', '--set', 'size=3').includes('unknown field size'));
  d.ok('fields', 'add', 'size');
  assert.strictEqual(d.ok('set', '1', '--set', 'size=3').size, '3', 'A field without a selection takes any text.');
  assert.deepStrictEqual(d.ok('list', '--where', 'size=3').issues.map(issue => issue.id), ['0001']);
  assert.ok(d.refused('list', '--where', 'size').includes('key=value'));
  assert.ok(d.refused('list', '--where', 'weight=3').includes('Unknown field weight'));
  assert.ok(d.refused('list', '--status', 'nonsense').includes('Unknown status nonsense'));

  const file = d.ok('show', '1').path;
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('## Ergebnis', '## Ergebnis\n\nBecause.'));
  d.ok('save');
  assert.ok(d.ok('show', '1').body.includes('Because.'));
  assert.strictEqual(d.git('log', '--format=%s', '-1', 'qatlas-backlog'), 'Save edited issues');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('type: "task"', 'type: "nonsense"'));
  assert.ok(d.refused('save').includes('unknown type nonsense'), 'An invalid edit is not committed.');
  assert.ok(require(script).check(d.project).some(problem => problem.includes('unknown type nonsense')), 'The doctor sees it too.');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('type: "nonsense"', 'type: "task"'));
  assert.deepStrictEqual(require(script).check(d.project), []);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('status: "draft"', 'status: "in-progress"'));
  assert.ok(d.refused('save').includes('no way from draft to in-progress'), 'An edit in the file goes around no status way.');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('status: "in-progress"', 'status: "draft"'));
  fs.writeFileSync(text, 'Replaced.\n');
  assert.strictEqual(d.ok('set', '1', '--body-file', text) && d.ok('show', '1').body, '\nReplaced.\n');
  assert.strictEqual(d.ok('add', '--title', 'Kept id', '--id', '42').id, '0042');
  assert.ok(d.refused('add', '--title', 'Twice', '--id', '42').includes('exists'));

  const line = spawnSync(process.execPath, ['-e',
    'process.stdout.write(String(require(' + JSON.stringify(script) + ').summary(process.cwd())))'],
    { cwd: d.project, env: gitEnv(d.home), encoding: 'utf8' }).stdout;
  assert.ok(/^\d+ draft, .*1 no-status$/.test(line), 'The session start gets one line: ' + line);

  // A handover may be deferred, and work that never started may close as rejected or duplicate.
  const closed = d.ok('add', '--title', 'Rejected', '--status', 'review').id;
  d.ok('set', closed, '--status', 'deferred');
  assert.strictEqual(d.ok('set', closed, '--status', 'done').means, 'done');

  // Every working tree of the repo reaches the same backlog.
  const tree = path.join(root, 'one', 'tree');
  d.git('worktree', 'add', '-q', '-b', 'task/1-first', tree);
  const fromTree = spawnSync(process.execPath, [script, 'set', '3', '--status', 'ready'], { cwd: tree, env: gitEnv(d.home), encoding: 'utf8' });
  assert.strictEqual(fromTree.status, 0, fromTree.stderr);
  assert.strictEqual(d.ok('show', '3').status, 'ready');
  assert.strictEqual(fs.existsSync(path.join(tree, '.qatlas')), false, 'A linked working tree holds no checkout.');

  // A cleaned working tree loses the checkout, not the backlog.
  fs.rmSync(path.join(d.project, '.qatlas'), { recursive: true });
  assert.strictEqual(d.ok('list', '--all').issues.length, 5);
  assert.strictEqual(git(d.home, tree, 'status', '--porcelain'), '');
}

async function testParallelWriters() {
  const d = device('many');
  d.ok('add', '--title', 'Seed');
  const writers = Array.from({ length: 8 }, (_, index) => new Promise(resolve => {
    const child = spawn(process.execPath, [script, 'add', '--title', 'Parallel ' + index, '--body-file', '/dev/null'],
      { cwd: d.project, env: gitEnv(d.home) });
    let out = '';
    child.stdout.on('data', chunk => { out += chunk; });
    child.on('close', code => resolve({ code, out }));
  }));
  const results = await Promise.all(writers);
  assert.ok(results.every(result => result.code === 0), 'Every parallel writer succeeds.');
  const ids = results.map(result => JSON.parse(result.out).id);
  assert.strictEqual(new Set(ids).size, 8, 'Parallel writers get distinct ids.');
  assert.strictEqual(d.ok('list').issues.length, 9);
  assert.strictEqual(d.git('rev-list', '--count', 'qatlas-backlog'), '9', 'Every write is one commit.');

  // A lock belongs to its holder as long as that process lives, however old the lock is.
  const lock = local(d, 'backlog.lock');
  fs.writeFileSync(lock, String(spawnSync(process.execPath, ['-e', '']).pid));
  d.ok('add', '--title', 'After a dead holder');
  fs.writeFileSync(lock, String(process.pid));
  fs.utimesSync(lock, new Date(Date.now() - 600000), new Date(Date.now() - 600000));
  let ended = null;
  const waiting = new Promise(resolve => spawn(process.execPath, [script, 'add', '--title', 'After a living holder'],
    { cwd: d.project, env: gitEnv(d.home) }).on('close', code => { ended = code; resolve(); }));
  await new Promise(resolve => setTimeout(resolve, 1500));
  assert.strictEqual(ended, null, 'A writer waits for a living holder.');
  fs.rmSync(lock);
  await waiting;
  assert.strictEqual(ended, 0);
}

// git refuses the commit after the files are written: the checkout returns to what it was.
function testFailedCommit() {
  const d = device('failed');
  fs.writeFileSync(path.join(d.home, '.gitconfig'), '[user]\n\tuseConfigOnly = true\n');
  const env = gitEnv(d.home);
  for (const key of Object.keys(env)) if (/^GIT_(AUTHOR|COMMITTER)_/.test(key)) delete env[key];
  const nameless = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: d.project, env, encoding: 'utf8' });
  const start = nameless('add', '--title', 'No identity');
  assert.strictEqual(start.status, 1, start.stdout);
  assert.ok(start.stderr.includes('git commit-tree failed'), start.stderr);
  assert.ok(untouched(d), 'A start that git refuses leaves nothing.');
  const issue = d.ok('add', '--title', 'Kept');
  const before = fs.readFileSync(issue.path, 'utf8');
  assert.strictEqual(nameless('set', '1', '--title', 'Changed').status, 1);
  assert.strictEqual(fs.readFileSync(issue.path, 'utf8'), before, 'A commit that git refuses leaves the file as it was.');
  assert.strictEqual(nameless('fields', 'add', 'labels', 'late').status, 1);
  assert.deepStrictEqual(d.ok('fields').labels, []);
}

function testUserTemplate() {
  const d = device('template');
  const config = path.join(d.home, '.qatlas', 'plugins', 'config.json');
  fs.mkdirSync(path.dirname(config), { recursive: true });
  fs.writeFileSync(config, JSON.stringify({ format: 1, backlog: {
    type: [{ name: 'story' }, { name: 'note', work: false }], labels: ['frontend'] } }));
  const fields = d.ok('fields');
  assert.deepStrictEqual(fields.type.map(entry => entry.name), ['story', 'note']);
  assert.strictEqual(fields.status.length, 7, 'A field the user leaves out keeps the shipped selection.');
  assert.strictEqual(d.ok('add', '--title', 'Typed').type, 'story');
  fs.writeFileSync(config, JSON.stringify({ format: 1, backlog: { labels: ['other'] } }));
  assert.deepStrictEqual(d.ok('fields').labels, ['frontend'], 'A started backlog keeps its own fields.');
  fs.writeFileSync(config, JSON.stringify({ format: 1, backlog: { status: [{ name: 'open', means: 'ready' }] } }));
  const fresh = device('template-broken');
  fs.mkdirSync(path.dirname(path.join(fresh.home, '.qatlas', 'plugins', 'config.json')), { recursive: true });
  fs.copyFileSync(config, path.join(fresh.home, '.qatlas', 'plugins', 'config.json'));
  assert.ok(fresh.refused('add', '--title', 'No').includes('No status means draft'));
  // The block is read once, so a mistake in it stops the start instead of falling back to the shipped fields.
  fs.writeFileSync(path.join(fresh.home, '.qatlas', 'plugins', 'config.json'), JSON.stringify({ format: 1, backlog: { types: [{ name: 'story' }] } }));
  assert.ok(fresh.refused('add', '--title', 'No').includes('types is no known key'));
  fs.writeFileSync(path.join(fresh.home, '.qatlas', 'plugins', 'config.json'), '{ "format": 1, ');
  assert.ok(fresh.refused('add', '--title', 'No').includes('is repaired'));
  assert.ok(untouched(fresh));
  const { configProblems } = require(script);
  assert.deepStrictEqual(configProblems({ labels: ['frontend'] }), []);
  assert.deepStrictEqual(configProblems({ types: [], status: [{ name: 'open', means: 'ready' }] }).slice(0, 2),
    ['types is no known key.', 'No status means draft.']);
}

// sync merges with a git command that older versions lack; it says so before it touches anything.
function testOldGit() {
  if (process.platform === 'win32') return;
  const d = device('old-git');
  const real = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
  const bin = path.join(root, 'old-git', 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'git'), '#!/bin/sh\nif [ "$1" = version ]; then echo "git version 2.37.1"; else exec "' + real + '" "$@"; fi\n', { mode: 0o755 });
  const result = spawnSync(process.execPath, [script, 'sync'],
    { cwd: d.project, env: { ...gitEnv(d.home), PATH: bin + path.delimiter + process.env.PATH }, encoding: 'utf8' });
  assert.strictEqual(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes('2.38') && result.stderr.includes('2.37.1'), result.stderr);
  assert.ok(untouched(d));
}

function testTravel() {
  const remote = path.join(root, 'remote.git');
  git(root, root, 'init', '-q', '--bare', '-b', 'main', remote);
  const a = device('a');
  fs.writeFileSync(path.join(a.project, 'code.txt'), 'code\n');
  a.git('add', 'code.txt');
  a.git('commit', '-q', '-m', 'Code');
  a.git('remote', 'add', 'origin', remote);
  a.git('push', '-q', '-u', 'origin', 'main');
  assert.strictEqual(a.ok('sync').synced, true, 'A sync without a backlog starts and pushes one.');
  a.ok('add', '--title', 'From A');
  a.ok('add', '--title', 'Shared');
  assert.strictEqual(a.ok('sync').pushed, true);

  const b = device('b', remote);
  assert.deepStrictEqual(b.ok('list').issues.map(issue => issue.title), ['From A', 'Shared'], 'A clone takes the backlog over.');
  b.ok('set', '1', '--status', 'ready');
  assert.strictEqual(b.ok('sync').pushed, true);
  const pulled = a.ok('sync');
  assert.strictEqual(pulled.updated, true);
  assert.strictEqual(a.ok('show', '1').status, 'ready', 'A sync brings the other device\'s state.');

  a.ok('set', '1', '--title', 'From A, renamed');
  b.ok('add', '--title', 'From B', '--id', '10');
  a.ok('sync');
  assert.strictEqual(b.ok('sync').merged, true, 'Changes to different issues merge by themselves.');
  a.ok('sync');
  assert.deepStrictEqual(a.ok('list').issues.map(issue => issue.title), ['From A, renamed', 'Shared', 'From B']);

  // A conflict in one issue, while the other device also added an issue and changed another one.
  a.ok('set', '2', '--status', 'ready');
  a.ok('set', '1', '--title', 'From A, renamed twice');
  const added = a.ok('add', '--title', 'Only on A').id;
  b.ok('set', '2', '--status', 'waiting');
  a.ok('sync');
  const conflict = b.run('sync');
  assert.strictEqual(conflict.status, 2, conflict.stdout + conflict.stderr);
  const report = JSON.parse(conflict.stdout);
  assert.deepStrictEqual(report.files, ['issues/0002.md']);
  assert.deepStrictEqual(report.collisions, []);
  assert.ok(fs.readFileSync(path.join(report.remote, 'issues', '0002.md'), 'utf8').includes('status: "ready"'));
  assert.strictEqual(b.ok('show', '2').status, 'waiting', 'A conflict leaves the local state alone.');
  assert.strictEqual(b.ok('sync', '--resolved').merged, true);
  assert.strictEqual(b.ok('show', added).title, 'Only on A', 'Resolving keeps what only the other device added.');
  assert.strictEqual(b.ok('show', '1').title, 'From A, renamed twice', 'Resolving keeps what only the other device changed.');
  assert.strictEqual(b.ok('show', '2').status, 'waiting', 'The checkout decides the conflicted file.');
  assert.strictEqual(fs.existsSync(report.remote), false, 'The remote versions go once the conflict is resolved.');
  a.ok('sync');
  assert.strictEqual(a.ok('show', '2').status, 'waiting');
  assert.strictEqual(a.ok('show', added).title, 'Only on A');
  assert.strictEqual(a.git('status', '--porcelain'), '');

  // Both devices add an issue offline and get the same number.
  const twin = a.ok('add', '--title', 'Twin of A').id;
  assert.strictEqual(b.ok('add', '--title', 'Twin of B').id, twin);
  a.ok('sync');
  const collision = JSON.parse(b.run('sync').stdout);
  assert.deepStrictEqual(collision.collisions, ['issues/' + twin + '.md'], 'A collision of numbers is named as one.');
  assert.ok(Number(collision.free) > Number(twin), 'The report names a number that is free on both sides.');
  b.ok('add', '--title', 'Twin of B', '--id', collision.free);
  fs.copyFileSync(path.join(collision.remote, 'issues', twin + '.md'), path.join(collision.local, 'issues', twin + '.md'));
  b.ok('sync', '--resolved');
  a.ok('sync');
  assert.deepStrictEqual(a.ok('list').issues.map(issue => issue.title).filter(title => title.startsWith('Twin')).sort(),
    ['Twin of A', 'Twin of B']);

  // --resolved settles the conflict that was reported and no further one that arose since.
  a.ok('set', '1', '--title', 'Title of A');
  b.ok('set', '1', '--title', 'Title of B');
  a.ok('sync');
  assert.strictEqual(b.run('sync').status, 2);
  a.ok('set', '2', '--title', 'Shared of A');
  a.ok('sync');
  b.ok('set', '2', '--title', 'Shared of B');
  const further = b.run('sync', '--resolved');
  assert.strictEqual(further.status, 2, 'A conflict the user has not seen is reported, not settled.');
  assert.deepStrictEqual(JSON.parse(further.stdout).files.sort(), ['issues/0001.md', 'issues/0002.md']);
  assert.strictEqual(b.ok('sync', '--resolved').merged, true);
  a.ok('sync');
  assert.deepStrictEqual([a.ok('show', '1').title, a.ok('show', '2').title], ['Title of B', 'Shared of B']);

  // A clone with a second remote that carries the branch too: reading takes over the one of origin and starts nothing.
  const c = device('c', remote);
  c.git('remote', 'add', 'other', remote);
  c.git('fetch', '-q', 'other');
  assert.strictEqual(c.ok('list').issues.length, a.ok('list').issues.length);
  assert.strictEqual(c.git('rev-parse', 'qatlas-backlog'), c.git('rev-parse', 'origin/qatlas-backlog'), 'Reading starts no second backlog.');

  // No secret enters the history of the backlog, so whatever sync pushes is clean.
  const secret = path.join(root, 'secret.md');
  fs.writeFileSync(secret, 'Key: -----BEGIN ' + 'PRIVATE KEY-----\n');
  const clean = a.git('rev-parse', 'qatlas-backlog');
  const count = a.ok('list', '--all').issues.length;
  assert.ok(a.refused('add', '--title', 'Leaking', '--body-file', secret).includes('possible secrets'));
  assert.strictEqual(a.ok('list', '--all').issues.length, count, 'A refused issue leaves no file.');
  const kept = a.ok('add', '--title', 'Edited by hand');
  fs.appendFileSync(kept.path, fs.readFileSync(secret, 'utf8'));
  assert.ok(a.refused('save').includes('issues/' + kept.id + '.md:'), 'The refusal names the place.');
  assert.ok(fs.readFileSync(kept.path, 'utf8').includes('PRIVATE KEY'), 'The edited text stays for correction.');
  fs.writeFileSync(kept.path, fs.readFileSync(kept.path, 'utf8').replace(/^Key: .*$/m, 'Key removed.'));
  a.ok('save');
  assert.strictEqual(a.git('log', '--format=%H', '-S', 'PRIVATE KEY', clean + '..qatlas-backlog'), '', 'No commit holds the secret.');
  assert.strictEqual(a.ok('sync').pushed, true);
  // The project value counts only as committed in the project.
  const projectFile = path.join(a.project, '.qatlas', 'plugins', 'config.json');
  fs.mkdirSync(path.dirname(projectFile), { recursive: true });
  fs.writeFileSync(projectFile, JSON.stringify({ format: 1, protection: { secrets: 'allow' } }));
  assert.ok(a.refused('add', '--title', 'Uncommitted project value', '--body-file', secret).includes('possible secrets'));
  a.git('add', '.qatlas/plugins/config.json');
  a.git('commit', '-q', '-m', 'Allow secrets');
  a.ok('add', '--title', 'Allowed by the project', '--body-file', secret);
  a.git('rm', '-q', '.qatlas/plugins/config.json');
  a.git('commit', '-q', '-m', 'Block secrets again');
  assert.ok(a.refused('add', '--title', 'Blocked again', '--body-file', secret).includes('possible secrets'));
  fs.mkdirSync(path.join(a.home, '.qatlas', 'plugins'), { recursive: true });
  fs.writeFileSync(path.join(a.home, '.qatlas', 'plugins', 'config.json'), JSON.stringify({ format: 1, protection: { secrets: 'allow' } }));
  a.ok('add', '--title', 'Allowed by the user', '--body-file', secret);
}

// A relative path of a remote counts from the project, also once the checkout exists.
function testRelativeRemote() {
  git(root, root, 'init', '-q', '--bare', '-b', 'main', path.join(root, 'relative.git'));
  const d = device('relative');
  d.git('remote', 'add', 'origin', path.join('..', '..', 'relative.git'));
  d.ok('add', '--title', 'First');
  assert.strictEqual(d.ok('sync').pushed, true);
  d.ok('add', '--title', 'Second');
  assert.strictEqual(d.ok('sync').pushed, true);
  assert.strictEqual(git(root, path.join(root, 'relative.git'), 'rev-parse', 'qatlas-backlog'), d.git('rev-parse', 'qatlas-backlog'));
}

(async () => {
  testFieldsAndIssues();
  await testParallelWriters();
  testFailedCommit();
  testUserTemplate();
  testOldGit();
  testTravel();
  testRelativeRemote();
  process.stdout.write('✓ Qatlas backlog: fields, issues, parallel writers, failed commit, user template, old git, travel and relative remote passed.\n');
})().catch(error => { console.error(error); process.exit(1); });
