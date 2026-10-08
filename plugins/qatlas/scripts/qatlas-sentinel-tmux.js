#!/usr/bin/env node
'use strict';

// Steuert das tmux-Fenster eines Qatlas-Sentinels. Fasst nur Fenster an, die es selbst markiert hat.
// Aufruf:
//   qatlas-sentinel-tmux.js dir [--target <repo>]
//   qatlas-sentinel-tmux.js add --window <lauf-id> --label <fenstername> --title <titel> --cwd <ordner> -- <befehl> [argumente...]
//   qatlas-sentinel-tmux.js title --pane <pane-id> --title <titel>
//   qatlas-sentinel-tmux.js list --window <lauf-id>
//   qatlas-sentinel-tmux.js close --pane <pane-id>
//   qatlas-sentinel-tmux.js wait --dir <statusordner> [--window <lauf-id>] [--timeout <sekunden>]

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const MAX_PANES = 4;
const NARROW = 80;
const MARK = '@qatlas-sentinel';
const SOCKET = 'qatlas-sentinel';

const argv = process.argv.slice(2);
const command = argv[0];
const sep = argv.indexOf('--');
const opts = sep >= 0 ? argv.slice(1, sep) : argv.slice(1);
const rest = sep >= 0 ? argv.slice(sep + 1) : [];
const flag = name => { const i = opts.indexOf(name); return i >= 0 ? opts[i + 1] : null; };

const inTmux = Boolean(process.env.TMUX);
const tmux = args => execFileSync('tmux', inTmux ? args : ['-L', SOCKET, ...args],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const out = value => process.stdout.write(JSON.stringify(value) + '\n');
const fail = (message, code = 1) => { process.stderr.write(message + '\n'); process.exit(code); };
const need = (...names) => names.map(name => flag(name) || fail('Fehlt: ' + name, 2));

function markedWindow(id) {
  let lines;
  try { lines = tmux(['list-windows', '-a', '-F', `#{window_id}\t#{${MARK}}`]).split('\n'); } catch { return null; }
  const hit = lines.map(line => line.split('\t')).find(([, mark]) => mark === id);
  return hit ? hit[0] : null;
}

function ownedPane(pane) {
  let mark;
  try { mark = tmux(['display', '-p', '-t', pane, `#{${MARK}}`]); } catch { fail('Unbekanntes Pane: ' + pane); }
  if (!mark) fail('Pane gehört zu keinem Sentinel-Fenster: ' + pane);
  return mark;
}

function layout(win) {
  tmux(['if-shell', '-F', '-t', win, `#{e|<:#{window_width},${NARROW}}`,
    `select-layout -t ${win} even-vertical`, `select-layout -t ${win} tiled`]);
}

function setTitle(pane, title) {
  tmux(['set', '-p', '-t', pane, 'allow-set-title', 'off']);
  tmux(['select-pane', '-t', pane, '-T', title]);
}

function newWindow(id, label, cwd) {
  const spawn = ['-d', '-P', '-F', '#{window_id}\t#{pane_id}', '-n', label, '-c', cwd, ...rest];
  let line;
  if (inTmux && process.env.TMUX_PANE) {
    const here = tmux(['display', '-p', '-t', process.env.TMUX_PANE, '#{session_id}:#{window_index}']);
    line = tmux(['new-window', '-a', '-t', here, ...spawn]);
  } else {
    let session = true;
    try { tmux(['has-session', '-t', SOCKET]); } catch { session = false; }
    line = session ? tmux(['new-window', '-t', SOCKET + ':', ...spawn])
      : tmux(['new-session', '-s', SOCKET, ...spawn]);
  }
  const [win, pane] = line.split('\t');
  for (const [name, value] of [[MARK, id], ['pane-border-status', 'top'], ['pane-border-format', ' #{pane_title} '],
    ['remain-on-exit', 'on'], ['automatic-rename', 'off'], ['allow-rename', 'off']]) {
    tmux(['set', '-w', '-t', win, name, value]);
  }
  tmux(['set-hook', '-w', '-t', win, 'window-resized',
    `if-shell -F "#{e|<:#{window_width},${NARROW}}" "select-layout -t ${win} even-vertical" "select-layout -t ${win} tiled"`]);
  return [win, pane];
}

function add() {
  const [id, label, title, cwd] = need('--window', '--label', '--title', '--cwd');
  if (!rest.length) fail('Fehlt: Befehl nach --', 2);
  if (!fs.statSync(cwd, { throwIfNoEntry: false })?.isDirectory()) fail('Kein Ordner: ' + cwd);
  let win = markedWindow(id);
  let pane;
  if (win) {
    if (Number(tmux(['display', '-p', '-t', win, '#{window_panes}'])) >= MAX_PANES) {
      fail(`Höchstens ${MAX_PANES} Orchestratoren pro Sentinel.`);
    }
    pane = tmux(['split-window', '-d', '-P', '-F', '#{pane_id}', '-t', win, '-c', cwd, ...rest]);
  } else {
    [win, pane] = newWindow(id, label, cwd);
  }
  setTitle(pane, title);
  layout(win);
  out({ window: win, pane, attach: inTmux ? null : `tmux -L ${SOCKET} attach` });
}

function list() {
  const [id] = need('--window');
  const win = markedWindow(id);
  if (!win) return out({ window: null, panes: [] });
  const panes = tmux(['list-panes', '-t', win, '-F', '#{pane_id}\t#{pane_title}\t#{pane_dead}\t#{pane_dead_status}'])
    .split('\n').filter(Boolean).map(line => {
      const [pane, title, dead, status] = line.split('\t');
      return { pane, title, dead: dead === '1', exit: dead === '1' ? Number(status) : null };
    });
  out({ window: win, panes });
}

function close() {
  const [pane] = need('--pane');
  ownedPane(pane);
  const win = tmux(['display', '-p', '-t', pane, '#{window_id}']);
  const last = tmux(['display', '-p', '-t', win, '#{window_panes}']) === '1';
  tmux(['kill-pane', '-t', pane]);
  if (!last) layout(win);
  out({ closed: pane, windowClosed: last });
}

function stateDir() {
  const target = path.resolve(flag('--target') || process.cwd());
  const git = args => execFileSync('git', ['-C', target, ...args], { encoding: 'utf8' }).trim();
  let common;
  let primary;
  try {
    common = fs.realpathSync(path.resolve(target, git(['rev-parse', '--git-common-dir'])));
    primary = git(['worktree', 'list', '--porcelain']).split('\n')[0].replace(/^worktree /, '');
  } catch {
    fail('Kein Git-Repo: ' + target);
  }
  const key = crypto.createHash('sha256').update(common).digest('hex').slice(0, 8);
  const slug = path.basename(primary).toLowerCase().normalize('NFKD').replace(/[^\x00-\x7f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'repo';
  out({ dir: path.join(os.homedir(), '.qatlas', 'state', 'sentinel', slug + '-' + key) });
}

function snapshot(dir) {
  const files = new Map();
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith('.status')) files.set(name, fs.statSync(path.join(dir, name)).mtimeMs);
  }
  return files;
}

function deadPanes(id) {
  const win = id && markedWindow(id);
  if (!win) return [];
  return tmux(['list-panes', '-t', win, '-F', '#{pane_id}\t#{pane_title}\t#{pane_dead}'])
    .split('\n').map(line => line.split('\t')).filter(([, , dead]) => dead === '1')
    .map(([pane, title]) => ({ pane, title }));
}

async function wait() {
  const [dir] = need('--dir');
  const id = flag('--window');
  const timeout = Number(flag('--timeout') || 600) * 1000;
  if (!fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory()) fail('Kein Ordner: ' + dir);
  const before = snapshot(dir);
  const deadBefore = new Set(deadPanes(id).map(p => p.pane));
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const changed = [...snapshot(dir)].filter(([name, mtime]) => before.get(name) !== mtime)
      .map(([name]) => ({ task: name.replace(/\.status$/, ''),
        status: fs.readFileSync(path.join(dir, name), 'utf8').split('\n')[0].trim() }));
    const dead = deadPanes(id).filter(p => !deadBefore.has(p.pane));
    if (changed.length || dead.length) return out({ changed, dead, timeout: false });
  }
  out({ changed: [], dead: [], timeout: true });
}

try {
  if (command === 'dir') stateDir();
  else if (command === 'add') add();
  else if (command === 'title') { const [pane, title] = need('--pane', '--title'); ownedPane(pane); setTitle(pane, title); out({ pane, title }); }
  else if (command === 'list') list();
  else if (command === 'close') close();
  else if (command === 'wait') wait().catch(error => fail(error.message));
  else fail('Befehle: dir, add, title, list, close, wait', 2);
} catch (error) {
  fail((error.stderr ? String(error.stderr).trim() : '') || error.message);
}
