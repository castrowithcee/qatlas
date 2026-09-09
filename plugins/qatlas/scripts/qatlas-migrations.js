#!/usr/bin/env node
'use strict';

// Migriert nötigen gerätelokalen Legacy-Zustand vor der normalen Plugin-Nutzung und meldet
// projektspezifische Konflikte, ohne ein Nutzer-Repository still zu verändern.

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { isDeepStrictEqual } = require('util');
const {
  DEFAULT_CONFIG,
  DEFAULT_CREDENTIALS,
  DEFAULT_STATUSLINE,
  parseYamlText,
  stringifyYaml,
} = require('./runtime/config-loader.js');

const HOME_MIGRATION = 'legacy-home-config-v1';
const PROJECT_ROOT = '.qatlas-project';
const LEGACY_PROJECT_ROOTS = ['.qatlas/project', '__qatlas__', '__callbell__'];
const PROJECT_ID = /^(overview|decision|adr|convention|arch|req|plan|task|ops|quality|risk|history|memory|template)-(\d{4,})-[a-z0-9][a-z0-9-]*\.md$/;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (!isObject(value)) return value;
  const out = {};
  for (const key of Object.keys(value)) out[key] = clone(value[key]);
  return out;
}

function parseJsonFile(file) {
  const value = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  if (!isObject(value)) throw new Error('Das JSON-Wurzeldokument muss ein Objekt sein.');
  return value;
}

function parseYamlFile(file, fallback) {
  if (!fs.existsSync(file)) return clone(fallback);
  return parseYamlText(fs.readFileSync(file, 'utf8'));
}

function atomicWrite(file, content, mode = 0o600) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + '.tmp-' + process.pid;
  fs.writeFileSync(temporary, content, { mode });
  try {
    fs.renameSync(temporary, file);
  } catch {
    fs.copyFileSync(temporary, file);
    fs.unlinkSync(temporary);
  }
  try { fs.chmodSync(file, mode); } catch { /* Keine POSIX-Modusunterstützung. */ }
}

function isDirectory(directory) {
  try { return fs.statSync(directory).isDirectory(); }
  catch { return false; }
}

function portable(value) {
  return value.split(path.sep).join('/');
}

function walkProjectFiles(root, directory = root, excluded = []) {
  const files = [];
  let entries;
  try { entries = fs.readdirSync(directory, { withFileTypes: true }); }
  catch (error) { return { files, errors: [directory + ': ' + error.message] }; }
  const errors = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const file = path.join(directory, entry.name);
    const relative = portable(path.relative(root, file));
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules' || relative === '.qatlas/local'
        || excluded.some(item => file === item || file.startsWith(item + path.sep))
        || (file !== root && fs.existsSync(path.join(file, '.git')))) continue;
      const nested = walkProjectFiles(root, file, excluded);
      files.push(...nested.files);
      errors.push(...nested.errors);
    } else if (entry.isFile()) {
      files.push(file);
    }
  }
  return { files, errors };
}

function readProjectState(file) {
  if (!fs.existsSync(file)) return { format: 1, plugins: {} };
  const value = parseJsonFile(file);
  return {
    ...value,
    format: 1,
    plugins: isObject(value.plugins) ? value.plugins : {},
  };
}

function mergedProjectState(sourceFile, targetFile, conflicts) {
  let source;
  let target;
  try { source = readProjectState(sourceFile); }
  catch (error) { conflicts.push(sourceFile + ': ' + error.message); }
  try { target = readProjectState(targetFile); }
  catch (error) { conflicts.push(targetFile + ': ' + error.message); }
  if (!source || !target) return null;
  for (const [plugin, version] of Object.entries(source.plugins)) {
    if (target.plugins[plugin] !== undefined && target.plugins[plugin] !== version) {
      conflicts.push('Die Projekt-Prüfstände widersprechen sich für ' + plugin + ': '
        + source.plugins[plugin] + ' und ' + target.plugins[plugin] + '.');
    }
  }
  return { ...source, ...target, format: 1, plugins: { ...source.plugins, ...target.plugins } };
}

function isHistoricalUpdate(relative) {
  return /(^|\/)updates\/\d+\.\d+\.\d+\.md$/.test(relative);
}

function isMigrationMechanic(relative) {
  return /(^|\/)scripts\/qatlas-migrations\.js$/.test(relative);
}

function projectMigrationInventory(projectRoot, { detailed = true } = {}) {
  const root = path.resolve(projectRoot);
  const current = path.join(root, PROJECT_ROOT);
  const legacy = LEGACY_PROJECT_ROOTS
    .map(name => ({ name, file: path.join(root, ...name.split('/')) }))
    .filter(entry => isDirectory(entry.file));
  const hasCurrent = isDirectory(current);
  const targetExists = fs.existsSync(current);
  const roots = [...legacy.map(entry => entry.name), ...(hasCurrent ? [PROJECT_ROOT] : [])];
  const conflicts = [];
  if (targetExists && !hasCurrent) {
    conflicts.push(current + ' existiert, ist aber kein lesbarer Projektwissensraum.');
  }
  if (roots.length > 1) {
    conflicts.push('Mehrere Qatlas-Projektwurzeln müssen vor einer Migration inhaltlich verglichen werden: '
      + roots.map(name => path.join(root, ...name.split('/'))).join(', '));
  }

  const source = legacy.length === 1 && !hasCurrent ? legacy[0] : null;
  let readme = 'nicht vorhanden';
  const readmeRoot = source ? source.file : hasCurrent ? current : null;
  if (readmeRoot) {
    const sourceReadme = path.join(readmeRoot, 'README.md');
    try {
      const stat = fs.statSync(sourceReadme);
      if (!stat.isFile()) throw new Error('kein lesbares Dokument');
      fs.readFileSync(sourceReadme, 'utf8');
      readme = portable(path.relative(root, sourceReadme));
    } catch (error) {
      if (error && error.code !== 'ENOENT') {
        if (source) {
          conflicts.push(sourceReadme + ' ist nicht lesbar: ' + error.message);
        }
        readme = 'nicht lesbar';
      }
    }
  }
  const knowledgeRoot = source ? source.file : hasCurrent ? current : null;
  const legacyState = knowledgeRoot ? path.join(knowledgeRoot, 'updates', 'state.json') : null;
  const stateTarget = path.join(root, '.qatlas', 'plugins', 'updates', 'state.json');
  const stateSources = [...legacy.map(entry => path.join(entry.file, 'updates', 'state.json')),
    ...(hasCurrent ? [path.join(current, 'updates', 'state.json')] : [])]
    .filter(file => fs.existsSync(file));
  const state = legacyState && fs.existsSync(legacyState)
    ? mergedProjectState(legacyState, stateTarget, conflicts) : null;

  const replacements = legacy.map(entry => [entry.name, PROJECT_ROOT]);
  const references = [];
  const projectRoots = [...legacy.map(entry => entry.file), ...(hasCurrent ? [current] : [])];
  const excluded = projectRoots.flatMap(projectRoot => ['zone-import', 'zone-export']
    .map(zone => path.join(projectRoot, zone)));
  const scanned = detailed && legacy.length
    ? walkProjectFiles(root, root, excluded) : { files: [], errors: [] };
  conflicts.push(...scanned.errors);
  const functionalFiles = scanned.files.filter(file => legacy.some(entry => {
    const relative = portable(path.relative(entry.file, file));
    return !relative.startsWith('../')
      && /(^|\/)(INDEX|index)\.md$/.test(relative);
  }));
  if (functionalFiles.length) {
    conflicts.push('Vorhandene INDEX-Dateien müssen vor dem Umzug inhaltlich zugeordnet werden: '
      + functionalFiles.map(file => portable(path.relative(root, file))).join(', '));
  }
  const ids = new Map();
  for (const file of scanned.files) {
    if (!legacy.some(entry => {
      const relative = path.relative(entry.file, file);
      return relative && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
    })) continue;
    const match = path.basename(file).match(PROJECT_ID);
    if (!match) continue;
    const key = match[1] + ':' + match[2];
    if (!ids.has(key)) ids.set(key, []);
    ids.get(key).push(file);
  }
  const idConflicts = [...ids.entries()].filter(([, files]) => files.length > 1);
  for (const [id, files] of idConflicts) {
    conflicts.push('Doppelte Projektwissens-ID ' + id.replace(':', '-') + ': '
      + files.map(file => portable(path.relative(root, file))).join(', '));
  }
  for (const file of scanned.files) {
    const relative = portable(path.relative(root, file));
    if (isHistoricalUpdate(relative) || isMigrationMechanic(relative)) continue;
    let text;
    try {
      const content = fs.readFileSync(file);
      if (content.includes(0)) continue;
      text = content.toString('utf8');
      if (!Buffer.from(text, 'utf8').equals(content)) continue;
    } catch (error) {
      conflicts.push(file + ': ' + error.message);
      continue;
    }
    const matches = replacements.filter(([from]) => text.includes(from)).map(([from]) => from);
    if (matches.length) references.push({ file, relative, matches });
  }

  const pendingStateMove = Boolean(legacyState && fs.existsSync(legacyState));
  const unresolved = Boolean(legacy.length || pendingStateMove || conflicts.length);
  return {
    root,
    roots,
    sources: legacy.map(entry => entry.name),
    source: source ? source.name : null,
    target: PROJECT_ROOT,
    references,
    functionalFiles,
    idConflicts,
    readme,
    conflicts,
    legacyState,
    stateSources,
    stateTarget,
    state,
    unresolved,
    ready: !conflicts.length && Boolean(source || pendingStateMove),
  };
}

function migrateProject({ projectRoot = process.cwd(), apply = false } = {}) {
  const inventory = projectMigrationInventory(projectRoot);
  if (inventory.conflicts.length || !inventory.ready || !apply) {
    return { applied: false, inventory, blocked: inventory.conflicts };
  }

  const source = inventory.source
    ? path.join(inventory.root, ...inventory.source.split('/')) : null;
  const target = path.join(inventory.root, PROJECT_ROOT);
  const referenceSnapshots = new Map();
  let stateTargetSnapshot = null;
  const legacyStateSnapshot = inventory.legacyState && fs.existsSync(inventory.legacyState)
    ? fs.readFileSync(inventory.legacyState) : null;
  let movedRoot = false;
  try {
    for (const reference of inventory.references) {
      const file = reference.file;
      const before = fs.readFileSync(file, 'utf8');
      let after = before;
      for (const [from, to] of [[inventory.source, PROJECT_ROOT]]) {
        if (from) after = after.split(from).join(to);
      }
      if (after !== before) {
        referenceSnapshots.set(file, before);
        atomicWrite(file, after, fs.statSync(file).mode & 0o777);
      }
    }

    if (source) {
      fs.renameSync(source, target);
      movedRoot = true;
    }

    const migratedState = path.join(target, 'updates', 'state.json');
    if (fs.existsSync(migratedState)) {
      stateTargetSnapshot = fs.existsSync(inventory.stateTarget)
        ? { exists: true, content: fs.readFileSync(inventory.stateTarget) } : { exists: false };
      atomicWrite(inventory.stateTarget, JSON.stringify(inventory.state, null, 2) + '\n', 0o644);
      fs.unlinkSync(migratedState);
    }
  } catch (error) {
    if (legacyStateSnapshot) {
      const restoredState = path.join(target, 'updates', 'state.json');
      atomicWrite(restoredState, legacyStateSnapshot, 0o644);
    }
    if (stateTargetSnapshot) {
      if (stateTargetSnapshot.exists) atomicWrite(inventory.stateTarget, stateTargetSnapshot.content, 0o644);
      else if (fs.existsSync(inventory.stateTarget)) fs.unlinkSync(inventory.stateTarget);
    }
    if (movedRoot && isDirectory(target) && !fs.existsSync(source)) fs.renameSync(target, source);
    for (const [file, content] of referenceSnapshots) atomicWrite(file, content, fs.statSync(file).mode & 0o777);
    return { applied: false, inventory: projectMigrationInventory(projectRoot), blocked: [
      'Projektmigration zurückgerollt: ' + error.message,
    ] };
  }
  return { applied: true, inventory: projectMigrationInventory(projectRoot), blocked: [] };
}

function migrationPaths(homeDir) {
  const qatlas = path.join(homeDir, '.qatlas');
  const pluginHome = path.join(qatlas, 'plugins');
  return {
    homeDir,
    pluginHome,
    configFile: path.join(pluginHome, 'config.yaml'),
    credentialsFile: path.join(pluginHome, 'credentials.yaml'),
    statuslineFile: path.join(pluginHome, 'statusline.yaml'),
    stateFile: path.join(qatlas, 'state', 'migrations.json'),
    backupRoot: path.join(qatlas, 'state', 'migrations', 'backups'),
    claudeSettings: path.join(homeDir, '.claude', 'settings.json'),
    renderer: path.join(pluginHome, 'statusline.js'),
    runtime: path.join(pluginHome, 'runtime'),
    legacy: ['.callbell', '.qatlas'].flatMap(directory => {
      const root = path.join(homeDir, directory);
      return ['settings.json', 'statusline.json', 'telegram.json']
        .map(name => ({ directory, name, file: path.join(root, name) }));
    }),
  };
}

function readMigrationState(file) {
  if (!fs.existsSync(file)) return { format: 1, plugins: { qatlas: { applied: {} } } };
  const value = parseJsonFile(file);
  const plugins = isObject(value.plugins) ? value.plugins : {};
  const qatlas = isObject(plugins.qatlas) ? plugins.qatlas : {};
  return {
    ...value,
    format: 1,
    plugins: {
      ...plugins,
      qatlas: { ...qatlas, applied: isObject(qatlas.applied) ? qatlas.applied : {} },
    },
  };
}

function normalizedSettings(value) {
  const session = isObject(value.sessionStart) ? value.sessionStart : {};
  return {
    enabled: session.enabled !== false,
    ruleset: session.ruleset !== false,
  };
}

function normalizedTelegram(value) {
  return {
    notification: { enabled: value.enabled === true, connection: 'default' },
    credential: {
      token: typeof value.token === 'string' ? value.token : '',
      'chat-id': value['chat-id'] !== undefined ? value['chat-id']
        : value.chat_id !== undefined ? value.chat_id : '',
    },
  };
}

function statuslineDocument(value) {
  const content = clone(value);
  delete content.format;
  return { format: 1, ...content };
}

function collectLegacy(paths, name, normalize, problems) {
  const files = paths.legacy.filter(entry => entry.name === name && fs.existsSync(entry.file));
  const values = [];
  for (const entry of files) {
    try { values.push({ file: entry.file, value: normalize(parseJsonFile(entry.file)) }); }
    catch (error) { problems.push(entry.file + ': ' + error.message); }
  }
  if (values.length > 1 && values.slice(1).some(entry => !isDeepStrictEqual(entry.value, values[0].value))) {
    problems.push('Widersprüchliche Legacy-Dateien für ' + name + ': '
      + values.map(entry => entry.file).join(', '));
  }
  return { files: files.map(entry => entry.file), value: values.length ? values[0].value : null };
}

function adopt(target, key, incoming, fallback, label, problems) {
  if (incoming === null) return false;
  const current = target[key];
  if (current === undefined || isDeepStrictEqual(current, fallback)) {
    target[key] = clone(incoming);
    return !isDeepStrictEqual(current, incoming);
  }
  if (isDeepStrictEqual(current, incoming)) return false;
  problems.push('Die neue und die Legacy-Konfiguration widersprechen sich bei ' + label + '.');
  return false;
}

function commandUsesLegacyStatusline(command) {
  if (typeof command !== 'string') return false;
  const portable = command.replace(/\\/g, '/');
  return portable.includes('/.callbell/statusline.js')
    || (portable.includes('/.qatlas/statusline.js') && !portable.includes('/.qatlas/plugins/statusline.js'));
}

function settingsMayUseLegacyStatusline(file) {
  try { return commandUsesLegacyStatusline(fs.readFileSync(file, 'utf8')); }
  catch { return false; }
}

function plannedStatuslineRuntime(paths, pluginRoot, writes, backupFiles, problems) {
  if (!fs.existsSync(paths.claudeSettings)) return false;
  let settings;
  try { settings = parseJsonFile(paths.claudeSettings); }
  catch (error) {
    problems.push(paths.claudeSettings + ': ' + error.message);
    return false;
  }
  const current = settings.statusLine;
  if (!isObject(current) || !commandUsesLegacyStatusline(current.command)) return false;

  const sources = [
    ['qatlas-statusline-render-claude.js', paths.renderer],
    [path.join('runtime', 'config-loader.js'), path.join(paths.runtime, 'config-loader.js')],
    [path.join('runtime', 'vendor', 'yaml-2.9.0.js'), path.join(paths.runtime, 'vendor', 'yaml-2.9.0.js')],
    [path.join('runtime', 'vendor', 'yaml-license.txt'), path.join(paths.runtime, 'vendor', 'yaml-license.txt')],
  ];
  for (const [relative, target] of sources) {
    const source = path.join(pluginRoot, 'scripts', relative);
    if (!fs.existsSync(source)) {
      problems.push('Ausgelieferte Statusline-Runtime fehlt: ' + source);
      continue;
    }
    writes.set(target, { content: fs.readFileSync(source), mode: 0o600 });
    if (fs.existsSync(target)) backupFiles.add(target);
  }

  const command = paths.renderer.replace(/\\/g, '/');
  settings.statusLine = { ...current, type: 'command', command: `node "${command}"` };
  if (settings.statusLine.refreshInterval === undefined) settings.statusLine.refreshInterval = 60;
  writes.set(paths.claudeSettings, {
    content: JSON.stringify(settings, null, 2) + '\n', mode: 0o600,
  });
  backupFiles.add(paths.claudeSettings);
  return true;
}

function safeBackupName(homeDir, file) {
  const relative = path.relative(homeDir, file);
  return relative && !relative.startsWith('..') ? relative : path.basename(file);
}

function createBackup(paths, files) {
  const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + process.pid;
  const backupDir = path.join(paths.backupRoot, runId);
  const records = [];
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const relative = safeBackupName(paths.homeDir, file);
    const target = path.join(backupDir, 'files', relative);
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    fs.copyFileSync(file, target);
    const content = fs.readFileSync(file);
    const mode = fs.statSync(file).mode & 0o777;
    try { fs.chmodSync(target, mode); } catch { /* Keine POSIX-Modusunterstützung. */ }
    records.push({
      source: file,
      backup: path.relative(backupDir, target).split(path.sep).join('/'),
      sha256: crypto.createHash('sha256').update(content).digest('hex'),
      mode: mode.toString(8),
    });
  }
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify({ format: 1, files: records }, null, 2)
    + '\n', { mode: 0o600 });
  return backupDir;
}

function snapshot(files) {
  const result = new Map();
  for (const file of files) {
    if (fs.existsSync(file)) {
      result.set(file, { exists: true, content: fs.readFileSync(file), mode: fs.statSync(file).mode & 0o777 });
    } else {
      result.set(file, { exists: false });
    }
  }
  return result;
}

function restore(snapshots) {
  for (const [file, state] of snapshots) {
    if (state.exists) atomicWrite(file, state.content, state.mode);
    else if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

function migrateLegacyHome({ homeDir, pluginRoot, apply }) {
  const paths = migrationPaths(homeDir);
  const problems = [];
  let state;
  try { state = readMigrationState(paths.stateFile); }
  catch (error) {
    return { applied: false, blocked: [paths.stateFile + ': ' + error.message], backupDir: null };
  }
  if (state.plugins.qatlas.applied[HOME_MIGRATION]) {
    return { applied: false, blocked: [], backupDir: null };
  }

  const settings = collectLegacy(paths, 'settings.json', normalizedSettings, problems);
  const statusline = collectLegacy(paths, 'statusline.json', value => value, problems);
  const telegram = collectLegacy(paths, 'telegram.json', normalizedTelegram, problems);

  let config;
  let credentials;
  let statuslineConfig;
  try { config = parseYamlFile(paths.configFile, DEFAULT_CONFIG); }
  catch (error) { problems.push(paths.configFile + ': ' + error.message); }
  try { credentials = parseYamlFile(paths.credentialsFile, DEFAULT_CREDENTIALS); }
  catch (error) { problems.push(paths.credentialsFile + ': ' + error.message); }
  try { statuslineConfig = parseYamlFile(paths.statuslineFile, DEFAULT_STATUSLINE); }
  catch (error) { problems.push(paths.statuslineFile + ': ' + error.message); }
  if (!config || !credentials || !statuslineConfig) {
    return { applied: false, blocked: problems, backupDir: null };
  }

  const legacyFiles = [...settings.files, ...statusline.files, ...telegram.files];
  const legacyDiagnostics = isObject(config.diagnostics) && Array.isArray(config.diagnostics.mute)
    && Object.keys(config.diagnostics).every(key => key === 'mute');
  const hasCombinedStatusline = Object.prototype.hasOwnProperty.call(config, 'statusline');
  let combinedStatusline = null;
  if (hasCombinedStatusline) {
    if (isObject(config.statusline)) combinedStatusline = statuslineDocument(config.statusline);
    else problems.push('Der Abschnitt statusline in ' + paths.configFile + ' muss eine Map sein.');
  }
  const legacyStatusline = statusline.value ? statuslineDocument(statusline.value) : null;
  let incomingStatusline = combinedStatusline || legacyStatusline;
  if (combinedStatusline && legacyStatusline
    && !isDeepStrictEqual(combinedStatusline, legacyStatusline)
    && isDeepStrictEqual(combinedStatusline, DEFAULT_STATUSLINE)) {
    incomingStatusline = legacyStatusline;
  }

  let configChanged = false;
  let credentialsChanged = false;
  configChanged = adopt(config, 'session-start', settings.value,
    DEFAULT_CONFIG['session-start'], 'session-start', problems) || configChanged;

  let statuslineChanged = false;
  if (incomingStatusline) {
    if (!fs.existsSync(paths.statuslineFile)) {
      statuslineChanged = true;
      statuslineConfig = clone(incomingStatusline);
    } else if (!isDeepStrictEqual(statuslineConfig, incomingStatusline)) {
      problems.push('Die neue und die bisherige Statusline-Konfiguration widersprechen sich.');
    }
  }
  if (hasCombinedStatusline) {
    delete config.statusline;
    configChanged = true;
  }

  if (telegram.value) {
    if (!isObject(config.notifications)) config.notifications = {};
    const currentNotification = config.notifications.telegram;
    if (currentNotification === undefined
      || isDeepStrictEqual(currentNotification, DEFAULT_CONFIG.notifications.telegram)) {
      config.notifications.telegram = clone(telegram.value.notification);
      configChanged = !isDeepStrictEqual(currentNotification, telegram.value.notification) || configChanged;
    } else if (!isDeepStrictEqual(currentNotification, telegram.value.notification)) {
      problems.push('Die neue und die Legacy-Konfiguration widersprechen sich bei notifications.telegram.');
    }

    if (!isObject(credentials.connections)) credentials.connections = {};
    if (!isObject(credentials.connections.telegram)) credentials.connections.telegram = {};
    const currentCredential = credentials.connections.telegram.default;
    const defaultCredential = DEFAULT_CREDENTIALS.connections.telegram.default;
    if (currentCredential === undefined || isDeepStrictEqual(currentCredential, defaultCredential)) {
      credentials.connections.telegram.default = clone(telegram.value.credential);
      credentialsChanged = !isDeepStrictEqual(currentCredential, telegram.value.credential);
    } else if (!isDeepStrictEqual(currentCredential, telegram.value.credential)) {
      problems.push('Die neuen und die Legacy-Credentials widersprechen sich bei connections.telegram.default.');
    }
  }

  if (legacyDiagnostics) {
    delete config.diagnostics;
    configChanged = true;
  }

  const writes = new Map();
  // Credentialquellen bleiben bis zur ausdrücklichen Bereinigung am alten Ort und werden nicht dupliziert.
  const credentialSources = new Set(telegram.files);
  const backupFiles = new Set(legacyFiles.filter(file => !credentialSources.has(file)));
  if (configChanged || (!fs.existsSync(paths.configFile) && legacyFiles.length)) {
    const content = stringifyYaml(config);
    try { parseYamlText(content); } catch (error) { problems.push('Neue config.yaml: ' + error.message); }
    writes.set(paths.configFile, { content, mode: 0o600 });
    if (fs.existsSync(paths.configFile)) backupFiles.add(paths.configFile);
  }
  if (credentialsChanged || (!fs.existsSync(paths.credentialsFile) && telegram.files.length)) {
    const content = stringifyYaml(credentials);
    try { parseYamlText(content); } catch (error) { problems.push('Neue credentials.yaml: ' + error.message); }
    writes.set(paths.credentialsFile, { content, mode: 0o600 });
  }
  if (statuslineChanged) {
    const content = stringifyYaml(statuslineConfig);
    try { parseYamlText(content); } catch (error) { problems.push('Neue statusline.yaml: ' + error.message); }
    writes.set(paths.statuslineFile, { content, mode: 0o600 });
    if (fs.existsSync(paths.statuslineFile)) backupFiles.add(paths.statuslineFile);
  }
  const statuslineRuntimeChanged = (statusline.files.length
    || settingsMayUseLegacyStatusline(paths.claudeSettings))
    ? plannedStatuslineRuntime(paths, pluginRoot, writes, backupFiles, problems) : false;

  if (problems.length) return { applied: false, blocked: problems, backupDir: null };
  if (!writes.size && !legacyFiles.length && !statuslineRuntimeChanged) {
    return { applied: false, blocked: [], backupDir: null };
  }
  if (!apply) return { applied: false, blocked: [], planned: [...writes.keys()], backupDir: null };

  const targets = new Set([...writes.keys(), paths.stateFile]);
  const snapshots = snapshot(targets);
  const backupDir = createBackup(paths, backupFiles);
  try {
    for (const [file, write] of writes) atomicWrite(file, write.content, write.mode);
    if (writes.has(paths.configFile)) parseYamlFile(paths.configFile, DEFAULT_CONFIG);
    if (writes.has(paths.credentialsFile)) parseYamlFile(paths.credentialsFile, DEFAULT_CREDENTIALS);
    if (writes.has(paths.statuslineFile)) parseYamlFile(paths.statuslineFile, DEFAULT_STATUSLINE);
    state.plugins.qatlas.applied[HOME_MIGRATION] = new Date().toISOString();
    atomicWrite(paths.stateFile, JSON.stringify(state, null, 2) + '\n', 0o600);
  } catch (error) {
    restore(snapshots);
    return { applied: false, blocked: ['Migration zurückgerollt: ' + error.message], backupDir };
  }
  return { applied: true, blocked: [], backupDir, credentialSources: [...credentialSources] };
}

function projectMigrationProblems(projectRoot) {
  const inventory = projectMigrationInventory(projectRoot, { detailed: false });
  if (!inventory.unresolved) return [];
  if (inventory.conflicts.length) return inventory.conflicts;
  const lines = [];
  if (inventory.source) {
    lines.push(path.join(inventory.root, ...inventory.source.split('/'))
      + ' muss ausdrücklich nach ' + path.join(inventory.root, PROJECT_ROOT) + ' migriert werden.');
  }
  if (inventory.legacyState && fs.existsSync(inventory.legacyState)) {
    lines.push(inventory.legacyState + ' muss nach ' + inventory.stateTarget + ' verlegt werden.');
  }
  return lines;
}

function machineMigrationProblems(homeDir) {
  const problems = [];
  for (const root of [path.join(homeDir, '.callbell', 'worktrees'), path.join(homeDir, '.qatlas', 'worktrees')]) {
    try {
      if (fs.statSync(root).isDirectory() && fs.readdirSync(root).length) {
        problems.push(root + ' enthält Legacy-Worktrees. Prüfe das Git-Register und verschiebe registrierte '
          + 'Worktrees ausschließlich mit git worktree move nach ~/.qatlas/state/worktrees/.');
      }
    } catch { /* Fehlend oder unlesbar bedeutet: kein automatisch behandelter Zustand. */ }
  }
  return problems;
}

function runMigrations({
  homeDir = os.homedir(),
  projectRoot = process.cwd(),
  pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.env.PLUGIN_ROOT || path.resolve(__dirname, '..'),
  apply = true,
} = {}) {
  const home = migrateLegacyHome({ homeDir, pluginRoot, apply });
  return {
    applied: home.applied ? [HOME_MIGRATION] : [],
    blocked: [...home.blocked, ...machineMigrationProblems(homeDir),
      ...projectMigrationProblems(path.resolve(projectRoot))],
    backupDir: home.backupDir,
    credentialSources: home.credentialSources || [],
    planned: home.planned || [],
  };
}

function resolveRoot() {
  const targetIndex = process.argv.indexOf('--target');
  if (targetIndex >= 0 && process.argv[targetIndex + 1]) return path.resolve(process.argv[targetIndex + 1]);
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

function emitContext(text) {
  if (!text) return;
  if (process.env.PLUGIN_ROOT) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text },
    }));
  } else {
    process.stdout.write(text + '\n');
  }
}

if (require.main === module) {
  const projectCommand = process.argv[2] === 'project';
  const applyProject = projectCommand && process.argv.includes('--apply');
  const projectRoot = resolveRoot();
  if (projectCommand) {
    const result = migrateProject({ projectRoot, apply: applyProject });
    const inventory = result.inventory;
    const lines = [
      'QATLAS-PROJEKTMIGRATION:',
      '- Quelle: ' + (inventory.sources.length ? inventory.sources.join(', ') : 'keine Legacy-Wurzel'),
      '- Ziel: ' + inventory.target,
      '- README: ' + inventory.readme,
      '- Prüfstand: ' + (inventory.stateSources.length
        ? inventory.stateSources.map(file => portable(path.relative(inventory.root, file))).join(', ') + ' -> '
          + portable(path.relative(inventory.root, inventory.stateTarget))
        : 'kein alter Prüfstand'),
      '- Referenzen: ' + inventory.references.length,
      ...inventory.references.map(reference => '  - ' + reference.relative),
    ];
    if (result.blocked.length) lines.push('- Konflikte:', ...result.blocked.map(problem => '  - ' + problem));
    if (!applyProject && inventory.ready) {
      lines.push('Noch nichts verändert. Prüfe dieses Inventar und führe nach Bestätigung denselben Befehl '
        + 'mit `project --apply` aus.');
    } else if (result.applied) {
      lines.push('Migration vollständig ausgeführt und erneut geprüft.');
    } else if (!inventory.unresolved && !result.applied) {
      lines.push('Keine Projektmigration offen.');
    }
    process.stdout.write(lines.join('\n') + '\n');
    process.exit(result.blocked.length ? 1 : 0);
  }

  const result = runMigrations({ projectRoot });
  const lines = [];
  if (result.applied.length) {
    lines.push('QATLAS-MIGRATION: Geräteweiter Legacy-Zustand wurde automatisch und verifiziert migriert.');
    if (result.backupDir) lines.push('BACKUP: ' + result.backupDir);
    if (result.credentialSources.length) {
      lines.push('CREDENTIAL-QUELLEN NICHT DUPLIZIERT ODER GELÖSCHT:',
        ...result.credentialSources.map(file => '- ' + file),
        'Informiere den Nutzer, dass diese Quellen nach Prüfung der übernommenen Verbindung ausdrücklich '
          + 'bereinigt werden können.');
    }
    lines.push('Informiere den Nutzer vor der übrigen Antwort knapp über Migration und Backup.');
  }
  if (result.blocked.length) {
    lines.push('QATLAS-MIGRATION BLOCKIERT:', ...result.blocked.map(problem => '- ' + problem));
    lines.push('Behandle diese Punkte vor jeder schreibenden Qatlas-Arbeit im betroffenen Scope. Der Nutzer '
      + 'muss keinen besonderen Update-Befehl kennen: Erkläre den konkreten Befund, prüfe Git und Inhalte '
      + 'read-only und hole nur die tatsächlich nötige Entscheidung ein. Bestätige keinen Update-Stand, '
      + 'solange die notwendige Migration offen ist. Unabhängige read-only Arbeit darf fortfahren.');
  }
  emitContext(lines.join('\n'));
}

module.exports = {
  HOME_MIGRATION,
  LEGACY_PROJECT_ROOTS,
  PROJECT_ROOT,
  migrateProject,
  projectMigrationInventory,
  runMigrations,
};
