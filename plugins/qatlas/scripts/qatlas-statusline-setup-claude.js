#!/usr/bin/env node
'use strict';

// Richtet Claudes Statusline idempotent ein und schützt die nutzerverwaltete YAML-Konfiguration.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { createConfig, readConfig } = require('./runtime/config-loader.js');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.env.PLUGIN_ROOT
  || path.resolve(__dirname, '..');
const home = os.homedir();
const pluginHome = path.join(home, '.qatlas', 'plugins');
const rendererDst = path.join(pluginHome, 'statusline.js');
const settingsFile = path.join(home, '.claude', 'settings.json');
const runtimeSource = path.join(pluginRoot, 'scripts', 'runtime');
const runtimeTarget = path.join(pluginHome, 'runtime');
const done = [];

function copyRuntime(relative) {
  const target = path.join(runtimeTarget, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(runtimeSource, relative), target);
}

let configState = readConfig();
if (!configState.exists) {
  createConfig();
  configState = readConfig();
  done.push('Standardkonfiguration geschrieben nach ' + configState.configFile);
}
if (!configState.valid) {
  console.error('Einrichtung gestoppt: ' + configState.diagnostics.join('; '));
  process.exit(1);
}
done.push('Konfiguration unverändert unter ' + configState.configFile);

const cmdPath = rendererDst.replace(/\\/g, '/');
let settings = {};
if (fs.existsSync(settingsFile)) {
  try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')); }
  catch {
    console.error('Einrichtung gestoppt: ' + settingsFile + ' ist kein gültiges JSON.');
    process.exit(1);
  }
}

fs.mkdirSync(pluginHome, { recursive: true });
fs.copyFileSync(path.join(pluginRoot, 'scripts', 'qatlas-statusline-render-claude.js'), rendererDst);
for (const relative of [
  'config-loader.js',
  'vendor/yaml-2.9.0.js',
  'vendor/yaml-license.txt',
]) copyRuntime(relative);
done.push('Renderer und YAML-Runtime aktualisiert unter ' + pluginHome);

settings.statusLine = { type: 'command', command: `node "${cmdPath}"`, refreshInterval: 60 };
fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
done.push('statusLine und refreshInterval:60 gesetzt in ' + settingsFile);

console.log('qatlas-Statusline eingerichtet:\n- ' + done.join('\n- '));
