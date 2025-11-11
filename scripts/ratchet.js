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

// Health scoring moved to utility for testability
const { computeHealth } = require(path.join(__dirname, '..', 'lib', 'utils', 'health.js'));

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
  const effortInc = [];
  for (const f of fields) {
    const b = num(base.effortByCategory && base.effortByCategory[f]);
    const c = num(curr.effortByCategory && curr.effortByCategory[f]);
    if (c > b) effortInc.push({ key: f, base: b, current: c, type: 'effort' });
  }
  return { deltas, effortInc };
}

function detectIntentFromMetrics(base, curr) {
  const totalDelta = (curr.magicNumbers - base.magicNumbers) +
                     (curr.complexity - base.complexity) +
                     (curr.domainTerms - base.domainTerms) +
                     (curr.architecture - base.architecture);

  let intent = 'neutral';
  let confidence = 0.5;
  const signals = [];

  if (totalDelta < -10) {
    intent = 'cleanup';
    confidence = 0.7;
    signals.push('Violations decreased significantly');
  } else if (totalDelta > 20 && curr.domainTerms > base.domainTerms * 1.3) {
    intent = 'ai-generation-suspect';
    confidence = 0.6;
    signals.push('Large increase in domain term violations');
    signals.push('Rapid violation growth pattern');
  } else if (curr.complexity < base.complexity * 0.8 && curr.architecture < base.architecture * 0.8) {
    intent = 'refactoring';
    confidence = 0.65;
    signals.push('Complexity decreased');
    signals.push('Architecture violations decreased');
  }

  return { intent, confidence, signals };
}

function formatExamples(messages, ruleId, max = 3) {
  const out = [];
  for (const m of messages || []) {
    if (ruleId && m.ruleId !== ruleId) continue;
    if (!m.ruleId) continue;
    const hasLine = (m.line !== null && m.line !== undefined);
    const loc = hasLine ? `${m.line}:${m.column || 1}` : '';
    out.push(`  • ${m.filePath || m.filename || 'file'}:${loc} – ${m.message}`);
    if (out.length >= max) break;
  }
  return out.join('\n');
}

function runContextMode(base, curr) {
  console.log('\n📊 Context-Aware Telemetry');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Mode: Non-blocking (burn-in period)\n');

  console.log('Category Counts:');
  const categories = [
    { key: 'magicNumbers', label: 'Magic Numbers' },
    { key: 'complexity', label: 'Complexity' },
    { key: 'domainTerms', label: 'Domain Terms' },
    { key: 'architecture', label: 'Architecture' }
  ];

  for (const cat of categories) {
    const baseVal = base[cat.key];
    const currVal = curr[cat.key];
    const delta = currVal - baseVal;
    const emoji = delta > 0 ? '⚠️' : (delta < 0 ? '✅' : '➖');
    const sign = delta > 0 ? '+' : '';
    console.log(`  ${cat.label.padEnd(15)} ${baseVal} → ${currVal} (${sign}${delta}) ${emoji}`);
  }

  console.log();

const { intent, confidence, signals } = detectIntentFromMetrics(base, curr);

  console.log('Intent Detection:');
  console.log(`  Detected: ${intent}`);
  console.log(`  Confidence: ${(confidence * 100).toFixed(0)}%`);
  if (signals.length > 0) {
    console.log('  Signals:');
    signals.forEach(s => console.log(`    • ${s}`));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Telemetry complete (non-blocking)\n');
}

function runTraditionalMode(base, curr, args) {
  // Optional lint file for better failure messaging
  let lintMessages = null;
  try {
    const lintPath = args.lint || args.lintCurrent || process.env.AI_SNIFFTEST_LINT_CURRENT;
    if (lintPath && fs.existsSync(lintPath)) {
      const raw = readJson(lintPath);
      if (Array.isArray(raw)) {
        lintMessages = [];
        for (const f of raw) {
          const filePath = f.filePath || f.filename;
          for (const m of (f.messages || [])) lintMessages.push({ ...m, filePath });
        }
      }
    }
  } catch (_) { /* ignore */ }
  const { deltas, effortInc } = compare(base, curr);

  // Health telemetry + optional gating
  const cfg = loadProjectConfig();
  const healthCfg = (cfg && cfg.ratchet && cfg.ratchet.health) || { enabled: false };
  const scores = computeHealth(curr);
  const gateOn = String(healthCfg.gateOn || 'overall').toLowerCase();
  const minOverall = Number(healthCfg.minOverall || 70);
  const intent = detectIntent(args);
  const intentMin = (healthCfg.intentOverrides && healthCfg.intentOverrides[intent] && Number(healthCfg.intentOverrides[intent].minOverall)) || null;
  const threshold = intentMin || minOverall;
  const currentScore = gateOn === 'structural' ? scores.structural : gateOn === 'semantic' ? scores.semantic : scores.overall;
  const failureMessage = healthCfg.failureMessage || 'Code health decreased below threshold.';
  const gateActive = !!healthCfg.enabled && !shouldBypass(healthCfg);
  const gateFail = gateActive && currentScore < threshold;

  const strategy = (cfg && cfg.ratchet && cfg.ratchet.strategy) || 'classic';

  // Hybrid strategy: density-based for critical vs minor categories (per 1K LOC)
  if (strategy === 'hybrid') {
    const hybridCfg = (cfg && cfg.ratchet && cfg.ratchet.hybrid) || {};
    const critical = Array.isArray(hybridCfg.critical) && hybridCfg.critical.length ? hybridCfg.critical : ['complexity', 'architecture'];
    const minor = Array.isArray(hybridCfg.minor) && hybridCfg.minor.length ? hybridCfg.minor : ['domainTerms', 'magicNumbers'];
    const tol = (hybridCfg.tolerance) || {};
    const critTol = Number(tol.criticalDensity || 1.05); // allow 5% increase
    const minorTol = Number(tol.minorDensity || 1.20);    // allow 20% increase

    const baseLoc = Math.max(1, Number(base.lines && base.lines.executable) || Number(base.lines && base.lines.physical) || 1);
    const currLoc = Math.max(1, Number(curr.lines && curr.lines.executable) || Number(curr.lines && curr.lines.physical) || 1);
    const perK = (count, loc) => (count / (loc / 1000));

    let failed = false;

    console.log('\n[ratchet] Hybrid density check (per 1K LOC)');
    console.log(`LOC: ${baseLoc} → ${currLoc} (${currLoc - baseLoc >= 0 ? '+' : ''}${currLoc - baseLoc})`);

    console.log('\nCritical (strict):');
    for (const cat of critical) {
      const b = Number(base[cat]) || 0;
      const c = Number(curr[cat]) || 0;
      const bd = perK(b, baseLoc);
      const cd = perK(c, currLoc);
      const ratio = bd === 0 ? (cd === 0 ? 1 : Infinity) : (cd / bd);
      const status = ratio > critTol ? '❌' : '✅';
      console.log(`  ${String(cat).padEnd(15)} ${b} → ${c} (density: ${bd.toFixed(2)} → ${cd.toFixed(2)}) ${status}`);
      if (ratio > critTol) failed = true;
    }

    console.log('\nMinor (relaxed):');
    for (const cat of minor) {
      const b = Number(base[cat]) || 0;
      const c = Number(curr[cat]) || 0;
      const bd = perK(b, baseLoc);
      const cd = perK(c, currLoc);
      const ratio = bd === 0 ? (cd === 0 ? 1 : Infinity) : (cd / bd);
      const status = ratio > minorTol ? '⚠️' : '✅';
      console.log(`  ${String(cat).padEnd(15)} ${b} → ${c} (density: ${bd.toFixed(2)} → ${cd.toFixed(2)}) ${status}`);
    }

    // Health telemetry (informational)
    console.log(`\n[ratchet] Health (informational): overall=${scores.overall} structural=${scores.structural} semantic=${scores.semantic}`);

    if (gateFail) {
      console.error(`[ratchet] HEALTH-GATE FAIL: ${failureMessage}`);
      console.error(`  gateOn=${gateOn} threshold=${threshold} actual=${currentScore} intent=${intent}`);
      return 1;
    }

    if (failed) {
      console.error('\n❌ [ratchet] FAIL: Critical violation density increased');
      console.error('Complexity and architecture are strictly controlled.');
      console.error('Refactor to reduce complexity or update baseline if intentional.');
      return 1;
    }

    console.log('\n✅ [ratchet] PASS: Quality maintained or improved');
    return 0;
  }

  // Classic strategy with tolerance band
  // Tolerance band (configurable) to avoid blocking normal fluctuation
  const tolCfg = (cfg && cfg.ratchet && cfg.ratchet.tolerance) || {};
  const totalTolerance = Number(tolCfg.total || 0);

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
      return 1;
    }
    return 0;
  }

  // If within tolerance, allow pass with notice
  const totalIncrease = deltas.reduce((sum, d) => sum + (d.current - d.base), 0);
  if (totalIncrease <= totalTolerance) {
    console.log(`[ratchet] OK: within tolerance (+${totalIncrease} violations, tolerance: ${totalTolerance})`);
    for (const d of deltas) {
      console.log(`  ${d.key}: ${d.base} → ${d.current} (+${d.current - d.base})`);
    }
    console.log('\nSmall increases accepted during active development.');
    // Health telemetry (informational) and optional gate still apply
    console.log(`[ratchet] Health (informational): overall=${scores.overall} structural=${scores.structural} semantic=${scores.semantic}`);
    if (gateFail) {
      console.error(`[ratchet] HEALTH-GATE FAIL: ${failureMessage}`);
      console.error(`  gateOn=${gateOn} threshold=${threshold} actual=${currentScore} intent=${intent}`);
      return 1;
    }
    return 0;
  }

console.error('[ratchet] FAIL: new violations introduced');
  const ruleMap = {
    magicNumbers: 'ai-code-snifftest/no-redundant-calculations',
    complexity: null,
    domainTerms: null,
    architecture: null,
    eqeqeq: 'eqeqeq',
    camelcase: 'camelcase',
    empty: 'no-empty'
  };
for (const d of deltas) {
    console.error(`  ${d.key}: ${d.base} -> ${d.current} (+${d.current - d.base})`);
    try {
      const ruleId = ruleMap[d.key];
      if (lintMessages && ruleId) {
        const ex = formatExamples(lintMessages, ruleId, 3);
        if (ex) {
          console.error('  New occurrences:');
          console.error(ex);
        }
      }
    } catch (_) { /* ignore */ }
  }
  console.error('\n💡 To fix: address new violations, or if intentional, unlock this check:');
  console.error('   npm run ratchet -- --unlock=<rule>');
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
  return 1;
}

function main() {
  const args = parseArgs(process.argv);
  const mode = args.mode || 'traditional';
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

  if (mode === 'context') {
    runContextMode(b, c);
    process.exit(0);
    return;
  }

const exitCode = runTraditionalMode(b, c, args);
  process.exit(exitCode);
}

main();
