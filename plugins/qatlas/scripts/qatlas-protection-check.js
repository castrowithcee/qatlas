#!/usr/bin/env node
'use strict';

// Prüft den gestagten Diff nach der wirksamen protection-Konfiguration auf Secrets und personenbezogene Daten.
// Aufruf: node qatlas-protection-check.js [--target <repo>] [--print-config] [--allow <kennung>]
// Exit: 0 weiter (Ausgabe nur bei warn-Befunden), 1 block, 2 ask, 3 Prüfung nicht möglich.
//
// Freigaben: Ein bestätigter Fehlalarm der Kategorie personal-data steht in
// <repo>/.qatlas/plugins/protection-allow.yaml (format: 1, Liste allow mit file, rule und hash); die Prüfung
// liest ihren gestagten Stand. hash sind die ersten 16 Hex-Zeichen von SHA-256 über file, rule und Text der
// hinzugefügten Zeile, jeweils durch NUL getrennt; die Zeilennummer zählt nicht, der Klartext steht nicht in
// der Datei. Jeder personal-data-Befund
// nennt seine Kennung (hash) in eckigen Klammern. Freigaben wirken nur bei personal-data mit ask oder warn;
// secrets und personal-data mit block lassen sich nie freigeben. --allow <kennung> trägt den gestagten Befund
// mit dieser Kennung ein (Exit 2, wenn er nicht freigebbar ist) und staged nichts. Eine ungültige
// Freigabedatei ergibt Exit 3.

const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { readConfig, locations, parseYamlText, stringifyYaml } = require('./runtime/config-loader.js');

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const target = path.resolve(flag('--target') || process.cwd());

const SECRET_RULES = [
  ['private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['aws-access-key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['gitlab-token', /\bglpat-[A-Za-z0-9_-]{20,}\b/],
  ['slack-token', /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['stripe-key', /\b(?:sk|rk)_live_[0-9A-Za-z]{20,}\b/],
  ['anthropic-key', /\bsk-ant-[A-Za-z0-9_-]{20,}\b/],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['credential-assignment',
    /\b(?:api[_-]?key|secret|token|passw(?:or)?d|client[_-]?secret)\b["']?\s*[:=]\s*["'][^"'\s$<{]{12,}["']/i],
];

const PERSONAL_RULES = [
  ['email', /\b[A-Za-z0-9._%+-]+@(?!(?:example|localhost)\b)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/],
  ['phone', /(?:^|[^\w])\+\d{1,3}[\s/-]?\(?\d{2,5}\)?(?:[\s/-]?\d{2,}){2,}/],
  ['iban', /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/],
];

function git(args) {
  return execFileSync('git', ['-C', target, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

// Liefert hinzugefügte Zeilen des gestagten Diffs als { file, line, text }.
function stagedLines() {
  const diff = git(['diff', '--cached', '--no-color', '--no-ext-diff', '--unified=0']);
  const lines = [];
  let file = null;
  let line = 0;
  for (const row of diff.split('\n')) {
    if (row.startsWith('+++ ')) { file = row.slice(4).replace(/^b\//, ''); continue; }
    const hunk = /^@@ -\S+ \+(\d+)/.exec(row);
    if (hunk) { line = Number(hunk[1]); continue; }
    if (row.startsWith('+') && file && file !== '/dev/null') lines.push({ file, line: line++, text: row.slice(1) });
  }
  return lines;
}

// Liefert Treffer als { item, file, rule, hash }; hash ist die Kennung für Freigaben.
function scan(lines, rules) {
  const found = [];
  for (const entry of lines) {
    for (const [rule, pattern] of rules) {
      if (!pattern.test(entry.text)) continue;
      const hash = crypto.createHash('sha256').update(entry.file + '\0' + rule + '\0' + entry.text)
        .digest('hex').slice(0, 16);
      found.push({ item: entry.file + ':' + entry.line + ' ' + rule, file: entry.file, rule, hash });
    }
  }
  return found;
}

// Liest die Freigabedatei aus dem Index (staged) oder für --allow aus dem Arbeitsbaum; fehlende Datei heißt
// keine Freigaben. Die Prüfung nutzt nur den gestagten Stand, damit eine ungestagte Änderung nichts unterdrückt.
function readAllow(file, staged) {
  let source;
  if (staged) {
    try { source = git(['show', ':' + path.relative(root, file).split(path.sep).join('/')]); }
    catch { return { entries: [], problems: [] }; }
  } else {
    try { source = fs.readFileSync(file, 'utf8'); }
    catch (error) {
      if (error && error.code === 'ENOENT') return { entries: [], problems: [] };
      return { entries: [], problems: [file + ': ' + error.message] };
    }
  }
  const bad = (text) => ({ entries: [], problems: [file + ': ' + text] });
  let value;
  try { value = parseYamlText(source); } catch (error) { return bad(error.message); }
  const unknown = Object.keys(value).filter(key => key !== 'format' && key !== 'allow');
  if (unknown.length) return bad('unbekannte Schlüssel: ' + unknown.join(', '));
  const list = value.allow === undefined || value.allow === null ? [] : value.allow;
  if (!Array.isArray(list)) return bad('allow muss eine Liste sein.');
  const entries = [];
  for (const entry of list) {
    const valid = entry && typeof entry === 'object' && !Array.isArray(entry)
      && Object.keys(entry).length === 3
      && ['file', 'rule', 'hash'].every(key => typeof entry[key] === 'string' && entry[key]);
    if (!valid) return bad('jeder Eintrag in allow braucht genau die Strings file, rule und hash.');
    entries.push({ file: entry.file, rule: entry.rule, hash: entry.hash });
  }
  return { entries, problems: [] };
}

// Nutzt gitleaks, wenn installiert: ab 8.19 `git --staged`, davor `protect --staged`.
// null bedeutet, dass der eingebaute Mustersatz greift.
function gitleaks() {
  const report = path.join(os.tmpdir(), 'qatlas-gitleaks-' + process.pid + '.json');
  const options = ['--redact', '--no-banner', '--report-format', 'json', '--report-path', report];
  const variants = [['git', '--staged', ...options, root], ['protect', '--staged', ...options, '--source', root]];
  for (const args of variants) {
    const result = spawnSync('gitleaks', args, { encoding: 'utf8' });
    try {
      if (result.error) return null;
      if (result.status !== 0 && result.status !== 1) continue;
      const findings = JSON.parse(fs.readFileSync(report, 'utf8') || '[]');
      return findings.map(item => ({ item: item.File + ':' + item.StartLine + ' ' + item.RuleID }));
    } catch {
      // Ohne lesbaren Bericht kennt diese Version den Aufruf nicht; die ältere Variante folgt.
      continue;
    } finally {
      try { fs.unlinkSync(report); } catch { /* Kein Bericht entstanden. */ }
    }
  }
  return null;
}

let root = null;
try { root = git(['rev-parse', '--show-toplevel']).trim(); } catch { /* Kein Git-Repo. */ }

const state = readConfig(root || target);
if (!state.protectionValid) {
  process.stdout.write('protection: Prüfung nicht möglich, Konfiguration ungültig.\n'
    + state.diagnostics.map(line => '- ' + line).join('\n') + '\n');
  process.exit(3);
}
const protection = state.config.protection;
if (argv.includes('--print-config')) {
  process.stdout.write(JSON.stringify(protection) + '\n');
  process.exit(0);
}
if (!protection.enabled) process.exit(0);

if (!root) process.exit(0);

let lines;
try {
  lines = stagedLines();
} catch {
  process.stdout.write('protection: Prüfung nicht möglich, gestagter Diff nicht lesbar.\n');
  process.exit(3);
}

const allowFile = locations(root).allowFile;
const allow = readAllow(allowFile, !argv.includes('--allow'));
if (allow.problems.length) {
  process.stdout.write('protection: Prüfung nicht möglich, Freigabedatei ungültig.\n'
    + allow.problems.map(line => '- ' + line).join('\n') + '\n');
  process.exit(3);
}
// Freigaben wirken ausschließlich auf personal-data mit ask oder warn.
const allowable = ['ask', 'warn'].includes(protection['personal-data']);

const allowHash = flag('--allow');
if (argv.includes('--allow')) {
  const hit = allowHash && allowable
    ? scan(lines, PERSONAL_RULES).find(entry => entry.hash === allowHash) : null;
  if (!hit) {
    process.stdout.write('protection: Kennung ' + (allowHash || '(fehlt)') + ' ist im gestagten Diff kein '
      + 'freigebbarer personal-data-Befund (nur ask oder warn); nichts eingetragen.\n');
    process.exit(2);
  }
  const known = allow.entries.some(e => e.file === hit.file && e.rule === hit.rule && e.hash === hit.hash);
  if (!known) {
    const entries = allow.entries.concat([{ file: hit.file, rule: hit.rule, hash: hit.hash }]);
    fs.mkdirSync(path.dirname(allowFile), { recursive: true });
    fs.writeFileSync(allowFile, stringifyYaml({ format: 1, allow: entries }));
  }
  process.stdout.write(allowFile + '\n');
  process.exit(0);
}

const results = [];
if (protection.secrets !== 'allow') {
  results.push(['secrets', protection.secrets, gitleaks() || scan(lines, SECRET_RULES)]);
}
if (protection['personal-data'] !== 'allow') {
  const found = scan(lines, PERSONAL_RULES)
    .filter(hit => !(allowable
      && allow.entries.some(e => e.file === hit.file && e.rule === hit.rule && e.hash === hit.hash)))
    .map(hit => ({ item: hit.item + ' [' + hit.hash + ']' }));
  results.push(['personal-data', protection['personal-data'], found]);
}

const hits = results.filter(([, , found]) => found.length);
if (!hits.length) process.exit(0);

for (const [category, level, found] of hits) {
  process.stdout.write(category + ' (' + level + '):\n' + found.map(hit => '- ' + hit.item).join('\n') + '\n');
}
const levels = hits.map(([, level]) => level);
process.exit(levels.includes('block') ? 1 : levels.includes('ask') ? 2 : 0);
