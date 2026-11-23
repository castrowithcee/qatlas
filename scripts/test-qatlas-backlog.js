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

  const first = d.ok('add', '--title', 'First task');
  assert.strictEqual(first.id, '0001');
  assert.strictEqual(first.status, 'draft');
  assert.ok(fs.readFileSync(first.path, 'utf8').includes('## Erledigt, wenn'), 'A task starts from the template.');
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
  d.ok('add', '--title', 'Second', '--type', 'feature', '--status', 'ready', '--depends', '1');
  assert.deepStrictEqual(d.ok('list').issues.map(issue => issue.id), ['0001', '0003'], 'Ideas are no work.');
  assert.deepStrictEqual(d.ok('list', '--type', 'idea').issues.map(issue => issue.id), ['0002']);
  assert.strictEqual(d.ok('show', '3').executable, false, 'An open dependency holds a ready task back.');

  assert.ok(d.refused('set', '1', '--status', 'done').includes('no way from draft to done'));
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

  const file = d.ok('show', '1').path;
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('## Warum', '## Warum\n\nBecause.'));
  d.ok('save');
  assert.ok(d.ok('show', '1').body.includes('Because.'));
  assert.strictEqual(d.git('log', '--format=%s', '-1', 'qatlas-backlog'), 'Save edited issues');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('type: "task"', 'type: "nonsense"'));
  assert.ok(d.refused('save').includes('unknown type nonsense'), 'An invalid edit is not committed.');
  assert.strictEqual(d.run('check').status, 1);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('type: "nonsense"', 'type: "task"'));
  assert.deepStrictEqual(d.ok('check').problems, []);
  assert.strictEqual(d.ok('add', '--title', 'Kept id', '--id', '42').id, '0042');
  assert.ok(d.refused('add', '--title', 'Twice', '--id', '42').includes('exists'));

  const line = spawnSync(process.execPath, ['-e',
    'process.stdout.write(String(require(' + JSON.stringify(script) + ').summary(process.cwd())))'],
    { cwd: d.project, env: gitEnv(d.home), encoding: 'utf8' }).stdout;
  assert.ok(/^\d+ draft, .*1 no-status$/.test(line), 'The session start gets one line: ' + line);

  // Every working tree of the repo reaches the same backlog.
  const tree = path.join(root, 'one', 'tree');
  d.git('worktree', 'add', '-q', '-b', 'task/1-first', tree);
  const fromTree = spawnSync(process.execPath, [script, 'set', '3', '--status', 'ready'], { cwd: tree, env: gitEnv(d.home), encoding: 'utf8' });
  assert.strictEqual(fromTree.status, 0, fromTree.stderr);
  assert.strictEqual(d.ok('show', '3').status, 'ready');
  assert.strictEqual(fs.existsSync(path.join(tree, '.qatlas')), false, 'A linked working tree holds no checkout.');

  // A cleaned working tree loses the checkout, not the backlog.
  fs.rmSync(path.join(d.project, '.qatlas'), { recursive: true });
  assert.strictEqual(d.ok('list', '--all').issues.length, 4);
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
  assert.strictEqual(d.git('rev-list', '--count', 'qatlas-backlog'), '10', 'Every write is one commit.');
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

  a.ok('set', '2', '--status', 'ready');
  b.ok('set', '2', '--status', 'waiting');
  a.ok('sync');
  const conflict = b.run('sync');
  assert.strictEqual(conflict.status, 2, conflict.stdout + conflict.stderr);
  const report = JSON.parse(conflict.stdout);
  assert.deepStrictEqual(report.files, ['issues/0002.md']);
  assert.ok(fs.readFileSync(path.join(report.remote, 'issues', '0002.md'), 'utf8').includes('status: "ready"'));
  assert.strictEqual(b.ok('show', '2').status, 'waiting', 'A conflict leaves the local state alone.');
  assert.strictEqual(b.ok('sync', '--resolved').merged, true);
  a.ok('sync');
  assert.strictEqual(a.ok('show', '2').status, 'waiting');
  assert.strictEqual(a.git('status', '--porcelain'), '');
}

(async () => {
  testFieldsAndIssues();
  await testParallelWriters();
  testUserTemplate();
  testTravel();
  process.stdout.write('✓ Qatlas backlog: fields, issues, parallel writers, user template and travel passed.\n');
})().catch(error => { console.error(error); process.exit(1); });
