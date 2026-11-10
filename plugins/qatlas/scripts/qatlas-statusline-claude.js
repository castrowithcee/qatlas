#!/usr/bin/env node
'use strict';

// Sets up or removes the Claude statusline. The renderer runs from a copy under ~/.qatlas/plugins/ because
// the plugin path changes with every version. The user's config.json is read, never written.
// Usage: node qatlas-statusline-claude.js setup|remove

const fs = require('fs');
const os = require('os');
const path = require('path');

const home = os.homedir();
const pluginHome = path.join(home, '.qatlas', 'plugins');
const rendererDst = path.join(pluginHome, 'statusline.js');
const runtimeTarget = path.join(pluginHome, 'runtime');
const versionFile = path.join(runtimeTarget, 'VERSION');
const previousFile = path.join(home, '.qatlas', 'state', 'statusline', 'claude-previous.json');
const settingsFile = path.join(home, '.claude', 'settings.json');
const RUNTIME_FILES = ['config-loader.js'];

function semver(value) {
  const match = String(value || '').trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  return match ? match.slice(1).map(Number) : null;
}

function newer(left, right) {
  const a = semver(left);
  const b = semver(right);
  if (!a) return false;
  if (!b) return true;
  for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index] > b[index];
  return false;
}

function read(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

// The Claude manifest carries the plugin version.
function pluginVersion(pluginRoot) {
  try { return JSON.parse(read(path.join(pluginRoot, '.claude-plugin', 'plugin.json'))).version || ''; }
  catch { return ''; }
}

function fail(message) {
  console.error('Qatlas status line stopped: ' + message);
  process.exit(1);
}

function copyRenderer(pluginRoot) {
  const runtimeSource = path.join(pluginRoot, 'scripts', 'runtime');
  fs.mkdirSync(pluginHome, { recursive: true });
  for (const relative of RUNTIME_FILES) {
    const target = path.join(runtimeTarget, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(runtimeSource, relative), target);
  }
  fs.copyFileSync(path.join(pluginRoot, 'scripts', 'qatlas-statusline-render-claude.js'), rendererDst);
  fs.writeFileSync(versionFile, pluginVersion(pluginRoot) + '\n');
}

// Session start: renew an existing copy only from a newer plugin version, so older cached versions never
// downgrade it.
function refreshStatusline(pluginRoot) {
  if (!fs.existsSync(rendererDst)) return false;
  if (!newer(pluginVersion(pluginRoot), read(versionFile))) return false;
  copyRenderer(pluginRoot);
  return true;
}

function readSettings() {
  if (!fs.existsSync(settingsFile)) return {};
  try { return JSON.parse(fs.readFileSync(settingsFile, 'utf8')); }
  catch { return fail(settingsFile + ' is not valid JSON.'); }
}

function writeSettings(settings) {
  fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
}

const rendererCommand = `node "${rendererDst.replace(/\\/g, '/')}"`;

function isQatlasEntry(entry) {
  return Boolean(entry) && typeof entry === 'object' && typeof entry.command === 'string'
    && entry.command.includes(rendererDst.replace(/\\/g, '/'));
}

function setup() {
  const { readStatusline } = require('./runtime/config-loader.js');
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.env.PLUGIN_ROOT
    || path.resolve(__dirname, '..');
  const done = [];

  const statuslineState = readStatusline();
  if (statuslineState.error) fail(statuslineState.configFile + ': ' + statuslineState.error);
  done.push(statuslineState.exists
    ? 'your statusline block in ' + statuslineState.configFile + ' stays unchanged'
    : 'no statusline block in ' + statuslineState.configFile + ': the shipped defaults apply');

  const settings = readSettings();
  // Keep the entry the user had before so that remove can put it back.
  if (settings.statusLine && !isQatlasEntry(settings.statusLine) && !fs.existsSync(previousFile)) {
    fs.mkdirSync(path.dirname(previousFile), { recursive: true });
    fs.writeFileSync(previousFile, JSON.stringify(settings.statusLine, null, 2) + '\n');
    done.push('previous statusLine saved to ' + previousFile);
  }

  copyRenderer(pluginRoot);
  done.push('renderer and config loader updated at ' + pluginHome);

  settings.statusLine = { type: 'command', command: rendererCommand, refreshInterval: 60 };
  writeSettings(settings);
  done.push('statusLine with refreshInterval 60 set in ' + settingsFile);

  console.log('Qatlas status line set up:\n- ' + done.join('\n- '));
}

function remove() {
  const { readStatusline } = require('./runtime/config-loader.js');
  const done = [];
  const settings = readSettings();

  if (isQatlasEntry(settings.statusLine)) {
    let previous = null;
    try { previous = fs.existsSync(previousFile) ? JSON.parse(fs.readFileSync(previousFile, 'utf8')) : null; }
    catch { previous = null; }
    if (previous && typeof previous === 'object') {
      settings.statusLine = previous;
      done.push('previous statusLine restored in ' + settingsFile);
    } else {
      delete settings.statusLine;
      done.push('statusLine removed from ' + settingsFile);
    }
    writeSettings(settings);
  } else if (settings.statusLine) {
    done.push('statusLine in ' + settingsFile + ' is not the Qatlas renderer and stays unchanged');
  } else {
    done.push('no statusLine in ' + settingsFile);
  }

  fs.rmSync(rendererDst, { force: true });
  fs.rmSync(runtimeTarget, { recursive: true, force: true });
  fs.rmSync(previousFile, { force: true });
  done.push('renderer and config loader removed from ' + pluginHome);

  const statuslineState = readStatusline();
  if (statuslineState.exists) done.push('your statusline block in ' + statuslineState.configFile + ' stays yours');

  console.log('Qatlas status line removed:\n- ' + done.join('\n- '));
}

if (require.main === module) {
  const command = process.argv[2];
  if (command === 'setup') setup();
  else if (command === 'remove') remove();
  else fail('usage: qatlas-statusline-claude.js setup|remove');
}

module.exports = { refreshStatusline };
