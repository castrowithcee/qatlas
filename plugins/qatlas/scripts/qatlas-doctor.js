#!/usr/bin/env node
'use strict';

// Prüfung für qatlas: standardmäßig nur berichten, mit --apply Fehlendes ohne Überschreiben ergänzen.
// Aufruf: node qatlas-doctor.js [--apply] [--target <dir>]

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { scaffoldTopUp } = require('./qatlas-scaffold-topup.js');
const { readSettings, createSettings, syncManagedRuleset } = require('./qatlas-settings.js');

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const flag = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const target = flag('--target') ? path.resolve(flag('--target')) : process.cwd();

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.env.PLUGIN_ROOT
  || path.resolve(__dirname, '..');
const bundle = path.join(pluginRoot, 'scaffold');

const missing = [];   // blockiert oder beeinträchtigt die Arbeit
const notes = [];     // einmal erwähnenswert, aber kein Grund zum Blockieren
const created = [];   // was --apply tatsächlich geschrieben hat

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
  try { host = JSON.parse(fs.readFileSync(hostSettings, 'utf8')); } catch { /* fehlt oder ist ungültig */ }
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

// Nutzerweite, pfadfreie Entscheidungen
const settingsState = readSettings();
const settings = settingsState.settings;

if (!settingsState.exists) {
  if (apply) {
    try {
      createSettings();
      created.push('~/.qatlas/settings.json');
    } catch {
      missing.push('store: ~/.qatlas/settings.json konnte nicht angelegt werden.');
    }
  } else {
    missing.push('store: ~/.qatlas/settings.json fehlt.');
  }
} else if (!settingsState.valid) {
  missing.push('store: ~/.qatlas/settings.json ist ungültig und bleibt unangetastet.');
}

const hadManagedRuleset = fs.existsSync(settingsState.rulesetFile);
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

// Abgelehnte Prüfungen nicht erneut melden.
const muted = new Set(Array.isArray(settings.mute) ? settings.mute : []);
for (const list of [missing, notes]) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (muted.has(list[i].split(':')[0])) list.splice(i, 1);
  }
}

// Scaffold: derselbe existenzbasierte Abgleich wie im Session-Hook.
const hadScaffold = fs.existsSync(path.join(target, '__qatlas__'));
const { absent, created: scaffoldCreated } = scaffoldTopUp(target, bundle, { apply });

if (!apply) {
  if (!fs.existsSync(path.join(target, '__qatlas__'))) {
    missing.push('scaffold: Hier gibt es kein __qatlas__/, also weder Backlog, Memory noch Zonen.');
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
        const updateState = path.join(target, '__qatlas__', 'updates', 'state.json');
        fs.mkdirSync(path.dirname(updateState), { recursive: true });
        fs.writeFileSync(updateState, JSON.stringify({
          format: 1,
          plugins: { [manifest.name]: version },
        }, null, 2) + '\n', { flag: 'wx', mode: 0o644 });
        created.push('__qatlas__/updates/state.json');
      }
    } catch { /* Ein Prüfstand darf die sichere Scaffold-Anlage nicht verhindern. */ }
  }
}

// .gitignore: nur fehlende Zonenregeln anhängen, nie Nutzerinhalt ersetzen.
const gitignore = path.join(target, '.gitignore');
let ignoreText = '';
try { ignoreText = fs.readFileSync(gitignore, 'utf8'); } catch { /* noch keine vorhanden */ }
const zones = ['zone-import', 'zone-export'];
const missingZones = zones.filter(zone =>
  !new RegExp('^/__qatlas__/' + zone + '/\\*\\s*$', 'm').test(ignoreText));
if (missingZones.length) {
  if (!apply) {
    missing.push('.gitignore: Zonenregeln fehlen für ' + missingZones.join(' und ')
      + '. Dadurch könnte vorübergehendes Material committed werden.');
  } else {
    const add = fs.readFileSync(path.join(bundle, 'gitignore'), 'utf8').trim().split(/\r?\n\r?\n/)
      .filter(block => missingZones.some(zone => block.includes('/__qatlas__/' + zone + '/*')))
      .join('\n\n') + '\n';
    fs.writeFileSync(gitignore, ignoreText ? ignoreText.replace(/\s*$/, '\n\n') + add : add);
    created.push('.gitignore (ergänzt)');
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
