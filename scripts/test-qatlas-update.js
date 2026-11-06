#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const YAML = require('../plugins/qatlas/scripts/runtime/vendor/yaml-2.9.0.js');
const { pendingUpdates } = require('../plugins/qatlas/scripts/qatlas-update.js');

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

function readYaml(file) {
  const document = YAML.parseDocument(fs.readFileSync(file, 'utf8'));
  if (document.errors.length) throw document.errors[0];
  return document.toJS();
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

// A copy of the plugin with one visible update instruction, since the checkout holds only NEXT.md.
function pluginWithUpdate(f, version = '0.0.1') {
  const copy = path.join(f.root, 'plugin');
  fs.cpSync(pluginRoot, copy, { recursive: true });
  write(path.join(copy, 'updates', version + '.md'), '# ' + version + '\n');
  return copy;
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
  const homeConfig = path.join(f.home, '.qatlas', 'plugins', 'config.yaml');
  const projectConfig = path.join(f.project, '.qatlas', 'plugins', 'config.yaml');
  let state = readConfigWithHome(f.home, f.project);
  assert.deepStrictEqual(state.config.protection, { secrets: 'block', 'personal-data': 'ask' });
  assert.strictEqual(state.exists, false);

  write(homeConfig, 'format: 1\nsession-start:\n  enabled: false\nprotection:\n  enabled: true\n  personal-data: warn\n');
  write(projectConfig, 'format: 1\nbrains:\n  qatlas:\n    enabled: true\nprotection:\n  personal-data: block\n');
  state = readConfigWithHome(f.home, f.project);
  assert.strictEqual(state.valid, true, 'Unknown keys never invalidate the configuration.');
  assert.deepStrictEqual(state.config.protection, { secrets: 'block', 'personal-data': 'block' });
  assert.deepStrictEqual(state.unknown.map(line => line.replace(/^.*: /, '')).sort(),
    ['unknown key brains.', 'unknown key protection.enabled.', 'unknown key session-start.']);
  assert.strictEqual(state.problems.length, 0);

  write(projectConfig, 'format: 1\nprotection:\n  secrets: warn\n');
  state = readConfigWithHome(f.home, f.project);
  assert.strictEqual(state.protectionValid, false);
  assert.ok(state.problems.some(line => line.includes('protection.secrets must be one of block, allow')));
}

function testDoctorTeamFile() {
  const f = fixture('doctor-team');
  initProject(f);
  const doctor = path.join(pluginRoot, 'scripts', 'qatlas-doctor.js');
  const teamFile = path.join(f.home, '.qatlas', 'plugins', 'team.yaml');
  const check = () => runNode(doctor, ['--target', f.project], { cwd: f.project, home: f.home });
  assert.ok(!check().stdout.includes('team.yaml'), 'team.yaml is optional.');
  const valid = readYaml(path.join(pluginRoot, 'skills', 'qatlas', 'assets', 'team.example.yaml'));
  write(teamFile, YAML.stringify(valid));
  const ok = check();
  assert.ok(!ok.stdout.includes('team.yaml'), ok.stdout);
  const incomplete = JSON.parse(JSON.stringify(valid));
  delete incomplete.hosts['claude-code'].worker.demanding;
  write(teamFile, YAML.stringify(incomplete));
  const bad = check();
  assert.ok(bad.stdout.includes('team.yaml is invalid'), bad.stdout);
  assert.ok(bad.stdout.includes('worker.demanding'));
  write(teamFile, YAML.stringify({ ...valid, format: 1 }));
  assert.ok(check().stdout.includes('team.yaml is invalid'));
}

function testProjectContext() {
  const f = fixture('context');
  write(path.join(f.project, '.qatlas-project', 'README.md'), '---\ntype: meta\nedit: shared\n---\n# Entry\nSource: docs/README.md\n');
  write(path.join(f.project, '.qatlas-project', 'memory', 'MEMORY.md'), '# Memory\n');
  write(path.join(f.project, '.qatlas-project', 'backlog', 'BACKLOG.md'), '# Backlog\n');
  assert.strictEqual(hookOutput(f, 'project-root'), hookOutput(f, 'project-root', true));
  assert.ok(hookOutput(f, 'project-root').includes('Source: docs/README.md'));
  assert.ok(hookOutput(f, 'memory').includes('# Memory'));
  assert.ok(hookOutput(f, 'project-backlog').includes('# Backlog'));
  assert.ok(hookOutput(f, 'qatlas').includes('QATLAS SCAFFOLD: yes'));

  const missing = fixture('context-missing');
  fs.mkdirSync(path.join(missing.project, '.qatlas-project'));
  assert.strictEqual(hookOutput(missing, 'project-root'), '', 'A missing entry yields no output.');
  assert.deepStrictEqual(fs.readdirSync(path.join(missing.project, '.qatlas-project')), [],
    'The session start writes nothing into the repo.');

  const unreadable = fixture('context-unreadable');
  fs.mkdirSync(path.join(unreadable.project, '.qatlas-project', 'README.md'), { recursive: true });
  assert.strictEqual(hookOutput(unreadable, 'project-root'), '', 'An unreadable entry yields no output.');
  assert.deepStrictEqual(fs.readdirSync(path.join(unreadable.project, '.qatlas-project')), ['README.md']);

  const long = fixture('context-long');
  write(path.join(long.project, '.qatlas-project', 'README.md'),
    Array.from({ length: 82 }, (_, index) => 'Line ' + index).join('\n') + '\nEND-OF-FILE\n');
  const longOutput = hookOutput(long, 'project-root');
  assert.ok(longOutput.includes('END-OF-FILE'), 'A README within the block budget is injected completely.');
  assert.ok(!longOutput.includes('README BUDGET EXCEEDED'));
  assert.ok(!longOutput.includes('QATLAS BLOCK TRUNCATED'));

  const huge = fixture('context-huge');
  write(path.join(huge.project, '.qatlas-project', 'README.md'),
    Array.from({ length: 1200 }, (_, index) => 'Line ' + index).join('\n') + '\nEND-OF-FILE\n');
  const hugeOutput = hookOutput(huge, 'project-root');
  assert.ok(hugeOutput.includes('QATLAS BLOCK TRUNCATED'));
  assert.ok(!hugeOutput.includes('END-OF-FILE'));

  const disabled = fixture('context-memory-off');
  write(path.join(disabled.project, '.qatlas-project', 'memory', 'MEMORY.md'), '# Memory\n');
  write(path.join(disabled.project, '.qatlas-project', 'backlog', 'BACKLOG.md'), '# Backlog\n');
  write(path.join(disabled.project, '.qatlas', 'plugins', 'config.yaml'), 'format: 1\nmemory:\n  enable: false\n');
  assert.strictEqual(hookOutput(disabled, 'memory'), '', 'Disabled repo memory is not injected.');
  assert.ok(hookOutput(disabled, 'project-backlog').includes('# Backlog'));
  assert.ok(hookOutput(disabled, 'qatlas').includes('repo memory is disabled'));
  assert.ok(hookOutput(f, 'qatlas').includes('memory index too'));

  const ambient = fixture('context-ambient');
  assert.ok(hookOutput(ambient, 'qatlas').includes('QATLAS SCAFFOLD: no'));
  assert.strictEqual(hookOutput(ambient, 'project-root'), '');
}

function testLibraryAndSubagent() {
  const f = fixture('library');
  initProject(f);
  const doctor = path.join(pluginRoot, 'scripts', 'qatlas-doctor.js');
  const agentsFile = path.join(f.home, 'qatlas', 'AGENTS.qatlas.md');
  assert.strictEqual(hookOutput(f, 'library'), '', 'No pointer without the library.');
  const report = runNode(doctor, ['--target', f.project], { cwd: f.project, home: f.home }).stdout;
  assert.ok(report.includes('~/qatlas/AGENTS.qatlas.md is missing') && report.includes('~/qatlas/README.md is missing'));
  assert.strictEqual(runNode(doctor, ['--apply', '--target', f.project], { cwd: f.project, home: f.home }).status, 0);
  assert.deepStrictEqual(fs.readdirSync(path.join(f.home, 'qatlas')).sort(), ['AGENTS.qatlas.md', 'README.md']);
  fs.writeFileSync(agentsFile, '# Own version\n');
  runNode(doctor, ['--apply', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(fs.readFileSync(agentsFile, 'utf8'), '# Own version\n', 'The user file stays unchanged.');

  for (const name of ['config.yaml', 'statusline.yaml']) {
    assert.strictEqual(fs.existsSync(path.join(f.home, '.qatlas', 'plugins', name)), false,
      'Setup writes no configuration file; the shipped defaults apply.');
  }

  assert.ok(hookOutput(f, 'library').includes(agentsFile.split(path.sep).join('/')));
  assert.strictEqual(hookOutput(f, 'library'), hookOutput(f, 'library', true));

  write(path.join(f.home, '.qatlas', 'plugins', 'config.yaml'), 'format: 1\nbrains:\n  qatlas:\n    enabled: false\n');
  const stale = runNode(doctor, ['--target', f.project], { cwd: f.project, home: f.home }).stdout;
  assert.ok(stale.includes('unknown key brains. Qatlas no longer reads it'), stale);
  assert.ok(hookOutput(f, 'library').includes('AGENTS.qatlas.md'), 'The pointer follows the library alone.');

  const worktree = runNode(path.join(pluginRoot, 'scripts', 'qatlas-worktree-path.js'),
    ['task/0001-test', '--target', f.project], { cwd: f.project, home: f.home });
  assert.match(worktree.stdout.trim(),
    /\/\.qatlas\/state\/worktrees\/project-[0-9a-f]{8}\/task\/0001-test$/);

  const script = path.join(pluginRoot, 'hooks', 'qatlas-context.js');
  const subagent = runNode(script, ['subagent'], { cwd: f.project, home: f.home });
  const payload = JSON.parse(subagent.stdout).hookSpecificOutput;
  assert.strictEqual(payload.hookEventName, 'SubagentStart');
  assert.ok(payload.additionalContext.includes('qatlas-core-navigation'));
  assert.ok(payload.additionalContext.includes('QATLAS-LIBRARY'));
}

function testDoctorSetupAndUpdateState() {
  const f = fixture('doctor');
  initProject(f);
  write(path.join(f.project, '.gitignore'), '# foreign\n/custom/\n');
  const doctor = path.join(pluginRoot, 'scripts', 'qatlas-doctor.js');
  const first = runNode(doctor, ['--apply', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(first.status, 0, first.stderr);
  assert.deepStrictEqual(fs.readdirSync(path.join(f.project, '.qatlas-project')).sort(), ['backlog', 'memory']);
  assert.deepStrictEqual(fs.readdirSync(path.join(f.project, '.qatlas-project', 'backlog')), ['BACKLOG.md']);
  assert.deepStrictEqual(fs.readdirSync(path.join(f.project, '.qatlas-project', 'memory')), ['MEMORY.md']);
  assert.ok(fs.existsSync(path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json')));
  assert.strictEqual(fs.existsSync(path.join(f.project, '.qatlas', 'plugins', 'config.yaml')), false,
    'A project configuration arises only on request.');
  const ignore = fs.readFileSync(path.join(f.project, '.gitignore'), 'utf8');
  assert.ok(ignore.includes('/custom/'));
  assert.ok(ignore.includes('/.qatlas-project/zone-import/*'));

  const backlog = path.join(f.project, '.qatlas-project', 'backlog', 'BACKLOG.md');
  write(backlog, '# External\nhttps://example.invalid/project\nNo local tasks.\n');
  const second = runNode(doctor, ['--apply', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(second.status, 0, second.stderr);
  assert.ok(!second.stdout.includes('CREATED'), second.stdout);
  assert.ok(fs.readFileSync(backlog, 'utf8').includes('https://example.invalid/project'));
  assert.deepStrictEqual(fs.readdirSync(path.dirname(backlog)).sort(), ['BACKLOG.md']);

  const memoryDir = path.join(f.project, '.qatlas-project', 'memory');
  fs.rmSync(memoryDir, { recursive: true });
  const third = runNode(doctor, ['--apply', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(third.status, 0, third.stderr);
  assert.ok(fs.existsSync(path.join(memoryDir, 'MEMORY.md')), 'With repo memory enabled, the index seed is restored.');

  fs.rmSync(memoryDir, { recursive: true });
  write(path.join(f.project, '.qatlas', 'plugins', 'config.yaml'), 'format: 1\nmemory:\n  enable: false\n');
  const fourth = runNode(doctor, ['--apply', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(fourth.status, 0, fourth.stderr);
  assert.strictEqual(fs.existsSync(memoryDir), false, 'With repo memory disabled, no memory folder is created.');
}

function testEarlierProjectRoot() {
  for (const legacy of ['.qatlas/project', '__qatlas__', '__callbell__']) {
    const f = fixture('legacy-root');
    initProject(f);
    write(path.join(f.project, legacy, 'README.md'), '# Old\n');
    write(path.join(f.project, '.gitignore'), '# unchanged\n');
    const doctor = runNode(path.join(pluginRoot, 'scripts', 'qatlas-doctor.js'),
      ['--apply', '--target', f.project], { cwd: f.project, home: f.home });
    assert.ok(doctor.stdout.includes(legacy + ' is an earlier project root'), doctor.stdout);
    assert.ok(doctor.stdout.includes('nothing was changed'));
    assert.strictEqual(fs.readFileSync(path.join(f.project, '.gitignore'), 'utf8'), '# unchanged\n');
    assert.strictEqual(fs.existsSync(path.join(f.project, '.qatlas-project')), false);
    assert.strictEqual(fs.existsSync(path.join(f.project, 'AGENTS.md')), false);

    const plugin = pluginWithUpdate(f);
    const update = path.join(plugin, 'scripts', 'qatlas-update.js');
    const options = { cwd: f.project, home: f.home, pluginRoot: plugin };
    const notice = runNode(update, ['notice', '--target', f.project], options);
    assert.ok(JSON.parse(notice.stdout).systemMessage.includes('qatlas  0.0.0 -> '), notice.stdout);
    const ack = runNode(update, ['ack', '--target', f.project], options);
    assert.strictEqual(ack.status, 1);
    assert.ok(ack.stderr.includes('exactly one project root'));

    fs.mkdirSync(path.join(f.project, '.qatlas-project'));
    assert.strictEqual(runNode(update, ['ack', '--target', f.project], options).status, 1,
      'Parallel roots block the confirmation.');
    assert.strictEqual(fs.existsSync(path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json')), false);
  }
}

function testStatuslineRefresh() {
  const f = fixture('statusline');
  const setup = path.join(pluginRoot, 'scripts', 'qatlas-statusline-claude.js');
  const copy = path.join(f.home, '.qatlas', 'plugins', 'statusline.js');
  const marker = path.join(f.home, '.qatlas', 'plugins', 'runtime', 'VERSION');
  const version = fs.readFileSync(path.join(pluginRoot, 'VERSION'), 'utf8').trim();
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
  assert.strictEqual(fs.existsSync(path.join(f.home, '.qatlas', 'plugins', 'statusline.yaml')), false,
    'Setup writes no statusline.yaml; the shipped defaults apply.');

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

function testSkippedUpdateVersions() {
  const f = fixture('versions');
  const fakePlugin = path.join(f.root, 'plugin');
  fs.mkdirSync(path.join(fakePlugin, '.claude-plugin'), { recursive: true });
  fs.mkdirSync(path.join(fakePlugin, 'updates'), { recursive: true });
  fs.mkdirSync(path.join(f.project, '.qatlas-project'), { recursive: true });
  write(path.join(fakePlugin, '.claude-plugin', 'plugin.json'), { name: 'qatlas' });
  write(path.join(fakePlugin, 'VERSION'), '0.10.0\n');
  write(path.join(fakePlugin, 'updates', '0.4.0.md'), '# 0.4.0\n');
  write(path.join(fakePlugin, 'updates', '0.7.2.md'), '# 0.7.2\n');
  write(path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), {
    format: 1, plugins: { qatlas: '0.2.0' },
  });

  const result = pendingUpdates(f.project, { name: 'qatlas', version: '0.10.0' }, fakePlugin);
  assert.strictEqual(result.checked, '0.2.0');
  assert.deepStrictEqual(result.pending.map(file => path.basename(file)), ['0.4.0.md', '0.7.2.md']);
}

function testUpdateCommandsAcrossVersions() {
  const f = fixture('update-commands');
  fs.mkdirSync(path.join(f.project, '.qatlas-project'), { recursive: true });
  write(path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), {
    format: 1, plugins: { qatlas: '0.0.0' },
  });
  const plugin = pluginWithUpdate(f);
  const update = path.join(plugin, 'scripts', 'qatlas-update.js');
  const options = { cwd: f.project, home: f.home, pluginRoot: plugin };
  const notice = runNode(update, ['notice', '--target', f.project], options);
  assert.strictEqual(notice.status, 0, notice.stderr);
  const payload = JSON.parse(notice.stdout);
  assert.ok(payload.systemMessage.includes('/qatlas-core update'));
  assert.ok(payload.systemMessage.includes('qatlas  0.0.0 -> '));
  assert.ok(payload.hookSpecificOutput.additionalContext.startsWith('QATLAS-UPDATE:'));
  assert.ok(!notice.stdout.includes('.md'), 'The notice names no instruction file; the update mode reads them.');
  const markers = path.join(f.home, '.qatlas', 'state', 'update-pending');
  assert.strictEqual(fs.readdirSync(markers).length, 1);
  const expectedUpdates = fs.readdirSync(path.join(plugin, 'updates'))
    .filter(name => /^\d+\.\d+\.\d+\.md$/.test(name));
  const status = runNode(update, ['status', '--target', f.project], options);
  assert.ok(status.stdout.includes(`${expectedUpdates.length} relevant update instruction(s)`));
  for (const name of expectedUpdates) assert.ok(status.stdout.includes(name));
  const ack = runNode(update, ['ack', '--target', f.project], options);
  assert.strictEqual(ack.status, 0, ack.stderr);
  assert.strictEqual(fs.readdirSync(markers).length, 0);
  const currentVersion = fs.readFileSync(path.join(pluginRoot, 'VERSION'), 'utf8').trim();
  const state = JSON.parse(fs.readFileSync(
    path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), 'utf8'));
  assert.strictEqual(state.plugins.qatlas, currentVersion);
  const after = runNode(update, ['status', '--target', f.project], options);
  assert.ok(after.stdout.includes('0 relevant update instruction(s)'));

  write(path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), '{broken}\n');
  const invalid = runNode(update, ['ack', '--target', f.project], options);
  assert.strictEqual(invalid.status, 1);
  assert.ok(invalid.stderr.includes('Review state unchanged'));
  assert.strictEqual(fs.readFileSync(
    path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), 'utf8'), '{broken}\n');
}

function fakePlugin(directory, name, version, updates = []) {
  write(path.join(directory, '.claude-plugin', 'plugin.json'), { name });
  write(path.join(directory, 'VERSION'), version + '\n');
  for (const update of updates) write(path.join(directory, 'updates', update + '.md'), '# ' + update + '\n');
  return directory;
}

function testMarketplacePluginsInClaude() {
  const f = fixture('marketplace-claude');
  fs.mkdirSync(path.join(f.project, '.qatlas-project'), { recursive: true });
  const ownVersion = fs.readFileSync(path.join(pluginRoot, 'VERSION'), 'utf8').trim();
  write(path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), {
    format: 1, plugins: { qatlas: ownVersion, 'qatlas-pack': '0.1.0' },
  });
  const entry = installPath => [{ scope: 'user', installPath, version: '0' }];
  write(path.join(f.home, '.claude', 'plugins', 'installed_plugins.json'), {
    version: 2,
    plugins: {
      'qatlas@qatlas': entry(pluginRoot),
      'qatlas-pack@qatlas': entry(fakePlugin(path.join(f.root, 'pack'), 'qatlas-pack', '0.3.0', ['0.2.0', '0.4.0'])),
      'qatlas-off@qatlas': entry(fakePlugin(path.join(f.root, 'off'), 'qatlas-off', '0.2.0', ['0.2.0'])),
      'foreign@other': entry(fakePlugin(path.join(f.root, 'foreign'), 'foreign', '1.0.0', ['1.0.0'])),
    },
  });
  write(path.join(f.home, '.claude', 'settings.json'), { enabledPlugins: { 'qatlas-off@qatlas': false } });

  const update = path.join(pluginRoot, 'scripts', 'qatlas-update.js');
  const notice = runNode(update, ['notice', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(notice.status, 0, notice.stderr);
  const banner = JSON.parse(notice.stdout).systemMessage;
  assert.ok(banner.includes('qatlas-pack  0.1.0 -> 0.3.0'), banner);
  assert.ok(!banner.includes('qatlas-off') && !banner.includes('foreign'), banner);

  const status = runNode(update, ['status', '--target', f.project], { cwd: f.project, home: f.home }).stdout;
  assert.ok(status.includes('qatlas-pack: checked 0.1.0, installed 0.3.0, 1 relevant update instruction(s).'));
  assert.ok(status.includes('0.2.0.md') && !status.includes('0.4.0.md'));

  const ack = runNode(update, ['ack', '--plugin', 'qatlas-pack', '--target', f.project],
    { cwd: f.project, home: f.home });
  assert.strictEqual(ack.status, 0, ack.stderr);
  const state = JSON.parse(fs.readFileSync(
    path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), 'utf8'));
  assert.deepStrictEqual(state.plugins, { qatlas: ownVersion, 'qatlas-pack': '0.3.0' });
  const quiet = runNode(update, ['notice', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(quiet.stdout, '');
}

function testMarketplacePluginsInCodex() {
  const f = fixture('marketplace-codex');
  fs.mkdirSync(path.join(f.project, '.qatlas-project'), { recursive: true });
  const ownVersion = fs.readFileSync(path.join(pluginRoot, 'VERSION'), 'utf8').trim();
  write(path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), {
    format: 1, plugins: { qatlas: ownVersion },
  });
  const cache = path.join(f.home, '.codex', 'plugins', 'cache', 'qatlas');
  const installed = path.join(cache, 'qatlas', ownVersion);
  fs.cpSync(pluginRoot, installed, { recursive: true });
  fakePlugin(path.join(cache, 'qatlas-pack', '0.1.0'), 'qatlas-pack', '0.1.0', ['0.1.0']);
  fakePlugin(path.join(cache, 'qatlas-pack', '0.2.0'), 'qatlas-pack', '0.2.0', ['0.1.0', '0.2.0']);
  fakePlugin(path.join(cache, 'qatlas-off', '0.1.0'), 'qatlas-off', '0.1.0', ['0.1.0']);
  write(path.join(f.home, '.codex', 'config.toml'), [
    '[plugins."qatlas@qatlas"]', 'enabled = true', '',
    '[plugins."qatlas-pack@qatlas"]', 'enabled = true', '',
    '[plugins."qatlas-off@qatlas"]', 'enabled = false', '',
  ].join('\n'));

  const notice = runNode(path.join(installed, 'scripts', 'qatlas-update.js'), ['notice', '--target', f.project],
    { cwd: f.project, home: f.home, env: { PLUGIN_ROOT: installed, CODEX_HOME: path.join(f.home, '.codex') } });
  assert.strictEqual(notice.status, 0, notice.stderr);
  const payload = JSON.parse(notice.stdout);
  assert.ok(payload.systemMessage.includes('qatlas-pack  0.0.0 -> 0.2.0'), payload.systemMessage);
  assert.ok(payload.systemMessage.includes('$qatlas-core update'));
  assert.ok(!payload.systemMessage.includes('qatlas-off'));
}

try {
  testConfig();
  testDoctorTeamFile();
  testProjectContext();
  testDoctorSetupAndUpdateState();
  testLibraryAndSubagent();
  testEarlierProjectRoot();
  testStatuslineRefresh();
  testSkippedUpdateVersions();
  testUpdateCommandsAcrossVersions();
  testMarketplacePluginsInClaude();
  testMarketplacePluginsInCodex();
  process.stdout.write('✓ Qatlas update, doctor and context: 11 scenarios passed.\n');
} finally {
  for (const directory of temporary) fs.rmSync(directory, { recursive: true, force: true });
}
