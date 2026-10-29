#!/usr/bin/env node
'use strict';

// Detects repo-specific updates of every installed plugin of this marketplace and confirms them after the
// user decides. Packs ship only updates/<version>.md; this script is their only channel.

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { projectMigrationInventory } = require('./qatlas-migrations.js');

let readConfig = () => ({ config: { 'session-start': { enabled: true } } });
try { ({ readConfig } = require('./runtime/config-loader.js')); }
catch { /* missing config helper must not block explicit update commands */ }

const pluginRoot = path.resolve(__dirname, '..');
const isCodex = Boolean(process.env.PLUGIN_ROOT);
const args = process.argv.slice(2);
const command = ['notice', 'status', 'ack'].includes(args[0]) ? args[0] : 'notice';
const flag = name => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};

function resolveRoot() {
  const explicit = flag('--target');
  if (explicit) return path.resolve(explicit);
  if (process.env.CLAUDE_PROJECT_DIR) return path.resolve(process.env.CLAUDE_PROJECT_DIR);
  if (!process.stdin.isTTY) {
    try {
      const raw = fs.readFileSync(0, 'utf8').replace(/^﻿/, '');
      const payload = raw ? JSON.parse(raw) : null;
      if (payload && typeof payload.cwd === 'string' && payload.cwd) return path.resolve(payload.cwd);
    } catch { /* fall back to cwd */ }
  }
  return process.cwd();
}

function semver(value) {
  const match = String(value || '').match(/^(\d+)\.(\d+)\.(\d+)$/);
  return match ? match.slice(1).map(Number) : null;
}

function compare(left, right) {
  const a = semver(left);
  const b = semver(right);
  if (!a || !b) return 0;
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

function realpath(file) {
  try { return fs.realpathSync(file); } catch { return path.resolve(file); }
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function pluginVersion(root) {
  try {
    const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
    return semver(version) ? version : null;
  } catch { return null; }
}

function pluginIdentity() {
  const manifest = readJson(path.join(pluginRoot, '.claude-plugin', 'plugin.json'));
  const version = pluginVersion(pluginRoot);
  return manifest && manifest.name && version ? { name: manifest.name, version } : null;
}

// Claude keeps old versions in its cache, so only installed_plugins.json names the active one.
function claudePlugins(root) {
  const home = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const registry = readJson(path.join(home, 'plugins', 'installed_plugins.json'));
  if (!registry || !registry.plugins || typeof registry.plugins !== 'object') return [];
  const entries = Object.entries(registry.plugins)
    .map(([key, list]) => [key, Array.isArray(list) ? list.filter(e => e && typeof e.installPath === 'string') : []]);
  const self = realpath(pluginRoot);
  const own = entries.find(([, list]) => list.some(e => realpath(e.installPath) === self));
  if (!own || !own[0].includes('@')) return [];
  const market = own[0].slice(own[0].lastIndexOf('@'));

  const enabled = {};
  for (const file of [path.join(home, 'settings.json'), path.join(root, '.claude', 'settings.json'),
    path.join(root, '.claude', 'settings.local.json')]) {
    const settings = readJson(file);
    if (settings && settings.enabledPlugins && typeof settings.enabledPlugins === 'object') {
      Object.assign(enabled, settings.enabledPlugins);
    }
  }

  const project = realpath(root);
  const found = [];
  for (const [key, list] of entries) {
    if (!key.endsWith(market) || enabled[key] === false) continue;
    const entry = list.find(e => e.scope !== 'user' && e.projectPath && realpath(e.projectPath) === project)
      || list.find(e => e.scope === 'user');
    if (entry) found.push({ name: key.slice(0, -market.length), root: entry.installPath });
  }
  return found;
}

function latestVersionDir(directory) {
  let names = [];
  try { names = fs.readdirSync(directory); } catch { return null; }
  const latest = names.filter(name => semver(name) && pluginVersion(path.join(directory, name)))
    .sort(compare).pop();
  return latest ? path.join(directory, latest) : null;
}

function codexPlugins() {
  const home = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const cache = realpath(path.join(home, 'plugins', 'cache'));
  const parts = path.relative(cache, realpath(pluginRoot)).split(path.sep);
  if (parts.length !== 3 || parts[0] === '..') return [];
  const market = parts[0];
  let config = '';
  try { config = fs.readFileSync(path.join(home, 'config.toml'), 'utf8'); } catch { return []; }

  const found = [];
  let current = null;
  for (const line of config.split(/\r?\n/)) {
    const header = line.match(/^\s*\[([^\]]*)\]/);
    if (header) {
      const table = header[1].trim().match(/^plugins\."([^"@]+)@([^"]+)"$/);
      current = table && table[2] === market ? table[1] : null;
      continue;
    }
    const enabled = current && line.match(/^\s*enabled\s*=\s*(true|false)\b/);
    if (enabled && enabled[1] === 'true') {
      const root = latestVersionDir(path.join(cache, market, current));
      if (root) found.push({ name: current, root });
    }
  }
  return found;
}

// Qatlas itself always counts, even when no host registry names it (development checkout).
function installedPlugins(root) {
  const self = pluginIdentity();
  if (!self) return [];
  const others = (isCodex ? codexPlugins() : claudePlugins(root))
    .filter(plugin => plugin.name !== self.name)
    .map(plugin => ({ ...plugin, version: pluginVersion(plugin.root) }))
    .filter(plugin => plugin.version)
    .sort((left, right) => left.name.localeCompare(right.name));
  return [{ ...self, root: pluginRoot }, ...others];
}

function statePath(root) {
  return path.join(root, '.qatlas', 'plugins', 'updates', 'state.json');
}

function hasCurrentScaffold(root) {
  try { return fs.statSync(path.join(root, '.qatlas-project')).isDirectory(); }
  catch { return false; }
}

function hasScaffold(root) {
  if (hasCurrentScaffold(root)) return true;
  return ['__qatlas__', '__callbell__'].some(name => {
    try { return fs.statSync(path.join(root, name)).isDirectory(); }
    catch { return false; }
  });
}

function readState(root) {
  const candidates = [
    statePath(root),
    path.join(root, '.qatlas-project', 'updates', 'state.json'),
    path.join(root, '.qatlas', 'project', 'updates', 'state.json'),
    path.join(root, '__qatlas__', 'updates', 'state.json'),
    path.join(root, '__callbell__', 'updates', 'state.json'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
      || !parsed.plugins || typeof parsed.plugins !== 'object' || Array.isArray(parsed.plugins)) {
      throw new Error(file + ': the review state must be a JSON object with a plugins map.');
    }
    return { ...parsed, format: 1, plugins: parsed.plugins };
  }
  return { format: 1, plugins: {} };
}

function pendingUpdates(root, identity, sourceRoot = pluginRoot) {
  const stored = readState(root).plugins[identity.name];
  const checked = semver(stored) ? stored : '0.0.0';
  let names = [];
  try { names = fs.readdirSync(path.join(sourceRoot, 'updates')); } catch { /* no updates */ }
  const pending = names
    .filter(name => /^\d+\.\d+\.\d+\.md$/.test(name))
    .map(name => ({ name, version: name.slice(0, -3) }))
    .filter(entry => compare(entry.version, checked) > 0 && compare(entry.version, identity.version) <= 0)
    .sort((left, right) => compare(left.version, right.version))
    .map(entry => path.join(sourceRoot, 'updates', entry.name));
  return { checked, pending };
}

// Device-local marker for the status line; it lives outside the repo so no project gets an untracked file.
function markerPath(root) {
  const id = crypto.createHash('sha256').update(realpath(root)).digest('hex').slice(0, 16);
  return path.join(os.homedir(), '.qatlas', 'state', 'update-pending', id);
}

function setMarker(root, plugins) {
  const file = markerPath(root);
  try {
    if (!plugins.length) { fs.rmSync(file, { force: true }); return; }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, plugins.map(p => `${p.name} ${p.checked} -> ${p.version}`).join('\n') + '\n');
  } catch { /* the marker is a convenience and never blocks the session */ }
}

function invocation() {
  return (isCodex ? '$' : '/') + 'qatlas-core update';
}

function banner(plugins) {
  const width = Math.max(0, ...plugins.map(p => p.name.length));
  const lines = plugins.length ? [
    'Qatlas plugins were updated. This repo still needs a project update.',
    '',
    ...plugins.map(p => `  ${p.name.padEnd(width)}  ${p.checked} -> ${p.version}`),
  ] : ['This repo has an old Qatlas project root that needs a migration.'];
  lines.push('', 'Run: ' + invocation());
  const inner = Math.max(...lines.map(line => line.length));
  const rule = '+' + '-'.repeat(inner + 4) + '+';
  return [rule, ...lines.map(line => '|  ' + line.padEnd(inner) + '  |'), rule].join('\n');
}

function emitNotice(plugins) {
  const summary = plugins.length
    ? 'Installed plugins changed since this repo was last checked: '
      + plugins.map(p => `${p.name} ${p.checked} -> ${p.version}`).join(', ') + '.'
    : 'The project root of this repo needs a migration.';
  const line = `> Qatlas project update pending: run ${invocation()}`;
  const context = [
    `QATLAS-UPDATE: ${summary}`,
    `The user already sees a notice to run ${invocation()}. Do not run the update yourself, never during a`
      + ' started mode or run, and do not read the update instructions now.',
    `Begin the reply that ends your first turn in this session with exactly this line, once: ${line}`,
  ].join('\n');
  process.stdout.write(JSON.stringify({
    systemMessage: banner(plugins),
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
  }));
}

function pendingPlugins(root) {
  return installedPlugins(root)
    .map(plugin => ({ ...plugin, ...pendingUpdates(root, plugin, plugin.root) }));
}

function writeState(root, plugins) {
  const target = statePath(root);
  const state = readState(root);
  for (const plugin of plugins) state.plugins[plugin.name] = plugin.version;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = target + '.tmp-' + process.pid;
  fs.writeFileSync(temporary, JSON.stringify(state, null, 2) + '\n', { mode: 0o644 });
  fs.renameSync(temporary, target);
}

function main() {
  const root = resolveRoot();
  if (command === 'notice' && !readConfig(root).config['session-start'].enabled) return;
  if (!pluginIdentity()) return;
  const migration = projectMigrationInventory(root, { detailed: false });

  if (migration.unresolved) {
    if (command === 'status') {
      process.stdout.write('Project migration pending: migrate the project root first; the review state stays '
        + 'unchanged until then.\n');
    } else if (command === 'ack') {
      process.stderr.write('Project migration pending. The review state was not confirmed.\n');
      process.exitCode = 1;
    } else {
      emitNotice([]);
    }
    return;
  }

  if (command === 'ack') {
    if (!hasCurrentScaffold(root)) {
      process.stderr.write('No .qatlas-project/ scaffold in the target repo. Set up Qatlas first.\n');
      process.exitCode = 1;
      return;
    }
    const only = flag('--plugin');
    const plugins = installedPlugins(root).filter(plugin => !only || plugin.name === only);
    if (!plugins.length) {
      process.stderr.write(`Plugin ${only} is not installed. The review state was not changed.\n`);
      process.exitCode = 1;
      return;
    }
    try { writeState(root, plugins); }
    catch (error) {
      process.stderr.write('Review state unchanged: ' + error.message + '\n');
      process.exitCode = 1;
      return;
    }
    try { setMarker(root, pendingPlugins(root).filter(p => p.pending.length)); } catch { /* best effort */ }
    for (const plugin of plugins) {
      process.stdout.write(`✓ ${plugin.name} ${plugin.version} saved as checked for this repo.\n`);
    }
    return;
  }

  if (!hasScaffold(root)) return;

  let plugins;
  try { plugins = pendingPlugins(root); }
  catch (error) {
    process.stderr.write('Review state could not be read: ' + error.message + '\n');
    process.exitCode = 1;
    return;
  }

  if (command === 'status') {
    for (const plugin of plugins) {
      process.stdout.write(`${plugin.name}: checked ${plugin.checked}, installed ${plugin.version}, `
        + `${plugin.pending.length} relevant update instruction(s).\n`);
      for (const file of plugin.pending) process.stdout.write('- ' + JSON.stringify(file) + '\n');
    }
    return;
  }

  const pending = plugins.filter(plugin => plugin.pending.length);
  setMarker(root, pending);
  if (pending.length) emitNotice(pending);
}

if (require.main === module) main();

module.exports = { compare, installedPlugins, pendingUpdates, semver };
