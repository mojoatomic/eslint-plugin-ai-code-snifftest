#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      out[k] = v === undefined ? true : v;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function writeConfig(cwd, cfg) {
  const file = path.join(cwd, '.ai-coding-guide.json');
  if (fs.existsSync(file) && !process.env.FORCE_AI_CONFIG) {
    console.log(`Found existing ${file} — use FORCE_AI_CONFIG=1 to overwrite.`);
    return 0;
  }
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`Wrote ${file}`);
  return 0;
}

function init(cwd, args) {
  const primary = (args.primary || 'general').trim();
  const additional = (args.additional || '').split(',').map(s => s.trim()).filter(Boolean);
  const domainPriority = [primary, ...additional];
  const cfg = {
    domains: { primary, additional },
    domainPriority,
    constants: {},
    terms: { entities: [], properties: [], actions: [] },
    naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true },
    antiPatterns: { forbiddenNames: [], forbiddenTerms: [] }
  };
  return writeConfig(cwd, cfg);
}

function usage() {
  console.log(`Usage: eslint-plugin-ai-code-snifftest init [--primary=<domain>] [--additional=a,b,c]

Examples:
  eslint-plugin-ai-code-snifftest init --primary=astronomy --additional=geometry,math,units
`);
}

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  const cwd = process.cwd();
  if (cmd === 'init') {
    process.exitCode = init(cwd, args);
    return;
  }
  usage();
}

main();