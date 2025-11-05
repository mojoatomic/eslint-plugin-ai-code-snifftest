'use strict';

const fs = require('fs');
const path = require('path');

const { deepMerge, loadProjectConfigFile, writeProjectConfigFile } = require(path.join(__dirname, '..', '..', 'utils', 'project-config'));

async function learnInteractiveCommand(cwd, args, findings, rec, currentCfg) {
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
          const { generateDomain } = require(path.join(__dirname, '..', '..', 'scanner', 'reconcile'));
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

function learnCommand(cwd, args) {
  const { scanProject } = require(path.join(__dirname, '..', '..', 'scanner', 'extract'));
  const { reconcile, DEFAULT_SANITY } = require(path.join(__dirname, '..', '..', 'scanner', 'reconcile'));
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
    return learnInteractiveCommand(cwd, args, findings, rec, currentCfg);
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
