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
  'session-start': { enabled: true },
  brains: { qatlas: { enabled: true } },
  protection: { enabled: true, secrets: 'block', 'personal-data': 'ask' },
};

const PROTECTION_LEVELS = ['block', 'ask', 'warn', 'allow'];
// Schlüssel, die eine Projektkonfiguration überschreiben darf.
const PROJECT_KEYS = new Set(['format', 'brains', 'protection']);

const DEFAULT_STATUSLINE = defaultStatusline();

function locations(projectRoot = null) {
  const homeDir = path.join(os.homedir(), '.qatlas', 'plugins');
  return {
    homeDir,
    configFile: path.join(homeDir, 'config.yaml'),
    statuslineFile: path.join(homeDir, 'statusline.yaml'),
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
  config['session-start'] = { enabled: session.enabled !== false };
  if (!isObject(config.protection)) config.protection = clone(DEFAULT_CONFIG.protection);
  if (!isObject(config.brains)) config.brains = clone(DEFAULT_CONFIG.brains);
  if (!isObject(config.brains.qatlas)) config.brains.qatlas = clone(DEFAULT_CONFIG.brains.qatlas);
  delete config.brains.project;
  return config;
}

function brainsProblems(brains, file, isProject) {
  if (brains === undefined) return [];
  if (!isObject(brains)) return [file + ': brains muss eine Map sein.'];
  const problems = [];
  for (const key of Object.keys(brains)) {
    const value = brains[key];
    if (key === 'qatlas') {
      if (!isObject(value) || Object.keys(value).some(name => name !== 'enabled')
        || (value.enabled !== undefined && typeof value.enabled !== 'boolean')) {
        problems.push(file + ': brains.qatlas erlaubt nur enabled mit true oder false.');
      }
    } else if (key === 'project') {
      if (!isProject) {
        problems.push(file + ': brains.project gilt ausschließlich in der Projektkonfiguration.');
      } else if (!isObject(value)
        || Object.keys(value).some(name => !['enabled', 'paths', 'description'].includes(name))
        || (value.enabled !== undefined && typeof value.enabled !== 'boolean')
        || (value.paths !== undefined && (!Array.isArray(value.paths)
          || value.paths.some(entry => typeof entry !== 'string' || !entry)))
        || (value.description !== undefined && typeof value.description !== 'string')) {
        problems.push(file + ': brains.project erlaubt enabled, paths als Liste von Pfaden und description.');
      }
    } else {
      problems.push(file + ': unbekannter Schlüssel brains.' + key + '.');
    }
  }
  return problems;
}

function protectionProblems(protection, file) {
  if (protection === undefined) return [];
  if (!isObject(protection)) return [file + ': protection muss eine Map sein.'];
  const problems = [];
  for (const key of Object.keys(protection)) {
    const value = protection[key];
    if (key === 'enabled') {
      if (typeof value !== 'boolean') problems.push(file + ': protection.enabled muss true oder false sein.');
    } else if (key === 'secrets' || key === 'personal-data') {
      if (!PROTECTION_LEVELS.includes(value)) {
        problems.push(file + ': protection.' + key + ' muss ' + PROTECTION_LEVELS.join(', ') + ' sein.');
      }
    } else {
      problems.push(file + ': unbekannter Schlüssel protection.' + key + '.');
    }
  }
  return problems;
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
  const homeProblems = home.valid && home.value
    ? protectionProblems(home.value.protection, paths.configFile) : [];
  const homeBrainsProblems = home.valid && home.value
    ? brainsProblems(home.value.brains, paths.configFile, false) : [];
  diagnostics.push(...homeProblems, ...homeBrainsProblems);

  let projectProblems = [];
  let project = { exists: false, valid: true, value: null };
  if (paths.projectConfigFile) {
    project = parseFile(paths.projectConfigFile);
    if (project.exists && !project.valid) {
      diagnostics.push(paths.projectConfigFile + ': ' + project.error.message);
    } else if (project.value) {
      const denied = Object.keys(project.value).filter(key => !PROJECT_KEYS.has(key));
      if (denied.length) diagnostics.push(paths.projectConfigFile
        + ': Projekt-Overrides sind noch nicht freigegeben: ' + denied.join(', '));
      projectProblems = protectionProblems(project.value.protection, paths.projectConfigFile);
      diagnostics.push(...projectProblems);
      if (!projectProblems.length && isObject(project.value.protection)) {
        config.protection = merge(config.protection, project.value.protection);
      }
      const brainsIssues = brainsProblems(project.value.brains, paths.projectConfigFile, true);
      diagnostics.push(...brainsIssues);
      if (!brainsIssues.length && isObject(project.value.brains)) {
        config.brains = merge(config.brains, project.value.brains);
      }
    }
  }
  const protectionValid = home.valid && project.valid && !homeProblems.length && !projectProblems.length;

  return {
    ...paths,
    exists: home.exists,
    valid: home.valid && project.valid && !homeProblems.length && !homeBrainsProblems.length,
    protectionValid,
    config,
    project,
    diagnostics,
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

// Ergänzt fehlende globale Schlüssel mit ihrem Default, ohne gesetzte Werte oder Kommentare zu ändern.
function topUpConfig() {
  const file = locations().configFile;
  const document = YAML.parseDocument(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  if (document.errors.length || !isObject(document.toJS())) return [];
  const added = [];
  const visit = (value, keys) => {
    if (isObject(value)) {
      for (const key of Object.keys(value)) visit(value[key], keys.concat(key));
    } else if (!document.hasIn(keys)) {
      try {
        document.setIn(keys, value);
        added.push(keys.join('.'));
      } catch { /* Ein vorhandener Nicht-Map-Wert bleibt unangetastet und wird gemeldet. */ }
    }
  };
  visit(DEFAULT_CONFIG, []);
  if (added.length) fs.writeFileSync(file, document.toString({ lineWidth: 0 }), { mode: 0o600 });
  return added;
}

function createConfig() {
  return writeNew(locations().configFile, DEFAULT_CONFIG, 0o600);
}

function createStatusline() {
  return writeNew(locations().statuslineFile, DEFAULT_STATUSLINE, 0o600);
}

module.exports = {
  DEFAULT_CONFIG,
  DEFAULT_STATUSLINE,
  createConfig,
  createStatusline,
  locations,
  parseYamlText,
  readConfig,
  readStatusline,
  stringifyYaml,
  topUpConfig,
};
