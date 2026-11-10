#!/usr/bin/env node
'use strict';
// An explicitly set dev mode applies only to the session that set it: set on invocation,
// re-injected after compaction and into subagents, cleared at session end.

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const LEVELS = ['lite', 'full', 'ultra'];
const DEFAULT_LEVEL = 'full';
const SKILL_PATH = path.join(__dirname, '..', 'skills', 'qatlas-dev', 'SKILL.md');
const STATE_DIR = path.join(process.env.CLAUDE_PLUGIN_DATA || process.env.PLUGIN_DATA ||
  path.join(os.homedir(), '.qatlas', 'state', 'qatlas-dev'), 'sessions');
const event = process.argv[2];

function statePath(sessionId) {
  return path.join(STATE_DIR, crypto.createHash('sha256').update(String(sessionId)).digest('hex'));
}

function normalizeLevel(value) {
  const level = String(value || '').trim().toLowerCase();
  return LEVELS.includes(level) ? level : null;
}

function readLevel(sessionId) {
  try { return normalizeLevel(fs.readFileSync(statePath(sessionId), 'utf8')); }
  catch { return null; }
}

function setLevel(sessionId, level) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(statePath(sessionId), level);
}

function clearLevel(sessionId) {
  try { fs.unlinkSync(statePath(sessionId)); } catch { /* already off */ }
}

// Keeps only the active level's row of the level table.
function filterSkillBodyForLevel(body, level) {
  return body.replace(/^---[\s\S]*?---\s*/, '').split(/\r?\n/).filter((line) => {
    const label = line.match(/^\|\s*\*\*(.+?)\*\*\s*\|/);
    const rowLevel = label && normalizeLevel(label[1]);
    return !rowLevel || rowLevel === level;
  }).join('\n');
}

function status(level) {
  return 'QATLAS-DEV MODE ACTIVE, level: ' + level + '. Apply it to code work only.';
}

function rules(level) {
  return status(level) + '\n\n' + filterSkillBodyForLevel(fs.readFileSync(SKILL_PATH, 'utf8'), level);
}

// Claude Code and Codex both read this form for every event used here.
// Synchronous write: the process exits right after.
function emit(context) {
  fs.writeSync(1, JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context } }));
}

function isDeactivation(prompt) {
  const value = prompt.replace(/[.!?\s]+$/, '');
  return value === 'stop qatlas-dev' || value === 'normal mode';
}

function handle(payload) {
  const sessionId = payload.session_id;
  if (!sessionId) return;

  if (event === 'SessionEnd') {
    clearLevel(sessionId);
    return;
  }

  if (event === 'SessionStart' || event === 'SubagentStart') {
    const level = readLevel(sessionId);
    if (level) emit(rules(level));
    return;
  }

  const prompt = String(payload.prompt || '').trim().toLowerCase();
  const command = prompt.match(/^[/@$](?:qatlas-dev:)?qatlas-dev(?![-\w:])\s*(\S*)/);
  const argument = command ? command[1] : null;

  if (argument === 'off' || argument === 'stop' || isDeactivation(prompt)) {
    clearLevel(sessionId);
    emit('QATLAS-DEV MODE OFF');
    return;
  }

  let level = readLevel(sessionId);
  if (argument === '' || normalizeLevel(argument)) {
    level = normalizeLevel(argument) || level || DEFAULT_LEVEL;
    setLevel(sessionId, level);
  }
  if (level) emit(status(level));
}

let input = '';

function finish() {
  try { handle(JSON.parse(input.replace(/^﻿/, ''))); }
  catch { /* a hook defect must never block the session */ }
  process.exit(0);
}

process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', finish);
process.stdin.on('error', finish);
// Stays ref'd: a stuck stdin (Windows PowerShell wrapper) must not keep the hook alive.
setTimeout(finish, 1000);
