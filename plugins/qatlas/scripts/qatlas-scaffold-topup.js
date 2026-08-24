'use strict';

// Gemeinsamer Scaffold-Abgleich für Doctor und Session-Hook. Kopiert nur fehlende Dateien.

const fs = require('fs');
const path = require('path');

function walk(dir, base = dir) {
  let out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyMissing(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  try {
    fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
    return true;
  } catch (error) {
    if (error && error.code === 'EEXIST') return false;
    throw error;
  }
}

// apply=false berichtet, apply=true ergänzt. Vorhandene Dateien bleiben unangetastet.
function scaffoldTopUp(target, bundle, { apply = false, only = null, exclude = [] } = {}) {
  const base = path.join(bundle, '__qatlas__');
  const selected = walk(base).filter(rel => (!only || only.includes(rel)) && !exclude.includes(rel));
  const absent = selected.filter(rel => !fs.existsSync(path.join(target, '__qatlas__', rel)));
  const created = [];
  if (apply) {
    for (const rel of absent) {
      if (copyMissing(path.join(base, rel), path.join(target, '__qatlas__', rel))) {
        created.push('__qatlas__/' + rel);
      }
    }
  }
  return { absent, created };
}

module.exports = { walk, copy, scaffoldTopUp };
