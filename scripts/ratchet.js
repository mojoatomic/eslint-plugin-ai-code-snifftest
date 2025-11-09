#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

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
  } catch {
    return null;
  }
}

function len(x) { return Array.isArray(x) ? x.length : 0; }
function num(x) { return typeof x === 'number' && Number.isFinite(x) ? x : 0; }

// Load optional ratchet config from .ai-coding-guide.json
function loadRatchetConfig() {
  const cfg = readJson('.ai-coding-guide.json');
  const r = (cfg && cfg.ratchet) || {};
  const defaults = {
    mode: 'traditional',
    weights: { complexity: 10, architecture: 8, domainTerms: 2, magicNumbers: 1 },
    critical: ['complexity', 'architecture'],
    minor: ['domainTerms', 'magicNumbers'],
    allowMinorIncreaseDuringRefactor: true
  };
  return {
    mode: String(r.mode || defaults.mode),
    weights: { ...defaults.weights, ...(r.weights || {}) },
    critical: Array.isArray(r.critical) ? r.critical : defaults.critical,
    minor: Array.isArray(r.minor) ? r.minor : defaults.minor,
    allowMinorIncreaseDuringRefactor: r.allowMinorIncreaseDuringRefactor !== undefined ? !!r.allowMinorIncreaseDuringRefactor : defaults.allowMinorIncreaseDuringRefactor
  };
}

function summarize(payload) {
  const cat = payload && payload.categories ? payload.categories : {};
  const effort = payload && payload.effort ? payload.effort : {};
  const byCat = (effort && effort.byCategory) ? effort.byCategory : {};
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
    }
  };
}

function collectFilePaths(payload) {
  const cat = (payload && payload.categories) || {};
  const sets = [cat.magicNumbers, cat.complexity, cat.domainTerms, cat.architecture].filter(Array.isArray);
  const files = new Set();
  for (const list of sets) {
    for (const rec of list) {
      if (rec && rec.filePath) files.add(rec.filePath);
    }
  }
  return files;
}

function countLines(p) {
  try {
    const s = fs.readFileSync(path.isAbsolute(p) ? p : path.join(process.cwd(), p), 'utf8');
    return s.split(/\r?\n/).length;
  } catch {
    return 0;
  }
}

function computeDensity(summary, payload) {
  const files = collectFilePaths(payload);
  let loc = 0;
  for (const f of files) loc += countLines(f);
  const total = num(summary.magicNumbers) + num(summary.domainTerms) + num(summary.architecture) + num(summary.complexity);
  const perK = loc > 0 ? (total / loc) * 1000 : 0;
  return { loc, total, perK };
}

function computeWeightedScore(summary, weights) {
  const w = weights || {};
  return (
    (num(summary.complexity) * (w.complexity || 0)) +
    (num(summary.architecture) * (w.architecture || 0)) +
    (num(summary.domainTerms) * (w.domainTerms || 0)) +
    (num(summary.magicNumbers) * (w.magicNumbers || 0))
  );
}

function compareCounts(base, curr) {
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

function formatDelta(label, a, b) {
  const da = num(a) || 0; const db = num(b) || 0;
  if (da === db) return `  ${label}: ${da} -> ${db}`;
  const sign = db > da ? '+' : '';
  return `  ${label}: ${da} -> ${db} (${sign}${db - da})`;
}

function countRule(payload, category, needle) {
  try {
    const list = (payload && payload.categories && Array.isArray(payload.categories[category])) ? payload.categories[category] : [];
    const n = String(needle).toLowerCase();
    return list.reduce((acc, rec) => acc + (String(rec.ruleId || '').toLowerCase().includes(n) ? 1 : 0), 0);
  } catch {
    return 0;
  }
}

function structuralBreakdown(payload) {
  return {
    complexity: {
      complexity: countRule(payload, 'complexity', 'complexity'),
      'prefer-simpler-logic': countRule(payload, 'complexity', 'prefer-simpler-logic'),
      'no-redundant-conditionals': countRule(payload, 'complexity', 'no-redundant-conditionals'),
      'no-equivalent-branches': countRule(payload, 'complexity', 'no-equivalent-branches')
    },
    architecture: {
      'max-lines-per-function': countRule(payload, 'architecture', 'max-lines-per-function'),
      'max-lines': countRule(payload, 'architecture', 'max-lines'),
      'max-depth': countRule(payload, 'architecture', 'max-depth'),
      'max-statements': countRule(payload, 'architecture', 'max-statements'),
      'max-params': countRule(payload, 'architecture', 'max-params')
    }
  };
}

function analyzeIntent({ b, c, baseDensity, currDensity, weightedBase, weightedCurr }) {
  const critBase = num(b.complexity) + num(b.architecture);
  const critCurr = num(c.complexity) + num(c.architecture);
  const minorBase = num(b.domainTerms) + num(b.magicNumbers);
  const minorCurr = num(c.domainTerms) + num(c.magicNumbers);
  const signals = {
    criticalDown: critCurr < critBase,
    weightedDown: weightedCurr <= weightedBase,
    densityDown: currDensity.perK <= baseDensity.perK,
    minorUp: minorCurr > minorBase
  };
  let confidence = 0;
  if (signals.criticalDown) confidence += 0.4;
  if (signals.weightedDown) confidence += 0.3;
  if (signals.densityDown) confidence += 0.2;
  if (signals.minorUp) confidence += 0.1;

  let type = 'neutral';
  if (signals.criticalDown && (signals.weightedDown || signals.densityDown)) type = 'refactoring';
  if (!signals.criticalDown && !signals.weightedDown && !signals.densityDown && signals.minorUp) type = 'ai-generation-suspect';

  return { type, confidence: Math.max(0, Math.min(1, confidence)), signals, critBase, critCurr };
}

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function invNorm(value, cap) { if (!Number.isFinite(value) || value <= 0) return 1; if (!Number.isFinite(cap) || cap <= 0) return 0; return clamp01(1 - (value / cap)); }

function computeHealthScore({ baseRaw, currRaw, baseSummary, currSummary, baseDensity, currDensity }) {
  const loc = Math.max(baseDensity.loc || 0, currDensity.loc || 0, 1);
  const baseBD = structuralBreakdown(baseRaw);
  const currBD = structuralBreakdown(currRaw);

  const critBase = (baseSummary.complexity + baseSummary.architecture) / loc * 1000;
  const critCurr = (currSummary.complexity + currSummary.architecture) / loc * 1000;
  const minorBase = (baseSummary.domainTerms + baseSummary.magicNumbers) / loc * 1000;
  const minorCurr = (currSummary.domainTerms + currSummary.magicNumbers) / loc * 1000;

  const archKeys = ['max-lines-per-function','max-depth','max-statements'];
  const archBasePerK = archKeys.map(k => (baseBD.architecture[k] / loc) * 1000);
  const archCurrPerK = archKeys.map(k => (currBD.architecture[k] / loc) * 1000);

  const structuralScore = Math.round(100 * invNorm(critCurr, 50));
  const semanticScore = Math.round(100 * invNorm(minorCurr, 30));
  const maintainabilityScore = Math.round(100 * (archCurrPerK.map(v => invNorm(v, 20)).reduce((a,b)=>a+b,0) / archCurrPerK.length));
  const styleTotal = (currSummary.counts.errors || 0) + (currSummary.counts.warnings || 0);
  const styleScore = styleTotal > 0 ? Math.round(100 * (1 - ((currSummary.counts.errors || 0) / styleTotal))) : 100;
  const overall = Math.round(structuralScore*0.4 + semanticScore*0.3 + maintainabilityScore*0.2 + styleScore*0.1);

  const baseStructural = Math.round(100 * invNorm(critBase, 50));
  const baseSemantic = Math.round(100 * invNorm(minorBase, 30));
  const baseMaintainability = Math.round(100 * (archBasePerK.map(v => invNorm(v, 20)).reduce((a,b)=>a+b,0) / archBasePerK.length));
  const baseStyleTotal = (baseSummary.counts.errors || 0) + (baseSummary.counts.warnings || 0);
  const baseStyle = baseStyleTotal > 0 ? Math.round(100 * (1 - ((baseSummary.counts.errors || 0) / baseStyleTotal))) : 100;
  const baseOverall = Math.round(baseStructural*0.4 + baseSemantic*0.3 + baseMaintainability*0.2 + baseStyle*0.1);

  return { current:{ overall, structural: structuralScore, semantic: semanticScore, maintainability: maintainabilityScore, style: styleScore }, baseline:{ overall: baseOverall, structural: baseStructural, semantic: baseSemantic, maintainability: baseMaintainability, style: baseStyle } };
}

function traditionalMode({ b, c, effortInc }) {
  const { deltas } = compareCounts(b, c);
  if (deltas.length === 0) {
    console.log('[ratchet] OK: no increases in analyzer categories');
    if (effortInc && effortInc.length) {
      const lines = effortInc.map(d => `  effort.${d.key}: ${d.base}h -> ${d.current}h`);
      console.log('[ratchet] Note: effort increased (informational):\n' + lines.join('\n'));
    }
    return 0;
  }
  console.error('[ratchet] FAIL: new violations introduced');
  for (const d of deltas) console.error(`  ${d.key}: ${d.base} -> ${d.current} (+${d.current - d.base})`);
  console.error('\nTo inspect:');
  console.error('  - open analysis-current.json');
  console.error('  - compare with analysis-baseline.json');
  console.error('\nIf intentional reductions were made and counts decreased overall, refresh baseline:');
  console.error('  npm run analyze:baseline');
  return 1;
}

function contextAwareMode({ b, c, baseRaw, currRaw, cfg, refactoring }) {
  const weightedBase = computeWeightedScore(b, cfg.weights);
  const weightedCurr = computeWeightedScore(c, cfg.weights);
  const baseDensity = computeDensity(b, baseRaw);
  const currDensity = computeDensity(c, currRaw);
  const intent = analyzeIntent({ b, c, baseDensity, currDensity, weightedBase, weightedCurr });
  const critInc = intent.critCurr > intent.critBase;
  const health = computeHealthScore({ baseRaw, currRaw, baseSummary: b, currSummary: c, baseDensity, currDensity });

  const lines = [];
  lines.push('[ratchet] Context-aware summary');
  lines.push(`  critical: ${cfg.critical.join(', ')}`);
  lines.push(`  weighted: ${weightedBase.toFixed(2)} -> ${weightedCurr.toFixed(2)} (${(weightedCurr - weightedBase).toFixed(2)})`);
  lines.push(`  density: ${baseDensity.perK.toFixed(3)} -> ${currDensity.perK.toFixed(3)} per 1k LOC`);
  lines.push(`  intent: ${intent.type} (${Math.round(intent.confidence * 100)}%)`);
  lines.push(`    signals: criticalDown=${intent.signals.criticalDown}, weightedDown=${intent.signals.weightedDown}, densityDown=${intent.signals.densityDown}, minorUp=${intent.signals.minorUp}`);
  lines.push(`  health: ${health.baseline.overall} -> ${health.current.overall} (${health.current.overall - health.baseline.overall >= 0 ? '+' : ''}${health.current.overall - health.baseline.overall})`);
  lines.push(`    structural: ${health.baseline.structural} -> ${health.current.structural}`);
  lines.push(`    semantic: ${health.baseline.semantic} -> ${health.current.semantic}`);
  lines.push(`    maintainability: ${health.baseline.maintainability} -> ${health.current.maintainability}`);
  lines.push(`    style: ${health.baseline.style} -> ${health.current.style}`);

  const baseBD = structuralBreakdown(baseRaw);
  const currBD = structuralBreakdown(currRaw);
  lines.push('  complexity breakdown:');
  for (const k of Object.keys(baseBD.complexity)) lines.push(formatDelta(`    ${k}`, baseBD.complexity[k], currBD.complexity[k]));
  lines.push('  architecture breakdown:');
  for (const k of Object.keys(baseBD.architecture)) lines.push(formatDelta(`    ${k}`, baseBD.architecture[k], currBD.architecture[k]));

  if (critInc) {
    console.error(lines.join('\n'));
    console.error('[ratchet] FAIL: critical category increased');
    for (const cat of cfg.critical) if (num(c[cat]) > num(b[cat])) console.error(`  ${cat}: ${b[cat]} -> ${c[cat]} (+${c[cat] - b[cat]})`);
    return 1;
  }

  if (weightedCurr > weightedBase) {
    if (refactoring && cfg.allowMinorIncreaseDuringRefactor) {
      console.log(lines.join('\n'));
      console.log('[ratchet] OK (refactoring mode): minor increases allowed with no critical regressions');
      return 0;
    }
    console.error(lines.join('\n'));
    console.error('[ratchet] FAIL: weighted score increased');
    return 1;
  }

  if (currDensity.perK > baseDensity.perK) {
    if (refactoring && cfg.allowMinorIncreaseDuringRefactor) {
      console.log(lines.join('\n'));
      console.log('[ratchet] OK: density increased during refactor (warning only)');
      return 0;
    }
    console.log(lines.join('\n'));
    console.log('[ratchet] WARN: violation density increased');
    return 0;
  }

  console.log(lines.join('\n'));
  console.log('[ratchet] OK: no critical increases and weighted score did not increase');
  return 0;
}

function main() {
  const args = parseArgs(process.argv);
  const baselinePath = args.baseline || args._[0] || 'analysis-baseline.json';
  const currentPath = args.current || args._[1] || 'analysis-current.json';
  const mode = String(args.mode || '').toLowerCase() || null; // 'traditional' | 'context'
  const refactoring = String(args.refactoring || 'false').toLowerCase() === 'true';

  const baseRaw = readJson(baselinePath);
  if (!baseRaw) {
    console.log(`[ratchet] Baseline not found at ${baselinePath}.\n` +
      'Run: npm run lint:json && npm run analyze:baseline\n' +
      'Skipping ratchet (non-blocking)');
    process.exit(0);
    return;
  }
  const currRaw = readJson(currentPath);
  if (!currRaw) {
    console.error(`[ratchet] Current analysis not found at ${currentPath}. Run: npm run lint:json && npm run analyze:current`);
    process.exit(1);
    return;
  }

  const b = summarize(baseRaw);
  const c = summarize(currRaw);

  const cfg = loadRatchetConfig();
  const effectiveMode = mode || (cfg.mode === 'context-aware' ? 'context' : 'traditional');

  if (effectiveMode === 'context') {
    const code = contextAwareMode({ b, c, baseRaw, currRaw, cfg, refactoring });
    process.exit(code);
    return;
  }

  const { effortInc } = compareCounts(b, c);
  const code = traditionalMode({ b, c, effortInc });
  process.exit(code);
}

main();
