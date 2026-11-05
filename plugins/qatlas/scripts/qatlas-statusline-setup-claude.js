#!/usr/bin/env node
'use strict';

// Sets up the Claude statusline idempotently and protects the user-managed YAML config. The renderer runs
// from a copy under ~/.qatlas/plugins/ because the plugin path changes with every version.

const fs = require('fs');
const os = require('os');
const path = require('path');

const home = os.homedir();
const pluginHome = path.join(home, '.qatlas', 'plugins');
const rendererDst = path.join(pluginHome, 'statusline.js');
const runtimeTarget = path.join(pluginHome, 'runtime');
const versionFile = path.join(runtimeTarget, 'VERSION');
const RUNTIME_FILES = ['config-loader.js', 'vendor/yaml-2.9.0.js', 'vendor/yaml-license.txt'];

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

function copyRenderer(pluginRoot) {
  const runtimeSource = path.join(pluginRoot, 'scripts', 'runtime');
  fs.mkdirSync(pluginHome, { recursive: true });
  for (const relative of RUNTIME_FILES) {
    const target = path.join(runtimeTarget, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(runtimeSource, relative), target);
  }
  fs.copyFileSync(path.join(pluginRoot, 'scripts', 'qatlas-statusline-render-claude.js'), rendererDst);
  fs.writeFileSync(versionFile, read(path.join(pluginRoot, 'VERSION')).trim() + '\n');
}

// Session start: renew an existing copy only from a newer plugin version, so older cached versions never
// downgrade it.
function refreshStatusline(pluginRoot) {
  if (!fs.existsSync(rendererDst)) return false;
  if (!newer(read(path.join(pluginRoot, 'VERSION')), read(versionFile))) return false;
  copyRenderer(pluginRoot);
  return true;
}

function setup() {
  const {
    createConfig,
    createStatusline,
    readConfig,
    readStatusline,
  } = require('./runtime/config-loader.js');
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.env.PLUGIN_ROOT
    || path.resolve(__dirname, '..');
  const settingsFile = path.join(home, '.claude', 'settings.json');
  const done = [];

  let configState = readConfig();
  if (!configState.exists) {
    createConfig();
    configState = readConfig();
    done.push('default configuration written to ' + configState.configFile);
  }
  if (!configState.valid) {
    console.error('Setup stopped: ' + configState.problems.join('; '));
    process.exit(1);
  }

  let statuslineState = readStatusline();
  if (!statuslineState.exists) {
    createStatusline();
    statuslineState = readStatusline();
    done.push('default status line written to ' + statuslineState.statuslineFile);
  }
  if (!statuslineState.valid) {
    console.error('Setup stopped: ' + statuslineState.statuslineFile + ': ' + statuslineState.error.message);
    process.exit(1);
  }
  done.push('status line configuration unchanged at ' + statuslineState.statuslineFile);

  let settings = {};
  if (fs.existsSync(settingsFile)) {
    try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')); }
    catch {
      console.error('Setup stopped: ' + settingsFile + ' is not valid JSON.');
      process.exit(1);
    }
  }

  copyRenderer(pluginRoot);
  done.push('renderer and YAML runtime updated at ' + pluginHome);

  settings.statusLine = { type: 'command', command: `node "${rendererDst.replace(/\\/g, '/')}"`, refreshInterval: 60 };
  fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
  done.push('statusLine with refreshInterval 60 set in ' + settingsFile);

  console.log('Qatlas status line set up:\n- ' + done.join('\n- '));
}

if (require.main === module) setup();

module.exports = { refreshStatusline };
