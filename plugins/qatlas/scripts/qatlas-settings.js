'use strict';

// Nutzerweite Settings und die von Qatlas verwaltete RULESET-Kopie.

const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_SETTINGS = {
  format: 1,
  sessionStart: { enabled: true, ruleset: true },
  mute: [],
};

function location() {
  const dir = path.join(os.homedir(), '.qatlas');
  return {
    dir,
    settingsFile: path.join(dir, 'settings.json'),
    rulesetFile: path.join(dir, 'rules', 'RULESET.md'),
  };
}

function normalized(parsed) {
  const sessionStart = parsed && typeof parsed.sessionStart === 'object' && parsed.sessionStart
    ? parsed.sessionStart : {};
  return {
    ...parsed,
    format: 1,
    sessionStart: {
      enabled: sessionStart.enabled !== false,
      ruleset: sessionStart.ruleset !== false,
    },
    mute: Array.isArray(parsed.mute) ? parsed.mute : [],
  };
}

function readSettings() {
  const paths = location();
  try {
    const parsed = JSON.parse(fs.readFileSync(paths.settingsFile, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid settings');
    return { ...paths, exists: true, valid: true, settings: normalized(parsed) };
  } catch (error) {
    const exists = fs.existsSync(paths.settingsFile);
    return { ...paths, exists, valid: !exists, settings: normalized(DEFAULT_SETTINGS), error };
  }
}

function createSettings() {
  const paths = location();
  fs.mkdirSync(paths.dir, { recursive: true });
  fs.writeFileSync(paths.settingsFile, JSON.stringify(DEFAULT_SETTINGS, null, 2) + '\n', {
    flag: 'wx', mode: 0o600,
  });
  return paths.settingsFile;
}

function syncManagedRuleset(pluginRoot) {
  const paths = location();
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
  try { fs.chmodSync(paths.rulesetFile, 0o600); } catch { /* Auf Plattformen ohne POSIX-Modus ignorieren. */ }
  return { file: paths.rulesetFile, changed: true, created: previous === null };
}

module.exports = { DEFAULT_SETTINGS, readSettings, createSettings, syncManagedRuleset };
