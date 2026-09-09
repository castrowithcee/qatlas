#!/usr/bin/env node
'use strict';

// Erkennt repo-spezifische Plugin-Updates und bestätigt sie nach der Nutzerentscheidung.

const fs = require('fs');
const path = require('path');
const { projectMigrationInventory } = require('./qatlas-migrations.js');

let readConfig = () => ({ config: { 'session-start': { enabled: true } } });
try { ({ readConfig } = require('./runtime/config-loader.js')); }
catch { /* Fehlende Config-Helfer dürfen ausdrückliche Update-Befehle nicht verhindern. */ }

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
    } catch { /* Auf cwd zurückfallen. */ }
  }
  return process.cwd();
}

function pluginIdentity() {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(pluginRoot, '.claude-plugin', 'plugin.json'), 'utf8'));
    const version = fs.readFileSync(path.join(pluginRoot, 'VERSION'), 'utf8').trim();
    if (manifest.name && /^\d+\.\d+\.\d+$/.test(version)) return { name: manifest.name, version };
  } catch { /* Ein ungültiges Plugin erzeugt keinen Update-Hinweis. */ }
  return null;
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
      throw new Error(file + ': Der Prüfstand muss ein JSON-Objekt mit einer plugins-Map sein.');
    }
    return { ...parsed, format: 1, plugins: parsed.plugins };
  }
  return { format: 1, plugins: {} };
}

function pendingUpdates(root, identity, sourceRoot = pluginRoot) {
  const stored = readState(root).plugins[identity.name];
  const checked = semver(stored) ? stored : '0.0.0';
  let names = [];
  try { names = fs.readdirSync(path.join(sourceRoot, 'updates')); } catch { /* Keine Updates. */ }
  const pending = names
    .filter(name => /^\d+\.\d+\.\d+\.md$/.test(name))
    .map(name => ({ name, version: name.slice(0, -3) }))
    .filter(entry => compare(entry.version, checked) > 0 && compare(entry.version, identity.version) <= 0)
    .sort((left, right) => compare(left.version, right.version))
    .map(entry => path.join(sourceRoot, 'updates', entry.name));
  return { checked, pending };
}

function emitNotice(text) {
  if (isCodex) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text },
    }));
  } else {
    process.stdout.write(text + '\n');
  }
}

function writeState(root, identity) {
  const target = statePath(root);
  const state = readState(root);
  state.plugins[identity.name] = identity.version;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = target + '.tmp-' + process.pid;
  fs.writeFileSync(temporary, JSON.stringify(state, null, 2) + '\n', { mode: 0o644 });
  fs.renameSync(temporary, target);
}

function main() {
  const root = resolveRoot();
  if (command === 'notice' && !readConfig(root).config['session-start'].enabled) return;
  const identity = pluginIdentity();
  const migration = projectMigrationInventory(root, { detailed: false });
  const scaffold = hasScaffold(root);

  if (!identity) return;

  if (migration.unresolved) {
    if (command === 'status') {
      process.stdout.write('Projektmigration offen: Prüfstand bleibt bis zur Inventarisierung und '
        + 'ausdrücklichen Migration unverändert.\n');
    } else if (command === 'ack') {
      process.stderr.write('Projektmigration offen. Der Update-Stand wurde nicht bestätigt.\n');
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'ack') {
    if (!hasCurrentScaffold(root)) {
      process.stderr.write('Kein .qatlas-project/-Scaffold im Zielrepo. Richte Qatlas zuerst ein.\n');
      process.exitCode = 1;
      return;
    }
    try { writeState(root, identity); }
    catch (error) {
      process.stderr.write('Prüfstand bleibt unverändert: ' + error.message + '\n');
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`✓ ${identity.name} ${identity.version} für dieses Repo als geprüft gespeichert.\n`);
    return;
  }

  if (!scaffold) return;

  let checked;
  let pending;
  try { ({ checked, pending } = pendingUpdates(root, identity)); }
  catch (error) {
    process.stderr.write('Prüfstand konnte nicht gelesen werden: ' + error.message + '\n');
    process.exitCode = 1;
    return;
  }

  if (command === 'status') {
    process.stdout.write(`${identity.name}: geprüft ${checked}, installiert ${identity.version}, `
      + `${pending.length} relevante Update-Anweisung(en).\n`);
    for (const file of pending) process.stdout.write('- ' + JSON.stringify(file) + '\n');
    return;
  }

  if (command !== 'notice' || !pending.length) return;

  emitNotice([
    `QATLAS-UPDATE: ${identity.name} wurde für dieses Repo zuletzt bis ${checked} geprüft; installiert ist ${identity.version}.`,
    'Lies diese Update-Anweisungen vollständig und prüfe ausschließlich das aktuelle Repo:',
    ...pending.map(file => '- ' + JSON.stringify(file)),
    'Behandle vorhandene Repo-Dateien als primär und überschreibe sie nie pauschal mit Plugin-Vorlagen.',
    'Sind keine Änderungen anwendbar, aktualisiere den Prüfstand ohne Rückfrage.',
    'Andernfalls nenne für jeden anwendbaren Punkt knapp den konkreten Befund im Repo, die vorgeschlagene Änderung und ihre praktische Folge oder ihren Grund. Eine bloße Liste aus Dateinamen, Mengen oder Schlagwörtern reicht nicht; nenne bei Sammelbefunden ein repräsentatives Beispiel.',
    'Frage erst danach, was vollständig, teilweise oder nicht übernommen werden soll.',
    'Halte abgelehnte Änderungen nicht im Repo fest, außer der Nutzer verlangt dies ausdrücklich.',
    'Aktualisiere nach der Prüfung oder Nutzerentscheidung in jedem Fall den Prüfstand, indem du das folgende Script mit den Argumenten ack --target <PROJEKT-ROOT> ausführst:',
    'UPDATE-SCRIPT: ' + JSON.stringify(path.join(pluginRoot, 'scripts', 'qatlas-update.js')),
    'PROJEKT-ROOT: ' + JSON.stringify(root),
  ].join('\n'));
}

if (require.main === module) main();

module.exports = { compare, pendingUpdates, semver };
