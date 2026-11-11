'use strict';

// Silent upgrades of ~/.qatlas/plugins/config.json written by older plugin versions, applied at session
// start before anything reads the file. The config loader knows only the current form and no aliases; all
// knowledge of old forms lives here. Each step changes the parsed value in place and returns whether it did;
// delete a step once its old form no longer needs support.

const fs = require('fs');
const path = require('path');
const { locations, parseConfigText } = require('./config-loader.js');

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const STEPS = [
  // Up to 1.1.0 the block run was named team.
  function teamBlock(value) {
    if (!('team' in value) || 'run' in value) return false;
    // Re-adding every key keeps the position of the block.
    for (const key of Object.keys(value)) {
      const entry = value[key];
      delete value[key];
      value[key === 'team' ? 'run' : key] = entry;
    }
    return true;
  },
  // Up to 1.3.0 lead and integrator held a bare model instead of model and effort.
  function roleModels(value) {
    const hosts = isObject(value.run) && isObject(value.run.hosts) ? Object.values(value.run.hosts) : [];
    let changed = false;
    for (const host of hosts.filter(isObject)) {
      for (const role of ['integrator', 'lead']) {
        if (host[role] !== null && typeof host[role] !== 'string') continue;
        host[role] = { model: host[role], effort: null };
        changed = true;
      }
    }
    return changed;
  },
];

// Returns whether the file was rewritten. An unreadable or invalid file stays untouched.
function migrateUserConfig() {
  const { configFile } = locations();
  let source;
  let value;
  try {
    source = fs.readFileSync(configFile, 'utf8');
    value = parseConfigText(source);
  } catch { return false; }
  // Every step runs; a short-circuit would skip the later ones.
  if (!STEPS.map(step => step(value)).includes(true)) return false;
  const indent = (/^\uFEFF?\{\r?\n([ \t]+)"/.exec(source) || [])[1] || 2;
  const text = (source.startsWith('\uFEFF') ? '\uFEFF' : '') + JSON.stringify(value, null, indent)
    + (/\n$/.test(source) ? '\n' : '');
  // A synced config may be a symlink: replace its target, not the link.
  const target = fs.realpathSync(configFile);
  const temporary = path.join(path.dirname(target), '.' + path.basename(target) + '.' + process.pid + '.tmp');
  fs.writeFileSync(temporary, text, { mode: fs.statSync(target).mode & 0o777 });
  fs.renameSync(temporary, target);
  return true;
}

module.exports = { migrateUserConfig };
