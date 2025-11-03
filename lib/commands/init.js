"use strict";

const fs = require('fs');
const path = require('path');
const { generateCodingGuideJson } = require(path.resolve(__dirname, '..', 'generators', 'coding-guide-json.js'));
const { generateCodingGuideMd } = require(path.resolve(__dirname, '..', 'generators', 'coding-guide-md.js'));
const { generateAgentsMd } = require(path.resolve(__dirname, '..', 'generators', 'agents-md.js'));
const { generateCursorrules } = require(path.resolve(__dirname, '..', 'generators', 'cursorrules.js'));
const { generateEslintConfig } = require(path.resolve(__dirname, '..', 'generators', 'eslint-config.js'));

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

async function initInteractive(cwd, args) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    let primary = (await ask(rl, 'Primary domain (default: general): ')).trim() || 'general';
    const suggested = suggestFor(primary);
    if (suggested.length) {
      console.log(`Suggested additional domains for ${primary}: ${suggested.join(', ')}`);
    }
    let addAns = (await ask(rl, 'Additional domains (comma-separated, optional): ')).trim();

    const external = Boolean(args && (args.external || args.experimentalExternalConstants));
    if (external) {
      try {
        const { discoverConstants } = require('../utils/discover-constants');
        const { mergeConstants } = require('../utils/merge-constants');
        const discovered = discoverConstants(cwd);
        const merged = mergeConstants(discovered);
        const sourcesByDomain = {};
        for (const [d, data] of Object.entries(merged || {})) {
          const srcs = (data.sources || []).map(s => s.type);
          sourcesByDomain[d] = Array.from(new Set(srcs)).join(',');
        }
        const domainList = Object.keys(sourcesByDomain).sort();
        if (domainList.length) {
          console.log('\nDiscovered domains (experimental):');
          domainList.forEach((d, i) => console.log(`  [${i+1}] ${d} (${sourcesByDomain[d]})`));
          const priPick = (await ask(rl, 'Pick primary by name or index (Enter to keep): ')).trim();
          if (priPick) {
            const idx = Number(priPick);
            if (Number.isInteger(idx) && idx>=1 && idx<=domainList.length) {
              primary = domainList[idx-1];
            } else if (domainList.includes(priPick)) {
              primary = priPick;
            }
          }
          const addPick = (await ask(rl, 'Pick additional (comma-separated names or indices, Enter to keep): ')).trim();
          if (addPick) {
            const tokens = addPick.split(',').map(s=>s.trim()).filter(Boolean);
            const chosen = [];
            for (const t of tokens) {
              const n = Number(t);
              if (Number.isInteger(n) && n>=1 && n<=domainList.length) chosen.push(domainList[n-1]);
              else if (domainList.includes(t)) chosen.push(t);
            }
            if (chosen.length) addAns = chosen.join(',');
          }
        }
      } catch (err) {
        console.warn(`(external discovery skipped: ${err && err.message})`);
      }
    }

    const additional = addAns ? addAns.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const domainPriority = [primary, ...additional];
    console.log(`\nSummary:\n  primary: ${primary}\n  additional: ${additional.join(', ') || '(none)'}\n  domainPriority: ${domainPriority.join(', ')}`);
    const confirm = (await ask(rl, 'Write .ai-coding-guide.json with these settings? (Y/n): ')).trim().toLowerCase();
    if (confirm && confirm.startsWith('n')) {
      console.log('Aborted.');
      return 1;
    }
    const cfg = buildConfigFromArgs({ primary, additional }, args);
    writeAll(cwd, cfg, { md: true, cursor: true, agents: true });
    return 0;
  } finally {
    rl.close();
  }
}

function buildConfigFromArgs(domains, args) {
  const primary = domains.primary;
  const additional = domains.additional || [];
  const domainPriority = [primary, ...additional];
  const external = Boolean(args && (args.external || args.experimentalExternalConstants));
  const allowlist = (args && args.allowlist ? String(args.allowlist) : '').split(',').map(s=>s.trim()).filter(Boolean);
  const cfg = {
    domains: { primary, additional },
    domainPriority,
    constants: {},
    terms: { entities: [], properties: [], actions: [] },
    naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true },
    antiPatterns: { forbiddenNames: [], forbiddenTerms: [] },
    experimentalExternalConstants: external,
    externalConstantsAllowlist: allowlist
  };
  if (external && (!allowlist || allowlist.length === 0)) {
    console.warn('Warning: --external used without allowlist; consider adding --allowlist to limit npm scope.');
  }
  return cfg;
}

function writeAll(cwd, cfg, flags) {
  // .ai-coding-guide.json
  const json = generateCodingGuideJson(cwd, cfg);
  fs.writeFileSync(path.join(cwd, '.ai-coding-guide.json'), json);
  // .ai-coding-guide.md
  if (flags.md) fs.writeFileSync(path.join(cwd, '.ai-coding-guide.md'), generateCodingGuideMd(cwd, cfg));
  // .cursorrules
  if (flags.cursor) fs.writeFileSync(path.join(cwd, '.cursorrules'), generateCursorrules(cfg));
  // AGENTS.md
  if (flags.agents) fs.writeFileSync(path.join(cwd, 'AGENTS.md'), generateAgentsMd(cwd, cfg));
}

function writeEslint(cwd) {
  const content = generateEslintConfig();
  const file = path.join(cwd, 'eslint.config.js');
  if (fs.existsSync(file) && !process.env.FORCE_ESLINT_CONFIG) {
    console.log(`Found existing ${file} — set FORCE_ESLINT_CONFIG=1 to overwrite.`);
    return;
  }
  fs.writeFileSync(file, content);
}

async function initCommand(cwd, args) {
  const primary = (args.primary || 'general').trim();
  const additional = (args.additional || '').split(',').map(s => s.trim()).filter(Boolean);
  const cfg = buildConfigFromArgs({ primary, additional }, args);
  fs.writeFileSync(path.join(cwd, '.ai-coding-guide.json'), generateCodingGuideJson(cwd, cfg));
  if (args.md || args.yes) fs.writeFileSync(path.join(cwd, '.ai-coding-guide.md'), generateCodingGuideMd(cwd, cfg));
  if (args.cursor || args.yes) fs.writeFileSync(path.join(cwd, '.cursorrules'), generateCursorrules(cfg));
  const hasWarp = fs.existsSync(path.join(cwd, 'WARP.md'));
  if (args.agents || hasWarp || args.yes || (!args.md && !args.cursor)) {
    fs.writeFileSync(path.join(cwd, 'AGENTS.md'), generateAgentsMd(cwd, cfg));
    if (hasWarp) console.log('Found WARP.md — preserving it; generated AGENTS.md alongside.');
  }
  if (args.eslint || args.yes) writeEslint(cwd);
  if (!args.primary && process.stdin.isTTY) {
    return await initInteractive(cwd, args);
  }
  return 0;
}

module.exports = {
  initCommand
};
