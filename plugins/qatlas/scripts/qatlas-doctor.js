#!/usr/bin/env node
'use strict';

// Prüft Qatlas und berichtet standardmäßig; ergänzt mit --apply Fehlendes ohne Überschreiben.
// Aufruf: node qatlas-doctor.js [--apply] [--target <ordner>]

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { scaffoldTopUp } = require('./qatlas-scaffold-topup.js');
const { projectMigrationInventory } = require('./qatlas-migrations.js');
const {
  createConfig,
  readConfig,
  readStatusline,
  syncManagedRuleset,
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

const missing = [];   // Blockiert oder beeinträchtigt die Arbeit.
const notes = [];     // Einmal erwähnenswert, aber kein Grund zum Blockieren.
const created = [];   // Tatsächlich durch --apply geschriebene Dateien.

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

// Umgebung

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

// Claude-Einstellungen nur lesen und unerwünschte Commit-Attribution melden.
const hostSettings = path.join(os.homedir(), '.claude', 'settings.json');
if (fs.existsSync(path.dirname(hostSettings))) {
  let host = {};
  try { host = JSON.parse(fs.readFileSync(hostSettings, 'utf8')); } catch { /* Fehlt oder ist ungültig. */ }
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

// Nutzerweite, pfadunabhängige Entscheidungen.
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
}
for (const diagnostic of configState.diagnostics) missing.push('config: ' + diagnostic);

const statuslineState = readStatusline();
if (statuslineState.exists && !statuslineState.valid) {
  missing.push('statusline: ' + statuslineState.statuslineFile + ': ' + statuslineState.error.message);
}

const hadManagedRuleset = fs.existsSync(configState.rulesetFile);
if (apply) {
  try {
    const synced = syncManagedRuleset(pluginRoot);
    if (synced.created) created.push('~/.qatlas/rules/RULESET.md');
  } catch {
    missing.push('store: ~/.qatlas/rules/RULESET.md konnte nicht aktualisiert werden.');
  }
} else if (!hadManagedRuleset) {
  missing.push('store: ~/.qatlas/rules/RULESET.md fehlt.');
}

// Scaffold: derselbe existenzbasierte Abgleich wie im SessionStart-Hook.
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
    } catch { /* Eine defekte Zustandsdatei darf die sichere Scaffold-Anlage nicht verhindern. */ }
  }
}

// Projektlokale Plugin-Konfiguration entsteht nur beim ausdrücklich gestarteten Setup.
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

// .gitignore: nur fehlende Qatlas-Regeln anhängen und Nutzerinhalt nie ersetzen.
const gitignore = path.join(target, '.gitignore');
let ignoreText = '';
try { ignoreText = fs.readFileSync(gitignore, 'utf8'); } catch { /* Noch keine Datei vorhanden. */ }
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

// Neue Repos erhalten AGENTS.md plus CLAUDE.md als @AGENTS.md-Schalter. Vorhandene Rulesets nur melden.
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
