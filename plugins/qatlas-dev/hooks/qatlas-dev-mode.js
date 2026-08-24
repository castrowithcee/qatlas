#!/usr/bin/env node
'use strict';
// Ein ausdrücklich gesetzter Dev-Modus gilt nur in der Session, die ihn gesetzt hat.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const LEVELS = ['lite', 'full', 'ultra'];
const DEFAULT_LEVEL = 'full';
const SKILL_PATH = path.join(__dirname, '..', 'skills', 'qatlas-dev', 'SKILL.md');
const isCodex = Boolean(process.env.PLUGIN_ROOT);

function stateDir() {
  if (isCodex && process.env.PLUGIN_DATA) {
    return path.join(process.env.PLUGIN_DATA, 'dev-sessions');
  }
  if (!isCodex && process.env.CLAUDE_PLUGIN_DATA) {
    return path.join(process.env.CLAUDE_PLUGIN_DATA, 'dev-sessions');
  }
  return path.join(os.homedir(), '.qatlas', 'dev-sessions');
}

function statePath(sessionId) {
  const id = String(sessionId || '').trim();
  if (!id) return null;
  const host = isCodex ? 'codex' : 'claude';
  const digest = crypto.createHash('sha256').update(id).digest('hex');
  return path.join(stateDir(), host + '-' + digest);
}

function normalizeLevel(value) {
  const level = String(value || '').trim().toLowerCase();
  return LEVELS.includes(level) ? level : null;
}

function readLevel(sessionId) {
  const target = statePath(sessionId);
  if (!target) return null;
  try { return normalizeLevel(fs.readFileSync(target, 'utf8').trim()); }
  catch { return null; }
}

function setLevel(sessionId, level) {
  const target = statePath(sessionId);
  if (!target) return;
  try {
    fs.mkdirSync(stateDir(), { recursive: true });
    fs.writeFileSync(target, level);
  } catch { /* Der Modus darf keinen Prompt blockieren. */ }
}

function clearLevel(sessionId) {
  const target = statePath(sessionId);
  if (!target) return;
  try { fs.unlinkSync(target); } catch { /* bereits aus */ }
}

function filterSkillBodyForLevel(body, level) {
  const withoutFrontmatter = String(body || '').replace(/^---[\s\S]*?---\s*/, '');
  return withoutFrontmatter.split(/\r?\n/).filter((line) => {
    const tableLabel = line.match(/^\|\s*\*\*(.+?)\*\*\s*\|/);
    if (tableLabel) {
      const rowLevel = normalizeLevel(tableLabel[1].trim());
      if (rowLevel) return rowLevel === level;
    }
    const exampleLabel = line.match(/^-\s*([^:]+):\s*„/);
    if (exampleLabel) {
      const exampleLevel = normalizeLevel(exampleLabel[1].trim());
      if (exampleLevel) return exampleLevel === level;
    }
    return true;
  }).join('\n');
}

function fallbackInstructions(level) {
  return [
    'QATLAS-DEV AKTIV, Stufe: ' + level + '.',
    'Nur auf tatsächliche Codearbeit anwenden. Erst den Ablauf verstehen, dann in dieser Reihenfolge prüfen:',
    'kein neuer Code nötig, vorhandenen Code wiederverwenden, Standardbibliothek, natives Plattform-Feature,',
    'installierte Dependency, eine Zeile, erst danach minimaler vollständiger Code. Root Cause statt Symptom.',
    'Nie Sicherheit, Datenverlustschutz, Barrierefreiheit oder ausdrückliche Anforderungen wegkürzen.',
  ].join('\n');
}

function instructions(level) {
  try {
    return filterSkillBodyForLevel(fs.readFileSync(SKILL_PATH, 'utf8'), level);
  } catch {
    return fallbackInstructions(level);
  }
}

function emit(event, level, context) {
  if (isCodex) {
    const output = { systemMessage: 'QATLAS-DEV:' + String(level).toUpperCase() };
    if (context) {
      output.hookSpecificOutput = { hookEventName: event, additionalContext: context };
    }
    process.stdout.write(JSON.stringify(output));
    return;
  }
  if (event === 'SubagentStart' && context) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: event, additionalContext: context },
    }));
    return;
  }
  if (context) process.stdout.write(context);
}

function isDeactivation(text) {
  const value = String(text || '').trim().toLowerCase().replace(/[.!?\s]+$/, '');
  return value === 'normal mode' || value === 'normaler modus' || value === 'stop dev' ||
    value === 'stop qatlas-dev';
}

const requestedEvent = process.argv[2];
const event = requestedEvent === 'prompt' ? 'UserPromptSubmit' :
  requestedEvent === 'end' ? 'SessionEnd' :
    requestedEvent === 'subagent' ? 'SubagentStart' : 'SessionStart';

let input = '';
let done = false;

function finish() {
  if (done) return;
  done = true;

  let payload = {};
  try { payload = JSON.parse(input.replace(/^﻿/, '')); }
  catch { /* Ohne gültigen Hook-Payload gibt es keinen sicheren Session-Scope. */ }

  const sessionId = payload.session_id;
  if (!sessionId) return;

  try {
    if (event === 'SessionEnd') {
      clearLevel(sessionId);
      return;
    }

    if (event === 'SessionStart') {
      if (payload.source === 'startup' || payload.source === 'clear') {
        clearLevel(sessionId);
        return;
      }
      const level = readLevel(sessionId);
      if (level) {
        emit('SessionStart', level,
          'QATLAS-DEV AKTIV, Stufe: ' + level + '\n\n' + instructions(level));
      }
      return;
    }

    if (event === 'SubagentStart') {
      const level = readLevel(sessionId);
      if (level) {
        emit('SubagentStart', level,
          'QATLAS-DEV AKTIV, Stufe: ' + level + '\n\n' + instructions(level));
      }
      return;
    }

    const prompt = String(payload.prompt || '').trim();
    const lower = prompt.toLowerCase();
    const command = lower.match(/^[/@$](?:qatlas-dev:)?qatlas-dev(?![-\w])\s*(\w+)?/);

    if (command) {
      const argument = command[1] || '';
      if (argument === 'off' || argument === 'stop') {
        clearLevel(sessionId);
        emit('UserPromptSubmit', 'off', 'QATLAS-DEV AUS');
        return;
      }
      const level = normalizeLevel(argument) || DEFAULT_LEVEL;
      setLevel(sessionId, level);
      emit('UserPromptSubmit', level,
        'QATLAS-DEV AKTIVIERT, Stufe: ' + level + '. Nur auf tatsächliche Codearbeit anwenden.');
      return;
    }

    if (isDeactivation(lower)) {
      clearLevel(sessionId);
      emit('UserPromptSubmit', 'off', 'QATLAS-DEV AUS');
      return;
    }

    const level = readLevel(sessionId);
    if (level) {
      emit('UserPromptSubmit', level,
        'QATLAS-DEV AKTIV, Stufe: ' + level + '. Nur auf tatsächliche Codearbeit anwenden.');
    }
  } catch { /* Best Effort: nie den Prompt oder das Session-Ende blockieren. */ }
}

process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', finish);
process.stdin.on('error', () => { finish(); process.exit(0); });
setTimeout(() => { finish(); process.exit(0); }, 1000).unref();
