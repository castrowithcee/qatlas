#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const YAML = require('../plugins/qatlas/scripts/runtime/vendor/yaml-2.9.0.js');
const {
  DEFAULT_CONFIG,
  DEFAULT_STATUSLINE,
} = require('../plugins/qatlas/scripts/runtime/config-loader.js');
const {
  migrateProject,
  projectMigrationInventory,
  runMigrations,
} = require('../plugins/qatlas/scripts/qatlas-migrations.js');
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
    env: { ...process.env, HOME: options.home, CLAUDE_PLUGIN_ROOT: pluginRoot, ...options.env },
    encoding: 'utf8',
  });
}

function initProject(f) {
  const result = spawnSync('git', ['init', '-q', f.project], { encoding: 'utf8' });
  assert.strictEqual(result.status, 0, result.stderr);
  spawnSync('git', ['-C', f.project, 'config', 'user.name', 'Qatlas Test']);
  spawnSync('git', ['-C', f.project, 'config', 'user.email', 'qatlas@example.invalid']);
}

function migrate(fixture, apply = true) {
  return runMigrations({
    homeDir: fixture.home,
    projectRoot: fixture.project,
    pluginRoot,
    apply,
  });
}

function testCallbellHomeMigration() {
  const f = fixture('callbell');
  const legacy = path.join(f.home, '.callbell');
  write(path.join(legacy, 'settings.json'), {
    format: 1, sessionStart: { enabled: false, ruleset: true }, mute: ['git lfs'],
  });
  write(path.join(legacy, 'statusline.json'), {
    layout: 'fixed', widgets: { model: true, weekly: false },
  });
  write(path.join(legacy, 'telegram.json'), {
    enabled: true, token: 'secret-test-token', chat_id: 42,
  });
  write(path.join(f.home, '.claude', 'settings.json'), {
    statusLine: { type: 'command', command: `node "${path.join(legacy, 'statusline.js')}"` },
    keep: true,
  });

  const result = migrate(f);
  assert.deepStrictEqual(result.blocked, []);
  assert.deepStrictEqual(result.applied, ['legacy-home-config-v1']);
  assert.ok(result.backupDir && fs.existsSync(path.join(result.backupDir, 'manifest.json')));
  assert.deepStrictEqual(result.credentialSources, [path.join(legacy, 'telegram.json')]);
  const backupManifest = fs.readFileSync(path.join(result.backupDir, 'manifest.json'), 'utf8');
  assert.ok(!backupManifest.includes('telegram.json'));
  assert.ok(!backupManifest.includes('secret-test-token'));

  const config = readYaml(path.join(f.home, '.qatlas', 'plugins', 'config.yaml'));
  assert.deepStrictEqual(config['session-start'], { enabled: false, ruleset: true });
  assert.strictEqual(config.statusline, undefined);
  assert.strictEqual(config.notifications.telegram.enabled, true);
  assert.strictEqual(config.diagnostics, undefined);

  const statusline = readYaml(path.join(f.home, '.qatlas', 'plugins', 'statusline.yaml'));
  assert.strictEqual(statusline.format, 1);
  assert.strictEqual(statusline.layout, 'fixed');

  const credentials = readYaml(path.join(f.home, '.qatlas', 'plugins', 'credentials.yaml'));
  assert.strictEqual(credentials.connections.telegram.default.token, 'secret-test-token');
  assert.strictEqual(credentials.connections.telegram.default['chat-id'], 42);

  const settings = JSON.parse(fs.readFileSync(path.join(f.home, '.claude', 'settings.json'), 'utf8'));
  assert.strictEqual(settings.keep, true);
  assert.ok(settings.statusLine.command.includes('/.qatlas/plugins/statusline.js'));
  assert.ok(fs.existsSync(path.join(f.home, '.qatlas', 'plugins', 'runtime', 'config-loader.js')));
  assert.ok(fs.existsSync(path.join(legacy, 'settings.json')), 'Legacy-Quellen bleiben bis zum Cleanup liegen.');

  const again = migrate(f);
  assert.deepStrictEqual(again, {
    applied: [], blocked: [], backupDir: null, credentialSources: [], planned: [],
  });
}

function testExistingDefaultAndDiagnostics() {
  const f = fixture('existing');
  const current = {
    ...DEFAULT_CONFIG,
    diagnostics: { mute: [] },
    statusline: { layout: 'fixed', widgets: ['model', 'dir'] },
  };
  write(path.join(f.home, '.qatlas', 'plugins', 'config.yaml'),
    YAML.stringify(current, { lineWidth: 0, version: '1.2' }));

  const result = migrate(f);
  assert.deepStrictEqual(result.blocked, []);
  const config = readYaml(path.join(f.home, '.qatlas', 'plugins', 'config.yaml'));
  assert.strictEqual(config.diagnostics, undefined);
  assert.strictEqual(config.statusline, undefined);
  const statusline = readYaml(path.join(f.home, '.qatlas', 'plugins', 'statusline.yaml'));
  assert.strictEqual(statusline.layout, 'fixed');
  assert.deepStrictEqual(statusline.widgets, ['model', 'dir']);
}

function testStatuslineCommandWithoutLegacyConfig() {
  const f = fixture('statusline-command');
  write(path.join(f.home, '.claude', 'settings.json'), {
    statusLine: {
      type: 'command',
      command: `node "${path.join(f.home, '.qatlas', 'statusline.js')}"`,
    },
  });

  const result = migrate(f);
  assert.deepStrictEqual(result.blocked, []);
  assert.deepStrictEqual(result.applied, ['legacy-home-config-v1']);
  const settings = JSON.parse(fs.readFileSync(path.join(f.home, '.claude', 'settings.json'), 'utf8'));
  assert.ok(settings.statusLine.command.includes('/.qatlas/plugins/statusline.js'));
  assert.ok(fs.existsSync(path.join(f.home, '.qatlas', 'plugins', 'statusline.js')));
}

function testLegacyStatuslineReplacesCombinedDefault() {
  const f = fixture('statusline-default');
  const combinedDefault = { ...DEFAULT_STATUSLINE };
  delete combinedDefault.format;
  write(path.join(f.home, '.qatlas', 'plugins', 'config.yaml'), YAML.stringify({
    ...DEFAULT_CONFIG,
    statusline: combinedDefault,
  }, { lineWidth: 0, version: '1.2' }));
  write(path.join(f.home, '.qatlas', 'statusline.json'), {
    layout: 'fixed', widgets: ['model', 'dir'],
  });

  const result = migrate(f);
  assert.deepStrictEqual(result.blocked, []);
  const statusline = readYaml(path.join(f.home, '.qatlas', 'plugins', 'statusline.yaml'));
  assert.strictEqual(statusline.layout, 'fixed');
  assert.deepStrictEqual(statusline.widgets, ['model', 'dir']);
}

function testConflictingLegacyFiles() {
  const f = fixture('conflict');
  write(path.join(f.home, '.callbell', 'statusline.json'), { layout: 'fixed' });
  write(path.join(f.home, '.qatlas', 'statusline.json'), { layout: 'wrap' });
  const result = migrate(f);
  assert.ok(result.blocked.some(problem => problem.includes('Widersprüchliche Legacy-Dateien')));
  assert.strictEqual(fs.existsSync(path.join(f.home, '.qatlas', 'plugins', 'config.yaml')), false);
  assert.strictEqual(fs.existsSync(path.join(f.home, '.qatlas', 'state', 'migrations.json')), false);
}

function testConflictingStatuslineTargets() {
  const f = fixture('statusline-conflict');
  const configFile = path.join(f.home, '.qatlas', 'plugins', 'config.yaml');
  const statuslineFile = path.join(f.home, '.qatlas', 'plugins', 'statusline.yaml');
  write(configFile, YAML.stringify({
    ...DEFAULT_CONFIG,
    statusline: { layout: 'fixed' },
  }, { lineWidth: 0, version: '1.2' }));
  write(statuslineFile, YAML.stringify({ format: 1, layout: 'wrap' }, {
    lineWidth: 0, version: '1.2',
  }));
  const beforeConfig = fs.readFileSync(configFile, 'utf8');
  const beforeStatusline = fs.readFileSync(statuslineFile, 'utf8');

  const result = migrate(f);
  assert.ok(result.blocked.some(problem => problem.includes('Statusline-Konfiguration widersprechen')));
  assert.strictEqual(fs.readFileSync(configFile, 'utf8'), beforeConfig);
  assert.strictEqual(fs.readFileSync(statuslineFile, 'utf8'), beforeStatusline);
  assert.strictEqual(fs.existsSync(path.join(f.home, '.qatlas', 'state', 'migrations.json')), false);
}

function testInvalidLegacyFile() {
  const f = fixture('invalid');
  write(path.join(f.home, '.callbell', 'settings.json'), '{not json}\n');
  const result = migrate(f);
  assert.ok(result.blocked.some(problem => problem.includes('settings.json')));
  assert.strictEqual(result.applied.length, 0);
}

function testProjectDetection() {
  const legacy = fixture('project-legacy');
  fs.mkdirSync(path.join(legacy.project, '__callbell__'));
  assert.ok(migrate(legacy).blocked.some(problem => problem.includes('__callbell__')));

  const collision = fixture('project-collision');
  fs.mkdirSync(path.join(collision.project, '__qatlas__'));
  fs.mkdirSync(path.join(collision.project, '.qatlas-project'), { recursive: true });
  assert.ok(migrate(collision).blocked.some(problem => problem.includes('Mehrere Qatlas-Projektwurzeln')));

  const current = fixture('project-current');
  fs.mkdirSync(path.join(current.project, '.qatlas-project'), { recursive: true });
  assert.deepStrictEqual(migrate(current).blocked, []);

  const previous = fixture('project-previous');
  fs.mkdirSync(path.join(previous.project, '.qatlas', 'project'), { recursive: true });
  assert.ok(migrate(previous).blocked.some(problem => problem.includes('.qatlas/project')));

  const worktrees = fixture('legacy-worktrees');
  write(path.join(worktrees.home, '.callbell', 'worktrees', 'repo', 'marker'), 'x\n');
  assert.ok(migrate(worktrees).blocked.some(problem => problem.includes('git worktree move')));
}

function testExplicitProjectMigration() {
  const f = fixture('project-migrate');
  const oldRoot = path.join(f.project, '.qatlas', 'project');
  write(path.join(oldRoot, 'README.md'), '# Alter Einstieg\n');
  write(path.join(oldRoot, 'backlog', 'BACKLOG.md'), '# Externes Binding\nKeine lokalen Tasks.\n');
  write(path.join(oldRoot, 'memory', 'MEMORY.md'), '- Erinnerung\n');
  write(path.join(oldRoot, 'memory', 'memory-0042-stabil.md'), 'Inhalt\n');
  write(path.join(oldRoot, 'zone-import', '.gitkeep'), '');
  write(path.join(oldRoot, 'zone-export', '.gitkeep'), '');
  write(path.join(oldRoot, 'updates', 'state.json'), {
    format: 1, plugins: { qatlas: '0.2.1', 'qatlas-web': '0.1.0' },
  });
  write(path.join(f.project, 'AGENTS.md'), 'Lies .qatlas/project/README.md.\n');
  write(path.join(f.project, 'fach-a', 'README.md'), '# Fach A\nUnverändert.\n');
  write(path.join(f.project, 'fach-b', 'README.md'), '# Fach B\nUnverändert.\n');
  const binaryFile = path.join(f.project, 'asset.bin');
  const binary = Buffer.concat([
    Buffer.from([0xff, 0xfe]), Buffer.from('.qatlas/project'), Buffer.from([0x80]),
  ]);
  fs.writeFileSync(binaryFile, binary);
  const zoneFramework = path.join(oldRoot, 'zone-import', 'processed', '2026-09', 'FRAMEWORK.md');
  const zoneIndex = path.join(oldRoot, 'zone-export', 'INDEX.md');
  write(zoneFramework, 'Rohartefakt mit .qatlas/project\n');
  write(zoneIndex, 'Exportartefakt mit .qatlas/project\n');
  const nestedReference = path.join(f.project, 'embedded', 'reference.md');
  write(path.join(f.project, 'embedded', '.git'), 'gitdir: /tmp/nowhere\n');
  write(nestedReference, 'Lies .qatlas/project/README.md.\n');
  const nestedRepoReference = path.join(f.project, 'embedded-repo', 'reference.md');
  write(path.join(f.project, 'embedded-repo', '.git', 'config'), '[core]\n\tbare = false\n');
  write(nestedRepoReference, 'Lies .qatlas/project/README.md.\n');

  const inventory = migrateProject({ projectRoot: f.project });
  assert.strictEqual(inventory.applied, false);
  assert.strictEqual(inventory.inventory.source, '.qatlas/project');
  assert.deepStrictEqual(inventory.inventory.references.map(item => item.relative), ['AGENTS.md']);
  assert.ok(!inventory.inventory.references.some(item => item.relative === 'asset.bin'));
  assert.ok(!inventory.inventory.references.some(item => item.relative.includes('zone-import')));
  assert.ok(!inventory.inventory.references.some(item => item.relative.includes('zone-export')));
  assert.ok(!inventory.inventory.references.some(item => item.relative.includes('embedded')));
  assert.ok(fs.existsSync(oldRoot), 'Inventar verändert nichts.');

  const result = migrateProject({ projectRoot: f.project, apply: true });
  assert.strictEqual(result.applied, true);
  const newRoot = path.join(f.project, '.qatlas-project');
  assert.ok(fs.existsSync(path.join(newRoot, 'memory', 'memory-0042-stabil.md')));
  assert.ok(fs.readFileSync(path.join(f.project, 'AGENTS.md'), 'utf8').includes('.qatlas-project/README.md'));
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(
    path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), 'utf8')).plugins,
  { qatlas: '0.2.1', 'qatlas-web': '0.1.0' });
  assert.strictEqual(fs.existsSync(path.join(newRoot, 'updates', 'state.json')), false);
  assert.strictEqual(fs.existsSync(oldRoot), false);
  assert.strictEqual(fs.readFileSync(path.join(f.project, 'fach-a', 'README.md'), 'utf8'),
    '# Fach A\nUnverändert.\n');
  assert.strictEqual(fs.readFileSync(path.join(f.project, 'fach-b', 'README.md'), 'utf8'),
    '# Fach B\nUnverändert.\n');
  assert.ok(fs.readFileSync(binaryFile).equals(binary), 'Binärdateien bleiben bytegenau erhalten.');
  assert.strictEqual(fs.readFileSync(
    path.join(newRoot, 'zone-import', 'processed', '2026-09', 'FRAMEWORK.md'), 'utf8'),
  'Rohartefakt mit .qatlas/project\n');
  assert.strictEqual(fs.readFileSync(path.join(newRoot, 'zone-export', 'INDEX.md'), 'utf8'),
    'Exportartefakt mit .qatlas/project\n');
  assert.strictEqual(fs.readFileSync(nestedReference, 'utf8'), 'Lies .qatlas/project/README.md.\n');
  assert.strictEqual(fs.readFileSync(nestedRepoReference, 'utf8'), 'Lies .qatlas/project/README.md.\n');
  assert.strictEqual(projectMigrationInventory(f.project).unresolved, false);
  assert.strictEqual(migrateProject({ projectRoot: f.project, apply: true }).applied, false);
}

function testProjectMigrationConflictsAndRecovery() {
  const both = fixture('project-both');
  write(path.join(both.project, '.qatlas', 'project', 'README.md'), 'alt\n');
  write(path.join(both.project, '.qatlas-project', 'README.md'), 'neu\n');
  const targetZoneFramework = path.join(both.project, '.qatlas-project', 'zone-import', 'FRAMEWORK.md');
  const targetZoneIndex = path.join(both.project, '.qatlas-project', 'zone-export', 'INDEX.md');
  const targetZoneId = path.join(both.project, '.qatlas-project', 'zone-import', 'decision-0004-roh.md');
  write(targetZoneFramework, 'Roh mit .qatlas/project\n');
  write(targetZoneIndex, 'Roh mit .qatlas/project\n');
  write(targetZoneId, 'Roh mit .qatlas/project\n');
  write(path.join(both.project, '.qatlas', 'project', 'decisions', 'decision-0004-normal.md'), 'normal\n');
  const before = fs.readFileSync(path.join(both.project, '.qatlas', 'project', 'README.md'), 'utf8');
  const blocked = migrateProject({ projectRoot: both.project, apply: true });
  assert.ok(blocked.blocked.some(problem => problem.includes('Mehrere Qatlas-Projektwurzeln')));
  assert.ok(!blocked.blocked.some(problem => problem.includes('FRAMEWORK-/INDEX')));
  assert.ok(!blocked.blocked.some(problem => problem.includes('Doppelte Projektwissens-ID')));
  assert.ok(!blocked.inventory.references.some(reference => reference.relative.includes('zone-import')));
  assert.ok(!blocked.inventory.references.some(reference => reference.relative.includes('zone-export')));
  assert.strictEqual(fs.readFileSync(path.join(both.project, '.qatlas', 'project', 'README.md'), 'utf8'), before);
  assert.strictEqual(fs.readFileSync(targetZoneFramework, 'utf8'), 'Roh mit .qatlas/project\n');
  assert.strictEqual(fs.readFileSync(targetZoneIndex, 'utf8'), 'Roh mit .qatlas/project\n');
  assert.strictEqual(fs.readFileSync(targetZoneId, 'utf8'), 'Roh mit .qatlas/project\n');

  const stateConflict = fixture('project-state-conflict');
  write(path.join(stateConflict.project, '__qatlas__', 'updates', 'state.json'), {
    format: 1, plugins: { qatlas: '0.2.0' },
  });
  write(path.join(stateConflict.project, '.qatlas', 'plugins', 'updates', 'state.json'), {
    format: 1, plugins: { qatlas: '0.2.1' },
  });
  const conflict = migrateProject({ projectRoot: stateConflict.project, apply: true });
  assert.ok(conflict.blocked.some(problem => problem.includes('widersprechen')));
  assert.ok(fs.existsSync(path.join(stateConflict.project, '__qatlas__')));

  const functions = fixture('project-functions');
  write(path.join(functions.project, '__callbell__', 'docs', 'FRAMEWORK.md'), '# Rahmen\n');
  const functionConflict = migrateProject({ projectRoot: functions.project, apply: true });
  assert.ok(functionConflict.blocked.some(problem => problem.includes('inhaltlich zugeordnet')));
  assert.ok(fs.existsSync(path.join(functions.project, '__callbell__', 'docs', 'FRAMEWORK.md')));

  const duplicateIds = fixture('project-id-conflict');
  write(path.join(duplicateIds.project, '__qatlas__', 'decisions', 'decision-0004-a.md'), 'a\n');
  write(path.join(duplicateIds.project, '__qatlas__', 'marketplace', 'decision-0004-b.md'), 'b\n');
  const duplicateResult = migrateProject({ projectRoot: duplicateIds.project, apply: true });
  assert.ok(duplicateResult.blocked.some(problem => problem.includes('Doppelte Projektwissens-ID decision-0004')));
  assert.ok(fs.existsSync(path.join(duplicateIds.project, '__qatlas__', 'decisions', 'decision-0004-a.md')));

  const validIds = fixture('project-id-valid');
  write(path.join(validIds.project, '__callbell__', 'backlog', 'BACKLOG.md'),
    '# Lokaler Backlog\n- task-0001-offen.md\n');
  write(path.join(validIds.project, '__callbell__', 'decisions', 'decision-0004-a.md'), 'a\n');
  write(path.join(validIds.project, '__callbell__', 'architecture', 'adr-0004-b.md'), 'b\n');
  write(path.join(validIds.project, '__callbell__', 'marketplace', 'decision-0005-c.md'), 'c\n');
  write(path.join(validIds.project, '__callbell__', 'legacy', 'decision-a1b2c3-alt.md'), 'historisch\n');
  write(path.join(validIds.project, '__callbell__', 'zone-import', 'decision-0004-raw.md'), 'roh\n');
  write(path.join(validIds.project, 'fachlich', 'decision-0004-ausserhalb.md'), 'fachlich\n');
  const validResult = migrateProject({ projectRoot: validIds.project, apply: true });
  assert.strictEqual(validResult.applied, true);
  assert.ok(fs.existsSync(path.join(validIds.project, '.qatlas-project', 'zone-import', 'decision-0004-raw.md')));
  assert.ok(fs.readFileSync(path.join(validIds.project, '.qatlas-project', 'backlog', 'BACKLOG.md'), 'utf8')
    .includes('task-0001-offen.md'));

  const partial = fixture('project-partial');
  write(path.join(partial.project, '.qatlas-project', 'updates', 'state.json'), {
    format: 1, plugins: { qatlas: '0.2.1' },
  });
  const resumed = migrateProject({ projectRoot: partial.project, apply: true });
  assert.strictEqual(resumed.applied, true);
  assert.strictEqual(projectMigrationInventory(partial.project).unresolved, false);
  assert.ok(fs.existsSync(path.join(partial.project, '.qatlas', 'plugins', 'updates', 'state.json')));
}

function hookOutput(f, block, codex = false) {
  const script = path.join(pluginRoot, 'hooks', 'qatlas-context.js');
  const env = codex ? { PLUGIN_ROOT: pluginRoot, CLAUDE_PLUGIN_ROOT: '' } : {};
  const result = runNode(script, [block], { cwd: f.project, home: f.home, env });
  assert.strictEqual(result.status, 0, result.stderr);
  return codex ? JSON.parse(result.stdout).hookSpecificOutput.additionalContext : result.stdout;
}

function testProjectContext() {
  const f = fixture('context');
  write(path.join(f.project, '.qatlas-project', 'README.md'), '---\ntype: meta\nedit: shared\n---\n# Einstieg\nFachquelle: fach/README.md\n');
  write(path.join(f.project, '.qatlas-project', 'memory', 'MEMORY.md'), '# Memory\n');
  write(path.join(f.project, '.qatlas-project', 'backlog', 'BACKLOG.md'), '# Backlog\n');
  assert.strictEqual(hookOutput(f, 'project-root'), hookOutput(f, 'project-root', true));
  assert.ok(hookOutput(f, 'project-root').includes('Fachquelle: fach/README.md'));
  assert.ok(hookOutput(f, 'memory').includes('# Memory'));
  assert.ok(hookOutput(f, 'project-backlog').includes('# Backlog'));

  const missing = fixture('context-missing');
  fs.mkdirSync(path.join(missing.project, '.qatlas-project'));
  assert.ok(hookOutput(missing, 'project-root').includes('EINSTIEG FEHLT'));

  const unreadable = fixture('context-unreadable');
  fs.mkdirSync(path.join(unreadable.project, '.qatlas-project', 'README.md'), { recursive: true });
  assert.ok(hookOutput(unreadable, 'project-root').includes('EINSTIEG IST NICHT LESBAR'));

  const long = fixture('context-long');
  write(path.join(long.project, '.qatlas-project', 'README.md'),
    Array.from({ length: 82 }, (_, index) => 'Zeile ' + index).join('\n') + '\nENDE-DER-DATEI\n');
  const longOutput = hookOutput(long, 'project-root');
  assert.ok(longOutput.includes('README-BUDGET ÜBERSCHRITTEN'));
  assert.ok(longOutput.includes('ENDE-DER-DATEI'));

  const exact = fixture('context-exact-budget');
  write(path.join(exact.project, '.qatlas-project', 'README.md'),
    Array.from({ length: 80 }, (_, index) => 'Zeile ' + index).join('\n') + '\n');
  assert.ok(!hookOutput(exact, 'project-root').includes('README-BUDGET ÜBERSCHRITTEN'));

  const disabled = fixture('context-disabled');
  write(path.join(disabled.project, '.qatlas-project', 'README.md'), '# Unsichtbar\n');
  write(path.join(disabled.home, '.qatlas', 'plugins', 'config.yaml'),
    'format: 1\nsession-start:\n  enabled: false\n  ruleset: true\n');
  assert.strictEqual(hookOutput(disabled, 'project-root'), '');
  const disabledNotice = runNode(path.join(pluginRoot, 'scripts', 'qatlas-update.js'),
    ['notice', '--target', disabled.project], { cwd: disabled.project, home: disabled.home });
  assert.strictEqual(disabledNotice.stdout, '');
}

function testDoctorSetupAndUpdateState() {
  const f = fixture('doctor');
  initProject(f);
  write(path.join(f.project, '.gitignore'), '# fremd\n/custom/\n');
  const doctor = path.join(pluginRoot, 'scripts', 'qatlas-doctor.js');
  const first = runNode(doctor, ['--apply', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(first.status, 0, first.stderr);
  assert.ok(fs.existsSync(path.join(f.project, '.qatlas-project', 'README.md')));
  assert.ok(fs.existsSync(path.join(f.project, '.qatlas-project', 'zone-import', '.gitkeep')));
  assert.ok(fs.existsSync(path.join(f.project, '.qatlas-project', 'zone-export', '.gitkeep')));
  assert.ok(fs.existsSync(path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json')));
  assert.strictEqual(fs.existsSync(path.join(f.project, '.qatlas-project', 'updates')), false);
  const ignore = fs.readFileSync(path.join(f.project, '.gitignore'), 'utf8');
  assert.ok(ignore.includes('/custom/'));
  assert.ok(ignore.includes('/.qatlas-project/zone-import/*'));

  const backlog = path.join(f.project, '.qatlas-project', 'backlog', 'BACKLOG.md');
  write(backlog, '# Extern\nhttps://example.invalid/project\nKeine lokalen Tasks.\n');
  const second = runNode(doctor, ['--apply', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(second.status, 0, second.stderr);
  assert.ok(!second.stdout.includes('ANGELEGT'));
  assert.ok(fs.readFileSync(backlog, 'utf8').includes('https://example.invalid/project'));
  assert.deepStrictEqual(fs.readdirSync(path.dirname(backlog)).sort(), ['BACKLOG.md', 'IDEAS.md']);

  fs.rmSync(path.join(f.project, '.qatlas-project', 'memory'), { recursive: true });
  const third = runNode(doctor, ['--apply', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(third.status, 0, third.stderr);
  assert.strictEqual(fs.existsSync(path.join(f.project, '.qatlas-project', 'memory')), false,
    'Ein bewusst entfernter Funktionsordner wird nicht neu erzeugt.');
}

function testWritingConsumersRespectMigration() {
  const f = fixture('consumer-block');
  initProject(f);
  write(path.join(f.project, '.qatlas', 'project', 'README.md'), '# Alt\n');
  write(path.join(f.project, '.gitignore'), '# unverändert\n');
  const doctor = runNode(path.join(pluginRoot, 'scripts', 'qatlas-doctor.js'),
    ['--apply', '--target', f.project], { cwd: f.project, home: f.home });
  assert.ok(doctor.stdout.includes('Wegen der offenen Projektmigration wurde nichts verändert'));
  assert.strictEqual(fs.readFileSync(path.join(f.project, '.gitignore'), 'utf8'), '# unverändert\n');
  assert.strictEqual(fs.existsSync(path.join(f.project, 'AGENTS.md')), false);

  const update = path.join(pluginRoot, 'scripts', 'qatlas-update.js');
  const ack = runNode(update, ['ack', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(ack.status, 1);
  assert.ok(ack.stderr.includes('Projektmigration offen'));
  assert.strictEqual(fs.existsSync(path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json')), false);
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
  const update = path.join(pluginRoot, 'scripts', 'qatlas-update.js');
  const notice = runNode(update, ['notice', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(notice.status, 0, notice.stderr);
  assert.ok(notice.stdout.includes('0.2.0.md'));
  assert.ok(notice.stdout.includes('0.2.1.md'));
  const status = runNode(update, ['status', '--target', f.project], { cwd: f.project, home: f.home });
  assert.ok(status.stdout.includes('2 relevante Update-Anweisung(en)'));
  const ack = runNode(update, ['ack', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(ack.status, 0, ack.stderr);
  const currentVersion = fs.readFileSync(path.join(pluginRoot, 'VERSION'), 'utf8').trim();
  const state = JSON.parse(fs.readFileSync(
    path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), 'utf8'));
  assert.strictEqual(state.plugins.qatlas, currentVersion);
  const after = runNode(update, ['status', '--target', f.project], { cwd: f.project, home: f.home });
  assert.ok(after.stdout.includes('0 relevante Update-Anweisung(en)'));

  write(path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), '{defekt}\n');
  const invalid = runNode(update, ['ack', '--target', f.project], { cwd: f.project, home: f.home });
  assert.strictEqual(invalid.status, 1);
  assert.ok(invalid.stderr.includes('Prüfstand bleibt unverändert'));
  assert.strictEqual(fs.readFileSync(
    path.join(f.project, '.qatlas', 'plugins', 'updates', 'state.json'), 'utf8'), '{defekt}\n');
}

try {
  testCallbellHomeMigration();
  testExistingDefaultAndDiagnostics();
  testStatuslineCommandWithoutLegacyConfig();
  testLegacyStatuslineReplacesCombinedDefault();
  testConflictingLegacyFiles();
  testConflictingStatuslineTargets();
  testInvalidLegacyFile();
  testProjectDetection();
  testExplicitProjectMigration();
  testProjectMigrationConflictsAndRecovery();
  testProjectContext();
  testDoctorSetupAndUpdateState();
  testWritingConsumersRespectMigration();
  testSkippedUpdateVersions();
  testUpdateCommandsAcrossVersions();
  process.stdout.write('✓ Qatlas-Migrationen: 15 Szenarien erfolgreich.\n');
} finally {
  for (const directory of temporary) fs.rmSync(directory, { recursive: true, force: true });
}
