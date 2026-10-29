'use strict';

// Shared frontmatter parser for handover reports (team handover check, land).
// parseFrontmatter(text) returns null without frontmatter, else {data}. Errors carry a kind:
// "load" (YAML parser not loadable), "yaml" (invalid YAML), "mapping" (not a mapping).
const path = require('path');

const fail = (kind, message) => Object.assign(new Error(message), { kind });

function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!match) return null;
  let YAML;
  try {
    YAML = require(path.join(__dirname, '..', '..', '..', 'scripts', 'runtime', 'vendor', 'yaml-2.9.0.js'));
  } catch (error) { throw fail('load', error.message.split('\n')[0]); }
  let data;
  try {
    const document = YAML.parseDocument(match[1], {
      version: '1.2', schema: 'core', merge: false, resolveKnownTags: false, uniqueKeys: true, stringKeys: true, logLevel: 'error',
    });
    if (document.errors.length) throw document.errors[0];
    data = document.toJS({ maxAliasCount: 0 });
  } catch (error) { throw fail('yaml', error.message.split('\n')[0]); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw fail('mapping', 'frontmatter must be a mapping.');
  return { data };
}

module.exports = { parseFrontmatter };
