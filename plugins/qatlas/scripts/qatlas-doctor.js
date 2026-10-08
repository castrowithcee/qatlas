#!/usr/bin/env node
'use strict';

// Checks Qatlas and reports by default; --apply adds what is missing without overwriting.
// Usage: node qatlas-doctor.js [--apply] [--target <dir>]

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { scaffoldTopUp, walk } = require('./qatlas-scaffold-topup.js');
const { projectMigrationInventory } = require('./qatlas-migrations.js');
const {
  createConfig,
  parseYamlText,
  readConfig,
  readStatusline,
  topUpConfig,
} = require('./runtime/config-loader.js');

const argv = process.argv.slice(2);
const requestedApply = argv.includes('--apply');
const flag = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const target = flag('--target') ? path.resolve(flag('--target')) : process.cwd();
const migration = projectMigrationInventory(target, { detailed: false });
const apply = requestedApply && !migration.unresolved;

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.env.PLUGIN_ROOT
  || path.resolve(__dirname, '..');
const bundle = path.join(pluginRoot, 'scaffold');

const missing = [];   // blocks or impairs work
const notes = [];     // worth mentioning once, not blocking
const created = [];   // files actually written by --apply

if (migration.unresolved) {
  missing.push('migration: Der Projektzustand muss vor schreibender Qatlas-Arbeit inventarisiert und '
    + 'ausdrücklich migriert werden. Führe `node qatlas-migrations.js project --target <ordner>` aus.');
  if (requestedApply) notes.push('apply: Wegen der offenen Projektmigration wurde nichts verändert.');
}

const projectUpdateState = path.join(target, '.qatlas', 'plugins', 'updates', 'state.json');
if (fs.existsSync(projectUpdateState)) {
  try {
    const state = JSON.parse(fs.readFileSync(projectUpdateState, 'utf8'));
    if (!state || typeof state !== 'object' || Array.isArray(state)
      || !state.plugins || typeof state.plugins !== 'object' || Array.isArray(state.plugins)) {
      throw new Error('erwartet wird ein JSON-Objekt mit einer plugins-Map');
    }
  } catch (error) {
    missing.push('update: ' + projectUpdateState + ' ist ungültig und bleibt unangetastet: ' + error.message);
  }
}

function has(cmd, args) {
  try { execFileSync(cmd, args, { stdio: 'pipe' }); return true; }
  catch { return false; }
}


if (!has('git', ['--version'])) {
  missing.push('git: nicht in PATH. Ohne Git gibt es weder Versionskontrolle noch Commit-Skill.');
} else {
  const isRepo = has('git', ['-C', target, 'rev-parse', '--show-toplevel']);
  if (!isRepo) {
    missing.push('git repo: Dieser Ordner ist keines. `git init` macht die Arbeitsspur wiederherstellbar.');
  }
  const identity = ['user.name', 'user.email'].filter(k => {
    const args = isRepo ? ['-C', target, 'config', k] : ['config', '--global', k];
    try { return !execFileSync('git', args, { stdio: 'pipe' }).toString().trim(); }
    catch { return true; }
  });
  if (identity.length) {
    missing.push('git identity: ' + identity.join(' und ') + ' nicht gesetzt. Erfinde nie eine Identität '
      + 'und übernimm sie nie aus der Session. Frage den Nutzer, was seine Commits tragen sollen.');
  }
}

if (!has('git', ['lfs', 'version'])) {
  notes.push('git lfs: nicht installiert. Erst relevant, wenn zone-import/ große Binärdateien aufnimmt. '
    + 'Optional, kein Defekt.');
}

const hostSettings = path.join(os.homedir(), '.claude', 'settings.json');
if (fs.existsSync(path.dirname(hostSettings))) {
  let host = {};
  try { host = JSON.parse(fs.readFileSync(hostSettings, 'utf8')); } catch { /* missing or invalid */ }
  const want = [];
  const attributionOff = host.attribution
    && host.attribution.commit === ''
    && host.attribution.pr === ''
    && host.attribution.sessionUrl === false;
  if (!attributionOff) {
    want.push('"attribution": {"commit": "", "pr": "", "sessionUrl": false}');
  }
  if (host.includeGitInstructions !== false) want.push('"includeGitInstructions": false');
  if (want.length) {
    notes.push('attribution: Der Host ergänzt eigenen Commit-Text, sofern er nicht anders konfiguriert ist. '
      + 'Setze in ' + hostSettings + ' ' + want.join(' und ') + '. Für Commits greift die Änderung sofort, '
      + 'für die Anweisung selbst in der nächsten Session.');
  }
}

const configState = readConfig(target);

if (!configState.exists) {
  if (apply) {
    try {
      createConfig();
      created.push('~/.qatlas/plugins/config.yaml');
    } catch {
      missing.push('store: ~/.qatlas/plugins/config.yaml konnte nicht angelegt werden.');
    }
  } else {
    missing.push('store: ~/.qatlas/plugins/config.yaml fehlt.');
  }
} else if (!configState.valid) {
  missing.push('store: ~/.qatlas/plugins/config.yaml oder die Projektkonfiguration ist ungültig und bleibt unangetastet.');
} else if (apply) {
  try {
    const added = topUpConfig();
    if (added.length) created.push('~/.qatlas/plugins/config.yaml: ' + added.join(', '));
  } catch {
    missing.push('store: fehlende Schlüssel in ~/.qatlas/plugins/config.yaml konnten nicht ergänzt werden.');
  }
}
for (const diagnostic of configState.diagnostics) missing.push('config: ' + diagnostic);

// User-owned: never created by --apply.
const orchestraFile = path.join(os.homedir(), '.qatlas', 'plugins', 'orchestra.yaml');
if (!fs.existsSync(orchestraFile)) {
  notes.push('orchestra: ~/.qatlas/plugins/orchestra.yaml fehlt. Für qatlas run im Setup mit '
    + 'geprüften Host-Modellen anlegen; Doctor erzeugt keine Platzhalter.');
} else {
  try {
    const orchestra = parseYamlText(fs.readFileSync(orchestraFile, 'utf8'));
    const isMap = value => value && typeof value === 'object' && !Array.isArray(value);
    if (!isMap(orchestra.profiles) || !isMap(orchestra.hosts)
      || !Object.keys(orchestra.hosts).length
      || !['light', 'standard', 'demanding'].every(name =>
        typeof orchestra.profiles[name] === 'string')) {
      throw new Error('Profile oder Hosts fehlen.');
    }
  } catch (error) {
    missing.push('orchestra: ' + orchestraFile + ' ist ungültig und bleibt unangetastet: '
      + error.message);
  }
}

const statuslineState = readStatusline();
if (statuslineState.exists && !statuslineState.valid) {
  missing.push('statusline: ' + statuslineState.statuslineFile + ': ' + statuslineState.error.message);
}

// .gitkeep only for a missing folder.
if (readConfig().config.brains.qatlas.enabled) {
  const libraryBundle = path.join(bundle, 'library');
  const library = path.join(os.homedir(), 'qatlas');
  const absentLibrary = walk(libraryBundle).filter(rel => path.basename(rel) === '.gitkeep'
    ? !fs.existsSync(path.join(library, path.dirname(rel)))
    : !fs.existsSync(path.join(library, rel)));
  for (const rel of absentLibrary) {
    const shown = '~/qatlas/' + (path.basename(rel) === '.gitkeep' ? path.dirname(rel) + '/' : rel);
    if (!apply) { missing.push('library: ' + shown + ' fehlt; qatlas-core setup ergänzt es.'); continue; }
    try {
      fs.mkdirSync(path.dirname(path.join(library, rel)), { recursive: true });
      fs.copyFileSync(path.join(libraryBundle, rel), path.join(library, rel), fs.constants.COPYFILE_EXCL);
      created.push(shown);
    } catch {
      missing.push('library: ' + shown + ' konnte nicht angelegt werden.');
    }
  }
}

// Same existence-based comparison as the SessionStart hook.
const hadScaffold = fs.existsSync(path.join(target, '.qatlas-project'));
const { absent, created: scaffoldCreated } = scaffoldTopUp(target, bundle, { apply });

if (!apply) {
  if (!fs.existsSync(path.join(target, '.qatlas-project'))) {
    missing.push('scaffold: Hier gibt es kein .qatlas-project/, also weder Backlog, Memory noch Zonen.');
  } else if (absent.length) {
    missing.push('scaffold: ' + absent.length + ' Datei(en) fehlen: ' + absent.join(', '));
  }
} else {
  created.push(...scaffoldCreated);
  if (!hadScaffold) {
    try {
      const manifest = JSON.parse(fs.readFileSync(
        path.join(pluginRoot, '.claude-plugin', 'plugin.json'), 'utf8'));
      const version = fs.readFileSync(path.join(pluginRoot, 'VERSION'), 'utf8').trim();
      if (manifest.name && /^\d+\.\d+\.\d+$/.test(version)) {
        const updateState = path.join(target, '.qatlas', 'plugins', 'updates', 'state.json');
        fs.mkdirSync(path.dirname(updateState), { recursive: true });
        fs.writeFileSync(updateState, JSON.stringify({
          format: 1,
          plugins: { [manifest.name]: version },
        }, null, 2) + '\n', { flag: 'wx', mode: 0o644 });
        created.push('.qatlas/plugins/updates/state.json');
      }
    } catch { /* a broken state file must not block safe scaffolding */ }
  }
}

// Project-local config is created only by an explicit setup.
const projectConfig = path.join(target, '.qatlas', 'plugins', 'config.yaml');
if (apply && !fs.existsSync(projectConfig)) {
  try {
    fs.mkdirSync(path.dirname(projectConfig), { recursive: true });
    fs.writeFileSync(projectConfig, 'format: 1\n', { flag: 'wx', mode: 0o644 });
    created.push('.qatlas/plugins/config.yaml');
  } catch {
    missing.push('config: .qatlas/plugins/config.yaml konnte nicht angelegt werden.');
  }
}

const gitignore = path.join(target, '.gitignore');
let ignoreText = '';
try { ignoreText = fs.readFileSync(gitignore, 'utf8'); } catch { /* no file yet */ }
const zones = ['zone-import', 'zone-export'];
const missingZones = zones.filter(zone =>
  !new RegExp('^/\\.qatlas-project/' + zone + '/\\*\\s*$', 'm').test(ignoreText));
const localMissing = !/^\/\.qatlas\/local\/\s*$/m.test(ignoreText);
if (missingZones.length || localMissing) {
  if (!apply) {
    const parts = [];
    if (missingZones.length) parts.push('Zonenregeln für ' + missingZones.join(' und '));
    if (localMissing) parts.push('Regel für .qatlas/local/');
    missing.push('.gitignore: ' + parts.join(' sowie ') + ' fehlt. Dadurch könnte lokaler oder '
      + 'vorübergehender Zustand committed werden.');
  } else {
    const add = fs.readFileSync(path.join(bundle, 'gitignore'), 'utf8').trim().split(/\r?\n\r?\n/)
      .filter(block => missingZones.some(zone => block.includes('/.qatlas-project/' + zone + '/*'))
        || (localMissing && block.includes('/.qatlas/local/')))
      .join('\n\n') + '\n';
    fs.writeFileSync(gitignore, ignoreText ? ignoreText.replace(/\s*$/, '\n\n') + add : add);
    created.push('.gitignore (ergänzt)');
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
      missing.push('scaffold: .qatlas-project/README.md überschreitet mit ' + lines + ' Zeilen und '
        + words + ' Wörtern das Budget 80/500. Die Datei bleibt unangetastet und vollständig lesbar.');
    }
  } catch (error) {
    missing.push('scaffold: .qatlas-project/README.md ist nicht lesbar: ' + error.message);
  }
}

// Existing rulesets are only reported, never touched.
const rulesets = ['AGENTS.md', 'CLAUDE.md'].filter(f => fs.existsSync(path.join(target, f)));
if (!rulesets.length) {
  if (!apply) {
    missing.push('ruleset: Weder AGENTS.md noch CLAUDE.md vorhanden. Beide werden angelegt, AGENTS.md aus '
      + 'dem Template und CLAUDE.md als Schalter @AGENTS.md.');
  } else {
    fs.writeFileSync(path.join(target, 'AGENTS.md'),
      fs.readFileSync(path.join(bundle, 'agents-template.md'), 'utf8'));
    fs.writeFileSync(path.join(target, 'CLAUDE.md'), '@AGENTS.md\n');
    created.push('AGENTS.md', 'CLAUDE.md (@AGENTS.md)');
  }
} else {
  notes.push('ruleset: ' + rulesets.join(' + ') + ' vorhanden und unangetastet.');
}

const out = [];
if (missing.length) out.push('FEHLT\n' + missing.map(m => '- ' + m).join('\n'));
if (notes.length) out.push('HINWEISE\n' + notes.map(n => '- ' + n).join('\n'));
if (created.length) out.push('ANGELEGT\n' + created.map(c => '- ' + c).join('\n'));
if (!out.length) out.push('OK: nichts fehlt.');

process.stdout.write(out.join('\n\n') + '\n');
process.exit(0);
