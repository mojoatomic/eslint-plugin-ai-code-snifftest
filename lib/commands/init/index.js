'use strict';

const fs = require('fs');
const path = require('path');

// Generators
const { writeConfig } = require(path.join(__dirname, '..', '..', 'generators', 'config-json'));
const { writeGuideMd } = require(path.join(__dirname, '..', '..', 'generators', 'guide-md'));
const { writeAgentsMd } = require(path.join(__dirname, '..', '..', 'generators', 'agents-md'));
const { writeCursorRules } = require(path.join(__dirname, '..', '..', 'generators', 'cursorrules'));
const { writeEslintConfig } = require(path.join(__dirname, '..', '..', 'generators', 'eslint-config'));

// Utilities
const { applyFingerprintToConfig } = require(path.join(__dirname, '..', '..', 'utils', 'fingerprint'));
const { suggestFor } = require(path.join(__dirname, '..', '..', 'utils', 'domain-suggestions'));
const { ask } = require(path.join(__dirname, '..', '..', 'utils', 'readline-utils'));
const { loadProjectConfigFile, deepMerge } = require(path.join(__dirname, '..', '..', 'utils', 'project-config'));

function initCommand(cwd, args) {
  // Load existing config to preserve data from learn command
  const { json: existingCfg } = loadProjectConfigFile(cwd);
  
  const primary = (args.primary || 'general').trim();
  const additional = (args.additional || '').split(',').map(s => s.trim()).filter(Boolean);
  const domainPriority = [primary, ...additional];
  const external = Boolean(args.external || args.experimentalExternalConstants);
  const allowlist = (args.allowlist || '').split(',').map(s=>s.trim()).filter(Boolean);
  const minimumMatch = args.minimumMatch ? parseFloat(args.minimumMatch) : 0.6;
  const minimumConfidence = args.minimumConfidence ? parseFloat(args.minimumConfidence) : 0.7;
  
  // Create new config structure
  // Note: Don't include antiPatterns here to preserve existing forbiddenNames from learn
  const newCfg = {
    domains: { primary, additional },
    domainPriority,
    constants: {},
    terms: { entities: [], properties: [], actions: [] },
    naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true },
    minimumMatch,
    minimumConfidence,
    experimentalExternalConstants: external,
    externalConstantsAllowlist: allowlist
  };
  
  // Merge with existing config to preserve learn command data
  const cfg = deepMerge(existingCfg, newCfg);
  // Add architecture guardrails by default (disable with --no-arch or --arch=false)
  // eslint-disable-next-line ai-code-snifftest/prefer-simpler-logic
  const enableArch = !(args['no-arch'] === true || args.arch === false || args.arch === 'false');
  if (enableArch) {
    const { DEFAULT_ARCHITECTURE } = require(path.join(__dirname, '..', '..', 'utils', 'arch-defaults'));
    cfg.architecture = JSON.parse(JSON.stringify(DEFAULT_ARCHITECTURE));
  }
  // Merge fingerprint signals into config (domains + constantResolution)
  applyFingerprintToConfig(cwd, cfg);
  if (external && (!allowlist || allowlist.length === 0)) {
    console.warn('Warning: --external used without allowlist; consider adding --allowlist to limit npm scope.');
  }
  const code = writeConfig(cwd, cfg);
  const hasWarp = fs.existsSync(path.join(cwd, 'WARP.md'));
  if (args.md || args.yes) writeGuideMd(cwd, cfg);
  if (args.cursor || args.yes) writeCursorRules(cwd, cfg);
  // Generate AGENTS.md by default unless explicitly disabled with --no-agents
  // Note: args['no-agents'] would be set if user passes --no-agents flag
  if (args.agents && !args['no-agents']) {
    writeAgentsMd(cwd, cfg);
    if (hasWarp) {
      console.log('Found WARP.md — preserving it; generated AGENTS.md alongside.');
    }
  }
  if (args.eslint || args.yes) writeEslintConfig(cwd, cfg);
  return code;
}

async function initInteractiveCommand(cwd, args) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    let primary = (await ask(rl, 'Primary domain (default: general): ')).trim() || 'general';
    const suggested = suggestFor(primary);
    if (suggested.length) {
      console.log(`Suggested additional domains for ${primary}: ${suggested.join(', ')}`);
    }
    // Show domain metadata via wizard helper
    try {
      const { buildDomainMetadata } = require(path.join(__dirname, '..', '..', 'wizard', 'domain-selector'));
      const metas = buildDomainMetadata();
      if (Array.isArray(metas) && metas.length) {
        console.log('\nDiscovered domains:');
        for (const m of metas) {
          const src = m.sources && m.sources.length ? m.sources.join(', ') : 'internal';
          console.log(`  - ${m.name} (constants: ${m.constantsCount}, terms: ${m.termsCount}, sources: ${src})`);
        }
        const sel = metas.find(d => d.name === primary);
        if (sel && sel.constantsCount === 0) {
          console.warn(`⚠️ Warning: selected primary '${primary}' has zero discovered constants.`);
        }
      }
    } catch { /* ignore wizard metadata errors */ }
    let addAns = (await ask(rl, 'Additional domains (comma-separated, optional): ')).trim();

    // Optional: interactive external discovery listing
    const external = Boolean(args && (args.external || args.experimentalExternalConstants));
    if (external) {
      try {
        const { discoverConstants } = require(path.join(__dirname, '..', '..', 'utils', 'discover-constants'));
        const { mergeConstants } = require(path.join(__dirname, '..', '..', 'utils', 'merge-constants'));
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
    
    // Architecture guardrails prompt
    const { promptArchitectureGuardrails } = require(path.join(__dirname, '..', '..', 'wizard', 'arch-prompts'));
    const architecture = await promptArchitectureGuardrails(rl, ask);
    
    const confirm = (await ask(rl, '\nWrite .ai-coding-guide.json with these settings? (Y/n): ')).trim().toLowerCase();
    if (confirm && confirm.startsWith('n')) {
      console.log('Aborted.');
      return 1;
    }
    
    // Load existing config to preserve data from learn command
    const { json: existingCfg } = loadProjectConfigFile(cwd);
    
    // Create new config structure
    // Note: Don't include antiPatterns here to preserve existing forbiddenNames from learn
    const newCfg = {
      domains: { primary, additional },
      domainPriority,
      constants: {},
      terms: { entities: [], properties: [], actions: [] },
      naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true }
    };
    
    // Merge with existing config to preserve learn command data
    const cfg = deepMerge(existingCfg, newCfg);
    if (architecture) {
      cfg.architecture = architecture;
    }
    const code = writeConfig(cwd, cfg);
    const gen = (await ask(rl, 'Generate .ai-coding-guide.md and .cursorrules? (Y/n): ')).trim().toLowerCase();
    if (!gen || gen.startsWith('y')) {
      writeGuideMd(cwd, cfg);
      writeCursorRules(cwd, cfg);
    }
    const hasWarp = fs.existsSync(path.join(cwd, 'WARP.md'));
    console.log(hasWarp ? 'Detected WARP.md — will not modify it.' : 'No WARP.md detected.');
    const agents = (await ask(rl, 'Generate AGENTS.md (recommended)? (Y/n): ')).trim().toLowerCase();
    if (!agents || agents.startsWith('y')) {
      writeAgentsMd(cwd, cfg);
    }
    const genEslint = (await ask(rl, 'Generate eslint.config.mjs (Y/n): ')).trim().toLowerCase();
    if (!genEslint || genEslint.startsWith('y')) {
      writeEslintConfig(cwd, cfg);
    }
    return code;
  } finally {
    rl.close();
  }
}

module.exports = { initCommand, initInteractiveCommand };
