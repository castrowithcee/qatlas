#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const YAML = require('../plugins/qatlas/scripts/runtime/vendor/yaml-2.9.0.js');
const {
  DEFAULT_CONFIG,
  DEFAULT_STATUSLINE,
} = require('../plugins/qatlas/scripts/runtime/config-loader.js');
const { runMigrations } = require('../plugins/qatlas/scripts/qatlas-migrations.js');
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
  fs.mkdirSync(path.join(collision.project, '.qatlas', 'project'), { recursive: true });
  assert.ok(migrate(collision).blocked.some(problem => problem.includes('Mehrere Qatlas-Scaffolds')));

  const current = fixture('project-current');
  fs.mkdirSync(path.join(current.project, '.qatlas', 'project'), { recursive: true });
  assert.deepStrictEqual(migrate(current).blocked, []);

  const worktrees = fixture('legacy-worktrees');
  write(path.join(worktrees.home, '.callbell', 'worktrees', 'repo', 'marker'), 'x\n');
  assert.ok(migrate(worktrees).blocked.some(problem => problem.includes('git worktree move')));
}

function testSkippedUpdateVersions() {
  const f = fixture('versions');
  const fakePlugin = path.join(f.root, 'plugin');
  fs.mkdirSync(path.join(fakePlugin, '.claude-plugin'), { recursive: true });
  fs.mkdirSync(path.join(fakePlugin, 'updates'), { recursive: true });
  fs.mkdirSync(path.join(f.project, '__callbell__'), { recursive: true });
  write(path.join(fakePlugin, '.claude-plugin', 'plugin.json'), { name: 'qatlas' });
  write(path.join(fakePlugin, 'VERSION'), '0.10.0\n');
  write(path.join(fakePlugin, 'updates', '0.4.0.md'), '# 0.4.0\n');
  write(path.join(fakePlugin, 'updates', '0.7.2.md'), '# 0.7.2\n');
  write(path.join(f.project, '__callbell__', 'updates', 'state.json'), {
    format: 1, plugins: { qatlas: '0.2.0' },
  });

  const result = pendingUpdates(f.project, { name: 'qatlas', version: '0.10.0' }, fakePlugin);
  assert.strictEqual(result.checked, '0.2.0');
  assert.deepStrictEqual(result.pending.map(file => path.basename(file)), ['0.4.0.md', '0.7.2.md']);
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
  testSkippedUpdateVersions();
  process.stdout.write('✓ Qatlas-Migrationen: 9 Szenarien erfolgreich.\n');
} finally {
  for (const directory of temporary) fs.rmSync(directory, { recursive: true, force: true });
}
