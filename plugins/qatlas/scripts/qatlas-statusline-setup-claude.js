#!/usr/bin/env node
'use strict';
// Richtet Claudes Statusline idempotent unter ~/.qatlas ein und erhält bestehende Nutzerentscheidungen.

const fs = require('fs');
const os = require('os');
const path = require('path');

// Außerhalb einer Host-Session die Plugin-Root aus dem Scriptpfad ableiten.
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.env.PLUGIN_ROOT
    || path.resolve(__dirname, '..');

const home = os.homedir();
const qatlasDir = path.join(home, '.qatlas');
const rendererDst = path.join(qatlasDir, 'statusline.js');
const configFile = path.join(qatlasDir, 'statusline.json');
const settingsFile = path.join(home, '.claude', 'settings.json');
const done = [];

fs.mkdirSync(qatlasDir, { recursive: true });

// Bei jedem Lauf aktualisieren, da Claudes Command einen stabilen Pfad braucht.
fs.copyFileSync(path.join(pluginRoot, 'scripts', 'qatlas-statusline-render-claude.js'), rendererDst);
done.push('Renderer kopiert nach ' + rendererDst);

// Kanonische Widget-Reihenfolge und konfigurierbare Teile.
const WIDGET_PARTS = {
    model: ['label', 'value'],
    thinking: ['label', 'value'],
    dir: ['label', 'value'],
    branch: ['label', 'value'],
    diff: ['label', 'add', 'del', 'sync'],
    out: ['label', 'value'],
    context: ['label', 'bar', 'value', 'suffix'],
    cost: ['label', 'value'],
    session: ['label', 'bar', 'value'],
    'session-reset': ['label', 'value'],
    weekly: ['label', 'bar', 'value'],
    'weekly-reset': ['label', 'value'],
    method: ['label', 'value']
};
const WIDGET_ORDER = Object.keys(WIDGET_PARTS);
const DEFAULT_THRESHOLDS = [
    { from: 0, fg: 'green' }, { from: 35, fg: 'yellow' }, { from: 45, fg: 'orange' }, { from: 70, fg: 'red' }
];

// Nur Erstinstallationen erhalten diese Palette für dunkle Themes. Die helle Variante liegt im Store.
const SHIPPED = {
    separator: '#aee414',
    label: '#7dcaf6',
    accent: '#f72585',
    accented: ['model', 'dir', 'branch'],
    steps: ['#24e302', '#f0c808', '#ff6131'],
    // Kontext wird früher kritisch als ein Rate Limit.
    red: { context: 70, session: 85, weekly: 85 }
};
const shippedWidget = (name) => {
    const w = { on: true };
    if (SHIPPED.accented.includes(name)) w.value = { fg: SHIPPED.accent };
    if (name in SHIPPED.red) {
        w.bar = {
            thresholds: [
                { from: 0, fg: SHIPPED.steps[0] }, { from: 30, fg: SHIPPED.steps[1] },
                { from: 40, fg: SHIPPED.steps[2] }, { from: SHIPPED.red[name], fg: 'red' }
            ]
        };
    }
    return w;
};

const str = (v) => typeof v === 'string' ? v : '';
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};

// Hintergründe nur erhalten, wenn sie ausdrücklich gesetzt wurden.
const style = (v) => {
    const c = obj(v), out = { fg: str(c.fg) };
    if (str(c.bg)) out.bg = c.bg;
    out.bold = c.bold === true;
    return out;
};

// Kurzformen normalisieren, vorhandenen Zustand und Farben erhalten.
function fullWidget(name, cur) {
    const c = typeof cur === 'string' && cur.trim() ? { value: { fg: cur } } : obj(cur);
    const w = { on: cur === true || typeof cur === 'string' ? true : cur === false ? false : c.on !== false };
    for (const part of WIDGET_PARTS[name]) {
        if (part === 'bar') {
            const b = obj(c.bar);
            w.bar = Object.assign(str(b.bg) ? { bg: b.bg } : {}, {
                bold: b.bold === true,
                thresholds: Array.isArray(b.thresholds) && b.thresholds.length ? b.thresholds : DEFAULT_THRESHOLDS
            });
        } else {
            w[part] = style(c[part]);
        }
    }
    return w;
}

const existed = fs.existsSync(configFile);
let raw = '', cur = {};
if (existed) { try { raw = fs.readFileSync(configFile, 'utf8'); cur = JSON.parse(raw); } catch { cur = {}; } }

const curSep = obj(cur.separator);
const sepText = typeof cur.separator === 'string' ? cur.separator
    : typeof curSep.text === 'string' ? curSep.text : ' • ';

// Array, Bool-Map und Vollform akzeptieren. Neue Widgets ausgeschaltet anhängen.
let curWidgets = {};
if (Array.isArray(cur.widgets)) { for (const n of cur.widgets) if (typeof n === 'string') curWidgets[n] = true; }
else curWidgets = obj(cur.widgets);

// Unbekannte Widget-Namen verwerfen.
const known = Object.keys(curWidgets).filter(n => n in WIDGET_PARTS);
const widgets = {};
for (const n of known.concat(WIDGET_ORDER.filter(n => !known.includes(n)))) {
    widgets[n] = fullWidget(n, n in curWidgets ? curWidgets[n] : (existed ? false : shippedWidget(n)));
}

const config = {
    layout: cur.layout === 'fixed' ? 'fixed' : 'wrap',
    separator: Object.assign({ text: sepText },
        style(existed ? curSep : { fg: SHIPPED.separator, bold: true })),
    defaults: {
        label: style(existed ? obj(cur.defaults).label : { fg: SHIPPED.label }),
        value: style(obj(cur.defaults).value)
    },
    widgets
};
for (const key of Object.keys(cur)) if (!(key in config)) config[key] = cur[key];

const after = JSON.stringify(config, null, 2) + '\n';
if (after !== raw) {
    fs.writeFileSync(configFile, after);
    done.push((existed ? 'Konfiguration normalisiert/ergänzt unter ' : 'Standardkonfiguration geschrieben nach ')
        + configFile);
} else {
    done.push('Konfiguration unverändert unter ' + configFile);
}

// Nur Claudes statusLine-Einstellung ersetzen.
const cmdPath = rendererDst.replace(/\\/g, '/'); // Vorwärtsschrägstriche sind in Git Bash und PowerShell sicher.
let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')); } catch { /* fehlt oder ungültig: neu beginnen */ }
settings.statusLine = { type: 'command', command: `node "${cmdPath}"`, refreshInterval: 60 };
fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
done.push('statusLine und refreshInterval:60 gesetzt in ' + settingsFile);

console.log('qatlas-Statusline eingerichtet:\n- ' + done.join('\n- '));
