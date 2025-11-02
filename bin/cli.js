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

function suggestFor(primary) {
  const map = {
    astronomy: ['geometry','math','units'],
    music: ['math','cs'],
    physics: ['math','units','cs'],
    finance: ['math','statistics']
  };
  return map[primary] || [];
}

function ask(rl, q) {
  return new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));
}

async function initInteractive(cwd) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const primary = (await ask(rl, 'Primary domain (default: general): ')).trim() || 'general';
    const suggested = suggestFor(primary);
    if (suggested.length) {
      console.log(`Suggested additional domains for ${primary}: ${suggested.join(', ')}`);
    }
    const addAns = (await ask(rl, 'Additional domains (comma-separated, optional): ')).trim();
    const additional = addAns ? addAns.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const domainPriority = [primary, ...additional];
    console.log(`\nSummary:\n  primary: ${primary}\n  additional: ${additional.join(', ') || '(none)'}\n  domainPriority: ${domainPriority.join(', ')}`);
    const confirm = (await ask(rl, 'Write .ai-coding-guide.json with these settings? (Y/n): ')).trim().toLowerCase();
    if (confirm && confirm.startsWith('n')) {
      console.log('Aborted.');
      return 1;
    }
    const cfg = {
      domains: { primary, additional },
      domainPriority,
      constants: {},
      terms: { entities: [], properties: [], actions: [] },
      naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true },
      antiPatterns: { forbiddenNames: [], forbiddenTerms: [] }
    };
    const code = writeConfig(cwd, cfg);
    const gen = (await ask(rl, 'Generate .ai-coding-guide.md and .cursorrules? (Y/n): ')).trim().toLowerCase();
    if (!gen || gen.startsWith('y')) {
      writeGuideMd(cwd, cfg);
      writeCursorRules(cwd, cfg);
    }
    return code;
  } finally {
    rl.close();
  }
}

function writeGuideMd(cwd, cfg) {
  const file = path.join(cwd, '.ai-coding-guide.md');
  const md = `# AI Coding Guide\n\nPrimary domain: ${cfg.domains.primary}\nAdditional domains: ${cfg.domains.additional.join(', ') || '(none)'}\nDomain priority: ${cfg.domainPriority.join(', ')}\n\nGuidance:\n- Use domain annotations (@domain/@domains) for ambiguous constants\n- Prefer constants and terms from active domains\n`;
  fs.writeFileSync(file, md);
  console.log(`Wrote ${file}`);
}

function writeCursorRules(cwd, cfg) {
  const file = path.join(cwd, '.cursorrules');
  const payload = {
    rules: [
      `Primary domain: ${cfg.domains.primary}`,
      `Additional domains: ${cfg.domains.additional.join(', ')}`,
      'Prefer explicit @domain annotations for ambiguous constants.'
    ]
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n');
  console.log(`Wrote ${file}`);
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
  const code = writeConfig(cwd, cfg);
  if (args.md) writeGuideMd(cwd, cfg);
  if (args.cursor) writeCursorRules(cwd, cfg);
  return code;
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
    if (!args.primary && process.stdin.isTTY) {
      initInteractive(cwd).then((code)=>{ process.exitCode = code; });
      return;
    }
    process.exitCode = init(cwd, args);
    return;
  }
  usage();
}

main();