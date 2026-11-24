#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const pluginRoot = path.resolve(__dirname, '..', 'plugins', 'qatlas');
const temporary = [];

function fixture(name) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qatlas-' + name + '-'));
  temporary.push(root);
  const home = path.join(root, 'home');
  const project = path.join(root, 'project');
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(project, { recursive: true });
  return { root, home, project };
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content, null, 2) + '\n');
}

function runNode(script, args, options = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: options.cwd,
    env: { ...process.env, HOME: options.home, CLAUDE_PLUGIN_ROOT: options.pluginRoot || pluginRoot, ...options.env },
    encoding: 'utf8',
  });
}

function initProject(f) {
  const result = spawnSync('git', ['init', '-q', f.project], { encoding: 'utf8' });
  assert.strictEqual(result.status, 0, result.stderr);
  spawnSync('git', ['-C', f.project, 'config', 'user.name', 'Qatlas Test']);
  spawnSync('git', ['-C', f.project, 'config', 'user.email', 'qatlas@example.invalid']);
}

function hookOutput(f, block, codex = false) {
  const script = path.join(pluginRoot, 'hooks', 'qatlas-context.js');
  const env = codex ? { PLUGIN_ROOT: pluginRoot, CLAUDE_PLUGIN_ROOT: '' } : {};
  const result = runNode(script, [block], { cwd: f.project, home: f.home, env });
  assert.strictEqual(result.status, 0, result.stderr);
  return codex ? JSON.parse(result.stdout).hookSpecificOutput.additionalContext : result.stdout;
}

function readConfigWithHome(home, project) {
  const loader = require.resolve('../plugins/qatlas/scripts/runtime/config-loader.js');
  const previous = process.env.HOME;
  process.env.HOME = home;
  try {
    delete require.cache[loader];
    return require(loader).readConfig(project);
  } finally {
    process.env.HOME = previous;
  }
}

function testConfig() {
  const f = fixture('config');
  const homeConfig = path.join(f.home, '.qatlas', 'plugins', 'config.json');
  const projectConfig = path.join(f.project, '.qatlas', 'plugins', 'config.json');
  let state = readConfigWithHome(f.home, f.project);
  assert.deepStrictEqual(state.config.protection, { secrets: 'block', 'personal-data': 'ask' });
  assert.strictEqual(state.config.memory.enable, true);
  assert.strictEqual(state.protectionValid, true);

  write(homeConfig, { format: 1, extra: true, protection: { enabled: true, 'personal-data': 'warn' } });
  write(projectConfig, { format: 1, other: { x: 1 }, statusline: { layout: 'fixed' },
    protection: { 'personal-data': 'block', allow: [] } });
  state = readConfigWithHome(f.home, f.project);
  assert.strictEqual(state.protectionValid, true, 'Unknown keys never invalidate the configuration.');
  assert.deepStrictEqual(state.config.protection, { secrets: 'block', 'personal-data': 'block' });
  assert.deepStrictEqual(state.unknown.map(line => line.replace(/^.*: /, '')).sort(),
    ['unknown key extra.', 'unknown key other.', 'unknown key protection.enabled.', 'unknown key statusline.'],
    'statusline belongs to the user file; protection.allow is valid in the project file.');
  assert.strictEqual(state.problems.length, 0);
  assert.strictEqual(state.statusline.layout, 'wrap', 'A project statusline block is ignored.');

  write(projectConfig, { format: 1, protection: { secrets: 'warn' } });
  state = readConfigWithHome(f.home, f.project);
  assert.strictEqual(state.protectionValid, false);
  assert.ok(state.problems.some(line => line.includes('protection.secrets must be one of block, allow')));

  write(projectConfig, '{ "format": 1, }\n');
  state = readConfigWithHome(f.home, f.project);
  assert.strictEqual(state.protectionValid, false, 'Broken JSON makes the protection check impossible.');

  write(projectConfig, { format: 2 });
  state = readConfigWithHome(f.home, f.project);
  assert.ok(state.problems.some(line => line.includes('format must be 1')));

  // Only the object form of a widget counts; a listed entry keeps its widget's defaults.
  fs.rmSync(projectConfig);
  write(homeConfig, { format: 1, statusline: { widgets: { model: true, context: { label: { on: false } }, clock: {} } } });
  state = readConfigWithHome(f.home, f.project);
  assert.ok(state.problems.some(line => line.endsWith('statusline.widgets.model must be an object.')), state.problems);
  assert.ok(state.unknown.some(line => line.endsWith('unknown widget statusline.widgets.clock.')), state.unknown);
  assert.strictEqual(state.protectionValid, true, 'A statusline problem leaves the protection check intact.');
  assert.deepStrictEqual(state.statusline.order, ['context']);
  assert.strictEqual(state.statusline.widgets.context.bar.thresholds[1].from, 30);
}

const VALID_RUN = {
  'test-slots': 2,
  profiles: { light: 'Narrow.', standard: 'Several steps.', demanding: 'Hard diagnosis.' },
  hosts: {
    'claude-code': {
      integrator: { model: null, effort: null }, lead: { model: 'opus', effort: 'high' },
      worker: {
        light: { model: 'haiku', effort: null },
        standard: { model: 'sonnet', effort: 'high' },
        demanding: { model: 'opus', effort: 'high' },
      },
    },
  },
};

function testDoctorRunBlock() {
  const f = fixture('doctor-run');
  initProject(f);
  const doctor = path.join(pluginRoot, 'scripts', 'qatlas-doctor.js');
  const config = path.join(f.home, '.qatlas', 'plugins', 'config.json');
  const check = () => runNode(doctor, ['--target', f.project], { cwd: f.project, home: f.home });
  assert.ok(!check().stdout.includes('run'), 'The run block is optional.');
  write(config, { format: 1, run: VALID_RUN });
  const ok = check();
  assert.ok(!ok.stdout.includes('run'), ok.stdout);
  const incomplete = JSON.parse(JSON.stringify(VALID_RUN));
  delete incomplete.hosts['claude-code'].worker.demanding;
  incomplete.hosts['claude-code'].lead = 'opus';
  incomplete.hosts['claude-code'].worker.light.effort = 3;
  incomplete['test-slots'] = 0;
  write(config, { format: 1, run: incomplete });
  const bad = check().stdout;
  assert.ok(bad.includes('run.hosts.claude-code.worker.demanding needs model and effort'), bad);
  assert.ok(bad.includes('run.hosts.claude-code.lead needs model and effort'), bad);
  assert.ok(bad.includes('run.hosts.claude-code.worker.light needs model and effort'), bad);
  assert.ok(!bad.includes('run.hosts.claude-code.integrator'), bad);
  assert.ok(bad.includes('run.test-slots needs a positive integer'), bad);
  write(config, { format: 1, team: VALID_RUN });
  assert.ok(check().stdout.includes('unknown key team.'), 'Doctor only reads: the old team block is an unknown key.');
  const misspelt = JSON.parse(JSON.stringify(VALID_RUN));
  misspelt.test_slots = 4;
  misspelt.hosts['claude-code'].lead.modell = 'opus';
  misspelt.hosts['claude-code'].worker.heavy = { model: 'opus', effort: null };
  misspelt.hosts.claude = misspelt.hosts['claude-code'];
  write(config, { format: 1, run: misspelt });
  const typo = check().stdout;
  for (const key of ['test_slots', 'hosts.claude', 'hosts.claude-code.lead.modell', 'hosts.claude-code.worker.heavy']) {
    assert.ok(typo.includes('unknown key run.' + key + '. Qatlas does not read it'), typo);
  }
}

// The session start upgrades old forms of the user config silently, once, and touches nothing else.
function testConfigMigration() {
  const f = fixture('migration');
  const config = path.join(f.home, '.qatlas', 'plugins', 'config.json');
  const read = () => fs.readFileSync(config, 'utf8');
  const old = JSON.parse(JSON.stringify(VALID_RUN));
  old.hosts['claude-code'].lead = 'opus';
  old.hosts['claude-code'].integrator = null;
  old.hosts.codex = { ...VALID_RUN.hosts['claude-code'], lead: 'gpt-x' };

  // The old block name and the bare role models, with the file's own indentation and key order.
  write(config, JSON.stringify({ format: 1, memory: { enable: true }, team: old, statusline: {} }, null, 4) + '\n');
  const output = hookOutput(f, 'qatlas');
  assert.ok(!/migrat|team/i.test(output), 'The upgrade is silent.');
  const upgraded = read();
  assert.ok(upgraded.startsWith('{\n    "format": 1,'), 'The indentation survives.');
  assert.ok(upgraded.endsWith('}\n'), 'The final newline survives.');
  const value = JSON.parse(upgraded);
  assert.deepStrictEqual(Object.keys(value), ['format', 'memory', 'run', 'statusline'], 'run takes the place of team.');
  assert.deepStrictEqual(value.run.hosts['claude-code'].lead, { model: 'opus', effort: null });
  assert.deepStrictEqual(value.run.hosts['claude-code'].integrator, { model: null, effort: null });
  assert.deepStrictEqual(value.run.hosts.codex.lead, { model: 'gpt-x', effort: null });
  assert.deepStrictEqual(value.run.hosts.codex.integrator, VALID_RUN.hosts['claude-code'].integrator);
  assert.deepStrictEqual(value.run.hosts['claude-code'].worker, VALID_RUN.hosts['claude-code'].worker);
  assert.deepStrictEqual(readConfigWithHome(f.home, f.project).problems, []);
  assert.deepStrictEqual(fs.readdirSync(path.dirname(config)).filter(name => name.endsWith('.tmp')), []);

  // A current file is not rewritten; Codex upgrades as well.
  const past = new Date(Date.now() - 60000);
  fs.utimesSync(config, past, past);
  const before = fs.statSync(config);
  hookOutput(f, 'qatlas');
  assert.deepStrictEqual([fs.statSync(config).mtimeMs, fs.statSync(config).ino], [before.mtimeMs, before.ino],
    'A current config stays untouched.');
  write(config, { format: 1, team: { 'test-slots': 3 } });
  hookOutput(f, 'qatlas', true);
  assert.deepStrictEqual(JSON.parse(read()), { format: 1, run: { 'test-slots': 3 } });

  // Both blocks at once, a foreign format and broken JSON are left to the user; only the qatlas block upgrades.
  for (const text of ['{ "format": 1, "team": { "test-slots": 3 }, "run": {} }\n', '{ "format": 2, "team": {} }\n', '{ "format": 1, "team": \n']) {
    write(config, text);
    hookOutput(f, 'qatlas');
    assert.strictEqual(read(), text);
  }
  write(config, { format: 1, team: {} });
  hookOutput(f, 'memory');
  hookOutput(f, 'library');
  assert.ok(read().includes('"team"'));

  // A config synced as a symlink keeps its link.
  const real = path.join(f.root, 'synced.json');
  write(real, { format: 1, team: { 'test-slots': 4 } });
  fs.rmSync(config);
  fs.symlinkSync(real, config);
  hookOutput(f, 'qatlas');
  assert.ok(fs.lstatSync(config).isSymbolicLink());
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(real, 'utf8')), { format: 1, run: { 'test-slots': 4 } });
}

function testProjectContext() {
  const f = fixture('context');
  write(path.join(f.project, '.qatlas-brain', 'memory', 'MEMORY.md'), '# Memory\n');
  write(path.join(f.project, '.qatlas-brain', 'backlog', 'BACKLOG.md'), '---\ntype: meta\nedit: shared\n---\n# Backlog\n');
  assert.strictEqual(hookOutput(f, 'project-backlog'), hookOutput(f, 'project-backlog', true));
  assert.ok(hookOutput(f, 'memory').includes('# Memory'));
  assert.ok(hookOutput(f, 'project-backlog').includes('# Backlog'));
  assert.ok(!hookOutput(f, 'project-backlog').includes('edit: shared'), 'Frontmatter is stripped.');
  assert.ok(hookOutput(f, 'qatlas').includes('QATLAS SCAFFOLD: yes'));

  write(path.join(f.project, 'AGENTS.md'), '# Project\n');
  for (const codex of [false, true]) {
    const start = hookOutput(f, 'qatlas', codex);
    assert.ok(start.includes('QATLAS PROJECT: .qatlas-brain/PROJECT.md is missing.'), start);
    assert.ok(start.includes('playbook-reserved-files.md'), 'The note names the procedure.');
    assert.ok(!start.includes('QATLAS ENTRY: '), 'No reserved file exists yet.');
  }
  write(path.join(f.project, '.qatlas-brain', 'PROJECT.md'), '# Project\n');
  write(path.join(f.project, '.qatlas-brain', 'TESTING.md'), '# Tests\n');
  write(path.join(f.project, 'AGENTS.md'), '# Project\n\n- `.qatlas-brain/PROJECT.md` before planning.\n');
  const unreferenced = hookOutput(f, 'qatlas');
  assert.ok(!unreferenced.includes('QATLAS PROJECT: '), 'An existing foundation is no finding.');
  assert.ok(unreferenced.includes('QATLAS ENTRY: .qatlas-brain/TESTING.md has no line'), unreferenced);
  assert.ok(!unreferenced.includes('QATLAS ENTRY: .qatlas-brain/PROJECT.md'), 'A named file is no finding.');
  assert.ok(!hookOutput(f, 'subagent').includes('QATLAS PROJECT: '), 'Only the session start reports.');
  fs.rmSync(path.join(f.project, '.qatlas-brain', 'PROJECT.md'));
  fs.rmSync(path.join(f.project, '.qatlas-brain', 'TESTING.md'));
  fs.rmSync(path.join(f.project, 'AGENTS.md'));

  const missing = fixture('context-missing');
  fs.mkdirSync(path.join(missing.project, '.qatlas-brain'));
  assert.strictEqual(hookOutput(missing, 'project-backlog'), '', 'A missing index yields no output.');
  assert.deepStrictEqual(fs.readdirSync(path.join(missing.project, '.qatlas-brain')), [],
    'The session start writes nothing into the repo.');

  const unreadable = fixture('context-unreadable');
  fs.mkdirSync(path.join(unreadable.project, '.qatlas-brain', 'backlog', 'BACKLOG.md'), { recursive: true });
  assert.strictEqual(hookOutput(unreadable, 'project-backlog'), '', 'An unreadable index yields no output.');

  const huge = fixture('context-huge');
  write(path.join(huge.project, '.qatlas-brain', 'backlog', 'BACKLOG.md'),
    Array.from({ length: 1200 }, (_, index) => 'Line ' + index).join('\n') + '\nEND-OF-FILE\n');
  const hugeOutput = hookOutput(huge, 'project-backlog');
  assert.ok(hugeOutput.includes('QATLAS BLOCK TRUNCATED'));
  assert.ok(!hugeOutput.includes('END-OF-FILE'));

  const disabled = fixture('context-memory-off');
  write(path.join(disabled.project, '.qatlas-brain', 'memory', 'MEMORY.md'), '# Memory\n');
  write(path.join(disabled.project, '.qatlas-brain', 'backlog', 'BACKLOG.md'), '# Backlog\n');
  write(path.join(disabled.project, '.qatlas', 'plugins', 'config.json'), { format: 1, memory: { enable: false } });
  assert.strictEqual(hookOutput(disabled, 'memory'), '', 'Disabled repo memory is not injected.');
  assert.ok(hookOutput(disabled, 'project-backlog').includes('# Backlog'));
  assert.ok(hookOutput(disabled, 'qatlas').includes('repo memory is disabled'));
  assert.ok(hookOutput(f, 'qatlas').includes('memory index too'));

  const nested = fixture('context-subfolder');
  initProject(nested);
  write(path.join(nested.project, '.qatlas-brain', 'backlog', 'BACKLOG.md'), '# Backlog\n');
  const nestedDir = path.join(nested.project, 'src');
  fs.mkdirSync(nestedDir);
  for (const codex of [false, true]) {
    const env = codex ? { PLUGIN_ROOT: pluginRoot, CLAUDE_PLUGIN_ROOT: '' } : {};
    const result = runNode(path.join(pluginRoot, 'hooks', 'qatlas-context.js'), ['qatlas'],
      { cwd: nestedDir, home: nested.home, env });
    assert.ok(result.stdout.includes('QATLAS SCAFFOLD: yes'), 'A session in a subfolder finds the project root.');
  }

  const ambient = fixture('context-ambient');
  const ambientOutput = hookOutput(ambient, 'qatlas');
  assert.ok(ambientOutput.includes('QATLAS SCAFFOLD: no'));
  assert.ok(ambientOutput.includes('qatlas-core init'));
  assert.strictEqual(hookOutput(ambient, 'project-backlog'), '');
}

function testBrainMigration() {
  const legacy = dir => path.join(dir, '.qatlas-project');
  const brain = dir => path.join(dir, '.qatlas-brain');
  const read = file => fs.readFileSync(file, 'utf8');

  // Any project block moves the folder, reports it and leaves foreign content alone.
  const f = fixture('brain');
  write(path.join(legacy(f.project), 'backlog', 'BACKLOG.md'), '# Backlog\nSee .qatlas-project/plans/ first.\n');
  write(path.join(legacy(f.project), 'memory', 'MEMORY.md'), '# Memory\n');
  write(path.join(legacy(f.project), 'zone-import', 'raw.md'), 'Raw .qatlas-project/ text.\n');
  write(path.join(legacy(f.project), 'knowledge', 'blob.bin'), '.qatlas-project\u0000');
  write(path.join(f.project, 'AGENTS.md'), 'Read .qatlas-project/TESTING.md, not .qatlas-projects/.\n');
  write(path.join(f.project, '.gitignore'), '/.qatlas-project/zone-import/*\n');
  write(path.join(f.project, 'README.md'), 'State lives in .qatlas-project/.\n');
  const backlog = hookOutput(f, 'project-backlog');
  assert.ok(backlog.includes('See .qatlas-brain/plans/ first.'), backlog);
  assert.ok(backlog.includes('QATLAS MIGRATION: '), backlog);
  assert.strictEqual(fs.existsSync(legacy(f.project)), false);
  assert.strictEqual(read(path.join(f.project, 'AGENTS.md')), 'Read .qatlas-brain/TESTING.md, not .qatlas-projects/.\n');
  assert.strictEqual(read(path.join(f.project, '.gitignore')), '/.qatlas-brain/zone-import/*\n');
  assert.strictEqual(read(path.join(brain(f.project), 'zone-import', 'raw.md')), 'Raw .qatlas-project/ text.\n',
    'Zone content is user material and stays untouched.');
  assert.strictEqual(read(path.join(brain(f.project), 'knowledge', 'blob.bin')), '.qatlas-project\u0000');
  assert.strictEqual(read(path.join(f.project, 'README.md')), 'State lives in .qatlas-project/.\n',
    'Files outside the folder, AGENTS.md, CLAUDE.md and .gitignore are left to the agent.');
  assert.deepStrictEqual(fs.readdirSync(path.join(brain(f.project), 'backlog')), ['BACKLOG.md'],
    'The atomic write leaves no temporary file.');
  const second = hookOutput(f, 'qatlas');
  assert.ok(second.includes('QATLAS SCAFFOLD: yes') && !second.includes('QATLAS MIGRATION'), 'The move happens once.');

  // A block without output of its own still reports the move.
  const silent = fixture('brain-silent');
  fs.mkdirSync(legacy(silent.project));
  assert.ok(hookOutput(silent, 'memory').startsWith('QATLAS MIGRATION: '));
  assert.ok(fs.existsSync(brain(silent.project)));

  // A session started in a subfolder finds the old folder at the project root.
  const nested = fixture('brain-subfolder');
  initProject(nested);
  write(path.join(legacy(nested.project), 'backlog', 'BACKLOG.md'), '# Backlog\n');
  const sub = path.join(nested.project, 'src');
  fs.mkdirSync(sub);
  const fromSub = runNode(path.join(pluginRoot, 'hooks', 'qatlas-context.js'), ['qatlas'], { cwd: sub, home: nested.home });
  assert.ok(fromSub.stdout.includes('QATLAS SCAFFOLD: yes') && fromSub.stdout.includes('QATLAS MIGRATION: '), fromSub.stdout);
  assert.ok(fs.existsSync(path.join(brain(nested.project), 'backlog', 'BACKLOG.md')));

  // Both folders: nothing moves, and only the rule block reports it.
  const both = fixture('brain-both');
  write(path.join(legacy(both.project), 'backlog', 'BACKLOG.md'), '# Old\n');
  write(path.join(brain(both.project), 'backlog', 'BACKLOG.md'), '# New\n');
  write(path.join(both.project, 'AGENTS.md'), 'Read .qatlas-project/TESTING.md.\n');
  assert.ok(hookOutput(both, 'qatlas').includes('QATLAS MIGRATION BLOCKED: '));
  const kept = hookOutput(both, 'project-backlog');
  assert.ok(kept.includes('# New') && !kept.includes('QATLAS MIGRATION'), kept);
  assert.strictEqual(read(path.join(legacy(both.project), 'backlog', 'BACKLOG.md')), '# Old\n');
  assert.strictEqual(read(path.join(both.project, 'AGENTS.md')), 'Read .qatlas-project/TESTING.md.\n');

  // The hooks of one session start run in parallel: one moves, the others read the result.
  const race = fixture('brain-race');
  write(path.join(legacy(race.project), 'backlog', 'BACKLOG.md'), '# Backlog\n');
  write(path.join(legacy(race.project), 'memory', 'MEMORY.md'), '# Memory\n');
  const script = path.join(pluginRoot, 'hooks', 'qatlas-context.js');
  const blocks = ['qatlas', 'memory', 'project-backlog'];
  const parallel = spawnSync('sh', ['-c', blocks.map(name =>
    '"$NODE" "$SCRIPT" ' + name + ' > "$OUT/' + name + '" &').join(' ') + ' wait'], {
    cwd: race.project, encoding: 'utf8',
    env: { ...process.env, HOME: race.home, CLAUDE_PLUGIN_ROOT: pluginRoot, NODE: process.execPath, SCRIPT: script, OUT: race.root },
  });
  assert.strictEqual(parallel.status, 0, parallel.stderr);
  const outputs = blocks.map(name => read(path.join(race.root, name)));
  assert.ok(outputs[0].includes('QATLAS SCAFFOLD: yes'), outputs[0]);
  assert.ok(outputs[1].includes('# Memory') && outputs[2].includes('# Backlog'), 'No block misses the scaffold.');
  assert.strictEqual(outputs.filter(text => text.includes('QATLAS MIGRATION: ')).length, 1, 'Exactly one block reports.');
  assert.ok(!outputs.join('').includes('MIGRATION BLOCKED'));

  // Init moves an old folder itself instead of seeding a second one.
  const init = fixture('brain-init');
  initProject(init);
  write(path.join(legacy(init.project), 'backlog', 'BACKLOG.md'), '# Own\n');
  const result = runNode(path.join(pluginRoot, 'scripts', 'qatlas-init.js'), ['--target', init.project], {
    cwd: init.project, home: init.home,
  });
  assert.ok(result.stdout.includes('- .qatlas-brain/ (renamed from the old folder name)'), result.stdout);
  assert.strictEqual(fs.existsSync(legacy(init.project)), false);
  assert.strictEqual(read(path.join(brain(init.project), 'backlog', 'BACKLOG.md')), '# Own\n');
}

function testLibraryAndSubagent() {
  const f = fixture('library');
  initProject(f);
  const doctor = path.join(pluginRoot, 'scripts', 'qatlas-doctor.js');
  const init = path.join(pluginRoot, 'scripts', 'qatlas-init.js');
  const agentsFile = path.join(f.home, 'qatlas', 'AGENTS.qatlas.md');
  assert.strictEqual(hookOutput(f, 'library'), '', 'No pointer without the library.');
  const report = runNode(doctor, ['--target', f.project], { cwd: f.project, home: f.home }).stdout;
  assert.ok(report.includes('~/qatlas/AGENTS.qatlas.md is missing') && !report.includes('~/qatlas/README.md'));
  assert.strictEqual(fs.existsSync(path.join(f.home, 'qatlas')), false, 'The doctor writes nothing.');
  assert.strictEqual(runNode(init, ['--target', f.project], { cwd: f.project, home: f.home }).status, 0);
  assert.deepStrictEqual(fs.readdirSync(path.join(f.home, 'qatlas')).sort(), ['AGENTS.qatlas.md']);
  fs.writeFileSync(agentsFile, '# Own version\n');
  runNode(init, ['--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(fs.readFileSync(agentsFile, 'utf8'), '# Own version\n', 'The user file stays unchanged.');

  assert.strictEqual(fs.existsSync(path.join(f.home, '.qatlas', 'plugins', 'config.json')), false,
    'Init writes no configuration file; the shipped defaults apply.');

  assert.ok(hookOutput(f, 'library').includes(agentsFile.split(path.sep).join('/')));
  assert.strictEqual(hookOutput(f, 'library'), hookOutput(f, 'library', true));

  write(path.join(f.home, '.qatlas', 'plugins', 'config.json'), { format: 1, extra: true });
  const unknown = runNode(doctor, ['--target', f.project], { cwd: f.project, home: f.home }).stdout;
  assert.ok(unknown.includes('unknown key extra. Qatlas does not read it'), unknown);
  assert.ok(hookOutput(f, 'library').includes('AGENTS.qatlas.md'), 'The pointer follows the library alone.');

  const worktree = runNode(path.join(pluginRoot, 'scripts', 'qatlas-worktree-path.js'),
    ['task/0001-test', '--target', f.project], { cwd: f.project, home: f.home });
  assert.match(worktree.stdout.trim(),
    /\/\.qatlas\/projects\/project-uid[0-9a-f]{8}\/worktrees\/task\/0001-test$/);

  const script = path.join(pluginRoot, 'hooks', 'qatlas-context.js');
  const subagent = runNode(script, ['subagent'], { cwd: f.project, home: f.home });
  const payload = JSON.parse(subagent.stdout).hookSpecificOutput;
  assert.strictEqual(payload.hookEventName, 'SubagentStart');
  assert.ok(payload.additionalContext.includes('qatlas-core-navigation'));
  assert.ok(payload.additionalContext.includes('QATLAS-LIBRARY'));
}

function testInit() {
  const f = fixture('init');
  write(path.join(f.project, '.gitignore'), '# foreign\n/custom/\n');
  const init = path.join(pluginRoot, 'scripts', 'qatlas-init.js');
  const doctor = path.join(pluginRoot, 'scripts', 'qatlas-doctor.js');
  const run = script => runNode(script, ['--target', f.project], {
    cwd: f.project, home: f.home,
    env: { GIT_CONFIG_GLOBAL: path.join(f.home, '.gitconfig'), GIT_CONFIG_NOSYSTEM: '1' },
  });

  const before = run(doctor).stdout;
  assert.ok(before.includes('git repo: this folder is none'), before);
  assert.strictEqual(fs.existsSync(path.join(f.project, '.git')), false, 'The doctor writes nothing.');

  const first = run(init);
  assert.strictEqual(first.status, 1, 'A missing git identity is reported as a problem.');
  assert.ok(first.stdout.includes('- git repo') && first.stdout.includes('git identity: user.name and user.email'),
    first.stdout);
  assert.ok(fs.existsSync(path.join(f.project, '.git')), 'Init runs git init without asking.');
  assert.deepStrictEqual(fs.readdirSync(path.join(f.project, '.qatlas-brain')).sort(),
    ['backlog', 'memory', 'zone-import']);
  assert.deepStrictEqual(fs.readdirSync(path.join(f.project, '.qatlas-brain', 'backlog')), ['BACKLOG.md']);
  assert.deepStrictEqual(fs.readdirSync(path.join(f.project, '.qatlas-brain', 'memory')), ['MEMORY.md']);
  assert.deepStrictEqual(fs.readdirSync(path.join(f.project, '.qatlas-brain', 'zone-import')), ['.gitkeep']);
  assert.strictEqual(fs.readFileSync(path.join(f.project, 'CLAUDE.md'), 'utf8'), '@AGENTS.md\n');
  assert.ok(fs.readFileSync(path.join(f.project, 'AGENTS.md'), 'utf8').includes('## Projektwissen'));
  assert.strictEqual(fs.readFileSync(path.join(f.project, 'README.md'), 'utf8'), '# project\n',
    'Init adds a minimal README named after the folder.');
  assert.strictEqual(fs.existsSync(path.join(f.project, '.qatlas')), false,
    'A project configuration arises only on request.');
  const ignore = fs.readFileSync(path.join(f.project, '.gitignore'), 'utf8');
  assert.ok(ignore.startsWith('# foreign\n/custom/\n'));
  for (const rule of ['/.qatlas-brain/zone-import/*', '/.qatlas-brain/zone-export/*', '/.qatlas/local/']) {
    assert.ok(ignore.includes(rule), rule);
  }

  spawnSync('git', ['-C', f.project, 'config', 'user.name', 'Qatlas Test']);
  spawnSync('git', ['-C', f.project, 'config', 'user.email', 'qatlas@example.invalid']);
  assert.strictEqual(run(doctor).stdout.trim(), 'OK: nothing missing.');

  const backlog = path.join(f.project, '.qatlas-brain', 'backlog', 'BACKLOG.md');
  write(backlog, '# External\nhttps://example.invalid/project\nNo local tasks.\n');
  write(path.join(f.project, 'AGENTS.md'), '# Own\n');
  const second = run(init);
  assert.strictEqual(second.status, 0, second.stdout);
  assert.strictEqual(second.stdout.trim(), 'OK: nothing to do.');
  assert.ok(fs.readFileSync(backlog, 'utf8').includes('https://example.invalid/project'));
  assert.strictEqual(fs.readFileSync(path.join(f.project, 'AGENTS.md'), 'utf8'), '# Own\n');
  assert.strictEqual(fs.readFileSync(path.join(f.project, '.gitignore'), 'utf8'), ignore, 'Rules are added once.');

  const long = 'word '.repeat(3501);
  write(path.join(f.project, '.qatlas-brain', 'TESTING.md'), 'word '.repeat(2501));
  write(path.join(f.project, '.qatlas-brain', 'OPERATIONS.md'), 'word '.repeat(2500));
  write(path.join(f.project, '.qatlas-brain', 'knowledge', 'knowledge-long.md'), long);
  write(path.join(f.project, '.qatlas-brain', 'knowledge', 'knowledge-short.md'), 'word\n'.repeat(3500));
  write(path.join(f.project, '.qatlas-brain', 'zone-import', 'raw.md'), long);
  write(path.join(f.project, '.qatlas-brain', 'templates', 'template.md'), long);
  const limits = run(doctor).stdout;
  assert.ok(limits.includes('.qatlas-brain/TESTING.md has 2501 words, limit 2500. Move details into testing/'), limits);
  assert.ok(limits.includes('Procedure: ' + path.join(pluginRoot, 'skills', 'qatlas-core-filing', 'references',
    'size-limits.md')), 'The note names the absolute path of the reference.\n' + limits);
  assert.ok(limits.includes('.qatlas-brain/knowledge/knowledge-long.md has 3501 words, limit 3500. Split it'), limits);
  assert.ok(!/knowledge-short\.md has \d|OPERATIONS\.md has \d|raw\.md|template\.md/.test(limits), 'Files at the limit, zones and templates stay unreported.');
  for (const part of ['TESTING.md', 'OPERATIONS.md', 'knowledge', 'templates', path.join('zone-import', 'raw.md')]) {
    fs.rmSync(path.join(f.project, '.qatlas-brain', part), { recursive: true });
  }

  write(path.join(f.project, '.qatlas-brain', 'PROJECT.md'), 'word\n'.repeat(1001));
  assert.ok(run(doctor).stdout.includes('.qatlas-brain/PROJECT.md has 1001 words, limit 1000. Move details into project/'));
  write(path.join(f.project, '.qatlas-brain', 'PROJECT.md'), 'word\n'.repeat(1000));
  assert.ok(!/PROJECT\.md has \d/.test(run(doctor).stdout), 'PROJECT.md at its limit stays unreported.');
  fs.rmSync(path.join(f.project, '.qatlas-brain', 'PROJECT.md'));

  const brainDir = path.join(f.project, '.qatlas-brain');
  const typed = type => '---\ndescription: >\n  Test.\ntype: ' + type + '\nedit: shared\n---\n';
  write(path.join(brainDir, 'PROJECT.md'), typed('policy').replace('type: policy\n', ''));
  write(path.join(brainDir, 'CONVENTIONS.md'), typed('policy'));
  write(path.join(brainDir, 'conventions', 'policy-names.md'), typed('policy'));
  write(path.join(brainDir, 'conventions', 'conventions-fine.md'), typed('policy').replace('type: policy\n', ''));
  write(path.join(brainDir, 'playbooks', 'playbook-fine.md'), typed('playbook'));
  write(path.join(brainDir, 'NOTES.md'), typed('knowledge'));
  write(path.join(brainDir, 'plans', 'plan-old.md'), typed('plan'));
  write(path.join(brainDir, 'docs', 'knowledge-docs.md'), typed('knowledge'));
  write(path.join(brainDir, 'knowledge', 'knowledge-fine.md'), typed('knowledge'));
  write(path.join(brainDir, 'knowledge', 'fact-wrong.md'), typed('knowledge'));
  write(path.join(brainDir, 'knowledge', 'knowledge-bare.md'), '# Bare\n');
  write(path.join(brainDir, 'backlog', 'task-0001-old.md'), '# Old task\n');
  write(path.join(brainDir, 'memory', 'memory-lost.md'), typed('memory'));
  fs.appendFileSync(path.join(brainDir, 'memory', 'MEMORY.md'), '- [Gone](memory-gone.md) - hook.\n');
  write(path.join(f.home, '.qatlas', 'state', 'worktrees', 'x', 'file'), 'x');
  write(path.join(f.project, '.qatlas', 'local', 'team', 'events.jsonl'), '');
  write(path.join(f.project, '.qatlas', 'local', 'slots', 'runs.jsonl'), '');
  const structure = run(doctor).stdout;
  for (const note of ['.qatlas-brain/NOTES.md is none of the reserved files.',
    '.qatlas-brain/plans/ is no folder of the knowledge space any more.',
    '.qatlas-brain/docs/ is none of the fixed folders.',
    '.qatlas-brain/knowledge/fact-wrong.md lies in knowledge/, so its name starts with knowledge-.',
    '.qatlas-brain/CONVENTIONS.md carries the type policy, which its place replaces. Remove the line.',
    '.qatlas-brain/conventions/policy-names.md carries the type policy,',
    '.qatlas-brain/conventions/policy-names.md lies in conventions/, so its name starts with conventions-.',
    '.qatlas-brain/memory/memory-lost.md carries the type memory,',
    '.qatlas-brain/knowledge/knowledge-bare.md has no frontmatter.',
    '.qatlas-brain/memory/memory-lost.md has no line in MEMORY.md.',
    '.qatlas-brain/memory/MEMORY.md links memory-gone.md, which does not exist.',
    '.qatlas-brain/PROJECT.md has no line with its reading condition in AGENTS.md.',
    '.qatlas-brain/backlog/ holds more than BACKLOG.md.',
    path.join('.qatlas', 'state', 'worktrees') + ': worktrees from before',
    path.join('.qatlas', 'local', 'team') + ': run state',
    path.join('.qatlas', 'local', 'slots') + ': test results']) {
    assert.ok(structure.includes(note), note + '\n' + structure);
  }
  assert.ok(!/knowledge-fine|conventions-fine|playbook-fine|plan-old|task-0001-old|PROJECT\.md (has (no|the)(?! line)|carries)/.test(structure), structure);
  assert.ok(!structure.includes('MISSING'), 'Structure findings are notes.');

  // qatlas-core migrate reads the same findings and changes nothing.
  const migrate = path.join(pluginRoot, 'scripts', 'qatlas-migrate.js');
  const tree = () => spawnSync('git', ['-C', f.project, 'status', '--porcelain', '-uall'], { encoding: 'utf8' }).stdout;
  const treeBefore = tree();
  const overview = run(migrate).stdout;
  for (const line of ['MIGRATION ' + brainDir, '- rename: 2 ', '- frontmatter: 5 ', '- sort: 3 ', '- entry: 2 ']) {
    assert.ok(overview.includes(line), line + '\n' + overview);
  }
  const listed = runNode(migrate, ['--target', f.project, '--list'], { cwd: f.project, home: f.home }).stdout;
  assert.ok(listed.includes('rename: .qatlas-brain/knowledge/fact-wrong.md -> .qatlas-brain/knowledge/knowledge-wrong.md'), listed);
  assert.ok(listed.includes('rename: .qatlas-brain/conventions/policy-names.md -> .qatlas-brain/conventions/conventions-names.md'), listed);
  assert.ok(listed.includes('sort: .qatlas-brain/docs/ is none of the fixed folders.'), listed);
  assert.strictEqual(tree(), treeBefore, 'Migrate writes nothing.');

  // The library takes the functions that can apply across projects and names them in AGENTS.qatlas.md.
  const lib = path.join(f.home, 'qatlas');
  write(path.join(lib, 'policies', 'tmux.md'), '# Tmux\n');
  write(path.join(lib, 'PROJECT.md'), '# Project\n');
  write(path.join(lib, 'CONVENTIONS.md'), typed('policy').replace('type: policy\n', ''));
  write(path.join(lib, 'playbooks', 'git.md'), typed('playbook'));
  const libraryList = runNode(migrate, ['--library', '--list'], { cwd: f.project, home: f.home }).stdout;
  for (const line of ['sort: ~/qatlas/policies/ is none of the fixed folders.',
    'sort: ~/qatlas/PROJECT.md is none of the reserved files.',
    'rename: ~/qatlas/playbooks/git.md -> ~/qatlas/playbooks/playbook-git.md',
    'entry: ~/qatlas/CONVENTIONS.md has no line with its reading condition in AGENTS.qatlas.md.']) {
    assert.ok(libraryList.includes(line), line + '\n' + libraryList);
  }
  assert.ok(!libraryList.includes('AGENTS.qatlas.md is none'), libraryList);
  for (const part of ['policies', 'PROJECT.md', 'CONVENTIONS.md', 'playbooks']) fs.rmSync(path.join(lib, part), { recursive: true });
  for (const part of ['PROJECT.md', 'CONVENTIONS.md', 'conventions', 'playbooks', 'NOTES.md', 'plans', 'docs', 'knowledge', path.join('backlog', 'task-0001-old.md')]) {
    fs.rmSync(path.join(brainDir, part), { recursive: true });
  }
  fs.rmSync(path.join(f.home, '.qatlas'), { recursive: true });
  fs.rmSync(path.join(f.project, '.qatlas'), { recursive: true });

  const memoryDir = path.join(f.project, '.qatlas-brain', 'memory');
  fs.rmSync(memoryDir, { recursive: true });
  assert.ok(run(doctor).stdout.includes('.qatlas-brain/memory/MEMORY.md is missing'));
  run(init);
  assert.ok(fs.existsSync(path.join(memoryDir, 'MEMORY.md')), 'With repo memory enabled, the index seed is restored.');

  fs.rmSync(memoryDir, { recursive: true });
  write(path.join(f.project, '.qatlas', 'plugins', 'config.json'), { format: 1, memory: { enable: false } });
  assert.strictEqual(run(init).status, 0);
  assert.strictEqual(fs.existsSync(memoryDir), false, 'With repo memory disabled, no memory folder is created.');

  const sub = path.join(f.project, 'src', 'deep');
  fs.mkdirSync(sub, { recursive: true });
  const fromSub = runNode(init, ['--target', sub], { cwd: sub, home: f.home });
  assert.strictEqual(fromSub.status, 0, fromSub.stdout);
  assert.strictEqual(fs.existsSync(path.join(f.project, 'src', '.qatlas-brain')), false,
    'Init inside a repo works on its root, never on a subfolder.');
  assert.strictEqual(fs.existsSync(path.join(sub, '.qatlas-brain')), false);
  assert.strictEqual(fs.existsSync(path.join(sub, 'AGENTS.md')), false);

  const agentsOnly = fixture('init-agents-only');
  initProject(agentsOnly);
  write(path.join(agentsOnly.project, 'AGENTS.md'), '# Own\n');
  write(path.join(agentsOnly.project, 'readme.rst'), 'Own\n');
  const bound = runNode(init, ['--target', agentsOnly.project], { cwd: agentsOnly.project, home: agentsOnly.home });
  assert.strictEqual(bound.status, 0, bound.stdout);
  assert.strictEqual(fs.readFileSync(path.join(agentsOnly.project, 'CLAUDE.md'), 'utf8'), '@AGENTS.md\n',
    'An existing AGENTS.md gets the CLAUDE.md that binds it.');
  assert.strictEqual(fs.readFileSync(path.join(agentsOnly.project, 'AGENTS.md'), 'utf8'), '# Own\n');
  assert.strictEqual(fs.existsSync(path.join(agentsOnly.project, 'README.md')), false,
    'An existing README in any format stays the only one.');

  const claudeOnly = fixture('init-claude-only');
  initProject(claudeOnly);
  write(path.join(claudeOnly.project, 'CLAUDE.md'), '# Own\n');
  const entry = runNode(init, ['--target', claudeOnly.project], { cwd: claudeOnly.project, home: claudeOnly.home });
  assert.strictEqual(entry.status, 0, entry.stdout);
  assert.ok(fs.readFileSync(path.join(claudeOnly.project, 'AGENTS.md'), 'utf8').includes('## Projektwissen'),
    'A project with only CLAUDE.md still gets AGENTS.md as the entry.');
  assert.strictEqual(fs.readFileSync(path.join(claudeOnly.project, 'CLAUDE.md'), 'utf8'), '# Own\n',
    'The CLAUDE.md of the user stays untouched.');
  assert.ok(entry.stdout.includes('NOTES\n- CLAUDE.md does not import AGENTS.md'), entry.stdout);
  assert.ok(!bound.stdout.includes('NOTES'), 'A CLAUDE.md that imports AGENTS.md needs no note.');
}

// The backlog block carries the counts of the local backlog only while the project is bound to it.
function testLocalBacklogLine() {
  const f = fixture('context-local-backlog');
  initProject(f);
  const run = (script, ...args) => runNode(path.join(pluginRoot, 'scripts', script), args, { cwd: f.project, home: f.home });
  assert.strictEqual(run('qatlas-init.js').status, 0);
  const added = run('qatlas-backlog.js', 'add', '--title', 'First');
  assert.strictEqual(added.status, 0, added.stderr);
  assert.ok(hookOutput(f, 'project-backlog').includes('LOCAL BACKLOG: 1 draft'), hookOutput(f, 'project-backlog'));
  write(path.join(f.project, '.qatlas-brain', 'backlog', 'BACKLOG.md'), '# Backlog\n\n- Tracker elsewhere.\n');
  assert.ok(!hookOutput(f, 'project-backlog').includes('LOCAL BACKLOG'), 'A leftover checkout of a former binding stays out.');
}

function testStatuslineRefresh() {
  const f = fixture('statusline');
  const setup = path.join(pluginRoot, 'scripts', 'qatlas-statusline-claude.js');
  const copy = path.join(f.home, '.qatlas', 'plugins', 'statusline.js');
  const marker = path.join(f.home, '.qatlas', 'plugins', 'runtime', 'VERSION');
  const version = JSON.parse(fs.readFileSync(path.join(pluginRoot, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  hookOutput(f, 'qatlas');
  assert.strictEqual(fs.existsSync(copy), false, 'Without a set-up status line nothing is copied.');

  write(copy, '// old\n');
  hookOutput(f, 'qatlas');
  assert.ok(fs.readFileSync(copy, 'utf8').includes('Renders Claude session JSON'));
  assert.strictEqual(fs.readFileSync(marker, 'utf8').trim(), version);

  write(marker, '999.0.0\n');
  write(copy, '// newer\n');
  hookOutput(f, 'qatlas');
  assert.strictEqual(fs.readFileSync(copy, 'utf8'), '// newer\n', 'An older plugin never downgrades the copy.');

  write(copy, '// codex\n');
  write(marker, '0.0.1\n');
  hookOutput(f, 'qatlas', true);
  assert.strictEqual(fs.readFileSync(copy, 'utf8'), '// codex\n', 'Codex does not use the Claude renderer.');

  const settingsFile = path.join(f.home, '.claude', 'settings.json');
  const foreign = { type: 'command', command: 'echo own' };
  write(settingsFile, { statusLine: foreign, theme: 'dark' });
  const result = runNode(setup, ['setup'], { cwd: f.project, home: f.home });
  assert.strictEqual(result.status, 0, result.stderr);
  assert.strictEqual(fs.readFileSync(marker, 'utf8').trim(), version);
  let settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  assert.ok(settings.statusLine.command.includes('.qatlas/plugins/statusline.js'));
  assert.strictEqual(fs.existsSync(path.join(f.home, '.qatlas', 'plugins', 'config.json')), false,
    'Setup writes no config.json; the shipped defaults apply.');
  assert.deepStrictEqual(fs.readdirSync(path.join(f.home, '.qatlas', 'plugins', 'runtime')).sort(),
    ['VERSION', 'config-loader.js'], 'The status line copy needs no YAML runtime.');

  write(path.join(f.home, '.qatlas', 'plugins', 'config.json'),
    { format: 1, statusline: { widgets: { dir: { on: true } } } });
  const rendered = spawnSync(process.execPath, [copy], {
    input: JSON.stringify({ model: { display_name: 'Some Model' }, workspace: { current_dir: '/x/proj' } }),
    env: { ...process.env, HOME: f.home, NO_COLOR: '1' }, encoding: 'utf8',
  });
  assert.strictEqual(rendered.status, 0, rendered.stderr);
  assert.ok(rendered.stdout.includes('proj') && !rendered.stdout.includes('Some Model'), rendered.stdout);

  // A widget listed without its own bar keeps the shipped thresholds: yellow from 30 %.
  write(path.join(f.home, '.qatlas', 'plugins', 'config.json'), { format: 1, statusline: { widgets: { context: {} } } });
  const bar = spawnSync(process.execPath, [copy], {
    input: JSON.stringify({ context_window: { total_input_tokens: 32000, context_window_size: 100000 } }),
    env: { ...process.env, HOME: f.home }, encoding: 'utf8',
  });
  assert.ok(bar.stdout.includes('\x1b[38;2;240;200;8m') && bar.stdout.includes('32%'), JSON.stringify(bar.stdout));
  fs.rmSync(path.join(f.home, '.qatlas', 'plugins', 'config.json'));

  const removed = runNode(setup, ['remove'], { cwd: f.project, home: f.home });
  assert.strictEqual(removed.status, 0, removed.stderr);
  settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  assert.deepStrictEqual(settings, { statusLine: foreign, theme: 'dark' }, 'Remove restores the previous entry.');
  assert.strictEqual(fs.existsSync(copy), false);
  assert.strictEqual(fs.existsSync(marker), false);
  hookOutput(f, 'qatlas');
  assert.strictEqual(fs.existsSync(copy), false, 'After remove the session start copies nothing.');

  const again = runNode(setup, ['remove'], { cwd: f.project, home: f.home });
  assert.strictEqual(again.status, 0, again.stderr);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(settingsFile, 'utf8')).statusLine, foreign,
    'A foreign entry is never removed.');
}

function testStatuslineCodex() {
  const f = fixture('statusline-codex');
  const script = path.join(pluginRoot, 'scripts', 'qatlas-statusline-codex.js');
  const config = path.join(f.root, 'config.toml');
  const previous = path.join(f.home, '.qatlas', 'state', 'statusline', 'codex-previous.json');
  const run = (...args) => runNode(script, [...args, '--config', config], { cwd: f.project, home: f.home });
  const own = '# keep me\nmodel = "x"\n\n[tui]\nstatus_line = [\n  "model", # first\n  "git-branch",\n]\n\n[other]\nkey = 1\n';
  write(config, own);

  let result = run('setup');
  assert.strictEqual(result.status, 0, result.stderr);
  let text = fs.readFileSync(config, 'utf8');
  assert.ok(text.startsWith('# keep me\nmodel = "x"\n') && text.endsWith('[other]\nkey = 1\n'), text);
  assert.ok(text.includes('status_line = ["model-with-reasoning", "project-name"') && text.includes('status_line_use_colors = true'), text);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(previous, 'utf8')), { items: ['model', 'git-branch'], colors: null });

  // Without --defaults the existing list is the base; a second setup keeps the first previous state.
  result = run('setup', '--disable', 'used-tokens', '--enable', 'thread-title', '--colors', 'off');
  assert.strictEqual(result.status, 0, result.stderr);
  text = fs.readFileSync(config, 'utf8');
  assert.ok(!text.includes('"used-tokens"') && text.includes('"thread-title"]') && text.includes('status_line_use_colors = false'), text);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(previous, 'utf8')).items, ['model', 'git-branch']);
  assert.strictEqual(run('setup', '--enable', 'no-such-item').status, 1);
  assert.strictEqual(fs.readFileSync(config, 'utf8'), text, 'A rejected call writes nothing.');

  result = run('remove');
  assert.strictEqual(result.status, 0, result.stderr);
  assert.strictEqual(fs.readFileSync(config, 'utf8'),
    '# keep me\nmodel = "x"\n\n[tui]\nstatus_line = ["model", "git-branch"]\n\n[other]\nkey = 1\n',
    'Remove restores the previous list and drops the colors line the preset wrote.');
  assert.strictEqual(fs.existsSync(previous), false);

  // Without a previous list setup adds a [tui] table and remove takes it away again.
  write(config, 'model = "x"\n');
  assert.strictEqual(run('setup').status, 0);
  assert.ok(fs.readFileSync(config, 'utf8').startsWith('model = "x"\n\n[tui]\nstatus_line = ['));
  assert.strictEqual(fs.existsSync(previous), false);
  assert.strictEqual(run('remove').status, 0);
  assert.strictEqual(fs.readFileSync(config, 'utf8'), 'model = "x"\n');
}

function testProjectStore() {
  const f = fixture('store');
  const root = fs.realpathSync(f.root);
  const home = fs.realpathSync(f.home);
  const projects = path.join(home, '.qatlas', 'projects');
  const loader = require.resolve('../plugins/qatlas/scripts/runtime/project-store.js');
  const previous = process.env.HOME;
  process.env.HOME = home;
  try {
    const store = require(loader);
    const git = (cwd, ...args) => spawnSync('git', ['-C', cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { encoding: 'utf8' });
    const repo = path.join(root, 'My Repo');
    fs.mkdirSync(repo);
    git(repo, 'init', '-q', '-b', 'main');
    git(repo, 'commit', '-q', '--allow-empty', '-m', 'x');
    const folders = () => fs.existsSync(projects) ? fs.readdirSync(projects) : [];

    // Read access creates nothing and finds nothing.
    assert.strictEqual(store.readState(repo), null);
    assert.strictEqual(fs.existsSync(path.join(home, '.qatlas')), false);
    assert.strictEqual(fs.existsSync(path.join(repo, '.qatlas')), false);

    const state = store.ensureState(repo);
    assert.match(path.basename(state), /^my-repo-uid[0-9a-f]{8}$/);
    assert.strictEqual(path.dirname(state), projects);
    assert.strictEqual(fs.readFileSync(path.join(state, 'path'), 'utf8').trim(), repo);
    const id = fs.readFileSync(path.join(repo, '.qatlas', 'local', 'uid'), 'utf8').trim();
    assert.match(id, /^[0-9a-f]{8}$/);
    assert.strictEqual(git(repo, 'status', '--short').stdout, '', 'The id file stays out of git status.');
    assert.strictEqual(store.readState(repo), state);
    assert.strictEqual(store.ensureState(repo), state);

    // A linked worktree and a subfolder share the state of the primary working tree.
    const tree = path.join(root, 'tree');
    assert.strictEqual(git(repo, 'worktree', 'add', '-q', '-b', 'side', tree).status, 0);
    assert.strictEqual(store.ensureState(tree), state);
    assert.strictEqual(store.readState(tree), state);
    assert.strictEqual(fs.existsSync(path.join(tree, '.qatlas')), false);
    fs.mkdirSync(path.join(repo, 'sub'));
    assert.strictEqual(store.readState(path.join(repo, 'sub')), state);
    git(repo, 'worktree', 'remove', '--force', tree);

    // A clone gets its own id.
    const clone = path.join(root, 'clone');
    assert.strictEqual(spawnSync('git', ['clone', '-q', repo, clone]).status, 0);
    const cloneState = store.ensureState(clone);
    assert.notStrictEqual(cloneState, state);
    assert.strictEqual(folders().length, 2);

    // Moving the project and renaming the state folder keep the assignment, the path follows the move.
    const moved = path.join(root, 'moved');
    fs.renameSync(repo, moved);
    assert.strictEqual(store.readState(moved), state);
    assert.strictEqual(store.ensureState(moved), state);
    assert.strictEqual(fs.readFileSync(path.join(state, 'path'), 'utf8').trim(), moved);
    const renamed = path.join(projects, 'chosen-name-uid' + id);
    fs.renameSync(state, renamed);
    assert.strictEqual(store.readState(moved), renamed);
    assert.strictEqual(store.ensureState(moved), renamed);
    assert.strictEqual(folders().length, 2);

    // Without the id file the write access takes over the id of the folder whose path points here.
    fs.rmSync(path.join(moved, '.qatlas'), { recursive: true });
    assert.strictEqual(store.readState(moved), null);
    assert.strictEqual(store.ensureState(moved), renamed);
    assert.strictEqual(fs.readFileSync(path.join(moved, '.qatlas', 'local', 'uid'), 'utf8').trim(), id);
    assert.strictEqual(git(moved, 'status', '--short').stdout, '');

    // The same id in two folders is an error naming both, and no folder is chosen.
    const twin = path.join(projects, 'twin-uid' + id);
    fs.mkdirSync(twin);
    for (const call of [store.readState, store.ensureState]) {
      assert.throws(() => call(moved), error => error.message.includes(renamed) && error.message.includes(twin));
    }
    fs.rmdirSync(twin);

    // Outside git: the nearest folder upwards with .qatlas, else the start folder. Home is never a project.
    const plain = path.join(root, 'plain');
    fs.mkdirSync(path.join(plain, '.qatlas'), { recursive: true });
    fs.mkdirSync(path.join(plain, 'a', 'b'), { recursive: true });
    assert.strictEqual(store.projectDir(path.join(plain, 'a', 'b')), plain);
    const plainState = store.ensureState(path.join(plain, 'a', 'b'));
    assert.ok(fs.existsSync(path.join(plain, '.qatlas', 'local', 'uid')));
    assert.strictEqual(store.readState(plain), plainState);
    const lone = path.join(root, 'lone');
    fs.mkdirSync(lone);
    assert.strictEqual(store.projectDir(lone), lone);
    fs.mkdirSync(path.join(home, 'work'));
    assert.strictEqual(store.projectDir(home), null);
    assert.strictEqual(store.ensureState(home), null);
    assert.strictEqual(store.projectDir(path.join(home, 'work')), path.join(home, 'work'));
    assert.strictEqual(fs.existsSync(path.join(home, '.qatlas', 'local')), false);

    // A submodule is a project in its own working tree, also seen from one of its linked working trees.
    const outer = path.join(root, 'outer');
    fs.mkdirSync(outer);
    git(outer, 'init', '-q');
    const mod = path.join(outer, 'mod');
    assert.strictEqual(git(outer, '-c', 'protocol.file.allow=always', 'submodule', '--quiet', 'add', clone, 'mod').status, 0);
    assert.strictEqual(store.projectDir(mod), mod);
    const modTree = path.join(root, 'mod-tree');
    assert.strictEqual(git(mod, 'worktree', 'add', '-q', '-b', 'mod-side', modTree).status, 0);
    assert.strictEqual(store.projectDir(modTree), mod);
  } finally {
    process.env.HOME = previous;
  }
}

function listFiles(dir) {
  const out = [];
  const walk = d => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const file = path.join(d, entry.name);
      out.push(path.relative(dir, file) + (entry.isDirectory() ? '/' : ':' + fs.readFileSync(file, 'utf8').length));
      if (entry.isDirectory()) walk(file);
    }
  };
  walk(dir);
  return out.sort();
}

function testSizeLimitsMatchReference() {
  const checks = require('../plugins/qatlas/scripts/runtime/knowledge-checks.js');
  const lines = fs.readFileSync(checks.SIZE_REFERENCE, 'utf8').split('\n').filter(line => line.includes('Wörter'));
  const limitOf = pattern => {
    const found = lines.filter(line => pattern.test(line));
    assert.strictEqual(found.length, 1, 'One limit line per kind in the reference: ' + pattern);
    return Number(/höchstens ([\d.]+) Wörter/.exec(found[0])[1].replace(/\./g, ''));
  };
  assert.strictEqual(limitOf(/PROJECT\.md/), checks.wordLimit('PROJECT.md'));
  assert.strictEqual(limitOf(/reservierte Datei/), checks.wordLimit('TESTING.md'));
  assert.strictEqual(limitOf(/Markdown-Datei/), checks.wordLimit('knowledge/knowledge-x.md'));
}

function testDoctorProjectState() {
  const f = fixture('doctor-state');
  const projects = path.join(f.home, '.qatlas', 'projects');
  const doctor = path.join(pluginRoot, 'scripts', 'qatlas-doctor.js');
  const run = () => runNode(doctor, ['--target', f.project], { cwd: f.project, home: f.home });
  const folder = (name, projectPath) => {
    write(path.join(projects, name, 'path'), projectPath === undefined ? '' : projectPath + '\n');
    if (projectPath === undefined) fs.rmSync(path.join(projects, name, 'path'));
  };
  const own = fs.realpathSync(f.project);
  const withId = (dir, id) => write(path.join(dir, '.qatlas', 'local', 'uid'), id + '\n');

  // No state anywhere: nothing about project state, and nothing is created.
  fs.rmSync(f.home, { recursive: true });
  fs.mkdirSync(f.home);
  assert.ok(!/project state|state folder/.test(run().stdout));
  assert.strictEqual(fs.existsSync(path.join(f.home, '.qatlas')), false);

  withId(f.project, 'aaaaaaaa');
  folder('mine-uidaaaaaaaa', own);
  const other = path.join(f.root, 'other');
  withId(other, 'cccccccc');
  folder('valid-uidcccccccc', other);
  folder('nosuffix', path.join(f.root, 'gone'));
  folder('nopath-uid11111111');
  folder('gone-uid22222222', path.join(f.root, 'gone'));
  const foreign = path.join(f.root, 'foreign');
  withId(foreign, 'ffffffff');
  folder('foreign-uid33333333', foreign);
  // A project that lost its id file is taken over again on the next write, so it is no finding.
  const lost = path.join(f.root, 'lost');
  fs.mkdirSync(lost);
  folder('lost-uid44444444', lost);

  const before = [listFiles(f.home), listFiles(f.project)];
  const out = run().stdout;
  assert.ok(!out.includes('project state:'), out);
  const notes = out.slice(out.indexOf('NOTES'));
  assert.strictEqual(notes.split('\n').filter(line => line.startsWith('- ')).length, 3, out);
  assert.ok(notes.includes(path.join(projects, 'nopath-uid11111111') + ' has no path file'));
  assert.ok(notes.includes(path.join(projects, 'gone-uid22222222')) && notes.includes(path.join(f.root, 'gone')));
  assert.ok(notes.includes(path.join(projects, 'foreign-uid33333333')) && notes.includes(foreign));
  assert.ok(!notes.includes('mine-uid') && !notes.includes('valid-uid') && !notes.includes('nosuffix') && !notes.includes('lost-uid'));

  // The same id in two folders is reported with both paths.
  folder('twin-uidaaaaaaaa', own);
  const twin = run().stdout;
  assert.ok(twin.split('NOTES')[0].includes('project state: '), twin);
  assert.ok(twin.includes(path.join(projects, 'mine-uidaaaaaaaa')) && twin.includes(path.join(projects, 'twin-uidaaaaaaaa')));
  fs.rmSync(path.join(projects, 'twin-uidaaaaaaaa'), { recursive: true });

  assert.deepStrictEqual([listFiles(f.home), listFiles(f.project)], before, 'Doctor changes neither home nor project.');
}

function testKnowledgeHook() {
  const f = fixture('knowledge-hook');
  initProject(f);
  const script = path.join(pluginRoot, 'hooks', 'qatlas-knowledge-check.js');
  const brain = path.join(f.project, '.qatlas-brain');
  const doctor = path.join(pluginRoot, 'scripts', 'qatlas-doctor.js');
  const hook = (input, codex = false, cwd = f.project) => {
    const env = codex ? { PLUGIN_ROOT: pluginRoot, CLAUDE_PLUGIN_ROOT: '' } : {};
    const result = spawnSync(process.execPath, [script], { cwd, encoding: 'utf8',
      env: { ...process.env, HOME: f.home, ...env }, input });
    assert.strictEqual(result.status, 0, result.stderr);
    return result.stdout;
  };
  const claude = (tool = 'Write') => JSON.stringify({ hook_event_name: 'PostToolUse', cwd: f.project, tool_name: tool,
    tool_input: { file_path: path.join(brain, 'x.md') } });
  const codex = JSON.stringify({ hook_event_name: 'PostToolUse', cwd: f.project, tool_name: 'apply_patch',
    tool_input: { command: '*** Begin Patch\n*** End Patch' } });
  const notes = out => out ? JSON.parse(out).hookSpecificOutput.additionalContext : '';

  write(path.join(f.project, 'AGENTS.md'), '# Own\n');
  write(path.join(brain, 'knowledge', 'knowledge-a.md'), 'word\n');
  assert.strictEqual(hook(claude()), '', 'The first call only stores the baseline.');
  assert.deepStrictEqual(fs.readdirSync(f.project).sort(), ['.git', '.qatlas', 'AGENTS.md', '.qatlas-brain'].sort());

  write(path.join(brain, 'knowledge', 'knowledge-a.md'), 'word '.repeat(3501));
  const over = hook(claude('Edit'));
  const parsed = JSON.parse(over).hookSpecificOutput;
  assert.strictEqual(parsed.hookEventName, 'PostToolUse');
  assert.ok(parsed.additionalContext.includes('.qatlas-brain/knowledge/knowledge-a.md has 3501 words, limit 3500.'), over);
  assert.ok(parsed.additionalContext.includes('size-limits.md'), 'The note names the reference.');
  assert.strictEqual(hook(codex, true), '', 'An unchanged file over the limit is not reported again.');
  write(path.join(f.project, 'src', 'code.js'), 'x\n');
  assert.strictEqual(hook(claude()), '', 'A change outside the knowledge space stays silent.');

  write(path.join(brain, 'knowledge', 'knowledge-a.md'), 'word '.repeat(3500));
  assert.strictEqual(hook(claude()), '', 'A file at its limit stays silent.');
  write(path.join(brain, 'PROJECT.md'), 'word\n'.repeat(1001));
  const project = notes(hook(codex, true));
  assert.ok(project.includes('.qatlas-brain/PROJECT.md has 1001 words, limit 1000. Move details into project/'), project);
  assert.ok(project.includes('.qatlas-brain/PROJECT.md has no line with its reading condition in AGENTS.md.'), project);

  write(path.join(brain, 'PROJECT.md'), 'word\n'.repeat(5));
  const open = notes(hook(claude()));
  assert.ok(open.includes('PROJECT.md has no line'), 'A reserved file without a line is reported after its write.');
  write(path.join(f.project, 'AGENTS.md'), '# Own\nPROJECT.md: read it first.\n');
  assert.strictEqual(hook(claude()), '', 'A written AGENTS.md that names the file stays silent.');
  write(path.join(brain, 'TESTING.md'), 'word\n');
  write(path.join(f.project, 'AGENTS.md'), '# Own\nPROJECT.md: read it first.\n\n');
  assert.strictEqual(notes(hook(claude())), '.qatlas-brain/TESTING.md has no line with its reading condition in AGENTS.md.',
    'Writing AGENTS.md reports a reserved file it leaves out.');

  // The doctor reports the same sentences from the same code.
  write(path.join(brain, 'knowledge', 'knowledge-a.md'), 'word '.repeat(3501));
  const hooked = notes(hook(claude()));
  const doctored = runNode(doctor, ['--target', f.project], { cwd: f.project, home: f.home }).stdout;
  for (const line of hooked.split('\n')) assert.ok(doctored.includes(line), 'The doctor lacks: ' + line);

  assert.strictEqual(hook('{broken'), '', 'Broken input ends silently with 0.');
  assert.strictEqual(hook(''), '', 'Empty input ends silently with 0.');
  assert.strictEqual(hook(claude(), false, path.join(f.project, 'src')), '', 'A subfolder finds the project.');

  const plain = fixture('knowledge-hook-plain');
  initProject(plain);
  write(path.join(plain.project, 'AGENTS.md'), '# Own\n');
  const quiet = spawnSync(process.execPath, [script], { cwd: plain.project, encoding: 'utf8', input: JSON.stringify({ cwd: plain.project }),
    env: { ...process.env, HOME: plain.home } });
  assert.strictEqual(quiet.status, 0);
  assert.strictEqual(quiet.stdout, '');
  assert.strictEqual(fs.existsSync(path.join(plain.project, '.qatlas')), false, 'No state without a knowledge space.');
  assert.strictEqual(fs.existsSync(path.join(plain.home, '.qatlas')), false);
}

function testWorktreePath() {
  const f = fixture('worktree');
  initProject(f);
  spawnSync('git', ['-C', f.project, 'commit', '-q', '--allow-empty', '-m', 'x']);
  const script = path.join(pluginRoot, 'scripts', 'qatlas-worktree-path.js');
  const where = (target, branch = 'task/0001-test') => {
    const result = runNode(script, [branch, '--target', target], { cwd: f.root, home: f.home });
    assert.strictEqual(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const first = where(f.project);

  // A linked worktree resolves to the same state folder.
  const linked = path.join(f.root, 'linked');
  assert.strictEqual(spawnSync('git', ['-C', f.project, 'worktree', 'add', '-q', '-b', 'side', linked]).status, 0);
  assert.strictEqual(where(linked), first);
  assert.strictEqual(spawnSync('git', ['-C', f.project, 'worktree', 'remove', linked]).status, 0);

  // The path depends on the project id, not on where the repo lies.
  const moved = path.join(f.root, 'moved');
  fs.renameSync(f.project, moved);
  assert.strictEqual(where(moved), first);

  const plain = path.join(f.root, 'plain');
  fs.mkdirSync(plain);
  assert.strictEqual(runNode(script, ['task/x', '--target', plain], { cwd: f.root, home: f.home }).status, 1);
  assert.strictEqual(fs.existsSync(path.join(plain, '.qatlas')), false, 'No project id outside a repo.');
}

try {
  testConfig();
  testDoctorRunBlock();
  testConfigMigration();
  testProjectContext();
  testLocalBacklogLine();
  testBrainMigration();
  testInit();
  testLibraryAndSubagent();
  testStatuslineRefresh();
  testStatuslineCodex();
  testProjectStore();
  testDoctorProjectState();
  testSizeLimitsMatchReference();
  testKnowledgeHook();
  testWorktreePath();
  process.stdout.write('✓ Qatlas init, doctor and context: 15 scenarios passed.\n');
} finally {
  for (const directory of temporary) fs.rmSync(directory, { recursive: true, force: true });
}
