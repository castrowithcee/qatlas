#!/usr/bin/env node
'use strict';

// Repo-bezogene Update-Hinweise eines Plugins erkennen und nach der Nutzerentscheidung bestätigen.

const fs = require('fs');
const path = require('path');

let readConfig = () => ({ config: { 'session-start': { enabled: true } } });
try { ({ readConfig } = require('./runtime/config-loader.js')); }
catch { /* Fehlende Config-Hilfe darf explizite Update-Befehle nicht verhindern. */ }

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
  } catch { /* Ungültiges Plugin erzeugt keinen Update-Hinweis. */ }
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
  return path.join(root, '.qatlas', 'project', 'updates', 'state.json');
}

function hasScaffold(root) {
  try { return fs.statSync(path.join(root, '.qatlas', 'project')).isDirectory(); }
  catch { return false; }
}

function readState(root) {
  try {
    const parsed = JSON.parse(fs.readFileSync(statePath(root), 'utf8'));
    return {
      format: 1,
      plugins: parsed && typeof parsed.plugins === 'object' && parsed.plugins ? parsed.plugins : {},
    };
  } catch {
    return { format: 1, plugins: {} };
  }
}

function pendingUpdates(root, identity) {
  const stored = readState(root).plugins[identity.name];
  const checked = semver(stored) ? stored : '0.0.0';
  let names = [];
  try { names = fs.readdirSync(path.join(pluginRoot, 'updates')); } catch { /* Keine Updates. */ }
  const pending = names
    .filter(name => /^\d+\.\d+\.\d+\.md$/.test(name))
    .map(name => ({ name, version: name.slice(0, -3) }))
    .filter(entry => compare(entry.version, checked) > 0 && compare(entry.version, identity.version) <= 0)
    .sort((left, right) => compare(left.version, right.version))
    .map(entry => path.join(pluginRoot, 'updates', entry.name));
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

const root = resolveRoot();
if (command === 'notice' && !readConfig(root).config['session-start'].enabled) process.exit(0);
const identity = pluginIdentity();
const scaffold = hasScaffold(root);

if (!identity) process.exit(0);

if (command === 'ack') {
  if (!scaffold) {
    process.stderr.write('Kein .qatlas/project/-Scaffold im Zielrepo.\n');
    process.exit(1);
  }
  writeState(root, identity);
  process.stdout.write(`✓ ${identity.name} ${identity.version} für dieses Repo als geprüft gespeichert.\n`);
  process.exit(0);
}

if (!scaffold) process.exit(0);

const { checked, pending } = pendingUpdates(root, identity);

if (command === 'status') {
  process.stdout.write(`${identity.name}: geprüft ${checked}, installiert ${identity.version}, `
    + `${pending.length} relevante Update-Anweisung(en).\n`);
  for (const file of pending) process.stdout.write('- ' + JSON.stringify(file) + '\n');
  process.exit(0);
}

if (command !== 'notice' || !pending.length) process.exit(0);

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
