#!/usr/bin/env node
'use strict';

// Sets up or removes the native Codex statusline preset and preserves all other config values and comments.
// Usage: node qatlas-statusline-codex.js setup [--defaults] [--enable a,b] [--disable a,b] [--colors on|off]
//        node qatlas-statusline-codex.js remove
// Both accept --config <file> instead of $CODEX_HOME/config.toml.

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

// Strict picker allowlist: unknown values can silently drop status fields.
const KNOWN_ITEMS = new Set([
    'model', 'model-with-reasoning', 'reasoning', 'current-dir', 'project-name', 'git-branch',
    'pull-request-number', 'branch-changes', 'status', 'run-state', 'approval', 'permissions',
    'approval-mode', 'context-remaining',
    'context-used', 'five-hour-limit', 'weekly-limit', 'codex-version', 'context-window-size', 'used-tokens',
    'total-input-tokens', 'total-output-tokens', 'thread-id', 'fast-mode', 'raw-output', 'thread-title',
    'workspace-headline', 'task-progress'
]);

const USAGE = 'setup [--defaults] [--enable a,b] [--disable a,b] [--colors on|off] [--config file] | remove [--config file]';
const previousFile = path.join(os.homedir(), '.qatlas', 'state', 'statusline', 'codex-previous.json');

function fail(message) {
    console.error('Qatlas status line for Codex stopped: ' + message);
    process.exit(1);
}

function nextValue(argv, index, option) {
    if (index + 1 >= argv.length || argv[index + 1].startsWith('--')) fail(option + ' needs a value');
    return argv[index + 1];
}

function itemList(value, option) {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    if (!items.length) fail(option + ' needs at least one comma-separated entry');
    for (const item of items) if (!KNOWN_ITEMS.has(item)) fail('unknown Codex status line item: ' + item);
    return items;
}

function parseArgs(argv) {
    const command = argv[0];
    if (command !== 'setup' && command !== 'remove') fail('usage: ' + USAGE);
    const out = { command, config: '', defaults: false, enable: [], disable: [], colors: null };
    for (let i = 1; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--defaults') out.defaults = true;
        else if (arg === '--config') { out.config = nextValue(argv, i, arg); i += 1; }
        else if (arg === '--enable') { out.enable.push(...itemList(nextValue(argv, i, arg), arg)); i += 1; }
        else if (arg === '--disable') { out.disable.push(...itemList(nextValue(argv, i, arg), arg)); i += 1; }
        else if (arg === '--colors') {
            const value = nextValue(argv, i, arg);
            if (value !== 'on' && value !== 'off') fail('--colors accepts on or off');
            out.colors = value === 'on';
            i += 1;
        } else if (arg === '--help') {
            console.log('Usage: qatlas-statusline-codex.js ' + USAGE);
            process.exit(0);
        } else fail('unknown option: ' + arg);
    }
    if (command === 'remove' && (out.defaults || out.enable.length || out.disable.length || out.colors !== null)) {
        fail('remove accepts only --config');
    }
    if (command === 'setup' && !out.defaults && !out.enable.length && !out.disable.length) out.defaults = true;
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
                if (depth < 0) fail('invalid status_line array');
                if (sawArray && depth === 0) return row;
            }
        }
    }
    fail('status_line array is not closed before the next TOML table');
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
    if (!items.length && !/=\s*\[\s*\]/s.test(text)) fail('existing status_line array could not be read');
    for (const item of items) if (!KNOWN_ITEMS.has(item)) fail('existing status_line holds an unknown item: ' + item);
    return items;
}

function readColors(lines, span) {
    if (!span) return null;
    const match = lines[span.start].match(/=\s*(true|false)/);
    return match ? match[1] === 'true' : null;
}

function unique(items) {
    return [...new Set(items)];
}

function tableHeaders(lines) {
    return lines.map((line, index) => ({ name: tableName(line), index })).filter(item => item.name);
}

function analyze(raw) {
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const lines = raw ? raw.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n') : [];
    const headers = tableHeaders(lines);
    const tuiHeaders = headers.filter(item => item.name === 'tui');
    if (tuiHeaders.length > 1) fail('configuration holds more than one [tui] table');

    const firstHeader = headers.length ? headers[0].index : lines.length;
    const dottedStatus = assignments(lines, 0, firstHeader, /^\s*tui\.status_line\s*=/, true);
    const dottedColors = assignments(lines, 0, firstHeader, /^\s*tui\.status_line_use_colors\s*=/, false);

    let tableStatus = [], tableColors = [];
    if (tuiHeaders.length) {
        const sectionStart = tuiHeaders[0].index;
        const following = headers.find(item => item.index > sectionStart);
        const sectionEnd = following ? following.index : lines.length;
        tableStatus = assignments(lines, sectionStart + 1, sectionEnd, /^\s*status_line\s*=/, true);
        tableColors = assignments(lines, sectionStart + 1, sectionEnd, /^\s*status_line_use_colors\s*=/, false);
    }

    const statusSpans = [...dottedStatus, ...tableStatus];
    const colorSpans = [...dottedColors, ...tableColors];
    if (statusSpans.length > 1) fail('configuration defines the Codex status line more than once');
    if (colorSpans.length > 1) fail('configuration defines status line colors more than once');
    if (tuiHeaders.length && (dottedStatus.length || dottedColors.length)) {
        fail('configuration mixes dotted tui keys with a [tui] table');
    }

    return {
        eol, lines, statusSpans, colorSpans,
        tableStyle: tuiHeaders.length > 0,
        existingItems: readItems(lines, statusSpans[0]),
        existingColors: readColors(lines, colorSpans[0]),
    };
}

function assignmentText(tableStyle, items, colors) {
    const prefix = tableStyle ? '' : 'tui.';
    return {
        status: prefix + 'status_line = [' + items.map(item => JSON.stringify(item)).join(', ') + ']',
        colors: prefix + 'status_line_use_colors = ' + (colors ? 'true' : 'false'),
    };
}

// Replaces or inserts both assignments in place and returns the new lines.
function applyPreset(state, items, colors) {
    const lines = state.lines.slice();
    const { tableStyle, statusSpans, colorSpans } = state;
    const text = assignmentText(tableStyle, items, colors);
    const replacements = [];
    if (statusSpans[0]) replacements.push({ ...statusSpans[0], lines: [text.status] });
    if (colorSpans[0]) replacements.push({ ...colorSpans[0], lines: [text.colors] });
    for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
        lines.splice(replacement.start, replacement.end - replacement.start + 1, ...replacement.lines);
    }
    if (statusSpans[0] && colorSpans[0]) return lines;

    const missing = [];
    if (!statusSpans[0]) missing.push(text.status);
    if (!colorSpans[0]) missing.push(text.colors);
    if (tableStyle) {
        const headers = tableHeaders(lines);
        const start = headers.find(item => item.name === 'tui').index;
        const following = headers.find(item => item.index > start);
        let insertAt = following ? following.index : lines.length;
        while (insertAt > start + 1 && lines[insertAt - 1].trim() === '') insertAt -= 1;
        lines.splice(insertAt, 0, ...missing);
    } else if (statusSpans[0] || colorSpans[0]) {
        const anchor = Math.max(statusSpans[0]?.start ?? -1, colorSpans[0]?.start ?? -1) + 1;
        lines.splice(anchor, 0, ...missing);
    } else {
        const table = assignmentText(true, items, colors);
        if (lines.length && lines[lines.length - 1] !== '') lines.push('');
        lines.push('[tui]', table.status, table.colors);
    }
    return lines;
}

// Removes both assignments and a [tui] table that is left empty.
function stripPreset(state) {
    const lines = state.lines.slice();
    const spans = [...state.statusSpans, ...state.colorSpans].sort((a, b) => b.start - a.start);
    for (const span of spans) lines.splice(span.start, span.end - span.start + 1);
    if (state.tableStyle) {
        const headers = tableHeaders(lines);
        const tui = headers.find(item => item.name === 'tui');
        const following = headers.find(item => item.index > tui.index);
        const end = following ? following.index : lines.length;
        if (lines.slice(tui.index + 1, end).every(line => line.trim() === '')) {
            let from = tui.index;
            while (from > 0 && lines[from - 1].trim() === '') from -= 1;
            lines.splice(from, end - from);
        }
    }
    return lines;
}

function writeConfig(configFile, raw, lines, eol) {
    const after = lines.length ? lines.join(eol) + eol : '';
    if (after === raw) return false;
    fs.mkdirSync(path.dirname(configFile), { recursive: true });
    fs.writeFileSync(configFile, after);
    return true;
}

function readPrevious() {
    try {
        const previous = JSON.parse(fs.readFileSync(previousFile, 'utf8'));
        if (!previous || !Array.isArray(previous.items)) return null;
        for (const item of previous.items) if (!KNOWN_ITEMS.has(item)) return null;
        return previous;
    } catch { return null; }
}

const args = parseArgs(process.argv.slice(2));
const configFile = args.config
    ? path.resolve(args.config)
    : path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'config.toml');

let raw = '';
try { raw = fs.readFileSync(configFile, 'utf8'); }
catch (error) { if (error.code !== 'ENOENT') fail(configFile + ' cannot be read: ' + error.message); }
const state = analyze(raw);

if (args.command === 'setup') {
    // Keep the native list the user had before so that remove can put it back.
    if (state.statusSpans[0] && !fs.existsSync(previousFile)) {
        fs.mkdirSync(path.dirname(previousFile), { recursive: true });
        fs.writeFileSync(previousFile, JSON.stringify({
            items: state.existingItems, colors: state.existingColors,
        }, null, 2) + '\n');
    }
    let items = args.defaults ? [...DEFAULT_ITEMS] : [...(state.existingItems || DEFAULT_ITEMS)];
    items = unique(items.concat(args.enable)).filter(item => !args.disable.includes(item));
    const colors = args.colors == null ? true : args.colors;
    const changed = writeConfig(configFile, raw, applyPreset(state, items, colors), state.eol);
    console.log(changed
        ? 'Qatlas status line for Codex set up:\n- native TUI preset written to ' + configFile
        : 'Qatlas status line for Codex already matches:\n- configuration unchanged at ' + configFile);
} else {
    const previous = readPrevious();
    let lines = previous ? applyPreset(state, previous.items, previous.colors === true) : stripPreset(state);
    if (previous && previous.colors == null) {
        // The user had no colors line before; drop the one the preset wrote.
        const restored = analyze(lines.join('\n'));
        lines = restored.colorSpans[0]
            ? restored.lines.filter((line, index) => index !== restored.colorSpans[0].start) : restored.lines;
    }
    const changed = writeConfig(configFile, raw, lines, state.eol);
    fs.rmSync(previousFile, { force: true });
    const note = previous ? 'previous native status line restored in ' : 'Qatlas preset removed from ';
    console.log('Qatlas status line for Codex removed:\n- '
        + (changed ? note + configFile : 'configuration unchanged at ' + configFile));
}
