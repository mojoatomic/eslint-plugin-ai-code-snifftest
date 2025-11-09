'use strict';

const fs = require('fs');
const path = require('path');

function printRatchetNextSteps() {
  try {
    const lines = [];
    lines.push('');
    lines.push('Next steps (recommended): No-New-Debt Ratchet');
    lines.push('  1) Create baseline once:');
    lines.push('     npx eslint . -f json -o lint-results.json');
    lines.push('     npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json --format=json --output=analysis-baseline.json');
    lines.push('  2) Add pre-push/CI checks to block increases (see README → "No-New-Debt Ratchet (All projects)")');
    lines.push('');
    console.log(lines.join('\n'));
  } catch { /* ignore */ }
}

// Generators
const { writeConfig } = require(path.join(__dirname, '..', '..', 'generators', 'config-json'));
const { writeAgentsMd } = require(path.join(__dirname, '..', '..', 'generators', 'agents-md'));
const { writeCursorRules } = require(path.join(__dirname, '..', '..', 'generators', 'cursorrules'));
const { writeEslintConfig } = require(path.join(__dirname, '..', '..', 'generators', 'eslint-config'));

// Utilities
const { applyFingerprintToConfig } = require(path.join(__dirname, '..', '..', 'utils', 'fingerprint'));
const { suggestFor } = require(path.join(__dirname, '..', '..', 'utils', 'domain-suggestions'));
const { ask } = require(path.join(__dirname, '..', '..', 'utils', 'readline-utils'));
const { loadProjectConfigFile, deepMerge } = require(path.join(__dirname, '..', '..', 'utils', 'project-config'));
const { shouldEnableArchitecture, normalizeBoolean } = require(path.join(__dirname, '..', '..', 'utils', 'arch-switch'));
const { shouldEnableExternalConstants } = require(path.join(__dirname, '..', '..', 'utils', 'external-switch'));

// ===== Extracted helpers (keep orchestration thin) =====
function parseDomainArgs(args) {
  const primary = (args.primary || 'general').trim();
  const additional = (args.additional || '').split(',').map(s => s.trim()).filter(Boolean);
  return { primary, additional, domainPriority: [primary, ...additional] };
}

function parseExternalArgs(args) {
  const external = shouldEnableExternalConstants(args);
  const allowlist = (args.allowlist || '').split(',').map(s=>s.trim()).filter(Boolean);
  const minimumMatch = args.minimumMatch ? parseFloat(args.minimumMatch) : 0.6;
  const minimumConfidence = args.minimumConfidence ? parseFloat(args.minimumConfidence) : 0.7;
  return { external, allowlist, minimumMatch, minimumConfidence };
}

function createBaseConfig(domains, thresholds, externalCfg) {
  const { primary, additional, domainPriority } = domains;
  const { minimumMatch, minimumConfidence } = thresholds;
  const { external, allowlist } = externalCfg;
  return {
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
}

function mergeWithExisting(cwd, newCfg) {
  const { json: existingCfg } = loadProjectConfigFile(cwd);
  return deepMerge(existingCfg, newCfg);
}

function applyArchitectureDefault(cfg, args) {
  const enableArch = shouldEnableArchitecture(args);
  if (enableArch) {
    const { DEFAULT_ARCHITECTURE } = require(path.join(__dirname, '..', '..', 'utils', 'arch-defaults'));
    cfg.architecture = JSON.parse(JSON.stringify(DEFAULT_ARCHITECTURE));
  } else if (cfg && Object.prototype.hasOwnProperty.call(cfg, 'architecture')) {
    delete cfg.architecture;
  }
  return enableArch;
}

function maybeWarnExternalWithoutAllowlist(external, allowlist) {
  if (external && (!allowlist || allowlist.length === 0)) {
    console.warn('Warning: --external used without allowlist; consider adding --allowlist to limit npm scope.');
  }
}

function computeWriteTargets(args) {
  const disableAgents = Object.prototype.hasOwnProperty.call(args, 'no-agents') && normalizeBoolean(args['no-agents'], true);
  const disableEslint = Object.prototype.hasOwnProperty.call(args, 'no-eslint') && normalizeBoolean(args['no-eslint'], true);
  const explicitAgents = Object.prototype.hasOwnProperty.call(args, 'agents') ? normalizeBoolean(args.agents, true) : undefined;
  const explicitEslint = Object.prototype.hasOwnProperty.call(args, 'eslint') ? normalizeBoolean(args.eslint, true) : undefined;
  const shouldWriteAgents = disableAgents ? false : (explicitAgents === undefined ? true : explicitAgents);
  const shouldWriteEslint = disableEslint ? false : (explicitEslint === undefined ? true : explicitEslint);
  return { disableAgents, disableEslint, shouldWriteAgents, shouldWriteEslint };
}

function maybeWriteDebugSnapshot(cwd, args, cfg, shouldWriteEslint, shouldWriteAgents, enableArch) {
  try {
    if (!(args && (args.debug || process.env.AI_DEBUG_INIT))) return;
    const debugFile = path.join(cwd, '.ai-init-debug.json');
    const eslintFileJs = path.join(cwd, 'eslint.config.js');
    const eslintFileMjs = path.join(cwd, 'eslint.config.mjs');
    const eslintFile = fs.existsSync(eslintFileMjs) ? eslintFileMjs : (fs.existsSync(eslintFileJs) ? eslintFileJs : null);
    const eslintContent = eslintFile && fs.existsSync(eslintFile) ? fs.readFileSync(eslintFile, 'utf8') : '';
    const agentsFile = path.join(cwd, 'AGENTS.md');
    const agentsContent = fs.existsSync(agentsFile) ? fs.readFileSync(agentsFile, 'utf8') : '';
    const snapshot = {
      args: {
        yes: !!args.yes,
        eslint: normalizeBoolean(args.eslint, true),
        noEslint: args['no-eslint'],
        agents: normalizeBoolean(args.agents, true),
        noAgents: args['no-agents'],
        noArch: args['no-arch'],
        arch: args.arch
      },
      argsRaw: args,
      enableArchVar: enableArch,
      enableArch: Boolean(!args['no-arch'] && args.arch && args.arch !== 'false'),
      cfgHasArchitecture: !!cfg.architecture,
      files: {
        eslintConfig: eslintFile,
        eslintHasGuardrails: Boolean(eslintContent && (/Architecture guardrails/.test(eslintContent) || /'max-lines'/.test(eslintContent))),
        agentsMd: fs.existsSync(agentsFile),
        agentsHasArchitectureSection: /## Architecture Guidelines/.test(agentsContent)
      },
      willWrite: { eslint: shouldWriteEslint, agents: shouldWriteAgents, cursor: !!args.cursor }
    };
    fs.writeFileSync(debugFile, JSON.stringify(snapshot, null, 2));
  } catch { /* ignore debug write errors */ }
}

// ===== Orchestrators =====
function initCommand(cwd, args) {
  const domains = parseDomainArgs(args);
  const ext = parseExternalArgs(args);
  const newCfg = createBaseConfig(domains, { minimumMatch: ext.minimumMatch, minimumConfidence: ext.minimumConfidence }, { external: ext.external, allowlist: ext.allowlist });
  const cfg = mergeWithExisting(cwd, newCfg);
  const enableArch = applyArchitectureDefault(cfg, args);
  applyFingerprintToConfig(cwd, cfg);
  maybeWarnExternalWithoutAllowlist(ext.external, ext.allowlist);

  const code = writeConfig(cwd, cfg);
  const hasWarp = fs.existsSync(path.join(cwd, 'WARP.md'));

  if (args.cursor) writeCursorRules(cwd, cfg);

  const { disableAgents, disableEslint, shouldWriteAgents, shouldWriteEslint } = computeWriteTargets(args);

  if (args.agents && !disableAgents) console.log('Note: --agents is the default; this flag is no longer required.');
  if (args.eslint && !disableEslint) console.log('Note: --eslint is the default; this flag is no longer required.');

  if (shouldWriteAgents) {
    writeAgentsMd(cwd, cfg);
    if (hasWarp) console.log('Found WARP.md — preserving it; generated AGENTS.md alongside.');
  }
  if (shouldWriteEslint) writeEslintConfig(cwd, cfg);

  console.log('\nProject initialized.');
  printRatchetNextSteps();

  maybeWriteDebugSnapshot(cwd, args, cfg, shouldWriteEslint, shouldWriteAgents, enableArch);

  return code;
}

async function initInteractiveCommand(cwd, args) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    // Prompt primary domain
    let primary = (await ask(rl, 'Primary domain (default: general): ')).trim() || 'general';
    const suggested = suggestFor(primary);
    if (suggested.length) console.log(`Suggested additional domains for ${primary}: ${suggested.join(', ')}`);

    // Wizard metadata (best-effort)
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
        if (sel && sel.constantsCount === 0) console.warn(`⚠️ Warning: selected primary '${primary}' has zero discovered constants.`);
      }
    } catch { /* ignore */ }

    // Additional domains
    let addAns = (await ask(rl, 'Additional domains (comma-separated, optional): ')).trim();

    // Optional experimental external discovery flow (opt-in via flags)
    const externalPromptEnabled = (args && (Object.prototype.hasOwnProperty.call(args, 'external') || Object.prototype.hasOwnProperty.call(args, 'experimentalExternalConstants'))) && shouldEnableExternalConstants(args || {});
    if (externalPromptEnabled) {
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
            if (Number.isInteger(idx) && idx>=1 && idx<=domainList.length) primary = domainList[idx-1];
            else if (domainList.includes(priPick)) primary = priPick;
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

    // Confirm
    const confirm = (await ask(rl, '\nWrite .ai-coding-guide.json with these settings? (Y/n): ')).trim().toLowerCase();
    if (confirm && confirm.startsWith('n')) { console.log('Aborted.'); return 1; }

    // Merge + write
    const { json: existingCfg } = loadProjectConfigFile(cwd);
    const newCfg = {
      domains: { primary, additional },
      domainPriority,
      constants: {},
      terms: { entities: [], properties: [], actions: [] },
      naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true }
    };
    const cfg = deepMerge(existingCfg, newCfg);
    if (architecture) cfg.architecture = architecture;

    const code = writeConfig(cwd, cfg);

    const genCursor = (await ask(rl, 'Generate .cursorrules? (Y/n): ')).trim().toLowerCase();
    if (!genCursor || genCursor.startsWith('y')) writeCursorRules(cwd, cfg);

    const hasWarp = fs.existsSync(path.join(cwd, 'WARP.md'));
    console.log(hasWarp ? 'Detected WARP.md — will not modify it.' : 'No WARP.md detected.');

    const agents = (await ask(rl, 'Generate AGENTS.md (recommended)? (Y/n): ')).trim().toLowerCase();
    if (!agents || agents.startsWith('y')) writeAgentsMd(cwd, cfg);

    const genEslint = (await ask(rl, 'Generate eslint.config.mjs (Y/n): ')).trim().toLowerCase();
    if (!genEslint || genEslint.startsWith('y')) writeEslintConfig(cwd, cfg);

    console.log('\nProject initialized.');
    printRatchetNextSteps();
    return code;
  } finally {
    rl.close();
  }
}

module.exports = { initCommand, initInteractiveCommand };
