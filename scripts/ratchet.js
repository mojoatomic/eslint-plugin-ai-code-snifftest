#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

// Best-effort project config loader (for health gating)
function loadProjectConfig() {
  // 1) Try full project-config util (honors env/settings overlays)
  try {
    const mod = require(path.join(process.cwd(), 'lib', 'utils', 'project-config.js'));
    if (mod && typeof mod.readProjectConfig === 'function') {
      return mod.readProjectConfig({ getCwd: () => process.cwd() });
    }
  } catch (_) { /* ignore */ }
  // 2) Env override (supports tests/standalone use)
  try {
    const envRaw = process.env.AI_SNIFFTEST_CONFIG_JSON;
    if (envRaw) return JSON.parse(envRaw);
  } catch (_) { /* ignore */ }
  // 3) Fallback to reading .ai-coding-guide.json in CWD if present
  try {
    const p = path.join(process.cwd(), '.ai-coding-guide.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) { /* ignore */ }
  return {};
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.split('=');
      const key = k.replace(/^--/, '');
      out[key] = v === undefined ? true : v;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function readJson(p) {
  try {
    const full = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (e) {
    return null;
  }
}

function len(x) { return Array.isArray(x) ? x.length : 0; }
function num(x) { return typeof x === 'number' && Number.isFinite(x) ? x : 0; }

function summarize(payload) {
  // Expected shape may include categories/effort and optionally lines
  const cat = payload && payload.categories ? payload.categories : {};
  const effort = payload && payload.effort ? payload.effort : {};
  const byCat = (effort && effort.byCategory) ? effort.byCategory : {};
  const lines = payload && payload.lines ? payload.lines : {};
  return {
    magicNumbers: len(cat.magicNumbers),
    complexity: len(cat.complexity),
    domainTerms: len(cat.domainTerms),
    architecture: len(cat.architecture),
    // Optional counts (informational)
    counts: {
      errors: num(cat.counts && cat.counts.errors),
      warnings: num(cat.counts && cat.counts.warnings),
      autoFixable: num(cat.counts && cat.counts.autoFixable)
    },
    effortByCategory: {
      magicNumbers: num(byCat.magicNumbers),
      complexity: num(byCat.complexity),
      domainTerms: num(byCat.domainTerms),
      architecture: num(byCat.architecture)
    },
    lines: {
      physical: num(lines.physical),
      executable: num(lines.executable),
      comments: num(lines.comments),
      commentRatio: typeof lines.commentRatio === 'number' ? lines.commentRatio : 0
    }
  };
}

// Rough health scoring using violation density (per K executable LOC if available)
function computeHealth(summary) {
  const exec = Math.max(1, num(summary.lines && summary.lines.executable) || num(summary.lines && summary.lines.physical) || 1000);
  const total = num(summary.magicNumbers) + num(summary.complexity) + num(summary.domainTerms) + num(summary.architecture);
  const structuralTotal = num(summary.complexity) + num(summary.architecture);
  const semanticTotal = num(summary.domainTerms) + num(summary.magicNumbers);
  const perK = total / (exec / 1000);
  const perKStructural = structuralTotal / (exec / 1000);
  const perKSemantic = semanticTotal / (exec / 1000);
  const toScore = (d) => Math.max(0, Math.min(100, 100 - d * 10));
  return {
    overall: Math.round(toScore(perK)),
    structural: Math.round(toScore(perKStructural)),
    semantic: Math.round(toScore(perKSemantic))
  };
}

function detectIntent(args) {
  if (args && (args.refactoring || args.intent === 'refactoring')) return 'refactoring';
  return 'neutral';
}

function readLatestCommitMessage() {
  try {
    const out = cp.execSync('git --no-pager log -1 --pretty=%B', { encoding: 'utf8' });
    return out || '';
  } catch (_) { return ''; }
}

function shouldBypass(healthCfg) {
  if (String(process.env.HEALTH_BYPASS || '').toLowerCase() === 'true') return true;
  const token = healthCfg && healthCfg.bypass && healthCfg.bypass.commitToken;
  if (token) {
    const msg = readLatestCommitMessage();
    if (msg && msg.includes(token)) return true;
  }
  return false;
}

function compare(base, curr) {
  const fields = ['magicNumbers', 'complexity', 'domainTerms', 'architecture'];
  const deltas = [];
  for (const f of fields) {
    const b = num(base[f]);
    const c = num(curr[f]);
    if (c > b) deltas.push({ key: f, base: b, current: c, type: 'count' });
  }
  // Effort ratchet (optional, do not fail but report increases)
  const effortInc = [];
  for (const f of fields) {
    const b = num(base.effortByCategory && base.effortByCategory[f]);
    const c = num(curr.effortByCategory && curr.effortByCategory[f]);
    if (c > b) effortInc.push({ key: f, base: b, current: c, type: 'effort' });
  }
  return { deltas, effortInc };
}

function main() {
  const args = parseArgs(process.argv);
  const baselinePath = args.baseline || args._[0] || 'analysis-baseline.json';
  const currentPath = args.current || args._[1] || 'analysis-current.json';

  const base = readJson(baselinePath);
  if (!base) {
    console.log(`[ratchet] Baseline not found at ${baselinePath}.\n` +
      'Run: npm run lint:json && npm run analyze:baseline\n' +
      'Skipping ratchet (non-blocking)');
    process.exit(0);
    return;
  }
  const curr = readJson(currentPath);
  if (!curr) {
    console.error(`[ratchet] Current analysis not found at ${currentPath}. Run: npm run lint:json && npm run analyze:current`);
    process.exit(1);
    return;
  }

  const b = summarize(base);
  const c = summarize(curr);
  const { deltas, effortInc } = compare(b, c);

  // Health telemetry + optional gating
  const cfg = loadProjectConfig();
  const healthCfg = (cfg && cfg.ratchet && cfg.ratchet.health) || { enabled: false };
  const scores = computeHealth(c);
  const gateOn = String(healthCfg.gateOn || 'overall').toLowerCase();
  const minOverall = Number(healthCfg.minOverall || 70);
  const intent = detectIntent(args);
  const intentMin = (healthCfg.intentOverrides && healthCfg.intentOverrides[intent] && Number(healthCfg.intentOverrides[intent].minOverall)) || null;
  const threshold = intentMin || minOverall;
  const currentScore = gateOn === 'structural' ? scores.structural : gateOn === 'semantic' ? scores.semantic : scores.overall;
  const failureMessage = healthCfg.failureMessage || 'Code health decreased below threshold.';
  const gateActive = !!healthCfg.enabled && !shouldBypass(healthCfg);
  const gateFail = gateActive && currentScore < threshold;

  if (deltas.length === 0) {
    console.log('[ratchet] OK: no increases in analyzer categories');
    if (effortInc.length) {
      const lines = effortInc.map(d => `  effort.${d.key}: ${d.base}h -> ${d.current}h`);
      console.log('[ratchet] Note: effort increased (informational):\n' + lines.join('\n'));
    }
    // Health telemetry (informational)
    console.log(`[ratchet] Health (informational): overall=${scores.overall} structural=${scores.structural} semantic=${scores.semantic}`);
    if (gateFail) {
      console.error(`[ratchet] HEALTH-GATE FAIL: ${failureMessage}`);
      console.error(`  gateOn=${gateOn} threshold=${threshold} actual=${currentScore} intent=${intent}`);
      process.exit(1);
      return;
    }
    process.exit(0);
    return;
  }

  console.error('[ratchet] FAIL: new violations introduced');
  for (const d of deltas) {
    console.error(`  ${d.key}: ${d.base} -> ${d.current} (+${d.current - d.base})`);
  }
  // Health telemetry (informational) and optional gate
  console.error(`[ratchet] Health (informational): overall=${scores.overall} structural=${scores.structural} semantic=${scores.semantic}`);
  if (gateFail) {
    console.error(`[ratchet] HEALTH-GATE FAIL: ${failureMessage}`);
    console.error(`  gateOn=${gateOn} threshold=${threshold} actual=${currentScore} intent=${intent}`);
  }
  console.error('\nTo inspect:');
  console.error('  - open analysis-current.json');
  console.error('  - compare with analysis-baseline.json');
  console.error('\nIf intentional reductions were made and counts decreased overall, refresh baseline:');
  console.error('  npm run analyze:baseline');
  process.exit(1);
}

main();
