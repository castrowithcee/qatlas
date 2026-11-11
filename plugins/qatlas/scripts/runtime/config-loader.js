'use strict';

// Reads ~/.qatlas/plugins/config.json (user) and <repo>/.qatlas/plugins/config.json (project). Both are
// optional; every value has a shipped default and a file holds only what deviates.

const fs = require('fs');
const os = require('os');
const path = require('path');

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

// The only table of statusline defaults; the renderer has none of its own.
function defaultStatusline() {
  const bar = (yellow, orange, red) => ({
    thresholds: [
      { from: 0, fg: '#24e302' },
      { from: yellow, fg: '#f0c808' },
      { from: orange, fg: '#ff6131' },
      { from: red, fg: 'red' },
    ],
  });
  const widgets = {};
  for (const name of WIDGETS) widgets[name] = { on: true };
  for (const name of ['model', 'dir', 'branch']) widgets[name].value = { fg: '#f72585' };
  widgets.diff.add = { fg: 'diffgreen' };
  widgets.diff.del = { fg: 'diffred' };
  widgets.context.bar = bar(30, 40, 70);
  widgets.session.bar = bar(70, 80, 90);
  widgets.weekly.bar = bar(70, 80, 90);
  return {
    layout: 'wrap',
    separator: { text: ' • ', fg: '#aee414', bold: true },
    defaults: { label: { fg: '#7dcaf6' }, value: { fg: '' } },
    widgets,
  };
}

const DEFAULT_CONFIG = {
  protection: { secrets: 'block', 'personal-data': 'ask' },
  memory: { enable: true },
};
const DEFAULT_STATUSLINE = defaultStatusline();

const PROTECTION_LEVELS = {
  secrets: ['block', 'allow'],
  'personal-data': ['block', 'ask', 'warn', 'allow'],
};
// statusline and run are user-wide; protection.allow is project-only and checked by the protection check.
const USER_KEYS = new Set(['format', 'protection', 'memory', 'statusline', 'run']);
const PROJECT_KEYS = new Set(['format', 'protection', 'memory']);

function locations(projectRoot = null) {
  return {
    configFile: path.join(os.homedir(), '.qatlas', 'plugins', 'config.json'),
    projectConfigFile: projectRoot
      ? path.join(path.resolve(projectRoot), '.qatlas', 'plugins', 'config.json') : null,
  };
}

function parseConfigText(source) {
  const value = JSON.parse(String(source).replace(/^﻿/, ''));
  if (!isObject(value)) throw new Error('The root must be a JSON object.');
  if (value.format !== 1) throw new Error('The field format must be 1.');
  return value;
}

// A missing file is the normal case.
function readFile(file) {
  let source;
  try { source = fs.readFileSync(file, 'utf8'); }
  catch (error) {
    return error.code === 'ENOENT' ? { exists: false, value: null } : { exists: true, value: null, error };
  }
  try { return { exists: true, value: parseConfigText(source) }; }
  catch (error) { return { exists: true, value: null, error }; }
}

const RUN_PROFILES = ['light', 'standard', 'demanding'];
const RUN_ROLES = ['integrator', 'lead'];

function runProblems(value) {
  const problems = [];
  if ('test-slots' in value && !(Number.isInteger(value['test-slots']) && value['test-slots'] > 0)) {
    problems.push('test-slots needs a positive integer.');
  }
  // Model settings are optional; profiles and hosts only come together.
  if (!('profiles' in value) && !('hosts' in value)) return problems;
  if (!isObject(value.profiles) || !RUN_PROFILES.every(name => typeof value.profiles[name] === 'string')) {
    return [...problems, 'profiles needs the profiles ' + RUN_PROFILES.join(', ') + ' as text.'];
  }
  if (!isObject(value.hosts) || !Object.keys(value.hosts).length) return [...problems, 'hosts is missing or empty.'];
  for (const [host, entry] of Object.entries(value.hosts)) {
    if (!isObject(entry)) { problems.push('hosts.' + host + ' must be an object.'); continue; }
    const slots = RUN_ROLES.map(role => [role, entry[role]]);
    for (const profile of RUN_PROFILES) {
      slots.push(['worker.' + profile, isObject(entry.worker) ? entry.worker[profile] : undefined]);
    }
    for (const [name, slot] of slots) {
      if (!isObject(slot) || !['model', 'effort'].every(key => slot[key] === null || typeof slot[key] === 'string')) {
        problems.push('hosts.' + host + '.' + name + ' needs model and effort, each text or null.');
      }
    }
  }
  return problems;
}

function knownProtection(value) {
  const out = {};
  if (isObject(value)) for (const key of Object.keys(PROTECTION_LEVELS)) if (key in value) out[key] = value[key];
  return out;
}

function knownMemoryEnable(memory) {
  return isObject(memory) && typeof memory.enable === 'boolean' ? memory.enable : undefined;
}

// invalid values make the protection check impossible; unknown keys are only reported.
function configProblems(value, file, project) {
  const keys = project ? PROJECT_KEYS : USER_KEYS;
  const invalid = [];
  const unknown = Object.keys(value).filter(key => !keys.has(key)).map(key => file + ': unknown key ' + key + '.');
  if (value.memory !== undefined) {
    if (!isObject(value.memory)) invalid.push(file + ': memory must be an object.');
    else {
      for (const key of Object.keys(value.memory)) {
        if (key !== 'enable') unknown.push(file + ': unknown key memory.' + key + '.');
        else if (typeof value.memory.enable !== 'boolean') invalid.push(file + ': memory.enable must be true or false.');
      }
    }
  }
  const protection = value.protection;
  if (protection !== undefined && !isObject(protection)) invalid.push(file + ': protection must be an object.');
  else if (protection !== undefined) {
    for (const key of Object.keys(protection)) {
      const levels = PROTECTION_LEVELS[key];
      if (project && key === 'allow') continue;
      if (!levels) unknown.push(file + ': unknown key protection.' + key + '.');
      else if (!levels.includes(protection[key])) {
        invalid.push(file + ': protection.' + key + ' must be one of ' + levels.join(', ') + '.');
      }
    }
  }
  return { invalid, unknown };
}

const STATUSLINE_KEYS = new Set(['layout', 'separator', 'defaults', 'widgets']);

function statuslineProblems(value, file) {
  const invalid = [];
  const unknown = Object.keys(value).filter(key => !STATUSLINE_KEYS.has(key))
    .map(key => file + ': unknown key statusline.' + key + '.');
  if ('layout' in value && !['wrap', 'fixed'].includes(value.layout)) {
    invalid.push(file + ': statusline.layout must be wrap or fixed.');
  }
  for (const key of ['separator', 'defaults', 'widgets']) {
    if (key in value && !isObject(value[key])) invalid.push(file + ': statusline.' + key + ' must be an object.');
  }
  if (isObject(value.widgets)) {
    for (const [name, widget] of Object.entries(value.widgets)) {
      if (!WIDGETS.includes(name)) unknown.push(file + ': unknown widget statusline.widgets.' + name + '.');
      else if (!isObject(widget)) invalid.push(file + ': statusline.widgets.' + name + ' must be an object.');
    }
  }
  return { invalid, unknown };
}

// Without a widgets map every widget shows in the shipped order. A map is menu and order at once: listed
// widgets show unless "on": false, missing ones stay off. Every listed entry keeps its widget's defaults
// and overrides only what it sets.
function normalizeStatusline(value) {
  const own = isObject(value) ? value : {};
  const listed = isObject(own.widgets)
    ? Object.keys(own.widgets).filter(name => WIDGETS.includes(name) && isObject(own.widgets[name])) : WIDGETS;
  const widgets = {};
  for (const name of listed) {
    widgets[name] = merge(DEFAULT_STATUSLINE.widgets[name], isObject(own.widgets) ? own.widgets[name] : null);
    widgets[name].on = widgets[name].on !== false;
  }
  for (const name of WIDGETS) if (!(name in widgets)) widgets[name] = { ...clone(DEFAULT_STATUSLINE.widgets[name]), on: false };
  return {
    layout: own.layout === 'fixed' ? 'fixed' : 'wrap',
    separator: merge(DEFAULT_STATUSLINE.separator, isObject(own.separator) ? own.separator : null),
    defaults: merge(DEFAULT_STATUSLINE.defaults, isObject(own.defaults) ? own.defaults : null),
    widgets,
    order: Object.keys(widgets).filter(name => widgets[name].on),
  };
}

function readConfig(projectRoot = null) {
  const paths = locations(projectRoot);
  const user = readFile(paths.configFile);
  const project = paths.projectConfigFile ? readFile(paths.projectConfigFile) : { exists: false, value: null };
  const problems = [];
  const unknown = [];
  let protectionValid = true;
  const config = clone(DEFAULT_CONFIG);

  for (const [file, state, isProject] of [[paths.configFile, user, false], [paths.projectConfigFile, project, true]]) {
    if (state.error) { problems.push(file + ': ' + state.error.message); protectionValid = false; continue; }
    if (!state.value) continue;
    const issues = configProblems(state.value, file, isProject);
    problems.push(...issues.invalid);
    unknown.push(...issues.unknown);
    if (issues.invalid.length) { protectionValid = false; continue; }
    Object.assign(config.protection, knownProtection(state.value.protection));
    const enable = knownMemoryEnable(state.value.memory);
    if (enable !== undefined) config.memory.enable = enable;
  }

  const value = user.value || {};
  if (value.statusline !== undefined && !isObject(value.statusline)) {
    problems.push(paths.configFile + ': statusline must be an object.');
  } else if (value.statusline !== undefined) {
    const issues = statuslineProblems(value.statusline, paths.configFile);
    problems.push(...issues.invalid);
    unknown.push(...issues.unknown);
  }
  let runBlock = null;
  if (value.run !== undefined) {
    if (!isObject(value.run)) problems.push(paths.configFile + ': run must be an object.');
    else {
      runBlock = value.run;
      problems.push(...runProblems(runBlock).map(problem => paths.configFile + ': run.' + problem));
    }
  }

  return {
    ...paths,
    config,
    protectionValid,
    problems,
    unknown,
    userError: user.error ? user.error.message : null,
    statusline: normalizeStatusline(isObject(value.statusline) ? value.statusline : null),
    hasStatusline: isObject(value.statusline),
    run: runBlock,
  };
}

function readStatusline() {
  const state = readConfig();
  return { configFile: state.configFile, error: state.userError, exists: state.hasStatusline, statusline: state.statusline };
}

module.exports = { locations, parseConfigText, readConfig, readStatusline };
