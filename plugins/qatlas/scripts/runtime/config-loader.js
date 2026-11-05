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
  protection: { secrets: 'block', 'personal-data': 'ask' },
};

const PROTECTION_LEVELS = {
  secrets: ['block', 'allow'],
  'personal-data': ['block', 'ask', 'warn', 'allow'],
};
const CONFIG_KEYS = new Set(['format', 'protection']);

const DEFAULT_STATUSLINE = defaultStatusline();

function locations(projectRoot = null) {
  const homeDir = path.join(os.homedir(), '.qatlas', 'plugins');
  return {
    homeDir,
    configFile: path.join(homeDir, 'config.yaml'),
    statuslineFile: path.join(homeDir, 'statusline.yaml'),
    projectConfigFile: projectRoot
      ? path.join(path.resolve(projectRoot), '.qatlas', 'plugins', 'config.yaml') : null,
    allowFile: projectRoot
      ? path.join(path.resolve(projectRoot), '.qatlas', 'plugins', 'protection-allow.yaml') : null,
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

function parseYamlText(source, format = 1) {
  const document = YAML.parseDocument(String(source).replace(/^﻿/, ''), {
    version: '1.2', schema: 'core', merge: false, resolveKnownTags: false,
    uniqueKeys: true, stringKeys: true, logLevel: 'error',
  });
  if (document.errors.length) throw document.errors[0];
  const value = document.toJS({ maxAliasCount: 0 });
  if (!isObject(value)) throw new Error('The YAML root document must be a map.');
  if (value.format !== format) throw new Error('The field format must be ' + format + '.');
  return value;
}

const TEAM_PROFILES = ['light', 'standard', 'demanding'];
const TEAM_ROLES = ['supervisor', 'integrator', 'lead'];

// Structure check of team.yaml for the doctor; returns a list of problems.
function teamProblems(value) {
  if (!isObject(value.profiles) || !TEAM_PROFILES.every(name => typeof value.profiles[name] === 'string')) {
    return ['profiles needs the profiles ' + TEAM_PROFILES.join(', ') + ' as text.'];
  }
  if (!isObject(value.hosts) || !Object.keys(value.hosts).length) return ['hosts is missing or empty.'];
  const problems = [];
  for (const [host, entry] of Object.entries(value.hosts)) {
    if (!isObject(entry)) { problems.push('hosts.' + host + ' must be a map.'); continue; }
    for (const role of TEAM_ROLES) {
      if (entry[role] !== null && typeof entry[role] !== 'string') {
        problems.push('hosts.' + host + '.' + role + ' needs a model or null.');
      }
    }
    for (const profile of TEAM_PROFILES) {
      const worker = isObject(entry.worker) ? entry.worker[profile] : undefined;
      if (!isObject(worker) || !('model' in worker) || !('effort' in worker)) {
        problems.push('hosts.' + host + '.worker.' + profile + ' needs model and effort.');
      }
    }
  }
  return problems;
}

function stringifyYaml(value) {
  return YAML.stringify(value, { lineWidth: 0, version: '1.2' });
}

function knownProtection(value) {
  const out = {};
  if (isObject(value)) for (const key of Object.keys(PROTECTION_LEVELS)) if (key in value) out[key] = value[key];
  return out;
}

function normalizeConfig(value) {
  return {
    format: 1,
    protection: { ...DEFAULT_CONFIG.protection, ...knownProtection(isObject(value) && value.protection) },
  };
}

// Invalid values make the protection check impossible; unknown keys are only reported.
function configProblems(value, file) {
  const invalid = [];
  const unknown = Object.keys(value).filter(key => !CONFIG_KEYS.has(key)).map(key => file + ': unknown key ' + key + '.');
  const protection = value.protection;
  if (protection === undefined) return { invalid, unknown };
  if (!isObject(protection)) return { invalid: [file + ': protection must be a map.'], unknown };
  for (const key of Object.keys(protection)) {
    const levels = PROTECTION_LEVELS[key];
    if (!levels) unknown.push(file + ': unknown key protection.' + key + '.');
    else if (!levels.includes(protection[key])) {
      invalid.push(file + ': protection.' + key + ' must be one of ' + levels.join(', ') + '.');
    }
  }
  return { invalid, unknown };
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
  const homeIssues = home.valid && home.value
    ? configProblems(home.value, paths.configFile) : { invalid: [], unknown: [] };
  diagnostics.push(...homeIssues.invalid, ...homeIssues.unknown);
  const config = normalizeConfig(home.valid && !homeIssues.invalid.length ? home.value : null);

  let project = { exists: false, valid: true, value: null };
  let projectIssues = { invalid: [], unknown: [] };
  if (paths.projectConfigFile) {
    project = parseFile(paths.projectConfigFile);
    if (project.exists && !project.valid) {
      diagnostics.push(paths.projectConfigFile + ': ' + project.error.message);
    } else if (project.value) {
      projectIssues = configProblems(project.value, paths.projectConfigFile);
      diagnostics.push(...projectIssues.invalid, ...projectIssues.unknown);
      if (!projectIssues.invalid.length && isObject(project.value.protection)) {
        Object.assign(config.protection, knownProtection(project.value.protection));
      }
    }
  }
  const valid = home.valid && project.valid && !homeIssues.invalid.length && !projectIssues.invalid.length;

  return {
    ...paths,
    exists: home.exists,
    valid,
    protectionValid: valid,
    config,
    project,
    diagnostics,
    problems: diagnostics.filter(line => !homeIssues.unknown.includes(line) && !projectIssues.unknown.includes(line)),
    unknown: [...homeIssues.unknown, ...projectIssues.unknown],
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

module.exports = {
  DEFAULT_CONFIG,
  DEFAULT_STATUSLINE,
  locations,
  parseYamlText,
  readConfig,
  readStatusline,
  stringifyYaml,
  teamProblems,
};
