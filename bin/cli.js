#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// Generators
const { writeConfig } = require(path.join(__dirname, '..', 'lib', 'generators', 'config-json'));
const { writeGuideMd } = require(path.join(__dirname, '..', 'lib', 'generators', 'guide-md'));
const { writeAgentsMd } = require(path.join(__dirname, '..', 'lib', 'generators', 'agents-md'));
const { writeCursorRules } = require(path.join(__dirname, '..', 'lib', 'generators', 'cursorrules'));
const { writeEslintConfig } = require(path.join(__dirname, '..', 'lib', 'generators', 'eslint-config'));

// Commands
const { scaffoldCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'scaffold'));
const { initCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'init'));

// Utilities
const { suggestFor } = require(path.join(__dirname, '..', 'lib', 'utils', 'domain-suggestions'));
const { ask } = require(path.join(__dirname, '..', 'lib', 'utils', 'readline-utils'));
const { deepMerge, loadProjectConfigFile, writeProjectConfigFile } = require(path.join(__dirname, '..', 'lib', 'utils', 'project-config'));
const { parseArgs } = require(path.join(__dirname, '..', 'lib', 'utils', 'args-parser'));
const { usage } = require(path.join(__dirname, '..', 'lib', 'utils', 'cli-help'));
const { checkRequirements } = require(path.join(__dirname, '..', 'lib', 'utils', 'requirements'));




async function initInteractive(cwd, args) {
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
      const { buildDomainMetadata } = require(path.join(__dirname, '..', 'lib', 'wizard', 'domain-selector'));
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
        const { discoverConstants } = require(path.join(__dirname, '..', 'lib', 'utils', 'discover-constants'));
        const { mergeConstants } = require(path.join(__dirname, '..', 'lib', 'utils', 'merge-constants'));
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
    const { promptArchitectureGuardrails } = require(path.join(__dirname, '..', 'lib', 'wizard', 'arch-prompts'));
    const architecture = await promptArchitectureGuardrails(rl, ask);
    
    const confirm = (await ask(rl, '\nWrite .ai-coding-guide.json with these settings? (Y/n): ')).trim().toLowerCase();
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
    const genEslint = (await ask(rl, 'Generate eslint.config.js (Y/n): ')).trim().toLowerCase();
    if (!genEslint || genEslint.startsWith('y')) {
      writeEslintConfig(cwd, cfg);
    }
    return code;
  } finally {
    rl.close();
  }
}






// --- Learn implementation ---

async function learnInteractive(cwd, args, findings, rec, currentCfg) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve)=> rl.question(q, (ans)=> resolve(ans)));
  try {
    const nextCfg = JSON.parse(JSON.stringify(currentCfg));
    console.log('\nLearn: Reconciliation Report');
    console.log(`Score: ${rec.score.overall}/100`);
    if (rec.score && rec.score.breakdown) {
      console.log('Breakdown:', rec.score.breakdown);
    }
    if (Array.isArray(rec.warnings) && rec.warnings.length) {
      console.log('Warnings:', rec.warnings);
    }

    // 1) Naming style
    console.log(`\nNaming style: suggested '${rec.result.naming.style}' (majorities: ${Object.entries(findings.naming.casing).map(([k,v])=>`${k}:${v}`).join(', ')})`);
    let ans = (await ask("[Naming] Enforce suggested style in config? [Y/n/r] (r=view report): ")).trim().toLowerCase();
    if (ans === 'r') {
      console.log(JSON.stringify({ casing: findings.naming.casing, booleanPrefixes: findings.naming.booleanPrefixes }, null, 2));
      ans = (await ask('Apply suggested style? [Y/n]: ')).trim().toLowerCase();
    }
    if (!ans || ans.startsWith('y')) {
      nextCfg.naming = nextCfg.naming || {};
      nextCfg.naming.style = rec.result.naming.style;
      const bp = Array.from(new Set(rec.result.naming.booleanPrefix || []));
      // Offer inline edit of boolean prefixes
      const edit = (await ask(`Edit boolean prefixes? current=[${bp.join(',')}] enter new comma-separated or press Enter to keep: `)).trim();
      if (edit) {
        const edited = edit.split(',').map(s=>s.trim()).filter(Boolean);
        nextCfg.naming.booleanPrefix = edited.length ? edited : bp;
      } else {
        nextCfg.naming.booleanPrefix = bp;
      }
    }

    // 2) Generic names → antiPatterns.forbiddenNames
    const forb = rec.result.antiPatterns && rec.result.antiPatterns.forbiddenNames || [];
    if (forb.length) {
      console.log(`\nGeneric names detected (suggest forbid): ${forb.join(', ')}`);
      const g = (await ask('[Generic] Add to antiPatterns.forbiddenNames? [Y/n]: ')).trim().toLowerCase();
      if (!g || g.startsWith('y')) {
        nextCfg.antiPatterns = nextCfg.antiPatterns || { forbiddenNames: [], forbiddenTerms: [] };
        const set = new Set([...(nextCfg.antiPatterns.forbiddenNames||[]), ...forb]);
        nextCfg.antiPatterns.forbiddenNames = Array.from(set);
      }
    }

    // 3) Constants domain-aware suggestions
    const consts = (rec.domain && rec.domain.constants) || [];
    const top = consts.slice(0, 10);
    if (top.length) {
      console.log('\nDomain-aware constants (high-confidence):');
      const chosen = [];
      const history = [];
      for (let i = 0; i < top.length; i++) {
        const c = top[i];
        let action = (await ask(`  [${i+1}/${top.length}] ${c.value} → ${c.suggestedName || '(name?)'} ${c.domain ? '['+c.domain+']' : ''} (conf=${Math.round(c.confidence*100)}%) [a]dd, [r]ename, [m]ap, [s]kip, [b]ack, skip-[A]ll, [q]uit: `)).trim().toLowerCase();
        if (action === 'q') break;
        if (action === 'a' && i < top.length - 1) {
          console.log('Skipping all remaining constants.');
          break;
        }
        if (action === 'b' && i > 0) {
          // Go back one step
          i = Math.max(0, i - 2);
          if (history.length > 0) {
            const last = history.pop();
            const idx = chosen.findIndex(ch => ch.value === last.value);
            if (idx !== -1) chosen.splice(idx, 1);
          }
          continue;
        }
        if (action === 'r') {
          const nn = (await ask('   New constant name (UPPER_SNAKE_CASE): ')).trim();
          if (nn) c.suggestedName = nn;
          action = 'a';
        }
        if (action === 'm') {
          const dm = (await ask('   Map value to domain (e.g., time, astronomy, geometry): ')).trim();
          if (dm) {
            nextCfg.constantResolution = nextCfg.constantResolution || {};
            nextCfg.constantResolution[String(c.value)] = dm;
            c.domain = dm;
          }
          const yn = (await ask('   Also add to fingerprint? [Y/n]: ')).trim().toLowerCase();
          if (!yn || yn.startsWith('y')) action = 'a'; else action = 's';
        }
        if (action === 'a') {
          chosen.push({ value: c.value, suggestedName: c.suggestedName, domain: c.domain, confidence: c.confidence });
          history.push(c);
        }
      }
      if (chosen.length) {
        const h = (await ask('[Constants] Generate fingerprint file with selected items? [Y/n]: ')).trim().toLowerCase();
        if (!h || h.startsWith('y')) {
          const { generateDomain } = require(path.join(__dirname, '..', 'lib', 'scanner', 'reconcile'));
          const content = generateDomain({ constants: chosen });
          const outDir = path.join(cwd, '.ai-constants');
          fs.mkdirSync(outDir, { recursive: true });
          const outFile = path.join(outDir, 'project-fingerprint.js');
          fs.writeFileSync(outFile, content);
          console.log(`Wrote ${outFile}`);
        }
      }
    }

    // 4) Apply config changes
    const apply = (await ask('\nApply changes to .ai-coding-guide.json? [Y/n]: ')).trim().toLowerCase();
    if (!apply || apply.startsWith('y')) {
      const { file } = loadProjectConfigFile(cwd);
      writeProjectConfigFile(file, nextCfg);
      console.log(`Updated ${file}`);
    } else {
      console.log('Skipped writing config.');
    }

    return 0;
  } finally {
    rl.close();
  }
}

function learn(cwd, args) {
  const { scanProject } = require(path.join(__dirname, '..', 'lib', 'scanner', 'extract'));
  const { reconcile, DEFAULT_SANITY } = require(path.join(__dirname, '..', 'lib', 'scanner', 'reconcile'));
  const { json: currentCfg } = loadProjectConfigFile(cwd);
  const modeInteractive = Boolean(args.interactive) || (!args.strict && !args.permissive && process.stdin.isTTY);
  const sample = args.sample ? Number(args.sample) : undefined;
  const useCache = args.cache === false || args['no-cache'] ? false : true;

  console.log(`Scanning project (sample: ${sample || 400}, cache: ${useCache ? 'enabled' : 'disabled'})...`);
  const findings = scanProject(cwd, { sample: sample || 400, useCache });
  console.log('✓ Scan complete');
  // Override defaults with CLI flags or config values
  const sane = { ...DEFAULT_SANITY };
  if (args.minimumMatch) sane.minimumMatch = parseFloat(args.minimumMatch);
  else if (currentCfg.minimumMatch !== undefined) sane.minimumMatch = currentCfg.minimumMatch;
  if (args.minimumConfidence) sane.minimumConfidence = parseFloat(args.minimumConfidence);
  else if (currentCfg.minimumConfidence !== undefined) sane.minimumConfidence = currentCfg.minimumConfidence;
  const mode = args.strict ? 'strict' : (args.permissive ? 'permissive' : 'adaptive');
  const rec = reconcile(findings, sane, { config: currentCfg, mode });

  if (modeInteractive) {
    return learnInteractive(cwd, args, findings, rec, currentCfg);
  }

  // Non-interactive: compute result and optionally apply
  const nextCfg = deepMerge(currentCfg, { naming: rec.result.naming, antiPatterns: rec.result.antiPatterns, constantResolution: rec.result.constantResolution });
  if (args.apply) {
    if (mode === 'permissive') {
      const reportFile = path.join(cwd, '.ai-learn-report.json');
      fs.writeFileSync(reportFile, JSON.stringify({ mode, score: rec.score, result: rec.result, warnings: rec.warnings, domain: rec.domain.summary }, null, 2) + '\n');
      console.log(`Wrote ${reportFile}`);
    } else {
      const { file } = loadProjectConfigFile(cwd);
      writeProjectConfigFile(file, nextCfg);
      console.log(`Updated ${file} (mode ${mode}, score ${rec.score.overall})`);
    }
  } else {
    console.log(JSON.stringify({ mode, score: rec.score, result: rec.result, warnings: rec.warnings, domain: rec.domain.summary }, null, 2));
  }
  if (args.fingerprint) {
    const top = (rec.domain && rec.domain.constants || []).slice(0, 10);
    if (top.length) {
      const { generateDomain } = require(path.join(__dirname, '..', 'lib', 'scanner', 'reconcile'));
      const content = generateDomain({ constants: top });
      const outDir = path.join(cwd, '.ai-constants');
      fs.mkdirSync(outDir, { recursive: true });
      const outFile = path.join(outDir, 'project-fingerprint.js');
      fs.writeFileSync(outFile, content);
      console.log(`Wrote ${outFile}`);
    }
  }
  return 0;
}

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  const cwd = process.cwd();
  if (cmd === 'init') {
    if (!checkRequirements(process.cwd())) { process.exitCode = 1; return; }
    if (!args.primary && (process.stdin.isTTY || process.env.FORCE_CLI_INTERACTIVE)) {
      initInteractive(cwd, args).then((code)=>{ process.exitCode = code; });
      return;
    }
    process.exitCode = initCommand(cwd, args);
    return;
  }
  if (cmd === 'learn') {
    if (!checkRequirements(process.cwd())) { process.exitCode = 1; return; }
    Promise.resolve(learn(cwd, args)).then((code)=>{ process.exitCode = code; });
    return;
  }
  if (cmd === 'scaffold' || cmd === 'create-constants') {
    const dom = args._[1];
    const outDir = args.dir || args.out;
    process.exitCode = scaffoldCommand(cwd, dom, outDir);
    return;
  }
  usage();
}

main();