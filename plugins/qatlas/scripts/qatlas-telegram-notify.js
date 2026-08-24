#!/usr/bin/env node
'use strict';

// Telegram-Ping. Hook-Modus schweigt, --init legt die leere Konfiguration an, --test meldet und aktiviert.
// Der Token liegt nur in ~/.qatlas/telegram.json und erscheint nie in Ausgaben oder Fehlern.

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const TEST = args.includes('--test');
const INIT = args.includes('--init');
const TALK = TEST || INIT;
const CONFIG = path.join(os.homedir(), '.qatlas', 'telegram.json');
const BODY_MAX = 500; // Für die Smartphone-Vorschau; Telegram erlaubt 4096.

// Der Hook-Modus schweigt und blockiert die Session nie mit einem Fehlercode.
function say(msg) { if (TALK) process.stdout.write(msg + '\n'); }
function done(code) { process.exit(TALK ? code : 0); }

if (INIT) {
  fs.mkdirSync(path.dirname(CONFIG), { recursive: true });
  if (fs.existsSync(CONFIG)) {
    say('Konfiguration bereits unter ' + CONFIG + '. Fülle leere Werte für "token" und "chat_id" aus und führe danach --test aus.');
  } else {
    fs.writeFileSync(CONFIG, JSON.stringify({ enabled: false, token: '', chat_id: '' }, null, 2) + '\n');
    say('Gerüst angelegt unter ' + CONFIG + '. Öffne es, füge Bot-Token und Chat-ID ein und führe danach --test aus.');
  }
  done(0);
}

let cfg;
try { cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8')); }
catch { say('Keine Konfiguration unter ' + CONFIG + '. Lege mit --init ein Gerüst an und fülle es aus.'); done(0); }

const configured = !!(cfg && cfg.token && cfg.chat_id);
// Nur false schaltet aus; ein fehlender Schlüssel bleibt abwärtskompatibel aktiv.
const on = configured && cfg.enabled !== false;

if (!TEST) {
  if (!on) done(0);
} else if (!configured) {
  say('Fülle zuerst "token" und "chat_id" in ' + CONFIG + ' aus. Mit --init legst du ein Gerüst an.');
  done(1);
}

// PLUGIN_ROOT unterscheidet Codex von Claude.
const agent = process.env.PLUGIN_ROOT ? 'Codex' : 'Claude Code';
const host = os.hostname();

let payload = {};
if (!TEST && !process.stdin.isTTY) {
  try {
    const raw = fs.readFileSync(0, 'utf8').replace(/^﻿/, ''); // BOM tolerieren.
    if (raw) payload = JSON.parse(raw);
  } catch { /* Standardwerte verwenden. */ }
}

const cwd = (typeof payload.cwd === 'string' && payload.cwd) ? payload.cwd : process.cwd();
const dir = path.basename(cwd);

// Bei Detached HEAD den kurzen SHA verwenden, außerhalb eines Repos den Branch weglassen.
let branch = null;
try {
  branch = execFileSync('git', ['-C', cwd, 'rev-parse', '--abbrev-ref', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  if (branch === 'HEAD') {
    branch = execFileSync('git', ['-C', cwd, 'rev-parse', '--short', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  }
} catch { /* Kein Repo oder kein Git: keine Branch-Zeile. */ }

let body = TEST ? 'Test-Ping von qatlas. Der Kanal funktioniert.'
  : String(payload.message || '').trim() || 'Warte auf deine Eingabe.';
if (body.length > BODY_MAX) body = body.slice(0, BODY_MAX - 1).trimEnd() + '…';

const project = branch ? dir + '/' + branch : dir;
const text = '🔔 ' + host + ' · ' + agent + '\n' + project + '\n\n' + body;

// Klartext vermeidet MarkdownV2-Probleme mit Branch-Namen und Nachrichtentexten.
const data = JSON.stringify({ chat_id: cfg.chat_id, text });
const req = https.request({
  hostname: 'api.telegram.org',
  path: '/bot' + cfg.token + '/sendMessage',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  timeout: 8000,
}, (res) => {
  let out = '';
  res.on('data', (c) => { out += c; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      // Ein erfolgreicher Test ändert nur enabled.
      if (TEST && cfg.enabled !== true) {
        try { cfg.enabled = true; fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2) + '\n'); }
        catch { /* Versand erfolgreich, Einschalten nach bestem Bemühen. */ }
      }
      say('Gesendet. Prüfe Telegram.' + (TEST ? ' Der Kanal ist eingeschaltet.' : ''));
      done(0);
    }
    // Nie die Request-URL melden, sie enthält den Token.
    let why = 'HTTP ' + res.statusCode;
    try { const j = JSON.parse(out); if (j.description) why = j.description; } catch { /* Status behalten. */ }
    say('Telegram hat die Nachricht abgelehnt: ' + why);
    done(1);
  });
});
req.on('error', (e) => { say('Telegram nicht erreichbar: ' + (e.code || e.message)); done(1); });
req.on('timeout', () => { req.destroy(); say('Zeitüberschreitung der Telegram-Anfrage.'); done(1); });
req.write(data);
req.end();
