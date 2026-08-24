'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const YAML = require('./vendor/yaml-2.9.0.js');

const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const WIDGETS = [
  'model', 'thinking', 'dir', 'branch', 'diff', 'out', 'context', 'cost', 'session',
  'session-reset', 'weekly', 'weekly-reset', 'method',
];

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (!isObject(value)) return value;
  const out = {};
  for (const key of Object.keys(value)) if (!BLOCKED_KEYS.has(key)) out[key] = clone(value[key]);
  return out;
}

function merge(base, override) {
  const out = clone(base);
  if (!isObject(override)) return out;
  for (const key of Object.keys(override)) {
    if (BLOCKED_KEYS.has(key)) continue;
    out[key] = isObject(out[key]) && isObject(override[key])
      ? merge(out[key], override[key]) : clone(override[key]);
  }
  return out;
}

function defaultStatusline() {
  const widgets = {};
  for (const name of WIDGETS) widgets[name] = { on: true };
  for (const name of ['model', 'dir', 'branch']) widgets[name].value = { fg: '#f72585' };
  for (const [name, red] of [['context', 70], ['session', 85], ['weekly', 85]]) {
    widgets[name].bar = {
      thresholds: [
        { from: 0, fg: '#24e302' },
        { from: 30, fg: '#f0c808' },
        { from: 40, fg: '#ff6131' },
        { from: red, fg: 'red' },
      ],
    };
  }
  return {
    format: 1,
    layout: 'wrap',
    separator: { text: ' • ', fg: '#aee414', bold: true },
    defaults: { label: { fg: '#7dcaf6' }, value: { fg: '' } },
    widgets,
  };
}

const DEFAULT_CONFIG = {
  format: 1,
  'session-start': { enabled: true, ruleset: true },
  notifications: { telegram: { enabled: false, connection: 'default' } },
};

const DEFAULT_STATUSLINE = defaultStatusline();

const DEFAULT_CREDENTIALS = {
  format: 1,
  connections: { telegram: { default: { token: '', 'chat-id': '' } } },
};

function locations(projectRoot = null) {
  const homeDir = path.join(os.homedir(), '.qatlas', 'plugins');
  return {
    homeDir,
    configFile: path.join(homeDir, 'config.yaml'),
    credentialsFile: path.join(homeDir, 'credentials.yaml'),
    statuslineFile: path.join(homeDir, 'statusline.yaml'),
    rulesetFile: path.join(os.homedir(), '.qatlas', 'rules', 'RULESET.md'),
    projectConfigFile: projectRoot
      ? path.join(path.resolve(projectRoot), '.qatlas', 'plugins', 'config.yaml') : null,
  };
}

function parseFile(file) {
  let source;
  try { source = fs.readFileSync(file, 'utf8').replace(/^﻿/, ''); }
  catch (error) {
    if (error && error.code === 'ENOENT') return { exists: false, valid: true, value: null };
    return { exists: true, valid: false, value: null, error };
  }

  try {
    return { exists: true, valid: true, value: parseYamlText(source) };
  } catch (error) {
    return { exists: true, valid: false, value: null, error };
  }
}

function parseYamlText(source) {
  const document = YAML.parseDocument(String(source).replace(/^﻿/, ''), {
    version: '1.2', schema: 'core', merge: false, resolveKnownTags: false,
    uniqueKeys: true, stringKeys: true, logLevel: 'error',
  });
  if (document.errors.length) throw document.errors[0];
  const value = document.toJS({ maxAliasCount: 0 });
  if (!isObject(value)) throw new Error('Das YAML-Wurzeldokument muss eine Map sein.');
  if (value.format !== 1) throw new Error('Das Feld format muss den Wert 1 haben.');
  return value;
}

function stringifyYaml(value) {
  return YAML.stringify(value, { lineWidth: 0, version: '1.2' });
}

function normalizeConfig(value) {
  const config = merge(DEFAULT_CONFIG, value);
  const session = isObject(config['session-start']) ? config['session-start'] : {};
  config['session-start'] = {
    enabled: session.enabled !== false,
    ruleset: session.ruleset !== false,
  };
  if (!isObject(config.notifications)) config.notifications = clone(DEFAULT_CONFIG.notifications);
  return config;
}

function normalizeStatusline(value) {
  const statusline = merge(DEFAULT_STATUSLINE, value);
  if (isObject(value) && (isObject(value.widgets) || Array.isArray(value.widgets))) {
    statusline.widgets = clone(value.widgets);
  }
  return statusline;
}

function readConfig(projectRoot = null) {
  const paths = locations(projectRoot);
  const home = parseFile(paths.configFile);
  const diagnostics = [];
  if (home.exists && !home.valid) diagnostics.push(paths.configFile + ': ' + home.error.message);
  const config = normalizeConfig(home.valid && home.value ? home.value : DEFAULT_CONFIG);

  let project = { exists: false, valid: true, value: null };
  if (paths.projectConfigFile) {
    project = parseFile(paths.projectConfigFile);
    if (project.exists && !project.valid) {
      diagnostics.push(paths.projectConfigFile + ': ' + project.error.message);
    } else if (project.value) {
      const denied = Object.keys(project.value).filter(key => key !== 'format');
      if (denied.length) diagnostics.push(paths.projectConfigFile
        + ': Projekt-Overrides sind noch nicht freigegeben: ' + denied.join(', '));
    }
  }

  return {
    ...paths,
    exists: home.exists,
    valid: home.valid && project.valid,
    config,
    project,
    diagnostics,
  };
}

function readCredentials() {
  const paths = locations();
  const state = parseFile(paths.credentialsFile);
  return {
    ...paths,
    exists: state.exists,
    valid: state.valid,
    credentials: state.valid && state.value ? state.value : clone(DEFAULT_CREDENTIALS),
    error: state.error,
  };
}

function readStatusline() {
  const paths = locations();
  const state = parseFile(paths.statuslineFile);
  return {
    ...paths,
    exists: state.exists,
    valid: state.valid,
    statusline: normalizeStatusline(state.valid && state.value ? state.value : DEFAULT_STATUSLINE),
    error: state.error,
  };
}

function writeNew(file, value, mode) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stringifyYaml(value), {
    flag: 'wx', mode,
  });
  return file;
}

function createConfig() {
  return writeNew(locations().configFile, DEFAULT_CONFIG, 0o600);
}

function createCredentials() {
  return writeNew(locations().credentialsFile, DEFAULT_CREDENTIALS, 0o600);
}

function createStatusline() {
  return writeNew(locations().statuslineFile, DEFAULT_STATUSLINE, 0o600);
}

function syncManagedRuleset(pluginRoot) {
  const paths = locations();
  const source = path.join(pluginRoot, 'rules', 'RULESET.md');
  const content = fs.readFileSync(source, 'utf8');
  let previous = null;
  try { previous = fs.readFileSync(paths.rulesetFile, 'utf8'); } catch { /* Fehlt. */ }
  if (previous === content) return { file: paths.rulesetFile, changed: false, created: false };

  fs.mkdirSync(path.dirname(paths.rulesetFile), { recursive: true });
  const temporary = paths.rulesetFile + '.tmp-' + process.pid;
  fs.writeFileSync(temporary, content, { mode: 0o600 });
  try {
    fs.renameSync(temporary, paths.rulesetFile);
  } catch {
    fs.copyFileSync(temporary, paths.rulesetFile);
    fs.unlinkSync(temporary);
  }
  try { fs.chmodSync(paths.rulesetFile, 0o600); } catch { /* Keine POSIX-Modusunterstützung. */ }
  return { file: paths.rulesetFile, changed: true, created: previous === null };
}

module.exports = {
  DEFAULT_CONFIG,
  DEFAULT_CREDENTIALS,
  DEFAULT_STATUSLINE,
  createConfig,
  createCredentials,
  createStatusline,
  locations,
  parseYamlText,
  readConfig,
  readCredentials,
  readStatusline,
  stringifyYaml,
  syncManagedRuleset,
};
