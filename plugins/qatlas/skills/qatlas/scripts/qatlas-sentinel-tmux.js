#!/usr/bin/env node
'use strict';

// Steuert das Orchestrator-Fenster eines Qatlas-Sentinels in tmux. Ein Fenster gehört genau einem Repo und
// wird über dessen Root markiert; das Skript fasst nur so markierte Fenster an.
// Aufruf:
//   qatlas-sentinel-tmux.js add --repo <root> --label <fenstername> --title <titel> --cwd <ordner> -- <befehl> [argumente...]
//   qatlas-sentinel-tmux.js list --repo <root>
//   qatlas-sentinel-tmux.js title --pane <pane-id> --title <titel>
//   qatlas-sentinel-tmux.js wait --repo <root> [--timeout <sekunden>]
//   qatlas-sentinel-tmux.js close --pane <pane-id>

const fs = require('fs');
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
const repoKey = () => fs.realpathSync(path.resolve(need('--repo')[0]));

function markedWindow(repo) {
  let lines;
  try { lines = tmux(['list-windows', '-a', '-F', `#{window_id}\t#{${MARK}}`]).split('\n'); } catch { return null; }
  const hit = lines.map(line => line.split('\t')).find(([, mark]) => mark === repo);
  return hit ? hit[0] : null;
}

function panes(win) {
  return tmux(['list-panes', '-t', win, '-F', '#{pane_id}\t#{pane_title}\t#{pane_dead}'])
    .split('\n').filter(Boolean).map(line => {
      const [pane, title, dead] = line.split('\t');
      return { pane, title, dead: dead === '1' };
    });
}

function owned(pane) {
  let mark;
  try { mark = tmux(['display', '-p', '-t', pane, `#{${MARK}}`]); } catch { fail('Unbekanntes Pane: ' + pane); }
  if (!mark) fail('Pane gehört zu keinem Sentinel-Fenster: ' + pane);
}

function layout(win) {
  tmux(['if-shell', '-F', '-t', win, `#{e|<:#{window_width},${NARROW}}`,
    `select-layout -t ${win} even-vertical`, `select-layout -t ${win} tiled`]);
}

function setTitle(pane, title) {
  tmux(['set', '-p', '-t', pane, 'allow-set-title', 'off']);
  tmux(['select-pane', '-t', pane, '-T', title]);
}

function newWindow(repo, label, cwd) {
  const spawn = ['-d', '-P', '-F', '#{window_id}\t#{pane_id}', '-n', label, '-c', cwd, ...rest];
  let line;
  if (inTmux && process.env.TMUX_PANE) {
    const here = tmux(['display', '-p', '-t', process.env.TMUX_PANE, '#{session_id}:#{window_index}']);
    line = tmux(['new-window', '-a', '-t', here, ...spawn]);
  } else {
    let session = true;
    try { tmux(['has-session', '-t', SOCKET]); } catch { session = false; }
    line = session ? tmux(['new-window', '-t', SOCKET + ':', ...spawn]) : tmux(['new-session', '-s', SOCKET, ...spawn]);
  }
  const [win, pane] = line.split('\t');
  for (const [name, value] of [[MARK, repo], ['pane-border-status', 'top'], ['pane-border-format', ' #{pane_title} '],
    ['remain-on-exit', 'on'], ['automatic-rename', 'off'], ['allow-rename', 'off']]) {
    tmux(['set', '-w', '-t', win, name, value]);
  }
  tmux(['set-hook', '-w', '-t', win, 'window-resized',
    `if-shell -F "#{e|<:#{window_width},${NARROW}}" "select-layout -t ${win} even-vertical" "select-layout -t ${win} tiled"`]);
  return [win, pane];
}

function add() {
  const repo = repoKey();
  const [label, title, cwd] = need('--label', '--title', '--cwd');
  if (!rest.length) fail('Fehlt: Befehl nach --', 2);
  if (!fs.statSync(cwd, { throwIfNoEntry: false })?.isDirectory()) fail('Kein Ordner: ' + cwd);
  let win = markedWindow(repo);
  let pane;
  if (win) {
    if (panes(win).length >= MAX_PANES) fail(`Höchstens ${MAX_PANES} Orchestratoren pro Sentinel.`);
    pane = tmux(['split-window', '-d', '-P', '-F', '#{pane_id}', '-t', win, '-c', cwd, ...rest]);
  } else {
    [win, pane] = newWindow(repo, label, cwd);
  }
  setTitle(pane, title);
  layout(win);
  out({ window: win, pane, attach: inTmux ? null : `tmux -L ${SOCKET} attach` });
}

function list() {
  const win = markedWindow(repoKey());
  out({ window: win, panes: win ? panes(win) : [] });
}

async function wait() {
  const repo = repoKey();
  const timeout = Number(flag('--timeout') || 600) * 1000;
  const state = () => { const win = markedWindow(repo); return win ? panes(win) : []; };
  const before = new Map(state().map(p => [p.pane, p]));
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const changed = state().filter(p => {
      const old = before.get(p.pane);
      return !old || old.title !== p.title || old.dead !== p.dead;
    });
    if (changed.length) return out({ changed, timeout: false });
  }
  out({ changed: [], timeout: true });
}

function close() {
  const [pane] = need('--pane');
  owned(pane);
  const win = tmux(['display', '-p', '-t', pane, '#{window_id}']);
  const last = panes(win).length === 1;
  tmux(['kill-pane', '-t', pane]);
  if (!last) layout(win);
  out({ closed: pane, windowClosed: last });
}

try {
  if (command === 'add') add();
  else if (command === 'list') list();
  else if (command === 'title') { const [pane, title] = need('--pane', '--title'); owned(pane); setTitle(pane, title); out({ pane, title }); }
  else if (command === 'wait') wait().catch(error => fail(error.message));
  else if (command === 'close') close();
  else fail('Befehle: add, list, title, wait, close', 2);
} catch (error) {
  fail((error.stderr ? String(error.stderr).trim() : '') || error.message);
}
