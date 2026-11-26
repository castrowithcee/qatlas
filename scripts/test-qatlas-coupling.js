#!/usr/bin/env node
'use strict';

// Keeps text and code equal where both state the same fact. Read-only: it parses the shipped files and
// runs nothing of them.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const plugin = path.resolve(__dirname, '..', 'plugins', 'qatlas');
const read = (...parts) => fs.readFileSync(path.join(plugin, ...parts), 'utf8');
const evaluate = source => new Function('return (' + source + ');')();
const mentions = (text, word) => new RegExp('(?<![\\w-])' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])').test(text);

// Status transitions: the list in the backlog norm against the table of the backlog script.
{
  const script = read('scripts', 'qatlas-backlog.js').match(/const WAYS = (\{[\s\S]*?\n\});/);
  assert.ok(script, 'qatlas-backlog.js no longer declares the table WAYS as an object literal.');
  const coded = evaluate(script[1]);

  const norm = read('skills', 'qatlas-core-backlog', 'SKILL.md');
  const start = norm.indexOf('Zulässige Wege:');
  assert.ok(start >= 0, 'The backlog norm no longer has the list "Zulässige Wege".');
  const written = Object.fromEntries(Object.keys(coded).map(status => [status, new Set()]));
  const list = norm.slice(start).split('\n').slice(1);
  let seen = 0;
  for (const line of list) {
    const way = line.match(/^- `([^`]+) -> ([^`]+)`/);
    if (!way) { if (seen && /^- /.test(line)) break; continue; }
    seen++;
    for (const from of way[1].split('|').map(part => part.trim())) {
      for (const to of way[2].split('|').map(part => part.trim())) (written[from] ||= new Set()).add(to);
    }
  }
  assert.ok(seen, 'The list "Zulässige Wege" has no line of the form `a -> b | c`.');
  const sorted = ways => Object.fromEntries(Object.keys(ways).sort().map(status => [status, [...ways[status]].sort()]));
  assert.deepStrictEqual(sorted(written), sorted(coded),
    'The transitions of the backlog norm (actual) differ from WAYS in qatlas-backlog.js (expected).');
}

// Event types of a run: every type the control script counts or evaluates is named in the role texts.
{
  const run = ['skills', 'qatlas', 'modes', 'run'];
  const script = read(...run, 'scripts', 'qatlas-run.js');
  const counted = script.match(/const counts = (\{[^}]*\});/);
  assert.ok(counted, 'qatlas-run.js no longer declares the counted log types as the object literal counts.');
  const evaluated = [...script.matchAll(/\bcount\('([a-z][a-z0-9-]*)'\)/g)].map(match => match[1]);
  assert.ok(evaluated.length, 'qatlas-run.js no longer evaluates note types with count(\'<type>\').');
  const texts = ['run.md', 'lead.md', 'integrator.md'].map(name => read(...run, name)).join('\n');
  for (const type of new Set([...Object.keys(evaluate(counted[1])), ...evaluated])) {
    assert.ok(mentions(texts, type), `qatlas-run.js counts the event type ${type}, but run.md, lead.md and integrator.md never name it.`);
  }
}

// Command card: every mode of the three routers stands on the card.
{
  const card = read('skills', 'qatlas-help', 'references', 'card.md');
  for (const router of ['qatlas', 'qatlas-core', 'qatlas-mode']) {
    const hint = read('skills', router, 'SKILL.md').match(/^argument-hint:\s*"\[([^\]]+)\]/m);
    assert.ok(hint, `${router}/SKILL.md has no argument-hint that starts with its modes.`);
    for (const mode of hint[1].split('|')) {
      assert.ok(mentions(card, router + ' ' + mode), `card.md lacks the call ${router} ${mode} from the argument-hint of ${router}.`);
    }
  }
}

// Naming rule: the prefix examples of the structure reference match prefixOf of the knowledge checks.
{
  const script = read('scripts', 'runtime', 'knowledge-checks.js').match(/const prefixOf = ([^;]+);/);
  assert.ok(script, 'knowledge-checks.js no longer declares prefixOf in one statement.');
  const prefixOf = evaluate(script[1]);
  const structure = read('skills', 'qatlas-core-filing', 'references', 'structure.md');
  const section = (structure.split(/^## Dateinamen$/m)[1] || '').split(/^## /m)[0];
  assert.ok(section, 'structure.md no longer has the section "Dateinamen".');

  const examples = section.match(/Das Präfix ist der Name ihres\s+Ordners, etwa ([^.]+)\./);
  assert.ok(examples, 'The section "Dateinamen" no longer lists prefix examples after "etwa".');
  const named = [...examples[1].matchAll(/`([a-z-]+)-`/g)].map(match => match[1]);
  assert.ok(named.length, 'The prefix examples are no longer written as `<name>-`.');
  for (const folder of named) {
    assert.strictEqual(prefixOf(folder) + '-', folder + '-', `structure.md gives ${folder}- as the prefix of ${folder}/.`);
  }

  const special = [...section.matchAll(/Nur bei `([a-z-]+)\/` lautet es\s+`([a-z-]+-)`/g)].map(match => [match[1], match[2]]);
  for (const [folder, prefix] of special) {
    assert.strictEqual(prefixOf(folder) + '-', prefix, `structure.md gives ${prefix} as the prefix of ${folder}/.`);
  }
  // Every folder prefixOf treats on its own is one of the stated exceptions.
  for (const [, folder] of script[1].matchAll(/folder === '([^']+)'/g)) {
    assert.ok(special.some(([name]) => name === folder), `prefixOf treats ${folder}/ on its own, but structure.md does not state it.`);
  }
}

process.stdout.write('✓ Qatlas-Kopplung: Statuswege, Ereignistypen, Befehlskarte und Namensregel stimmen in Text und Code überein.\n');
