#!/usr/bin/env node
'use strict';
// Rendert Claudes Session-JSON mit ~/.qatlas/plugins/config.yaml nach stdout.
// Das Setup kopiert den Renderer und seine Runtime nach ~/.qatlas/plugins/.

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { readConfig } = require('./runtime/config-loader.js');

const DEFAULT_WIDGETS = ['model', 'thinking', 'dir', 'branch', 'diff', 'out', 'context', 'cost', 'session', 'session-reset', 'weekly', 'weekly-reset', 'method'];

// Eingabe
let data = {};
try { data = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { }

const noColor = !!process.env.NO_COLOR;
const cols = parseInt(process.env.COLUMNS, 10) || 999;

// Farben
const SGR = (p) => `\x1b[${p}m`;
// ANSI-Namen folgen dem Terminal-Theme. Orange, Rot und das Diff-Paar verwenden feste Indizes.
const NAMED = {
    dim: ['2', ''], cyan: ['36', '46'], green: ['32', '42'], yellow: ['33', '43'],
    blue: ['34', '44'], magenta: ['35', '45'],
    orange: ['38;5;166', '48;5;166'], red: ['38;5;196', '48;5;196'],
    diffgreen: ['38;5;42', '48;5;42'], diffred: ['38;5;203', '48;5;203']
};
const C = { reset: SGR(0), bold: SGR(1) };
for (const n of Object.keys(NAMED)) C[n] = SGR(NAMED[n][0]);

// Akzeptiert Palettennamen, #rgb, #rrggbb und rgb(r,g,b); Ungültiges fällt durch die Stilkaskade.
function ansi(spec, isBg) {
    if (typeof spec !== 'string') return '';
    const s = spec.trim().toLowerCase().replace(/\s+/g, '');
    if (!s) return '';
    if (NAMED[s]) return NAMED[s][isBg ? 1 : 0] ? SGR(NAMED[s][isBg ? 1 : 0]) : '';
    let rgb = null;
    let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (m) {
        const h = m[1].length === 3 ? m[1].replace(/(.)/g, '$1$1') : m[1];
        rgb = [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map(x => parseInt(x, 16));
    } else if ((m = s.match(/^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/))) {
        rgb = [+m[1], +m[2], +m[3]];
    }
    if (!rgb || rgb.some(v => !(v >= 0 && v <= 255))) return '';
    return SGR(`${isBg ? 48 : 38};2;${rgb.join(';')}`);
}

// Nach inneren Resets den äußeren Stil erneut öffnen.
const paint = (text, pre) => (pre && text) ? pre + text.split(C.reset).join(C.reset + pre) + C.reset : text;

// Konfiguration: Widgets akzeptieren Objekt, Boolean, Farbstring oder eine Namensliste.
function normWidget(v) {
    if (v === true) return { on: true };
    if (typeof v === 'string') return v.trim() ? { on: true, value: { fg: v } } : { on: true };
    if (v && typeof v === 'object') return Object.assign({}, v, { on: v.on !== false });
    return { on: false };
}

function normWidgets(w) {
    const out = {};
    if (Array.isArray(w)) {
        for (const n of w) if (DEFAULT_WIDGETS.includes(n)) out[n] = { on: true };
    } else if (w && typeof w === 'object') {
        for (const n of Object.keys(w)) if (DEFAULT_WIDGETS.includes(n)) out[n] = normWidget(w[n]);
    }
    if (!Object.keys(out).length) for (const n of DEFAULT_WIDGETS) out[n] = { on: true };
    else for (const n of DEFAULT_WIDGETS) if (!(n in out)) out[n] = { on: false };
    return out;
}

function loadConfig() {
    const cwd = (data.workspace && data.workspace.current_dir) || data.cwd || process.cwd();
    const c = readConfig(cwd).config.statusline;
    const d = (c.defaults && typeof c.defaults === 'object') ? c.defaults : {};
    const style = (s) => (s && typeof s === 'object') ? s : {};
    const sep = Object.assign({}, (c.separator && typeof c.separator === 'object') ? c.separator : {});
    if (typeof sep.text !== 'string') sep.text = typeof c.separator === 'string' ? c.separator : ' • ';
    const widgets = normWidgets(c.widgets);
    return {
        layout: c.layout === 'fixed' ? 'fixed' : 'wrap',
        separator: sep,
        defaults: { label: style(d.label), value: style(d.value) },
        widgets,
        order: Object.keys(widgets).filter(n => widgets[n].on)
    };
}

const cfg = loadConfig();

// Stilkaskade: Widget, globaler Label-/Wert-Standard, eingebauter Standard. Fettdruck ist additiv.
function styleFor(name, p) {
    const w = cfg.widgets[name] || {};
    const own = (w[p.part] && typeof w[p.part] === 'object') ? w[p.part] : {};
    const glob = cfg.defaults[p.part === 'label' ? 'label' : 'value'];
    // fixedFg schützt semantische Schwellenfarben vor der globalen Wertfarbe.
    const fg = ansi(own.fg, false) || (p.fixedFg ? '' : ansi(glob.fg, false)) || p.def || '';
    return fg + (ansi(own.bg, true) || ansi(glob.bg, true)) + (own.bold === true || glob.bold === true ? C.bold : '');
}

function build(name, parts) {
    const list = parts.filter(p => p.text);
    const plain = list.map(p => p.text).join('');
    if (noColor) return { plain, colored: plain };
    return { plain, colored: list.map(p => paint(p.text, styleFor(name, p))).join('') };
}

const lv = (name, label, value, defLabel, defValue) => build(name, [
    { text: label ? label + ': ' : '', part: 'label', def: defLabel },
    { text: String(value), part: 'value', def: defValue }
]);

// Leisten
const DEFAULT_BAR = [{ from: 0, fg: 'green' }, { from: 35, fg: 'yellow' }, { from: 45, fg: 'orange' }, { from: 70, fg: 'red' }];

// Die zuletzt erreichte gültige Schwelle gewinnt; ungültige eigene Schwellen fallen auf die Defaults zurück.
function barColor(name, pct) {
    const bar = (cfg.widgets[name] || {}).bar;
    const own = (bar && Array.isArray(bar.thresholds))
        ? bar.thresholds.filter(t => t && typeof t.from === 'number' && ansi(t.fg, false)) : [];
    const use = (own.length ? own : DEFAULT_BAR).slice().sort((a, b) => a.from - b.from);
    let fg = ansi(use[0].fg, false);
    for (const t of use) if (pct >= t.from) fg = ansi(t.fg, false);
    return fg;
}

// Leiste, Prozentwert und Suffix teilen standardmäßig dieselbe Schwellenfarbe.
function barSeg(name, label, pct, suffix) {
    const col = barColor(name, pct);
    const w = 10, f = Math.max(0, Math.min(w, Math.round(pct * w / 100)));
    return build(name, [
        { text: label + ': ', part: 'label', def: C.dim },
        { text: '▓'.repeat(f) + '░'.repeat(w - f) + ' ', part: 'bar', def: col, fixedFg: true },
        { text: pct + '%', part: 'value', def: col, fixedFg: true },
        { text: suffix ? ' ' + suffix : '', part: 'suffix', def: col, fixedFg: true }
    ]);
}

const k = (n) => Math.round(n / 1000) + 'K';

function hms(epochSec, withDays) {
    let s = epochSec - Math.floor(Date.now() / 1000);
    if (s < 0) s = 0;
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return withDays ? `${d}T ${h}Std ${m}Min` : `${Math.floor(s / 3600)}Std ${m}Min`;
}

// Git, pro Session 5 Sekunden zwischengespeichert
function run(cwd, cmd) {
    try { return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
    catch { return null; }
}

function gitInfo(d) {
    const cwd = (d.workspace && d.workspace.current_dir) || d.cwd;
    if (!cwd) return null;
    const cache = path.join(os.tmpdir(), `qatlas-sl-git-${d.session_id || 'nosession'}.json`);
    try {
        if (Date.now() - fs.statSync(cache).mtimeMs < 5000) return JSON.parse(fs.readFileSync(cache, 'utf8'));
    } catch { }

    let info = null;
    if (run(cwd, 'git --no-optional-locks rev-parse --git-dir') !== null) {
        const branch = run(cwd, 'git --no-optional-locks rev-parse --abbrev-ref HEAD');
        let add = 0, del = 0;
        const numstat = run(cwd, 'git --no-optional-locks diff HEAD --numstat') || '';
        for (const line of numstat.split('\n')) {
            const m = line.match(/^(\d+)\t(\d+)\t/);
            if (m) { add += +m[1]; del += +m[2]; }
        }
        const dirty = run(cwd, 'git --no-optional-locks status --porcelain');
        let sync;
        if (dirty && dirty.trim() !== '') sync = 'Commit nötig';
        else {
            const counts = run(cwd, 'git --no-optional-locks rev-list --left-right --count HEAD...@{u}');
            if (counts === null) sync = 'kein Upstream';
            else {
                const [ahead, behind] = counts.split(/\s+/).map(Number);
                if (ahead > 0 && behind > 0) sync = 'divergiert';
                else if (ahead > 0) sync = 'Push nötig';
                else if (behind > 0) sync = 'Pull nötig';
                else sync = 'aktuell';
            }
        }
        info = { branch, add, del, sync };
    }
    try { fs.writeFileSync(cache, JSON.stringify(info)); } catch { }
    return info;
}

// Widgets: Labels sind gedimmt, Werte nutzen die Terminalfarbe. Nur Diff und Schwellen tragen Semantikfarben.
const WIDGETS = {
    model: (d) => {
        const m = d.model && (d.model.display_name || d.model.id);
        return m ? lv('model', 'Modell', m.replace(/\s*\(.*\)$/, ''), C.dim, '') : null;
    },
    thinking: (d) => {
        const e = d.effort && d.effort.level;
        return e ? lv('thinking', 'Denken', e, C.dim, '') : null;
    },
    dir: (d) => {
        const cwd = (d.workspace && d.workspace.current_dir) || d.cwd;
        return cwd ? lv('dir', 'Ordner', path.basename(cwd), C.dim, '') : null;
    },
    branch: (d, g) => (g && g.branch) ? lv('branch', 'Branch', '⎎ ' + g.branch, C.dim, '') : null,
    diff: (d, g) => g ? build('diff', [
        { text: 'Diff: ', part: 'label', def: C.dim },
        { text: `+${g.add} `, part: 'add', def: C.diffgreen },
        { text: `-${g.del} `, part: 'del', def: C.diffred },
        { text: `- ${g.sync}`, part: 'sync', def: '' }
    ]) : null,
    out: (d) => {
        const o = d.context_window && d.context_window.total_output_tokens;
        return o != null ? lv('out', 'Ausgabe', k(o), C.dim, '') : null;
    },
    context: (d) => {
        const cw = d.context_window || {};
        let tok = cw.total_input_tokens;
        if (tok == null && cw.current_usage) {
            const u = cw.current_usage;
            tok = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
        }
        const size = cw.context_window_size;
        if (tok == null || !size) return null;
        return barSeg('context', 'Eingabe', Math.round(100 * tok / size), `(${k(tok)}/${k(size)})`);
    },
    cost: (d) => {
        const c = d.cost && d.cost.total_cost_usd;
        return c != null ? lv('cost', 'Kosten', '💰$' + Number(c).toFixed(2), C.dim, '') : null;
    },
    session: (d) => {
        const r = d.rate_limits && d.rate_limits.five_hour;
        return r && r.used_percentage != null ? barSeg('session', 'Session', Math.round(r.used_percentage)) : null;
    },
    'session-reset': (d) => {
        const r = d.rate_limits && d.rate_limits.five_hour && d.rate_limits.five_hour.resets_at;
        return r != null ? lv('session-reset', 'Session-Reset', hms(r, false), C.dim, '') : null;
    },
    weekly: (d) => {
        const r = d.rate_limits && d.rate_limits.seven_day;
        return r && r.used_percentage != null ? barSeg('weekly', 'Woche', Math.round(r.used_percentage)) : null;
    },
    'weekly-reset': (d) => {
        const r = d.rate_limits && d.rate_limits.seven_day && d.rate_limits.seven_day.resets_at;
        return r != null ? lv('weekly-reset', 'Wochen-Reset', hms(r, true), C.dim, '') : null;
    },
    method: (d) => lv('method', 'Methode', d.rate_limits ? 'Abo' : 'API', C.dim, '')
};

// Zusammensetzen
const git = gitInfo(data);
const render = (type) => (WIDGETS[type] ? WIDGETS[type](data, git) : null);
const SEP = cfg.separator.text;
const SEP_COLORED = noColor ? SEP : paint(SEP,
    (ansi(cfg.separator.fg, false) || C.dim) + ansi(cfg.separator.bg, true) + (cfg.separator.bold === true ? C.bold : ''));
const rowText = (segs) => segs.map(s => s.colored).join(SEP_COLORED);

let out;
if (cfg.layout === 'fixed') {
    const active = new Set(cfg.order);
    const ROWS = [
        ['model', 'thinking', 'dir'],
        ['branch', 'diff'],
        ['out', 'context', 'cost'],
        ['session', 'session-reset', 'weekly', 'weekly-reset', 'method']
    ];
    out = ROWS
        .map(row => row.filter(t => active.has(t)).map(render).filter(Boolean))
        .filter(segs => segs.length)
        .map(rowText)
        .join('\n');
} else {
    const segs = cfg.order.map(render).filter(Boolean);
    const avail = cols - 2;
    const width = (list) => list.reduce((n, s, i) => n + s.plain.length + (i > 0 ? SEP.length : 0), 0);
    const lines = [];
    let line = [];
    for (const s of segs) {
        if (line.length && width([...line, s]) > avail) { lines.push(line); line = []; }
        line.push(s);
    }
    if (line.length) lines.push(line);
    out = lines.map(rowText).join('\n');
}

process.stdout.write(out);
