#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const script = path.resolve(__dirname, '..', 'plugins', 'qatlas', 'scripts', 'qatlas-protection-check.js');
const loader = path.resolve(__dirname, '..', 'plugins', 'qatlas', 'scripts', 'runtime', 'config-loader.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qatlas-protection-'));
const gitDir = path.dirname(execFileSync('which', ['git'], { encoding: 'utf8' }).trim());

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

// Jeder Fall erhält ein eigenes Home und Repo; PATH ohne gitleaks prüft den eingebauten Mustersatz.
function run(name, { home = '', project = null, staged = {}, git = true, bin = null }) {
  const base = path.join(root, name);
  const repo = path.join(base, 'repo');
  const env = { ...process.env, HOME: path.join(base, 'home'),
    PATH: [bin, gitDir, path.dirname(process.execPath)].filter(Boolean).join(':') };
  fs.mkdirSync(repo, { recursive: true });
  if (home) write(path.join(env.HOME, '.qatlas', 'plugins', 'config.yaml'), home);
  if (project) write(path.join(repo, '.qatlas', 'plugins', 'config.yaml'), project);
  if (git) execFileSync('git', ['init', '-q', repo]);
  for (const [file, content] of Object.entries(staged)) {
    write(path.join(repo, file), content);
    if (git) execFileSync('git', ['-C', repo, 'add', file]);
  }
  return spawnSync(process.execPath, [script, '--target', repo], { encoding: 'utf8', env });
}

const secret = { 'app.env': 'GITHUB_TOKEN=ghp_' + 'a'.repeat(36) + '\n' };
const mail = { 'notes.md': 'Kontakt: anna.muster@firma.de\n' };

try {
  let result = run('clean', { staged: { 'a.txt': 'hallo\n' } });
  assert.strictEqual(result.status, 0);
  assert.strictEqual(result.stdout, '');

  result = run('secret-default', { staged: secret });
  assert.strictEqual(result.status, 1);
  assert.match(result.stdout, /secrets \(block\)[\s\S]*app\.env:1 github-token/);

  result = run('mail-default', { staged: mail });
  assert.strictEqual(result.status, 2);
  assert.match(result.stdout, /personal-data \(ask\)/);

  result = run('mail-example', { staged: { 'a.md': 'nutzer@example.com\n' } });
  assert.strictEqual(result.status, 0);

  result = run('warn', { home: 'format: 1\nprotection:\n  secrets: warn\n', staged: secret });
  assert.strictEqual(result.status, 0);
  assert.match(result.stdout, /secrets \(warn\)/);

  result = run('disabled', { home: 'format: 1\nprotection:\n  enabled: false\n', staged: { ...secret, ...mail } });
  assert.strictEqual(result.status, 0);
  assert.strictEqual(result.stdout, '');

  result = run('project-override', {
    home: 'format: 1\nprotection:\n  secrets: allow\n',
    project: 'format: 1\nprotection:\n  secrets: block\n',
    staged: secret,
  });
  assert.strictEqual(result.status, 1);

  result = run('invalid', { home: 'format: 1\nprotection:\n  secrets: maybe\n', staged: secret });
  assert.strictEqual(result.status, 3);

  result = run('no-git', { git: false, staged: secret });
  assert.strictEqual(result.status, 0);

  // Ein gitleaks vor 8.19 kennt `git` nicht und wird über `protect --staged` genutzt.
  const bin = path.join(root, 'old-gitleaks-bin');
  write(path.join(bin, 'gitleaks'), [
    '#!/bin/sh',
    '[ "$1" = protect ] || exit 1',
    'while [ $# -gt 0 ]; do [ "$1" = --report-path ] && report="$2"; shift; done',
    'echo \'[{"File":"a.txt","StartLine":1,"RuleID":"old-gitleaks"}]\' > "$report"',
    'exit 1',
  ].join('\n') + '\n');
  fs.chmodSync(path.join(bin, 'gitleaks'), 0o755);
  result = run('old-gitleaks', { bin, staged: { 'a.txt': 'hallo\n' } });
  assert.strictEqual(result.status, 1);
  assert.match(result.stdout, /a\.txt:1 old-gitleaks/);

  // Top-up ergänzt fehlende Schlüssel und erhält gesetzte Werte samt Kommentar.
  const home = path.join(root, 'topup');
  write(path.join(home, '.qatlas', 'plugins', 'config.yaml'), 'format: 1\n# eigener Kommentar\nprotection:\n  secrets: warn\n');
  const added = execFileSync(process.execPath, ['-e',
    'process.stdout.write(JSON.stringify(require(' + JSON.stringify(loader) + ').topUpConfig()))'],
  { encoding: 'utf8', env: { ...process.env, HOME: home } });
  assert.ok(JSON.parse(added).includes('protection.personal-data'));
  const text = fs.readFileSync(path.join(home, '.qatlas', 'plugins', 'config.yaml'), 'utf8');
  assert.match(text, /# eigener Kommentar/);
  assert.match(text, /secrets: warn/);

  process.stdout.write('✓ Qatlas-Protection: 11 Szenarien erfolgreich.\n');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
