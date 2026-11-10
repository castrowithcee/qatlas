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
    'statusline belongs to the user file; protection.allow to the project file.');
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

const VALID_TEAM = {
  'test-slots': 2,
  profiles: { light: 'Narrow.', standard: 'Several steps.', demanding: 'Hard diagnosis.' },
  hosts: {
    'claude-code': {
      integrator: null, lead: 'opus',
      worker: {
        light: { model: 'haiku', effort: null },
        standard: { model: 'sonnet', effort: 'high' },
        demanding: { model: 'opus', effort: 'high' },
      },
    },
  },
};

function testDoctorTeamBlock() {
  const f = fixture('doctor-team');
  initProject(f);
  const doctor = path.join(pluginRoot, 'scripts', 'qatlas-doctor.js');
  const config = path.join(f.home, '.qatlas', 'plugins', 'config.json');
  const check = () => runNode(doctor, ['--target', f.project], { cwd: f.project, home: f.home });
  assert.ok(!check().stdout.includes('team'), 'The team block is optional.');
  write(config, { format: 1, team: VALID_TEAM });
  const ok = check();
  assert.ok(!ok.stdout.includes('team'), ok.stdout);
  const incomplete = JSON.parse(JSON.stringify(VALID_TEAM));
  delete incomplete.hosts['claude-code'].worker.demanding;
  incomplete['test-slots'] = 0;
  write(config, { format: 1, team: incomplete });
  const bad = check().stdout;
  assert.ok(bad.includes('team.hosts.claude-code.worker.demanding needs model and effort'), bad);
  assert.ok(bad.includes('team.test-slots needs a positive integer'), bad);
}

function testProjectContext() {
  const f = fixture('context');
  write(path.join(f.project, '.qatlas-project', 'memory', 'MEMORY.md'), '# Memory\n');
  write(path.join(f.project, '.qatlas-project', 'backlog', 'BACKLOG.md'), '---\ntype: meta\nedit: shared\n---\n# Backlog\n');
  assert.strictEqual(hookOutput(f, 'project-backlog'), hookOutput(f, 'project-backlog', true));
  assert.ok(hookOutput(f, 'memory').includes('# Memory'));
  assert.ok(hookOutput(f, 'project-backlog').includes('# Backlog'));
  assert.ok(!hookOutput(f, 'project-backlog').includes('edit: shared'), 'Frontmatter is stripped.');
  assert.ok(hookOutput(f, 'qatlas').includes('QATLAS SCAFFOLD: yes'));

  const missing = fixture('context-missing');
  fs.mkdirSync(path.join(missing.project, '.qatlas-project'));
  assert.strictEqual(hookOutput(missing, 'project-backlog'), '', 'A missing index yields no output.');
  assert.deepStrictEqual(fs.readdirSync(path.join(missing.project, '.qatlas-project')), [],
    'The session start writes nothing into the repo.');

  const unreadable = fixture('context-unreadable');
  fs.mkdirSync(path.join(unreadable.project, '.qatlas-project', 'backlog', 'BACKLOG.md'), { recursive: true });
  assert.strictEqual(hookOutput(unreadable, 'project-backlog'), '', 'An unreadable index yields no output.');

  const huge = fixture('context-huge');
  write(path.join(huge.project, '.qatlas-project', 'backlog', 'BACKLOG.md'),
    Array.from({ length: 1200 }, (_, index) => 'Line ' + index).join('\n') + '\nEND-OF-FILE\n');
  const hugeOutput = hookOutput(huge, 'project-backlog');
  assert.ok(hugeOutput.includes('QATLAS BLOCK TRUNCATED'));
  assert.ok(!hugeOutput.includes('END-OF-FILE'));

  const disabled = fixture('context-memory-off');
  write(path.join(disabled.project, '.qatlas-project', 'memory', 'MEMORY.md'), '# Memory\n');
  write(path.join(disabled.project, '.qatlas-project', 'backlog', 'BACKLOG.md'), '# Backlog\n');
  write(path.join(disabled.project, '.qatlas', 'plugins', 'config.json'), { format: 1, memory: { enable: false } });
  assert.strictEqual(hookOutput(disabled, 'memory'), '', 'Disabled repo memory is not injected.');
  assert.ok(hookOutput(disabled, 'project-backlog').includes('# Backlog'));
  assert.ok(hookOutput(disabled, 'qatlas').includes('repo memory is disabled'));
  assert.ok(hookOutput(f, 'qatlas').includes('memory index too'));

  const nested = fixture('context-subfolder');
  initProject(nested);
  write(path.join(nested.project, '.qatlas-project', 'backlog', 'BACKLOG.md'), '# Backlog\n');
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

function testLibraryAndSubagent() {
  const f = fixture('library');
  initProject(f);
  const doctor = path.join(pluginRoot, 'scripts', 'qatlas-doctor.js');
  const init = path.join(pluginRoot, 'scripts', 'qatlas-init.js');
  const agentsFile = path.join(f.home, 'qatlas', 'AGENTS.qatlas.md');
  assert.strictEqual(hookOutput(f, 'library'), '', 'No pointer without the library.');
  const report = runNode(doctor, ['--target', f.project], { cwd: f.project, home: f.home }).stdout;
  assert.ok(report.includes('~/qatlas/AGENTS.qatlas.md is missing') && report.includes('~/qatlas/README.md is missing'));
  assert.strictEqual(fs.existsSync(path.join(f.home, 'qatlas')), false, 'The doctor writes nothing.');
  assert.strictEqual(runNode(init, ['--target', f.project], { cwd: f.project, home: f.home }).status, 0);
  assert.deepStrictEqual(fs.readdirSync(path.join(f.home, 'qatlas')).sort(), ['AGENTS.qatlas.md', 'README.md']);
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
    /\/\.qatlas\/state\/worktrees\/project-[0-9a-f]{8}\/task\/0001-test$/);

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
  assert.deepStrictEqual(fs.readdirSync(path.join(f.project, '.qatlas-project')).sort(),
    ['backlog', 'memory', 'zone-export', 'zone-import']);
  assert.deepStrictEqual(fs.readdirSync(path.join(f.project, '.qatlas-project', 'backlog')), ['BACKLOG.md']);
  assert.deepStrictEqual(fs.readdirSync(path.join(f.project, '.qatlas-project', 'memory')), ['MEMORY.md']);
  for (const zone of ['zone-import', 'zone-export']) {
    assert.deepStrictEqual(fs.readdirSync(path.join(f.project, '.qatlas-project', zone)), ['.gitkeep']);
  }
  assert.strictEqual(fs.readFileSync(path.join(f.project, 'CLAUDE.md'), 'utf8'), '@AGENTS.md\n');
  assert.ok(fs.readFileSync(path.join(f.project, 'AGENTS.md'), 'utf8').includes('## Projektwissen'));
  assert.strictEqual(fs.readFileSync(path.join(f.project, 'README.md'), 'utf8'), '# project\n',
    'Init adds a minimal README named after the folder.');
  assert.strictEqual(fs.existsSync(path.join(f.project, '.qatlas')), false,
    'A project configuration arises only on request.');
  const ignore = fs.readFileSync(path.join(f.project, '.gitignore'), 'utf8');
  assert.ok(ignore.startsWith('# foreign\n/custom/\n'));
  for (const rule of ['/.qatlas-project/zone-import/*', '/.qatlas-project/zone-export/*', '/.qatlas/local/']) {
    assert.ok(ignore.includes(rule), rule);
  }

  spawnSync('git', ['-C', f.project, 'config', 'user.name', 'Qatlas Test']);
  spawnSync('git', ['-C', f.project, 'config', 'user.email', 'qatlas@example.invalid']);
  assert.strictEqual(run(doctor).stdout.trim(), 'OK: nothing missing.');

  const backlog = path.join(f.project, '.qatlas-project', 'backlog', 'BACKLOG.md');
  write(backlog, '# External\nhttps://example.invalid/project\nNo local tasks.\n');
  write(path.join(f.project, 'AGENTS.md'), '# Own\n');
  const second = run(init);
  assert.strictEqual(second.status, 0, second.stdout);
  assert.strictEqual(second.stdout.trim(), 'OK: nothing to do.');
  assert.ok(fs.readFileSync(backlog, 'utf8').includes('https://example.invalid/project'));
  assert.strictEqual(fs.readFileSync(path.join(f.project, 'AGENTS.md'), 'utf8'), '# Own\n');
  assert.strictEqual(fs.readFileSync(path.join(f.project, '.gitignore'), 'utf8'), ignore, 'Rules are added once.');

  const memoryDir = path.join(f.project, '.qatlas-project', 'memory');
  fs.rmSync(memoryDir, { recursive: true });
  assert.ok(run(doctor).stdout.includes('.qatlas-project/memory/MEMORY.md is missing'));
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
  assert.strictEqual(fs.existsSync(path.join(f.project, 'src', '.qatlas-project')), false,
    'Init inside a repo works on its root, never on a subfolder.');
  assert.strictEqual(fs.existsSync(path.join(sub, '.qatlas-project')), false);
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

try {
  testConfig();
  testDoctorTeamBlock();
  testProjectContext();
  testInit();
  testLibraryAndSubagent();
  testStatuslineRefresh();
  testStatuslineCodex();
  process.stdout.write('✓ Qatlas init, doctor and context: 7 scenarios passed.\n');
} finally {
  for (const directory of temporary) fs.rmSync(directory, { recursive: true, force: true });
}
