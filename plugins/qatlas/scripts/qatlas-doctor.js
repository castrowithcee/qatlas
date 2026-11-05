#!/usr/bin/env node
'use strict';

// Checks Qatlas and reports by default; --apply adds what is missing without overwriting.
// Usage: node qatlas-doctor.js [--apply] [--target <dir>]

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { scaffoldTopUp, walk } = require('./qatlas-scaffold-topup.js');
const { installedPlugins, legacyRoots } = require('./qatlas-update.js');
const {
  createConfig,
  parseYamlText,
  readConfig,
  readStatusline,
  teamProblems,
  topUpConfig,
} = require('./runtime/config-loader.js');

const argv = process.argv.slice(2);
const requestedApply = argv.includes('--apply');
const flag = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const target = flag('--target') ? path.resolve(flag('--target')) : process.cwd();
const legacy = legacyRoots(target);
// A second project root next to an earlier one would split the project state.
const apply = requestedApply && !legacy.length;

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.env.PLUGIN_ROOT
  || path.resolve(__dirname, '..');
const bundle = path.join(pluginRoot, 'scaffold');

const missing = [];   // blocks or impairs work
const notes = [];     // worth mentioning once, not blocking
const created = [];   // files actually written by --apply

if (legacy.length) {
  missing.push('project root: ' + legacy.join(', ') + ' is an earlier project root. `qatlas-core update` '
    + 'moves it to .qatlas-project/.');
  if (requestedApply) notes.push('apply: nothing was changed because of the earlier project root.');
}

const projectUpdateState = path.join(target, '.qatlas', 'plugins', 'updates', 'state.json');
if (fs.existsSync(projectUpdateState)) {
  try {
    const state = JSON.parse(fs.readFileSync(projectUpdateState, 'utf8'));
    if (!state || typeof state !== 'object' || Array.isArray(state)
      || !state.plugins || typeof state.plugins !== 'object' || Array.isArray(state.plugins)) {
      throw new Error('expected a JSON object with a plugins map');
    }
  } catch (error) {
    missing.push('update: ' + projectUpdateState + ' is invalid and stays untouched: ' + error.message);
  }
}

function has(cmd, args) {
  try { execFileSync(cmd, args, { stdio: 'pipe' }); return true; }
  catch { return false; }
}

if (!has('git', ['--version'])) {
  missing.push('git: not on PATH. Without Git there is neither version control nor the commit skill.');
} else {
  const isRepo = has('git', ['-C', target, 'rev-parse', '--show-toplevel']);
  if (!isRepo) {
    missing.push('git repo: this folder is none. `git init` makes the work recoverable.');
  }
  const identity = ['user.name', 'user.email'].filter(k => {
    const args = isRepo ? ['-C', target, 'config', k] : ['config', '--global', k];
    try { return !execFileSync('git', args, { stdio: 'pipe' }).toString().trim(); }
    catch { return true; }
  });
  if (identity.length) {
    missing.push('git identity: ' + identity.join(' and ') + ' not set. Never invent an identity or take it '
      + 'from the session. Ask the user what their commits should carry.');
  }
}

const configState = readConfig(target);

if (!configState.exists) {
  if (apply) {
    try {
      createConfig();
      created.push('~/.qatlas/plugins/config.yaml');
    } catch {
      missing.push('config: ~/.qatlas/plugins/config.yaml could not be created.');
    }
  } else {
    missing.push('config: ~/.qatlas/plugins/config.yaml is missing.');
  }
} else if (configState.valid && apply) {
  try {
    const added = topUpConfig();
    if (added.length) created.push('~/.qatlas/plugins/config.yaml: ' + added.join(', '));
  } catch {
    missing.push('config: missing keys in ~/.qatlas/plugins/config.yaml could not be added.');
  }
}
for (const problem of configState.problems) missing.push('config: ' + problem + ' The file stays untouched.');
for (const unknown of configState.unknown) notes.push('config: ' + unknown + ' Qatlas no longer reads it; remove it.');

// Optional and user-owned: never created by --apply.
const teamFile = path.join(os.homedir(), '.qatlas', 'plugins', 'team.yaml');
if (fs.existsSync(teamFile)) {
  try {
    const problems = teamProblems(parseYamlText(fs.readFileSync(teamFile, 'utf8'), 2));
    if (problems.length) throw new Error(problems.join(' '));
  } catch (error) {
    missing.push('team: ' + teamFile + ' is invalid and stays untouched: ' + error.message);
  }
}

const statuslineState = readStatusline();
if (statuslineState.exists && !statuslineState.valid) {
  missing.push('statusline: ' + statuslineState.statuslineFile + ': ' + statuslineState.error.message);
}

const libraryBundle = path.join(bundle, 'library');
const library = path.join(os.homedir(), 'qatlas');
for (const rel of walk(libraryBundle).filter(rel => !fs.existsSync(path.join(library, rel)))) {
  const shown = '~/qatlas/' + rel;
  if (!apply) { missing.push('library: ' + shown + ' is missing; qatlas-core setup adds it.'); continue; }
  try {
    fs.mkdirSync(path.dirname(path.join(library, rel)), { recursive: true });
    fs.copyFileSync(path.join(libraryBundle, rel), path.join(library, rel), fs.constants.COPYFILE_EXCL);
    created.push(shown);
  } catch {
    missing.push('library: ' + shown + ' could not be created.');
  }
}

const hadScaffold = fs.existsSync(path.join(target, '.qatlas-project'));
const { absent, created: scaffoldCreated } = scaffoldTopUp(target, bundle, { apply });

if (!apply) {
  if (!hadScaffold) {
    if (!legacy.length) {
      missing.push('scaffold: there is no .qatlas-project/ here, so neither backlog, memory nor zones.');
    }
  } else if (absent.length) {
    missing.push('scaffold: ' + absent.length + ' file(s) missing: ' + absent.join(', '));
  }
} else {
  created.push(...scaffoldCreated);
  if (!hadScaffold) {
    try {
      // A fresh scaffold has nothing to merge from any installed plugin of this marketplace.
      const plugins = installedPlugins(target);
      if (plugins.length) {
        fs.mkdirSync(path.dirname(projectUpdateState), { recursive: true });
        fs.writeFileSync(projectUpdateState, JSON.stringify({
          format: 1,
          plugins: Object.fromEntries(plugins.map(plugin => [plugin.name, plugin.version])),
        }, null, 2) + '\n', { flag: 'wx', mode: 0o644 });
        created.push('.qatlas/plugins/updates/state.json');
      }
    } catch { /* a broken state file must not block safe scaffolding */ }
  }
}

const gitignore = path.join(target, '.gitignore');
let ignoreText = '';
try { ignoreText = fs.readFileSync(gitignore, 'utf8'); } catch { /* no file yet */ }
const zones = ['zone-import', 'zone-export'];
const missingZones = zones.filter(zone =>
  !new RegExp('^/\\.qatlas-project/' + zone + '/\\*\\s*$', 'm').test(ignoreText));
const localMissing = !/^\/\.qatlas\/local\/\s*$/m.test(ignoreText);
if (!legacy.length && (missingZones.length || localMissing)) {
  if (!apply) {
    const parts = [];
    if (missingZones.length) parts.push('zone rules for ' + missingZones.join(' and '));
    if (localMissing) parts.push('the rule for .qatlas/local/');
    missing.push('.gitignore: ' + parts.join(' and ') + ' missing. Local or temporary state could be '
      + 'committed.');
  } else {
    const add = fs.readFileSync(path.join(bundle, 'gitignore'), 'utf8').trim().split(/\r?\n\r?\n/)
      .filter(block => missingZones.some(zone => block.includes('/.qatlas-project/' + zone + '/*'))
        || (localMissing && block.includes('/.qatlas/local/')))
      .join('\n\n') + '\n';
    fs.writeFileSync(gitignore, ignoreText ? ignoreText.replace(/\s*$/, '\n\n') + add : add);
    created.push('.gitignore (extended)');
  }
}

const projectReadme = path.join(target, '.qatlas-project', 'README.md');
if (fs.existsSync(path.join(target, '.qatlas-project'))) {
  try {
    const readme = fs.readFileSync(projectReadme, 'utf8');
    const readmeLines = readme.split(/\r?\n/);
    if (readmeLines.at(-1) === '') readmeLines.pop();
    const lines = readmeLines.length;
    const words = readme.trim() ? readme.trim().split(/\s+/).length : 0;
    if (lines > 80 || words > 500) {
      missing.push('scaffold: .qatlas-project/README.md exceeds the budget 80/500 with ' + lines + ' lines and '
        + words + ' words. The file stays untouched and fully readable.');
    }
  } catch (error) {
    missing.push('scaffold: .qatlas-project/README.md is not readable: ' + error.message);
  }
}

// Existing rulesets are only reported, never touched.
const rulesets = ['AGENTS.md', 'CLAUDE.md'].filter(f => fs.existsSync(path.join(target, f)));
if (!rulesets.length) {
  if (!apply) {
    missing.push('ruleset: neither AGENTS.md nor CLAUDE.md exists. Both are created, AGENTS.md from the '
      + 'template and CLAUDE.md as the switch @AGENTS.md.');
  } else {
    fs.writeFileSync(path.join(target, 'AGENTS.md'),
      fs.readFileSync(path.join(bundle, 'agents-template.md'), 'utf8'));
    fs.writeFileSync(path.join(target, 'CLAUDE.md'), '@AGENTS.md\n');
    created.push('AGENTS.md', 'CLAUDE.md (@AGENTS.md)');
  }
} else {
  notes.push('ruleset: ' + rulesets.join(' + ') + ' present and untouched.');
}

const out = [];
if (missing.length) out.push('MISSING\n' + missing.map(m => '- ' + m).join('\n'));
if (notes.length) out.push('NOTES\n' + notes.map(n => '- ' + n).join('\n'));
if (created.length) out.push('CREATED\n' + created.map(c => '- ' + c).join('\n'));
if (!out.length) out.push('OK: nothing missing.');

process.stdout.write(out.join('\n\n') + '\n');
process.exit(0);
