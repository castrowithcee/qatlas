#!/usr/bin/env node
'use strict';

// Richtet die native Codex-Statusline ein und erhält übrige Konfigurationswerte sowie Kommentare.

const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_ITEMS = [
    'model-with-reasoning',
    'project-name',
    'git-branch',
    'branch-changes',
    'context-used',
    'used-tokens',
    'five-hour-limit',
    'weekly-limit',
    'permissions',
    'approval-mode',
    'context-window-size'
];

// Strikte Picker-Allowlist: unbekannte Werte können Statusfelder still entfernen.
const KNOWN_ITEMS = new Set([
    'model', 'model-with-reasoning', 'reasoning', 'current-dir', 'project-name', 'git-branch',
    'pull-request-number', 'branch-changes', 'status', 'run-state', 'approval', 'permissions',
    'approval-mode', 'context-remaining',
    'context-used', 'five-hour-limit', 'weekly-limit', 'codex-version', 'context-window-size', 'used-tokens',
    'total-input-tokens', 'total-output-tokens', 'thread-id', 'fast-mode', 'raw-output', 'thread-title',
    'workspace-headline', 'task-progress'
]);

function fail(message) {
    console.error('Einrichtung der qatlas-Statusline für Codex gestoppt: ' + message);
    process.exit(1);
}

function nextValue(argv, index, option) {
    if (index + 1 >= argv.length || argv[index + 1].startsWith('--')) fail(option + ' braucht einen Wert');
    return argv[index + 1];
}

function itemList(value, option) {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    if (!items.length) fail(option + ' braucht mindestens einen kommagetrennten Eintrag');
    for (const item of items) if (!KNOWN_ITEMS.has(item)) fail('Unbekannter Codex-Statusline-Eintrag: ' + item);
    return items;
}

function parseArgs(argv) {
    const out = { config: '', defaults: false, enable: [], disable: [], colors: null };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--defaults') out.defaults = true;
        else if (arg === '--config') { out.config = nextValue(argv, i, arg); i += 1; }
        else if (arg === '--enable') { out.enable.push(...itemList(nextValue(argv, i, arg), arg)); i += 1; }
        else if (arg === '--disable') { out.disable.push(...itemList(nextValue(argv, i, arg), arg)); i += 1; }
        else if (arg === '--colors') {
            const value = nextValue(argv, i, arg);
            if (value !== 'on' && value !== 'off') fail('--colors akzeptiert on oder off');
            out.colors = value === 'on';
            i += 1;
        } else if (arg === '--help') {
            console.log('Verwendung: qatlas-statusline-setup-codex.js [--defaults] [--enable a,b] [--disable a,b] [--colors on|off]');
            process.exit(0);
        } else fail('Unbekannte Option: ' + arg);
    }
    if (!out.defaults && !out.enable.length && !out.disable.length) out.defaults = true;
    return out;
}

function tableName(line) {
    const match = line.match(/^\s*\[([^\[\]]+)\]\s*(?:#.*)?$/);
    return match ? match[1].trim() : null;
}

function arrayAssignmentEnd(lines, start, limit) {
    let quote = '', escaped = false, depth = 0, sawArray = false;
    for (let row = start; row < limit; row += 1) {
        const line = lines[row];
        for (let col = 0; col < line.length; col += 1) {
            const ch = line[col];
            if (quote) {
                if (quote === '"' && escaped) escaped = false;
                else if (quote === '"' && ch === '\\') escaped = true;
                else if (ch === quote) quote = '';
                continue;
            }
            if (ch === '#') break;
            if (ch === '"' || ch === "'") quote = ch;
            else if (ch === '[') { depth += 1; sawArray = true; }
            else if (ch === ']') {
                depth -= 1;
                if (depth < 0) fail('Ungültiges status_line-Array');
                if (sawArray && depth === 0) return row;
            }
        }
    }
    fail('status_line-Array ist vor der nächsten TOML-Tabelle nicht geschlossen');
}

function assignments(lines, start, end, keyPattern, isArray) {
    const found = [];
    for (let row = start; row < end; row += 1) {
        if (!keyPattern.test(lines[row])) continue;
        const last = isArray ? arrayAssignmentEnd(lines, row, end) : row;
        found.push({ start: row, end: last });
        row = last;
    }
    return found;
}

function readItems(lines, span) {
    if (!span) return null;
    const text = lines.slice(span.start, span.end + 1).join('\n');
    const items = [];
    const quoted = /["']([a-z0-9-]+)["']/g;
    let match;
    while ((match = quoted.exec(text)) !== null) items.push(match[1]);
    if (!items.length && !/=\s*\[\s*\]/s.test(text)) fail('Vorhandenes status_line-Array konnte nicht gelesen werden');
    for (const item of items) if (!KNOWN_ITEMS.has(item)) fail('Vorhandene status_line enthält einen unbekannten Eintrag: ' + item);
    return items;
}

function unique(items) {
    return [...new Set(items)];
}

const args = parseArgs(process.argv.slice(2));
const configFile = args.config
    ? path.resolve(args.config)
    : path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'config.toml');

let raw = '';
try { raw = fs.readFileSync(configFile, 'utf8'); }
catch (error) { if (error.code !== 'ENOENT') fail(configFile + ' kann nicht gelesen werden: ' + error.message); }

const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw ? raw.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n') : [];
const headers = lines.map((line, index) => ({ name: tableName(line), index })).filter(item => item.name);
const tuiHeaders = headers.filter(item => item.name === 'tui');
if (tuiHeaders.length > 1) fail('Konfiguration enthält mehr als eine [tui]-Tabelle');

const firstHeader = headers.length ? headers[0].index : lines.length;
const dottedStatus = assignments(lines, 0, firstHeader, /^\s*tui\.status_line\s*=/, true);
const dottedColors = assignments(lines, 0, firstHeader, /^\s*tui\.status_line_use_colors\s*=/, false);

let sectionStart = -1, sectionEnd = -1, tableStatus = [], tableColors = [];
if (tuiHeaders.length) {
    sectionStart = tuiHeaders[0].index;
    const following = headers.find(item => item.index > sectionStart);
    sectionEnd = following ? following.index : lines.length;
    tableStatus = assignments(lines, sectionStart + 1, sectionEnd, /^\s*status_line\s*=/, true);
    tableColors = assignments(lines, sectionStart + 1, sectionEnd, /^\s*status_line_use_colors\s*=/, false);
}

const statusSpans = [...dottedStatus, ...tableStatus];
const colorSpans = [...dottedColors, ...tableColors];
if (statusSpans.length > 1) fail('Konfiguration definiert die Codex-Statusline mehrfach');
if (colorSpans.length > 1) fail('Konfiguration definiert Statusline-Farben mehrfach');
if (tuiHeaders.length && (dottedStatus.length || dottedColors.length)) {
    fail('Konfiguration mischt punktierte tui-Keys mit einer [tui]-Tabelle');
}

const existingItems = readItems(lines, statusSpans[0]);
let items = args.defaults ? [...DEFAULT_ITEMS] : [...(existingItems || DEFAULT_ITEMS)];
items = unique(items.concat(args.enable)).filter(item => !args.disable.includes(item));
const colors = args.colors == null ? true : args.colors;

const replacements = [];
const tableStyle = tuiHeaders.length > 0;
const statusLine = (tableStyle ? 'status_line' : 'tui.status_line')
    + ' = [' + items.map(item => JSON.stringify(item)).join(', ') + ']';
const colorsLine = (tableStyle ? 'status_line_use_colors' : 'tui.status_line_use_colors')
    + ' = ' + (colors ? 'true' : 'false');
if (statusSpans[0]) replacements.push({ ...statusSpans[0], lines: [statusLine] });
if (colorSpans[0]) replacements.push({ ...colorSpans[0], lines: [colorsLine] });

for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    lines.splice(replacement.start, replacement.end - replacement.start + 1, ...replacement.lines);
}

if (!statusSpans[0] || !colorSpans[0]) {
    if (tableStyle) {
        const refreshedHeaders = lines.map((line, index) => ({ name: tableName(line), index })).filter(item => item.name);
        const refreshedStart = refreshedHeaders.find(item => item.name === 'tui').index;
        const following = refreshedHeaders.find(item => item.index > refreshedStart);
        let insertAt = following ? following.index : lines.length;
        while (insertAt > refreshedStart + 1 && lines[insertAt - 1].trim() === '') insertAt -= 1;
        const missing = [];
        if (!statusSpans[0]) missing.push('status_line = [' + items.map(item => JSON.stringify(item)).join(', ') + ']');
        if (!colorSpans[0]) missing.push('status_line_use_colors = ' + (colors ? 'true' : 'false'));
        lines.splice(insertAt, 0, ...missing);
    } else if (dottedStatus.length || dottedColors.length) {
        const anchor = Math.max(dottedStatus[0]?.start ?? -1, dottedColors[0]?.start ?? -1) + 1;
        const missing = [];
        if (!statusSpans[0]) missing.push('tui.status_line = [' + items.map(item => JSON.stringify(item)).join(', ') + ']');
        if (!colorSpans[0]) missing.push('tui.status_line_use_colors = ' + (colors ? 'true' : 'false'));
        lines.splice(anchor, 0, ...missing);
    } else {
        if (lines.length && lines[lines.length - 1] !== '') lines.push('');
        lines.push('[tui]');
        lines.push('status_line = [' + items.map(item => JSON.stringify(item)).join(', ') + ']');
        lines.push('status_line_use_colors = ' + (colors ? 'true' : 'false'));
    }
}

const after = lines.join(eol) + eol;
if (after !== raw) {
    fs.mkdirSync(path.dirname(configFile), { recursive: true });
    fs.writeFileSync(configFile, after);
    console.log('qatlas-Statusline für Codex eingerichtet:\n- natives TUI-Preset geschrieben nach ' + configFile);
} else {
    console.log('qatlas-Statusline für Codex stimmt bereits:\n- Konfiguration unverändert unter ' + configFile);
}
