#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const hook = path.resolve(__dirname, '..', 'plugins', 'qatlas-dev', 'hooks', 'qatlas-dev-mode.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qatlas-dev-'));
// A closed environment: the hook sees no variable of the calling session and writes only below root.
const env = { PATH: process.env.PATH, HOME: path.join(root, 'home'), CLAUDE_PLUGIN_DATA: path.join(root, 'data') };
fs.mkdirSync(env.HOME);

let sessions = 0;
const session = () => 'session-' + ++sessions;

// The injected context, or null when the hook stays silent.
function fire(event, payload) {
  const result = spawnSync(process.execPath, [hook, event], { input: JSON.stringify(payload), encoding: 'utf8', env });
  assert.strictEqual(result.status, 0, result.stderr);
  if (!result.stdout) return null;
  const output = JSON.parse(result.stdout).hookSpecificOutput;
  assert.strictEqual(output.hookEventName, event);
  return output.additionalContext;
}
const prompt = (id, text) => fire('UserPromptSubmit', { session_id: id, prompt: text });
const start = (id, source) => fire('SessionStart', { session_id: id, source });
const active = level => 'QATLAS-DEV MODE ACTIVE, level: ' + level + '. Apply it to code work only.';

try {
  // Without a set mode every event stays silent.
  let id = session();
  assert.strictEqual(prompt(id, 'fix the bug'), null);
  assert.strictEqual(start(id, 'resume'), null);
  assert.strictEqual(start(id, 'compact'), null);
  assert.strictEqual(fire('SubagentStart', { session_id: id }), null);
  assert.strictEqual(fire('UserPromptSubmit', { prompt: '/qatlas-dev' }), null, 'No session id, no mode.');
  assert.ok(!fs.existsSync(path.join(env.CLAUDE_PLUGIN_DATA, 'sessions')), 'Nothing is stored without a mode.');

  // Every host prefix sets the mode, bare or namespaced, at the default level.
  for (const call of ['/qatlas-dev', '$qatlas-dev', '@qatlas-dev', '/qatlas-dev:qatlas-dev', '  /QATLAS-DEV  ']) {
    id = session();
    assert.strictEqual(prompt(id, call), active('full'), call);
    assert.strictEqual(prompt(id, 'next task'), active('full'), 'The mode holds on the following prompts.');
  }

  for (const level of ['lite', 'full', 'ultra']) {
    id = session();
    assert.strictEqual(prompt(id, '$qatlas-dev ' + level), active(level));
    assert.strictEqual(prompt(id, '/qatlas-dev'), active(level), 'A bare call keeps the level already set.');
  }
  id = session();
  prompt(id, '/qatlas-dev lite');
  assert.strictEqual(prompt(id, '/qatlas-dev ultra'), active('ultra'), 'A new level replaces the old one.');

  // Only the invocation at the start of the message switches the mode.
  id = session();
  for (const text of ['qatlas-dev', 'please use /qatlas-dev', '/qatlas-dev-review', '$qatlas-dev-audit',
    '/qatlas-dev:qatlas-dev-review', '@qatlas-dev:qatlas-dev-audit ultra', '/qatlas-developer']) {
    assert.strictEqual(prompt(id, text), null, text);
  }
  assert.strictEqual(start(id, 'resume'), null);

  // The mode belongs to the session that set it.
  const owner = session();
  prompt(owner, '/qatlas-dev ultra');
  assert.strictEqual(prompt(session(), 'fix the bug'), null);

  // Resume, compaction and subagents get the rules again, cut to the active level.
  for (const context of [start(owner, 'resume'), start(owner, 'compact'), fire('SubagentStart', { session_id: owner })]) {
    assert.ok(context.startsWith(active('ultra') + '\n\n# qatlas-dev'), context.slice(0, 80));
    assert.match(context, /^\| \*\*ultra\*\* \|/m);
    assert.doesNotMatch(context, /^\| \*\*(lite|full)\*\* \|/m);
    assert.doesNotMatch(context, /^---$/m, 'The frontmatter is not injected.');
  }

  // off and "stop qatlas-dev" as the whole message end the mode.
  for (const off of ['/qatlas-dev off', '$qatlas-dev:qatlas-dev off', 'stop qatlas-dev', 'Stop qatlas-dev!']) {
    id = session();
    prompt(id, '/qatlas-dev');
    assert.strictEqual(prompt(id, off), 'QATLAS-DEV MODE OFF', off);
    assert.strictEqual(prompt(id, 'next task'), null, off);
    assert.strictEqual(start(id, 'resume'), null, off);
  }
  id = session();
  prompt(id, '/qatlas-dev');
  assert.strictEqual(prompt(id, 'please stop qatlas-dev now'), active('full'), 'Only the whole message turns it off.');

  // clear ends the mode with the context.
  assert.strictEqual(start(id, 'clear'), null);
  assert.strictEqual(start(id, 'resume'), null);
  assert.strictEqual(prompt(id, 'next task'), null);

  // A broken payload never blocks the session.
  const broken = spawnSync(process.execPath, [hook, 'UserPromptSubmit'], { input: 'no json', encoding: 'utf8', env });
  assert.strictEqual(broken.status, 0);
  assert.strictEqual(broken.stdout, '');

  assert.deepStrictEqual(fs.readdirSync(root).sort(), ['data', 'home'], 'The hook writes only into its data folder.');
  assert.deepStrictEqual(fs.readdirSync(env.HOME), []);
  process.stdout.write('✓ Qatlas-Dev: mode set, kept, re-injected and ended as specified.\n');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
