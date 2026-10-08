#!/usr/bin/env node
'use strict';

// Steuert das Orchestrator-Fenster eines Qatlas-Sentinels in tmux. Ein Fenster gehört genau einem Repo und
// wird über dessen Root markiert; das Skript fasst nur so markierte Fenster an. Ein Pane wird über Repo und
// Paket adressiert, weil Hosts wie Codex Befehle nicht zuverlässig mit der Umgebung des Panes ausführen.
// Aufruf:
//   qatlas-sentinel-tmux.js add --repo <root> --package <paket> --label <fenstername> --title <titel> --cwd <ordner> -- <befehl> [argumente...]
//   qatlas-sentinel-tmux.js list --repo <root>
//   qatlas-sentinel-tmux.js wait --repo <root> [--timeout <sekunden>]
//   qatlas-sentinel-tmux.js title --repo <root> --package <paket> --title <titel>
//   qatlas-sentinel-tmux.js ask --repo <root> --package <paket> --question <frage> [--timeout <sekunden>]
//   qatlas-sentinel-tmux.js answer --repo <root> --package <paket> --answer <antwort>
//   qatlas-sentinel-tmux.js close --repo <root> --package <paket>

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
      const question = option(pane, '@qatlas-question');
      return { pane, package: option(pane, '@qatlas-package'), title, dead: dead === '1',
        ...(question ? { question } : {}) };
    });
}

const option = (pane, name) => tmux(['display', '-p', '-t', pane, `#{${name}}`]);
const setOption = (pane, name, value) => tmux(['set', '-p', '-t', pane, name, value]);

function target() {
  const repo = repoKey();
  const [name] = need('--package');
  const win = markedWindow(repo);
  const hit = win && panes(win).find(p => p.package === name);
  if (!hit) fail(`Kein Pane für Paket ${name} im Sentinel-Fenster von ${repo}`);
  return hit.pane;
}

function layout(win) {
  tmux(['if-shell', '-F', '-t', win, `#{e|<:#{window_width},${NARROW}}`,
    `select-layout -t ${win} even-vertical`, `select-layout -t ${win} tiled`]);
}

function setTitle(pane, title) {
  setOption(pane, 'allow-set-title', 'off');
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
  const [name, label, title, cwd] = need('--package', '--label', '--title', '--cwd');
  if (!rest.length) fail('Fehlt: Befehl nach --', 2);
  if (!fs.statSync(cwd, { throwIfNoEntry: false })?.isDirectory()) fail('Kein Ordner: ' + cwd);
  let win = markedWindow(repo);
  let pane;
  if (win && panes(win).some(p => p.package === name)) fail('Paket hat bereits ein Pane: ' + name);
  if (win) {
    if (panes(win).length >= MAX_PANES) fail(`Höchstens ${MAX_PANES} Orchestratoren pro Sentinel.`);
    pane = tmux(['split-window', '-d', '-P', '-F', '#{pane_id}', '-t', win, '-c', cwd, ...rest]);
  } else {
    [win, pane] = newWindow(repo, label, cwd);
  }
  setOption(pane, '@qatlas-package', name);
  setOption(pane, '@qatlas-title', title);
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

// Stellt dem Sentinel eine Frage und wartet auf seine Antwort. Ein erneuter Aufruf mit derselben Frage
// wartet weiter, ohne eine inzwischen eingetroffene Antwort zu verwerfen.
async function ask() {
  const pane = target();
  const [question] = need('--question');
  const timeout = Number(flag('--timeout') || 100) * 1000;
  const title = option(pane, '@qatlas-title') || option(pane, 'pane_title');
  if (option(pane, '@qatlas-question') !== question) {
    setOption(pane, '@qatlas-answer', '');
    setOption(pane, '@qatlas-question', question);
    setTitle(pane, 'FRAGE · ' + title);
  }
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const answer = option(pane, '@qatlas-answer');
    if (answer) {
      for (const name of ['@qatlas-question', '@qatlas-answer']) tmux(['set', '-p', '-u', '-t', pane, name]);
      setTitle(pane, title);
      return out({ answer });
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  out({ answer: null, hint: 'Noch keine Antwort. Rufe ask mit derselben Frage erneut auf.' });
}

function answer() {
  const pane = target();
  const [text] = need('--answer');
  if (!option(pane, '@qatlas-question')) fail('Keine offene Frage in ' + pane);
  setOption(pane, '@qatlas-answer', text);
  out({ pane, answered: true });
}

function close() {
  const pane = target();
  const win = tmux(['display', '-p', '-t', pane, '#{window_id}']);
  const last = panes(win).length === 1;
  tmux(['kill-pane', '-t', pane]);
  if (!last) layout(win);
  out({ closed: pane, windowClosed: last });
}

try {
  if (command === 'add') add();
  else if (command === 'list') list();
  else if (command === 'title') { const pane = target(); const [title] = need('--title'); setTitle(pane, title); out({ pane, title }); }
  else if (command === 'wait') wait().catch(error => fail(error.message));
  else if (command === 'ask') ask().catch(error => fail(error.message));
  else if (command === 'answer') answer();
  else if (command === 'close') close();
  else fail('Befehle: add, list, title, wait, ask, answer, close', 2);
} catch (error) {
  fail((error.stderr ? String(error.stderr).trim() : '') || error.message);
}
