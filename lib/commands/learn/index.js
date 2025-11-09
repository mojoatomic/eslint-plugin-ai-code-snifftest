'use strict';

const fs = require('fs');
const path = require('path');

const { deepMerge, loadProjectConfigFile, writeProjectConfigFile } = require(path.join(__dirname, '..', '..', 'utils', 'project-config'));
const { shouldEnableArchitecture, normalizeBoolean } = require(path.join(__dirname, '..', '..', 'utils', 'arch-switch'));
const { writeAgentsMd } = require(path.join(__dirname, '..', '..', 'generators', 'agents-md'));
const { writeEslintConfig } = require(path.join(__dirname, '..', '..', 'generators', 'eslint-config'));
const { detectProjectContext } = require(path.join(__dirname, '..', '..', 'utils', 'project-detection'));

// ===== Extracted helpers for interactive flow =====
function printReport(rec, findings) {
  console.log('\nLearn: Reconciliation Report');
  console.log(`Score: ${rec.score.overall}/100`);
  if (rec.score && rec.score.breakdown) console.log('Breakdown:', rec.score.breakdown);
  if (Array.isArray(rec.warnings) && rec.warnings.length) console.log('Warnings:', rec.warnings);
}

async function maybeApplyInferredDomain(cwd, nextCfg, ask) {
  try {
    const ctx = detectProjectContext(cwd);
    const type = ctx && ctx.type;
    const allowed = { 'dev-tools': 'dev-tools', 'cli': 'cli', 'web-app': 'web-app' };
    const inferred = allowed[type] || null;
    if (!inferred) return;
    const pick = (await ask(`\nDetected domain: ${inferred}. Use this as primary? (Y/n): `)).trim().toLowerCase();
    if (!pick || pick.startsWith('y')) {
      nextCfg.domains = nextCfg.domains || { primary: 'general', additional: [] };
      nextCfg.domains.primary = inferred;
      const addl = Array.isArray(nextCfg.domains.additional) ? nextCfg.domains.additional : [];
      nextCfg.domainPriority = [inferred, ...addl].filter(Boolean);
    }
  } catch { /* ignore detection errors */ }
}

async function handleNamingSection(nextCfg, findings, rec, ask) {
  console.log(`\nNaming style: suggested '${rec.result.naming.style}' (majorities: ${Object.entries(findings.naming.casing).map(([k,v])=>`${k}:${v}`).join(', ')})`);
  let ans = (await ask('[Naming] Enforce suggested style in config? [Y/n/r] (r=view report): ')).trim().toLowerCase();
  if (ans === 'r') {
    console.log(JSON.stringify({ casing: findings.naming.casing, booleanPrefixes: findings.naming.booleanPrefixes }, null, 2));
    ans = (await ask('Apply suggested style? [Y/n]: ')).trim().toLowerCase();
  }
  if (!ans || ans.startsWith('y')) {
    nextCfg.naming = nextCfg.naming || {};
    nextCfg.naming.style = rec.result.naming.style;
    const bp = Array.from(new Set(rec.result.naming.booleanPrefix || []));
    const edit = (await ask(`Edit boolean prefixes? current=[${bp.join(',')}] enter new comma-separated or press Enter to keep: `)).trim();
    if (edit) {
      const edited = edit.split(',').map(s=>s.trim()).filter(Boolean);
      nextCfg.naming.booleanPrefix = edited.length ? edited : bp;
    } else {
      nextCfg.naming.booleanPrefix = bp;
    }
  }
}

async function handleGenericNames(nextCfg, rec, ask) {
  const forb = (rec.result.antiPatterns && rec.result.antiPatterns.forbiddenNames) || [];
  if (!forb.length) return;
  console.log(`\nGeneric names detected (suggest forbid): ${forb.join(', ')}`);
  const g = (await ask('[Generic] Add to antiPatterns.forbiddenNames? [Y/n]: ')).trim().toLowerCase();
  if (!g || g.startsWith('y')) {
    nextCfg.antiPatterns = nextCfg.antiPatterns || { forbiddenNames: [], forbiddenTerms: [] };
    const set = new Set([...(nextCfg.antiPatterns.forbiddenNames||[]), ...forb]);
    nextCfg.antiPatterns.forbiddenNames = Array.from(set);
  }
}

function addChosen(chosen, history, c) {
  chosen.push({ value: c.value, suggestedName: c.suggestedName, domain: c.domain, confidence: c.confidence });
  history.push(c);
}

function handleBack(history, chosen, i) {
  const newIndex = Math.max(0, i - 2);
  if (history.length > 0) {
    const last = history.pop();
    const idx = chosen.findIndex(ch => ch.value === last.value);
    if (idx !== -1) chosen.splice(idx, 1);
  }
  return newIndex;
}

async function renameConstant(c, ask) {
  const nn = (await ask('   New constant name (UPPER_SNAKE_CASE): ')).trim();
  if (nn) c.suggestedName = nn;
  return 'a';
}

async function mapConstant(nextCfg, c, ask) {
  const dm = (await ask('   Map value to domain (e.g., time, astronomy, geometry): ')).trim();
  if (dm) {
    nextCfg.constantResolution = nextCfg.constantResolution || {};
    nextCfg.constantResolution[String(c.value)] = dm;
    c.domain = dm;
  }
  const yn = (await ask('   Also add to fingerprint? [Y/n]: ')).trim().toLowerCase();
  return (!yn || yn.startsWith('y')) ? 'a' : 's';
}

async function handleConstantsSelection(nextCfg, cwd, rec, ask) {
  const consts = (rec.domain && rec.domain.constants) || [];
  const top = consts.slice(0, 10);
  if (!top.length) return;
  console.log('\nDomain-aware constants (high-confidence):');
  const chosen = [];
  const history = [];
  for (let i = 0; i < top.length; i++) {
    const c = top[i];
    let action = (await ask(`  [${i+1}/${top.length}] ${c.value} → ${c.suggestedName || '(name?)'} ${c.domain ? '['+c.domain+']' : ''} (conf=${Math.round(c.confidence*100)}%) [a]dd, [r]ename, [m]ap, [s]kip, [b]ack, skip-[A]ll, [q]uit: `)).trim().toLowerCase();
    if (action === 'q') break;
    if (action === 'a' && i < top.length - 1) { console.log('Skipping all remaining constants.'); break; }
    if (action === 'b' && i > 0) { i = handleBack(history, chosen, i); continue; }
    if (action === 'r') action = await renameConstant(c, ask);
    if (action === 'm') action = await mapConstant(nextCfg, c, ask);
    if (action === 'a') addChosen(chosen, history, c);
  }
  if (!chosen.length) return;
  const h = (await ask('[Constants] Generate fingerprint file with selected items? [Y/n]: ')).trim().toLowerCase();
  if (h && h.startsWith('n')) return;
  const { generateDomain } = require(path.join(__dirname, '..', '..', 'scanner', 'reconcile'));
  const content = generateDomain({ constants: chosen });
  const outDir = path.join(cwd, '.ai-constants');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'project-fingerprint.js');
  fs.writeFileSync(outFile, content);
  console.log(`Wrote ${outFile}`);
}

async function applyConfigChanges(cwd, nextCfg, ask) {
  const apply = (await ask('\nApply changes to .ai-coding-guide.json? [Y/n]: ')).trim().toLowerCase();
  if (!apply || apply.startsWith('y')) {
    const { file } = loadProjectConfigFile(cwd);
    writeProjectConfigFile(file, nextCfg);
    console.log(`Updated ${file}`);
  } else {
    console.log('Skipped writing config.');
  }
}

function applyArchitectureToggle(cwd, args, cfgLatest, file) {
  const enableArch = shouldEnableArchitecture(args);
  if (enableArch && !cfgLatest.architecture) {
    try {
      const { DEFAULT_ARCHITECTURE } = require(path.join(__dirname, '..', '..', 'utils', 'arch-defaults'));
      cfgLatest.architecture = JSON.parse(JSON.stringify(DEFAULT_ARCHITECTURE));
      writeProjectConfigFile(file, cfgLatest);
      console.log('Updated config with architecture guardrails.');
    } catch (e) {
      console.warn(`Warning: could not enable architecture guardrails: ${e && e.message}`);
    }
  } else if (!enableArch && cfgLatest.architecture) {
    delete cfgLatest.architecture;
    writeProjectConfigFile(file, cfgLatest);
    console.log('Removed architecture guardrails from config.');
  }
}

async function maybeGenerateAgentsAndEslint(cwd, args, ask) {
  const gen = (await ask('\nGenerate AGENTS.md and eslint.config.mjs now? (Y/n): ')).trim().toLowerCase();
  if (gen && gen.startsWith('n')) return;
  const disableAgents = Object.prototype.hasOwnProperty.call(args, 'no-agents') && normalizeBoolean(args['no-agents'], true);
  const disableEslint = Object.prototype.hasOwnProperty.call(args, 'no-eslint') && normalizeBoolean(args['no-eslint'], true);
  const shouldWriteAgents = !disableAgents;
  const shouldWriteEslint = !disableEslint;
  const { file, json: cfgLatest } = loadProjectConfigFile(cwd);
  applyArchitectureToggle(cwd, args, cfgLatest, file);
  if (shouldWriteAgents) writeAgentsMd(cwd, cfgLatest);
  if (shouldWriteEslint) writeEslintConfig(cwd, cfgLatest);
}

// ===== Orchestrator =====
async function learnInteractiveCommand(cwd, args, findings, rec, currentCfg) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve)=> rl.question(q, (ans)=> resolve(ans)));
  try {
    const nextCfg = JSON.parse(JSON.stringify(currentCfg));
    printReport(rec, findings);
    await maybeApplyInferredDomain(cwd, nextCfg, ask);
    await handleNamingSection(nextCfg, findings, rec, ask);
    await handleGenericNames(nextCfg, rec, ask);
    await handleConstantsSelection(nextCfg, cwd, rec, ask);
    await applyConfigChanges(cwd, nextCfg, ask);
    await maybeGenerateAgentsAndEslint(cwd, args, ask);
    return 0;
  } finally {
    rl.close();
  }
}

function learnCommand(cwd, args) {
  const { scanProject } = require(path.join(__dirname, '..', '..', 'scanner', 'extract'));
  const { reconcile, DEFAULT_SANITY } = require(path.join(__dirname, '..', '..', 'scanner', 'reconcile'));
  const { json: currentCfg } = loadProjectConfigFile(cwd);
  const modeInteractive = Boolean(args.interactive) || (!args.strict && !args.permissive && process.stdin.isTTY);
  const sample = args.sample ? Number(args.sample) : undefined;
  const useCache = !!args.cache || args['no-cache'];

  console.log(`Scanning project (sample: ${sample || 400}, cache: ${useCache ? 'enabled' : 'disabled'})...`);
  const findings = scanProject(cwd, { sample: sample || 400, useCache });
  console.log('✓ Scan complete');
  const sane = { ...DEFAULT_SANITY };
  if (args.minimumMatch) sane.minimumMatch = parseFloat(args.minimumMatch);
  else if (currentCfg.minimumMatch !== undefined) sane.minimumMatch = currentCfg.minimumMatch;
  if (args.minimumConfidence) sane.minimumConfidence = parseFloat(args.minimumConfidence);
  else if (currentCfg.minimumConfidence !== undefined) sane.minimumConfidence = currentCfg.minimumConfidence;
  const mode = args.strict ? 'strict' : (args.permissive ? 'permissive' : 'adaptive');
  const rec = reconcile(findings, sane, { config: currentCfg, mode });

  if (modeInteractive) {
    return learnInteractiveCommand(cwd, args, findings, rec, currentCfg);
  }

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
      const { generateDomain } = require(path.join(__dirname, '..', '..', 'scanner', 'reconcile'));
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

module.exports = { learnCommand, learnInteractiveCommand };
