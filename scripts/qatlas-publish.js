#!/usr/bin/env node
'use strict';

// Aufruf: node scripts/qatlas-publish.js [plugin] [major|minor|patch] [version]
//   (--project-update | --no-project-update)
// Positionsargumente sind optional und positionsunabhängig. Standard ist `qatlas patch`.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const LEVELS = ['major', 'minor', 'patch'];
const FLAGS = ['--project-update', '--no-project-update'];
const positional = args.filter(argument => !argument.startsWith('--'));
const unknownFlags = args.filter(argument => argument.startsWith('--') && !FLAGS.includes(argument));
const explicitVersion = positional.find(argument => /^\d+\.\d+\.\d+$/.test(argument)) || null;
const level = (positional.find(argument => LEVELS.includes(argument.toLowerCase())) || 'patch').toLowerCase();
const plugin = positional.find(argument => !/^\d+\.\d+\.\d+$/.test(argument)
  && !LEVELS.includes(argument.toLowerCase())) || 'qatlas';
const projectUpdate = args.includes('--project-update');
const noProjectUpdate = args.includes('--no-project-update');

if (unknownFlags.length) {
  console.error('✗ Unbekannte Option(en): ' + unknownFlags.join(', '));
  process.exit(1);
}
if (projectUpdate === noProjectUpdate) {
  console.error('✗ Gib genau eine Entscheidung an: --project-update oder --no-project-update.');
  process.exit(1);
}

const PLUGIN = `plugins/${plugin}`;
const MANIFESTS = [`${PLUGIN}/.claude-plugin/plugin.json`, `${PLUGIN}/.codex-plugin/plugin.json`];
const VERSION_FILE = `${PLUGIN}/VERSION`;

for (const rel of [PLUGIN, VERSION_FILE, ...MANIFESTS]) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    console.error(`✗ Plugin '${plugin}' nicht gefunden: ${rel} fehlt.`);
    process.exit(1);
  }
}

function git(args, allowFail = false) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT, encoding: 'utf8',
      ...(allowFail ? { stdio: ['ignore', 'pipe', 'ignore'] } : {}),
    }).trim();
  } catch (e) {
    if (allowFail) return null;
    throw e;
  }
}

const stagedBefore = git(['diff', '--cached', '--name-only']);
if (stagedBefore) {
  console.error('✗ Der Git-Index enthält bereits Änderungen. Committe oder entferne sie vor dem Release.');
  process.exit(1);
}

const branch = git(['symbolic-ref', '--short', 'HEAD'], true);
if (!branch) {
  console.error('✗ Ein Release braucht einen Branch, nicht einen detached HEAD.');
  process.exit(1);
}
const remotes = (git(['remote'], true) || '').split('\n').filter(Boolean);
const configuredRemote = git(['config', '--get', `branch.${branch}.remote`], true);
const remote = configuredRemote || (remotes.includes('origin') ? 'origin' : remotes[0]);
const remoteBranch = git(['config', '--get', `branch.${branch}.merge`], true) || `refs/heads/${branch}`;
if (remote && !remoteBranch.startsWith('refs/heads/')) {
  console.error('✗ Der Upstream muss ein Branch sein: ' + remoteBranch);
  process.exit(1);
}
if (remote) {
  git(['fetch', '--tags', remote]);
  const tracking = `refs/remotes/${remote}/${remoteBranch.slice('refs/heads/'.length)}`;
  if (git(['rev-parse', '--verify', tracking], true)
    && git(['merge-base', '--is-ancestor', tracking, 'HEAD'], true) === null) {
    console.error('✗ Der Remote-Branch ist weitergelaufen. Vor dem Publish integrieren.');
    process.exit(1);
  }
}

const year = new Date().getUTCFullYear();
const releaseTags = (git(['tag', '--list', `v${year}.*.0`]) || '').split('\n');
const releaseNumbers = releaseTags.map(tag => tag.match(new RegExp(`^v${year}\\.(\\d+)\\.0$`)))
  .filter(Boolean).map(match => Number(match[1]));
const lastRelease = releaseNumbers.reduce((highest, number) => Math.max(highest, number), 0);
const marketplaceTag = `v${year}.${lastRelease + 1}.0`;

// VERSION ist die Quelle für beide Host-Manifeste. Erst berechnen, noch nichts schreiben.
function resolveVersion() {
  const cur = fs.readFileSync(path.join(ROOT, VERSION_FILE), 'utf8').trim();
  const m = cur.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) {
    console.error(`✗ Ungültige Version in ${VERSION_FILE}: ${cur || '(leer)'}`);
    process.exit(1);
  }
  const [maj, min, pat] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let next;
  if (explicitVersion) next = explicitVersion;
  else if (level === 'major') next = `${maj + 1}.0.0`;
  else if (level === 'minor') next = `${maj}.${min + 1}.0`;
  else next = `${maj}.${min}.${pat + 1}`;
  const currentParts = [maj, min, pat];
  const nextParts = next.split('.').map(Number);
  const firstDifference = nextParts.findIndex((part, index) => part !== currentParts[index]);
  if (firstDifference < 0 || nextParts[firstDifference] < currentParts[firstDifference]) {
    console.error(`✗ Plugin-Version muss steigen: ${cur} -> ${next}.`);
    process.exit(1);
  }
  return next;
}

const version = resolveVersion();
const updatesDir = path.join(ROOT, PLUGIN, 'updates');
const draftUpdate = path.join(updatesDir, 'NEXT.md');
const releaseUpdate = path.join(updatesDir, version + '.md');

if (projectUpdate) {
  if (!fs.existsSync(draftUpdate) || !fs.readFileSync(draftUpdate, 'utf8').trim()) {
    console.error(`✗ --project-update verlangt eine nicht leere ${PLUGIN}/updates/NEXT.md.`);
    process.exit(1);
  }
  if (fs.existsSync(releaseUpdate)) {
    console.error(`✗ Update-Anweisung existiert bereits: ${PLUGIN}/updates/${version}.md`);
    process.exit(1);
  }
} else if (fs.existsSync(draftUpdate)) {
  console.error(`✗ ${PLUGIN}/updates/NEXT.md ist vorhanden. Nutze --project-update oder entferne den Entwurf bewusst.`);
  process.exit(1);
}

const stampedManifests = MANIFESTS.map(rel => {
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, 'utf8');
  if (!/("version":\s*")[^"]*(")/.test(original)) {
    console.error(`✗ Kein version-Feld in ${rel}.`);
    process.exit(1);
  }
  return [file, original.replace(/("version":\s*")[^"]*(")/, `$1${version}$2`)];
});

if (projectUpdate) fs.renameSync(draftUpdate, releaseUpdate);
fs.writeFileSync(path.join(ROOT, VERSION_FILE), version + '\n');
for (const [file, text] of stampedManifests) fs.writeFileSync(file, text);
console.log(`✓ ${plugin} ${version} gestempelt (VERSION + ${MANIFESTS.length} Manifeste`
  + (projectUpdate ? ' + Update-Anweisung).' : ').'));

git(['add', '--', PLUGIN]);
if (!git(['diff', '--cached', '--name-only'])) {
  console.log('- Nichts zu veröffentlichen.');
  process.exit(0);
}

git(['commit', '-m', `Release ${plugin} ${version}`]);
git(['tag', marketplaceTag]);
if (!remote) {
  console.log(`✓ Lokal committet und ${marketplaceTag} gesetzt, Push übersprungen (kein Remote). Release ${plugin} ${version}`);
  process.exit(0);
}

const hasUpstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], true);
const pushArgs = ['push', '--atomic'];
if (!hasUpstream) pushArgs.push('-u');
pushArgs.push(remote, `HEAD:${remoteBranch}`, `refs/tags/${marketplaceTag}:refs/tags/${marketplaceTag}`);
git(pushArgs);
console.log(`✓ Committet, ${marketplaceTag} gesetzt und beides gepusht. Release ${plugin} ${version}`);
