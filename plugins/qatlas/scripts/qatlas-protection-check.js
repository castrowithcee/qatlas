#!/usr/bin/env node
'use strict';

// Scans the staged diff for secrets and personal data per the effective protection config.
// Usage: node qatlas-protection-check.js [--target <repo>] [--print-config] [--allow <id>]
// Exit: 0 proceed (output only for warn findings), 1 block, 2 ask, 3 check not possible.
//
// Allowlist: a confirmed personal-data false positive lives in
// <repo>/.qatlas/plugins/protection-allow.yaml (format: 1, list `allow` with file, rule, hash); the check
// reads the staged version. hash = first 16 hex chars of SHA-256 over file NUL rule NUL text of the
// added line; the line number does not count and the plain text is not stored in the file.
// Every personal-data finding prints its id (hash) in square brackets. Only personal-data with ask or warn
// can be allowed; secrets and personal-data with block never can. --allow <id> records the staged finding
// with that id (exit 2 if not allowable) and stages nothing. An invalid allowlist file yields exit 3.

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

// Staged copy only, so an unstaged edit cannot suppress a finding; --allow reads the working tree.
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

// gitleaks if installed: `git --staged` from 8.19, `protect --staged` before.
// null: built-in pattern set applies.
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
      // No readable report: this version does not know the call; try the older one.
      continue;
    } finally {
      try { fs.unlinkSync(report); } catch { /* no report written */ }
    }
  }
  return null;
}

let root = null;
try { root = git(['rev-parse', '--show-toplevel']).trim(); } catch { /* not a git repo */ }

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
