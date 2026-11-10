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

// Own home and repo per case; PATH without gitleaks exercises the built-in pattern set.
function run(name, { home = null, project = null, staged = {}, git = true, bin = null }) {
  const base = path.join(root, name);
  const repo = path.join(base, 'repo');
  const env = { ...process.env, HOME: path.join(base, 'home'),
    PATH: [bin, gitDir, path.dirname(process.execPath)].filter(Boolean).join(':') };
  fs.mkdirSync(repo, { recursive: true });
  if (home) write(path.join(env.HOME, '.qatlas', 'plugins', 'config.json'), JSON.stringify(home));
  if (project) write(path.join(repo, '.qatlas', 'plugins', 'config.json'), JSON.stringify(project));
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

  // A staged diff above Node's 1 MiB default buffer must still be scanned.
  const large = 'lorem ipsum dolor sit amet\n'.repeat(80000);
  result = run('large-clean', { staged: { 'big.txt': large } });
  assert.strictEqual(result.status, 0);

  result = run('large-mail', { staged: { 'big.txt': large + mail['notes.md'] } });
  assert.strictEqual(result.status, 2);
  assert.match(result.stdout, /personal-data \(ask\)/);

  result = run('mail-example', { staged: { 'a.md': 'nutzer@example.com\n' } });
  assert.strictEqual(result.status, 0);

  result = run('warn', { home: { format: 1, protection: { 'personal-data': 'warn' } }, staged: mail });
  assert.strictEqual(result.status, 0);
  assert.match(result.stdout, /personal-data \(warn\)/);

  result = run('secret-warn-invalid', { home: { format: 1, protection: { secrets: 'warn' } }, staged: secret });
  assert.strictEqual(result.status, 3, 'Secrets know only block and allow.');

  result = run('disabled', {
    home: { format: 1, protection: { secrets: 'allow', 'personal-data': 'allow' } }, staged: { ...secret, ...mail },
  });
  assert.strictEqual(result.status, 0);
  assert.strictEqual(result.stdout, '');

  result = run('unknown-key', { home: { format: 1, protection: { enabled: false } }, staged: secret });
  assert.strictEqual(result.status, 1, 'An unknown key changes nothing.');

  result = run('project-override', {
    home: { format: 1, protection: { secrets: 'allow' } },
    project: { format: 1, protection: { secrets: 'block' } },
    staged: secret,
  });
  assert.strictEqual(result.status, 1);

  result = run('invalid', { home: { format: 1, protection: { secrets: 'maybe' } }, staged: secret });
  assert.strictEqual(result.status, 3);

  result = run('no-git', { git: false, staged: secret });
  assert.strictEqual(result.status, 0);

  // gitleaks before 8.19 lacks `git`; used via `protect --staged`.
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

  // A file with a single deviation keeps the shipped default for every other key and is never rewritten.
  const home = path.join(root, 'deviation');
  const own = '{ "format": 1, "protection": { "secrets": "allow" } }\n';
  write(path.join(home, '.qatlas', 'plugins', 'config.json'), own);
  const effective = execFileSync(process.execPath, ['-e',
    'process.stdout.write(JSON.stringify(require(' + JSON.stringify(loader) + ').readConfig().config.protection))'],
  { encoding: 'utf8', env: { ...process.env, HOME: home } });
  assert.deepStrictEqual(JSON.parse(effective), { secrets: 'allow', 'personal-data': 'ask' });
  assert.strictEqual(fs.readFileSync(path.join(home, '.qatlas', 'plugins', 'config.json'), 'utf8'), own);

  // An allowed finding counts only once the project config.json with protection.allow is staged.
  result = run('allow', { project: { format: 1, memory: { enable: false } }, staged: mail });
  assert.strictEqual(result.status, 2);
  const id = result.stdout.match(/\[([0-9a-f]{16})\]/)[1];
  const allowRepo = path.join(root, 'allow', 'repo');
  const allowEnv = { ...process.env, HOME: path.join(root, 'allow', 'home') };
  const recorded = spawnSync(process.execPath, [script, '--target', allowRepo, '--allow', id], { encoding: 'utf8', env: allowEnv });
  assert.strictEqual(recorded.status, 0, recorded.stdout);
  const config = JSON.parse(fs.readFileSync(path.join(allowRepo, '.qatlas', 'plugins', 'config.json'), 'utf8'));
  assert.deepStrictEqual(config.memory, { enable: false }, 'Recording keeps the other keys.');
  assert.strictEqual(config.protection.allow[0].hash, id);
  const check = () => spawnSync(process.execPath, [script, '--target', allowRepo], { encoding: 'utf8', env: allowEnv });
  assert.strictEqual(check().status, 2, 'An unstaged allowlist suppresses nothing.');
  execFileSync('git', ['-C', allowRepo, 'add', '.qatlas/plugins/config.json']);
  assert.strictEqual(check().status, 0, 'The staged allowlist suppresses the finding.');

  process.stdout.write('✓ Qatlas protection: 17 scenarios passed.\n');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
