#!/usr/bin/env node
'use strict';
// Renders Claude session JSON with the statusline block of ~/.qatlas/plugins/config.json to stdout.
// Setup copies renderer and runtime to ~/.qatlas/plugins/.

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { readStatusline } = require('./runtime/config-loader.js');

let data = {};
try { data = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { }

const noColor = !!process.env.NO_COLOR;
const cols = parseInt(process.env.COLUMNS, 10) || 999;

const SGR = (p) => `\x1b[${p}m`;
// ANSI names follow the terminal theme; orange, red and the diff pair use fixed indices.
const NAMED = {
    dim: ['2', ''], cyan: ['36', '46'], green: ['32', '42'], yellow: ['33', '43'],
    blue: ['34', '44'], magenta: ['35', '45'],
    orange: ['38;5;166', '48;5;166'], red: ['38;5;196', '48;5;196'],
    diffgreen: ['38;5;42', '48;5;42'], diffred: ['38;5;203', '48;5;203']
};
const C = { reset: SGR(0), bold: SGR(1) };

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

// Reopens the outer style after inner resets.
const paint = (text, pre) => (pre && text) ? pre + text.split(C.reset).join(C.reset + pre) + C.reset : text;

// The config loader holds every default; a style left empty stays uncolored.
const cfg = readStatusline().statusline;

// Style cascade: widget part, then defaults.label or defaults.value. Bold is additive.
function styleFor(name, p) {
    const w = cfg.widgets[name] || {};
    const own = (w[p.part] && typeof w[p.part] === 'object') ? w[p.part] : {};
    const glob = cfg.defaults[p.part === 'label' ? 'label' : 'value'];
    // Bar parts take the threshold color instead of the global value color.
    const fg = ansi(own.fg, false) || (p.barFg !== undefined ? p.barFg : ansi(glob.fg, false));
    return fg + (ansi(own.bg, true) || ansi(glob.bg, true)) + (own.bold === true || glob.bold === true ? C.bold : '');
}

// Label visibility: widget label.on, then defaults.label.on, then shown.
function labelOn(name) {
    const own = (cfg.widgets[name] || {}).label;
    if (own && typeof own.on === 'boolean') return own.on;
    return cfg.defaults.label.on !== false;
}

function build(name, parts) {
    const show = labelOn(name);
    const list = parts.filter(p => p.text && (show || p.part !== 'label'));
    const plain = list.map(p => p.text).join('');
    if (noColor) return { plain, colored: plain };
    return { plain, colored: list.map(p => paint(p.text, styleFor(name, p))).join('') };
}

const lv = (name, label, value) => build(name, [
    { text: label ? label + ': ' : '', part: 'label' },
    { text: String(value), part: 'value' }
]);

// The last reached valid threshold wins.
function barColor(name, pct) {
    const bar = (cfg.widgets[name] || {}).bar;
    const use = (bar && Array.isArray(bar.thresholds) ? bar.thresholds : [])
        .filter(t => t && typeof t.from === 'number' && ansi(t.fg, false)).sort((a, b) => a.from - b.from);
    let fg = '';
    for (const t of use) if (pct >= t.from) fg = ansi(t.fg, false);
    return fg;
}

function barSeg(name, label, pct, suffix) {
    const col = barColor(name, pct);
    const w = 10, f = Math.max(0, Math.min(w, Math.round(pct * w / 100)));
    return build(name, [
        { text: label + ': ', part: 'label' },
        { text: '▓'.repeat(f) + '░'.repeat(w - f) + ' ', part: 'bar', barFg: col },
        { text: pct + '%', part: 'value', barFg: col },
        { text: suffix ? ' ' + suffix : '', part: 'suffix', barFg: col }
    ]);
}

const k = (n) => Math.round(n / 1000) + 'K';

function hms(epochSec, withDays) {
    let s = epochSec - Math.floor(Date.now() / 1000);
    if (s < 0) s = 0;
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return withDays ? `${d}d ${h}h ${m}m` : `${Math.floor(s / 3600)}h ${m}m`;
}

// Cache git info per session for five seconds.
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
        if (dirty && dirty.trim() !== '') sync = 'dirty';
        else {
            const counts = run(cwd, 'git --no-optional-locks rev-list --left-right --count HEAD...@{u}');
            if (counts === null) sync = 'no upstream';
            else {
                const [ahead, behind] = counts.split(/\s+/).map(Number);
                if (ahead > 0 && behind > 0) sync = 'diverged';
                else if (ahead > 0) sync = 'push';
                else if (behind > 0) sync = 'pull';
                else sync = 'synced';
            }
        }
        info = { branch, add, del, sync };
    }
    try { fs.writeFileSync(cache, JSON.stringify(info)); } catch { }
    return info;
}

function contextTokens(d) {
    const cw = d.context_window || {};
    let tok = cw.total_input_tokens;
    if (tok == null && cw.current_usage) {
        const u = cw.current_usage;
        tok = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    }
    return tok == null ? null : tok;
}

const WIDGETS = {
    model: (d) => {
        const m = d.model && (d.model.display_name || d.model.id);
        return m ? lv('model', 'Model', m.replace(/\s*\(.*\)$/, '')) : null;
    },
    thinking: (d) => {
        const e = d.effort && d.effort.level;
        return e ? lv('thinking', 'Think', e) : null;
    },
    dir: (d) => {
        const cwd = (d.workspace && d.workspace.current_dir) || d.cwd;
        return cwd ? lv('dir', 'Dir', path.basename(cwd)) : null;
    },
    branch: (d, g) => (g && g.branch) ? lv('branch', 'Branch', '⎎ ' + g.branch) : null,
    diff: (d, g) => g ? build('diff', [
        { text: 'Diff: ', part: 'label' },
        { text: `+${g.add} `, part: 'add' },
        { text: `-${g.del} `, part: 'del' },
        { text: `- ${g.sync}`, part: 'sync' }
    ]) : null,
    out: (d) => {
        const o = d.context_window && d.context_window.total_output_tokens;
        return o != null ? lv('out', 'Out', k(o)) : null;
    },
    context: (d) => {
        const tok = contextTokens(d);
        const size = (d.context_window || {}).context_window_size;
        if (tok == null || !size) return null;
        return barSeg('context', 'Ctx', Math.round(100 * tok / size), `(${k(tok)}/${k(size)})`);
    },
    cost: (d) => {
        const c = d.cost && d.cost.total_cost_usd;
        return c != null ? lv('cost', 'Costs', '💰$' + Number(c).toFixed(2)) : null;
    },
    session: (d) => {
        const r = d.rate_limits && d.rate_limits.five_hour;
        return r && r.used_percentage != null ? barSeg('session', 'Session', Math.round(r.used_percentage)) : null;
    },
    'session-reset': (d) => {
        const r = d.rate_limits && d.rate_limits.five_hour && d.rate_limits.five_hour.resets_at;
        return r != null ? lv('session-reset', 'Session-Reset', hms(r, false)) : null;
    },
    weekly: (d) => {
        const r = d.rate_limits && d.rate_limits.seven_day;
        return r && r.used_percentage != null ? barSeg('weekly', 'Week', Math.round(r.used_percentage)) : null;
    },
    'weekly-reset': (d) => {
        const r = d.rate_limits && d.rate_limits.seven_day && d.rate_limits.seven_day.resets_at;
        return r != null ? lv('weekly-reset', 'Week-Reset', hms(r, true)) : null;
    },
    method: (d) => lv('method', 'Method', d.rate_limits ? 'Sub' : 'API')
};

const git = gitInfo(data);
const render = (type) => (WIDGETS[type] ? WIDGETS[type](data, git) : null);
const SEP = cfg.separator.text;
const SEP_COLORED = noColor ? SEP : paint(SEP,
    ansi(cfg.separator.fg, false) + ansi(cfg.separator.bg, true) + (cfg.separator.bold === true ? C.bold : ''));
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
        .map(rowText);
    out = out.join('\n');
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
