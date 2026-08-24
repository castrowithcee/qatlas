#!/usr/bin/env node
'use strict';

// Telegram-Ping. Konfiguration und Credentials bleiben getrennt unter ~/.qatlas/plugins/.

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');
const {
  createConfig,
  createCredentials,
  readConfig,
  readCredentials,
} = require('./runtime/config-loader.js');

const args = process.argv.slice(2);
const TEST = args.includes('--test');
const INIT = args.includes('--init');
const TALK = TEST || INIT;
const BODY_MAX = 500;

function say(message) { if (TALK) process.stdout.write(message + '\n'); }
function done(code) { process.exit(TALK ? code : 0); }

if (INIT) {
  let config = readConfig();
  let credentials = readCredentials();
  const created = [];
  try {
    if (!config.exists) created.push(createConfig());
    if (!credentials.exists) created.push(createCredentials());
  } catch (error) {
    say('Gerüst konnte nicht angelegt werden: ' + error.message);
    done(1);
  }
  config = readConfig();
  credentials = readCredentials();
  if (!config.valid || !credentials.valid) {
    const problems = config.diagnostics.slice();
    if (!credentials.valid) problems.push(credentials.credentialsFile + ': ' + credentials.error.message);
    say('Vorhandene YAML-Datei ist ungültig und bleibt unverändert: ' + problems.join('; '));
    done(1);
  }
  if (created.length) say('Angelegt:\n- ' + created.join('\n- '));
  else say('Konfiguration und Credentials sind bereits vorhanden. Bestehende Dateien bleiben unverändert.');
  say('Trage Token und Chat-ID unter connections.telegram.default in credentials.yaml ein.');
  done(0);
}

const configState = readConfig();
const credentialState = readCredentials();
if (!configState.valid) {
  say('Die Plugin-Konfiguration ist ungültig: ' + configState.diagnostics.join('; '));
  done(1);
}
if (!credentialState.exists || !credentialState.valid) {
  say('Keine gültigen Credentials unter ' + credentialState.credentialsFile + '. Lege mit --init ein Gerüst an.');
  done(TEST ? 1 : 0);
}

const telegram = configState.config.notifications.telegram || {};
const profile = typeof telegram.connection === 'string' && telegram.connection ? telegram.connection : 'default';
const provider = credentialState.credentials.connections
  && credentialState.credentials.connections.telegram;
const credential = provider && provider[profile] && typeof provider[profile] === 'object'
  ? provider[profile] : {};
const token = typeof credential.token === 'string' ? credential.token : '';
const chatId = credential['chat-id'];
const configured = Boolean(token && (typeof chatId === 'string' || typeof chatId === 'number'));
const enabled = configured && telegram.enabled === true;

if (!TEST && !enabled) done(0);
if (TEST && !configured) {
  say('Fülle zuerst token und chat-id für connections.telegram.' + profile
    + ' in ' + credentialState.credentialsFile + ' aus.');
  done(1);
}

const agent = process.env.PLUGIN_ROOT ? 'Codex' : 'Claude Code';
const host = os.hostname();
let payload = {};
if (!TEST && !process.stdin.isTTY) {
  try {
    const raw = fs.readFileSync(0, 'utf8').replace(/^﻿/, '');
    if (raw) payload = JSON.parse(raw);
  } catch { /* Standardwerte verwenden. */ }
}

const cwd = typeof payload.cwd === 'string' && payload.cwd ? payload.cwd : process.cwd();
const dir = path.basename(cwd);
let branch = null;
try {
  branch = execFileSync('git', ['-C', cwd, 'rev-parse', '--abbrev-ref', 'HEAD'], {
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString().trim();
  if (branch === 'HEAD') {
    branch = execFileSync('git', ['-C', cwd, 'rev-parse', '--short', 'HEAD'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  }
} catch { /* Kein Repo oder kein Git: keine Branch-Zeile. */ }

let body = TEST ? 'Test-Ping von qatlas. Der Kanal funktioniert.'
  : String(payload.message || '').trim() || 'Warte auf deine Eingabe.';
if (body.length > BODY_MAX) body = body.slice(0, BODY_MAX - 1).trimEnd() + '…';

const project = branch ? dir + '/' + branch : dir;
const text = '🔔 ' + host + ' · ' + agent + '\n' + project + '\n\n' + body;
const data = JSON.stringify({ chat_id: chatId, text });
const request = https.request({
  hostname: 'api.telegram.org',
  path: '/bot' + token + '/sendMessage',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  timeout: 8000,
}, response => {
  let output = '';
  response.on('data', chunk => { output += chunk; });
  response.on('end', () => {
    if (response.statusCode === 200) {
      say('Gesendet. Prüfe Telegram.' + (TEST
        ? ' Aktiviere den Kanal anschließend in config.yaml mit notifications.telegram.enabled: true.' : ''));
      done(0);
    }
    let reason = 'HTTP ' + response.statusCode;
    try {
      const parsed = JSON.parse(output);
      if (parsed.description) reason = parsed.description;
    } catch { /* Status behalten. */ }
    say('Telegram hat die Nachricht abgelehnt: ' + reason);
    done(1);
  });
});
request.on('error', error => {
  say('Telegram nicht erreichbar: ' + (error.code || error.message));
  done(1);
});
request.on('timeout', () => {
  request.destroy();
  say('Zeitüberschreitung der Telegram-Anfrage.');
  done(1);
});
request.write(data);
request.end();
